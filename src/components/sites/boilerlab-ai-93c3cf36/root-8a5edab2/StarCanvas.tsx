"use client";

import { useEffect, useRef } from "react";
import { STAR_TRANSITION_ENABLED } from "./starTransition";

/**
 * Full-viewport 2D canvas starfield, fixed behind the slide deck.
 *
 * Warp-speed hyperspace field, per explicit request (this deliberately
 * diverges from the live site — https://boilerlab.ai/'s own `#star-canvas`
 * was reverse-engineered earlier to be a static, non-scroll-linked twinkle
 * field; this replaces that with the requested reference implementation):
 * each star is a 3D point (x, y, z) that moves toward the camera every
 * frame (`z -= speed`), perspective-projected each frame (`sx = x/z*w+cx`),
 * with a line drawn from its previous projected position to its current one
 * (a motion-blur streak within that one frame) instead of a plain dot. The
 * canvas is a real `clearRect` each frame, not a translucent-black wash — a
 * wash never fully clears, so it converges to 100% opaque black within a
 * couple dozen frames regardless of how faint, which was blotting out
 * whatever sits behind this canvas (page background, etc.); streaks now
 * live for exactly one frame instead of lingering as a multi-frame trail.
 * `speed` (the z-axis warp motion) isn't a flat constant like the reference
 * — it's tied to real scroll activity (`scrollEnergy`): zero at rest
 * (`BASE_SPEED` — no z-axis drift/burst without a reason), ramping up to a
 * genuine warp burst while actively scrolling/paging, easing back down to
 * zero once scrolling stops. Layered independently on top of that: every
 * star also has its own slow x/y float (`DRIFT_*` — a gentle, perpetual bob,
 * unrelated to scrolling) and its own irregular alpha twinkle (`TWINKLE_*`),
 * so a fully idle field still reads as alive instead of a flat static image.
 */

interface Star {
  x: number;
  y: number;
  z: number;
  /** Previous frame's fully-projected screen position (after drift), so
   * `draw()` can line-segment from where it was to where it is now — the
   * warp trail during a scroll burst, and (now that drift moves it a little
   * even at rest) a faint one at idle too. */
  prevSx: number;
  prevSy: number;
  /** Own random rate/offset for the idle twinkle sine wave below, so all 500
   * stars don't blink in lockstep. */
  twinkleSpeed: number;
  twinklePhase: number;
  /** Own random rate/offset for the idle float/drift below — same
   * one-phase-per-star-per-axis idea as twinkle, so 500 stars don't bob in
   * unison. */
  driftSpeed: number;
  driftPhaseX: number;
  driftPhaseY: number;
}

const STAR_COUNT = 500;
// Idle drift speed (roughly matches the reference's constant `speed = 2`,
// scaled down since here it's a floor, not the only value it ever takes).
const BASE_SPEED = 0;
// How much extra z-speed one unit of `scrollEnergy` adds — tuned so a real
// scroll burst reads as a distinct "warp jump", not just a faster drift.
const SCROLL_SPEED_PER_ENERGY = 14;
const SCROLL_ENERGY_PER_PX = 0.03;
const SCROLL_ENERGY_MAX = 4;
const SCROLL_ENERGY_DECAY = 0.94;
// Idle twinkle: an irregular per-star alpha flicker, independent of any
// scroll/depth motion, so a fully still field still reads as "alive" instead
// of a flat static image.
const TWINKLE_MIN_ALPHA = 0.35;
const TWINKLE_SPEED_MIN = 0.0008;
const TWINKLE_SPEED_MAX = 0.003;
// Idle float: a slow, gentle bob applied directly in screen pixels (not
// 3D-space position before the perspective divide — tried that first, and
// dividing a fixed world-space wobble by a *small* z for a close/bright
// star blew it up into huge, chaotic scribbles instead of a gentle drift)
// that keeps running even at rest, layered under the scroll-driven z motion.
const DRIFT_AMPLITUDE_PX = 4.5;
const DRIFT_SPEED_MIN = 0.00025;
const DRIFT_SPEED_MAX = 0.0006;

