import { cancelFrame, frame } from "framer-motion";

/**
 * One layout read per frame for the page's animation loops.
 *
 * The loops (SharedMoon + Company flow, DeepSpace, the section crossfade,
 * Moonlight) all run on framer-motion's frame loop, which runs every
 * callback's `read` step before any `update` / `render` step. Reading
 * `scrollY` / `clientWidth` there, before anything writes a style this
 * frame, is free; reading them from separate requestAnimationFrame loops,
 * after another loop had already written styles, forced a synchronous
 * style + layout each time (~5 per frame, measured).
 *
 * Loops read `view` in their update step (never the DOM getters).
 */
export const view = { scrollY: 0, clientWidth: 0, innerWidth: 0, innerHeight: 0 };

function read() {
  view.scrollY = window.scrollY;
  view.clientWidth = document.documentElement.clientWidth;
  view.innerWidth = window.innerWidth;
  view.innerHeight = window.innerHeight;
}

let users = 0;

/** Keeps `view` fresh every frame while at least one loop needs it; returns the unsubscribe. */
export function subscribeFrameView(): () => void {
  if (users++ === 0) {
    read();
    frame.read(read, true);
  }
  return () => {
    if (--users === 0) cancelFrame(read);
  };
}
