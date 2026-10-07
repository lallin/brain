import type { SolutionCardSizing } from "./SolutionCard";

/** carousel-main-* (Figma 60:2 etc.) — the Media & Content category's card typography. */
export const MEDIA_ACTIVE_SIZING: SolutionCardSizing = {
  paddingX: 40,
  paddingYTop: 36,
  gap: 14,
  radius: 16,
  badgeFontSize: 16,
  productCodeFontSize: 15,
  titleFontSize: 40,
  descriptionFontSize: 14,
  ctaPaddingX: 20,
  ctaPaddingY: 10,
  ctaFontSize: 14,
};

export const MEDIA_QUEUED_SIZING: SolutionCardSizing = {
  paddingX: 28,
  paddingYTop: 24,
  paddingYBottom: 20,
  gap: 8,
  radius: 16,
  badgeFontSize: 13,
  productCodeFontSize: 12,
  titleFontSize: 28,
  descriptionFontSize: 11,
  ctaPaddingX: 14,
  ctaPaddingY: 6,
  ctaFontSize: 11,
};

/**
 * healthcare-main-* / enterprise-main-* (Figma 63:2, 63:158, etc.) — same
 * padding/badge/description/CTA scale as the media category, but a smaller
 * title size (36/24 vs. media's 40/28) to fit those categories' longer
 * product titles.
 */
export const CATEGORY_ACTIVE_SIZING: SolutionCardSizing = {
  ...MEDIA_ACTIVE_SIZING,
  titleFontSize: 36,
};

export const CATEGORY_QUEUED_SIZING: SolutionCardSizing = {
  ...MEDIA_QUEUED_SIZING,
  titleFontSize: 24,
};
