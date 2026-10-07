import type { ReactNode } from "react";
import { px } from "./stage";

interface BadgeProps {
  icon: ReactNode;
  label: string;
  /** Design-space font size in px (badges appear at a few different scales). */
  fontSize?: number;
  opacity?: number;
  className?: string;
  iconColor?: string;
}

export function Badge({ icon, label, fontSize = 13, opacity, className, iconColor = "#0f6" }: BadgeProps) {
  return (
    <div
      className={`bg-[#141414] border border-[#404040] flex gap-2 items-start rounded-lg shrink-0 whitespace-nowrap ${className ?? ""}`}
      style={{
        paddingInline: px(12),
        paddingBlock: px(6),
        borderRadius: px(8),
        gap: px(8),
        fontSize: px(fontSize),
        opacity,
      }}
    >
      <span className="font-normal shrink-0" style={{ color: iconColor }}>
        {icon}
      </span>
      <span className="text-white font-semibold shrink-0">{label}</span>
    </div>
  );
}
