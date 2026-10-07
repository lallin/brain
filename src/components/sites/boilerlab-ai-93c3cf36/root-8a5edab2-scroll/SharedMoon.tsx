"use client";

import { useEffect, useRef, useState } from "react";
import { cancelFrame, frame as frameLoop, motion, useMotionValue, useTransform, type FrameData, type MotionValue } from "framer-motion";
import ContactsMoon from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ContactsMoon";
import { getEditedPosition, getEditedWidth } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/storage";
import { measureFerrisHandoff } from "./ferris-handoff";
import { createCompanyFlow, moonShade, type CompanyFlow } from "./company-flow";
import { COMPANY_FLOW } from "./company-flow-config";
import { subscribeFrameView, view } from "./frame-sync";
import { FERRIS_ENTRY_GLAZE, FERRIS_EXIT_GLAZE } from "./ProductsFerrisScroll";

/**
 * The one green moon for the whole page: hero → numbers → (parked) →
 * contacts. It used to be three instances (HeroSlideScroll's own, which
 * shrank and dropped out of frame, a separate fixed numbers orb that faded
 * in, and ContactsSlide's own), so scrolling showed one leave and another
 * arrive. Now a single `ContactsMoon` stays
 * mounted in a fixed wrapper, and only that wrapper's translate / scale /
 * opacity follow the scroll — the marble's own canvas/shader/colors are
 * untouched.
 *
 * Checkpoints are the looks each section already had (measured, not
 * re-designed): the hero, which opens on the Contacts moon (same size and
 * spot, by request), the
 * numbers orb path from the "Design® — 3D glass orb" reference, and the
 * contacts moon's saved size/offset (`contacts.moon` edits; centered on the
 * section's bottom edge). Through AIR and Excellence / Partner it waits as a
 * small, dim dome at the bottom center so it never vanishes and stays out of
 * those sections' way. At Solutions it grows into FerrisSphere's exact size,
 * position and entry color and hands over to it (and takes back over at the
 * end) — see ferris-handoff.ts for why that one stays a separate instance.
 * Between
 * checkpoints everything is a straight linear scrub on the raw window
 * `scrollY`, applied from one rAF loop. Through Company (numbers-intro /
 * numbers-users) the moon is driven by company-flow.ts instead — guide path,
 * pulse, focus, spring and camera pan (all numbers in company-flow-config.ts).
 */

const HERO_ID = "hero.moon";

// The old numbers-intro orb state (offset from screen centre as a fraction
// of half the viewport, size relative to the numbers orb's base width). The
// Company flow now owns that stretch; this only shapes the hero → flow
// hand-over so the hero's own motion is unchanged.
const INTRO = { x: 0, y: 0, s: 0.95 };
const NUMBERS_OPACITY = 0.55;
// Between #numbers-users and #contacts: a small dim dome peeking up from the
// bottom edge (width relative to the numbers orb's base width; how far its
// center sits below the bottom edge, as a fraction of its width).
const PARK = { s: 0.75, sink: 0.25, o: 0.35 };
// Scroll distance (in viewports) over which it glides users → park, and at
// least this far past the end of the Company flow.
const PARK_AFTER_VH = 0.9;
const PARK_AFTER_FLOW_VH = 0.6;
// The moon's own pigment color (ContactsMoon's palette[0]).
const MOON_COLOR = "#47e520";
// Both marbles fill a fixed share of their box (MagicMarble `sizePercent`):
// the moon 64, FerrisSphere 78 — so matching the visible sphere means a
// moon box 78/64 the size of FerrisSphere's.
const FERRIS_TO_MOON_BOX = 78 / 64;
// Atmosphere glow per state: brightest as the hero's centerpiece, softer
// through the numbers, faint while parked, off while it turns into
// FerrisSphere (a green halo there would give the handoff away).
const GLOW = { hero: 0.9, numbers: 0.75, park: 0.45, contacts: 1 };

