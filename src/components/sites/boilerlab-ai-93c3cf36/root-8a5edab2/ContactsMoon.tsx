"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ParticleOrb from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ParticleOrb";
import { getEditedPosition, getEditedWidth, setEditedPosition, setEditedWidth } from "./editable/storage";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";

const DEFAULT_MOON_ID = "contacts.moon";
const MIN_WIDTH_PX = 240;

// No cross-tab/cross-component change notifications needed — see
// Typewriter.tsx's identical helper for why this can be a permanent no-op.
function subscribeNever() {
  return () => {};
}

/**
 * The arriving moon/sphere used on both the Hero and Contacts slides, with
 * its own drag-to-resize handle — same `getEditedWidth`/`setEditedWidth`
 * storage EditableText uses for its text-box width override, reused here for
 * a non-text element. `id` keys that storage (defaults to the original
 * Contacts instance's key) so each mounted instance keeps its own
 * independent saved size — the Hero one passes its own id rather than
 * sharing the Contacts slide's. The override applies to `.contacts-moon`
 * itself (the visual sphere); its `aspect-ratio: 1/1` (boilerlab.css) keeps
 * it round as it resizes.
 *
 * `width` is always a concrete number once mounted (measured from the
 * element's own natural CSS size if nothing's been dragged yet), not just
 * "override or unset" — the resize handle needs a real value to position
 * itself at the moon's actual right edge, since `.contacts-moon-wrap` spans
 * the full viewport width (flex-centers the narrower moon inside it) and
 * `.editable-resize-handle`'s `position: fixed` resolves against that wrap
 * (its `transform` makes it the containing block), not the moon itself.
 *
 * `interactive={false}` (the Hero instance) drops pointer-events on the
 * whole wrap and skips the resize handle. `.contacts-moon-wrap` has its own
 * `z-index: 2` — harmless on the Contacts slide, where the moon only ever
 * peeks up from below the (non-overlapping) text, but on Hero it's
 * proportionally much bigger and its box spatially overlaps the vertically
 * centered title, so without this it silently ate every click meant for
 * that text (confirmed via `elementsFromPoint`: the moon's own canvas, not
 * the h1, was the actual top hit).
 *
 * `wrapRef` exposes the outer `.contacts-moon-wrap` div itself — HeroSlideScroll
 * uses it to drive the scroll-linked roll-away (translateX/rotate) directly
 * via imperative style writes on every scroll event, which needs the real
 * DOM node, not anything this component could compute or expose as props.
 */
