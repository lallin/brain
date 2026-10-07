"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AirColumn {
  letter: "A" | "I" | "R";
  name: string;
  description: string;
}

// Same copy as NumbersAirSlide's AIR_VALUES (duplicated rather than shared —
// that component's own card-grid layout stays untouched for the fixed deck
// at /classic; this is a different visual treatment for the scroll-native
// page only).
const AIR_COLUMNS: AirColumn[] = [
  {
    letter: "A",
    name: "Authenticity",
    description:
      "Genuine and unembellished — we communicate with a trustworthy, consistent attitude and put the values we stand for into practice.",
  },
  {
    letter: "I",
    name: "Initiative",
    description: "We find and solve problems ourselves, driving new attempts and creating positive momentum.",
  },
  {
    letter: "R",
    name: "Respect",
    description:
      "We respect colleagues, customers, and partners alike, embracing diversity and building a collaborative culture on trust and care.",
  },
];

/**
 * "AIR" hero text, scroll-scrubbed: starts as one solid word (the three
 * letters pulled together over their natural 3-column grid position via a
 * negative `x` offset computed from actual layout), then as the section is
 * pinned and scrubbed, each letter eases back to its own column (`x: 0`,
 * `power2.out`) while that column's name/description slides down into place
 * (`y: -28 -> 0`, opacity `0 -> 1`) alongside it. Three equal thirds of the
 * scrub (one wheel stop each): A + its text, then I + its text with R moving
 * out to its own column alongside (left joined to I it sat on top of I's
 * text), then R's text on its own.
 */
/**
 * The pinned scrub's scroll range (scrollY at progress 0 and 1), kept current
 * on every ScrollTrigger refresh. BoilerLabScrollApp's wheel handler steps
 * through it one AIR letter (a third) per wheel notch. NaN while unmounted.
 */
export const airScrubRange = { start: Number.NaN, end: Number.NaN };

