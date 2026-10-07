"use client";

import { useState } from "react";
import { DemoModal } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/DemoModal";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

/** Closing "Experience this solution firsthand" block of the detail pages. */
export function SolutionCta() {
  const [open, setOpen] = useState(false);
  const lang = useLang();

  return (
    <section className="solution-cta">
      <h2>{t(lang, "solution_detail.cta_title")}</h2>
      <p>{t(lang, "solution_detail.cta_subtitle")}</p>
      <button type="button" className="button primary-button default" onClick={() => setOpen(true)}>
        {t(lang, "header_demo")}
      </button>
      <DemoModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
