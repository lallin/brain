"use client";

// Particle orb — ported from the supplied revocal-orb-particles-scroll-v3.html
// (frame-measured against the reference clip). Same props as MagicMarble so it
// drops into ContactsMoon / FerrisSphere: the page still moves, scales and
// recolours the box; this only draws the sphere inside it.
//
// - glow: radial colour profile = C*GLOW_C(r) + P*GLOW_P(r); C = main colour,
//   P = pale hot core (hue +22deg, 62% white), out to 2.2R.
// - dots: ~290 near-white dots (68% on a 0.83~1.0R shell, 32% scattered
//   1~1.88R) plus ~300 faint dust dots inside; back half dimmed to ~10%.
// - motion: the cloud turns about the vertical axis, dots drift in latitude,
//   wobble and twinkle; the ball breathes +-2%.
// Canvas 2D, one drawImage per dot from a pre-baked Gaussian atlas, additive
// blending. The canvas is twice the box so the glow and outer dots aren't
// cut at the box edge; the visible sphere matches MagicMarble's `sizePercent`.
import { useEffect, useRef } from "react";

type ParticleOrbProps = {
  palette: string[];
  sizePercent?: number;
  /** Live colour read every frame (SharedMoon's scroll-scrubbed pigment). */
  colorSource?: { readonly current: string | null };
  /** A change of `id` spins the cloud up briefly (FerrisSphere card change). */
  kick?: { id: number; radians: number };
  /** Accepted for MagicMarble compatibility; colours always blend in RGB. */
  core?: string;
  colorBlend?: "hsl" | "rgb";
  className?: string;
};

const TAU = Math.PI * 2;
const MAX_DPR = 1.5;
const SP = 32;
const STEPS = 48;
const MS = 14;
const DS = 4;
const COUNT = 290;
const DUST_RATIO = 300 / 290;
const SIG_REF = 50; // clip px per radius
const OM = 0.28;
const WA = 0.045;
const TW = 0.37;
// Measured glow profile, r = 0, .1R ... 2.2R.
const GLOW_C = [0.194, 0.355, 0.502, 0.609, 0.649, 0.636, 0.593, 0.549, 0.512, 0.463, 0.374, 0.289, 0.228, 0.18, 0.143, 0.121, 0.099, 0.077, 0.055, 0.037, 0.021, 0.01, 0];
const GLOW_P = [0.725, 0.545, 0.365, 0.194, 0.076, 0.018, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

type RGB = [number, number, number];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function parseColor(c: string | null | undefined, fallback: RGB): RGB {
  if (!c) return fallback;
  const hex = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (hex) return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)];
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(c);
  return rgb ? [+rgb[1], +rgb[2], +rgb[3]] : fallback;
}

