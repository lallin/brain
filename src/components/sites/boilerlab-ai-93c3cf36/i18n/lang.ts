"use client";

import { useSyncExternalStore } from "react";

/**
 * Site language (header EN/KO/JA pill). English is the default for every
 * new visitor; a choice is remembered in localStorage so it carries across
 * pages (home → solution detail → back). The server always renders English
 * (`getServerSnapshot`), and useSyncExternalStore switches to the stored
 * language right after hydration without a mismatch warning.
 */
export type Lang = "en" | "ko" | "ja";
export const LANGS: readonly Lang[] = ["en", "ko", "ja"];

const STORAGE_KEY = "braindeck-lang";
const listeners = new Set<() => void>();
let current: Lang | null = null;

function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ko" || v === "ja";
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  if (current) return current;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    current = isLang(stored) ? stored : "en";
  } catch {
    current = "en";
  }
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // private mode etc. — still switches for this page view
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
}

/** EN → KO → JA → EN … */
export function cycleLang(): void {
  const i = LANGS.indexOf(getLang());
  setLang(LANGS[(i + 1) % LANGS.length]);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "en");
}
