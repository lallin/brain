"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StarCanvas } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/StarCanvas";
import { SiteHeader } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SiteHeader";
import { SiteFooter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SiteFooter";
import { HeroSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/HeroSlide";
import {
  NumbersAirSlide,
  NumbersIntroSlide,
  NumbersUsersSlide,
} from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/NumbersSlides";
import { PartnersSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/PartnersSlide";
import { ProductsSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/ProductsSlide";
import { InPressSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/InPressSlide";
import { ContactsSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/ContactsSlide";
import { STAR_TRANSITION_ENABLED } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/starTransition";

interface SlideMeta {
  id: string;
  sectionId: string;
  extraClass?: string;
}

const SLIDES: SlideMeta[] = [
  { id: "mission", sectionId: "mission", extraClass: "hero-slide" },
  { id: "numbers-intro", sectionId: "numbers", extraClass: "mission-slide" },
  { id: "numbers-users", sectionId: "numbers" },
  { id: "numbers-air", sectionId: "numbers" },
  { id: "products", sectionId: "products", extraClass: "product-slide" },
  { id: "partners", sectionId: "partners" },
  { id: "in-press", sectionId: "in-press", extraClass: "in-press-slide" },
  { id: "contacts", sectionId: "contacts", extraClass: "contacts-slide" },
];

const CONTACTS_ARRIVE_MS = 2400;

/**
 * Slide-deck engine for the boilerlab.ai clone.
 *
 * DEVIATION NOTE: the live site uses reveal.js-shaped DOM/class conventions
 * (.reveal/.slides/.progress/navigate-left-right etc.) but its actual slide
 * *transitions* are bespoke (custom classes like slide-in-fwd-center with no
 * matching CSS keyframes — driven by its own JS). Because this deck is
 * strictly linear (8 slides, one axis, no fragments/vertical stacks) and the
 * products slide needs tight coordination between its own internal wheel
 * handling and the deck-level wheel handling, wrapping the real reveal.js
 * runtime around React state turned out to be more fragile than beneficial
 * here. This component reimplements the equivalent user-facing navigation
 * (keyboard, wheel, footer-nav clicks, progress-free) directly in React,
 * driven by the same custom transition CSS extracted from the site.
 */
export function BoilerLabApp() {
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState<{ exiting: number | null; enterClass: string; exitClass: string }>({
    exiting: null,
    enterClass: "",
    exitClass: "",
  });
  const [partnersState, setPartnersState] = useState<"closed" | "open" | "leaving" | "settle">("closed");
  const [contactsArriving, setContactsArriving] = useState(false);
  const [contactsArrived, setContactsArrived] = useState(false);
  const [loading, setLoading] = useState(true);
  // Increment on every slide navigation to pulse a brief "warp burst" in the
  // starfield (see StarCanvas's boostTrigger) — ties the hyperspace motion
  // graphic to scrolling/navigating, not just a constant idle drift.
  const [starBoost, setStarBoost] = useState(0);

  const indexRef = useRef(0);
  const wheelLockRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 60);
    return () => clearTimeout(t);
  }, []);

  const navigate = useCallback((nextIndex: number, trigger: "nav" | "step" = "step") => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, nextIndex));
    if (clamped === indexRef.current) return;
    const prevIndex = indexRef.current;
    const prev = SLIDES[prevIndex];
    const next = SLIDES[clamped];

    // Re-verified against the live site with instrumented timing (real click()
    // vs synthetic ArrowRight/wheel events, sampling computed opacity every
    // ~20ms across the whole transition in one page-side loop to avoid
    // cross-tool-call latency): footer-nav clicks consistently complete in
    // ~0.68-0.7s (matches --transition-wheel), while BOTH keyboard arrows and
    // mouse wheel consistently take ~1.15-1.2s (matches --transition-horizontal)
    // regardless of whether the hop stays within a topic (e.g. the "numbers"
    // trio) or crosses topics — there was no measurable distinct "vertical"
    // duration for same-topic steps, so the earlier same-topic slide-in-down/up
    // special case has been dropped in favor of this trigger-based split.
    // products -> partners (their adjacency in SLIDES, matching the footer
    // nav order) keeps its own documented slide-in-fade-after timing
    // regardless of trigger, since that's a named rule tied to that exact pair.
    let enterClass: string;
    let exitClass: string;
    let duration: number;
    if (prev.sectionId === "products" && next.sectionId === "partners") {
      enterClass = "slide-enter-fade-after";
      exitClass = "slide-exit-fade";
      duration = 1250; // 0.68s delay + 0.54s fade
    } else if (prev.sectionId === "numbers" && next.sectionId === "products") {
      // Requested explicitly: scrolling past AIR should read as AIR rising
      // up and out while Products/Solution rises up into view from below
      // (not a fade) — uses the site's own real slide-in-bottom/slide-out-top
      // keyframes rather than the JS-only slide-in/out-fwd-center this pair
      // would otherwise fall into.
      enterClass = "slide-enter-down";
      exitClass = "slide-exit-up";
      duration = 1300; // 0.12s enter delay + 1.18s vertical-move
    } else if (prev.sectionId === "products" && next.sectionId === "numbers") {
      // Reverse of the above, so scrolling back up doesn't feel asymmetric.
      enterClass = "slide-enter-up";
      exitClass = "slide-exit-down";
      duration = 1300;
    } else if (trigger === "nav") {
      enterClass = "slide-enter-fade";
      exitClass = "slide-exit-fade";
      duration = 700;
    } else {
      enterClass = "slide-enter-fwd";
      exitClass = "slide-exit-fwd";
      duration = 1200;
    }

    if (!STAR_TRANSITION_ENABLED) {
      enterClass = "";
      exitClass = "";
      duration = 0;
    }

    // Partners expand/collapse state
    if (next.sectionId === "partners") setPartnersState("open");
    else if (prev.sectionId === "partners") setPartnersState("leaving");

    // Contacts arrival (first time only)
    if (next.sectionId === "contacts" && !contactsArrived) {
      setContactsArriving(true);
      setTimeout(() => {
        setContactsArriving(false);
        setContactsArrived(true);
      }, CONTACTS_ARRIVE_MS);
    }

    setTransition({ exiting: prevIndex, enterClass, exitClass });
    if (STAR_TRANSITION_ENABLED) setStarBoost((n) => n + 1);
    indexRef.current = clamped;
    setIndex(clamped);

    setTimeout(() => {
      setTransition({ exiting: null, enterClass: "", exitClass: "" });
      if (prev.sectionId === "partners" && next.sectionId !== "partners") {
        setPartnersState((s) => (s === "leaving" ? "closed" : s));
      }
    }, duration);
  }, [contactsArrived]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") navigate(indexRef.current + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") navigate(indexRef.current - 1);
      else if (e.key === "Home") navigate(0);
      else if (e.key === "End") navigate(SLIDES.length - 1);
      else if (e.key === " ") {
        // Space also steps to the next of the 8 slides — but only when
        // nothing that actually wants a literal space (an editable-text
        // field, a button/link's native Space-to-activate) has focus, so
        // typing a space mid-edit or activating "Demo" doesn't also jump
        // the deck.
        const target = e.target as HTMLElement | null;
        const isEditable =
          target?.isContentEditable ||
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.tagName === "BUTTON" ||
          target?.tagName === "A";
        if (isEditable) return;
        e.preventDefault();
        navigate(indexRef.current + 1);
      }
    }
    function onWheel(e: WheelEvent) {
      // Don't advance the deck out from under an open overlay (the Demo
      // modal's own scrollable form) just because the user is scrolling
      // inside it. Checked by the modal's presence in the DOM rather than
      // e.target's ancestry — see BoilerLabScrollApp's own onWheel for why.
      if (document.querySelector(".demo-modal-overlay")) return;
      if (wheelLockRef.current) return;
      if (Math.abs(e.deltaY) < 12) return;
      wheelLockRef.current = true;
      navigate(indexRef.current + (e.deltaY > 0 ? 1 : -1));
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 900);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [navigate]);

  const handleFooterNavigate = useCallback(
    (sectionId: string) => {
      const targetIndex = SLIDES.findIndex((s) => s.sectionId === sectionId);
      if (targetIndex >= 0) navigate(targetIndex, "nav");
    },
    [navigate],
  );

  const activeSectionId = SLIDES[index].sectionId;
  const starsHidden = activeSectionId === "products";

  return (
    <div className="boilerlab-root" data-loading={loading ? "" : undefined}>
      <StarCanvas hidden={starsHidden} boostTrigger={starBoost} />
      <SiteHeader onNavigate={handleFooterNavigate} />
      <div className="reveal">
        <div className="slides">
          {SLIDES.map((slide, i) => {
            const isPresent = i === index;
            const isExiting = transition.exiting === i;
            if (!isPresent && !isExiting) return null;
            const animClass = isPresent ? transition.enterClass : transition.exitClass;
            // `#partners.partners-open`/`.partners-leaving` in boilerlab.css target
            // this <section> directly, so the state class is computed here rather
            // than inside PartnersSlide.
            const partnersSectionClass =
              slide.id === "partners"
                ? partnersState === "open"
                  ? "partners-open"
                  : partnersState === "leaving"
                    ? "partners-leaving"
                    : partnersState === "settle"
                      ? "partners-open partners-settle"
                      : ""
                : "";
            const stateClass = [
              "slide",
              slide.extraClass,
              isPresent ? "present" : isExiting ? "past-exiting" : "",
              animClass,
              partnersSectionClass,
              slide.sectionId === "contacts" && contactsArriving ? "contacts-arriving" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <section
                key={slide.id}
                id={slide.id}
                data-section-id={slide.sectionId}
                className={stateClass}
                style={{ display: "block", zIndex: isPresent ? 13 : 12 }}
              >
                {slide.id === "mission" && <HeroSlide />}
                {slide.id === "numbers-intro" && <NumbersIntroSlide present={isPresent} />}
                {slide.id === "numbers-users" && <NumbersUsersSlide />}
                {slide.id === "numbers-air" && <NumbersAirSlide present={isPresent} wheelReveal />}
                {slide.id === "partners" && <PartnersSlide />}
                {slide.id === "products" && <ProductsSlide present={isPresent} />}
                {slide.id === "in-press" && <InPressSlide />}
                {slide.id === "contacts" && (
                  <ContactsSlide arriving={contactsArriving} arrived={contactsArrived} />
                )}
              </section>
            );
          })}
        </div>
      </div>
      <SiteFooter activeSectionId={activeSectionId} onNavigate={handleFooterNavigate} />
    </div>
  );
}
