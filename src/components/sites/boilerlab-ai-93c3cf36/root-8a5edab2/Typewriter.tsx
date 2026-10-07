"use client";

import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  getEditedColor,
  getEditedFontSize,
  getEditedPosition,
  getEditedValue,
  setEditedColor,
  setEditedFontSize,
  setEditedPosition,
  setEditedValue,
  setEditedValueLocal,
} from "./editable/storage";
import { COLOR_SWATCHES } from "./editable/colors";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { localizedText } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/main-text";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";

const PALETTE_WIDTH = 300;
const PALETTE_HEIGHT_ESTIMATE = 96;

// No cross-tab/cross-component change notifications needed here — each key
// is only ever written by its own element — so the store never actually
// pushes updates; this just satisfies useSyncExternalStore's subscribe
// contract while keeping the initial read SSR-safe (see getServerSnapshot).
function subscribeNever() {
  return () => {};
}

/**
 * A real character-by-character typing reveal: `revealedCount` (state,
 * advanced on an interval once `active`) is the number of characters
 * actually in the DOM so far — not a "0.22s fade with a staggered delay"
 * simulation-by-CSS (that version turned out too fast/subtle to actually
 * read as "typing" once you could see the whole sentence's letters all
 * sitting there at once, just faded). Only-so-far-typed words/letters are
 * rendered at all, so the text visibly grows left-to-right exactly like the
 * `textContent +=` reference this was modeled on, and the paragraph's own
 * width/wrap grows with it instead of being reserved up front.
 */
const TYPE_MS_PER_CHAR = 45;

interface TypedWord {
  /** How many characters (across the whole string, spaces included) come
   * before this word's own first letter — lets render-time compare each
   * word's position against `revealedCount` without re-walking the string. */
  startIndex: number;
  letters: string[];
  /** True when a manually inserted "\n" (see handleKeyDown) follows this
   * word instead of the usual space, so render can emit a <br/> there. */
  breakAfter: boolean;
}

/** Japanese / Chinese text has no spaces, so a whole sentence is one
 * "word"; such words wrap like normal text instead (see .typewriter-word-cjk). */
const KANA_KANJI = /[぀-ヿ㐀-鿿＀-￯]/;

function layoutWords(text: string): TypedWord[] {
  const words: TypedWord[] = [];
  let current = "";
  let currentStart = 0;
  for (let i = 0; i <= text.length; i++) {
    const ch = i < text.length ? text[i] : null;
    if (ch === " " || ch === "\n" || ch === null) {
      words.push({ startIndex: currentStart, letters: current.split(""), breakAfter: ch === "\n" });
      current = "";
      currentStart = i + 1;
    } else {
      current += ch;
    }
  }
  return words;
}

/** Reads a contentEditable node back into plain text the same way it was
 * laid out: a manually inserted <br> (see handleKeyDown) becomes "\n" rather
 * than being dropped, the way `.textContent` would drop it. */
function extractTextWithBreaks(node: Node): string {
  let result = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      result += el.tagName === "BR" ? "\n" : extractTextWithBreaks(el);
    }
  });
  return result;
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 250;

