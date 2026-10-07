"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Cpu, Heart, Music, Ticket, type LucideIcon } from "lucide-react";
import { PRODUCTS } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/products-data";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { DraggableBox } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/DraggableBox";
import { getCategoryHubByProductId } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import type { ProductIconName } from "@/types/boilerlab";
import { FerrisSphere } from "./FerrisSphere";
import { ferrisSphereHandoff, HANDOFF_VH, measureFerrisHandoff, type FerrisHandoffRange } from "./ferris-handoff";

/**
 * Products section as a scroll-driven "Side Ferris Wheel, Landscape Cards"
 * (study 05 of dessert-motion-studies.html): all 9 sub-solution boxes sit
 * on one vertical wheel arc, and the section's accent color crossfades
 * whenever the active card crosses into a different category ("part").
 */

// Per-category colors — `accent` tints the background wash + card tile,
// `glaze` is the brighter highlight (icon, active dot, headline em).
const PART_COLORS: Record<string, { accent: string; glaze: string }> = {
  sigma: { accent: "#5a3f12", glaze: "#e0a948" },
  "atomic-mail": { accent: "#5a1638", glaze: "#c24a86" },
  aimlapi: { accent: "#0f4a40", glaze: "#3fbf9f" },
  atomicbot: { accent: "#15285e", glaze: "#5a86ec" },
};

const ICONS: Record<ProductIconName, LucideIcon> = { Music, Heart, Cpu, Ticket };

// Scroll budget per card (flat "dwell") and per card-to-card rotation.
const DWELL_VH = 60;
const TRANSITION_VH = 55;
// The sphere's visible radius as a share of its box (glass rim included;
// measured 0.38 at 1905×911), and the clear gap the copy keeps from it.
const SPHERE_VISIBLE_RADIUS = 0.4;
const COPY_SPHERE_GAP = 32;

interface FerrisCard {
  key: string;
  productId: string;
  partIndex: number;
  boxIndex: number;
  partName: string;
  icon: ProductIconName;
  image: string;
  name: string;
  headline: string;
  description: string;
  href: string;
  accent: string;
  glaze: string;
}

const CARDS: FerrisCard[] = PRODUCTS.flatMap((product, partIndex) => {
  const colors = PART_COLORS[product.id] ?? PART_COLORS.sigma;
  const hubHref = `/solutions/category/${getCategoryHubByProductId(product.id)?.slug ?? ""}`;
  return product.boxes.map((box, boxIndex) => ({
    key: `${product.id}-${boxIndex}`,
    productId: product.id,
    partIndex,
    boxIndex,
    partName: product.name,
    icon: product.icon,
    image: box.image,
    name: box.name,
    headline: box.headline,
    description: box.description,
    href: box.slug ? `/solutions/${box.slug}` : hubHref,
    ...colors,
  }));
});

const N = CARDS.length;

/** The sphere's color on entering (first card) and leaving (last card) —
 * SharedMoon morphs to/from these at the section's edges. */
export const FERRIS_ENTRY_GLAZE = CARDS[0].glaze;
export const FERRIS_EXIT_GLAZE = CARDS[N - 1].glaze;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Study 02/05's side-Ferris formula, fed a continuous offset `d`
 * (0 = centered) so it scrubs with scroll instead of stepping. */
const round2 = (v: number) => Math.round(v * 100) / 100;

function layoutSideFerris(d: number, radius: number) {
  const angle = (d * 30 * Math.PI) / 180;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: round2(-(1 - c) * radius * 0.5),
    y: round2(s * radius),
    rot: round2(d * 9),
    scale: round2(Math.max(0.4, 0.5 + 0.5 * c)),
    blur: round2((1 - c) * 6.5),
    z: Math.round(c * 100),
  };
}

interface WheelCardProps {
  card: FerrisCard;
  index: number;
  progress: MotionValue<number>;
  radius: number;
  active: boolean;
  onSelect: (index: number) => void;
}

function WheelCard({ card, index, progress, radius, active, onSelect }: WheelCardProps) {
  const offset = useTransform(progress, (p) => index - p);
  const transform = useTransform(offset, (d) => {
    const L = layoutSideFerris(d, radius);
    return `translate3d(${L.x}px, ${L.y}px, 0) rotate(${L.rot}deg) scale(${L.scale})`;
  });
  const filter = useTransform(offset, (d) => {
    const blur = layoutSideFerris(d, radius).blur;
    return blur > 0.05 ? `blur(${blur}px)` : "none";
  });
  const zIndex = useTransform(offset, (d) => layoutSideFerris(d, radius).z);
  // Past a quarter turn the card is behind the wheel — fade it out.
  const opacity = useTransform(offset, (d) => clamp(3.4 - Math.abs(d), 0, 1));
  const visibility = useTransform(offset, (d) => (Math.abs(d) < 3.4 ? "visible" : "hidden"));

  return (
    <motion.button
      type="button"
      className={`ferris-card${active ? " is-active" : ""}`}
      style={{
        transform,
        filter,
        zIndex,
        opacity,
        visibility,
        ["--tile-accent" as string]: card.accent,
        ["--tile-glaze" as string]: card.glaze,
      }}
      onClick={() => onSelect(index)}
      tabIndex={-1}
      aria-hidden={!active}
      aria-label={card.name}
    >
      <span className="ferris-tile">
        <Image src={card.image} alt="" fill sizes="(width <= 820px) 70vw, 460px" className="ferris-tile-image" />
      </span>
    </motion.button>
  );
}