export function NumbersAirSlideScroll() {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const introRef = useRef<HTMLDivElement | null>(null);
  const [introShown, setIntroShown] = useState(false);

  // One-shot zoom-in for the intro line only — separate from the
  // GSAP-driven letter-split timeline below, which owns `letterRefs`/
  // `textRefs` exclusively; layering a CSS animation onto either of those
  // would fight GSAP's own transforms on the same elements.
  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntroShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const row = rowRef.current;
    const letters = letterRefs.current;
    const texts = textRefs.current;
    if (!pin || !row || letters.some((el) => !el) || texts.some((el) => !el)) return;

    const ctx = gsap.context(() => {
      // Each letter's natural position is its own column's center (final
      // state). For the joined "AIR" state, they need to sit *adjacent* —
      // A immediately followed by I immediately followed by R, zero gap,
      // as one word — not stacked on top of each other at a single point
      // (that reads as overlapping glyphs, not a word). So: lay the three
      // measured widths out back-to-back centered on the row's own center,
      // then take the offset from each letter's natural position to its
      // slot in that joined word. Recomputed on resize since it's real
      // pixel distances.
      function computeJoinOffsets() {
        // getBoundingClientRect() reports the *rendered* (already-
        // transformed) box, not the underlying layout position — measuring
        // while a previous join offset is still applied would compute a
        // second offset on top of the first instead of a fresh one from
        // each letter's true natural (grid) position. Zero out `x` first
        // so every call — mount, font-swap recompute, resize — starts from
        // the same untransformed baseline.
        gsap.set(letters, { x: 0 });
        const rowRect = row!.getBoundingClientRect();
        const rects = letters.map((letter) => letter!.getBoundingClientRect());
        const totalWidth = rects.reduce((sum, r) => sum + r.width, 0);
        let cursor = rowRect.left + rowRect.width / 2 - totalWidth / 2;
        return rects.map((r) => {
          const offset = cursor - r.left;
          cursor += r.width;
          return offset;
        });
      }

      gsap.set(texts, { y: -28, opacity: 0 });
      let joinOffsets = computeJoinOffsets();
      gsap.set(letters, { x: (i) => joinOffsets[i] });

      // How much *extra* scroll distance the pin holds for, on top of
      // `.air-split-content`'s own natural in-flow height.
      function extraScrubDistance() {
        return window.innerHeight;
      }
      // The manual spacer (see `pinSpacing: false` below for why) only
      // needs to cover the full `natural + extra` distance *while actually
      // pinned* — that's the one moment `.air-split-content` is `position:
      // fixed` and so contributes zero height to its parent, needing the
      // spacer to stand in for both its own collapsed space and the extra
      // scrub room. Before the pin engages and after it releases, the
      // content is back in normal flow contributing its own natural height
      // again, so a spacer *permanently* sized for the pinned case would
      // double-count that natural height — measured directly: it very
      // noticeably inflated how far you had to keep scrolling past the
      // point the split animation had already finished. `onEnter`/
      // `onLeave` (both directions) toggle the spacer between the two.
      function pinnedSpacerHeight() {
        return pin!.getBoundingClientRect().height + extraScrubDistance();
      }
      function setSpacerHeight(height: number) {
        gsap.set(spacerRef.current, { height });
      }
      setSpacerHeight(extraScrubDistance());

      // `--font-jetbrains-mono` loads with `display: swap` (see layout.tsx),
      // so the measurement above can run against a fallback face's metrics
      // before the real font swaps in — the real font's different letter
      // widths then leave a visible gap/overlap in the "joined" state.
      // Recompute once fonts are actually ready, but only while still at
      // the very start of the scrub (don't yank letters mid-scroll if a
      // font happens to finish loading late).
      document.fonts?.ready?.then(() => {
        if (tl.scrollTrigger && tl.scrollTrigger.progress === 0) {
          joinOffsets = computeJoinOffsets();
          gsap.set(letters, { x: (i) => joinOffsets[i] });
        }
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${extraScrubDistance()}`,
          scrub: true,
          pin: true,
          // GSAP's own automatic pin-spacer (the default, `pinSpacing:
          // true`) turned out not to reserve the extra scrub distance at
          // all in this layout — measured directly: raising `end` from
          // one to three extra viewports didn't change the spacer's
          // rendered height by a single pixel, so whatever's pinned only
          // ever got its own natural content height back. #products (the
          // very next section) was reachable by ordinary scrolling well
          // before the pin's progress reached 1, so it visibly bled in
          // underneath/around the still-pinned "AIR" text. Managing the
          // reserved space by hand (the `spacerRef` div below) sidesteps
          // that entirely.
          pinSpacing: false,
          onRefresh: (self) => {
            airScrubRange.start = self.start;
            airScrubRange.end = self.end;
          },
          onEnter: () => setSpacerHeight(pinnedSpacerHeight()),
          onEnterBack: () => {
            setSpacerHeight(pinnedSpacerHeight());
            document.documentElement.classList.remove("air-done");
          },
          // Once the split has actually finished (scrolled past `end`),
          // flag it globally (`.air-done` on <html>) so
          // BoilerLabScrollApp's wheel-stepper — which otherwise leaves
          // #numbers-air alone entirely, same as #products, so it doesn't
          // interrupt the scrub — knows it can resume stepping normally
          // for the rest of this section: there's nothing left to scrub,
          // just its own remaining content height to scroll past like any
          // other section, and that shouldn't need a dozen bare wheel
          // notches when everywhere else only needs one.
          onLeave: () => {
            setSpacerHeight(extraScrubDistance());
            document.documentElement.classList.add("air-done");
          },
          onLeaveBack: () => {
            setSpacerHeight(extraScrubDistance());
            document.documentElement.classList.remove("air-done");
          },
        },
      });

      // Chained (no overlap) rather than staggered: each `.to()` with no
      // position argument starts only once every tween added before it has
      // finished, so with equal 1-unit durations throughout, each third of
      // the scrub (0-33% / 34-66% / 67-100%) is one wheel stop. R leaves
      // together with I ("<"), so it never covers I's text; its own text
      // then has the last third to itself.
      tl.to(letters[0], { x: 0, ease: "power2.out", duration: 1 })
        .to(texts[0], { y: 0, opacity: 1, ease: "power2.out", duration: 1 }, "<")
        .to(letters[1], { x: 0, ease: "power2.out", duration: 1 })
        .to(texts[1], { y: 0, opacity: 1, ease: "power2.out", duration: 1 }, "<")
        .to(letters[2], { x: 0, ease: "power2.out", duration: 1 }, "<")
        .to(texts[2], { y: 0, opacity: 1, ease: "power2.out", duration: 1 });

      function handleResize() {
        if (tl.scrollTrigger && tl.scrollTrigger.progress === 0) {
          joinOffsets = computeJoinOffsets();
          gsap.set(letters, { x: (i) => joinOffsets[i] });
        }
        setSpacerHeight(tl.scrollTrigger?.isActive ? pinnedSpacerHeight() : extraScrubDistance());
        ScrollTrigger.refresh();
      }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, pin);

    return () => {
      ctx.revert();
      airScrubRange.start = Number.NaN;
      airScrubRange.end = Number.NaN;
      document.documentElement.classList.remove("air-done");
    };
  }, []);

  return (
    <>
      <div className="slide-inner stars-slide">
        <div className="stars-slide-inner hero-content air-split-content" ref={pinRef}>
          <div ref={introRef} className={["company-fwd-perspective", introShown ? "company-fwd-in" : ""].filter(Boolean).join(" ")}>
            <EditableText id="air.intro" as="p" className="subtitle air-split-intro">
              The core values Braindeck believes in
            </EditableText>
          </div>
          <div className="air-split-row" ref={rowRef}>
            {AIR_COLUMNS.map((col, i) => (
              <div className="air-split-column" key={col.letter}>
                <span
                  className="air-split-letter"
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                >
                  {col.letter}
                </span>
                <div
                  className="air-split-text"
                  ref={(el) => {
                    textRefs.current[i] = el;
                  }}
                >
                  <EditableText id={`air.${col.letter}.name`} as="h3" className="air-split-name">
                    {col.name}
                  </EditableText>
                  <EditableText id={`air.${col.letter}.description`} as="p" className="air-split-description">
                    {col.description}
                  </EditableText>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Manually-sized stand-in for GSAP's own pin-spacer (disabled via
          `pinSpacing: false` above — see the comment on the ScrollTrigger
          config for why): reserves the extra scroll distance the pin holds
          for, as plain sibling flow height, so #products can't be scrolled
          into view until the pin's progress actually reaches 1. */}
      <div ref={spacerRef} aria-hidden="true" />
    </>
  );
}
