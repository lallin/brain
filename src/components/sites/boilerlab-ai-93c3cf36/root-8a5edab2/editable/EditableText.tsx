"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getEditedColor,
  getEditedFontSize,
  getEditedPosition,
  getEditedValue,
  getEditedWidth,
  setEditedColor,
  setEditedFontSize,
  setEditedPosition,
  setEditedValue,
  setEditedValueLocal,
  setEditedWidth,
} from "./storage";
import { sanitizeToPlainHtml } from "./sanitize";
import { COLOR_SWATCHES, toExecCommandColor } from "./colors";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { localizedText } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/main-text";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";

type EditableTag = "span" | "p" | "h1" | "h2" | "h3" | "strong" | "li";

// Shared across every EditableText instance so each element's own 250ms
// debounce is independent of every other element's.
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 250;

const PALETTE_WIDTH = 300;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const PALETTE_HEIGHT_ESTIMATE = 96;

interface EditableTextProps {
  /** Unique persistence key, also rendered as data-key. */
  id: string;
  /** Optional real DOM id, e.g. when another element references it via aria-labelledby. */
  htmlId?: string;
  as?: EditableTag;
  className?: string;
  /** Plain-text default content (most elements). Mutually exclusive with `html`. */
  children?: string;
  /**
   * Raw-HTML default content, for the handful of headings that contain a
   * hard-coded <br/> line break (e.g. "AI startups at<br/>rocket speed").
   * Persists/restores via innerHTML instead of textContent so the <br/>
   * survives a reload.
   */
  html?: string;
}

/**
 * A click-to-edit text node: contentEditable, auto-saves to localStorage
 * (debounced), and restores its saved value on mount. Renders its default
 * content once (uncontrolled, via ref) so React never re-diffs the user's
 * live edits back to the original copy on unrelated re-renders.
 *
 * Text inside a link (e.g. a card's "Learn More") follows the link on a
 * plain click and is edited with Alt+click; everywhere else a click edits.
 * While editing, click/mousedown propagation is stopped so the edit never
 * also triggers an ancestor's navigation.
 *
 * Only English is editable. In KO/JA the element shows its translation
 * (i18n/main-text.ts) and can't be edited; style edits (position, width,
 * size, color) apply in every language.
 *
 * Pasting is forced to plain text: browsers insert a paste's full rich HTML
 * (fonts, colors, background, whatever inline styles the source page had)
 * into contentEditable by default, which silently overrides our design
 * system — pasting a heading copied from another site previously carried
 * its Tailwind classes and inline styles straight into the saved edit. Any
 * already-corrupted saved value also self-heals on load via
 * sanitizeToPlainHtml, which strips everything but text and <br>.
 */
