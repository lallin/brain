/**
 * Shared timing for the SharedMoon ⇄ FerrisSphere handoff at the Solutions
 * section's edges. Both sides compute from the same measurement so their
 * crossfades line up to the pixel.
 *
 * They are two WebGL instances on purpose: FerrisSphere has to sit between
 * the Solutions background and its copy/cards, a layer a single viewport-
 * fixed moon can't reach. So SharedMoon morphs into FerrisSphere's exact
 * size / position / color, and they swap while overlapping:
 *
 *   entry  [hin − 2δ, hin − δ]  FerrisSphere fades in on top of the moon
 *          [hin − δ,  hin]      the moon (now covered) fades out
 *   exit   [hout, hout + δ]     the moon fades in under FerrisSphere
 *          [hout + δ, hout + 2δ] FerrisSphere fades out
 *
 * `hin` is where the sticky Ferris frame settles (outer top), `hout` where it
 * starts scrolling away (outer bottom at the viewport bottom).
 */

/** Crossfade step δ, in viewports. */
export const HANDOFF_VH = 0.2;

export interface FerrisHandoffRange {
  hin: number;
  hout: number;
  delta: number;
}

export function measureFerrisHandoff(outer: HTMLElement): FerrisHandoffRange {
  const vh = window.innerHeight;
  const top = outer.getBoundingClientRect().top + window.scrollY;
  return { hin: top, hout: top + outer.offsetHeight - vh, delta: HANDOFF_VH * vh };
}

function ramp(v: number, from: number, to: number) {
  return to > from ? Math.min(1, Math.max(0, (v - from) / (to - from))) : v >= to ? 1 : 0;
}

/** FerrisSphere's handoff opacity (multiplied with its own CSS opacity). */
export function ferrisSphereHandoff(scrollY: number, r: FerrisHandoffRange): number {
  const fadeIn = ramp(scrollY, r.hin - 2 * r.delta, r.hin - r.delta);
  const fadeOut = 1 - ramp(scrollY, r.hout + r.delta, r.hout + 2 * r.delta);
  return Math.min(fadeIn, fadeOut);
}