export default function ContactsMoon({
  id = DEFAULT_MOON_ID,
  interactive = true,
  marbleClickable,
  wrapRef,
  wrapClassName,
  colorSource,
  hideOrb = false,
}: {
  id?: string;
  interactive?: boolean;
  /** Whether the marble body itself (not the resize/move handles, which
   * follow `interactive`) accepts pointer events — defaults to `interactive`.
   * The Hero instance sets this false on its own: its marble body overlaps
   * the vertically centered title, and the marble's own pointer-events:auto
   * (needed elsewhere for its interactive rotation drag) would otherwise
   * swallow clicks meant for that text, the same problem the wrap itself
   * had (see the wrap's own style comment below). */
  marbleClickable?: boolean;
  wrapRef?: React.Ref<HTMLDivElement>;
  wrapClassName?: string;
  /** Passed to MagicMarble: overrides the pigment color every frame. */
  colorSource?: { readonly current: string | null };
  /** Keep the wrap/marble boxes (other code measures them) but don't draw
   * the orb. */
  hideOrb?: boolean;
}) {
  const moonRef = useRef<HTMLDivElement | null>(null);
  // Reads any saved width override synchronously during render (client
  // only — `getServerSnapshot` returns `null` so the server render and the
  // client's first hydration pass produce identical markup, then
  // useSyncExternalStore itself reconciles to the real client value right
  // after, no manual effect/setState round trip needed for this part).
  const savedWidth = useSyncExternalStore(
    subscribeNever,
    () => getEditedWidth(id),
    () => null,
  );
  // Same synchronous-snapshot approach as savedWidth, for the drag-to-move
  // offset (see onMovePointerDown below).
  const savedPos = useSyncExternalStore(
    subscribeNever,
    () => getEditedPosition(id),
    () => null,
  );
  // Covers the two things a storage snapshot can't: the live value while
  // actively dragging the resize handle, and the moon's natural CSS-driven
  // width when nothing's been saved yet — both are real per-frame/post-mount
  // measurements, not values derivable at render time.
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [livePos, setLivePos] = useState<{ dx: number; dy: number } | null>(null);
  const [moving, setMoving] = useState(false);
  const width = liveWidth ?? savedWidth;
  const pos = livePos ?? savedPos ?? { dx: 0, dy: 0 };

  useEffect(() => {
    if (liveWidth != null || !moonRef.current) return;
    // Re-reads storage directly here rather than trusting the `savedWidth`
    // closure value: useSyncExternalStore renders `null` (the SSR snapshot)
    // on the hydration pass and only corrects to the real client value in a
    // follow-up render — if this effect fired from that first (stale) pass,
    // `savedWidth` here would still read `null` even though the actual
    // stored override is already sitting in `window.__EDITABLE_OVERRIDES__`
    // (set synchronously before hydration even started), and this effect
    // would wrongly fall back to a DOM measurement instead of the override.
    if (getEditedWidth(id) != null) return;
    // A real post-mount layout measurement (the moon's natural, unsaved
    // width) — there's no render-time equivalent, unlike the `savedWidth`
    // read above.
    setLiveWidth(moonRef.current.getBoundingClientRect().width);
  }, [id, savedWidth, liveWidth]);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = moonRef.current;
    if (!el) return;
    const startX = e.clientX;
    const startWidth = el.getBoundingClientRect().width;
    setDragging(true);

    function onMove(ev: PointerEvent) {
      // Dragging the handle (parked at the moon's right edge) out/in moves
      // that one edge; the moon is horizontally centered by its wrap
      // (`display: flex; justify-content: center`), so growing/shrinking by
      // 2x the drag distance keeps the resize feeling symmetric instead of
      // only ever growing rightward.
      setLiveWidth(Math.max(MIN_WIDTH_PX, startWidth + (ev.clientX - startX) * 2));
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const next = Math.max(MIN_WIDTH_PX, startWidth + (ev.clientX - startX) * 2);
      setEditedWidth(id, next);
      setLiveWidth(next);
      setDragging(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onMovePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = pos;
    setMoving(true);

    function onMove(ev: PointerEvent) {
      setLivePos({ dx: startPos.dx + (ev.clientX - startX), dy: startPos.dy + (ev.clientY - startY) });
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const next = { dx: startPos.dx + (ev.clientX - startX), dy: startPos.dy + (ev.clientY - startY) };
      setEditedPosition(id, next.dx, next.dy);
      setLivePos(next);
      setMoving(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      ref={wrapRef}
      className={["contacts-moon-wrap", wrapClassName].filter(Boolean).join(" ")}
      // Always none, even when interactive: this wrap div spans the moon's
      // whole bounding box (bigger than the visible sphere), and stacks
      // above the page content (z-index: 2) — on the Hero instance, that
      // box spatially overlaps the vertically centered title, so letting it
      // accept pointer events silently ate every click meant for that text
      // (confirmed directly: the title became unclickable the moment this
      // instance went interactive). The marble body and both drag handles
      // each set their own `pointer-events: auto` to opt back in.
      style={{ pointerEvents: "none" }}
    >
      <div
        className="contacts-moon contacts-marble"
        ref={moonRef}
        // `.contacts-moon.contacts-marble`'s own CSS sets pointer-events:auto
        // (needed for the Contacts instance's drag) — an inline style is the
        // only thing that beats that class rule's specificity, so the wrap's
        // pointer-events:none above (a plain inherited value) can't do it on
        // its own when this instance's marble shouldn't be clickable.
        style={{
          ...(width != null ? { width, maxWidth: "none" } : undefined),
          ...((marbleClickable ?? interactive) ? undefined : { pointerEvents: "none" }),
          // Drag-to-move offset — a separate CSS property from `transform`,
          // so it composes cleanly with whatever transform the wrap or this
          // element already has, the same technique EditableText's own
          // drag handle uses.
          translate: pos.dx !== 0 || pos.dy !== 0 ? `${pos.dx}px ${pos.dy}px` : undefined,
        }}
        aria-hidden="true"
      >
        {!hideOrb && (
          <ParticleOrb
            palette={["#47e520", "#c9ffb8", "#ffffff", "#1a3d1a"]}
            core="#050806"
            sizePercent={64}
            colorSource={colorSource}
          />
        )}
      </div>
      {SITE_EDITING_ENABLED && interactive && width != null && (
        <>
          <button
            type="button"
            className={["editable-resize-handle", dragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
            // Follows the ball's own drag-to-move offset (see `pos` above)
            // so it stays parked at the ball's actual edge instead of being
            // left behind at the ball's pre-move spot.
            style={{
              top: "18%",
              left: `calc(50% + ${width / 2}px - 0.5rem)`,
              translate: pos.dx !== 0 || pos.dy !== 0 ? `${pos.dx}px ${pos.dy}px` : undefined,
            }}
            title="드래그해서 달 크기 조절"
            aria-label="드래그해서 달 크기 조절"
            onPointerDown={onPointerDown}
          >
            ↔
          </button>
          <button
            type="button"
            className={["editable-move-handle", moving ? "is-dragging" : ""].filter(Boolean).join(" ")}
            style={{
              top: "18%",
              left: `calc(50% - ${width / 2}px - 2rem)`,
              translate: pos.dx !== 0 || pos.dy !== 0 ? `${pos.dx}px ${pos.dy}px` : undefined,
            }}
            title="드래그해서 달 위치 이동"
            aria-label="드래그해서 달 위치 이동"
            onPointerDown={onMovePointerDown}
          >
            ✛
          </button>
        </>
      )}
    </div>
  );
}