interface Checkpoint {
  at: number; // scrollY
  cx: number; // marble center, viewport px
  cy: number;
  w: number; // marble width, px
  o: number; // wrapper opacity
  bob: number; // 0 = still (hero), 1 = gentle bob (numbers)
  rgb: [number, number, number]; // pigment color
  glow: number; // atmosphere glow strength (0..1), see .shared-moon's --moon-glow
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function numbersBaseWidth(): number {
  // Same as the old `.numbers-orb .contacts-marble` rule.
  return window.matchMedia("(width <= 760px)").matches
    ? Math.min(window.innerWidth * 0.6, 256)
    : Math.min(window.innerWidth * 0.3, 320);
}

function contactsDefaultWidth(): number {
  // Same as `.contacts-moon.contacts-marble` in boilerlab.css.
  return window.matchMedia("(width <= 760px)").matches
    ? Math.min(window.innerWidth * 1.04, 544)
    : Math.min(window.innerWidth * 0.76, 1152);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Checkpoint state at scroll `y` between checkpoints `a` and `b` (linear, clamped). */
function interpolate(a: Checkpoint, b: Checkpoint, y: number): Checkpoint {
  const t = b.at > a.at ? Math.min(1, Math.max(0, (y - a.at) / (b.at - a.at))) : 1;
  return {
    at: y,
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    w: lerp(a.w, b.w, t),
    o: lerp(a.o, b.o, t),
    bob: lerp(a.bob, b.bob, t),
    glow: lerp(a.glow, b.glow, t),
    rgb: [lerp(a.rgb[0], b.rgb[0], t), lerp(a.rgb[1], b.rgb[1], t), lerp(a.rgb[2], b.rgb[2], t)],
  };
}

export function SharedMoon({ contactsArriving = false }: { contactsArriving?: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const flowRef = useRef<CompanyFlow | null>(null);
  const heroRef = useRef({ w: 1, px: 0, py: 0 });

  // Recomputes all transforms when layout (not scroll) changes — resize,
  // or the hero moon being resized/moved with its edit handles.
  const layoutTick = useMotionValue(0);

  useEffect(() => {
    const flow = createCompanyFlow();
    flowRef.current = flow;
    function measure() {
      const wrap = wrapRef.current;
      const marble = wrap?.querySelector<HTMLElement>(".contacts-marble");
      const intro = document.getElementById("numbers-intro");
      const users = document.getElementById("numbers-users");
      const mission = document.getElementById("mission");
      const contacts = document.getElementById("contacts");
      const ferrisOuter = document.querySelector<HTMLElement>(".ferris-scroll-outer");
      const ferrisFrame = ferrisOuter?.querySelector<HTMLElement>(".ferris-content");
      const ferrisSphere = ferrisOuter?.querySelector<HTMLElement>(".ferris-sphere");
      if (!marble || !intro || !users || !mission || !contacts || !ferrisOuter || !ferrisFrame || !ferrisSphere) return;

      const cw = document.documentElement.clientWidth; // the fixed wrapper's width (no scrollbar)
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const pos = getEditedPosition(HERO_ID) ?? { dx: 0, dy: 0 };
      // offsetWidth is the layout width — unaffected by this wrapper's scale.
      heroRef.current = { w: marble.offsetWidth, px: pos.dx, py: pos.dy };
      const base = numbersBaseWidth();
      const numbers = (p: { x: number; y: number; s: number }) => ({
        cx: cw / 2 + (p.x * vw) / 2,
        cy: vh / 2 + (p.y * vh) / 2,
        w: base * p.s,
      });
      const i = numbers(INTRO);
      const parkW = base * PARK.s;
      const moonRgb = hexToRgb(MOON_COLOR);
      const park = { cx: cw / 2, cy: vh + parkW * PARK.sink, w: parkW, o: PARK.o, bob: 0, rgb: moonRgb, glow: GLOW.park };
      // FerrisSphere where its sticky frame is settled: its offset inside the
      // frame is the same at any scroll, and settled means frame top = 0.
      const fr = ferrisFrame.getBoundingClientRect();
      const sr = ferrisSphere.getBoundingClientRect();
      const ferris = {
        cx: sr.left + sr.width / 2,
        cy: sr.top + sr.height / 2 - fr.top,
        w: sr.width * FERRIS_TO_MOON_BOX,
        // Its own CSS opacity (0.6 on phones), without the handoff factor.
        o: window.matchMedia("(width <= 760px)").matches ? 0.6 : 1,
        bob: 0,
      };
      const { hin, hout, delta } = measureFerrisHandoff(ferrisOuter);
      const entryRgb = hexToRgb(FERRIS_ENTRY_GLAZE);
      const exitRgb = hexToRgb(FERRIS_EXIT_GLAZE);
      // While the frame slides in/out it moves 1:1 with scroll, so the
      // moon's target tracks it: settled cy ± the remaining distance.
      const atFerris = (at: number, o: number, rgb: [number, number, number]) => ({
        at,
        ...ferris,
        cy: ferris.cy + (at < hin ? hin - at : at > hout ? hout - at : 0),
        o,
        rgb,
        glow: 0,
      });
      // Contacts is the last section: at the page's end its bottom edge is
      // the viewport's bottom edge, where its moon is centered.
      const maxScroll = document.documentElement.scrollHeight - vh;
      const contactsAt = Math.min(contacts.offsetTop, maxScroll);
      const cpos = getEditedPosition("contacts.moon") ?? { dx: 0, dy: 0 };
      const contactsW = getEditedWidth("contacts.moon") ?? contactsDefaultWidth();
      // The hero opens on the same moon as Contacts (size and position — a
      // dome rising from the bottom centre), per the user's request.
      const heroCp: Checkpoint = { at: mission.offsetTop, cx: cw / 2 + cpos.dx, cy: vh + cpos.dy, w: contactsW, o: 1, bob: 0, rgb: moonRgb, glow: GLOW.hero };
      const introCp: Checkpoint = { at: intro.offsetTop, ...i, o: NUMBERS_OPACITY, bob: 1, rgb: moonRgb, glow: GLOW.numbers };
      // Company flow: the hero scrub runs exactly as before up to the flow's
      // start, the flow drives the moon in between, and the scrub resumes
      // from the flow's end state.
      flow.measure();
      const span = flow.range();
      const flowStart = interpolate(heroCp, introCp, span.start);
      const flowEnd: Checkpoint = { at: span.end, ...span.endPx, o: 1, bob: 0, rgb: moonRgb, glow: GLOW.numbers };
      flow.setStart(flowStart);
      const parkedAt = Math.max(users.offsetTop + PARK_AFTER_VH * vh, span.end + PARK_AFTER_FLOW_VH * vh);
      checkpointsRef.current = [
        heroCp,
        flowStart,
        flowEnd,
        { at: parkedAt, ...park },
        // AIR → Solutions: grow from the dome into FerrisSphere (size,
        // position, color) while the section slides up, then hand over.
        { at: Math.max(parkedAt, hin - vh), ...park },
        atFerris(hin - 2 * delta, ferris.o, entryRgb),
        atFerris(hin - delta, ferris.o, entryRgb),
        atFerris(hin, 0, entryRgb),
        // Hidden under FerrisSphere through the cards; take back over at the end.
        atFerris(hout, 0, exitRgb),
        atFerris(hout + delta, ferris.o, exitRgb),
        atFerris(hout + 2 * delta, ferris.o, exitRgb),
        { at: hout + vh, ...park },
        { at: Math.max(hout + vh, contactsAt - vh), ...park },
        { at: contactsAt, cx: cw / 2 + cpos.dx, cy: vh + cpos.dy, w: contactsW, o: 1, bob: 0, rgb: moonRgb, glow: GLOW.contacts },
      ];
      layoutTick.set(layoutTick.get() + 1);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const marble = wrapRef.current?.querySelector<HTMLElement>(".contacts-marble");
    if (marble) ro.observe(marble); // hero moon resized via its handle
    window.addEventListener("resize", measure);
    // The hero moon's move handle saves its offset on pointerup.
    window.addEventListener("pointerup", measure);
    // Text reflows (fonts, edits) move the flow's text anchors.
    document.querySelectorAll("#numbers-intro .numbers-block, #numbers-users .numbers-block").forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointerup", measure);
      flow.destroy();
      flowRef.current = null;
    };
  }, [layoutTick]);

  // Piecewise-linear state at a scroll position.
  function stateAt(y: number) {
    const cps = checkpointsRef.current;
    if (cps.length === 0) return null;
    if (y <= cps[0].at) return cps[0];
    for (let k = 0; k < cps.length - 1; k++) {
      const a = cps[k];
      const b = cps[k + 1];
      if (y <= b.at) return interpolate(a, b, y);
    }
    return cps[cps.length - 1];
  }

  // Wrapper transform: scale about the viewport center, then translate so
  // the marble's own center (screen center + its saved hero offset × scale)
  // lands on the interpolated target.
  function frame(y: number) {
    return frameOf(stateAt(y));
  }
  function frameOf(st: (Omit<Checkpoint, "at" | "rgb"> & { rgb?: Checkpoint["rgb"] }) | null) {
    const hero = heroRef.current;
    if (!st || hero.w <= 0) return { x: 0, y: 0, scale: 1, opacity: 1, bob: 0, glow: GLOW.hero, color: MOON_COLOR };
    const scale = st.w / hero.w;
    // Per-frame snapshot (frame-sync.ts): reading clientWidth here, after
    // this frame's style writes, forced a layout on every call.
    const cw = view.clientWidth || document.documentElement.clientWidth;
    const vh = view.innerHeight || window.innerHeight;
    return {
      x: st.cx - cw / 2 - hero.px * scale,
      y: st.cy - vh / 2 - hero.py * scale,
      scale,
      opacity: st.o,
      bob: st.bob,
      glow: st.glow,
      color: st.rgb ? rgbToHex(st.rgb) : MOON_COLOR,
    };
  }

  // Pigment color, read by the marble every frame (scroll-scrubbed like the
  // transform; MagicMarble's `colorSource`). The loop below stores it each
  // frame; recomputing it here from window.scrollY forced a layout per read.
  const colorRef = useRef<string | null>(null);
  const [colorSource] = useState(() => ({
    get current() {
      return colorRef.current ?? frame(view.scrollY || window.scrollY).color;
    },
  }));

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);
  const bob = useMotionValue(0);
  const glow = useMotionValue<number>(GLOW.hero);
  const glowScale = useMotionValue(1);
  const filter = useMotionValue("none");
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  // The dark shade over the moon at the Company stops (company-flow.ts `moonShade`).
  const shadeX = useMotionValue(0);
  const shadeY = useMotionValue(0);
  const shadeO = useMotionValue(0);
  const shadeVisibility = useTransform(shadeO, (o) => (o < 0.001 ? "hidden" : "visible"));

  // One loop drives the moon: the checkpoint scrub, or the Company flow
  // inside its range (which also renders the Company text and the camera
  // pan). Values are only pushed when they change.
  useEffect(() => {
    function put<T>(mv: MotionValue<T>, v: T) {
      if (mv.get() !== v) mv.set(v);
    }
    // Runs inside framer-motion's own frame loop (update step, before its
    // render step), so every value set here paints this same frame. From a
    // separate requestAnimationFrame, framer's render landed on the next
    // frame and absorbed that frame's set too — the moon only moved on
    // every other frame (30 fps at 60 Hz).
    function loop({ delta }: FrameData) {
      const dt = Math.min(0.1, Math.max(0, delta / 1000));
      const sy = view.scrollY;
      const flow = flowRef.current;
      const fm = flow ? flow.step(dt, sy, stateAt) : null;
      const f = frameOf(fm ?? stateAt(sy));
      colorRef.current = f.color;
      put(x, Math.round(f.x * 10) / 10);
      put(y, Math.round(f.y * 10) / 10);
      put(scale, Math.round(f.scale * 10000) / 10000);
      put(opacity, Math.round(f.opacity * 1000) / 1000);
      put(bob, Math.round(f.bob * 1000) / 1000);
      put(glow, Math.round(f.glow * 1000) / 1000);
      put(glowScale, fm ? Math.round(fm.glowScale * 1000) / 1000 : 1);
      put(filter, fm ? fm.filter : "none");
      // Position only matters while it shows; holding it otherwise skips writes.
      const so = fm ? Math.round(moonShade.o * 1000) / 1000 : 0;
      put(shadeO, so);
      if (so > 0) {
        put(shadeX, Math.round(moonShade.cx * 10) / 10);
        put(shadeY, Math.round(moonShade.cy * 10) / 10);
      }
    }
    const unsubscribe = subscribeFrameView();
    frameLoop.update(loop, true);
    return () => {
      cancelFrame(loop);
      unsubscribe();
    };
    // stateAt / frameOf only read refs; the loop lives as long as the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No moon edit handles on this page: they assume the marble is shown at
  // its own layout size, and the hero now starts on the (smaller) Contacts
  // moon, so they'd sit in the wrong place. Without `is-editable` the CSS
  // hides them.

  return (
    <>
      <motion.div
        ref={wrapRef}
        className={["shared-moon", contactsArriving && "is-contacts-arriving"].filter(Boolean).join(" ")}
        aria-hidden="true"
        style={{
          x,
          y,
          scale,
          opacity,
          visibility,
          filter,
          ["--bob" as string]: bob,
          ["--moon-glow" as string]: glow,
          ["--moon-glow-scale" as string]: glowScale,
        }}
      >
        <ContactsMoon
          id={HERO_ID}
          interactive
          marbleClickable={false}
          wrapClassName="shared-moon-inner"
          colorSource={colorSource}
        />
      </motion.div>
      {/* The old `.stars-slide:after` disc, now on the moon: a sibling (not a
          child) so the moon's scale and focus filter never touch it, after it
          in the DOM at the same z 2 so it paints over the moon, and still under
          the Company sections (z 3) and their text. */}
      <motion.div
        className="moon-shade"
        aria-hidden="true"
        style={{
          visibility: shadeVisibility,
          ["--shade-x" as string]: shadeX,
          ["--shade-y" as string]: shadeY,
          ["--shade-o" as string]: shadeO,
          ["--shade-size" as string]: COMPANY_FLOW.shade.size,
          ["--shade-alpha" as string]: COMPANY_FLOW.shade.alpha,
        }}
      />
    </>
  );
}
