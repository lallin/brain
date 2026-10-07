"use client";

import { useState } from "react";
import type { FaqItem } from "@/types/solutions";

/** The source site's FAQ answers are behind a click-to-expand accordion we
 * couldn't read without clicking each one individually, so `answer` is
 * usually absent here — collapsed items without one just show the question. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="solution-faq-list">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className={`solution-faq-item${open ? " is-open" : ""}`}>
            <button
              type="button"
              className="solution-faq-question"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span className="solution-faq-index">{String(i + 1).padStart(2, "0")}</span>
              <span>{item.question}</span>
              <span className="solution-faq-caret" aria-hidden="true">
                {open ? "−" : "+"}
              </span>
            </button>
            {open && item.answer && <p className="solution-faq-answer">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
