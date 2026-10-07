"use client";

import { motion, type Easing } from "framer-motion";
import { px } from "./stage";
import { SolutionCard, type SolutionCardData, type SolutionCardSizing } from "./SolutionCard";
import { loopProps } from "./heroLoop";

const LOOP = 12;
const EASE: Easing[] = ["linear", "easeOut", "linear", "easeOut", "linear"];

const SIZING: SolutionCardSizing = {
  paddingX: 44,
  paddingYTop: 40,
  gap: 20,
  radius: 16,
  badgeFontSize: 16,
  productCodeFontSize: 16,
  titleFontSize: 42,
  descriptionFontSize: 14,
  ctaPaddingX: 20,
  ctaPaddingY: 10,
  ctaFontSize: 14,
};

const MEDIA_CARD: SolutionCardData = {
  badgeIcon: "♪",
  badgeLabel: "Media & Content",
  badgeIconColor: "#00d966",
  productCode: "AI Music Generation",
  title: "LUCY - 7",
  description: ["Automatically generates music in the desired genre", "and mood from a text prompt"],
};

const HEALTHCARE_CARD: SolutionCardData = {
  badgeIcon: "✚",
  badgeLabel: "Healthcare",
  badgeIconColor: "#00d966",
  productCode: "Deepfake Detection",
  title: "ARES - Shield",
  description: ["AI-powered deepfake detection system that identifies", "manipulated media with 99.7% accuracy"],
};

function NavDot({ active }: { active: boolean }) {
  return (
    <div
      className={active ? "bg-[#262626]" : "bg-[#333]"}
      style={{ width: px(32), height: px(32), borderRadius: px(16) }}
    />
  );
}

/**
 * The "Core Solutions" showcase (Figma nodes 49:20 solution-card-media,
 * 49:43 solution-card-healthcare) — two cards cross-fading/sliding through
 * one slot on a 12s loop shared with the rest of braindeck-page2 (see
 * get_motion_context's timelineCohorts for node 45:32). Their slot's exact
 * on-canvas position wasn't resolvable from Figma metadata (get_metadata
 * for 45:32 doesn't expose these as its children, only get_motion_context's
 * cohort ties them to this frame) — placed to fill the empty right half of
 * the page next to "Core Solutions", sized to the cards' own content;
 * flagged as an estimated, not sourced, position.
 */
export function ExpertiseRotator({ reducedMotion }: { reducedMotion: boolean }) {
  const media = loopProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1, 0, 0], x: [100, 100, 0, 0, -100, -100] },
    {
      opacity: { duration: LOOP, times: [0, 0.3583, 0.4167, 0.5833, 0.625, 1], ease: EASE, repeat: Infinity },
      x: { duration: LOOP, times: [0, 0.3583, 0.4167, 0.5833, 0.625, 1], ease: EASE, repeat: Infinity },
    },
  );

  const healthcare = loopProps(
    reducedMotion,
    { opacity: 1, x: 0 },
    { opacity: [0, 0, 1, 1, 0, 0], x: [100, 100, 0, 0, -100, -100] },
    {
      opacity: { duration: LOOP, times: [0, 0.6083, 0.6667, 0.8333, 0.875, 1], ease: EASE, repeat: Infinity },
      x: { duration: LOOP, times: [0, 0.6083, 0.6667, 0.8333, 0.875, 1], ease: EASE, repeat: Infinity },
    },
  );

  return (
    <div className="absolute" style={{ left: px(1090), top: px(310), width: px(680), height: px(430) }}>
      <motion.div className="absolute inset-0" {...media}>
        <SolutionCard
          data={MEDIA_CARD}
          sizing={SIZING}
          className="size-full"
          footer={
            <div className="flex items-center" style={{ gap: px(16) }}>
              <p className="font-normal not-italic text-[#808080] shrink-0 whitespace-nowrap" style={{ fontSize: px(13) }}>
                1 / 3
              </p>
              <NavDot active />
              <NavDot active={false} />
            </div>
          }
        />
      </motion.div>
      <motion.div className="absolute inset-0" {...healthcare}>
        <SolutionCard
          data={HEALTHCARE_CARD}
          sizing={SIZING}
          className="size-full"
          footer={
            <p className="font-normal not-italic text-[#808080] shrink-0 whitespace-nowrap" style={{ fontSize: px(13) }}>
              2 / 3
            </p>
          }
        />
      </motion.div>
    </div>
  );
}
