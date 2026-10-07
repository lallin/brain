"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import { easeInOut, motion, useScroll, useTransform } from "framer-motion";

export interface ScrollFrameRevealLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ScrollFrameRevealProps {
  /** Small label above the title. Change or remove freely. */
  eyebrow?: string;
  /** Main heading shown once the frame has expanded. Supports a literal <br/>. */
  title?: string;
  /** Logo row rendered inside the frame — swap these for your own images. */
  logos?: ScrollFrameRevealLogo[];
  /** Box width before any scroll progress, in px. */
  collapsedWidth?: number;
  /** Box width once fully expanded, in px. */
  expandedWidth?: number;
  /** Fixed box height for the whole animation, in px. */
  frameHeight?: number;
  className?: string;
}

const DEFAULT_LOGOS: ScrollFrameRevealLogo[] = [
  { src: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/partners/zapier-logo.svg", alt: "Zapier", width: 83, height: 22 },
  { src: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/partners/hugging-face-logo.svg", alt: "Hugging Face", width: 100, height: 22 },
  { src: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/partners/adobe-logo.svg", alt: "Adobe", width: 100, height: 26 },
  { src: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/partners/data-stax-logo.svg", alt: "DataStax", width: 136, height: 57 },
  { src: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/partners/fujifilm-logo.svg", alt: "Fujifilm", width: 101, height: 17 },
];

/**
 * Scroll-triggered "frame expand reveal": a thin bordered box centered on
 * screen grows to its target width as this section scrolls through the
 * viewport, then its content (eyebrow/title/logos) fades in right after the
 * expansion finishes. Corner markers stay pinned to the box's four corners
 * automatically (they're absolutely positioned inside the box itself, so no
 * extra motion values are needed for them).
 *
 * Standalone by design — does not touch any existing slide/component. It
 * needs an ancestor that actually scrolls (this page's main deck is a fixed,
 * non-scrolling slide carousel, so mounting this straight into one of those
 * slides will not animate — use it on a normal scrolling page/section).
 */
export function ScrollFrameReveal({
  eyebrow = "Our partners and clients",
  title = "Trusted by teams<br/>building with AI",
  logos = DEFAULT_LOGOS,
  collapsedWidth = 10,
  expandedWidth = 800,
  frameHeight = 320,
  className,
}: ScrollFrameRevealProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  // 0 -> 0.7: box expands from collapsedWidth to expandedWidth.
  const width = useTransform(scrollYProgress, [0, 0.7], [collapsedWidth, expandedWidth], {
    ease: easeInOut,
    clamp: true,
  });

  // 0.7 -> 1: content fades in right after the box finishes expanding.
  const contentOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1], {
    ease: easeInOut,
    clamp: true,
  });

  return (
    <div ref={sectionRef} className={className} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem 0" }}>
      <motion.div
        style={{
          position: "relative",
          width,
          height: frameHeight,
          border: "1px solid var(--sfr-border, #3a3a3a)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Corner markers — anchored to the box's own corners via absolute
            positioning, so they track the box automatically as it resizes;
            their own size/style never changes. */}
        <span aria-hidden style={cornerStyle("top", "left")} />
        <span aria-hidden style={cornerStyle("top", "right")} />
        <span aria-hidden style={cornerStyle("bottom", "left")} />
        <span aria-hidden style={cornerStyle("bottom", "right")} />

        {/* Content stays full target width and centered, so it doesn't
            reflow as the frame around it grows — the frame just reveals
            more of it. Hidden by width+overflow until the box is wide
            enough, then also fades in via contentOpacity. */}
        <motion.div
          style={{
            opacity: contentOpacity,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: expandedWidth,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            textAlign: "center",
            padding: "0 2rem",
          }}
        >
          {eyebrow && <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.7 }}>{eyebrow}</p>}
          {title && (
            <h2
              style={{ margin: 0, fontSize: "2rem", lineHeight: 1.2 }}
              dangerouslySetInnerHTML={{ __html: title }}
            />
          )}
          {logos.length > 0 && (
            <ul
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                gap: "2rem",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {logos.map((logo) => (
                <li key={logo.src}>
                  <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} style={{ height: "auto" }} />
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

const MARKER_SIZE = 8;

function cornerStyle(vertical: "top" | "bottom", horizontal: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    [vertical]: -(MARKER_SIZE / 2),
    [horizontal]: -(MARKER_SIZE / 2),
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    background: "var(--sfr-border, #3a3a3a)",
  };
}
