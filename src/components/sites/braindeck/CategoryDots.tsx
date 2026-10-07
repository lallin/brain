"use client";

import { px } from "./stage";

const CATEGORY_SECTION_IDS = ["section-media", "section-healthcare", "section-enterprise"];

/**
 * The 3-dot category indicator (Figma 66:130 / 66:142 etc, `Ellipse` fills
 * #00FF66 active / #4D4D4D inactive) seen on carousel/healthcare/enterprise
 * frames. The draft file's per-frame link wiring on these dots is
 * inconsistent (see healthcare-main-1 vs enterprise-main-1), so rather than
 * reproduce that inconsistency, every dot here is a real jump-to-section
 * control — the sensible product behavior the indicator is standing in for.
 */
export function CategoryDots({ active }: { active: 0 | 1 | 2 }) {
  return (
    <div className="absolute flex items-center" style={{ left: px(900), top: px(1040), gap: px(12) }}>
      {CATEGORY_SECTION_IDS.map((id, i) => (
        <button
          key={id}
          type="button"
          aria-label={`Go to ${id.replace("section-", "")} section`}
          aria-current={i === active}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
          className="block shrink-0 cursor-pointer rounded-full p-0"
          style={{ width: px(10), height: px(10), backgroundColor: i === active ? "#00FF66" : "#4D4D4D" }}
        />
      ))}
    </div>
  );
}
