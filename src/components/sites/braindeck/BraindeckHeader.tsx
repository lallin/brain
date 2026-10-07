import Image from "next/image";
import { px } from "./stage";

export const NAV_ITEMS = ["Solution", "About Us", "Demo", "EN"];

export function BraindeckLogo({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <div className="absolute" style={{ left: px(left), top: px(top), width: px(width), height: px(height) }}>
      <Image
        src="/sites/braindeck/images/braindeck-logo.png"
        alt="Braindeck"
        fill
        sizes="400px"
        className="object-contain pointer-events-none"
        priority
      />
    </div>
  );
}

/** Static header used by every frame except the hero (which animates its own logo/nav in on a loop — see HeroSection). */
export function BraindeckHeader({ logoTop = 20, navTop = 22 }: { logoTop?: number; navTop?: number }) {
  return (
    <>
      <BraindeckLogo left={810} top={logoTop} width={300} height={42} />
      <div
        className="absolute flex items-center whitespace-nowrap font-normal not-italic text-[#ccc]"
        style={{ left: px(1460), top: px(navTop), gap: px(36), fontSize: px(15) }}
      >
        {NAV_ITEMS.map((item) => (
          <p key={item} className="shrink-0">
            {item}
          </p>
        ))}
      </div>
    </>
  );
}