// A slide with a long typewriter paragraph creates hundreds of individual
// <span> letters (matching the live DOM). Re-running layoutWords() and
// re-rendering all of them on every unrelated parent re-render (e.g. the
// deck advancing to a different slide) was a real source of jank — this
// component now only recomputes/re-renders when its own props actually
// change.
export const Typewriter = memo(function Typewriter({
  text,
  as: Tag = "p",
  active,
  className,
  editKey,
  cursor = false,
  animate = true,
}: {
  text: string;
  as?: "p" | "h2" | "h3" | "span";
  active: boolean;
  className?: string;
  /** Opts this paragraph into the click-to-edit feature (see
   * editable/EditableText.tsx). */
  editKey?: string;
  /** Adds a blinking terminal-style cursor after the text once typed.
   * Opt-in (default off) — most `[data-typewriter]` uses on this site are
   * short labels where a permanent per-instance cursor would just clutter a
   * page with several of them visible at once. */
  cursor?: boolean;
  /** Set false to show the full text immediately instead of revealing it
   * letter by letter — the contacts page opts out of the reveal entirely
   * while keeping the click-to-edit/drag/color-swatch behavior editKey
   * already provides. */
  animate?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  // Reads localStorage once mounted on the client; returns null during SSR
  // (getServerSnapshot) so the server-rendered animated markup matches the
  // client's first hydration pass exactly, with no mismatch warning.
  const savedText = useSyncExternalStore(
    subscribeNever,
    () => (editKey ? getEditedValue(editKey) : null),
    () => null,
  );
  // A saved edit used to retire the letter-by-letter animation entirely
  // (just showing the plain saved text) — but every "company" section text
  // already has a saved edit from the initial site clone, so in practice
  // the animation NEVER played there at all. It now always animates,
  // typing out whichever text is actually showing (the saved edit if one
  // exists, the original copy otherwise).
  // KO/JA type out the translation (i18n/main-text.ts); only English is
  // editable.
  const lang = useLang();
  const englishText = savedText ?? text;
  const displayText = (editKey ? localizedText(editKey, lang, englishText) : null) ?? englishText;
  const editable = SITE_EDITING_ENABLED && !!editKey && lang === "en";
  const words = useMemo(() => layoutWords(displayText), [displayText]);

  // Advances one character at a time once `active` flips true (arrival at
  // this section — see BoilerLabScrollApp's `present`/`useInView` wiring),
  // resetting back to 0 if the text itself changes mid-flight (e.g. a live
  // edit lands while this hasn't finished typing yet).
  // `revealedCount` only ever needs to exist as state for the genuinely
  // time-driven case below (a setInterval tick can't be computed at render
  // time). The two "show everything immediately" cases — animation opted
  // out entirely, or not yet arrived at this section — are pure functions
  // of props, so they're handled as a derived `displayedCount` instead of
  // routing through this state/effect at all.
  const [revealedCount, setRevealedCount] = useState(0);
  useEffect(() => {
    if (!animate || !active) return;
    // Kicking off a letter-by-letter reveal is an inherently time-driven
    // animation (advance one character every TYPE_MS_PER_CHAR) — there's no
    // render-time equivalent to "start a timer", so this reset + interval is
    // the one unavoidable setState-in-effect case here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealedCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= displayText.length) clearInterval(timer);
    }, TYPE_MS_PER_CHAR);
    return () => clearInterval(timer);
  }, [active, displayText, animate]);
  const displayedCount = !animate ? displayText.length : active ? revealedCount : 0;
  const typingDone = displayedCount >= displayText.length;

  // Drag-to-reposition — same mechanism/storage as EditableText's, since
  // this component never shared that one (it predates it and has its own
  // letter-by-letter animation machinery), but a Typewriter paragraph with
  // an editKey is just as much an editable text node and deserves the same
  // control.
  const [handlePos, setHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<{ top: number; left: number } | null>(null);
  const [fontSizeHandlePos, setFontSizeHandlePos] = useState<{ top: number; left: number } | null>(null);
  const [resizingFont, setResizingFont] = useState(false);

  useEffect(() => {
    if (!editKey || !ref.current) return;
    const saved = getEditedPosition(editKey);
    if (saved) ref.current.style.translate = `${saved.dx}px ${saved.dy}px`;
    const savedColor = getEditedColor(editKey);
    if (savedColor) ref.current.style.color = savedColor;
    const savedFontSize = getEditedFontSize(editKey);
    if (savedFontSize) ref.current.style.fontSize = `${savedFontSize}px`;
  }, [editKey]);

  function openHandle() {
    const el = ref.current;
    if (!editKey || !el) return;
    const rect = el.getBoundingClientRect();
    setHandlePos({ top: rect.top + rect.height / 2 - 11, left: Math.max(4, rect.left - 30) });
    setFontSizeHandlePos({ top: rect.top + rect.height / 2 - 11, left: rect.right + 8 });
    let top = rect.top - PALETTE_HEIGHT_ESTIMATE - 8;
    if (top < 8) top = rect.bottom + 8;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PALETTE_WIDTH - 8));
    setPalettePos({ top, left });
    setPaletteOpen(true);
  }

  function applyColor(color: string) {
    const el = ref.current;
    if (!editKey || !el) return;
    el.style.color = color;
    setEditedColor(editKey, color);
  }

  function onHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!editKey || !el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getEditedPosition(editKey) ?? { dx: 0, dy: 0 };
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
      setEditedPosition(editKey!, dx, dy);
      setDragging(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Drag-to-resize font size — same vertical drag-up-to-grow convention as
  // EditableText's own font-size handle.
  function onFontSizeHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!editKey || !el) return;
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
      setEditedFontSize(editKey!, nextSize(ev));
      setResizingFont(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleInput(e: React.FormEvent<HTMLElement>) {
    if (!editKey) return;
    const value = extractTextWithBreaks(e.currentTarget);
    // Cache updates immediately (synchronously, every keystroke) so any
    // re-render that lands before the network save below — most notably
    // onBlur's own setState calls, which fire synchronously when Enter
    // forces this contentEditable <p> to split — reads the value just
    // typed, not the previous saved one. Only the actual network persist is
    // debounced.
    setEditedValueLocal(editKey, value);
    const existing = debounceTimers.get(editKey);
    if (existing) clearTimeout(existing);
    debounceTimers.set(
      editKey,
      setTimeout(() => {
        setEditedValue(editKey, value);
        debounceTimers.delete(editKey);
      }, DEBOUNCE_MS),
    );
  }

  function handlePaste(e: React.ClipboardEvent<HTMLElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r?\n+/g, " ");
    document.execCommand("insertText", false, text);
  }

  // Enter inserts a <br> in place via execCommand rather than letting the
  // browser split this element into two nodes — the default contentEditable
  // behavior for a block-level root, which would blur it. layoutWords/render
  // below and extractTextWithBreaks above treat that <br> as a "\n" in the
  // saved plain text, so it round-trips through a reload.
  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  }

  const editProps = editKey
    ? {
        ref: ref as React.Ref<never>,
        contentEditable: editable,
        suppressContentEditableWarning: true,
        "data-key": editKey,
        onInput: handleInput,
        onPaste: handlePaste,
        onKeyDown: handleKeyDown,
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onFocus: () => {
          if (editable) openHandle();
        },
        onBlur: () => {
          if (!dragging && !resizingFont) {
            setHandlePos(null);
            setFontSizeHandlePos(null);
            setPaletteOpen(false);
          }
        },
      }
    : {};

  const dragHandle =
    SITE_EDITING_ENABLED &&
    handlePos && typeof document !== "undefined"
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

  const fontSizeHandle =
    fontSizeHandlePos && typeof document !== "undefined"
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

  const palette =
    SITE_EDITING_ENABLED &&
    paletteOpen && palettePos && typeof document !== "undefined"
      ? createPortal(
          <div
            className="editable-color-palette"
            style={{ top: palettePos.top, left: palettePos.left }}
            onMouseDown={(e) => e.preventDefault()}
          >
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

  return (
    <>
      <Tag
        {...editProps}
        data-typewriter=""
        data-typewriter-text={displayText}
        className={[className, active ? "is-typed" : "", editKey ? "editable-text" : ""].filter(Boolean).join(" ") || undefined}
      >
        {words.map((word, wi) => {
          // Nothing of this word has been reached yet — stop rendering
          // words here entirely (not just this one blank) so the sentence
          // visibly grows only as far as typing has actually progressed,
          // rather than reserving every future word's layout space up front.
          if (word.startIndex >= displayedCount) return null;
          const visibleLetterCount = Math.max(0, Math.min(word.letters.length, displayedCount - word.startIndex));
          return (
            // The space between words must be a sibling text node (not part
            // of the inline-block .typewriter-word span), matching the live
            // DOM — putting it inside the span causes it to render with no
            // visible gap.
            <span key={wi}>
              <span className={KANA_KANJI.test(word.letters.join("")) ? "typewriter-word typewriter-word-cjk" : "typewriter-word"}>
                {word.letters.slice(0, visibleLetterCount).join("")}
              </span>
              {wi < words.length - 1 && visibleLetterCount === word.letters.length
                ? word.breakAfter
                  ? <br />
                  : " "
                : ""}
            </span>
          );
        })}
        {cursor && active && (
          <span className={["typewriter-cursor", typingDone ? "typewriter-cursor-settled" : ""].filter(Boolean).join(" ")} aria-hidden="true" />
        )}
      </Tag>
      {dragHandle}
      {fontSizeHandle}
      {palette}
    </>
  );
});
