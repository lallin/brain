"use client";

import { useEffect, useRef } from "react";
import { HeroSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/HeroSlide";

/**
 * Pins the hero for one extra viewport of scroll, then slides its content
 * up and out of the frame (no fade — the user asked for text to move up on
 * scroll rather than dim away).
 *
 * Deliberately NOT framer-motion's `useScroll`/`useTransform` (what this
 * used originally, and what NumbersIntroUsersScroll's old crossfade also
 * used): verified directly, repeatedly, with real wheel-scroll sampled
 * every ~100ms, that `scrollYProgress` was **not monotonic** with `scrollY`
 * here — opacity would correctly fade down toward 0, then jump back up to 1
 * and stick there, even while `window.scrollY` kept climbing and CSS
 * mandatory-snap was confirmed disabled (`scroll-snap-type: none`,
 * `.snap-paused` present) the whole time — a real, currently-unexplained
 * quirk in that hook's own measurement here, not a snap-fighting-scrub
 * issue. Rather than depend on a hook with an unresolved correctness bug,
 * this computes progress itself: `getBoundingClientRect()` fresh on every
 * raw `scroll` event, no cached/derived motion-value chain to go stale.
 */
const FADE_START = 0.55;
const FADE_END = 0.85;
// The moon is no longer rendered here: one shared instance (SharedMoon,
// mounted by BoilerLabScrollApp) travels from the hero into the numbers
// sections, so it never leaves in one section and reappears in the next.

export function HeroSlideScroll() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const fadeEl = fadeRef.current;
    if (!outer || !fadeEl) return;

    function update() {
      const rect = outer!.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      // "start start" / "end end" equivalent: 0 when outer's own top hits
      // the viewport top, 1 when outer's bottom hits the viewport bottom.
      const progress = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      // Exit by moving up (not fading): the text slides out through the top
      // of the pinned frame over the same range the fade used to cover.
      const t = Math.min(1, Math.max(0, (progress - FADE_START) / (FADE_END - FADE_START)));
      const eased = t * t * (3 - 2 * t);
      fadeEl!.style.transform = `translate3d(0, ${(-eased * window.innerHeight).toFixed(1)}px, 0)`;

    }

    // Applied in the next frame, not inside the scroll event: a style write
    // there made every later scroll listener's read (GSAP's scroll position,
    // the section tracker) force a full style recalc.
    let raf = 0;
    function schedule() {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={outerRef} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="moon-gradient" aria-hidden="true" />
        <div ref={fadeRef} style={{ position: "absolute", inset: 0 }}>
          <HeroSlide renderMoon={false} />
        </div>
      </div>
      {/* Safety-net snap marker at the midpoint — same pattern/reasoning as
          NumbersIntroUsersScroll's `.numbers-intro-snap-marker`: #mission
          keeps the default `scroll-snap-align: start` on its own top (the
          footer nav's "Mission" link needs a valid `scrollIntoView` target
          to land on), but that alone left the *whole* 200vh fade-out with
          nothing else to snap to — verified directly (Playwright, real
          wheel-scroll): mandatory snap repeatedly yanked a scroll that
          paused mid-fade back toward #mission's own top (visible as the
          fade briefly reversing partway back to opaque) before
          `.snap-paused` caught up. This bounds that tug-of-war to "back to
          the midpoint" instead of all the way to the top. */}
      <span aria-hidden="true" className="mission-snap-marker" style={{ position: "absolute", top: "100vh" }} />
    </div>
  );
}
