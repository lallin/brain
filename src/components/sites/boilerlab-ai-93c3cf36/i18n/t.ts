import en from "./locales/en.json";
import ko from "./locales/ko.json";
import ja from "./locales/ja.json";
import type { Lang } from "./lang";

/**
 * Copy for every language. `en` and `ko` are braindeck.net's own locale
 * files (https://www.braindeck.net/locales/{en,ko}/translation.json) so the
 * text matches the live site exactly; `ja` is a translation of the keys this
 * clone uses. `local.*` holds the few strings that exist only on this clone.
 */
const LOCALES: Record<Lang, unknown> = { en, ko, ja };

function lookup(tree: unknown, path: string): unknown {
  let node = tree;
  for (const part of path.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/** Any value (string, array, object) at `path`, falling back to English. */
export function tv<T>(lang: Lang, path: string): T {
  const v = lookup(LOCALES[lang], path);
  return (v === undefined ? lookup(LOCALES.en, path) : v) as T;
}

/** A string at `path` (falling back to English, then to the path itself),
 * with `{{name}}` placeholders filled from `vars`. */
export function t(lang: Lang, path: string, vars?: Record<string, string | number>): string {
  const v = tv<unknown>(lang, path);
  let s = typeof v === "string" ? v : path;
  if (vars) for (const [k, val] of Object.entries(vars)) s = s.replaceAll(`{{${k}}}`, String(val));
  return s;
}

/** True when `lang` itself has a string at `path` (no English fallback). */
export function has(lang: Lang, path: string): boolean {
  return typeof lookup(LOCALES[lang], path) === "string";
}
