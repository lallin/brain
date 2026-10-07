import { PRODUCTS } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/products-data";
import type { Lang } from "./lang";
import { has, t } from "./t";

/**
 * KO/JA text for the inline-editable elements (EditableText / Typewriter),
 * by their edit id. English always shows the saved edit (or the component's
 * own default) — edits are made in English only — and the other languages
 * show the matching locale string instead. An id that isn't mapped here, or
 * whose English was deliberately emptied, keeps its English content: that
 * covers brand copy the live site also leaves in English in its Korean
 * version ("Inspiring the Next", "Trusted Human-Centered AI", "Proven
 * Excellence", the AIR value names).
 */
const KEYS: Record<string, string> = {
  "air.intro": "about_page.values_intro",
  "air.A.description": "about_page.values.0.description",
  "air.I.description": "about_page.values.1.description",
  "air.R.description": "about_page.values.2.description",
  "numbers.intro.signoff": "local.cognitive_augmentation",
  "numbers.users.eyebrow": "local.redefining_time",
  "numbers.intro.label": "local.core_value_label",
  "numbers.users.label": "local.vision_label",
  "partners.eyebrow": "proof.section_title",
  "inpress.title": "proof.trust_title",
  "inpress.0.author": "proof.trustPoints.1.title",
  "inpress.0.quote": "proof.trustPoints.1.description",
  "inpress.2.author": "proof.trustPoints.0.title",
  "inpress.2.quote": "proof.trustPoints.0.description",
  "inpress.4.author": "proof.trustPoints.3.title",
  "inpress.4.quote": "proof.trustPoints.3.description",
  "inpress.5.author": "proof.trustPoints.2.title",
  "inpress.5.quote": "proof.trustPoints.2.description",
  "contacts.title": "final_cta.title",
  "contacts.subtitle": "final_cta.subtitle",
  "contacts.cta": "hero_cta_demo",
  "contacts.address.0": "final_cta.trust_1",
  "contacts.address.1": "final_cta.trust_2",
  "contacts.address.2": "final_cta.trust_3",
  "contacts.address.4": "local.address_full",
  "footer.nav.mission": "local.nav_mission",
  "footer.nav.numbers": "header_company",
  "footer.nav.products": "header_solutions",
  "footer.nav.partners": "local.nav_excellence",
  "footer.nav.in-press": "local.nav_partner",
  "footer.nav.contacts": "local.nav_contacts",
};

const PART_TITLE: Record<string, string> = {
  sigma: "categories.voucher.title",
  "atomic-mail": "categories.content.title",
  aimlapi: "categories.medical.title",
  atomicbot: "categories.ax.title",
};

const BOX_FIELD: Record<string, string> = { name: "titleEn", headline: "title", description: "shortDescription" };

/** Locale key for an edit id, or null when it stays English. */
function keyFor(id: string): string | null {
  if (KEYS[id]) return KEYS[id];
  const m = /^products\.([^.]+)\.(?:(\d+)\.)?([\w-]+)$/.exec(id);
  if (!m) return null;
  const [, productId, index, field] = m;
  if (index === undefined) {
    if (field === "name-above") return PART_TITLE[productId] ?? null;
    if (field === "cta") return "solutions_overview.learn_more";
    return null;
  }
  const box = PRODUCTS.find((p) => p.id === productId)?.boxes[Number(index)];
  if (!box) return null;
  if (productId === "sigma") return field === "name" ? "voucher.title" : field === "headline" ? "voucher.subtitle" : null;
  return box.slug && BOX_FIELD[field] ? `solutions.${box.slug}.${BOX_FIELD[field]}` : null;
}

function isBlank(html: string): boolean {
  return html.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;/g, "").trim() === "";
}

/**
 * The text to show for `id` in `lang`, or null to keep the English content.
 * `english` is what English would show (saved edit or default) — an
 * element emptied on purpose stays empty in every language.
 */
export function localizedText(id: string, lang: Lang, english: string): string | null {
  if (lang === "en" || isBlank(english)) return null;
  const key = keyFor(id);
  return key && has(lang, key) ? t(lang, key) : null;
}
