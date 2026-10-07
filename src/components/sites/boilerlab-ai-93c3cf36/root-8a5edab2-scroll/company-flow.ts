import { COMPANY_FLOW as C, type CompanyTextSchedule } from "./company-flow-config";

/**
 * The Company section's sphere × text flow (reference demo options 3 · 4 ·
 * 8 · 10 · 11). SharedMoon runs `step()` once per frame, in this order:
 *
 * 1. progress p: the page wheel-steps between snapped sections, so p is not
 *    scrubbed by scroll — entering a section plays a time-based timeline to
 *    that section's stop (backwards when going up; retargets mid-play)
 * 2. text state (inP / outP / w) → the two text blocks are rendered
 * 3. [8] guide path → the sphere's target position / scale
 * 4. [4] pulse and [3] focus → target scale, filter and glow
 * 5. [11] spring → final sphere position
 * 6. [10] camera pan from that final position → `cameraPan`, read by DeepSpace
 * 7. dark shade over the sphere at the T1 / T2 stops → `moonShade`, read by SharedMoon
 *
 * Outside the Company range it returns null and SharedMoon keeps its own
 * checkpoint scrub, so no other section changes. All numbers live in
 * company-flow-config.ts.
 */

/** The subset of SharedMoon's checkpoint state the flow reads and writes. */
export interface MoonState {
  cx: number;
  cy: number;
  w: number;
  o: number;
  bob: number;
  glow: number;
}

export interface FlowMoon extends MoonState {
  filter: string;
  glowScale: number;
}

/** Camera offset (px) the backdrop moves against; written every frame. */
export const cameraPan = { x: 0, y: 0 };

/**
 * The dark shade over the sphere (COMPANY_FLOW.shade): centre in viewport
 * px and opacity 0–1; written every frame, 0 outside the T1 / T2 stops.
 */
export const moonShade = { cx: 0, cy: 0, o: 0 };

/**
 * Shared with the page's wheel handler, which waits for the timeline: no
 * wheel steps on while it is still playing toward its stop (`busy`).
 */
export const companyFlowPlay: {
  /** The text stop (1 = T1, 2 = T2) the timeline is parked on, fully open; -1 while it plays. */
  parked: number;
  /** The timeline is still playing (or waiting out a hold) toward its stop, inside the Company range. */
  busy: boolean;
  /**
   * Set by the wheel handler at #numbers-users going down: T2 plays out
   * first, then `go` (the scroll to #numbers-air) runs, so AIR only shows
   * once the text is gone.
   * Cleared once the scroll has left #numbers-users.
   */
  leave: { go: () => void; fired: boolean } | null;
} = { parked: -1, busy: false, leave: null };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** 1 while section progress q is inside [lo, hi], easing to 0 over `fade` outside it (timeline.textGate). */
function gateAt(q: number, [lo, hi]: readonly [number, number], fade: number) {
  const out = q < lo ? lo - q : q > hi ? q - hi : 0;
  const u = clamp(1 - out / fade);
  return u * u * (3 - 2 * u);
}

/** Piecewise-linear lookup through the timeline keys (both columns ascend). */
function lookup(v: number, from: "p" | "t", to: "p" | "t") {
  const K = C.timeline.keys;
  if (v <= K[0][from]) return K[0][to];
  for (let i = 1; i < K.length; i++) {
    const a = K[i - 1];
    const b = K[i];
    if (v <= b[from]) return mix(a[to], b[to], (v - a[from]) / (b[from] - a[from] || 1));
  }
  return K[K.length - 1][to];
}
/** Seconds (at speed 1) of each stop on the timeline. */
const STOP_T = C.timeline.stops.map((p) => lookup(p, "p", "t"));
/** Seconds (at speed 1) at which T2 has fully left: the page may move on to AIR. */
const T2_GONE_T = lookup(C.text.t2.out1, "p", "t");
const USERS_STOP = 2;

/**
 * Playhead (s) → p through the same keys, but as a monotone cubic
 * (Fritsch–Carlson) instead of straight lines: p's speed changes at every
 * key, and linear joins made the sphere visibly lurch there (e.g. slowing
 * 40% mid-glide when T1's wipe begins). Still hits every key exactly.
 */
