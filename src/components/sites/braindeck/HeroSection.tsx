"use client";

import { motion } from "framer-motion";
import { Stage, px } from "./stage";
import { BraindeckLogo, NAV_ITEMS } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { PrimaryButton, SecondaryButton } from "./Buttons";
import { CurvedLetters } from "./CurvedLetters";
import { usePrefersReducedMotion } from "./reducedMotion";
import { entranceOnceProps } from "./heroLoop";

const LOOP = 4;

/**
 * braindeck-hero-v2 (Figma node 40:2). Figma's own get_motion_context marks
 * this ~4s entrance as an infinite loop cohort, but per product direction
 * the text/sphere-container entrance now plays once and holds its resting
 * state — only the glass marble's own independent WebGL spin (inside
 * BraindeckSphere, unrelated to this transition) keeps going continuously.
 */
export function HeroSection() {
  const reducedMotion = usePrefersReducedMotion();

  const logo = entranceOnceProps(
    reducedMotion,
    { opacity: 1, scaleX: 1, scaleY: 1, y: 0 },
    { opacity: [0, 1, 1], scaleX: [2.5, 1, 1], scaleY: [2.5, 1, 1], y: [470, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.075, 1], ease: ["easeOut", "linear"] },
      scaleX: { duration: LOOP, times: [0, 0.375, 1], ease: ["easeInOut", "linear"] },
      scaleY: { duration: LOOP, times: [0, 0.375, 1], ease: ["easeInOut", "linear"] },
      y: { duration: LOOP, times: [0, 0.375, 1], ease: ["easeInOut", "linear"] },
    },
  );

  const nav = entranceOnceProps(
    reducedMotion,
    { opacity: 1, y: 0 },
    { opacity: [0, 0, 1, 1], y: [-20, -20, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.375, 0.55, 1], ease: ["linear", "easeOut", "linear"] },
      y: { duration: LOOP, times: [0, 0.375, 0.55, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const inspiringThe = entranceOnceProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1], x: [-80, -80, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.45, 0.65, 1], ease: ["linear", "easeOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.45, 0.65, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const nextText = entranceOnceProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1], x: [-80, -80, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.5, 0.7, 1], ease: ["linear", "easeOut", "linear"] },
      x: { duration: LOOP, times: [0, 0.5, 0.7, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const sphere = entranceOnceProps(
    reducedMotion,
    { opacity: 1, rotate: 0, scaleX: 1, scaleY: 1, y: 0 },
    {
      opacity: [0, 0, 1, 1],
      rotate: [0, -288, -360],
      scaleX: [0.6, 0.6, 1, 1],
      scaleY: [0.6, 0.6, 1, 1],
      y: [800, 800, 0, 0],
    },
    {
      opacity: { duration: LOOP, times: [0, 0.45, 0.625, 1], ease: ["linear", "easeOut", "linear"] },
      rotate: { duration: LOOP, times: [0, 0.9999, 1], ease: "linear" },
      scaleX: { duration: LOOP, times: [0, 0.45, 0.875, 1], ease: ["linear", "easeOut", "linear"] },
      scaleY: { duration: LOOP, times: [0, 0.45, 0.875, 1], ease: ["linear", "easeOut", "linear"] },
      y: { duration: LOOP, times: [0, 0.45, 0.875, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  const buttons = entranceOnceProps(
    reducedMotion,
    { opacity: 1, y: 0 },
    { opacity: [0, 0, 1, 1], y: [30, 30, 0, 0] },
    {
      opacity: { duration: LOOP, times: [0, 0.625, 0.825, 1], ease: ["linear", "easeOut", "linear"] },
      y: { duration: LOOP, times: [0, 0.625, 0.825, 1], ease: ["linear", "easeOut", "linear"] },
    },
  );

  return (
    <Stage height={1080} screenFit className="bg-[#0a0a0a]">
      <motion.div className="absolute" style={{ left: px(760), top: px(20), width: px(400), height: px(56) }} {...logo}>
        <BraindeckLogo left={0} top={0} width={400} height={56} />
      </motion.div>

      <motion.div
        className="absolute flex items-center whitespace-nowrap font-medium not-italic text-[#d9d9d9]"
        style={{ left: px(1360), top: px(25), gap: px(40), fontSize: px(16) }}
        {...nav}
      >
        {NAV_ITEMS.map((item) => (
          <p key={item} className="shrink-0">
            {item}
          </p>
        ))}
      </motion.div>

      <div
        className="absolute flex flex-col items-start font-bold not-italic whitespace-nowrap"
        style={{ left: px(203), top: px(254), width: px(807), height: px(330), gap: px(20), fontSize: px(128) }}
      >
        <motion.p className="shrink-0 text-white" {...inspiringThe}>
          Inspiring the
        </motion.p>
        <motion.p className="shrink-0 text-[#0f6]" {...nextText}>
          Next
        </motion.p>
      </div>

      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{ left: px(630), top: px(442), width: px(1137), height: px(1137), borderRadius: px(300) }}
        {...sphere}
      >
        <BraindeckSphere />
      </motion.div>

      {/* Sibling of the sphere, not a child: hero-buttons' own motion data (opacity/y only, no rotate) means it must not inherit the sphere's spin, even though Figma nests it inside that layer structurally. Position is the sphere's own offset (630,442) plus hero-buttons' original sphere-relative offset (428,568). */}
      <motion.div
        className="absolute flex items-start justify-between"
        style={{ left: px(630 + 428), top: px(442 + 568), width: px(355), height: px(56) }}
        {...buttons}
      >
        <PrimaryButton paddingX={30} height={50} fontSize={16} radius={25}>
          Demo →
        </PrimaryButton>
        <SecondaryButton paddingX={30} height={50} fontSize={16} radius={25}>
          Explore Solution →
        </SecondaryButton>
      </motion.div>

      <CurvedLetters reducedMotion={reducedMotion} />
    </Stage>
  );
}
