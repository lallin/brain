"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/products-data";
import { ProductBoxCarousel } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ProductBoxCarousel";

const BOX_STEP_LOCK_MS = 550; // matches the box-slide's own transition duration (product-gallery.css)
const CARD_STEP_MS = 700; // one card-to-card step's animated duration

/**
 * INTERACTION MODEL: discrete, wheel-stepped card stack (see BEHAVIORS.md).
 * Desktop only — the ≤820px media query in boilerlab.css forces every card
 * back to normal flow with `!important`, so this JS-computed inline styling
 * is simply overridden on mobile without any JS branching needed here.
 *
 * Re-verified against the live site: a single wheel input (once it clears a
 * small noise threshold) commits to exactly the next/previous card and the
 * site animates the rest of the way there on its own — sampling the live
 * site's inline transforms after firing one synthetic wheel event showed the
 * card-stack settle fully onto the next card with no further input, not a
 * value proportional to that one event's deltaY. So `progress` here is a
 * *committed* value animated from one integer index to the next over a fixed
 * duration (eased), not a continuous drag driven by accumulated wheel delta
 * — matching that "one scroll = one card" behavior. The exact momentum/spring
 * curve behind the live site's own settle isn't recoverable from static CSS,
 * so the ease below is a faithful approximation, not a byte-exact extraction.
 *
 * A product with more than one image (new feature — see ProductBoxCarousel)
 * gets its own box index (`boxIndices[productIndex]`), stepped by the SAME
 * wheel handler below rather than an independent listener inside the
 * carousel — a single decision point avoids the two-listener race that
 * used to let a fast scroll skip a card's first box unseen.
 *
 * Two things had to be true for that first box to reliably *hold* rather
 * than merely not-be-skipped:
 * 1. Box-stepping only engages once a card is genuinely, fully settled (no
 *    card-step animation in flight), not just "close".
 * 2. The instant a card is newly (re-)settled on, its box index is reset
 *    to 0 — so arriving always shows box one first, regardless of which
 *    box it was left on last time.
 */
export function ProductsSlide({ present }: { present: boolean }) {
  const [progress, setProgress] = useState(0);
  const [boxIndices, setBoxIndices] = useState<number[]>(() => PRODUCTS.map(() => 0));
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const boxIndicesRef = useRef(boxIndices);
  const boxStepLockRef = useRef(false);
  const cardStepLockRef = useRef(false);
  const lastSettledRef = useRef<number | null>(0);
  const animRef = useRef<{ from: number; to: number; start: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    boxIndicesRef.current = boxIndices;
  }, [boxIndices]);

  function goToBox(productIndex: number, next: number) {
    const len = PRODUCTS[productIndex].boxes.length;
    const wrapped = ((next % len) + len) % len;
    setBoxIndices((prev) => {
      if (prev[productIndex] === wrapped) return prev;
      const nextArr = [...prev];
      nextArr[productIndex] = wrapped;
      return nextArr;
    });
  }

  useEffect(() => {
    if (!present) return;
    const el = containerRef.current;
    if (!el) return;

    function settleIfNew(value: number) {
      if (lastSettledRef.current !== value) {
        lastSettledRef.current = value;
        goToBox(value, 0);
      }
    }

    function stepFrame(now: number) {
      const anim = animRef.current;
      if (!anim) {
        rafRef.current = null;
        return;
      }
      const t = Math.min(1, (now - anim.start) / CARD_STEP_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = anim.from + (anim.to - anim.from) * eased;
      progressRef.current = value;
      setProgress(value);
      if (t >= 1) {
        animRef.current = null;
        cardStepLockRef.current = false;
        settleIfNew(anim.to);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(stepFrame);
    }

    function goToCard(nextIndex: number) {
      const clamped = Math.max(0, Math.min(PRODUCTS.length - 1, nextIndex));
      if (clamped === activeIndexRef.current) return;
      activeIndexRef.current = clamped;
      cardStepLockRef.current = true;
      animRef.current = { from: progressRef.current, to: clamped, start: performance.now() };
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(stepFrame);
    }

    function onWheel(e: WheelEvent) {
      // Box-stepping first: only once the card-stack is fully settled (no
      // step animation in flight) and the nearest card still has images
      // left in this scroll direction, consume the wheel for that instead
      // of moving the card-stack at all.
      const nearest = activeIndexRef.current;
      const nearProduct = PRODUCTS[nearest];
      const isSettled = animRef.current === null;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (isSettled && nearProduct.boxes.length > 1) {
        const curBox = boxIndicesRef.current[nearest];
        const canStepBox = dir > 0 ? curBox < nearProduct.boxes.length - 1 : curBox > 0;
        if (canStepBox) {
          e.preventDefault();
          e.stopPropagation();
          if (boxStepLockRef.current) return;
          boxStepLockRef.current = true;
          goToBox(nearest, curBox + dir);
          setTimeout(() => {
            boxStepLockRef.current = false;
          }, BOX_STEP_LOCK_MS);
          return;
        }
      }

      const max = PRODUCTS.length - 1;
      const atStartGoingBack = dir < 0 && activeIndexRef.current <= 0;
      const atEndGoingForward = dir > 0 && activeIndexRef.current >= max;
      if (atStartGoingBack || atEndGoingForward) {
        // Let the event bubble untouched so the deck-level handler advances
        // to the previous/next topic instead.
        return;
      }
      if (Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      e.stopPropagation();
      if (cardStepLockRef.current) return; // a step is already animating — swallow, don't queue
      goToCard(activeIndexRef.current + dir);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [present]);

  return (
    <div className="slide-inner product-content" ref={containerRef}>
      {PRODUCTS.map((product, i) => {
        const offset = i - progress;
        const abs = Math.abs(offset);
        const clampedOffsetVh = Math.max(-122, Math.min(122, offset * 60));
        const scale = Math.max(0.86, 1 - Math.min(abs, 2) * 0.07);
        const opacity = Math.max(0, Math.min(1, 1 - abs * 0.85));
        const dim = Math.max(0, Math.min(0.85, abs * 0.8));
        const blur = Math.max(0, Math.min(10, abs * 3));
        const focused = abs < 0.5;

        return (
          <article
            key={product.id}
            id={product.id}
            className="product-card"
            aria-labelledby={`${product.id}-${boxIndices[i]}-title`}
            aria-hidden={!focused}
            style={{
              transform: `translate3d(-50%, calc(-50% + ${clampedOffsetVh}vh), 0) scale(${scale})`,
              opacity,
              ["--card-dim" as string]: dim,
              ["--card-blur" as string]: `${blur}px`,
              pointerEvents: abs < 2.2 ? (focused ? "auto" : "none") : "none",
              visibility: abs < 2.2 ? "visible" : "hidden",
            }}
          >
            <ProductBoxCarousel
              product={product}
              focused={focused}
              index={boxIndices[i]}
              onGoTo={(next) => goToBox(i, next)}
            />
          </article>
        );
      })}
    </div>
  );
}
