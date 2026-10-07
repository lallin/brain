"use client";

import { useState } from "react";
import { px } from "./stage";

interface FaqAccordionItemProps {
  question: string;
  /** Omit to render the static "Collapsed"-only variant (no expand data available for that instance, e.g. the per-solution-page mini-FAQs). */
  answer?: string;
  left: number;
  top: number;
  width: number;
}

/**
 * Figma's FAQ-Item component (e.g. 103:9) carries both "Collapsed" and
 * "Expanded" variants with real answer copy — some instances (the 24
 * top-level FAQ-Item components) expose it, others (the per-solution-page
 * mini-FAQ instances) only override the Collapsed variant. `answer` toggles
 * between the two behaviors rather than assuming one or the other globally.
 */
export function FaqAccordionItem({ question, answer, left, top, width }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);
  const isExpanded = Boolean(answer) && open;

  return (
    <div
      className="absolute bg-[#171717] overflow-hidden transition-[height] duration-200 ease-out"
      style={{ left: px(left), top: px(top), width: px(width), height: px(isExpanded ? 100 : 80), borderRadius: px(12) }}
    >
      <p
        className="absolute font-medium not-italic text-[#bfbfbf]"
        style={{ left: px(28), top: px(isExpanded ? 16 : 31), width: px(width - 120), fontSize: px(16) }}
      >
        {question}
      </p>
      {answer ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="absolute font-light not-italic text-[#8c8c8c] cursor-pointer"
          style={{ left: px(width - 50), top: px(isExpanded ? 22 : 26), fontSize: px(24) }}
        >
          {isExpanded ? "−" : "+"}
        </button>
      ) : (
        <span className="absolute font-light not-italic text-[#8c8c8c]" style={{ left: px(width - 50), top: px(26), fontSize: px(24) }}>
          +
        </span>
      )}
      {isExpanded && (
        <p className="absolute font-normal not-italic text-[#8c8c8c]" style={{ left: px(28), top: px(48), width: px(width - 80), fontSize: px(13) }}>
          {answer}
        </p>
      )}
    </div>
  );
}
