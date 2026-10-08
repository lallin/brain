"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The main page's backdrop: the Cyber Ocean scene (particle seabed, flow
 * field, wormhole, haze) running in its background mode, fixed behind
 * everything where DeepSpace used to be.
 *
 * It is a prebuilt static bundle in public/cyber-ocean-bg (built from the
 * Cyber-Ocean project with `vite build --base=/cyber-ocean-bg/`, opened with
 * `?mode=bg`: no dolphin, HUD, loader or sound), embedded as an iframe so its
 * Three.js app keeps its own globals and render loop.
 *
 * - The frame takes no pointer events (the page stays fully clickable); the
 *   pointer is posted to it instead so the camera parallax still follows it.
 * - It fades in once the scene reports its first frame (`cyber-ocean:ready`).
 */
const SRC = "/cyber-ocean-bg/index.html?mode=bg";

export function OceanBackdrop() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type === "cyber-ocean:ready") setReady(true);
    }

    let raf = 0;
    let x = 0;
    let y = 0;
    function onPointerMove(event: PointerEvent) {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = (event.clientY / window.innerHeight) * 2 - 1;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        frameRef.current?.contentWindow?.postMessage({ type: "cyber-ocean:pointer", x, y }, window.location.origin);
      });
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`ocean-backdrop${ready ? " is-ready" : ""}`} aria-hidden="true">
      <iframe ref={frameRef} src={SRC} title="" tabIndex={-1} loading="eager" />
    </div>
  );
}