export function ProductsFerrisScroll() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [radius, setRadius] = useState(300);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });

  const { bounds, totalVh } = useMemo(() => {
    const total = N * DWELL_VH + (N - 1) * TRANSITION_VH;
    const b = CARDS.map((_, i) => {
      const startVh = i * (DWELL_VH + TRANSITION_VH);
      return { start: startVh / total, end: (startVh + DWELL_VH) / total };
    });
    return { bounds: b, totalVh: total };
  }, []);

  // Flat on each card's dwell, ramping i → i+1 between dwells.
  const progress = useTransform(
    scrollYProgress,
    bounds.flatMap((b) => [b.start, b.end]),
    bounds.flatMap((_, i) => [i, i]),
  );
  useMotionValueEvent(progress, "change", (p) => setActiveIndex(clamp(Math.round(p), 0, N - 1)));

  // Color only moves while crossing into a new part: within a part every
  // card shares the same stop, so the interpolation is flat there.
  const indices = CARDS.map((_, i) => i);
  const accent = useTransform(progress, indices, CARDS.map((c) => c.accent));
  const glaze = useTransform(progress, indices, CARDS.map((c) => c.glaze));

  // Wheel radius tracks the rendered card width (reference: R 235 for a 320px card).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const card = stage.querySelector<HTMLElement>(".ferris-card");
      if (card) setRadius(card.offsetWidth * 0.74);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Room the copy has left of the sphere (desktop): from the copy's own left
  // edge to the sphere's visible left edge, minus a gap. The sphere sits at a
  // vw/vh position plus a saved drag offset (px), so it's measured, not
  // derived in CSS. Horizontal only, so the scroll position doesn't matter.
  // Written as --ferris-copy-room; the CSS caps the headline / description
  // at it so they wrap before the sphere instead of running onto it.
  useEffect(() => {
    const root = outerRef.current;
    if (!root) return;
    const measure = () => {
      const info = root.querySelector<HTMLElement>(".ferris-info");
      const sphere = root.querySelector<HTMLElement>(".ferris-sphere");
      if (!info || !sphere) return;
      const s = sphere.getBoundingClientRect();
      const i = info.getBoundingClientRect();
      if (s.width <= 0) return;
      const edge = s.left + s.width * (0.5 - SPHERE_VISIBLE_RADIUS);
      const room = Math.max(0, Math.round(edge - i.left - COPY_SPHERE_GAP));
      info.style.setProperty("--ferris-copy-room", `${room}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    // The copy / sphere can be dragged (saved on pointerup).
    window.addEventListener("pointerup", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointerup", measure);
    };
  }, []);

  function scrollToCard(i: number) {
    const outer = outerRef.current;
    if (!outer) return;
    const target = clamp(i, 0, N - 1);
    const outerTop = outer.getBoundingClientRect().top + window.scrollY;
    const scrollable = outer.offsetHeight - window.innerHeight;
    window.scrollTo({ top: outerTop + bounds[target].start * scrollable + 2, behavior: "smooth" });
  }

  // FerrisSphere's share of the SharedMoon handoff (see ferris-handoff.ts),
  // on the raw window scroll like SharedMoon's own scrub.
  const { scrollY } = useScroll();
  const handoffRef = useRef<FerrisHandoffRange>({ hin: 0, hout: 0, delta: 0 });
  const handoffTick = useMotionValue(0);
  useEffect(() => {
    const measure = () => {
      if (!outerRef.current) return;
      handoffRef.current = measureFerrisHandoff(outerRef.current);
      handoffTick.set(handoffTick.get() + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [handoffTick]);
  // While the section is still sliding in, the wash is masked by an ellipse
  // anchored at the bottom centre, so its top edge is a soft arc rather than
  // a straight line (the tint is brightest top-left, so a hard edge read as
  // a line across the screen). `t` is 1 a viewport away and 0 once settled;
  // the ellipse grows until the mask covers the whole box, so the resting
  // look is unchanged.
  const washArc = useTransform([scrollY, handoffTick], ([sy]: number[]) => {
    // Also runs during server render: use the measured range (the viewport
    // height is delta / HANDOFF_VH), which is empty until mounted.
    const { hin, delta } = handoffRef.current;
    if (delta <= 0) return "0";
    const vh = delta / HANDOFF_VH;
    const t = Math.min(1, Math.max(0, (hin - sy) / vh));
    // Hold the full dome (top edge fully transparent) for the whole entry;
    // any partial opening leaves a straight, half-opaque top edge. It opens
    // only over the last 12%, while that edge is up under the header.
    const u = Math.min(1, t / 0.12);
    return (u * u * (3 - 2 * u)).toFixed(3);
  });
  const sphereHandoff = useTransform([scrollY, handoffTick], ([sy]: number[]) =>
    ferrisSphereHandoff(sy, handoffRef.current),
  );

  const card = CARDS[activeIndex];
  const Icon = ICONS[card.icon];

  return (
    <div ref={outerRef} className="relative ferris-scroll-outer" style={{ height: `${totalVh}vh` }}>
      {/* The background wash on its own layer, below SharedMoon — the content
          frame above it sits over the moon, so during the handoff the moon
          passes between the two, exactly where FerrisSphere lives. */}
      <motion.div
        className="ferris-bg"
        aria-hidden="true"
        style={{ ["--ferris-accent" as string]: accent, ["--ferris-wash-arc" as string]: washArc }}
      />
      <motion.div
        className="ferris-content"
        style={{
          ["--ferris-accent" as string]: accent,
          ["--ferris-glaze" as string]: glaze,
          ["--ferris-sphere-handoff" as string]: sphereHandoff,
        }}
      >
        {/* The copy and the card wheel are each one draggable block (hover →
            grip at the top-left), saved as products.info / products.stage. */}
        <DraggableBox id="products.info" className="ferris-info">
          <div key={`part-${card.partIndex}`} className="ferris-part">
            <span className="ferris-part-icon" aria-hidden="true">
              <Icon strokeWidth={1.5} />
            </span>
            <EditableText id={`products.${card.productId}.name-above`} as="p" className="ferris-part-name">
              {card.partName}
            </EditableText>
          </div>
          <div key={card.key} className="ferris-copy">
            <p className="ferris-step">
              {String(activeIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </p>
            <EditableText
              id={`products.${card.productId}.${card.boxIndex}.name`}
              htmlId={`${card.key}-title`}
              as="h2"
              className="ferris-name"
            >
              {card.name}
            </EditableText>
            <EditableText
              id={`products.${card.productId}.${card.boxIndex}.headline`}
              as="h3"
              className="ferris-headline"
              html={card.headline.replace(/\n/g, "<br/>")}
            />
            {card.description && (
              <EditableText
                id={`products.${card.productId}.${card.boxIndex}.description`}
                as="p"
                className="ferris-desc"
              >
                {card.description}
              </EditableText>
            )}
            <Link className="button primary-button default ferris-link" href={card.href}>
              <EditableText id={`products.${card.productId}.cta`}>Learn More</EditableText>
            </Link>
          </div>
          <div className="ferris-nav">
            <button
              type="button"
              className="ferris-arrow"
              onClick={() => scrollToCard(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous solution"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="ferris-dots">
              {PRODUCTS.map((product, partIndex) => (
                <div key={product.id} className="ferris-dot-group">
                  {CARDS.map((c, i) =>
                    c.partIndex === partIndex ? (
                      <button
                        key={c.key}
                        type="button"
                        className={`ferris-dot${i === activeIndex ? " is-active" : ""}`}
                        onClick={() => scrollToCard(i)}
                        aria-label={c.name}
                        aria-current={i === activeIndex}
                      />
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ferris-arrow"
              onClick={() => scrollToCard(activeIndex + 1)}
              disabled={activeIndex === N - 1}
              aria-label="Next solution"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </DraggableBox>

        <FerrisSphere activeIndex={activeIndex} partIndex={card.partIndex} glaze={card.glaze} />

        <DraggableBox id="products.stage" className="ferris-stage-drag" scalable>
          <div ref={stageRef} className="ferris-stage-wrap">
            <div className="ferris-stage">
              {CARDS.map((c, i) => (
                <WheelCard
                  key={c.key}
                  card={c}
                  index={i}
                  progress={progress}
                  radius={radius}
                  active={i === activeIndex}
                  onSelect={scrollToCard}
                />
              ))}
            </div>
          </div>
        </DraggableBox>
      </motion.div>
      {/* Snap safety-net markers, one per card at its dwell start (same role
          as ProductsSlideScroll's — see boilerlab-scroll.css). */}
      {bounds.map((b, i) => (
        <span
          key={CARDS[i].key}
          aria-hidden="true"
          className="product-scroll-marker"
          style={{ position: "absolute", top: `${b.start * (totalVh - 100)}vh` }}
        />
      ))}
    </div>
  );
}
