// Content types for the boilerlab.ai clone (site: boilerlab-ai-93c3cf36, page: root-8a5edab2)

export interface PartnerLogo {
  name: string;
  src: string;
  width: number;
  height: number;
}

export interface AwardItem {
  /** Caption shown under the image (award/certification name). */
  name: string;
  src: string;
  width: number;
  height: number;
}

/** One of lucide-react's own icon component names — matches the real
 * braindeck.net Solutions page, which renders each category's icon via
 * lucide-react too (confirmed by inspecting its rendered markup:
 * `<svg class="lucide lucide-music">` etc.), not a raster logo/emoji. */
export type ProductIconName = "Music" | "Heart" | "Cpu" | "Ticket";

/** One sub-solution "box" (image + copy) within a product's card. A card
 * with more than one box gets a right-arrow control to flip through them —
 * each box is a fully independent sub-solution (its own name/headline/
 * description/image), not a shared caption with just the picture swapped. */
export interface ProductBox {
  image: string;
  /** Shown next to the "Learn more ->" button (e.g. "Voice Cloning TTS"). */
  name: string;
  headline: string;
  description: string;
  /** This box's own solution page (matches a `SolutionDetail.slug` in
   * solutions-data.ts) — its "Learn more" button links to `/solutions/${slug}`
   * instead of the shared category hub. Omitted for a product (e.g. Voucher)
   * that has no per-box solution pages of its own, where the category hub
   * page already *is* the detail page. */
  slug?: string;
}

export interface ProductItem {
  id: string;
  /** The category-level name (e.g. "Voucher", "Media & Content"), shown
   * once above the divider — the same for every box in `boxes`. */
  name: string;
  icon: ProductIconName;
  url: string;
  boxes: ProductBox[];
}

export interface PressItem {
  author: string;
  handle: string;
  url: string;
  quote: string;
  left: string;
  top: string;
  width: string;
  rotate: string;
  z: number;
  delay: string;
  duration: string;
  index: number;
}

export interface FooterNavItem {
  label: string;
  sectionId: string;
}
