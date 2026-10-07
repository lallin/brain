"use client";

import { useEffect, useRef } from "react";
import { cancelFrame, frame as frameLoop, type FrameData } from "framer-motion";
import { cameraPan } from "./company-flow";
import { subscribeFrameView, view } from "./frame-sync";
import { COMPANY_FLOW } from "./company-flow-config";

/**
 * The main page's deep-space backdrop, fixed behind everything (below the
 * shared moon): three star layers at different depths plus slow nebula haze.
 *
 * - Far / mid stars are painted once into small repeating tiles and moved
 *   as CSS layers (compositor-only transforms), so thousands of stars cost
 *   nothing per frame.
 * - Near stars and the few twinkling stars are drawn each frame on one
 *   canvas with a prerendered glow sprite (no per-star shadowBlur).
 * - Depth comes from parallax: each layer moves a different fraction of the
 *   scroll distance, plus a slow idle drift so a still page keeps cruising.
 * - Camera pan (Company flow, company-flow.ts): while the sphere travels,
 *   every layer drifts the opposite way — stars by their depth, the haze
 *   by a fixed fraction.
 * - Phones get about a third of the stars and one nebula; with
 *   prefers-reduced-motion everything is drawn once and never moves.
 *
 * /classic keeps its own StarCanvas.
 */

interface LayerSpec {
  tile: number; // tile size, CSS px
  density: number; // stars per 100×100 CSS px
  size: [number, number]; // radius range, CSS px
  alpha: [number, number];
  parallax: number; // fraction of scrollY
  drift: number; // idle drift, CSS px per second (upward)
  depth: number; // 0 far … 1 near, for the camera pan
}

const FAR: LayerSpec = { tile: 640, density: 0.9, size: [0.35, 0.8], alpha: [0.25, 0.65], parallax: 0.025, drift: 2, depth: 0 };
const MID: LayerSpec = { tile: 880, density: 0.28, size: [0.6, 1.15], alpha: [0.45, 0.85], parallax: 0.07, drift: 5, depth: 0.4 };
const NEAR = { count: 70, size: [1.1, 2.1] as [number, number], alpha: [0.65, 1] as [number, number], parallax: 0.16, drift: 11, depth: 1 };
/** Camera-pan share per depth: starMin at the back, 1 up front. */
const panShare = (depth: number) => COMPANY_FLOW.camera.starMin + (1 - COMPANY_FLOW.camera.starMin) * depth;
const TWINKLE = { count: 110, size: [0.6, 1.3] as [number, number], alpha: [0.35, 0.95] as [number, number] };
const MOBILE_FACTOR = 0.35;
// Mouse parallax (desktop pointers only), px at the screen edge per layer.
const MOUSE_SHIFT = { far: 3, mid: 6, near: 12 };
const NEBULA_TRAVEL = 120;

// Faint blue-white / teal tints so the field isn't pure grey.
const STAR_TINTS = ["255,255,255", "225,235,255", "205,245,238", "255,250,240"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** One tile of `spec` stars as an image URL (for a repeating CSS background). */
function paintTile(spec: LayerSpec, dpr: number, density: number): string {
  const c = document.createElement("canvas");
  c.width = c.height = Math.round(spec.tile * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const n = Math.round((spec.tile * spec.tile * spec.density * density) / 10000);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * spec.tile;
    const y = Math.random() * spec.tile;
    const r = rand(spec.size[0], spec.size[1]);
    const a = rand(spec.alpha[0], spec.alpha[1]);
    const tint = pick(STAR_TINTS);
    const glow = g.createRadialGradient(x, y, 0, x, y, r * 2.6);
    glow.addColorStop(0, `rgba(${tint},${a})`);
    glow.addColorStop(0.35, `rgba(${tint},${a * 0.55})`);
    glow.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = glow;
    g.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  }
  return c.toDataURL("image/png");
}

/** Soft round glow, drawn once and stamped for every dynamic star. */
function makeSprite(): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const g = s.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.45, "rgba(210,235,255,0.22)");
  grad.addColorStop(1, "rgba(210,235,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return s;
}

interface DynStar {
  x: number; // 0..1 of width
  y: number; // 0..1 of wrap height
  r: number;
  a: number;
  speed: number; // twinkle rate (rad/ms); 0 = steady
  phase: number;
  parallax: number;
  drift: number;
  depth: number;
}

function wrap(v: number, m: number) {
  return ((v % m) + m) % m;
}