export function StarCanvas({ hidden }: { hidden: boolean; boostTrigger?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Every one of these lives in this effect's own closure (not a ref), so
    // a React StrictMode dev-mode mount→cleanup→mount replay always starts
    // fresh — no state survives from a cancelled prior mount to make a
    // "size unchanged, skip re-seeding the stars" check wrongly bail out on
    // the surviving mount (see git history: that exact ref-based mistake
    // once left this canvas clearing every frame but never drawing).
    let stars: Star[] = [];
    let rafId: number | null = null;
    let w = 0;
    let h = 0;
    let dpr = 0;
    let cx = 0;
    let cy = 0;

    function resetStar(s: Star) {
      s.x = (Math.random() - 0.5) * w;
      s.y = (Math.random() - 0.5) * h;
      s.z = Math.random() * w;
      s.prevSx = (s.x / s.z) * w + cx;
      s.prevSy = (s.y / s.z) * h + cy;
    }

    function makeStars() {
      stars = Array.from({ length: STAR_COUNT }, () => {
        const s: Star = {
          x: 0,
          y: 0,
          z: 0,
          prevSx: 0,
          prevSy: 0,
          twinkleSpeed: TWINKLE_SPEED_MIN + Math.random() * (TWINKLE_SPEED_MAX - TWINKLE_SPEED_MIN),
          twinklePhase: Math.random() * Math.PI * 2,
          driftSpeed: DRIFT_SPEED_MIN + Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN),
          driftPhaseX: Math.random() * Math.PI * 2,
          driftPhaseY: Math.random() * Math.PI * 2,
        };
        resetStar(s);
        return s;
      });
    }

    function resize() {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container!.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width) || window.innerWidth);
      const nextH = Math.max(1, Math.floor(rect.height) || window.innerHeight);
      if (nextW === w && nextH === h && nextDpr === dpr) return;
      w = nextW;
      h = nextH;
      dpr = nextDpr;
      cx = w / 2;
      cy = h / 2;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    // Default lineCap is "butt", which draws literally nothing for a
    // zero-length segment — at rest (BASE_SPEED 0, previous/current
    // projected position identical) every star's moveTo→lineTo was
    // degenerate, so the whole field just faded to black and only
    // reappeared once scrolling gave each line real length. "round" turns
    // that same zero-length segment into a round dot, so stars stay visibly
    // present at rest and still read as streaks once actually moving.
    ctx.lineCap = "round";

    let lastScrollY = window.scrollY;
    let scrollEnergy = 0;
    function onScroll() {
      const now = window.scrollY;
      // "별전환" (see starTransition.ts) — this is the real warp-burst
      // mechanism; keep tracking `lastScrollY` even while off so re-enabling
      // later doesn't see one huge false delta from a stale value.
      if (STAR_TRANSITION_ENABLED) {
        scrollEnergy = Math.min(SCROLL_ENERGY_MAX, scrollEnergy + Math.abs(now - lastScrollY) * SCROLL_ENERGY_PER_PX);
      }
      lastScrollY = now;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    function render() {
      scrollEnergy *= SCROLL_ENERGY_DECAY;
      const speed = BASE_SPEED + scrollEnergy * SCROLL_SPEED_PER_ENERGY;

      // A real clearRect, not a translucent black wash — painting even a
      // faint black rect on top of *never* being fully cleared converges to
      // 100% opaque black within a couple dozen frames regardless of how
      // low the alpha is (each frame only ever adds more black, never less),
      // which is exactly what was blotting out the page's own background
      // image behind this canvas. Each star's own moveTo→lineTo segment
      // still reads as a streak within a single frame during a warp burst;
      // it just doesn't linger across frames as an afterimage anymore.
      ctx!.clearRect(0, 0, w, h);

      // Soft glow instead of a hard-edged dot/line — closer to how a real
      // star actually reads (a fuzzy point of light, not a crisp circle) —
      // only while actually drawing the stars themselves.
      ctx!.shadowColor = "rgba(255, 255, 255, 0.95)";
      ctx!.shadowBlur = 5;

      const now = performance.now();
      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 1) {
          resetStar(s);
          s.z = w;
        }

        const driftX = Math.sin(now * s.driftSpeed + s.driftPhaseX) * DRIFT_AMPLITUDE_PX;
        const driftY = Math.cos(now * s.driftSpeed * 0.8 + s.driftPhaseY) * DRIFT_AMPLITUDE_PX;
        const sx = (s.x / s.z) * w + cx + driftX;
        const sy = (s.y / s.z) * h + cy + driftY;
        const px = s.prevSx;
        const py = s.prevSy;
        s.prevSx = sx;
        s.prevSy = sy;
        const depthFactor = 1 - s.z / w;
        // Irregular per-star flicker, always layered on top of the
        // depth-based brightness (not just at rest) — the closer/brighter a
        // star already is, the more its twinkle shows.
        const twinkle = TWINKLE_MIN_ALPHA + (1 - TWINKLE_MIN_ALPHA) * (0.5 + 0.5 * Math.sin(now * s.twinkleSpeed + s.twinklePhase));
        const size = Math.max(0.455, depthFactor * 4.16);
        const alpha = Math.min(1, depthFactor * 1.5 * twinkle);

        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.lineWidth = size;
        ctx!.stroke();
      }
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div id="star-canvas" ref={containerRef} className={hidden ? "stars-hidden" : undefined} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
