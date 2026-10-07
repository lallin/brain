import type { CategoryHub, SolutionDetail } from "@/types/solutions";
import type { Lang } from "./i18n/lang";
import { t, tv } from "./i18n/t";

// Real content from braindeck.net's own locale files (i18n/locales — en and
// ko are the live site's, ja is a translation of the same keys), restyled to
// this clone's dark theme, not rewritten. Only "Voucher" has a distinct,
// richer hub page on the source site (comparison/workflow/delivery
// sections); Content, Healthcare and AX are plain category groupings there,
// so those three hubs list their real sub-solutions instead of fabricating
// hub-only copy. Everything is built per language from locale keys; the
// plain exports below are the English build.

const SOLUTION_CATEGORY: Record<string, string> = {
  "deepfake-music-detection": "content",
  "deepfake-media-detection": "content",
  "cloning-tts": "content",
  "music-generation": "content",
  "aac-voice-communication": "healthcare",
  "diagnosis-rehabilitation": "healthcare",
  "robot-defect-detection": "ax",
  "emotion-recognition": "ax",
};

function buildHubs(lang: Lang): CategoryHub[] {
  const tr = (key: string) => t(lang, key);
  const v = (key: string) => t(lang, `voucher_detail.overseas_copyright.${key}`);
  return [
    {
      slug: "voucher",
      productId: "sigma",
      name: tr("categories.voucher.title"),
      tagline: v("main_title"),
      eyebrow: "Verified Voucher Program",
      title: v("main_title"),
      intro: v("main_subtitle"),
      comparisonOldTitle: v("problems_title"),
      comparisonNewTitle: v("solves_title"),
      comparison: [
        {
          old: v("p1"),
          ours: v("s1"),
        },
        {
          old: v("p2"),
          ours: v("s2"),
        },
        {
          old: v("p3"),
          ours: v("s3"),
        },
        {
          old: "",
          ours: v("s4"),
        },
      ],
      approachQuote: v("approach_subtitle"),
      featuresTitle: v("key_features_title"),
      features: [
        {
          title: v("kf1_title"),
          points: [
            v("kf1_description1"),
            v("kf1_description2"),
            v("kf1_description3"),
          ],
        },
        {
          title: v("kf2_title"),
          points: [
            v("kf2_description1"),
            v("kf2_description2"),
            v("kf2_description3"),
          ],
        },
        {
          title: v("kf3_title"),
          points: [
            v("kf3_description1"),
            v("kf3_description2"),
            v("kf3_description3"),
          ],
        },
      ],
      deliveryTitle: v("model_title"),
      delivery: [
        {
          title: v("m1_title"),
          points: [
            v("m1_subtitle"),
            v("m1_description"),
            v("m1_description2"),
            v("m1_description3"),
          ],
        },
        {
          title: v("m2_title"),
          points: [
            v("m2_subtitle"),
            v("m2_description"),
            v("m2_description2"),
            v("m2_description3"),
          ],
        },
      ],
      industriesTitle: tr("voucher_detail.market_comparison.title"),
      industries: [
        tr("voucher_detail.market_comparison.items.0.title"),
        tr("voucher_detail.market_comparison.items.1.title"),
        tr("voucher_detail.market_comparison.items.2.title"),
        tr("voucher_detail.market_comparison.items.3.title"),
        tr("voucher_detail.market_comparison.items.4.title"),
        tr("voucher_detail.market_comparison.items.5.title"),
      ],
      workflowTitle: v("process_title"),
      workflow: [
        {
          step: "01",
          title: v("process_steps.0.title"),
          description: v("process_steps.0.desc"),
        },
        {
          step: "02",
          title: v("process_steps.1.title"),
          description: v("process_steps.1.desc"),
        },
        {
          step: "03",
          title: v("process_steps.2.title"),
          description: v("process_steps.2.desc"),
        },
        {
          step: "04",
          title: v("process_steps.3.title"),
          description: v("process_steps.3.desc"),
        },
        {
          step: "05",
          title: v("process_steps.4.title"),
          description: v("process_steps.4.desc"),
        },
      ],
    },
    {
      slug: "content",
      productId: "atomic-mail",
      name: tr("categories.content.title"),
      tagline: tr("categories.content.description"),
    },
    {
      slug: "healthcare",
      productId: "aimlapi",
      name: tr("categories.medical.title"),
      tagline: tr("categories.medical.description"),
    },
    {
      slug: "ax",
      productId: "atomicbot",
      name: tr("categories.ax.title"),
      tagline: tr("categories.ax.description"),
    },
  ];
}

interface LocaleSolution {
  title: string;
  titleEn: string;
  shortDescription: string;
  whatItSolves: string;
  keyFeatures: string[];
  useCases: string[];
  howItWorks: string;
  security: string;
  faq: { question: string; answer: string }[];
}

function buildSolutions(lang: Lang): SolutionDetail[] {
  return Object.entries(SOLUTION_CATEGORY).map(([slug, categoryId]) => {
    const s = tv<LocaleSolution>(lang, `solutions.${slug}`);
    return {
      slug,
      categoryId,
      code: s.title,
      name: s.titleEn,
      tagline: s.shortDescription,
      problemTitle: t(lang, "solution_detail.what_it_solves"),
      problemText: s.whatItSolves,
      featuresTitle: t(lang, "solution_detail.key_features"),
      features: s.keyFeatures,
      howItWorksTitle: t(lang, "solution_detail.how_it_works"),
      howItWorks: s.howItWorks,
      useCasesTitle: t(lang, "solution_detail.use_cases"),
      useCases: s.useCases,
      securityTitle: t(lang, "solution_detail.security"),
      security: s.security,
      faq: s.faq,
    };
  });
}

const cache = new Map<Lang, { hubs: CategoryHub[]; solutions: SolutionDetail[] }>();
function data(lang: Lang) {
  let d = cache.get(lang);
  if (!d) {
    d = { hubs: buildHubs(lang), solutions: buildSolutions(lang) };
    cache.set(lang, d);
  }
  return d;
}

export function hubsFor(lang: Lang): CategoryHub[] {
  return data(lang).hubs;
}

export function solutionsFor(lang: Lang): SolutionDetail[] {
  return data(lang).solutions;
}

export const CATEGORY_HUBS: CategoryHub[] = hubsFor("en");
export const SOLUTIONS: SolutionDetail[] = solutionsFor("en");

export function getCategoryHub(slug: string, lang: Lang = "en"): CategoryHub | undefined {
  return hubsFor(lang).find((c) => c.slug === slug);
}

export function getSolution(slug: string, lang: Lang = "en"): SolutionDetail | undefined {
  return solutionsFor(lang).find((s) => s.slug === slug);
}

export function getCategoryHubByProductId(productId: string, lang: Lang = "en"): CategoryHub | undefined {
  return hubsFor(lang).find((c) => c.productId === productId);
}

export function getSolutionsByCategory(categoryId: string, lang: Lang = "en"): SolutionDetail[] {
  return solutionsFor(lang).filter((s) => s.categoryId === categoryId);
}
