import Image from "next/image";
import type { AwardItem } from "@/types/boilerlab";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { DraggableBox } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/DraggableBox";

const ASSET_ROOT = "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/awards";

// Same list/ids as PartnersSlide.tsx (duplicated rather than imported so the
// original component/file stays completely untouched). Braindeck's own
// awards/certifications ("Proven Excellence" at braindeck.net), replacing the
// live boilerlab.ai site's generic partner-logo strip.
const AWARDS: AwardItem[] = [
  { name: "German Innovation Award 2026", src: `${ASSET_ROOT}/german-innovation-award-2026.webp`, width: 500, height: 500 },
  { name: "CES 2025 Innovation Award", src: `${ASSET_ROOT}/ces-2025-innovation-award.png`, width: 600, height: 570 },
  { name: "EDISON AWARDS", src: `${ASSET_ROOT}/edison-awards.png`, width: 600, height: 570 },
  { name: "Patent", src: `${ASSET_ROOT}/patent.png`, width: 600, height: 570 },
  { name: "ISO 9001", src: `${ASSET_ROOT}/iso-9001.png`, width: 600, height: 570 },
];

function LogoSet({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul className="partners-logos" aria-hidden={ariaHidden} aria-label={ariaHidden ? undefined : "Awards and certifications"}>
      {AWARDS.map((award, i) => (
        <li className="partner-logo" key={i}>
          <Image
            src={award.src}
            alt={ariaHidden ? "" : award.name}
            width={award.width}
            height={award.height}
            draggable={false}
          />
          <span className="partner-logo-caption" aria-hidden={ariaHidden}>
            {award.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Scroll-native sibling of PartnersSlide: identical markup/classNames/
 * EditableText ids (so edits stay shared with the original page). The
 * frame-widening/label/logo reveal is the same `#partners.partners-open`
 * CSS transition boilerlab.css already defines (0.84s cubic-bezier, matching
 * the live site) — BoilerLabScrollApp toggles that class (plus `present`) on
 * the `<section id="partners">` once it scrolls into view, the same way it's
 * toggled for the fixed deck in BoilerLabApp, so this component itself needs
 * no scroll-linked motion logic of its own.
 */
export function PartnersSlideScroll() {
  return (
    <div className="slide-inner stars-slide">
      <div className="stars-slide-inner hero-content partners-content">
        <div className="partners-hero-copy">
          <EditableText id="partners.became" as="p" className="subtitle">
            Became
          </EditableText>
          <EditableText id="partners.eyebrow" as="h2" className="eyebrow" html="Essential<br/>on AI market" />
          <EditableText id="partners.grew" as="p" className="subtitle">
            Grew B2B Ecosystem Product
          </EditableText>
        </div>
        {/* Draggable so its vertical position is a direct drag instead of a
            hand-tuned `--partners-frame-offset-y` CSS value each time it
            needs to move — DraggableBox's own `translate` offset composes
            with this element's existing `transform` (its centering
            translate/scale-open animation), same as everywhere else this
            pattern's used. */}
        <DraggableBox id="partners.showcase-frame" className="partners-showcase-frame">
          <span className="partners-node partners-node-top-left" aria-hidden="true" />
          <span className="partners-node partners-node-top-right" aria-hidden="true" />
          <span className="partners-node partners-node-bottom-left" aria-hidden="true" />
          <span className="partners-node partners-node-bottom-right" aria-hidden="true" />
          <div className="partners-showcase" aria-label="Our partners">
            <EditableText id="partners.label" as="p" className="partners-label">
              Our partners and clients:
            </EditableText>
            <div className="partners-logos-viewport">
              <div className="partners-logos-track">
                <LogoSet />
                <LogoSet ariaHidden />
                <LogoSet ariaHidden />
              </div>
            </div>
          </div>
        </DraggableBox>
      </div>
    </div>
  );
}
