import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";
import { Badge } from "./Badge";
import { PrimaryButton } from "./Buttons";

/** voucher-intro (Figma 107:50) — a static promo card, no rotation. */
export function VoucherIntroSection() {
  return (
    <Stage height={1080} screenFit className="bg-[#0d0d0d]">
      <BraindeckHeader />

      <div className="absolute rounded-full overflow-hidden" style={{ left: px(-350), top: px(190), width: px(700), height: px(700), borderRadius: px(350) }}>
        <BraindeckSphere />
      </div>

      <a
        href="/braindeck/solutions/boho-shieldh"
        className="absolute bg-[#1a1a1a] border border-[#383838] flex flex-col items-start overflow-hidden cursor-pointer"
        style={{ left: px(253), top: px(350), width: px(1413), height: px(380), gap: px(14), padding: `${px(36)} ${px(40)}`, borderRadius: px(16) }}
      >
        <Badge icon="©" label="Verified Voucher Program" fontSize={16} />
        <p className="font-medium text-[#999]" style={{ fontSize: px(15) }}>
          Boho Shieldh
        </p>
        <p className="font-bold text-white" style={{ fontSize: px(40) }}>
          AI-Powered Digital Content Protection Infrastructure
        </p>
        <p className="text-[#8c8c8c]" style={{ fontSize: px(14), lineHeight: 1.5 }}>
          A next-generation copyright protection solution that preemptively blocks illegal leaks of digital content and uses AI to analyze patterns and routes to track responsible parties.
        </p>
        <PrimaryButton paddingX={20} paddingY={10} fontSize={14} radius={24} decorative>
          Learn more →
        </PrimaryButton>
      </a>
    </Stage>
  );
}
