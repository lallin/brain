import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { RotatingSolutionCards, type RoleRect } from "./RotatingSolutionCards";
import { CATEGORY_ACTIVE_SIZING, CATEGORY_QUEUED_SIZING } from "./cardSizingPresets";
import type { SolutionCardData } from "./SolutionCard";
import { CategoryDots } from "./CategoryDots";

const PRODUCTS: Record<string, SolutionCardData> = {
  "robot-defect-detection": {
    badgeIcon: "⚙",
    badgeLabel: "Enterprise / Industrial AX",
    productCode: "Robot Component Defect Detection",
    title: ["AI-Powered Zero-Defect", "Detection"],
    description: ["Real-time detection of micro-defects in robot", "reducers within 1ms using VIB and AI"],
  },
  "multimodal-emotion-recognition": {
    badgeIcon: "⚙",
    badgeLabel: "Enterprise / Industrial AX",
    productCode: "Multimodal Emotion Recognition",
    title: ["Multimodal Advanced", "Emotion Recognition"],
    description: ["A precise emotion prediction solution that integrates", "speech, facial expressions, and behavioral data"],
  },
};

const PRODUCT_HREF: Record<string, string> = {
  "robot-defect-detection": "/braindeck/solutions/robot-defect-detection",
  "multimodal-emotion-recognition": "/braindeck/solutions/multimodal-emotion-recognition",
};

const ROLE_RECTS: RoleRect[] = [
  { left: 355, top: 484, width: 1413 },
  { left: 458, top: 199, width: 950 },
];

const INITIAL_ORDER = ["robot-defect-detection", "multimodal-emotion-recognition"];

/** enterprise-main-1/2, enterprise-trans-1/2 (Figma 63:158, 63:196, 63:234, 63:272). */
export function EnterpriseSection() {
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

      <CategoryDots active={2} />
    </Stage>
  );
}
