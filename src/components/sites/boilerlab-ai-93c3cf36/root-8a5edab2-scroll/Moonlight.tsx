"use client";

import { useEffect } from "react";
import { cancelFrame, frame as frameLoop } from "framer-motion";

/**
 * Moonlight on nearby card edges: for each target card that's on screen,
 * writes where the shared moon is relative to that card (`--moon-lx/-ly`),
 * how far the light has to reach (`--moon-reach`) and how strong it is
 * (`--moon-lit`: the moon's own opacity × closeness). The rim itself is a
 * masked ::after in boilerlab-scroll.css, so only the border facing the moon
 * catches light — text is never touched.
 *
 * The same loop tilts the Partner cards a few degrees toward the pointer
 * (desktop pointers only; `--tilt-*`, applied with the individual `rotate`
 * property so it composes with the cards' own float animation).
 *
 * Only runs while a target is visible (IntersectionObserver), reads layout
 * once per frame and writes only CSS variables on the targets themselves.
 */
const TARGETS = ".in-press-card-surface, .partners-showcase-frame";
// Beyond this distance past the moon's edge the light is gone.
const FALLOFF_PX = 1100;
const TILT_DEG = 3;

export function Moonlight() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const visible = new Set<HTMLElement>();
    const tiltOn = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onPointerMove(e: PointerEvent) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }
    if (tiltOn) window.addEventListener("pointermove", onPointerMove, { passive: true });

    // On framer-motion's frame loop: every layout read happens in the read
    // step, before any loop on the page writes a style this frame, and the
    // writes in the update step. (From its own requestAnimationFrame the
    // reads landed after other loops' writes and forced a layout each frame.)
    let snap: {
      cx: number;
      cy: number;
      r: number;
      moonOpacity: number;
      rects: (readonly [HTMLElement, DOMRect])[];
    } | null = null;
    function read() {
      snap = null;
      const moonWrap = document.querySelector<HTMLElement>(".shared-moon");
      const marble = moonWrap?.querySelector<HTMLElement>(".contacts-marble");
      if (!moonWrap || !marble) return;
      const m = marble.getBoundingClientRect();
      snap = {
        cx: m.left + m.width / 2,
        cy: m.top + m.height / 2,
        r: m.width * 0.32, // visible sphere (MagicMarble sizePercent 64)
        moonOpacity: moonWrap.style.visibility === "hidden" ? 0 : Number(getComputedStyle(moonWrap).opacity),
        rects: [...visible].map((el) => [el, el.getBoundingClientRect()] as const),
      };
    }
    function write() {
      if (!snap) return;
      const { cx, cy, r, moonOpacity, rects } = snap;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      const mag = Math.min(1, Math.hypot(mouse.x, mouse.y));
      for (const [el, b] of rects) {
        const dx = Math.max(b.left - cx, 0, cx - b.right);
        const dy = Math.max(b.top - cy, 0, cy - b.bottom);
        const edge = Math.max(0, Math.hypot(dx, dy) - r);
        const near = Math.max(0, 1 - edge / FALLOFF_PX);
        el.style.setProperty("--moon-lx", `${(cx - b.left).toFixed(0)}px`);
        el.style.setProperty("--moon-ly", `${(cy - b.top).toFixed(0)}px`);
        el.style.setProperty("--moon-reach", `${(Math.hypot(Math.max(Math.abs(cx - b.left), Math.abs(cx - b.right)), Math.max(Math.abs(cy - b.top), Math.abs(cy - b.bottom))) * 1.05).toFixed(0)}px`);
        // The parked moon is drawn dim, but its light still reads — hence
        // the floor and the boost.
        el.style.setProperty("--moon-lit", Math.min(1, near * (0.55 + 0.45 * moonOpacity) * 1.5).toFixed(3));
        if (tiltOn && el.classList.contains("in-press-card-surface")) {
          // Axis perpendicular to the pointer direction, angle by distance.
          el.style.setProperty("--tilt-ax", (-mouse.y).toFixed(3));
          el.style.setProperty("--tilt-ay", mouse.x.toFixed(3));
          el.style.setProperty("--tilt-deg", `${(mag * TILT_DEG).toFixed(2)}deg`);
        }
      }
    }

    let running = false;
    function sync() {
      if (visible.size && !running) {
        running = true;
        frameLoop.read(read, true);
        frameLoop.update(write, true);
      } else if (!visible.size && running) {
        running = false;
        cancelFrame(read);
        cancelFrame(write);
      }
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
      sync();
    });
    // The cards are in the DOM from the start; one late pass catches any
    // that mount after hydration.
    const observeAll = () => document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => io.observe(el));
    observeAll();
    const retry = window.setTimeout(observeAll, 2000);

    return () => {
      window.clearTimeout(retry);
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      cancelFrame(read);
      cancelFrame(write);
    };
  }, []);

  return null;
}
