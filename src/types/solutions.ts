// Content types for the solution detail pages (src/app/solutions/...),
// matching the real braindeck.net site's own two page templates:
//
// 1. An individual solution (IRIS-5, LUCY-7, ...): hero -> problem/solution
//    -> features -> how it works -> use cases -> security -> FAQ -> CTA.
// 2. A product category hub (Voucher, Content, Healthcare, AX): the card
//    that groups several individual solutions. Only "Voucher" has a real,
//    richer hub page on the source site (comparison/workflow/delivery
//    sections) — the other three categories don't have that content in the
//    source, so their hub pages are a simple listing instead of fabricated
//    detail.

export interface FaqItem {
  question: string;
  answer?: string;
}

export interface SolutionDetail {
  /** URL slug: /solutions/[slug] */
  slug: string;
  /** Which category hub this belongs under (see CATEGORY_HUBS below). */
  categoryId: string;
  code: string;
  name: string;
  tagline: string;
  problemTitle: string;
  problemText: string;
  featuresTitle: string;
  features: string[];
  howItWorksTitle: string;
  howItWorks: string;
  useCasesTitle: string;
  useCases: string[];
  securityTitle: string;
  security: string;
  faq: FaqItem[];
}

export interface CategoryComparisonPoint {
  old: string;
  ours: string;
}

export interface CategoryFeature {
  title: string;
  points: string[];
}

export interface CategoryDelivery {
  title: string;
  points: string[];
}

export interface CategoryWorkflowStep {
  step: string;
  title: string;
  description: string;
}

/** The richer, Voucher-only hub template. Every field but the first four is optional so the other three categories can render a plain listing instead. */
export interface CategoryHub {
  /** URL slug: /solutions/category/[slug] */
  slug: string;
  /** Matches products-data.ts's product id (sigma, atomic-mail, aimlapi, atomicbot). */
  productId: string;
  name: string;
  tagline: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  comparisonOldTitle?: string;
  comparisonNewTitle?: string;
  comparison?: CategoryComparisonPoint[];
  approachQuote?: string;
  featuresTitle?: string;
  features?: CategoryFeature[];
  deliveryTitle?: string;
  delivery?: CategoryDelivery[];
  industriesTitle?: string;
  industries?: string[];
  workflowTitle?: string;
  workflow?: CategoryWorkflowStep[];
}
