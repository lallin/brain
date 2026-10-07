"use client";

import { motion } from "framer-motion";
import { px } from "./stage";

/**
 * "Trusted Human-Centered AI" arcs along the top of the hero's sphere as 25
 * individually-rotated letters (Figma nodes 45:259-45:283). Each letter's
 * reveal is staggered by exactly 0.01 of the hero's 4s loop per character
 * (verified directly from get_motion_context: opacity/x keyframe `times`
 * for letter i are `[0, 0.55 + 0.01*i, 0.675 + 0.01*i, 1]`) — expressed
 * here as a formula instead of 25 near-duplicate objects, but the formula
 * itself, not just its shape, is copied verbatim from that data.
 */
const LETTERS: Array<[char: string, left: number, top: number, width: number, height: number, rotate: number]> = [
  ["T", 991.04, 440.54, 24.075, 32.496, 17.74],
  ["r", 1006.88, 435.86, 17.719, 30.64, 16.26],
  ["u", 1022.11, 431.71, 21.92, 31.872, 14.82],
  ["s", 1039.07, 427.59, 19.299, 31.207, 13.25],
  ["t", 1053.12, 424.53, 14.81, 30.235, 11.95],
  ["e", 1068.15, 421.61, 20.061, 31.258, 10.56],
  ["d", 1086.84, 418.49, 20.27, 31.116, 8.85],
  [" ", 1098.08, 416.89, 3.95, 28.73, 7.83],
  ["H", 1110.2, 415.37, 21.268, 30.906, 6.72],
  ["u", 1130.09, 413.4, 17.427, 30.177, 4.91],
  ["m", 1152.05, 411.93, 23.448, 30.082, 2.92],
  ["a", 1173.54, 411.22, 14.49, 29.233, 0.97],
  ["n", 1191.45, 411, 15.327, 29.168, -0.65],
  ["-", 1208.33, 411.12, 13.093, 29.435, -2.18],
  ["C", 1226.71, 411.32, 19.904, 30.142, -3.84],
  ["e", 1246.58, 412.66, 17.783, 30.336, -5.65],
  ["n", 1264.86, 414.26, 18.572, 30.674, -7.32],
  ["t", 1280.07, 416.9, 13.287, 30.028, -8.71],
  ["e", 1295.15, 418.08, 19.852, 31.181, -10.1],
  ["r", 1310.75, 421.62, 15.596, 30.414, -11.53],
  ["e", 1326.16, 423.54, 21.126, 31.627, -12.97],
  ["d", 1344.48, 427.27, 22.828, 32.108, -14.68],
  [" ", 1355.6, 434.21, 7.848, 27.918, -15.7],
  ["A", 1366.54, 432.52, 24.643, 32.671, -16.77],
  ["I", 1381.37, 439.75, 15.688, 29.737, -18.16],
];

const START_BASE = 0.55;
const START_STEP = 0.01;
const MID_OFFSET = 0.125;
const LOOP_DURATION = 4;

export function CurvedLetters({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      {LETTERS.map(([char, left, top, width, height, rotate], i) => {
        const start = START_BASE + START_STEP * i;
        const mid = start + MID_OFFSET;
        const times = [0, start, mid, 1];
        return (
          <div
            key={i}
            className="absolute flex items-center justify-center -translate-x-1/2"
            style={{ left: px(left), top: px(top), width: px(width), height: px(height) }}
          >
            <motion.p
              className="flex-none text-white text-center whitespace-nowrap font-medium not-italic"
              style={{ fontSize: px(24), rotate: `${rotate}deg` }}
              initial={reducedMotion ? false : { opacity: 0, x: -30 }}
              animate={
                reducedMotion
                  ? { opacity: 1, x: 0 }
                  : {
                      opacity: [0, 0, 1, 1],
                      x: [-30, -30, 0, 0],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      opacity: { duration: LOOP_DURATION, times, ease: ["linear", "easeOut", "linear"] },
                      x: { duration: LOOP_DURATION, times, ease: ["linear", "easeOut", "linear"] },
                    }
              }
            >
              {char === " " ? " " : char}
            </motion.p>
          </div>
        );
      })}
    </>
  );
}