const progressOf = (() => {
  const K = C.timeline.keys;
  const n = K.length;
  const h = K.slice(1).map((b, i) => b.t - K[i].t);
  const dl = K.slice(1).map((b, i) => (b.p - K[i].p) / h[i]);
  const m = K.map((_, i) => (i === 0 ? dl[0] : i === n - 1 ? dl[n - 2] : dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (dl[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / dl[i];
    const b = m[i + 1] / dl[i];
    const r = a * a + b * b;
    if (r > 9) {
      const tau = 3 / Math.sqrt(r);
      m[i] = tau * a * dl[i];
      m[i + 1] = tau * b * dl[i];
    }
  }
  return (t: number) => {
    if (t <= K[0].t) return K[0].p;
    for (let i = 0; i < n - 1; i++) {
      if (t <= K[i + 1].t) {
        const u = (t - K[i].t) / h[i];
        const u2 = u * u;
        const u3 = u2 * u;
        return (
          (2 * u3 - 3 * u2 + 1) * K[i].p +
          (u3 - 2 * u2 + u) * h[i] * m[i] +
          (-2 * u3 + 3 * u2) * K[i + 1].p +
          (u3 - u2) * h[i] * m[i + 1]
        );
      }
    }
    return K[n - 1].p;
  };
})();

interface TextState {
  inP: number;
  outP: number;
  active: boolean;
  x: number;
  y: number;
  w: number;
}

function textState(p: number, sc: CompanyTextSchedule): TextState {
  const inP = seg(p, sc.in0, sc.in1);
  const outP = seg(p, sc.out0, sc.out1);
  const x = sc.x0 + sc.dx * easeOut(inP);
  const y = outP > 0 ? sc.y1 + (sc.y2 - sc.y1) * easeIn(outP) : sc.y0 + (sc.y1 - sc.y0) * ease(inP);
  return {
    inP,
    outP,
    active: p >= sc.in0 && p <= sc.out1,
    x,
    y,
    w: clamp(inP / C.text.visibleRamp) * (1 - ease(outP)),
  };
}

interface TextRig {
  id: "t1" | "t2";
  sc: CompanyTextSchedule;
  sectionId: string;
  textKey: string;
  block: HTMLElement | null;
  text: HTMLElement | null;
  /** Natural (untransformed) geometry: ink box in viewport coords (the block is fixed) + offsets inside the block. */
  nat: { inkLeft: number; inkTop: number; inkW: number; inkH: number; offL: number; offR: number; offT: number } | null;
  /** Phones: the text's resting vertical centre (px), just below the resting sphere. */
  restCy: number;
  written: string;
  shown: boolean;
}

export function createCompanyFlow() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.dataset.companyFlow = reduced ? "reduced" : "on";

  let S = 1;
  let cw = 0;
  let vh = 0;
  // Scroll anchors (px): p = 0, intro snap, users snap, air snap.
  const at = { start: 0, intro: 0, users: 0, air: 0 };
  let start: MoonState | null = null;
  /** Timeline: playhead (s at speed 1), the stop it heads for, when each stop was reached (ms). */
  const tl = { t: Number.NaN, stop: 0, reachedAt: [0, 0, 0, 0] };
  const spring = { on: false, cx: 0, cy: 0, w: 0, vx: 0, vy: 0, vw: 0 };
  /** Shade fade: current value, the fade's start value / target, seconds into it. */
  const shade = { v: 0, from: 0, to: 0, e: 0, dur: 1 };
  let camAmt = 0;
  const lastDesign = { x: 0, y: 0 };
  /** Phone layout (viewport narrower than COMPANY_FLOW.mobile.maxWidth). */
  let mobile = false;
  /** Guide path in px (built on measure): desktop from the design waypoints, phones from the mobile layout. */
  let wpsPx: { p: number; cx: number; cy: number; w: number }[] = [];

  const rigs: TextRig[] = [
    { id: "t1", sc: C.text.t1, sectionId: "numbers-intro", textKey: "numbers.intro.signoff", block: null, text: null, nat: null, restCy: 0, written: "", shown: true },
    { id: "t2", sc: C.text.t2, sectionId: "numbers-users", textKey: "numbers.users.eyebrow", block: null, text: null, nat: null, restCy: 0, written: "", shown: true },
  ];

  function snapTop(el: HTMLElement) {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    return Math.max(0, el.offsetTop - margin);
  }

  /** Re-reads layout; call on resize / layout change (never per frame). */
  function measure() {
    cw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    S = Math.min(window.innerWidth / C.design.width, window.innerHeight / C.design.height);
    mobile = window.innerWidth < C.mobile.maxWidth;
    root.dataset.companyFlowLayout = mobile ? "mobile" : "desktop";
    const intro = document.getElementById("numbers-intro");
    const users = document.getElementById("numbers-users");
    const air = document.getElementById("numbers-air");
    if (!intro || !users || !air) return false;
    at.intro = snapTop(intro);
    at.users = snapTop(users);
    at.air = snapTop(air);
    at.start = Math.max(0, at.intro - C.anchors.startVh * vh);

    for (const rig of rigs) {
      const block = document.getElementById(rig.sectionId)?.querySelector<HTMLElement>(".numbers-block") ?? null;
      const text = block?.querySelector<HTMLElement>(`[data-key="${rig.textKey}"]`) ?? null;
      rig.block = block;
      rig.nat = null;
      rig.written = "";
      if (!block || !text) continue;
      // Text size follows S (saved size = S 1, capped): read the base size
      // with the override off, then apply it before measuring the box.
      text.removeAttribute("data-cf-font");
      const base = parseFloat(getComputedStyle(text).fontSize) || 0;
      // Phones: never below the mobile floor (the box follows via k).
      const size = base * Math.min(S, C.text.maxFontScale);
      const k = base > 0 ? (mobile ? Math.max(size, C.mobile.minFont[rig.id]) : size) / base : 1;
      if (base > 0) {
        text.style.setProperty("--cf-font", `${(base * k).toFixed(2)}px`);
        text.setAttribute("data-cf-font", "");
      }
      // The box scales with the text, so lines break where they do at S = 1.
      block.style.setProperty("--cf-font-k", k.toFixed(4));
      rig.text = text;
      // The label above the line takes the line's saved offset (EditableText
      // __pos, an inline `translate`), so it stays right on top of it.
      const [lx = "0px", ly = "0px"] = (text.style.translate || "").split(/\s+/).filter(Boolean);
      block.style.setProperty("--cf-label-x", lx);
      block.style.setProperty("--cf-label-y", ly);
      // Read the natural box with the flow's transform off, then put it back
      // straight away (measure can run between a frame's writes and paint).
      const live = block.style.transform;
      block.style.transform = "";
      const b = block.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(text);
      const ink = range.getBoundingClientRect();
      const box = ink.width > 0 ? ink : text.getBoundingClientRect();
      block.style.transform = live;
      rig.nat = {
        inkLeft: box.left,
        inkTop: box.top,
        inkW: box.width,
        inkH: box.height,
        offL: box.left - b.left,
        offR: b.right - box.right,
        offT: box.top - b.top,
      };
    }
    buildPath();
    return true;
  }

  /** Guide path in px. Sizes are floored at minDiameter first; focus / pulse multiply later. */
  function buildPath() {
    const W = C.sphere.waypoints;
    if (!mobile) {
      wpsPx = W.map((w) => ({ p: w.p, ...toPx(w.x, w.y, w.s) }));
    } else {
      // Phones: rest above the centre; the "guide" dips to where each text
      // opens (its entry position, below the sphere) and comes back up.
      const M = C.mobile;
      const restCy = vh / 2 + M.restY * vh;
      const restW = toPx(0, 0, W[1].s).w;
      const sphereR = (restW * C.design.marbleVisibleShare * (1 + C.pulse.scale)) / 2;
      for (const rig of rigs) {
        if (rig.nat) rig.restCy = restCy + sphereR + M.textGap + rig.nat.inkH / 2;
      }
      const entry = (rig: TextRig) => rig.restCy + M.enterDy * vh;
      wpsPx = W.map((w, i) => {
        const size = toPx(0, 0, w.s).w;
        let cy = restCy;
        if (i === W.length - 1) cy = vh / 2 + M.endY * vh;
        else if (w.x !== 0 || w.y !== 0) cy = entry(w.p < C.text.t1.out1 ? rigs[0] : rigs[1]);
        return { p: w.p, cx: cw / 2, cy, w: size };
      });
    }
  }

  /** Scroll y → section progress q: 0 at the flow's start, 1/2/3 at the intro/users/air snap points. */
  function sectionAt(y: number) {
    const pts = [at.start, at.intro, at.users, at.air];
    if (y <= pts[0]) return 0;
    for (let k = 1; k < pts.length; k++) {
      if (y <= pts[k]) return k - 1 + (y - pts[k - 1]) / (pts[k] - pts[k - 1] || 1);
    }
    return pts.length - 1;
  }

  /** Which stop the timeline heads for: the next one as soon as a section is entered, either way. */
  function updateStop(q: number) {
    const T = C.timeline;
    const up = (k: number) => k + (k === 0 ? T.enterAt : T.stepAt); // leave stop k forward past this q
    const down = (k: number) => k - (k === 1 ? T.enterAt : T.stepAt); // leave stop k backward below this q
    const was = tl.stop;
    while (tl.stop < STOP_T.length - 1 && q > up(tl.stop)) tl.stop++;
    while (tl.stop > 0 && q < down(tl.stop)) tl.stop--;
    // A jump across several sections (footer nav) plays only the last leg.
    if (Math.abs(tl.stop - was) > 1 && !Number.isNaN(tl.t)) tl.t = STOP_T[tl.stop - Math.sign(tl.stop - was)];
  }

  /**
   * Moves the playhead toward its stop at `speed` s/s. A text stop (intro /
   * users) is only left once its text has been open for `hold` seconds.
   */
  function advance(dt: number, now: number, target: number) {
    if (tl.t === target) return;
    const dir = Math.sign(target - tl.t);
    let next = tl.t + dir * dt * C.speed;
    for (let k = 1; k < STOP_T.length - 1; k++) {
      const s = STOP_T[k];
      if (tl.t === s) {
        // Parked on a text stop: wait out the reading time first.
        if (now - tl.reachedAt[k] < (C.timeline.hold * 1000) / C.speed) return;
      } else if ((dir > 0 && tl.t < s && next >= s) || (dir < 0 && tl.t > s && next <= s)) {
        // Crossing a text stop: land on it and start its reading time.
        next = s;
        tl.reachedAt[k] = now;
      }
    }
    tl.t = dir > 0 ? Math.min(next, target) : Math.max(next, target);
  }

  const toPx = (x: number, y: number, s: number) => ({
    cx: cw / 2 + x * S,
    cy: vh / 2 + y * S,
    // Size floored at minDiameter (phones); position stays on S.
    w: Math.max(s * C.design.sphereBox * S, C.sphere.minDiameter) / C.design.marbleVisibleShare,
  });
  const toDesign = (st: { cx: number; cy: number; w: number }) => ({
    x: (st.cx - cw / 2) / S,
    y: (st.cy - vh / 2) / S,
    s: (st.w * C.design.marbleVisibleShare) / (C.design.sphereBox * S),
  });

  /** Scroll range the flow owns, and the sphere's state where it hands back. */
  function range() {
    const last = wpsPx[wpsPx.length - 1] ?? { cx: cw / 2, cy: vh / 2, w: 0 };
    return { start: at.start, end: at.air, endPx: { cx: last.cx, cy: last.cy, w: last.w } };
  }

  /** The moon's plain-scrub state at the flow's start (p = 0 departs from here). */
  function setStart(st: MoonState) {
    start = st;
  }

  /** Sphere target (px) on the guide path; p = 0 is wherever the hero left the moon. */
  function pathAt(p: number) {
    const s0 = start ? { cx: start.cx, cy: start.cy, w: start.w } : toPx(0, 222, 1);
    const wps = [{ p: 0, ...s0 }, ...wpsPx];
    if (p <= 0) return wps[0];
    for (let i = 1; i < wps.length; i++) {
      const b = wps[i];
      if (p <= b.p) {
        const a = wps[i - 1];
        const t = easeSine(clamp((p - a.p) / (b.p - a.p || 1)));
        return { cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t), w: mix(a.w, b.w, t) };
      }
    }
    return wps[wps.length - 1];
  }

  function renderText(rig: TextRig, st: TextState, gate: number) {
    const block = rig.block;
    const nat = rig.nat;
    if (!block || !nat) return;
    if (!st.active || gate <= 0.001) {
      if (rig.shown) {
        block.style.visibility = "hidden";
        rig.shown = false;
        rig.written = "";
      }
      return;
    }
    if (!rig.shown) {
      block.style.visibility = "visible";
      rig.shown = true;
    }
    const T = C.text;
    let leftTarget: number;
    let cy: number;
    if (mobile) {
      // Phones: centred under the sphere; enters from below, leaves slightly up.
      const M = C.mobile;
      leftTarget = cw / 2 - nat.inkW / 2;
      cy = reduced
        ? rig.restCy
        : st.outP > 0
          ? rig.restCy + M.exitDy * vh * easeIn(st.outP)
          : rig.restCy + M.enterDy * vh * (1 - ease(st.inP));
    } else {
      const x = reduced ? rig.sc.x0 + rig.sc.dx : st.x;
      const y = reduced ? rig.sc.y1 : st.y;
      leftTarget = cw / 2 + x * S;
      cy = vh / 2 + y * S;
    }
    const left = clamp(leftTarget, T.edgeMargin, Math.max(T.edgeMargin, cw - nat.inkW - T.edgeMargin));
    const tx = left - nat.inkLeft;
    const ty = cy - (nat.inkTop + nat.inkH / 2);

    let mask = "none";
    let opacity = (1 - T.exitFade * st.outP) * gate;
    let g = 0;
    let t = 0;
    let echo = 0;
    if (reduced) {
      opacity = st.w * gate;
    } else {
      // [4] Opens from the sphere's side; closes back into it on the way out.
      const rp = (st.outP > 0 ? 1 - ease(st.outP) : easeOut(st.inP)) * T.wipeOvershoot;
      // Phones wipe top → bottom (the sphere is above); desktop sideways.
      const dir = mobile ? C.mobile.wipe : rig.sc.wipe;
      const off = mobile ? nat.offT : rig.sc.wipe === "to left" ? nat.offR : nat.offL;
      const len = mobile ? nat.inkH : nat.inkW;
      const solid = off + (rp - T.wipeFeather / 100) * len;
      const clear = off + rp * len;
      mask = `linear-gradient(${dir}, #000 ${solid.toFixed(1)}px, transparent ${clear.toFixed(1)}px)`;
      g = st.outP > 0 ? ease(st.outP) : 1 - seg(st.inP, T.coolFrom, 1);
      // Existing echo trail (`--t` text-shadows), driven by the demo's curve.
      const inten = Math.max(Math.sin(Math.PI * st.inP) * (st.outP > 0 ? 0 : 1), Math.min(1, st.outP * T.echoOutRamp));
      const gap = T.echoGap * S * (1 + T.echoGrowth * st.outP);
      t = gap / 0.3; // first trail shadow sits at 0.3 × --t px
      echo = inten * T.echoStrength; // trail strength (scales the shadows' alpha)
    }
    // The label fades with the line's visible weight (in by the open, out on the way out).
    const label = st.w;
    const key = `${tx.toFixed(1)}|${ty.toFixed(1)}|${mask}|${opacity.toFixed(3)}|${g.toFixed(3)}|${t.toFixed(1)}|${echo.toFixed(3)}|${label.toFixed(3)}`;
    if (key === rig.written) return;
    rig.written = key;
    block.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    block.style.setProperty("-webkit-mask-image", mask);
    block.style.maskImage = mask;
    block.style.opacity = opacity.toFixed(3);
    block.style.setProperty("--cf-g", g.toFixed(3));
    block.style.setProperty("--cf-glow-a", (T.glowAlpha * g).toFixed(3));
    block.style.setProperty("--cf-glow-r", `${(T.glowRadius * S).toFixed(1)}px`);
    block.style.setProperty("--t", t.toFixed(1));
    block.style.setProperty("--cf-echo", echo.toFixed(3));
    block.style.setProperty("--cf-label", label.toFixed(3));
  }

  /**
   * One frame. `rawY` is window.scrollY; `baseAt` is SharedMoon's plain
   * checkpoint scrub. Returns the moon's state inside (and just around) the
   * Company range, or null where SharedMoon's own scrub applies unchanged.
   */
  function step(dt: number, rawY: number, baseAt: (y: number) => MoonState | null): FlowMoon | null {
    const pad = C.spring.edgeVh * vh;
    const nearRange = rawY >= at.start - pad && rawY <= at.air + pad;

    // 1. Timeline progress. Away from the flow (or on first run / reduced
    // motion) the playhead jumps to its stop, so coming back never replays.
    const q = sectionAt(rawY);
    updateStop(q);
    const now = performance.now();
    // Leaving #numbers-users: play to "T2 gone" first, then hand the scroll over.
    const leave = companyFlowPlay.leave;
    if (leave && tl.stop !== USERS_STOP) companyFlowPlay.leave = null;
    const leaving = companyFlowPlay.leave !== null;
    const playTo = leaving ? T2_GONE_T : STOP_T[tl.stop];
    if (Number.isNaN(tl.t) || !nearRange || reduced) {
      tl.t = STOP_T[tl.stop];
      tl.reachedAt.fill(0);
    } else {
      advance(dt, now, playTo);
    }
    if (leave && leaving && !leave.fired && (tl.t >= T2_GONE_T || reduced || !nearRange)) {
      leave.fired = true;
      leave.go();
    }
    companyFlowPlay.parked = !nearRange ? -1 : tl.t === STOP_T[1] ? 1 : tl.t === STOP_T[2] ? 2 : -1;
    companyFlowPlay.busy = nearRange && (tl.t !== playTo || (companyFlowPlay.leave !== null && !companyFlowPlay.leave.fired));
    const p = progressOf(tl.t);

    // 2. Text.
    const s1 = textState(p, C.text.t1);
    const s2 = textState(p, C.text.t2);
    // Safety net by scroll position, whatever the timeline is doing (a
    // throttled / stalled frame loop, an odd scroll path): a text is only
    // ever shown while the page is near its own section — T1 around
    // #numbers-intro (it starts entering at q 0.5, from #mission), T2
    // around #numbers-users — and fades out by scroll beyond that, so AIR
    // (q 3) can never appear under a leftover T2.
    const G = C.timeline.textGate;
    const g1 = gateAt(q, G.t1, G.fade);
    const g2 = gateAt(q, G.t2, G.fade);
    renderText(rigs[0], s1, g1);
    renderText(rigs[1], s2, g2);
    s1.w *= g1;
    s2.w *= g2;

    const inRange = rawY >= at.start && rawY <= at.air;
    const steps60 = dt * C.spring.stepHz;

    // 6 (off-range part). The pan eases back to zero outside the flow.
    const camTarget = inRange && !reduced ? 1 : 0;
    camAmt += (camTarget - camAmt) * (1 - (1 - C.camera.smoothing) ** steps60);
    if (Math.abs(camTarget - camAmt) < 0.001) camAmt = camTarget;

    if (!nearRange) {
      spring.on = false;
      Object.assign(shade, { v: 0, from: 0, to: 0, e: 0 });
      moonShade.o = 0;
      cameraPan.x = lastDesign.x * S * C.camera.amount * camAmt;
      cameraPan.y = (lastDesign.y - C.camera.yOffset) * S * C.camera.amount * camAmt;
      return null;
    }

    // 3. Guide path (inside the range) or the plain scrub (in the hand-back margins).
    let target: FlowMoon;
    if (inRange) {
      const px = pathAt(p);
      // 4. Pulse [4] and focus [3].
      const w = Math.max(s1.active ? s1.w : 0, s2.active ? s2.w : 0);
      let pulse = 0;
      for (const st of [s1, s2]) {
        if (st.active) pulse = Math.max(pulse, Math.sin(Math.PI * seg(st.inP, 0, C.pulse.inSpan)), Math.sin(Math.PI * st.outP));
      }
      const F = C.focus;
      const blend = seg(p, 0, C.sphere.introBlend);
      const s0 = start ?? { o: 1, glow: F.glowBase, bob: 0 };
      const focusGlow = clamp(F.glowBase * (1 - F.glowDim * w) + F.glowPulse * pulse);
      target = {
        cx: px.cx,
        cy: px.cy,
        // Floor already applied to the base size (buildPath); focus and pulse
        // multiply on top, so a floored 120px sphere steps back to ~103px.
        w: px.w * (1 - F.scale * w) * (1 + C.pulse.scale * pulse),
        o: mix(s0.o, C.sphere.opacity, blend),
        bob: mix(s0.bob, 0, blend),
        glow: mix(s0.glow, focusGlow, blend),
        filter:
          w > 0.002
            ? `${reduced ? "" : `blur(${(F.blur * w).toFixed(2)}px) `}brightness(${(1 - F.brightness * w).toFixed(3)}) saturate(${(1 - F.saturate * w).toFixed(3)})`
            : "none",
        glowScale: 1 + C.pulse.glowScale * pulse,
      };
    } else {
      const base = baseAt(rawY);
      if (!base) return null;
      target = { ...base, filter: "none", glowScale: 1 };
    }

    // 5. Spring [11]. Tuned per 60 Hz step; integrated in fractional steps
    // (s = dt × 60, ≤ ¼ step each) so it moves on every frame at any refresh
    // rate — whole 60 Hz steps froze it on every 2nd frame at 120 Hz.
    if (!spring.on || reduced) {
      Object.assign(spring, { on: true, cx: target.cx, cy: target.cy, w: target.w, vx: 0, vy: 0, vw: 0 });
    } else {
      const { stiffness: k, damping: d } = C.spring;
      const steps = Math.min(dt, 0.25) * C.spring.stepHz;
      const n = Math.max(1, Math.ceil(steps * 4));
      const s = steps / n;
      const ks = k * s;
      const ds = d ** s;
      for (let i = 0; i < n; i++) {
        spring.vx = (spring.vx + (target.cx - spring.cx) * ks) * ds;
        spring.vy = (spring.vy + (target.cy - spring.cy) * ks) * ds;
        spring.vw = (spring.vw + (target.w - spring.w) * ks) * ds;
        spring.cx += spring.vx * s;
        spring.cy += spring.vy * s;
        spring.w += spring.vw * s;
      }
    }

    // Hand back to the plain scrub across the margins either side.
    const fade = rawY < at.start ? seg(rawY, at.start, at.start - pad) : rawY > at.air ? seg(rawY, at.air, at.air + pad) : 0;
    const raw = fade > 0 ? baseAt(rawY) : null;
    const out: FlowMoon = {
      ...target,
      cx: raw ? mix(spring.cx, raw.cx, fade) : spring.cx,
      cy: raw ? mix(spring.cy, raw.cy, fade) : spring.cy,
      w: raw ? mix(spring.w, raw.w, fade) : spring.w,
    };

    // 7. Shade: only once the sphere has really stopped at T1 / T2 — the
    // timeline parked on that stop (the hold keeps it there until it leaves)
    // and the spring settled on its target, which lags the timeline by a
    // second or so. Off the moment the timeline leaves the stop. Once on it
    // stays on while parked (no flicker from the spring's last wobble).
    const SH = C.shade;
    const parked = inRange && !leaving && (tl.t === STOP_T[1] || tl.t === STOP_T[2]);
    const settled =
      Math.hypot(target.cx - spring.cx, target.cy - spring.cy) < SH.settlePx &&
      Math.abs(target.w - spring.w) < SH.settlePx &&
      Math.hypot(spring.vx, spring.vy, spring.vw) < SH.settleSpeed;
    const want = parked && (shade.to === 1 || settled) ? 1 : 0;
    if (want !== shade.to) {
      Object.assign(shade, { from: shade.v, to: want, e: 0, dur: reduced ? SH.reducedFade : want ? SH.fadeIn : SH.fadeOut });
    }
    if (shade.v !== shade.to) {
      shade.e += dt;
      const u = clamp(shade.e / shade.dur);
      shade.v = u >= 1 ? shade.to : mix(shade.from, shade.to, easeOut(u));
    }
    moonShade.cx = out.cx;
    moonShade.cy = out.cy;
    moonShade.o = shade.v;

    // 6. Camera pan [10] from the sphere's final position.
    const d = toDesign({ cx: spring.cx, cy: spring.cy, w: spring.w });
    lastDesign.x = d.x;
    lastDesign.y = d.y;
    cameraPan.x = d.x * S * C.camera.amount * camAmt;
    cameraPan.y = (d.y - C.camera.yOffset) * S * C.camera.amount * camAmt;
    return out;
  }

  function destroy() {
    delete root.dataset.companyFlow;
    delete root.dataset.companyFlowLayout;
    cameraPan.x = 0;
    cameraPan.y = 0;
    moonShade.o = 0;
    companyFlowPlay.leave = null;
    companyFlowPlay.parked = -1;
    companyFlowPlay.busy = false;
    for (const rig of rigs) {
      const b = rig.block;
      if (!b) continue;
      b.style.transform = "";
      b.style.removeProperty("-webkit-mask-image");
      b.style.maskImage = "";
      b.style.opacity = "";
      b.style.visibility = "";
      for (const v of ["--cf-g", "--cf-glow-a", "--cf-glow-r", "--t", "--cf-echo", "--cf-font-k", "--cf-label", "--cf-label-x", "--cf-label-y"]) b.style.removeProperty(v);
      rig.text?.removeAttribute("data-cf-font");
      rig.text?.style.removeProperty("--cf-font");
    }
  }

  return { measure, range, setStart, step, destroy };
}

export type CompanyFlow = ReturnType<typeof createCompanyFlow>;
