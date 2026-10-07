import type { Transition } from "framer-motion";

type Keyframes = Record<string, number[]>;
type RestingState = Record<string, number>;

/**
 * Shared shape for every looping (repeat: Infinity) entrance animation in
 * the hero — logo, nav, headline lines, sphere, buttons, and each curved
 * letter all reduce to "these keyframes, on this transition, forever."
 * Collapses to the animation's own resting values with no transition when
 * the viewer prefers reduced motion.
 */
export function loopProps(reducedMotion: boolean, resting: RestingState, animate: Keyframes, transition: Transition) {
  if (reducedMotion) {
    return { initial: false as const, animate: resting, transition: { duration: 0 } };
  }
  const initial: RestingState = {};
  for (const key of Object.keys(animate)) initial[key] = animate[key][0];
  return { initial, animate, transition };
}

/**
 * Same entrance shape as `loopProps`, but plays once and holds its resting
 * value instead of repeating forever — for the hero/core-solutions text and
 * sphere-container entrances, which should not keep replaying (unlike a
 * genuine ongoing rotator such as ExpertiseRotator's card cross-fade, which
 * must keep using `loopProps` unchanged).
 */
export function entranceOnceProps(reducedMotion: boolean, resting: RestingState, animate: Keyframes, transition: Transition) {
  const base = loopProps(reducedMotion, resting, animate, transition);
  if (reducedMotion) return base;
  const onceTransition: Transition = {};
  for (const [key, value] of Object.entries(transition)) {
    onceTransition[key as keyof Transition] =
      value && typeof value === "object" ? ({ ...value, repeat: undefined } as never) : value;
  }
  return { ...base, transition: onceTransition };
}
