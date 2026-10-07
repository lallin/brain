"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { DemoModal } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/DemoModal";
import { getSolutionsByCategory, hubsFor } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import { cycleLang, useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";
import { t } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/t";

// Two independently-positioned floating panels rather than one flex row:
// the categories list's own width never changes (it always lists all 4
// categories), so once its box is placed it stays completely still:
// switching categories used to visibly shift it sideways because it shared
// one fixed-position box with the sub-items column, and that box's total
// width — hence its left edge, anchored from the right — grew/shrank
// depending on whether the active category had sub-items. Now the sub-items
// panel floats to the right of the categories box's own measured position
// instead, so appearing/disappearing/resizing there never touches it.
const MENU_CLOSE_DELAY_MS = 150;
const MENU_MARGIN = 16;
const MENU_GAP = 12;
// Assumed box dimensions, used only to place the sub-items flyout relative
// to the categories box's already-known position (see categoriesPos below)
// — a render-time estimate rather than a DOM measurement, since the
// categories box's real width/height barely varies (it always lists the
// same 4 category names) and re-measuring it on every category switch is
// exactly the kind of effect-driven setState that previously made the
// categories box itself appear to shift.
const CATEGORIES_WIDTH_ESTIMATE = 220;
const CATEGORIES_HEIGHT_ESTIMATE = 180;
const SUBITEMS_MIN_WIDTH = 240;

function HeaderSolutionsMenu() {
  const lang = useLang();
  const hubs = hubsFor(lang);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const subitemsRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [categoriesPos, setCategoriesPos] = useState<{ top: number; left: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  // The categories box's guessed position can still overflow either edge on
  // narrow screens. Nudge it back on-screen post-layout, before paint — this
  // only needs to run once per open, since this box's content (hence width)
  // never changes afterwards.
  useLayoutEffect(() => {
    if (!open) return;
    const el = categoriesRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let deltaX = 0;
    if (rect.left < MENU_MARGIN) deltaX = MENU_MARGIN - rect.left;
    else if (rect.right > window.innerWidth - MENU_MARGIN) deltaX = window.innerWidth - MENU_MARGIN - rect.right;
    if (deltaX !== 0) setCategoriesPos((p) => (p ? { ...p, left: p.left + deltaX } : p));
  }, [open]);

  // Derived purely from categoriesPos (already-committed state), not a DOM
  // measurement — so switching categories, which never moves the categories
  // box itself, can't move this either. Flips below the categories box
  // instead of beside it when there isn't room to its right.
  const subitemsPos = (() => {
    if (!categoriesPos) return null;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : Infinity;
    const rightEdge = categoriesPos.left + CATEGORIES_WIDTH_ESTIMATE + MENU_GAP + SUBITEMS_MIN_WIDTH;
    const fitsRight = rightEdge <= viewportWidth - MENU_MARGIN;
    return fitsRight
      ? { top: categoriesPos.top, left: categoriesPos.left + CATEGORIES_WIDTH_ESTIMATE + MENU_GAP, below: false }
      : { top: categoriesPos.top + CATEGORIES_HEIGHT_ESTIMATE + MENU_GAP, left: categoriesPos.left, below: true };
  })();

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), MENU_CLOSE_DELAY_MS);
  }

  // The categories box and the sub-items flyout are two separate elements
  // with a real gap between them (see the layout comment above) — per-
  // element onMouseEnter/onMouseLeave left that gap as dead space: crossing
  // it from one box toward the other fired the first box's onMouseLeave
  // with nothing yet under the cursor to cancel the resulting close timer,
  // so the whole menu closed before the pointer ever reached the second
  // box. Tracking the cursor against the padded union of all three pieces
  // (trigger + categories + sub-items) instead makes the gap — and the
  // trigger-to-categories gap — implicitly part of the hoverable area.
  useEffect(() => {
    if (!open) return;
    const pad = 20;
    function onMove(e: MouseEvent) {
      const rects = [triggerRef.current, categoriesRef.current, subitemsRef.current]
        .filter((el): el is HTMLButtonElement | HTMLDivElement => el !== null)
        .map((el) => el.getBoundingClientRect());
      const inside = rects.some(
        (r) => e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad,
      );
      if (inside) cancelClose();
      else scheduleClose();
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
    // cancelClose/scheduleClose are stable across renders (no props/state
    // captured besides refs and the timer ref itself).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openMenu() {
    cancelClose();
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Anchored to the trigger's right edge (not its left edge): the trigger
    // sits inside the right-aligned header-right group, so a left-anchored
    // box wider than the remaining space to the viewport's right edge ran
    // off-screen. Growing leftward from the right edge instead keeps it
    // inside the header's own right margin — corrected further above if it
    // still runs off the *left* edge on a narrow screen.
    setCategoriesPos({ top: rect.bottom + 12, left: rect.right - 220 });
    setActiveCategory(0);
    setOpen(true);
  }

  const activeHub = hubs[activeCategory];
  const activeSolutions = activeHub ? getSolutionsByCategory(activeHub.slug, lang) : [];

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="header-nav-link"
        aria-expanded={open}
        onMouseEnter={openMenu}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        {t(lang, "header_solutions")}
      </button>
      {open &&
        categoriesPos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              ref={categoriesRef}
              className="header-solutions-panel"
              style={{ top: categoriesPos.top, left: categoriesPos.left }}
            >
              {hubs.map((hub, i) => (
                <Link
                  key={hub.slug}
                  href={`/solutions/category/${hub.slug}`}
                  className={i === activeCategory ? "is-active" : undefined}
                  onMouseEnter={() => setActiveCategory(i)}
                  onClick={(e) => {
                    // First tap (or a click before hover ever set this
                    // category active — the touch/no-hover case) just
                    // previews its sub-items in the flyout, leaving this box
                    // exactly where it is. Only a second click on an
                    // already-active category follows through to that
                    // category's own page.
                    if (activeCategory !== i) {
                      e.preventDefault();
                      setActiveCategory(i);
                      return;
                    }
                    setOpen(false);
                  }}
                >
                  {hub.name}
                </Link>
              ))}
            </div>
            {activeSolutions.length > 0 &&
              subitemsPos &&
              createPortal(
                <div
                  ref={subitemsRef}
                  className={`header-solutions-subpanel${subitemsPos.below ? " is-below" : ""}`}
                  style={{ top: subitemsPos.top, left: subitemsPos.left }}
                >
                  {activeSolutions.map((s) => (
                    <Link key={s.slug} href={`/solutions/${s.slug}`} onClick={() => setOpen(false)}>
                      {s.name}
                    </Link>
                  ))}
                </div>,
                document.body,
              )}
          </>,
          document.body,
        )}
    </>
  );
}


