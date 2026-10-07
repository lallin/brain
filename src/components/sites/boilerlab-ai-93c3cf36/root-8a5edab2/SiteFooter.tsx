"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { FooterNavItem } from "@/types/boilerlab";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { CATEGORY_HUBS, getSolutionsByCategory } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";

// Partners/Products swapped from their original order (label text is keyed
// by sectionId via `footer.nav.${sectionId}`, so this swap moves each
// previously-edited label onto the section it actually now describes,
// without touching any saved label text itself).
export const FOOTER_NAV_ITEMS: FooterNavItem[] = [
  { label: "Mission", sectionId: "mission" },
  { label: "Numbers", sectionId: "numbers" },
  { label: "Products", sectionId: "products" },
  { label: "Partners", sectionId: "partners" },
  { label: "In Press", sectionId: "in-press" },
  { label: "Contacts", sectionId: "contacts" },
];

// The Solutions hover mega-menu's own content — the 4 category hubs, each
// listing its real solution pages (see solutions-data.ts) now that those
// exist as actual pages to link to.
const MENU_CLOSE_DELAY_MS = 150;

function SolutionsHoverMenu({
  isActiveSection,
  onNavigate,
}: {
  isActiveSection: boolean;
  onNavigate: (sectionId: string) => void;
}) {
  // The link itself is the ref target — no wrapping element. An earlier
  // version wrapped it in a `display: contents` div so hover could span
  // both the link and the portaled dropdown, but that broke the link's own
  // `:after` separator-dash sizing (its `flex: 1` resolved to `auto`
  // instead of a real width — a `display: contents` + CSS-grid-item
  // interaction quirk). A Fragment has no DOM node at all, so it can't
  // affect the grid/flex layout the way that wrapper did.
  const linkRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ bottom: number; left: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    cancelClose();
    const el = linkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelPos({ bottom: window.innerHeight - rect.top + 12, left: rect.left });
    setActiveCategory(0);
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), MENU_CLOSE_DELAY_MS);
  }

  const activeHub = CATEGORY_HUBS[activeCategory];
  const activeSolutions = activeHub ? getSolutionsByCategory(activeHub.slug) : [];

  return (
    <>
      <a
        ref={linkRef}
        href="#products"
        className={isActiveSection ? "is-active" : undefined}
        aria-current={isActiveSection ? "true" : undefined}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onClick={(e) => {
          e.preventDefault();
          onNavigate("products");
        }}
      >
        <EditableText id="footer.nav.products">Products</EditableText>
      </a>
      {open &&
        panelPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="solutions-menu"
            style={{ bottom: panelPos.bottom, left: panelPos.left }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <ul className="solutions-menu-categories">
              {CATEGORY_HUBS.map((hub, i) => (
                <li key={hub.slug}>
                  <Link
                    href={`/solutions/category/${hub.slug}`}
                    className={i === activeCategory ? "is-active" : undefined}
                    onMouseEnter={() => setActiveCategory(i)}
                  >
                    {hub.name}
                  </Link>
                </li>
              ))}
            </ul>
            {activeSolutions.length > 0 && (
              <ul className="solutions-menu-subitems">
                {activeSolutions.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/solutions/${s.slug}`}>{s.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export function SiteFooter({
  activeSectionId,
  onNavigate,
}: {
  activeSectionId: string;
  onNavigate: (sectionId: string) => void;
}) {
  return (
    <footer className="site-footer">
      <nav className="footer-nav is-ready" aria-label="Sections">
        {FOOTER_NAV_ITEMS.map((item) =>
          item.sectionId === "products" ? (
            <SolutionsHoverMenu
              key={item.sectionId}
              isActiveSection={item.sectionId === activeSectionId}
              onNavigate={onNavigate}
            />
          ) : (
            <a
              key={item.sectionId}
              href={`#${item.sectionId}`}
              className={item.sectionId === activeSectionId ? "is-active" : undefined}
              aria-current={item.sectionId === activeSectionId ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.sectionId);
              }}
            >
              <EditableText id={`footer.nav.${item.sectionId}`}>{item.label}</EditableText>
            </a>
          ),
        )}
      </nav>
    </footer>
  );
}
