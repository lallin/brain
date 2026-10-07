"use client";

import MagicMarble from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/MagicMarble";

/**
 * The real interactive WebGL sphere already built for the boilerlab.ai
 * clone in this same repo (MagicMarble, used there as ContactsMoon's green
 * marble) — reused here, in place of the flat sphere-green.png /
 * awards-sphere.png renders, wherever the Figma draft calls for the
 * braindeck 3D sphere. Same palette/core as ContactsMoon; `sizePercent={100}`
 * fills its box edge-to-edge (ContactsMoon uses 64 for a smaller floating
 * moon look, which isn't what these full-bleed circular masks want).
 */
export function BraindeckSphere() {
  return <MagicMarble palette={["#47e520", "#c9ffb8", "#ffffff", "#1a3d1a"]} core="#050806" sizePercent={100} />;
}