export function DeepSpace() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const nebulaRef = useRef<HTMLDivElement | null>(null);
  const farRef = useRef<HTMLDivElement | null>(null);
  const midRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const far = farRef.current;
    const mid = midRef.current;
    const canvas = canvasRef.current;
    const nebula = nebulaRef.current;
    if (!root || !far || !mid || !canvas || !nebula) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(width <= 760px)").matches;
    const density = mobile ? MOBILE_FACTOR : 1;
    const tileDpr = Math.min(window.devicePixelRatio || 1, 2);

    far.style.backgroundImage = `url(${paintTile(FAR, tileDpr, density)})`;
    far.style.backgroundSize = `${FAR.tile}px ${FAR.tile}px`;
    mid.style.backgroundImage = `url(${paintTile(MID, tileDpr, density)})`;
    mid.style.backgroundSize = `${MID.tile}px ${MID.tile}px`;

    const sprite = makeSprite();
    const stars: DynStar[] = [];
    const nearCount = Math.round(NEAR.count * density);
    const twinkleCount = Math.round(TWINKLE.count * density);
    for (let i = 0; i < nearCount; i++) {
      stars.push({ x: Math.random(), y: Math.random(), r: rand(...NEAR.size), a: rand(...NEAR.alpha), speed: 0, phase: 0, parallax: NEAR.parallax, drift: NEAR.drift, depth: NEAR.depth });
    }
    for (let i = 0; i < twinkleCount; i++) {
      // Twinklers live at far/mid depth, so they move with those layers.
      const deep = Math.random() < 0.5;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(...TWINKLE.size),
        a: rand(...TWINKLE.alpha),
        speed: rand(0.0006, 0.0018),
        phase: Math.random() * Math.PI * 2,
        parallax: deep ? FAR.parallax : MID.parallax,
        drift: deep ? FAR.drift : MID.drift,
        depth: deep ? FAR.depth : MID.depth,
      });
    }

    let w = 0;
    let h = 0;
    let pageMax = 0; // cached: reading scrollHeight after the writes below forced a style recalc
    function resize() {
      pageMax = document.documentElement.scrollHeight - window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Pointer position, -1..1 from the screen centre, eased toward the target.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onPointerMove(e: PointerEvent) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const t0 = performance.now();
    function frame(now: number) {
      // Per-frame snapshot (frame-sync.ts); a live scrollY read here came
      // after other loops' style writes and forced a layout every frame.
      const sy = view.scrollY;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      // Nearer layers shift more, opposite to the pointer, like looking
      // out of a window.
      const shiftY = (px: number) => -mouse.y * px;
      const secs = reduced ? 0 : (now - t0) / 1000;
      const offset = (spec: { parallax: number; drift: number; depth: number }) =>
        reduced ? 0 : sy * spec.parallax + secs * spec.drift + cameraPan.y * panShare(spec.depth);
      // Camera pan, x: the tile layers are one tile wider on each side, so a
      // wrapped shift never shows an edge.
      const panX = (spec: LayerSpec) => -wrap(cameraPan.x * panShare(spec.depth), spec.tile);
      far!.style.transform = `translate3d(${(panX(FAR) - mouse.x * MOUSE_SHIFT.far).toFixed(2)}px, ${(-wrap(offset(FAR), FAR.tile) + shiftY(MOUSE_SHIFT.far)).toFixed(2)}px, 0)`;
      mid!.style.transform = `translate3d(${(panX(MID) - mouse.x * MOUSE_SHIFT.mid).toFixed(2)}px, ${(-wrap(offset(MID), MID.tile) + shiftY(MOUSE_SHIFT.mid)).toFixed(2)}px, 0)`;
      // The haze is the farthest thing: at most NEBULA_TRAVEL px over the page,
      // plus its share of the camera pan (the layer overhangs the screen).
      const nebX = -cameraPan.x * COMPANY_FLOW.camera.nebula;
      const nebY = (reduced || pageMax <= 0 ? 0 : (-sy / pageMax) * NEBULA_TRAVEL) - cameraPan.y * COMPANY_FLOW.camera.nebula;
      nebula!.style.transform = `translate3d(${nebX.toFixed(2)}px, ${nebY.toFixed(2)}px, 0)`;

      ctx!.clearRect(0, 0, w, h);
      const span = h + 40; // wrap height, so stars re-enter just off-screen
      const nearDx = -mouse.x * MOUSE_SHIFT.near;
      const nearDy = shiftY(MOUSE_SHIFT.near);
      for (const s of stars) {
        const k = s.parallax === NEAR.parallax ? 1 : s.parallax === MID.parallax ? MOUSE_SHIFT.mid / MOUSE_SHIFT.near : MOUSE_SHIFT.far / MOUSE_SHIFT.near;
        const x = wrap(s.x * (w + 40) - cameraPan.x * panShare(s.depth), w + 40) - 20 + nearDx * k;
        const y = wrap(s.y * span - offset(s), span) - 20 + nearDy * k;
        const tw = s.speed ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase)) : 1;
        const d = s.r * 5;
        ctx!.globalAlpha = s.a * (reduced ? 1 : tw);
        ctx!.drawImage(sprite, x - d / 2, y - d / 2, d, d);
      }
      ctx!.globalAlpha = 1;
    }

    // On framer-motion's frame loop (update step, after every loop's reads).
    let running = false;
    let unsubscribe: (() => void) | null = null;
    function loop({ timestamp }: FrameData) {
      frame(timestamp);
    }
    function start() {
      if (running || reduced) return;
      running = true;
      unsubscribe = subscribeFrameView();
      frameLoop.update(loop, true);
    }
    function stop() {
      running = false;
      cancelFrame(loop);
      unsubscribe?.();
      unsubscribe = null;
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    function onResize() {
      resize();
      if (reduced) frame(performance.now());
    }

    frame(performance.now());
    start();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    // Page height changes (sections mounting, fonts) without a resize.
    const ro = new ResizeObserver(() => {
      pageMax = document.documentElement.scrollHeight - window.innerHeight;
    });
    ro.observe(document.body);
    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div id="star-canvas" className="deep-space" ref={rootRef} aria-hidden="true">
      <div className="space-nebulae" ref={nebulaRef}>
        {/* Aurora ribbons (boilerlab-scroll.css, "Aurora"). */}
        <div className="space-aurora space-aurora-1" />
        <div className="space-aurora space-aurora-2" />
        <div className="space-aurora space-aurora-3" />
        <div className="space-aurora space-aurora-4" />
        <div className="space-aurora space-aurora-5" />
      </div>
      <div className="space-stars space-stars-far" ref={farRef} />
      <div className="space-stars space-stars-mid" ref={midRef} />
      <canvas className="space-stars-near" ref={canvasRef} />
    </div>
  );
}
