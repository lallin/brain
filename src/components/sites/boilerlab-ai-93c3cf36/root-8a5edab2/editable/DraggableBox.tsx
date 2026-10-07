"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  getEditedPosition,
  getEditedValue,
  setEditedPosition,
  setEditedValue,
} from "./storage";
import { SITE_EDITING_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/config";

interface DraggableBoxProps {
  /** Unique persistence key (stored as `${id}__pos`, same shape as EditableText's). */
  id: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Adds a bottom-right grip that scales the whole box (CSS `scale`, saved
   *  as `${id}__scale`), for blocks with no single width to resize. */
  scalable?: boolean;
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

function getEditedScale(id: string): number | null {
  const n = Number(getEditedValue(`${id}__scale`));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The "whole box" counterpart to EditableText's per-text drag handle: wraps
 * arbitrary non-text content (a card, not a contentEditable text node) with
 * the same drag-to-reposition capability. A small grip handle appears on
 * hover instead of on focus (a plain div isn't focusable), dragging it moves
 * the whole box via a persisted CSS `translate` offset — kept as a separate
 * property from `transform` specifically so it composes with a card's own
 * `transform`-based centering/rotation (see .in-press-card) without
 * clobbering it.
 */
export function DraggableBox({
  id,
  className,
  style,
  children,
  scalable = false,
}: DraggableBoxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [handleHover, setHandleHover] = useState(false);
  const [handlePos, setHandlePos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [cornerPos, setCornerPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const saved = getEditedPosition(id);
    if (saved && ref.current)
      ref.current.style.translate = `${saved.dx}px ${saved.dy}px`;
    const scale = scalable ? getEditedScale(id) : null;
    if (scale && ref.current) ref.current.style.scale = String(scale);
  }, [id, scalable]);

  function updateHandlePos() {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setHandlePos({ top: rect.top - 11, left: rect.left - 11 });
    // A box wider than the window (e.g. the Solutions wheel after a move)
    // would put its corner grip off-screen — keep it just inside the edge.
    setCornerPos({
      top: Math.min(rect.bottom, window.innerHeight - 16) - 11,
      left: Math.min(rect.right, window.innerWidth - 16) - 11,
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getEditedPosition(id) ?? { dx: 0, dy: 0 };
    const startHandle = handlePos;
    setCornerPos(null);
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
      setDragging(false);
      // A click (e.g. half of a double-click reset) must not save anything.
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) {
        el!.style.translate =
          startPos.dx || startPos.dy ? `${startPos.dx}px ${startPos.dy}px` : "";
        if (startHandle) setHandlePos(startHandle);
        return;
      }
      const dx = startPos.dx + (ev.clientX - startX);
      const dy = startPos.dy + (ev.clientY - startY);
      setEditedPosition(id, dx, dy);
      updateHandlePos();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Corner drag: the box grows by the drag distance along its diagonal
  // (like the sphere's resize grip), applied as a uniform `scale`.
  function onScaleStart(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const startScale = getEditedScale(id) ?? 1;
    setScaling(true);

    const scaleAt = (ev: PointerEvent) => {
      const grow =
        (ev.clientX - startX + (ev.clientY - startY)) /
        (rect.width + rect.height);
      return Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, startScale * (1 + 2 * grow)),
      );
    };
    function onMove(ev: PointerEvent) {
      el!.style.scale = String(scaleAt(ev));
      updateHandlePos();
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setScaling(false);
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) {
        el!.style.scale = startScale === 1 ? "" : String(startScale);
      } else {
        setEditedValue(
          `${id}__scale`,
          String(Math.round(scaleAt(ev) * 1000) / 1000),
        );
      }
      updateHandlePos();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onResetScale() {
    setEditedValue(`${id}__scale`, "");
    if (ref.current) ref.current.style.scale = "";
    requestAnimationFrame(updateHandlePos);
  }

  function onReset() {
    setEditedValue(`${id}__pos`, "");
    if (ref.current) ref.current.style.translate = "";
    requestAnimationFrame(updateHandlePos);
  }

  const active = hovering || handleHover || dragging || scaling;
  const showHandle = SITE_EDITING_ENABLED && active && handlePos && typeof document !== "undefined";

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onMouseEnter={() => {
        setHovering(true);
        updateHandlePos();
      }}
      onMouseLeave={() => {
        if (!dragging && !scaling) setHovering(false);
      }}
    >
      {children}
      {showHandle &&
        createPortal(
          <>
            <button
              type="button"
              className={["editable-drag-handle", dragging ? "is-dragging" : ""]
                .filter(Boolean)
                .join(" ")}
              style={{ top: handlePos!.top, left: handlePos!.left }}
              title="드래그해서 위치 이동 · 더블클릭하면 원래 위치로"
              aria-label="드래그해서 박스 위치 이동"
              onPointerDown={onPointerDown}
              onDoubleClick={onReset}
              onMouseEnter={() => setHandleHover(true)}
              onMouseLeave={() => setHandleHover(false)}
            >
              ⠿
            </button>
            {scalable && cornerPos && !dragging && (
              <button
                type="button"
                className={[
                  "editable-resize-handle",
                  scaling ? "is-dragging" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  top: cornerPos.top,
                  left: cornerPos.left,
                  cursor: "nwse-resize",
                }}
                title="드래그해서 크기 조절 · 더블클릭하면 원래 크기로"
                aria-label="드래그해서 박스 크기 조절"
                onPointerDown={onScaleStart}
                onDoubleClick={onResetScale}
                onMouseEnter={() => setHandleHover(true)}
                onMouseLeave={() => setHandleHover(false)}
              >
                ⤡
              </button>
            )}
          </>,
          document.body,
        )}
    </div>
  );
}
