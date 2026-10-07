import type { CSSProperties, ReactNode } from "react";

/**
 * The Figma frames for this flow are all authored on a fixed 1920px-wide
 * canvas. Every px value below is converted to `cqw` against this basis so
 * a `Stage` reproduces the design's exact proportions (including type
 * scale) at any container width, instead of only rendering correctly at
 * literally 1920px wide.
 */
export const DESIGN_WIDTH = 1920;

export function px(value: number): string {
  return `${(value / DESIGN_WIDTH) * 100}cqw`;
}

interface StageProps {
  /** Design-space height in px at the 1920-wide basis. */
  height: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /**
   * Render as one full-viewport (100dvh) "page", letterboxed to preserve
   * the design's exact aspect ratio at any window shape, instead of a
   * plain width-scaled block. Plain width-scaling (the default) makes a
   * section's real height track the window's width via `cqw` — which only
   * equals a full screen when the window happens to be exactly 16:9, so
   * the next section peeks in underneath at any other aspect ratio and
   * scroll-snap stops feeling like one-screen-per-page. Use `screenFit`
   * for sections in the snap-scrolled sequence (src/app/braindeck/page.tsx)
   * where each Figma frame IS meant to be one screen; leave it off for
   * normal scrolling content (detail pages, the FAQ list) where natural
   * height should just follow content.
   */
  screenFit?: boolean;
}

/**
 * A single container-query root for one Figma frame. Nested elements must
 * never set their own `containerType`, or their `cqw` values would start
 * resolving against that nested box instead of this one.
 */
export function Stage({ height, className, style, children, screenFit }: StageProps) {
  const root = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: screenFit ? "100%" : px(height),
        containerType: "inline-size",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );

  if (!screenFit) {
    return (
      <div className={className} style={{ position: "relative", width: "100%", height: px(height), containerType: "inline-size", overflow: "hidden", ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div className={`w-full h-dvh flex items-center justify-center ${className ?? ""}`} style={style}>
      <div className="max-h-full" style={{ width: `min(100%, calc(100dvh * ${DESIGN_WIDTH} / ${height}))`, aspectRatio: `${DESIGN_WIDTH} / ${height}` }}>
        {root}
      </div>
    </div>
  );
}
