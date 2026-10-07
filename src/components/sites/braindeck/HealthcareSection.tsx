import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { RotatingSolutionCards, type RoleRect } from "./RotatingSolutionCards";
import { CATEGORY_ACTIVE_SIZING, CATEGORY_QUEUED_SIZING } from "./cardSizingPresets";
import type { SolutionCardData } from "./SolutionCard";
import { CategoryDots } from "./CategoryDots";

const PRODUCTS: Record<string, SolutionCardData> = {
  "blings-aac": {
    badgeIcon: "♡",
    badgeLabel: "Health Care",
    productCode: "BLINGS (AAC)",
    title: "AAC Voice Communication",
    description: ["Converts disordered speech into normal", "speech in real time"],
  },
  revocal: {
    badgeIcon: "♡",
    badgeLabel: "Health Care",
    productCode: "Revocal",
    title: ["Diagnosis & Rehabilitation", "Integration"],
    description: ["Automatically generates a customized rehabilitation", "program based on voice analysis"],
  },
};

const PRODUCT_HREF: Record<string, string> = {
  "blings-aac": "/braindeck/solutions/blings-aac",
  revocal: "/braindeck/solutions/revocal",
};

const ROLE_RECTS: RoleRect[] = [
  { left: 355, top: 484, width: 1413 },
  { left: 458, top: 199, width: 950 },
];

const INITIAL_ORDER = ["blings-aac", "revocal"];

/** healthcare-main-1/2, healthcare-trans-1/2 (Figma 63:2, 63:40, 63:78, 63:116). */
export function HealthcareSection() {
  return (
    <Stage height={1080} screenFit className="bg-[#0d0d0d]">
      <BraindeckHeader />

      <div className="absolute rounded-full overflow-hidden" style={{ left: px(-350), top: px(190), width: px(700), height: px(700), borderRadius: px(350) }}>
        <BraindeckSphere />
      </div>

      <RotatingSolutionCards
        products={PRODUCTS}
        productHref={PRODUCT_HREF}
        initialOrder={INITIAL_ORDER}
        roleRects={ROLE_RECTS}
        activeSizing={CATEGORY_ACTIVE_SIZING}
        queuedSizing={CATEGORY_QUEUED_SIZING}
      />

      <CategoryDots active={1} />
    </Stage>
  );
}
