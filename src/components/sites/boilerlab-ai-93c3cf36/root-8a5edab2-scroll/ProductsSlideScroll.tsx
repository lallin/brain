"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { PRODUCTS } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/products-data";
import { ProductBoxCarousel } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ProductBoxCarousel";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// How much of the section's total scroll budget (in vh) is spent
// transitioning from one product card to the next, on top of each card's
// own image-count-proportional "dwell" time.
const TRANSITION_VH = 70;

interface ProductCardProps {
  product: (typeof PRODUCTS)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
  masterProgress: MotionValue<number>;
  start: number;
  end: number;
  totalVh: number;
}

/**
 * One product's whole card, absolutely centered in the shared stack — the
 * same `translate3d(-50%, calc(-50% + Nvh), 0) scale(S)` + `--card-dim`/
 * `--card-blur` model the live site uses (see BEHAVIORS.md's "Products
 * slide — internal card stack" and the classic deck's already-verified
 * `slides/ProductsSlide.tsx`), just driven by `masterProgress` (continuous
 * scroll position) instead of a discrete wheel-stepped `progress` state.
 * Cards move **vertically** — the live site has no horizontal card-to-card
 * motion at all; only this card's own image gallery (via ProductBoxCarousel,
 * a deliberate addition not on the live site — see product-gallery.css)
 * slides horizontally, and only within the card's own bounds.
 */
function ProductCard({ product, index, scrollYProgress, masterProgress, start, end, totalVh }: ProductCardProps) {
  const boxCount = product.boxes.length;
  const galleryProgress = useTransform(scrollYProgress, [start, end], [0, Math.max(boxCount - 1, 0)]);
  const [boxIndex, setBoxIndex] = useState(0);
  useMotionValueEvent(galleryProgress, "change", (v) => setBoxIndex(Math.round(clamp(v, 0, boxCount - 1))));

  const cardOffset = useTransform(masterProgress, (p) => index - p);
  const [focused, setFocused] = useState(index === 0);
  useMotionValueEvent(cardOffset, "change", (o) => setFocused(Math.abs(o) < 0.5));

  const transform = useTransform(cardOffset, (o) => {
    const abs = Math.abs(o);
    const vh = clamp(o * 60, -122, 122);
    const scale = Math.max(0.86, 1 - Math.min(abs, 2) * 0.07);
    return `translate3d(-50%, calc(-50% + ${vh}vh), 0) scale(${scale})`;
  });
  const opacity = useTransform(cardOffset, (o) => clamp(1 - Math.abs(o) * 0.85, 0, 1));
  const dim = useTransform(cardOffset, (o) => clamp(Math.abs(o) * 0.8, 0, 0.85));
  const blur = useTransform(cardOffset, (o) => `${clamp(Math.abs(o) * 3, 0, 10)}px`);
  const pointerEvents = useTransform(cardOffset, (o) =>
    Math.abs(o) < 2.2 ? (Math.abs(o) < 0.5 ? "auto" : "none") : "none",
  );
  const visibility = useTransform(cardOffset, (o) => (Math.abs(o) < 2.2 ? "visible" : "hidden"));

  // Arrow-click box navigation (the box carousel is a click-or-scroll
  // affordance): since progress here comes from real page scroll, not a
  // local index, nudge the page by this card's own per-image scroll slice
  // instead of setting local state directly — the next scroll-driven
  // sample of `galleryProgress` picks up the new position on its own.
  function goToBox(next: number) {
    const len = boxCount;
    if (len < 2) return;
    const wrapped = ((next % len) + len) % len;
    const perImageVh = ((end - start) * totalVh) / (len - 1);
    const deltaVh = (wrapped - boxIndex) * perImageVh;
    const pxPerVh = window.innerHeight / 100;
    window.scrollBy({ top: deltaVh * pxPerVh, behavior: "smooth" });
  }

  return (
    <motion.article
      id={product.id}
      className="product-card"
      aria-labelledby={`${product.id}-${boxIndex}-title`}
      aria-hidden={!focused}
      style={{
        transform,
        opacity,
        ["--card-dim" as string]: dim,
        ["--card-blur" as string]: blur,
        pointerEvents,
        visibility,
      }}
    >
      <ProductBoxCarousel product={product} focused={focused} index={boxIndex} onGoTo={goToBox} />
    </motion.article>
  );
}

/**
 * Products section: one continuous, shared scroll region spanning all
 * products (not N independent pinned blocks) so `masterProgress` can be a
 * single continuous "which card" float — see ProductCard for how that
 * drives the live site's vertical card-stack model.
 */
export function ProductsSlideScroll() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });

  const { bounds, totalVh } = useMemo(() => {
    const dwellVh = PRODUCTS.map((p) => Math.max(1.5, p.boxes.length) * 100);
    const total = dwellVh.reduce((a, b) => a + b, 0) + (PRODUCTS.length - 1) * TRANSITION_VH;
    // Raw vh cursors first (kept separate from the fractional `start`/`end`
    // below), so each step reads the previous *vh* position rather than
    // mixing vh with an already-divided fraction.
    const cursorsVh = dwellVh.reduce<number[]>((acc, d, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + dwellVh[i - 1] + TRANSITION_VH);
      return acc;
    }, []);
    const b = cursorsVh.map((cursor, i) => ({ start: cursor / total, end: (cursor + dwellVh[i]) / total }));
    return { bounds: b, totalVh: total };
  }, []);

  // Flat at index `i` for [start_i, end_i], ramping i → i+1 across
  // [end_i, start_{i+1}] — built once from `bounds` since PRODUCTS is
  // static.
  const masterProgress = useTransform(
    scrollYProgress,
    bounds.flatMap((b) => [b.start, b.end]),
    bounds.map((_, i) => [i, i]).flat(),
  );

  return (
    <div ref={outerRef} className="relative product-scroll-outer" style={{ height: `${totalVh}vh` }}>
      <div
        className="slide-inner product-content"
        style={{ position: "sticky", top: 0, height: "100dvh", overflow: "hidden" }}
      >
        {PRODUCTS.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            scrollYProgress={scrollYProgress}
            masterProgress={masterProgress}
            start={bounds[i].start}
            end={bounds[i].end}
            totalVh={totalVh}
          />
        ))}
      </div>
      {/* Safety-net snap markers, one per product at its own dwell start —
          same role as NumbersAirSlideScroll's/NumbersIntroUsersScroll's own
          markers: bounds a mistimed mandatory-snap (before `.snap-paused`
          catches up) to the nearest product's own start instead of all the
          way out to #numbers-air or #partners. */}
      {bounds.map((b, i) => (
        <span
          key={PRODUCTS[i].id}
          aria-hidden="true"
          className="product-scroll-marker"
          style={{ position: "absolute", top: `${b.start * totalVh}vh` }}
        />
      ))}
    </div>
  );
}
