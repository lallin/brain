import Image from "next/image";
import type { AwardItem } from "@/types/boilerlab";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";

const ASSET_ROOT = "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/awards";

// Braindeck's own awards/certifications (its "Proven Excellence" section at
// braindeck.net), replacing the live boilerlab.ai site's generic partner-logo
// strip — same scrolling showcase frame, different content.
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

// The `#partners.partners-open`/`.partners-leaving` CSS selectors target the
// <section id="partners"> ancestor itself, so BoilerLabApp applies the state
// class there (see `partnersSectionClass` in BoilerLabApp.tsx) — this
// component only renders the slide's content.
export function PartnersSlide() {
  return (
    <div className="slide-inner stars-slide">
      <div className="stars-slide-inner hero-content partners-content">
        <div className="partners-hero-copy">
          <EditableText id="partners.became" as="p" className="subtitle">
            1234
          </EditableText>
          <EditableText id="partners.eyebrow" as="h2" className="eyebrow" html="1234" />
          <EditableText id="partners.grew" as="p" className="subtitle">
            1234
          </EditableText>
        </div>
        <div className="partners-showcase-frame">
          <span className="partners-node partners-node-top-left" aria-hidden="true" />
          <span className="partners-node partners-node-top-right" aria-hidden="true" />
          <span className="partners-node partners-node-bottom-left" aria-hidden="true" />
          <span className="partners-node partners-node-bottom-right" aria-hidden="true" />
          <div className="partners-showcase" aria-label="Our partners">
            <EditableText id="partners.label" as="p" className="partners-label">
              1234
            </EditableText>
            <div className="partners-logos-viewport">
              <div className="partners-logos-track">
                <LogoSet />
                <LogoSet ariaHidden />
                <LogoSet ariaHidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
