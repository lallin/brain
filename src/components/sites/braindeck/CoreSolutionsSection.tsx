"use client";

import { motion } from "framer-motion";
import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { ExpertiseRotator } from "./ExpertiseRotator";
import { usePrefersReducedMotion } from "./reducedMotion";
import { entranceOnceProps } from "./heroLoop";

const LOOP = 12;

/**
 * braindeck-page2 (Figma node 45:32). Per product direction the
 * eyebrow/heading/subhead and sphere-container entrance now play once and
 * hold, rather than repeating on Figma's original 12s loop — only the
 * marble's own independent spin (see HeroSection) and ExpertiseRotator's
 * genuine ongoing card rotation keep animating continuously.
 */
export function CoreSolutionsSection() {
  const reducedMotion = usePrefersReducedMotion();

  const eyebrow = entranceOnceProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1, 0, 0], x: [-80, -80, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.1667, 0.225, 0.3333, 0.375, 1], ease: ["linear", "easeOut", "linear", "easeOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.1667, 0.225, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const heading = entranceOnceProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1, 0, 0], x: [-80, -80, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.1833, 0.25, 0.3333, 0.375, 1], ease: ["linear", "easeOut", "linear", "easeOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.1833, 0.25, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const subhead = entranceOnceProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1, 0, 0], x: [-60, -60, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.2, 0.2667, 0.3167, 0.3583, 1], ease: ["linear", "easeOut", "linear", "easeOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.2, 0.2667, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const sphere = entranceOnceProps(
    reducedMotion,
    { rotate: 0, scaleX: 1, scaleY: 1, x: 0, y: 0 },
    { rotate: [0, -720], scaleX: [1.624, 1, 1], scaleY: [1.624, 1, 1], x: [980, 0, 0], y: [252, 0, 0] },
    {
      rotate: { duration: LOOP, times: [0, 1], ease: "linear" },
      scaleX: { duration: LOOP, times: [0, 0.1667, 1], ease: ["easeInOut", "linear"] },
      scaleY: { duration: LOOP, times: [0, 0.1667, 1], ease: ["easeInOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.1667, 1], ease: ["easeInOut", "linear"] },
      y: { duration: LOOP, times: [0, 0.1667, 1], ease: ["easeInOut", "linear"] },
    },
  );

  return (
    <Stage height={1080} screenFit className="bg-[#0a0a0a]">
      <BraindeckHeader />

      <div
        className="absolute flex flex-col items-start"
        style={{ left: px(450), top: px(350), width: px(800), gap: px(20) }}
      >
        <motion.p
          className="font-bold not-italic text-[#00d966] whitespace-nowrap shrink-0"
          style={{ fontSize: px(14), letterSpacing: px(4) }}
          {...eyebrow}
        >
          OUR EXPERTISE
        </motion.p>
        <motion.p className="font-bold not-italic text-white whitespace-nowrap shrink-0" style={{ fontSize: px(64) }} {...heading}>
          Core Solutions
        </motion.p>
        <motion.p className="font-normal not-italic text-[#8c8c8c] shrink-0" style={{ fontSize: px(18), width: px(600) }} {...subhead}>
          Create business value with field-proven AI technology in three core areas
        </motion.p>
      </div>

      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{ left: px(-350), top: px(190), width: px(700), height: px(700), borderRadius: px(350) }}
        {...sphere}
      >
        <BraindeckSphere />
      </motion.div>

      <ExpertiseRotator reducedMotion={reducedMotion} />
    </Stage>
  );
}
