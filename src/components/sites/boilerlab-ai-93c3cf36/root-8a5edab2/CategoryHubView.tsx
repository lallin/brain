"use client";

import Link from "next/link";
import { getCategoryHub, getSolutionsByCategory } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

/** Body of /solutions/category/[slug], in the header's current language. */
export function CategoryHubView({ slug }: { slug: string }) {
  const lang = useLang();
  const category = getCategoryHub(slug, lang);
  if (!category) return null;

  const solutions = getSolutionsByCategory(slug, lang);
  const isRichHub = !!category.title;

  return (
    <>
      <section className="solution-hero">
        <span className="solution-hero-badge">{category.name}</span>
        <h1>{category.title ?? category.name}</h1>
        {category.eyebrow && <p className="solution-hero-code">{category.eyebrow}</p>}
        <p className="solution-hero-tagline">{category.intro ?? category.tagline}</p>
      </section>

      {isRichHub && category.comparison && (
        <section className="solution-section">
          <div className="solution-comparison">
            <div>
              <h3>{category.comparisonOldTitle}</h3>
              <ul>
                {category.comparison.map((c, i) => (
                  <li key={i}>{c.old || " "}</li>
                ))}
              </ul>
            </div>
            <div className="is-ours">
              <h3>{category.comparisonNewTitle}</h3>
              <ul>
                {category.comparison.map((c, i) => (
                  <li key={i}>{c.ours}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {isRichHub && category.approachQuote && (
        <section className="solution-section">
          <blockquote className="solution-quote">{category.approachQuote}</blockquote>
        </section>
      )}

      {isRichHub && category.features && (
        <section className="solution-section">
          <h2>{category.featuresTitle}</h2>
          <div className="solution-feature-grid">
            {category.features.map((f) => (
              <div key={f.title} className="solution-feature-card">
                <h3>{f.title}</h3>
                <ul>
                  {f.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {isRichHub && category.delivery && (
        <section className="solution-section">
          <h2>{category.deliveryTitle}</h2>
          <div className="solution-feature-grid">
            {category.delivery.map((d) => (
              <div key={d.title} className="solution-feature-card">
                <h3>{d.title}</h3>
                <ul>
                  {d.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {isRichHub && category.industries && (
        <section className="solution-section">
          <h2>{category.industriesTitle}</h2>
          <ul className="solution-tag-list">
            {category.industries.map((ind) => (
              <li key={ind}>{ind}</li>
            ))}
          </ul>
        </section>
      )}

      {isRichHub && category.workflow && (
        <section className="solution-section">
          <h2>{category.workflowTitle}</h2>
          <ol className="solution-workflow">
            {category.workflow.map((w) => (
              <li key={w.step}>
                <span className="solution-workflow-step">{w.step}</span>
                <h3>{w.title}</h3>
                <p>{w.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {solutions.length > 0 && (
        <section className="solution-section">
          <h2>{t(lang, "local.category_solutions", { name: category.name })}</h2>
          <div className="solution-card-grid">
            {solutions.map((s) => (
              <Link key={s.slug} href={`/solutions/${s.slug}`} className="solution-card">
                <span className="solution-card-code">{s.code}</span>
                <h3>{s.name}</h3>
                <p>{s.tagline}</p>
                <span className="solution-card-link">{t(lang, "solutions_overview.learn_more")} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
