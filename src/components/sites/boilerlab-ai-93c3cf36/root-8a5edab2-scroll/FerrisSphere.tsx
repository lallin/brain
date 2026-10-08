"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ParticleOrb from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ParticleOrb";
import {
  getEditedPosition,
  getEditedWidth,
  setEditedPosition,
  setEditedValue,
  setEditedWidth,
} from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/storage";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";

/**
 * The site's own WebGL glass marble (MagicMarble, also used by Contacts),
 * parked between the copy and the Ferris wheel.
 * - Idle: the marble's built-in spin + pigment flow (base animation).
 * - Card step inside a part: a small 30° spin, same as one wheel slot.
 * - Part change: a big spin, and the pigment fades to that part's color.
 * - Size / position: hover shows a resize handle (bottom-right) and a move
 *   handle (top-left); drag to adjust, double-click a handle to reset it.
 *   Saved via the shared site-edits store. Position is a CSS `translate`
 *   offset so it composes with the sphere's own `transform` centering.
 */

const CARD_STEP = (30 * Math.PI) / 180;
const PART_SPIN = (330 * Math.PI) / 180;

const SIZE_KEY = "products.sphere";
const MIN_SIZE = 120;
// A pointer that travels less than this is a click (e.g. half of a
// double-click reset), not a drag — it must not save anything.
const DRAG_SLOP = 3;
const wasDrag = (ev: PointerEvent, startX: number, startY: number) =>
  Math.hypot(ev.clientX - startX, ev.clientY - startY) >= DRAG_SLOP;
const MAX_SIZE = 1400;

interface FerrisSphereProps {
  activeIndex: number;
  partIndex: number;
  glaze: string;
}

export function FerrisSphere({ activeIndex, partIndex, glaze }: FerrisSphereProps) {
  // Derive the spin impulse during render when the active card changes
  // (React's "adjust state on prop change" pattern — no effect needed).
  const [prev, setPrev] = useState({ index: activeIndex, part: partIndex });
  const [kick, setKick] = useState({ id: 0, radians: 0 });
  if (activeIndex !== prev.index) {
    const dir = activeIndex > prev.index ? 1 : -1;
    const radians = partIndex !== prev.part ? dir * PART_SPIN : dir * CARD_STEP * Math.abs(activeIndex - prev.index);
    setPrev({ index: activeIndex, part: partIndex });
    setKick({ id: kick.id + 1, radians });
  }

  const ref = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [handleHover, setHandleHover] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; bottom: number; right: number } | null>(null);

  function applySize(size: number | null) {
    const el = ref.current;
    if (!el) return;
    el.style.width = size ? `${size}px` : "";
    el.style.height = size ? `${size}px` : "";
  }

  function applyOffset(pos: { dx: number; dy: number } | null) {
    const el = ref.current;
    if (!el) return;
    el.style.translate = pos ? `${pos.dx}px ${pos.dy}px` : "";
  }

  useEffect(() => {
    applySize(getEditedWidth(SIZE_KEY));
    applyOffset(getEditedPosition(SIZE_KEY));
  }, []);

  // Hover is hit-tested by pointer position, not mouseenter: the wheel's
  // cards stack above the sphere, so it can be covered wherever it's moved.
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      setHovering(inside);
      if (inside) setRect({ top: r.top, left: r.left, bottom: r.bottom, right: r.right });
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  function updateHandlePos() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, bottom: r.bottom, right: r.right });
  }

  function onMoveStart(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = getEditedPosition(SIZE_KEY) ?? { dx: 0, dy: 0 };
    setMoving(true);

    const offsetAt = (ev: PointerEvent) => ({ dx: start.dx + ev.clientX - startX, dy: start.dy + ev.clientY - startY });

    function onMove(ev: PointerEvent) {
      applyOffset(offsetAt(ev));
      updateHandlePos();
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (wasDrag(ev, startX, startY)) {
        const { dx, dy } = offsetAt(ev);
        setEditedPosition(SIZE_KEY, dx, dy);
      } else {
        applyOffset(getEditedPosition(SIZE_KEY));
      }
      setMoving(false);
      updateHandlePos();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onResetPosition() {
    setEditedValue(`${SIZE_KEY}__pos`, "");
    applyOffset(null);
    requestAnimationFrame(updateHandlePos);
  }

  function onResizeStart(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = el.getBoundingClientRect().width;
    setResizing(true);

    // The sphere is centered on its anchor, so a corner drag of (dx, dy)
    // grows it by roughly dx + dy overall.
    const sizeAt = (ev: PointerEvent) =>
      Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, startSize + (ev.clientX - startX) + (ev.clientY - startY))));

    function onMove(ev: PointerEvent) {
      applySize(sizeAt(ev));
      updateHandlePos();
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (wasDrag(ev, startX, startY)) setEditedWidth(SIZE_KEY, sizeAt(ev));
      else applySize(getEditedWidth(SIZE_KEY));
      setResizing(false);
      updateHandlePos();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onResetSize() {
    setEditedValue(`${SIZE_KEY}__width`, "");
    applySize(null);
    requestAnimationFrame(updateHandlePos);
  }

  const showHandles = SITE_EDITING_ENABLED && (hovering || handleHover || resizing || moving) && rect && typeof document !== "undefined";

  return (
    <div ref={ref} className="ferris-sphere">
      <ParticleOrb palette={[glaze]} core="#000000" sizePercent={78} colorBlend="rgb" kick={kick} />
      {showHandles &&
        createPortal(
          <>
            <button
              type="button"
              className={["editable-drag-handle", moving ? "is-dragging" : ""].filter(Boolean).join(" ")}
              style={{ top: rect.top - 11, left: rect.left - 11 }}
              title="드래그해서 구 위치 이동 · 더블클릭하면 원래 위치로"
              aria-label="드래그해서 구 위치 이동"
              onPointerDown={onMoveStart}
              onDoubleClick={onResetPosition}
              onMouseEnter={() => setHandleHover(true)}
              onMouseLeave={() => setHandleHover(false)}
            >
              ⠿
            </button>
            <button
              type="button"
              className={["editable-resize-handle", resizing ? "is-dragging" : ""].filter(Boolean).join(" ")}
              style={{ top: rect.bottom - 11, left: rect.right - 11, cursor: "nwse-resize" }}
              title="드래그해서 구 크기 조절 · 더블클릭하면 원래 크기로"
              aria-label="드래그해서 구 크기 조절"
              onPointerDown={onResizeStart}
              onDoubleClick={onResetSize}
              onMouseEnter={() => setHandleHover(true)}
              onMouseLeave={() => setHandleHover(false)}
            >
              ⤡
            </button>
          </>,
          document.body,
        )}
    </div>
  );
}
