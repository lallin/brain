// Shared between EditableText.tsx (renders the swatch palette) and
// sanitize.ts (validates any color span surviving into saved HTML) — a
// fixed whitelist, not free-form picking, so a partial-selection color edit
// can only ever land on one of the site's own design tokens/opacities.
export interface ColorSwatch {
  value: string;
  label: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { value: "#fff", label: "완전 흰색 — 다크 배경 위 기본 텍스트" },
  { value: "#0a0d14", label: "진한 텍스트 — 라이트 배경 위" },
  { value: "#525866", label: "보조/설명용 회색 텍스트" },
  { value: "rgba(255,255,255,0.25)", label: "가장 옅은 흰색" },
  { value: "rgba(255,255,255,0.35)", label: "매우 옅은 흰색" },
  { value: "rgba(255,255,255,0.4)", label: "옅은 흰색" },
  { value: "rgba(255,255,255,0.5)", label: "중간 옅은 흰색" },
  { value: "rgba(255,255,255,0.6)", label: "중간 흰색" },
  { value: "rgba(255,255,255,0.7)", label: "살짝 진한 흰색" },
  { value: "rgba(255,255,255,0.8)", label: "진한 흰색" },
  { value: "rgba(255,255,255,0.85)", label: "가장 진한 반투명 흰색" },
  { value: "rgba(71,229,32,0.55)", label: "네온 그린 포인트 (55%)" },
  { value: "rgba(71,229,32,0.4)", label: "네온 그린 포인트 (40%)" },
];

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(raw: string): Rgba | null {
  const value = raw.trim();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a: 1 };
  }
  const rgba = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] !== undefined ? Number(rgba[4]) : 1,
    };
  }
  return null;
}

function sameColor(a: Rgba, b: Rgba): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && Math.abs(a.a - b.a) < 0.02;
}

const ALLOWED_PARSED = COLOR_SWATCHES.map((s) => ({ swatch: s, parsed: parseColor(s.value)! }));

/**
 * Whether `raw` (in ANY valid CSS color syntax — browsers normalize an
 * element's `.style.color` to `rgb()`/`rgba()` regardless of how it was
 * written, e.g. after `document.execCommand("foreColor", ...)`) matches one
 * of our swatches. Returns that swatch's own canonical string so callers
 * always persist/render the exact same value regardless of the input's
 * formatting, or null if `raw` isn't one of the allowed colors.
 */
export function canonicalAllowedColor(raw: string): string | null {
  const parsed = parseColor(raw);
  if (!parsed) return null;
  const match = ALLOWED_PARSED.find(({ parsed: p }) => sameColor(p, parsed));
  return match ? match.swatch.value : null;
}

function toHex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

/**
 * `document.execCommand("foreColor", false, value)` silently no-ops for a
 * `value` given as `rgba(...)` (verified against Chromium — the command
 * reports success but never touches the DOM) but works fine with an
 * `#RRGGBBAA` 8-digit hex string, which is exactly equivalent. Only the
 * execCommand call site needs this — everything else (saving, restoring,
 * the swatch buttons' own CSS `background`) keeps using the swatch's own
 * rgba()/hex string directly, since only execCommand's value parser is
 * fussy about the format.
 */
export function toExecCommandColor(raw: string): string {
  const parsed = parseColor(raw);
  if (!parsed) return raw;
  const hex = `#${toHex2(parsed.r)}${toHex2(parsed.g)}${toHex2(parsed.b)}`;
  return parsed.a >= 1 ? hex : `${hex}${toHex2(parsed.a * 255)}`;
}