function hueShift(c: RGB, deg: number): RGB {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [c[0], c[1], c[2]];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6;
  h = (((h + deg / 360) % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Seeded, so every orb shows the same cloud.
function buildParticles() {
  const r = rng(0x18), q = rng(0x2a);
  const NM = COUNT, ND = Math.round(NM * DUST_RATIO);
  const Mp = new Float32Array(NM * MS);
  for (let i = 0; i < NM; i++) {
    const j = i * MS, outer = r() > 0.684;
    Mp[j] = outer ? 1 + 0.876 * Math.pow(r(), 1.5) : 0.83 + 0.17 * r(); // radius
    Mp[j + 1] = Math.asin(2 * r() - 1);
    Mp[j + 5] = r() * TAU; // latitude / longitude
    Mp[j + 2] = 0.12 + 0.25 * r();
    Mp[j + 3] = 0.25 + 0.3 * r();
    Mp[j + 4] = r() * TAU; // latitude drift amp / freq / phase
    Mp[j + 6] = 2.4 + 1.6 * r();
    Mp[j + 7] = r() * TAU;
    Mp[j + 8] = 2.4 + 1.6 * r();
    Mp[j + 9] = r() * TAU; // screen wobble
    Mp[j + 10] = 117.8 * Math.pow(r(), 4); // peak brightness (0-255)
    Mp[j + 11] = 1.8 + 1.6 * r();
    Mp[j + 12] = r() * TAU; // twinkle
    let n = 0;
    for (let k = 0; k < 6; k++) n += r();
    Mp[j + 13] = 1.13 * Math.exp(0.186 * (n - 3) * 1.414); // sigma in clip px
  }
  const Dp = new Float32Array(ND * DS);
  for (let i = 0; i < ND; i++) {
    const j = i * DS;
    Dp[j] = 1.014 * Math.cbrt(q());
    Dp[j + 1] = Math.asin(2 * q() - 1);
    Dp[j + 2] = q() * TAU;
    Dp[j + 3] = 6.05 * (0.4 + 0.6 * q());
  }
  return { NM, ND, Mp, Dp };
}

export default function ParticleOrb({ palette, sizePercent = 64, colorSource, kick, className }: ParticleOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ palette, sizePercent, colorSource, spin: 0 });
  useEffect(() => {
    live.current.palette = palette;
    live.current.sizePercent = sizePercent;
    live.current.colorSource = colorSource;
  }, [palette, sizePercent, colorSource]);

  const kickId = kick?.id;
  useEffect(() => {
    if (kickId) live.current.spin = 1;
  }, [kickId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { NM, ND, Mp, Dp } = buildParticles();

    const atlas = document.createElement("canvas");
    atlas.width = SP * STEPS;
    atlas.height = SP;
    const actx = atlas.getContext("2d")!;
    const spr = document.createElement("canvas");
    spr.width = spr.height = SP;
    const sctx = spr.getContext("2d")!;
    const glow = document.createElement("canvas");
    glow.width = glow.height = 256;
    const gctx = glow.getContext("2d")!;
    let bakedKey = "";
    function bake(C: RGB) {
      const key = (C[0] | 0) + "," + (C[1] | 0) + "," + (C[2] | 0);
      if (key === bakedKey) return;
      bakedKey = key;
      const W: RGB = [255, 255, 255], P = mix(hueShift(C, 22), W, 0.62), dot = mix(C, W, 0.85);
      const r = SP / 2, g = sctx.createRadialGradient(r, r, 0, r, r, r);
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        g.addColorStop(t, `rgba(${dot[0] | 0},${dot[1] | 0},${dot[2] | 0},${Math.exp(-4.5 * t * t) * (i < 10 ? 1 : 0)})`);
      }
      sctx.clearRect(0, 0, SP, SP);
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SP, SP);
      actx.clearRect(0, 0, atlas.width, atlas.height);
      for (let k = 0; k < STEPS; k++) {
        const s = (k + 1) / STEPS;
        actx.globalAlpha = s * s;
        actx.drawImage(spr, k * SP, 0);
      }
      actx.globalAlpha = 1;
      const gg = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      // The reference drew this on black, where an opaque rgb() ramp is pure
      // added light. Over the site's own background that opaque dark rim
      // shows as a black disc, so each stop is written as the same light
      // with alpha: alpha = brightest channel, colour = light / alpha.
      GLOW_C.forEach((a, i) => {
        const b = GLOW_P[i];
        const v = [0, 1, 2].map((c) => clamp(C[c] * a + P[c] * b, 0, 255));
        const m = Math.max(v[0], v[1], v[2]);
        const al = m / 255;
        const s = m > 0 ? 255 / m : 0;
        gg.addColorStop(i / 22, `rgba(${(v[0] * s) | 0},${(v[1] * s) | 0},${(v[2] * s) | 0},${al.toFixed(4)})`);
      });
      gctx.clearRect(0, 0, 256, 256);
      gctx.fillStyle = gg;
      gctx.beginPath();
      gctx.arc(128, 128, 128, 0, TAU);
      gctx.fill();
    }

    let color = parseColor(live.current.colorSource?.current ?? live.current.palette[0], [113, 75, 255]);
    let t = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(canvas!.clientWidth * dpr), h = Math.round(canvas!.clientHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    function render() {
      const L = live.current;
      const W = canvas!.width, H = canvas!.height;
      // The canvas is 2x the box: the visible sphere (1R) spans sizePercent of the box.
      const cx = W / 2, cy = H / 2;
      const R = (Math.min(W, H) / 4) * (L.sizePercent / 100) * (1 + 0.02 * Math.sin(0.53 * t) + 0.008 * Math.sin(1.9 * t + 1));
      bake(color);
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, W, H);
      ctx!.globalCompositeOperation = "lighter";
      const gd = R * 4.4;
      ctx!.drawImage(glow, cx - gd / 2, cy - gd / 2, gd, gd);

      // Dot size follows the sphere up to the reference's own sphere size
      // (19% of the shorter viewport side), then stays put: on the big hero
      // moon, dots scaled with R turn into soft blobs.
      const refR = Math.min(window.innerWidth, window.innerHeight) * 0.19 * Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const k = (Math.min(R, refR) / SIG_REF) * 6;
      const rot = -OM * t;
      for (let n = 0, j = 0; n < NM; n++, j += MS) {
        const lat = Mp[j + 1] + Mp[j + 2] * Math.sin(Mp[j + 3] * t + Mp[j + 4]), lon = Mp[j + 5] + rot, rho = Mp[j];
        const c = Math.cos(lat) * rho, z = c * Math.cos(lon);
        const x = c * Math.sin(lon) + WA * Math.sin(Mp[j + 6] * t + Mp[j + 7]);
        const y = rho * Math.sin(lat) + WA * Math.sin(Mp[j + 8] * t + Mp[j + 9]);
        const dep = z <= -0.35 ? 0.099 : z >= 0.35 ? 1 : 0.099 + (0.901 * (z + 0.35)) / 0.7;
        const a = (Mp[j + 10] * dep * (1 + TW * Math.sin(Mp[j + 11] * t + Mp[j + 12]))) / 255;
        const ai = Math.round(Math.sqrt(a) * STEPS) - 1;
        if (ai < 0) continue;
        const d = Mp[j + 13] * k;
        ctx!.drawImage(atlas, Math.min(ai, STEPS - 1) * SP, 0, SP, SP, cx + x * R - d * 0.5, cy - y * R - d * 0.5, d, d);
      }
      const dd = 0.6 * k;
      for (let n = 0, j = 0; n < ND; n++, j += DS) {
        const lat = Dp[j + 1], lon = Dp[j + 2] + rot, c = Math.cos(lat) * Dp[j], z = c * Math.cos(lon);
        const dep = z <= -0.35 ? 0.099 : z >= 0.35 ? 1 : 0.099 + (0.901 * (z + 0.35)) / 0.7;
        const ai = Math.round(Math.sqrt((Dp[j + 3] * dep) / 255) * STEPS) - 1;
        if (ai < 0) continue;
        ctx!.drawImage(atlas, ai * SP, 0, SP, SP, cx + c * Math.sin(lon) * R - dd * 0.5, cy - Dp[j] * Math.sin(lat) * R - dd * 0.5, dd, dd);
      }
    }

    let raf = 0, last = 0, onScreen = true;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.06));
      last = now;
      const L = live.current;
      // Ease toward the live colour (scroll-scrubbed) or the palette colour.
      const want = parseColor(L.colorSource?.current ?? L.palette[0], color);
      color = mix(color, want, 1 - Math.exp(-dt * 8));
      // A kick spins the cloud up, then settles.
      t += dt * (1 + 2.5 * L.spin);
      L.spin *= Math.exp(-dt * 2.6);
      resize();
      render();
    }
    const start = () => {
      if (!raf && onScreen && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    // Paused while off screen (or hidden by opacity/visibility upstream).
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(canvas);
    start();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className={className} aria-hidden="true" style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", left: "-50%", top: "-50%", width: "200%", height: "200%", pointerEvents: "none", display: "block" }}
      />
    </div>
  );
}
