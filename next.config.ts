import type { NextConfig } from "next";

// `STATIC_HTML=1 next build` (scripts/build-html.mjs): a static export that
// opens straight from disk (file://), without a server and without text
// editing. Builds into its own folder so it never touches `.next`, which the
// running `next start` serves.
const staticHtml = process.env.STATIC_HTML === "1";

const nextConfig: NextConfig = staticHtml
  ? {
      output: "export",
      distDir: ".next-html",
      // Relative asset URLs (./_next/…) so the page works from file://.
      assetPrefix: "./",
      images: { unoptimized: true },
      // Only .tsx route files: leaves out the text-edit API (route.ts),
      // which needs a server.
      pageExtensions: ["tsx"],
    }
  : {
      output: "standalone",
      // Sharing the dev server through a Cloudflare quick tunnel
      // (https://<random>.trycloudflare.com): without this, Next blocks the
      // tunnel origin's requests for dev-only assets (HMR etc.).
      allowedDevOrigins: ["*.trycloudflare.com"],
    };

export default nextConfig;
