import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { RotatingSolutionCards, type RoleRect } from "./RotatingSolutionCards";
import { MEDIA_ACTIVE_SIZING, MEDIA_QUEUED_SIZING } from "./cardSizingPresets";
import type { SolutionCardData } from "./SolutionCard";
import { CategoryDots } from "./CategoryDots";

const PRODUCTS: Record<string, SolutionCardData> = {
  "iris-5": {
    badgeIcon: "♪",
    badgeLabel: "Media & Content",
    productCode: "IRIS - 5",
    title: "Deepfake Music Detection",
    description: ["Protect copyrights by accurately distinguishing", "between AI-generated music and human-created music"],
  },
  "iris-6": {
    badgeIcon: "♪",
    badgeLabel: "Media & Content",
    productCode: "IRIS - 6",
    title: ["Deepfake Image/Video", "Detection"],
    description: ["Prevents the spread of false information by detecting", "AI-manipulated images and video content"],
  },
  "lucy-5": {
    badgeIcon: "♪",
    badgeLabel: "Media & Content",
    productCode: "LUCY - 5",
    title: "Voice Cloning TTS",
    description: ["Clones a natural voice from a small amount of voice", "samples for use in various content production"],
  },
  "lucy-7": {
    badgeIcon: "♪",
    badgeLabel: "Media & Content",
    productCode: "LUCY - 7",
    title: "AI Music Generation",
    description: ["Automatically generates music of the desired genre", "and mood with a text prompt"],
  },
};

const PRODUCT_HREF: Record<string, string> = {
  "iris-5": "/braindeck/solutions/iris-5",
  "iris-6": "/braindeck/solutions/iris-6",
  "lucy-5": "/braindeck/solutions/lucy-5",
  "lucy-7": "/braindeck/solutions/lucy-7",
};

const ROLE_RECTS: RoleRect[] = [
  { left: 355, top: 484, width: 1413 },
  { left: 670, top: 281, width: 950 },
  { left: 458, top: 199, width: 950 },
  { left: 223, top: 117, width: 950 },
];

const INITIAL_ORDER = ["iris-5", "iris-6", "lucy-5", "lucy-7"];

/** carousel-main-1..4 / carousel-trans-1..4 (Figma 60:2 .. 60:394) — verified all four rotations reproduce the same 4-card round-robin. */
export function CarouselSection() {
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
        activeSizing={MEDIA_ACTIVE_SIZING}
        queuedSizing={MEDIA_QUEUED_SIZING}
      />

      <CategoryDots active={0} />
    </Stage>
  );
}
