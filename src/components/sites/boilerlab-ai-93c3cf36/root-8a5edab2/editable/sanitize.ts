import { canonicalAllowedColor } from "./colors";

// Strips everything except plain text, <br> line breaks, and a whitelisted
// inline text-color span/font tag from a string of HTML. Used (1) restoring
// a saved edit, so any already-corrupted saved value (e.g. from a rich paste
// before the paste-sanitizing fix existed) self-heals back to plain
// text/color-spans-only on next load, and (2) as a defense-in-depth backstop
// even though paste is now intercepted at the source in EditableText/
// Typewriter, and partial-selection coloring goes through
// document.execCommand("foreColor", ...) rather than raw pasted markup.
//
// Only a <span>/<font> whose *entire* inline style reduces to one allowed
// `color` value survives — everything else about it (any other property,
// any other attribute, any other tag) is dropped, so this can never become a
// vector for arbitrary styles/markup to sneak into a saved edit.
export function sanitizeToPlainHtml(raw: string): string {
  if (typeof document === "undefined") return raw;
  const container = document.createElement("div");
  container.innerHTML = raw;

  const parts: string[] = [];
  function escape(text: string): string {
    return text.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
  }
  function allowedColorOf(el: Element): string | null {
    if (el.tagName === "SPAN") {
      const color = (el as HTMLElement).style.color;
      return color ? canonicalAllowedColor(color) : null;
    }
    if (el.tagName === "FONT") {
      const color = el.getAttribute("color");
      return color ? canonicalAllowedColor(color) : null;
    }
    return null;
  }
  function walk(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(escape(node.textContent || ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName === "BR") {
      parts.push("<br>");
      return;
    }
    const color = allowedColorOf(el);
    if (color) {
      parts.push(`<span style="color:${color}">`);
      el.childNodes.forEach(walk);
      parts.push("</span>");
      return;
    }
    el.childNodes.forEach(walk);
  }
  container.childNodes.forEach(walk);
  return parts.join("");
}
