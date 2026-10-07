"use client";

import Image from "next/image";
import Link from "next/link";
import { Cpu, Heart, Music, Ticket, type LucideIcon } from "lucide-react";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { getCategoryHubByProductId } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import type { ProductIconName, ProductItem } from "@/types/boilerlab";

interface ProductBoxCarouselProps {
  product: ProductItem;
  /** Whether this product's outer card is the one currently focused in the
   * deck's card-stack (see ProductsSlide) — gates tab order same as before. */
  focused: boolean;
  /** Which box (image) is showing — controlled by ProductsSlide, which
   * steps it from the SAME wheel handler that drives the card-stack (a
   * single decision point: box-step first while there's one left in this
   * card, only then let the card-stack move — see ProductsSlide's comment). */
  index: number;
  onGoTo: (next: number) => void;
}

const BOX_WIDTH = 84; // % of the card
const BOX_GAP = 3; // % margin on each side of a box (adjacent boxes sit 2*GAP apart)
const PITCH = BOX_WIDTH + BOX_GAP * 2;
const CENTER_SHIFT = (100 - BOX_WIDTH) / 2 - BOX_GAP;

const ICONS: Record<ProductIconName, LucideIcon> = { Music, Heart, Cpu, Ticket };

/** The category badge (icon in a rounded, tinted square) — real
 * braindeck.net markup is `<div class="w-12 h-12 bg-accent/10 rounded-xl ...
 * text-accent"><svg class="lucide lucide-music">`, reproduced here as
 * `.product-heading-icon` (see boilerlab.css) instead of the old raster
 * logo `<Image>`. */
function ProductIcon({ name }: { name: ProductIconName }) {
  const Icon = ICONS[name];
  return (
    <span className="product-heading-icon" aria-hidden="true">
      <Icon strokeWidth={1.5} />
    </span>
  );
}

/**
 * New feature (not part of the live boilerlab.ai site): each product with
 * more than one image gets that many *whole boxes* (copy + visual
 * together) — modeled on mercury.com's "Command" feature carousel — not
 * just a swapped image behind static text. Moving to the next box slides
 * the entire box left, bringing the next box's own copy+visual in with
 * it. Each box is a fully independent sub-solution (own name/headline/
 * description/image via `product.boxes[i]`, own EditableText keys) — they
 * used to share one product-level name/headline/description, which meant
 * editing any one box's copy silently overwrote all the others sharing that
 * product. Purely presentational/controlled — ProductsSlide owns the index
 * and all wheel handling.
 */
export function ProductBoxCarousel({ product, focused, index, onGoTo }: ProductBoxCarouselProps) {
  const boxes = product.boxes;
  const hasMultiple = boxes.length > 1;
  const categoryHref = `/solutions/category/${getCategoryHubByProductId(product.id)?.slug ?? ""}`;

  return (
    <div className="product-card-viewport">
      <div
        className="product-card-boxes"
        style={{ transform: `translateX(${-(index * PITCH) + CENTER_SHIFT}%)` }}
      >
        {boxes.map((box, i) => (
          <div className="product-card-box" key={box.image} aria-hidden={i !== index}>
            {/* `.product-card-box` is a row (copy column + visual column side
                by side) — this wrapper keeps that same single flex slot but
                stacks a duplicate heading above `.product-copy`'s own top
                border instead of squeezing in as a third row item. Separate
                EditableText id so it's independently editable, and no
                htmlId (a real element id must stay unique — `.product-heading`
                below still owns `${product.id}-${i}-title`, which
                product-info's aria-labelledby points at). */}
            <div className="product-copy-column">
              <div className="product-heading product-heading-above" aria-hidden="true">
                <ProductIcon name={product.icon} />
                <EditableText id={`products.${product.id}.name-above`} as="h2">
                  {product.name}
                </EditableText>
              </div>
              <div className="product-copy">
                <div className="product-header">
                  <div className="product-heading">
                    <ProductIcon name={product.icon} />
                    <EditableText id={`products.${product.id}.${i}.name`} htmlId={`${product.id}-${i}-title`} as="h2">
                      {box.name}
                    </EditableText>
                  </div>
                  <Link
                    className="button primary-button default product-link"
                    href={box.slug ? `/solutions/${box.slug}` : categoryHref}
                    tabIndex={focused && i === index ? 0 : -1}
                  >
                    <EditableText id={`products.${product.id}.cta`}>Learn More</EditableText>
                  </Link>
                </div>
                <div className="product-info">
                  <EditableText
                    id={`products.${product.id}.${i}.headline`}
                    as="h3"
                    html={box.headline.replace(/\n/g, "<br/>")}
                  />
                  <EditableText id={`products.${product.id}.${i}.description`} as="p">
                    {box.description}
                  </EditableText>
                </div>
              </div>
            </div>
            <div className="product-visual-column">
              <EditableText id={`products.${product.id}.visual.${i}.label`} as="p" className="product-visual-label">
                1234
              </EditableText>
              <div className="product-visual">
                <Image
                  src={box.image}
                  alt=""
                  width={1328}
                  height={1000}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="product-visual-image"
                />
              </div>
              {hasMultiple && (
                <div className="product-visual-controls">
                  <span className="product-visual-counter" aria-live="polite">
                    {index + 1}/{boxes.length}
                  </span>
                  <div className="product-visual-arrows">
                    <button
                      type="button"
                      className="product-visual-arrow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoTo(index - 1);
                      }}
                      tabIndex={focused ? 0 : -1}
                      aria-label={`Show previous box of ${product.name}`}
                    >
                      <span aria-hidden="true">←</span>
                    </button>
                    <button
                      type="button"
                      className="product-visual-arrow"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoTo(index + 1);
                      }}
                      tabIndex={focused ? 0 : -1}
                      aria-label={`Show next box of ${product.name}`}
                    >
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
