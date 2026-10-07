/**
 * "별전환" — the starfield's scroll/navigate-driven warp-burst effect:
 * StarCanvas.tsx's `scrollEnergy` (the real mechanism — speeds up the
 * star field's z-motion in proportion to raw scroll distance) and
 * BoilerLabApp/BoilerLabScrollApp's own `starBoost` pulse (a `boostTrigger`
 * prop StarCanvas accepts but doesn't currently read — kept passed through
 * for when this flag flips back on and that wiring is revisited).
 *
 * Off for now per request. Flip to `true` — nothing else to change — when
 * asked to bring "별전환" back.
 */
export const STAR_TRANSITION_ENABLED = false;
