/**
 * Every tunable number of the Company (numbers-intro / numbers-users) sphere
 * × text flow, in one place. Values come from the reference demo
 * ("Braindeck 구 × 텍스트 연출 비교.html", options 3 · 4 · 8 · 10 · 11).
 *
 * Coordinates are in the 1440×900 design space, origin at the screen centre,
 * +y down; real px = value × S, S = min(innerWidth / 1440, innerHeight / 900).
 * `p` is the demo's progress. The page wheel-steps between snapped sections,
 * so p is not scrubbed by scroll: entering a section plays a time-based
 * timeline (`timeline.keys`) to that section's stop (see company-flow.ts).
 */
export const COMPANY_FLOW = {
  /** Overall playback speed: 2 = twice as fast, 0.5 = half. */
  speed: 1.6,

  design: {
    width: 1440,
    height: 900,
    /** The demo sphere's box (px at S = 1); scale 1 = this visible diameter. */
    sphereBox: 400,
    /** MagicMarble draws the moon at 64% of its box. */
    marbleVisibleShare: 0.64,
  },

  anchors: {
    /** The flow's range starts this many viewports before #numbers-intro's snap point. */
    startVh: 1,
  },

  /**
   * Time-based playback. `keys` maps p to seconds (at speed 1), linear in
   * between. Each section has a stop; entering it plays p to that stop
   * (backwards when scrolling up; a new scroll mid-play just retargets).
   */
  timeline: {
    keys: [
      { p: 0, t: 0 },
      { p: 0.14, t: 0.8 }, // sphere reaches T1's spot
      { p: 0.17, t: 1.0 }, // T1 wipe starts 0.2s later
      // 1.45s wipe: its ease-out tail barely moves, so it reads as ~1.2s.
      { p: 0.3, t: 2.45 }, // T1 fully open, sphere at rest
      { p: 0.32, t: 2.55 }, // stop: #numbers-intro
      { p: 0.34, t: 2.65 }, // T1 starts leaving
      { p: 0.42, t: 3.65 }, // T1 gone
      { p: 0.46, t: 4.45 }, // sphere reaches T2's spot
      { p: 0.47, t: 4.65 }, // T2 wipe starts 0.2s later
      { p: 0.6, t: 6.1 }, // T2 fully open, sphere at rest
      { p: 0.615, t: 6.2 }, // stop: #numbers-users
      { p: 0.63, t: 6.3 }, // T2 starts leaving
      { p: 0.72, t: 7.3 }, // T2 gone
      { p: 0.86, t: 8.5 }, // stop: #numbers-air (sphere has sunk)
    ],
    /** p of each stop: before the flow, #numbers-intro, #numbers-users, #numbers-air. */
    stops: [0, 0.32, 0.615, 0.86],
    /** Seconds a text stays fully open at its stop before the timeline moves on. */
    hold: 1,
    /** Section progress (0–1 between two snap points) that triggers the next stop. */
    enterAt: 0.5, // mission → #numbers-intro (free scroll, no wheel-step)
    // Wheel-stepped sections: early in the step's scroll. Not lower — a free
    // scroll out of #mission can stop ~70–100px past #numbers-intro's snap
    // point, and that must not count as moving on to T2.
    stepAt: 0.25,
    /**
     * Safety net: section progress (q: 1 = #numbers-intro, 2 = #numbers-users,
     * 3 = #numbers-air) over which the texts may show at all, fading out over
     * `fade` beyond it, whatever the timeline says — so neither can ever sit
     * over AIR below or the hero above. Both span the whole Company area:
     * T1 keeps leaving over #numbers-users (and T2 over #numbers-intro when
     * going back up) by design.
     */
    textGate: {
      t1: [0.5, 2.4] as const,
      t2: [0.6, 2.4] as const,
      fade: 0.2,
    },
  },

  text: {
    t1: {
      in0: 0.17, in1: 0.3, out0: 0.34, out1: 0.42,
      x0: -612, dx: -18, // left edge
      y0: 190, y1: -105, y2: -440, // vertical centre: enter → rest → exit
      wipe: "to left" as const, // opens from the right (sphere side)
    },
    t2: {
      in0: 0.47, in1: 0.6, out0: 0.63, out1: 0.72,
      x0: 28, dx: 0,
      y0: 220, y1: -30, y2: -320,
      wipe: "to right" as const,
    },
    /** w = clamp(inP / visibleRamp) × (1 − ease(outP)) */
    visibleRamp: 0.35,
    /** Mask wipe: reveal edge = rp, rp = eased progress × overshoot; feather in %. */
    wipeOvershoot: 1.2,
    wipeFeather: 20,
    /** Colour inheritance from the sphere: text tints toward `hot`. */
    hot: [125, 255, 106] as const,
    /** g during entry = 1 − seg(inP, coolFrom, 1). */
    coolFrom: 0.35,
    glowRgb: [90, 255, 80] as const,
    glowRadius: 20, // × S px
    glowAlpha: 0.75,
    /** Echo trail: layer gap (× S px), growth while leaving, fade-in speed while leaving. */
    echoGap: 7,
    echoGrowth: 1.2,
    echoOutRamp: 5,
    /** Trail brightness: the demo draws its echo in grey #6d6b72 (≈45% of white). */
    echoStrength: 0.45,
    /** Main text opacity while leaving: 1 − exitFade × outP. */
    exitFade: 0.55,
    /** Keeps a block at least this far (px) from the viewport edges (phones). */
    edgeMargin: 16,
    /**
     * Text size follows S: the saved size (numbers.*__fontSize, e.g. 53 /
     * 57.5px) counts as S = 1, and it grows at most this much on big screens.
     */
    maxFontScale: 1.3,
  },

  sphere: {
    /** [8] Guide path after p = 0 (p = 0 is wherever the hero left the moon). */
    waypoints: [
      { p: 0.14, x: -200, y: 190, s: 0.6 }, // toward T1's spot (40% closer to rest)
      { p: 0.3, x: 0, y: 0, s: 0.49 },
      { p: 0.42, x: 0, y: 0, s: 0.49 },
      { p: 0.46, x: 175, y: 220, s: 0.49 }, // toward T2's spot (40% closer to rest)
      { p: 0.6, x: 0, y: 0, s: 0.49 },
      { p: 0.63, x: 0, y: 0, s: 0.49 },
      { p: 0.86, x: 0, y: 315, s: 0.42 }, // sinks toward the next section
    ],
    /** p over which opacity / glow / bob blend from the hero's values. */
    introBlend: 0.14,
    /** Wrapper opacity through the flow (the hero is 1). */
    opacity: 1,
    /**
     * Floor for the visible diameter (px), so phones (S ≈ 0.27) still get a
     * real sphere. Only the size is floored; the path (x / y) keeps using S.
     */
    minDiameter: 120,
  },

  /** [4] Sphere reacts as text is born from / drawn back into it. */
  pulse: { inSpan: 0.55, scale: 0.035, glowScale: 0.15 },

  /**
   * Phones (viewport narrower than maxWidth): a vertical layout — the sphere
   * rests above the centre, both texts sit centred below it, the guide path
   * dips down to where the text opens, and the wipe opens from the top.
   * Desktop never reads this block.
   */
  mobile: {
    maxWidth: 768,
    /** Text size floors (px). The box scales with them, so T1 stays 2 lines and T2 4. */
    minFont: { t1: 22, t2: 20 },
    /** Sphere rest centre, as a fraction of the viewport height from the centre (− = up). */
    restY: -0.22,
    /** Minimum gap (px) between the sphere's bottom edge (at full pulse) and the text. */
    textGap: 24,
    /** Text travel, fraction of the viewport height: enters from below, leaves slightly upward. */
    enterDy: 0.08,
    exitDy: -0.025,
    /** Sphere state at the flow's end (p = airP): this fraction of the height below the centre. */
    endY: 0.3,
    /** Mask wipe direction: opens from the top edge, the sphere's side. */
    wipe: "to bottom" as const,
  },

  /** [3] Sphere steps back while text is on screen. */
  focus: {
    scale: 0.14,
    blur: 4, // px
    brightness: 0.42,
    saturate: 0.35,
    glowBase: 0.75,
    glowDim: 0.65,
    glowPulse: 0.35,
  },

  /**
   * Dark shade over the sphere (SharedMoon's `.moon-shade`): the old
   * `.stars-slide:after` disc, now centred on the sphere and shown only at
   * the two text stops (T1 / T2). It fades in once the sphere has really
   * stopped (timeline parked on the stop and the spring settled) and fades
   * out as soon as the timeline leaves the stop. Fades in seconds; `size`
   * is the disc's diameter, never scaled with the sphere.
   */
  shade: {
    alpha: 0.8,
    size: "41rem",
    fadeIn: 0.6,
    fadeOut: 0.3,
    /** prefers-reduced-motion: both fades. */
    reducedFade: 0.15,
    /** Spring counts as settled within this distance (px) / speed (px per 60 Hz step) of its target. */
    settlePx: 1,
    settleSpeed: 0.1,
  },

  /** [11] Spring follow, per 60 fps step: v = (v + (target − pos) × k) × d. */
  spring: {
    stiffness: 0.03,
    damping: 0.88,
    stepHz: 60,
    /** Viewports past either end of the flow over which the spring hands back to the plain scrub. */
    edgeVh: 0.35,
  },

  /** [10] Camera pan: stars and nebula drift opposite to the sphere. */
  camera: {
    amount: 0.35,
    yOffset: 150,
    /** Star shift = −(cx, cy) × (starMin + (1 − starMin) × depth). */
    starMin: 0.2,
    nebula: 0.35,
    /** Per 60 fps step easing of the pan's on/off amount. */
    smoothing: 0.08,
  },
} as const;

export type CompanyTextSchedule = (typeof COMPANY_FLOW.text)["t1"] | (typeof COMPANY_FLOW.text)["t2"];
