"use client";

import Link from "next/link";
import { FaqAccordion } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/FaqAccordion";
import { SolutionCta } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SolutionCta";
import { getCategoryHub, getSolution } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

/** Body of /solutions/[slug], in the header's current language. */
export function SolutionDetailView({ slug }: { slug: string }) {
  const lang = useLang();
  const solution = getSolution(slug, lang);
  if (!solution) return null;
  const category = getCategoryHub(solution.categoryId, lang);

  return (
    <>
      <section className="solution-hero">
        {category && (
          <Link href={`/solutions/category/${category.slug}`} className="solution-hero-badge">
            {category.name}
          </Link>
        )}
        <h1>{solution.name}</h1>
        <p className="solution-hero-code">{solution.code}</p>
        <p className="solution-hero-tagline">{solution.tagline}</p>
      </section>

      {/* Bounds how far the sidebar can follow the scroll: a CSS grid row
          whose two columns stretch to equal height (default align-items:
          stretch) — the sidebar's own box becomes exactly as tall as
          .solution-main-col, and the sticky inner wrapper below can only
          slide within that box, so it stops the instant the main column
          (ending at the "How it Works" box) runs out. No JS/IntersectionObserver
          needed. */}
      <div className="solution-sticky-bound">
        <div className="solution-main-col">
          <section className="solution-section">
            <span className="solution-section-kicker">PROBLEM &amp; SOLUTION</span>
            <h2>{solution.problemTitle}</h2>
            <p className="solution-body-text">{solution.problemText}</p>
          </section>

          <section className="solution-section">
            <h2>{solution.featuresTitle}</h2>
            <ul className="solution-feature-list">
              {solution.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <section className="solution-howitworks-box">
            <span className="solution-section-kicker">{solution.howItWorksTitle}</span>
            <p>{solution.howItWorks}</p>
          </section>
        </div>

        <aside className="solution-sidebar">
          <div className="solution-sidebar-inner">
            <div className="solution-sidebar-card">
              <h3>{solution.useCasesTitle}</h3>
              <ol className="solution-usecase-list">
                {solution.useCases.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ol>
            </div>
            <div className="solution-sidebar-card">
              <h3>{solution.securityTitle}</h3>
              <p className="solution-body-text">{solution.security}</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="solution-section">
        <span className="solution-section-kicker">FAQ</span>
        <h2>{t(lang, "solution_detail.faq")}</h2>
        <FaqAccordion items={solution.faq} />
      </section>

      {/* Closing CTA, same copy as braindeck.net's detail pages. */}
      <SolutionCta />
    </>
  );
}