export function SiteHeader({
  onNavigate,
  backLink,
}: {
  onNavigate?: (sectionId: string) => void;
  /** An extra "back to X" link, shown before Demo/EN — used by the
   * /solutions/* detail pages (via SolutionPageChrome) to link back to the
   * solutions list without those pages needing their own separate header. */
  backLink?: { href: string; label: string };
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <header className="site-header">
      <Link className="logo-link" href="/" aria-label="Braindeck home">
        <Image src="/sites/braindeck/images/braindeck-logo.png" alt="Braindeck" width={404} height={36} priority />
      </Link>
      <div className="header-right">
        <nav className="header-nav" aria-label="Main">
          <HeaderSolutionsMenu />
          {/* No in-page section to scroll to outside the scrolling home
              page (e.g. on a /solutions/* detail page) — link to the home
              page's own section instead of a no-op click handler. */}
          {onNavigate ? (
            <button type="button" className="header-nav-link" onClick={() => onNavigate("mission")}>
              {t(lang, "header_company")}
            </button>
          ) : (
            <Link href="/#mission" className="header-nav-link">
              {t(lang, "header_company")}
            </Link>
          )}
        </nav>
        <div className="header-actions">
          {backLink && (
            <Link href={backLink.href} className="header-nav-link">
              {backLink.label}
            </Link>
          )}
          <button type="button" className="header-pill" onClick={() => setDemoOpen(true)}>
            {t(lang, "header_demo")}
          </button>
          {/* Cycles EN → KO → JA → EN … (i18n/lang.ts). */}
          <button
            type="button"
            className="header-pill"
            aria-label={`Switch language (current: ${lang.toUpperCase()})`}
            onClick={cycleLang}
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </div>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </header>
  );
}
