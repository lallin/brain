import type { ReactNode } from "react";
import { px } from "./stage";
import { Badge } from "./Badge";
import { PrimaryButton } from "./Buttons";

export interface SolutionCardSizing {
  paddingX: number;
  paddingYTop: number;
  paddingYBottom?: number;
  gap: number;
  radius: number;
  badgeFontSize: number;
  productCodeFontSize: number;
  titleFontSize: number;
  descriptionFontSize: number;
  ctaPaddingX: number;
  ctaPaddingY: number;
  ctaFontSize: number;
}

export interface SolutionCardData {
  badgeIcon: ReactNode;
  badgeLabel: string;
  badgeIconColor?: string;
  productCode: string;
  title: string | string[];
  description: string[];
}

interface SolutionCardProps {
  data: SolutionCardData;
  sizing: SolutionCardSizing;
  /** Stacked/queued cards in the carousel dim everything but the title. */
  dimmed?: boolean;
  href?: string;
  footer?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DIM_OPACITY = 0.2;

export function SolutionCard({ data, sizing, dimmed, href, footer, className, style }: SolutionCardProps) {
  const titleLines = Array.isArray(data.title) ? data.title : [data.title];

  const wrapperClassName = `bg-[#1a1a1a] border border-[#383838] flex flex-col items-start overflow-hidden ${
    href ? "cursor-pointer" : ""
  } ${className ?? ""}`;
  const wrapperStyle: React.CSSProperties = {
    paddingInline: px(sizing.paddingX),
    paddingTop: px(sizing.paddingYTop),
    paddingBottom: px(sizing.paddingYBottom ?? sizing.paddingYTop),
    gap: px(sizing.gap),
    borderRadius: px(sizing.radius),
    ...style,
  };

  const content = (
    <>
      <Badge
        icon={data.badgeIcon}
        label={data.badgeLabel}
        iconColor={data.badgeIconColor}
        fontSize={sizing.badgeFontSize}
        opacity={dimmed ? DIM_OPACITY : undefined}
        className="transition-all duration-500 ease-out"
      />
      <p
        className="font-medium not-italic text-[#999] shrink-0 whitespace-nowrap transition-all duration-500 ease-out"
        style={{ fontSize: px(sizing.productCodeFontSize), opacity: dimmed ? DIM_OPACITY : undefined }}
      >
        {data.productCode}
      </p>
      <div
        className="font-bold not-italic text-white shrink-0 whitespace-nowrap transition-all duration-500 ease-out"
        style={{ fontSize: px(sizing.titleFontSize) }}
      >
        {titleLines.map((line, i) => (
          <p key={i} className="leading-tight">
            {line}
          </p>
        ))}
      </div>
      <div
        className="font-normal not-italic text-[#8c8c8c] shrink-0 whitespace-nowrap transition-all duration-500 ease-out"
        style={{ fontSize: px(sizing.descriptionFontSize), opacity: dimmed ? DIM_OPACITY : undefined }}
      >
        {data.description.map((line, i) => (
          <p key={i} className="leading-[1.5]">
            {line}
          </p>
        ))}
      </div>
      <PrimaryButton
        paddingX={sizing.ctaPaddingX}
        paddingY={sizing.ctaPaddingY}
        fontSize={sizing.ctaFontSize}
        radius={24}
        opacity={dimmed ? DIM_OPACITY : undefined}
        decorative={Boolean(href)}
        className="transition-all duration-500 ease-out"
      >
        Learn more →
      </PrimaryButton>
      {footer}
    </>
  );

  if (href) {
    return (
      <a href={href} className={wrapperClassName} style={wrapperStyle}>
        {content}
      </a>
    );
  }
  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {content}
    </div>
  );
}
