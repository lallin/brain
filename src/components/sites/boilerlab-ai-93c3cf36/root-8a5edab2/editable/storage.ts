import { SITE_EDITING_ENABLED } from "./config";
// Server-persisted store for the inline "click to edit" text feature (see
// EditableText.tsx / Typewriter.tsx). Values live in data/site-edits.json on
// disk, written through /api/site-edits — not in the browser's localStorage
// — so a saved edit shows up for ANY browser/device hitting this dev server,
// and survives a different port, a cleared cache, or a private window (the
// three ways an edit previously appeared to "revert" when this was
// localStorage-only).
//
// SiteEditsHydrator (a Server Component mounted in the root layout) reads
// that same file on the server and injects `window.__EDITABLE_OVERRIDES__`
// as an inline script that runs before the client bundle hydrates, so the
// very first client read here already reflects any previously saved edit —
// no flash of the placeholder text, and no async fetch race on mount.
declare global {
  interface Window {
    __EDITABLE_OVERRIDES__?: Record<string, string>;
  }
}

let cache: Record<string, string> | null = null;

function store(): Record<string, string> {
  if (cache) return cache;
  cache = typeof window !== "undefined" ? { ...(window.__EDITABLE_OVERRIDES__ ?? {}) } : {};
  return cache;
}

export function getEditedValue(key: string): string | null {
  const value = store()[key];
  return value === undefined ? null : value;
}

// Updates only the in-memory cache (+ the global mirror every other instance
// reads from), with no network round-trip — call this synchronously on every
// keystroke, before debouncing the actual persist below. Without it, a
// keystroke-driven React re-render that lands in the debounce's 250ms gap
// (e.g. EditableText/Typewriter's own onBlur, which fires synchronously when
// pressing Enter forces a contentEditable <p> to split/blur) would read the
// *previous* saved value and stomp the just-typed DOM content back to it —
// confirmed as the exact cause of a live edit "reverting the moment Enter is
// pressed".
export function setEditedValueLocal(key: string, value: string): void {
  store()[key] = value;
  if (typeof window !== "undefined") window.__EDITABLE_OVERRIDES__ = cache!;
}

// A save the server refused (the shrink guard, or an unreadable file) is
// shown as a visible banner instead of failing silently — the edit is still
// in this tab's memory, so the person can export it before reloading.
const WARNING_ID = "site-edits-warning";

function showSaveWarning(message: string): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(WARNING_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = WARNING_ID;
    el.className = "site-edits-warning";
    el.setAttribute("role", "alert");
    document.body.appendChild(el);
  }
  el.textContent = `⚠ ${message} 이 탭을 새로고침하지 마세요 — 수정 내용은 아직 이 탭에 남아 있습니다.`;
  el.onclick = () => el?.remove();
}

export function setEditedValue(key: string, value: string): void {
  if (!SITE_EDITING_ENABLED) return;
  setEditedValueLocal(key, value);
  if (typeof window === "undefined") return;
  void fetch("/api/site-edits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  })
    .then(async (res) => {
      if (res.ok) return;
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      showSaveWarning(body?.error ?? `저장에 실패했습니다 (HTTP ${res.status}).`);
    })
    .catch(() => {
      // Offline/dev-server hiccup — the edit still lives in this tab's
      // in-memory cache for the rest of the session; it just won't survive a
      // reload until the next successful save.
    });
}

// Text color overrides share the same flat key/value store as the text
// content itself, under a suffixed key — no separate API/storage needed.
function colorKey(id: string): string {
  return `${id}__color`;
}

export function getEditedColor(id: string): string | null {
  return getEditedValue(colorKey(id));
}

export function setEditedColor(id: string, color: string): void {
  setEditedValue(colorKey(id), color);
}

// Drag-to-reposition offset, stored the same way as color — a suffixed key
// holding "dxpx,dypx" (plain numbers, comma-separated) rather than JSON, to
// stay consistent with the rest of this store being flat strings.
function positionKey(id: string): string {
  return `${id}__pos`;
}

// Memoized by id+raw so useSyncExternalStore callers (ContactsMoon) get a
// referentially stable object back across repeated calls with no underlying
// change — returning a fresh object literal every call (this used to) makes
// useSyncExternalStore think the store changed on every render, which
// crashes with "The result of getSnapshot should be cached to avoid an
// infinite loop." EditableText's own direct (non-useSyncExternalStore) calls
// are unaffected either way.
const positionCache = new Map<string, { raw: string; value: { dx: number; dy: number } }>();

export function getEditedPosition(id: string): { dx: number; dy: number } | null {
  const raw = getEditedValue(positionKey(id));
  if (!raw) return null;
  const cached = positionCache.get(id);
  if (cached && cached.raw === raw) return cached.value;
  const [dx, dy] = raw.split(",").map(Number);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const value = { dx, dy };
  positionCache.set(id, { raw, value });
  return value;
}

export function setEditedPosition(id: string, dx: number, dy: number): void {
  setEditedValue(positionKey(id), `${Math.round(dx)},${Math.round(dy)}`);
}

// Drag-to-resize width override, in px — same suffixed-key pattern.
function widthKey(id: string): string {
  return `${id}__width`;
}

export function getEditedWidth(id: string): number | null {
  const raw = getEditedValue(widthKey(id));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setEditedWidth(id: string, widthPx: number): void {
  setEditedValue(widthKey(id), `${Math.round(widthPx)}`);
}

// Drag-to-resize font-size override, in px — same suffixed-key pattern.
function fontSizeKey(id: string): string {
  return `${id}__fontSize`;
}

export function getEditedFontSize(id: string): number | null {
  const raw = getEditedValue(fontSizeKey(id));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setEditedFontSize(id: string, sizePx: number): void {
  setEditedValue(fontSizeKey(id), `${Math.round(sizePx * 100) / 100}`);
}

export function clearAllEditedValues(): void {
  if (!SITE_EDITING_ENABLED) return;
  cache = {};
  if (typeof window === "undefined") return;
  window.__EDITABLE_OVERRIDES__ = {};
  void fetch("/api/site-edits?confirm=clear-all", { method: "DELETE" }).catch(() => {});
}

export function hasAnyEditedValues(): boolean {
  return Object.keys(store()).length > 0;
}
