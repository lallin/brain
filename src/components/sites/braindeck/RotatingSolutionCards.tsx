"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { px } from "./stage";
import { SolutionCard, type SolutionCardData, type SolutionCardSizing } from "./SolutionCard";
import { usePrefersReducedMotion } from "./reducedMotion";

export interface RoleRect {
  left: number;
  top: number;
  width: number;
}

/**
 * Verified against carousel-main-1 -> carousel-trans-1 -> carousel-main-2
 * (Figma 60:2, 60:58, 60:114) and reconfirmed against
 * healthcare-main-1 -> healthcare-trans-1 (63:2, 63:40), which follows the
 * identical mechanic with fewer roles: get_motion_context returns no
 * keyframe data for these prototype-level Smart Animate transitions, but
 * diffing the exported frames gives the real path. Every role except the
 * one the currently-active card is exiting FROM settles by the time the
 * cascade group finishes (front->active, middle->front, etc. all land on
 * their new rect directly). The exiting card is the odd one out: the
 * transition frame captures it mid-flight at left:-1100 (fully off the
 * 1920-wide canvas), still short of the last role's rect it's headed to.
 * So only the exiting card's `left` takes a 3-point detour through -1100
 * over a longer total duration; every other property (top/width/sizing)
 * settles on the cascade group's shorter duration.
 */
const CASCADE_DURATION = 0.5;
const EXIT_TOTAL_DURATION = 0.9;
const EXIT_MID_FRACTION = CASCADE_DURATION / EXIT_TOTAL_DURATION;
const EXIT_LEFT = -1100;
const CASCADE_EASE = [0.4, 0, 0.2, 1] as const;

interface RotatingSolutionCardsProps {
  products: Record<string, SolutionCardData>;
  productHref?: Record<string, string>;
  initialOrder: string[];
  /** Index 0 is the active/enlarged rect; the last entry is the rect the exiting card lands in. */
  roleRects: RoleRect[];
  activeSizing: SolutionCardSizing;
  queuedSizing: SolutionCardSizing;
  advanceMs?: number;
}

/**
 * A round-robin of N solution cards where the active (index 0) role always
 * swaps out to the last role over time, and every other role shifts up by
 * one — the shared motion behind carousel-main-*, healthcare-main-*, and
 * enterprise-main-*, generalized over role count (4 for the media carousel,
 * 2 for healthcare/enterprise).
 */
export function RotatingSolutionCards({
  products,
  productHref = {},
  initialOrder,
  roleRects,
  activeSizing,
  queuedSizing,
  advanceMs = 5000,
}: RotatingSolutionCardsProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [order, setOrder] = useState(initialOrder);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const lastRoleIndex = roleRects.length - 1;

  useEffect(() => {
    if (reducedMotion || roleRects.length < 2) return;
    const id = setInterval(() => {
      setOrder((prev) => {
        setExitingId(prev[0]);
        return [...prev.slice(1), prev[0]];
      });
    }, advanceMs);
    return () => clearInterval(id);
  }, [reducedMotion, advanceMs, roleRects.length]);

  return (
    <>
      {order.map((productId, i) => {
        const rect = roleRects[i];
        const data = products[productId];
        const isActive = i === 0;
        const isExiting = !reducedMotion && productId === exitingId && i === lastRoleIndex;

        const transition = reducedMotion
          ? { duration: 0 }
          : isExiting
            ? {
                left: { duration: EXIT_TOTAL_DURATION, times: [0, EXIT_MID_FRACTION, 1], ease: CASCADE_EASE },
                top: { duration: CASCADE_DURATION, ease: CASCADE_EASE },
                width: { duration: CASCADE_DURATION, ease: CASCADE_EASE },
              }
            : { duration: CASCADE_DURATION, ease: CASCADE_EASE };

        return (
          <motion.div
            key={productId}
            initial={false}
            animate={
              isExiting
                ? { left: [px(roleRects[0].left), px(EXIT_LEFT), px(rect.left)], top: px(rect.top), width: px(rect.width) }
                : { left: px(rect.left), top: px(rect.top), width: px(rect.width) }
            }
            transition={transition}
            className="absolute"
          >
            <SolutionCard
              data={data}
              sizing={isActive ? activeSizing : queuedSizing}
              dimmed={!isActive}
              href={isActive ? productHref[productId] : undefined}
              className="transition-all duration-500 ease-out"
            />
          </motion.div>
        );
      })}
    </>
  );
}
