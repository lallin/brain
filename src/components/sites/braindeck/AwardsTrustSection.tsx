import Image from "next/image";
import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BraindeckSphere } from "./BraindeckSphere";

interface AwardCardProps {
  left: number;
  top: number;
  width: number;
  height: number;
  iconSrc: string;
  iconHeight: number;
  borderColor: string;
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  titleSize: number;
  description: string;
  shadow: string;
  opacity?: number;
}

function AwardCard({ left, top, width, height, iconSrc, iconHeight, borderColor, eyebrow, eyebrowColor, title, titleSize, description, shadow, opacity }: AwardCardProps) {
  return (
    <div
      className="absolute flex flex-col items-start overflow-hidden backdrop-blur-[8px]"
      style={{
        left: px(left),
        top: px(top),
        width: px(width),
        height: px(height),
        gap: px(16),
        padding: px(24),
        borderRadius: px(20),
        background: "rgba(18,18,26,0.8)",
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        opacity,
      }}
    >
      <div className="relative shrink-0 w-full overflow-hidden" style={{ height: px(iconHeight), borderRadius: px(12) }}>
        <Image src={iconSrc} alt="" fill sizes="280px" className="object-cover pointer-events-none" />
      </div>
      <div className="flex flex-col items-start w-full" style={{ gap: px(8) }}>
        <p className="font-bold uppercase" style={{ color: eyebrowColor, fontSize: px(11), letterSpacing: px(1) }}>
          {eyebrow}
        </p>
        <p className="font-bold text-white" style={{ fontSize: px(titleSize) }}>
          {title}
        </p>
        <p className="text-[#8c8c8c]" style={{ fontSize: px(13), lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

/** awards-trust-main (Figma 122:53) — the closing "proof of trust" section: award showcase + on-ledger verification card. */
export function AwardsTrustSection() {
  return (
    <Stage height={1080} screenFit className="bg-[#050508] relative overflow-hidden">
      <div className="absolute inset-0 opacity-6 pointer-events-none">
        <Image src="/sites/braindeck/images/awards-tech-grid.png" alt="" fill sizes="1920px" className="object-cover" />
      </div>
      <div className="absolute pointer-events-none" style={{ left: px(560 - 150), top: px(340 - 150), width: px(1100), height: px(900) }}>
        <Image src="/sites/braindeck/icons/awards-central-glow.svg" alt="" fill sizes="1100px" className="object-contain" />
      </div>

      <BraindeckHeader />

      <div className="absolute flex flex-col items-center text-center w-full" style={{ top: px(140), gap: px(16) }}>
        <p className="font-extrabold uppercase text-[#0f6]" style={{ fontSize: px(14), letterSpacing: px(4) }}>
          Proven Excellence
        </p>
        <p className="font-extrabold text-white" style={{ fontSize: px(52), letterSpacing: "-1.5px" }}>
          Proof of Our Technology and Trust
        </p>
      </div>

      <div className="absolute" style={{ left: px(80), top: px(300), width: px(1760), height: px(680) }}>
        <div className="absolute" style={{ left: "50%", top: px(200), width: px(600), height: px(400), transform: "translateX(-50%)" }}>
          <Image src="/sites/braindeck/icons/awards-pedestal-stage.svg" alt="" fill sizes="600px" className="object-contain pointer-events-none" />
        </div>

        <div className="absolute overflow-hidden rounded-full" style={{ left: "50%", top: px(40), width: px(500), height: px(500), transform: "translateX(-50%)" }}>
          <div className="absolute inset-0">
            <Image src="/sites/braindeck/icons/awards-outer-glow.svg" alt="" fill sizes="500px" className="object-contain pointer-events-none" />
          </div>
          <div className="absolute overflow-hidden rounded-full" style={{ inset: px(10) }}>
            <BraindeckSphere />
            <div className="absolute inset-0 bg-black/10 rounded-full" />
          </div>
          <div className="absolute inset-0 opacity-15">
            <Image src="/sites/braindeck/images/awards-scanlines.png" alt="" fill sizes="500px" className="object-cover pointer-events-none" />
          </div>
        </div>

        <AwardCard
          left={140}
          top={110}
          width={280}
          height={380}
          iconSrc="/sites/braindeck/images/award-gartner.png"
          iconHeight={160}
          borderColor="rgba(255,255,255,0.08)"
          eyebrow="Recognized Leader"
          eyebrowColor="#0f6"
          title="Gartner 2025"
          titleSize={20}
          description="Named Cool Vendor in AI core Voice and Neural Synthesis Technologies."
          shadow="-10px 15px 24px 0px rgba(0,0,0,0.4)"
          opacity={0.8}
        />

        <div
          className="absolute flex flex-col items-start overflow-hidden backdrop-blur-[12px]"
          style={{
            left: "50%",
            top: px(40),
            width: px(380),
            height: px(480),
            transform: "translateX(-50%)",
            gap: px(24),
            padding: px(32),
            borderRadius: px(24),
            background: "rgba(18,18,26,0.8)",
            border: "1.5px solid rgba(0,255,102,0.27)",
            boxShadow: "0px 20px 40px 0px rgba(0,255,102,0.13)",
          }}
        >
          <div className="relative shrink-0 w-full overflow-hidden" style={{ height: px(200), borderRadius: px(16) }}>
            <Image src="/sites/braindeck/images/award-ces.png" alt="" fill sizes="380px" className="object-cover pointer-events-none" />
          </div>
          <div className="flex flex-col items-start w-full" style={{ gap: px(12) }}>
            <div className="flex items-center" style={{ gap: px(8) }}>
              <div className="relative shrink-0" style={{ width: px(16), height: px(16) }}>
                <Image src="/sites/braindeck/icons/awards-star.svg" alt="" fill sizes="16px" className="object-contain pointer-events-none" />
              </div>
              <p className="font-extrabold uppercase text-[#0f6]" style={{ fontSize: px(12), letterSpacing: px(1.5) }}>
                Winner
              </p>
            </div>
            <p className="font-extrabold text-white" style={{ fontSize: px(26) }}>
              CES 2025
            </p>
            <p className="text-[#8c8c8c]" style={{ fontSize: px(14), lineHeight: 1.5 }}>
              Honoring outstanding engineering and design in consumer AI Voice technology solutions globally.
            </p>
          </div>
        </div>

        <AwardCard
          left={940}
          top={110}
          width={280}
          height={380}
          iconSrc="/sites/braindeck/images/award-german-design.png"
          iconHeight={160}
          borderColor="rgba(255,255,255,0.08)"
          eyebrow="Excellence in AX"
          eyebrowColor="#0f6"
          title="German Design 2026"
          titleSize={20}
          description="Distinguished for exceptional user-centric speech interface architecture."
          shadow="10px 15px 24px 0px rgba(0,0,0,0.4)"
          opacity={0.8}
        />

        <div
          className="absolute flex flex-col items-start overflow-hidden backdrop-blur-[8px]"
          style={{
            left: px(1300),
            top: px(160),
            width: px(320),
            height: px(400),
            gap: px(20),
            padding: px(28),
            borderRadius: px(20),
            background: "rgba(13,13,21,0.95)",
            border: "1.5px solid rgba(0,122,255,0.53)",
            boxShadow: "0px 16px 30px 0px rgba(0,0,0,0.53)",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: px(52), height: px(52), borderRadius: px(14), background: "rgba(0,122,255,0.08)", border: "1.5px solid #007aff" }}
          >
            <div className="relative shrink-0" style={{ width: px(24), height: px(24) }}>
              <Image src="/sites/braindeck/icons/awards-circle-x.svg" alt="" fill sizes="24px" className="object-contain pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col items-start w-full" style={{ gap: px(8) }}>
            <p className="font-extrabold text-white w-full" style={{ fontSize: px(20) }}>
              Secure Chain
            </p>
            <p className="text-[#8c8c8c] w-full" style={{ fontSize: px(13), lineHeight: 1.4 }}>
              All Braindeck certifications and patents are cryptographically logged on-ledger to prevent fraud and deepfake tech spoofing.
            </p>
          </div>
          <div className="flex items-center w-full" style={{ gap: px(8), paddingBlock: px(8) }}>
            <div className="relative shrink-0" style={{ width: px(8), height: px(8) }}>
              <Image src="/sites/braindeck/icons/awards-status-dot.svg" alt="" fill sizes="8px" className="object-contain pointer-events-none" />
            </div>
            <p className="font-bold uppercase text-[#0f6]" style={{ fontSize: px(12), letterSpacing: px(0.5) }}>
              Verified Active Audit
            </p>
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-full font-bold text-white"
            style={{ height: px(48), borderRadius: px(12), background: "#007aff", fontSize: px(14) }}
          >
            Verify Authenticity
          </button>
        </div>
      </div>

      <div className="absolute flex items-center justify-between w-full text-[#8c8c8c]" style={{ top: px(1000), paddingInline: px(80), fontSize: px(13) }}>
        <p>© 2025 Braindeck Technology Inc. All rights reserved.</p>
        <div className="flex items-start" style={{ gap: px(40) }}>
          <p>System Status: Operational</p>
          <p>Cryptographic Trust Protocol v4.12</p>
        </div>
      </div>
    </Stage>
  );
}