export function EditableText({ id, htmlId, as: Tag = "span", className, children, html }: EditableTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const isHtmlMode = html !== undefined;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<{ top: number; left: number } | null>(null);
  const [handlePos, setHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizeHandlePos, setResizeHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  const [fontSizeHandlePos, setFontSizeHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [resizingFont, setResizingFont] = useState(false);
  const lang = useLang();
  const [inLink, setInLink] = useState(false);
  const [altEditing, setAltEditing] = useState(false);
  const editable = SITE_EDITING_ENABLED && lang === "en" && (!inLink || altEditing);

  // Whether this sits inside a link is a DOM fact, only known after mount.
  useLayoutEffect(() => {
    setInLink(!!ref.current?.closest("a[href]"));
  }, []);

  // Content for the current language: the saved English edit (or the
  // default) in English, the translation otherwise.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = getEditedValue(id);
    const englishHtml = saved ?? html ?? escapeHtml(children ?? "");
    const translated = localizedText(id, lang, englishHtml);
    // Always restored through the sanitizer (not textContent) even for
    // plain-text elements now: a saved value may contain a whitelisted
    // color <span> from a partial-selection color edit (see applyColor).
    const next = translated !== null ? escapeHtml(translated) : saved !== null ? sanitizeToPlainHtml(saved) : englishHtml;
    // Untouched default text is left as React rendered it.
    if (el.innerHTML !== next) el.innerHTML = next;
    // Only re-apply when the key or language changes (e.g. a different
    // product card mounts into the same slot) — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang]);

  useEffect(() => {
    const savedColor = getEditedColor(id);
    if (savedColor && ref.current) ref.current.style.color = savedColor;
    const savedPos = getEditedPosition(id);
    if (savedPos && ref.current) ref.current.style.translate = `${savedPos.dx}px ${savedPos.dy}px`;
    const savedWidth = getEditedWidth(id);
    if (savedWidth && ref.current) {
      // A plain inline element (the default `span`) ignores width entirely
      // — only switch it to inline-block for one that's actually been
      // resized, so every untouched span stays exactly as inline as before.
      // Uses `width`, not `max-width`: max-width can only ever cap an
      // element narrower than its natural size, never grow it past that —
      // which made dragging the handle outward a no-op for anything whose
      // natural width was already at or above the dragged target.
      if (getComputedStyle(ref.current).display === "inline") ref.current.style.display = "inline-block";
      // A stylesheet `max-width` (e.g. `.contacts-subtitle`'s 34rem) caps an
      // inline `width` from ever growing past it — same fix as ContactsMoon's
      // own resize handle already applies — so a resize this handle can't
      // actually make wider than the original class-driven max ever visibly
      // moves.
      ref.current.style.maxWidth = "none";
      ref.current.style.width = `${savedWidth}px`;
    }
    const savedFontSize = getEditedFontSize(id);
    if (savedFontSize && ref.current) ref.current.style.fontSize = `${savedFontSize}px`;
  }, [id]);

  // Opens the color palette (above/below the text), the drag handle (to its
  // left), and the resize handle (to its right) together — all three live
  // only while the text is focused.
  function openControls() {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let top = rect.top - PALETTE_HEIGHT_ESTIMATE - 8;
    if (top < 8) top = rect.bottom + 8;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PALETTE_WIDTH - 8));
    setPalettePos({ top, left });
    setHandlePos({ top: rect.top + rect.height / 2 - 11, left: Math.max(4, rect.left - 30) });
    setResizeHandlePos({ top: rect.top + rect.height / 2 - 11, left: rect.right + 8 });
    // Stacked directly below the width-resize handle (same right-edge x, one
    // handle-height + gap further down) rather than picking a fresh spot, so
    // it never competes with the palette (which spans a fixed width above or
    // below the text) for space.
    setFontSizeHandlePos({ top: rect.top + rect.height / 2 - 11 + 30, left: rect.right + 8 });
    setPaletteOpen(true);
  }

  // A swatch click with no active text selection colors the whole element
  // (the existing behavior — style.color + a separate __color key). With an
  // active, non-collapsed selection *inside this element*, it instead colors
  // only that selected run via execCommand("foreColor", ...), which wraps it
  // in a <span style="color:...">, and the result is persisted as part of
  // the element's normal saved HTML (sanitized to keep only that span).
  function applyColor(color: string) {
    const el = ref.current;
    if (!el) return;
    const selection = window.getSelection();
    const hasPartialSelection =
      !!selection &&
      !selection.isCollapsed &&
      selection.rangeCount > 0 &&
      el.contains(selection.getRangeAt(0).commonAncestorContainer);

    if (hasPartialSelection) {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, toExecCommandColor(color));
      scheduleSave(sanitizeToPlainHtml(el.innerHTML));
    } else {
      el.style.color = color;
      setEditedColor(id, color);
    }
  }

  // Drag-to-reposition: the handle is a small fixed-position button next to
  // the text, not the text itself (which is contentEditable — dragging it
  // directly would just place a caret / select text). preventDefault on
  // pointerdown both starts the drag and suppresses the default focus-shift
  // for this mousedown, so grabbing the handle never blurs (and so never
  // closes) the text being moved.
  function onHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getEditedPosition(id) ?? { dx: 0, dy: 0 };
    const startHandle = handlePos;
    setDragging(true);

    function onMove(ev: PointerEvent) {
      const dx = startPos.dx + (ev.clientX - startX);
      const dy = startPos.dy + (ev.clientY - startY);
      el!.style.translate = `${dx}px ${dy}px`;
      if (startHandle) {
        setHandlePos({
          top: startHandle.top + (ev.clientY - startY),
          left: startHandle.left + (ev.clientX - startX),
        });
      }
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const dx = startPos.dx + (ev.clientX - startX);
      const dy = startPos.dy + (ev.clientY - startY);
      setEditedPosition(id, dx, dy);
      setDragging(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Drag-to-resize: only the width changes (height always stays intrinsic
  // to the text/line-wrapping), dragging a handle at the text's right edge.
  // Same inline-block promotion as the mount-time restore above, so a
  // never-resized span keeps behaving exactly as a plain inline element
  // right up until the first drag.
  function onResizeHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
    el.style.maxWidth = "none";
    const startX = e.clientX;
    const startWidth = el.getBoundingClientRect().width;
    const startHandle = resizeHandlePos;
    setResizing(true);

    function onMove(ev: PointerEvent) {
      const width = Math.max(40, startWidth + (ev.clientX - startX));
      el!.style.width = `${width}px`;
      if (startHandle) {
        setResizeHandlePos({ top: startHandle.top, left: startHandle.left + (ev.clientX - startX) });
      }
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const width = Math.max(40, startWidth + (ev.clientX - startX));
      setEditedWidth(id, width);
      setResizing(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Drag-to-resize font size: drag up to grow, down to shrink — the
  // vertical counterpart to the width handle's horizontal drag. Sensitivity
  // is halved (2px of drag per 1px of font-size) so a full handle-height's
  // worth of drag doesn't blow past a readable range instantly.
  function onFontSizeHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const startY = e.clientY;
    const startSize = parseFloat(getComputedStyle(el).fontSize) || 16;
    const startHandle = fontSizeHandlePos;
    setResizingFont(true);

    function nextSize(ev: PointerEvent) {
      return Math.max(8, startSize + (startY - ev.clientY) * 0.5);
    }
    function onMove(ev: PointerEvent) {
      el!.style.fontSize = `${nextSize(ev)}px`;
      if (startHandle) {
        setFontSizeHandlePos({ top: startHandle.top + (ev.clientY - startY), left: startHandle.left });
      }
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setEditedFontSize(id, nextSize(ev));
      setResizingFont(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function scheduleSave(value: string) {
    // Cache updates immediately, synchronously — see Typewriter.tsx's own
    // handleInput for why (a re-render landing in the debounce's 250ms gap,
    // e.g. from onBlur, must never see the value from before this edit).
    // Only the actual network persist is debounced.
    setEditedValueLocal(id, value);
    const existing = debounceTimers.get(id);
    if (existing) clearTimeout(existing);
    debounceTimers.set(
      id,
      setTimeout(() => {
        setEditedValue(id, value);
        debounceTimers.delete(id);
      }, DEBOUNCE_MS),
    );
  }

  function handleInput(e: React.FormEvent<HTMLElement>) {
    scheduleSave(sanitizeToPlainHtml(e.currentTarget.innerHTML));
  }

  function handlePaste(e: React.ClipboardEvent<HTMLElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r?\n+/g, " ");
    document.execCommand("insertText", false, text);
  }

  // Enter inserts a plain <br> line break in place rather than letting the
  // browser split this element into two nodes — the default contentEditable
  // behavior for a block-level root, which would blur it (and risk the
  // same blur-during-the-debounce-gap revert `insertLineBreak` avoids by
  // never taking focus away). `<li>` cards left as-is — the browser default
  // there is already just a line break, not a structural split.
  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" && Tag !== "li") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  }

  const sharedProps = {
    ref: ref as React.Ref<never>,
    id: htmlId,
    contentEditable: editable,
    suppressContentEditableWarning: true,
    "data-key": id,
    className: ["editable-text", className].filter(Boolean).join(" "),
    onInput: handleInput,
    onPaste: handlePaste,
    onKeyDown: handleKeyDown,
    // preventDefault on click (not mousedown — that would block the browser
    // from placing a caret/focusing the element at all) is required to stop
    // a real <a href>/mailto ancestor (product "Visit site", contacts
    // "Contact us", an in-press card) from navigating on click. stopPropagation
    // alone only stops React's own bubbling, not the link's native default
    // action.
    // Only while editing — otherwise a link ancestor navigates as usual.
    onClick: (e: React.MouseEvent) => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
    },
    onMouseDown: (e: React.MouseEvent) => {
      if (inLink && lang === "en" && e.altKey && !altEditing) {
        // Alt+click on link text: switch to editing (the click that follows
        // is then swallowed above instead of following the link).
        e.preventDefault();
        e.stopPropagation();
        setAltEditing(true);
        requestAnimationFrame(() => ref.current?.focus());
        return;
      }
      if (editable) e.stopPropagation();
    },
    onFocus: () => {
      if (editable) openControls();
    },
    onBlur: () => {
      setAltEditing(false);
      if (!dragging && !resizing && !resizingFont) setPaletteOpen(false);
    },
  };

  const controlsVisible = SITE_EDITING_ENABLED && (paletteOpen || dragging || resizing || resizingFont);

  const palette =
    controlsVisible && palettePos && typeof document !== "undefined"
      ? createPortal(
          <div
            className="editable-color-palette"
            style={{ top: palettePos.top, left: palettePos.left }}
            // Cancels the browser's default focus-shift for this mousedown so
            // clicking a swatch never blurs (and thus never closes) the text
            // node being edited — lets the user try several colors in a row.
            onMouseDown={(e) => e.preventDefault()}
          >
            <p className="editable-color-palette-hint">일부만 선택하면 선택한 부분만 바뀌어요</p>
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                className="editable-color-swatch"
                style={{ background: swatch.value }}
                title={swatch.label}
                aria-label={swatch.label}
                onClick={() => applyColor(swatch.value)}
              />
            ))}
          </div>,
          document.body,
        )
      : null;

  const dragHandle =
    SITE_EDITING_ENABLED &&
    controlsVisible && handlePos && typeof document !== "undefined"
      ? createPortal(
          <button
            type="button"
            className={["editable-drag-handle", dragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
            style={{ top: handlePos.top, left: handlePos.left }}
            title="드래그해서 위치 이동"
            aria-label="드래그해서 텍스트 위치 이동"
            onPointerDown={onHandlePointerDown}
          >
            ⠿
          </button>,
          document.body,
        )
      : null;

  const resizeHandle =
    controlsVisible && resizeHandlePos && typeof document !== "undefined"
      ? createPortal(
          <button
            type="button"
            className={["editable-resize-handle", resizing ? "is-dragging" : ""].filter(Boolean).join(" ")}
            style={{ top: resizeHandlePos.top, left: resizeHandlePos.left }}
            title="드래그해서 텍스트 박스 길이 조절"
            aria-label="드래그해서 텍스트 박스 길이 조절"
            onPointerDown={onResizeHandlePointerDown}
          >
            ↔
          </button>,
          document.body,
        )
      : null;

  const fontSizeHandle =
    controlsVisible && fontSizeHandlePos && typeof document !== "undefined"
      ? createPortal(
          <button
            type="button"
            className={["editable-fontsize-handle", resizingFont ? "is-dragging" : ""].filter(Boolean).join(" ")}
            style={{ top: fontSizeHandlePos.top, left: fontSizeHandlePos.left }}
            title="드래그해서 텍스트 크기 조절 (위로 크게, 아래로 작게)"
            aria-label="드래그해서 텍스트 크기 조절"
            onPointerDown={onFontSizeHandlePointerDown}
          >
            A
          </button>,
          document.body,
        )
      : null;

  if (isHtmlMode) {
    return (
      <>
        <Tag {...sharedProps} dangerouslySetInnerHTML={{ __html: html! }} />
        {palette}
        {dragHandle}
        {resizeHandle}
        {fontSizeHandle}
      </>
    );
  }
  return (
    <>
      <Tag {...sharedProps}>{children}</Tag>
      {palette}
      {dragHandle}
      {resizeHandle}
      {fontSizeHandle}
    </>
  );
}
