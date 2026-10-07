"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t, tv } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

// Matches the real braindeck.net site's "Request Demo Access" modal 1:1 in
// content (its locale files, in the current language) — copy, fields, and the 8 real solution
// codes/names — restyled to this clone's own dark space theme instead of
// the source's light-panel-on-dark layout. No backend exists here, so
// submitting just shows a confirmation state rather than actually sending
// anything.

// Same 8 solutions as the demo form on the live site, in its order.
const DEMO_SLUGS = [
  "deepfake-music-detection",
  "deepfake-media-detection",
  "cloning-tts",
  "music-generation",
  "aac-voice-communication",
  "diagnosis-rehabilitation",
  "robot-defect-detection",
  "emotion-recognition",
];

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const lang = useLang();
  const solutions = DEMO_SLUGS.map((slug) => ({
    code: t(lang, `solutions.${slug}.title`),
    name: t(lang, `solutions.${slug}.titleEn`),
  }));
  const checklist = tv<string[]>(lang, "demo_form.info_list");
  const [subtitleTop, subtitleBottom] = t(lang, "demo_form.subtitle").split(/<br\s*\/?>/);

  if (!open || typeof document === "undefined") return null;

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function handleClose() {
    setSubmitted(false);
    setSelected([]);
    onClose();
  }

  return createPortal(
    <div className="demo-modal-overlay" onClick={handleClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="demo-modal-close" onClick={handleClose} aria-label={t(lang, "demo_form.cancel")}>
          ×
        </button>
        <div className="demo-modal-side">
          <span className="demo-modal-shield" aria-hidden="true">
            🛡
          </span>
          <h3>Enterprise Access</h3>
          <ul>
            {checklist.map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="demo-modal-form">
          <h2>{t(lang, "demo_form.title")}</h2>
          <p className="demo-modal-desc">
            {subtitleTop}
            <br />
            {subtitleBottom}
          </p>
          {submitted ? (
            <div className="demo-modal-success">
              <span aria-hidden="true">✓</span>
              {t(lang, "demo_form.submitted_title")} {t(lang, "demo_form.submitted_subtitle")}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <label>
                {t(lang, "demo_form.contact_name")}
                <input type="text" placeholder={t(lang, "demo_form.contact_name_placeholder")} required />
              </label>
              <label>
                {t(lang, "demo_form.company_name")}
                <input type="text" placeholder={t(lang, "demo_form.company_name_placeholder")} />
              </label>
              <label>
                {t(lang, "demo_form.email")}
                <input type="email" placeholder="name@company.com" required />
              </label>
              <div className="demo-modal-solutions">
                <span className="demo-modal-solutions-label">{t(lang, "demo_form.solution")}</span>
                <div className="demo-modal-solutions-grid">
                  {solutions.map((s) => (
                    <button
                      type="button"
                      key={s.code}
                      className={selected.includes(s.code) ? "is-selected" : undefined}
                      onClick={() => toggle(s.code)}
                    >
                      <span className="name">{s.name}</span>
                      <span className="code">{s.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              <label>
                {t(lang, "demo_form.message")}
                <textarea placeholder={t(lang, "demo_form.message_placeholder")} rows={3} />
              </label>
              <button type="submit" className="demo-modal-submit" disabled={selected.length === 0}>
                {t(lang, selected.length === 1 ? "demo_form.submit_button_one" : "demo_form.submit_button_other", {
                  count: selected.length,
                })}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
