import Link from "next/link";
import type { ReactNode } from "react";
import { px } from "./stage";

interface ButtonSizing {
  paddingX: number;
  /** Vertical padding — ignored when `height` is given (fixed-height buttons center their label instead). */
  paddingY?: number;
  /** Fixed button height, for the hero's two 50px-tall pill buttons. */
  height?: number;
  fontSize: number;
  radius?: number;
}

interface PillButtonProps extends ButtonSizing {
  href?: string;
  /** Renders a plain, non-interactive span instead of a button/link — for a CTA that's decorative because its whole containing card is already the clickable link (avoids nesting a button inside an anchor). */
  decorative?: boolean;
  children: ReactNode;
  className?: string;
  opacity?: number;
}

function pillStyle({ paddingX, paddingY, height, fontSize, radius = 24 }: ButtonSizing, opacity?: number) {
  return {
    paddingInline: px(paddingX),
    paddingBlock: height === undefined ? px(paddingY ?? 0) : undefined,
    height: height === undefined ? undefined : px(height),
    fontSize: px(fontSize),
    borderRadius: px(radius),
    opacity,
  };
}

function makePillButton(toneClassName: string) {
  return function PillButton({ href, decorative, children, className, opacity, ...sizing }: PillButtonProps) {
    const classes = `${toneClassName} inline-flex items-center justify-center shrink-0 whitespace-nowrap ${className ?? ""}`;
    const style = pillStyle(sizing, opacity);
    if (decorative) {
      return (
        <span className={classes} style={style}>
          {children}
        </span>
      );
    }
    if (href) {
      return (
        <Link href={href} className={classes} style={style}>
          {children}
        </Link>
      );
    }
    return (
      <button type="button" className={classes} style={style}>
        {children}
      </button>
    );
  };
}

export const PrimaryButton = makePillButton("bg-[#00e566] text-[#0d0d0d] font-bold");
export const SecondaryButton = makePillButton("border border-[#808080] text-[#e6e6e6] font-medium");
export const DarkButton = makePillButton("bg-[#1a1a24] border border-[#33334d] text-white font-semibold");
export const WhiteButton = makePillButton("bg-white text-[#0a0a0a] font-semibold");

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="absolute bg-[#1f1f1f] border border-[#242424] inline-flex items-center text-[#bfbfbf] font-medium whitespace-pre rounded-2xl"
      style={{
        left: px(60),
        top: px(34),
        paddingInline: px(12),
        paddingBlock: px(6),
        fontSize: px(13),
        borderRadius: px(16),
      }}
    >
      ← Back to Solutions
    </Link>
  );
}
