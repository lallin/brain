"use client";

import { useEffect, useRef, useState } from "react";
import { cancelFrame, frame as frameLoop, useInView, type FrameData } from "framer-motion";
import { DeepSpace } from "./DeepSpace";
import { Moonlight } from "./Moonlight";
import { useLang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";

// Korean faces for the "Horizon" type (boilerlab-scroll.css), fetched only
// once KO is picked: Pretendard as a unicode-range subset, SUIT for titles.
const KOREAN_FONT_CSS = [
  "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
  "https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css",
];
import { SiteHeader } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SiteHeader";
import { SiteFooter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SiteFooter";
import { InPressSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/InPressSlide";
import { ContactsSlide } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/slides/ContactsSlide";
import { HeroSlideScroll } from "./HeroSlideScroll";
import { airScrubRange, NumbersAirSlideScroll } from "./NumbersAirSlideScroll";
import { NumbersIntroScroll } from "./NumbersIntroScroll";
import { NumbersUsersScroll } from "./NumbersUsersScroll";
import { PartnersSlideScroll } from "./PartnersSlideScroll";
import { ProductsFerrisScroll } from "./ProductsFerrisScroll";
import { SharedMoon } from "./SharedMoon";
import { companyFlowPlay } from "./company-flow";
import { subscribeFrameView, view } from "./frame-sync";

interface SectionMeta {
  id: string;
  sectionId: string;
  extraClass?: string;
}

// Products moved ahead of Partners so scroll order matches the footer nav
// order (SiteFooter.FOOTER_NAV_ITEMS lists Products before Partners too —
// see its comment).
const SECTIONS: SectionMeta[] = [
  { id: "mission", sectionId: "mission", extraClass: "hero-slide" },
  { id: "numbers-intro", sectionId: "numbers", extraClass: "mission-slide" },
  { id: "numbers-users", sectionId: "numbers", extraClass: "mission-slide" },
  { id: "numbers-air", sectionId: "numbers" },
  { id: "products", sectionId: "products", extraClass: "product-slide" },
  { id: "partners", sectionId: "partners" },
  { id: "in-press", sectionId: "in-press", extraClass: "in-press-slide" },
  { id: "contacts", sectionId: "contacts", extraClass: "contacts-slide" },
];

const CONTACTS_ARRIVE_MS = 2400;

// How much accumulated wheel deltaY commits to a step — deliberately well
// under one full mouse-wheel "click" (commonly ~100-120px, so this is
// roughly a "half flick"), matching how little of a scroll the original
// fixed deck needed to advance a slide.
const WHEEL_STEP_THRESHOLD = 40;
// A burst of wheel events counts as one gesture only within this gap;
// after it, accumulation restarts from zero.
const WHEEL_ACCUM_RESET_MS = 200;
// The hero ↔ Company move (#mission's whole 200vh, ~1,700px) is one wheel
// step, played over this long so the hero's slide-up and the moon's glide
// still read; Chrome's own smooth scroll ran it in ~0.7s.
const HERO_STEP_MS = 1200;
// One gesture = one step: after a step, wheel events keep counting as the
// same gesture (a trackpad's momentum tail, ~16ms apart) until they pause
// this long.
const WHEEL_GESTURE_GAP_MS = 100;
// A step locks the wheel until its scroll has landed and the Company flow's
// timeline has played out; this is only the fallback release in case a
// smooth scroll never quite reaches its target.
const STEP_LOCK_MAX_MS = 4000;
// …and a step counts as landed once the page has stopped moving this long.
const STEP_SETTLE_MS = 150;
// Sections that hold the wheel a while after a step lands on them, so a
// steady wheel doesn't run straight through: Excellence and Partner.
const STEP_DWELL_MS = 1200;
const DWELL_IDS = new Set(["partners", "in-press"]);

// Sections that scrub their own animation continuously on wheel/scroll
// input instead of being a single discrete step: #mission (its scroll-linked
// zoom+fade-out, see HeroSlideScroll), #products (its multi-viewport
// gallery, see ProductsSlideScroll), and #numbers-air (its GSAP
// ScrollTrigger pin+scrub "AIR" split, see NumbersAirSlideScroll). The
// wheel-stepper and the CSS mandatory scroll-snap (which would otherwise
// yank a resting scroll position inside any of them out to the nearest snap
// point — none has one of its own) both stay off for as long as one of these
// is the nearest section.
//
// #mission was briefly moved to the discrete-step group too (one wheel notch
// auto-scrolling the whole way, via the wheel-stepper's `scrollIntoView`) on
// the theory that a single smooth scroll would drive its scale/opacity
// through cleanly in one continuous motion. Verified directly it does not:
// sampling `scrollY`/opacity/scale every 100ms during that auto-scroll
// showed opacity correctly fading to ~0.92 partway through, then *jumping
// back to 1* while scale stayed maxed out — the zoom text visibly
// disappearing then reappearing. Moved back here; #numbers-intro/
// #numbers-users (no scroll-linked opacity/scale of their own — the
// crossfade they used to share was replaced by a `present`-triggered
// typewriter, not something scroll-position-driven) don't have this problem
// and stay plain discrete-step sections like #partners/#in-press.
//
// #mission is still free-scroll here (snap stays paused there), but the
// wheel handler now steps it as a whole: one wheel down goes to
// #numbers-intro over HERO_STEP_MS, one wheel up from #numbers-intro comes
// back (its own rAF scroll, not scrollIntoView). HeroSlideScroll reads
// getBoundingClientRect per scroll event now, so the old opacity jump above
// doesn't apply. #numbers-air likewise steps through its own stops (one
// per AIR letter).
const NO_WHEEL_STEP_IDS = new Set(["mission", "products", "numbers-air"]);

function mergeRefs<T extends HTMLElement>(...refs: Array<((el: T | null) => void) | undefined>) {
  return (el: T | null) => {
    for (const ref of refs) ref?.(el);
  };
}


/**
 * Scroll-native sibling of BoilerLabApp: same content/components, but laid
 * out as one normally-scrolling page instead of a fixed, wheel-captured
 * slide deck (see docs/research plan for why — the original deck has no
 * real document scroll for Framer Motion's useScroll to attach to).
 * Nothing here is imported back into BoilerLabApp/page.tsx.
 */
export function BoilerLabScrollApp() {
  const [loading, setLoading] = useState(true);
  const lang = useLang();

  useEffect(() => {
    if (lang !== "ko") return;
    for (const href of KOREAN_FONT_CSS) {
      if (document.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [lang]);

  // Every section's own DOM node, by `section.id` (the specific one, e.g.
  // "numbers-air" — not the grouped `sectionId` the footer nav/starfield
  // care about). Backs the wheel-stepper below, and `nearestSectionId()`,
  // which needs to know exactly which section is current and which is
  // next in `SECTIONS` order.
  const sectionElsRef = useRef(new Map<string, HTMLElement>());
  function registerSection(id: string) {
    return (el: HTMLElement | null) => {
      if (el) sectionElsRef.current.set(id, el);
      else sectionElsRef.current.delete(id);
    };
  }

  // Which section the viewport's top edge is actually inside right now —
  // finer-grained than `activeSectionId` (which groups all 3 "numbers"
  // sub-sections together, so it can't tell numbers-air apart from its
  // siblings on its own). The section whose own top has most recently
  // scrolled past the fixed header's bottom edge (the largest `rect.top`
  // at or above it) is the one we're inside — NOT simply whichever
  // section's top is nearest by absolute distance: a very tall section
  // (numbers-air, with its manually-reserved scrub spacer — see
  // NumbersAirSlideScroll.tsx) can have its own top hundreds of px *above*
  // the viewport while still visibly containing it, at which point the
  // NEXT section's not-yet-reached top (still below the viewport) can be
  // numerically closer to 0 and would otherwise "win" — verified directly
  // (Playwright) to misfire this way and prematurely flip `starsHidden`
  // (below) to "products" while still inside numbers-air's trailing
  // spacer. The threshold is the header's own height, not 0: every
  // section's resting/"current" top sits there (`scroll-margin-top`, so
  // `scrollIntoView`/snap land just below the fixed header), not at
  // exactly 0 — using 0 as the cutoff excluded every section from ever
  // qualifying and left `best` stuck at `SECTIONS[0]` forever, freezing
  // the wheel-stepper entirely (also verified directly).
  function nearestSectionId() {
    const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
    let best = SECTIONS[0]?.id ?? "";
    let bestTop = -Infinity;
    for (const s of SECTIONS) {
      const el = sectionElsRef.current.get(s.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= headerHeight + 1 && top > bestTop) {
        bestTop = top;
        best = s.id;
      }
    }
    return best;
  }

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 60);
    return () => clearTimeout(t);
  }, []);

  // This is a real, page-length document now (unlike the original fixed
  // deck, which always painted "mission" first no matter what), so the
  // browser's default scroll restoration kicks in on a plain reload/refresh
  // and reopens wherever you'd last scrolled to — e.g. landing on Products
  // instead of Mission. `history.scrollRestoration = "manual"` alone isn't
  // enough: it only takes effect on the *next* reload, and the restore for
  // *this* one keeps reasserting itself over several frames as fonts/images
  // finish loading and shift layout — a single `scrollTo(0, 0)` on mount
  // gets overwritten a moment later. Keep stomping it back to the top for
  // the first second, then leave real scrolling alone.
  //
  // Bails out the instant it sees a real user scroll input, rather than
  // blindly stomping for the full second regardless — unconditionally
  // fighting every scroll for a whole second after load was itself the
  // cause of a real bug: scrolling right after the page loaded (a wheel
  // flick, touch drag, or arrow/space/page-key press) got yanked straight
  // back to the top mid-gesture, visible as the hero text fading out then
  // snapping back to fully opaque before the guard's second elapsed and
  // the same scroll finally stuck.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const deadline = Date.now() + 1000; // wall-clock, not frame count — rAF
    // can be throttled well below display refresh rate (backgrounded tab,
    // low-power mode), which would otherwise stretch this out far longer
    // than intended and fight real scrolling long after the page loaded.
    let raf = 0;
    let stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", onKeyDown);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) stop();
    }
    function reset() {
      if (stopped) return;
      window.scrollTo(0, 0);
      if (Date.now() < deadline) raf = requestAnimationFrame(reset);
    }
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    reset();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Mandatory scroll-snap (see boilerlab-scroll.css) has to be suspended
  // while the user is anywhere inside one of NO_WHEEL_STEP_IDS's sections —
  // neither has a snap point of its own (each scrubs its own animation
  // continuously instead), so a scroll that settles there would otherwise
  // get yanked out to the nearest snap point on either side.
  //
  // This is also the ONE source of truth for "which section is active" —
  // there used to be a second, separate IntersectionObserver-based
  // `activeSectionId` (driving the footer nav and the starfield fade)
  // computed independently of this. Verified directly (Playwright) that
  // the two disagreed at section boundaries — e.g. the footer nav showing
  // "Company" active while the hero's own "Inspiring the Next" text was
  // still fully on screen, and separately the starfield's 0.52s fade-out
  // starting while still inside numbers-air's trailing spacer. Rather than
  // keep two independently-computed "current section" values in sync,
  // everything (footer nav, starfield, wheel-stepper, scroll-snap) now
  // reads this single precise, scroll-position-driven value.
  const [preciseSectionId, setPreciseSectionId] = useState("mission");
  useEffect(() => {
    let raf = 0;

    // The `snap-paused` toggle itself is split out from the rAF-throttled
    // React state update below and applied synchronously on every raw
    // `scroll` event instead. One rAF frame (~16ms) of lag used to be enough
    // for the browser's own mandatory-snap settling to fire first and yank
    // a scroll that had paused mid-fade in #mission (or any other
    // NO_WHEEL_STEP_IDS section) back toward its snap point, then get
    // reversed again once this caught up a frame later — visible as a
    // flicker (fade briefly reversing back to opaque, text sliding back
    // down) before settling. A plain classList toggle is cheap enough to do
    // on every tick with no throttling, closing that window instead of just
    // narrowing it.
    function updateSnapPaused() {
      document.documentElement.classList.toggle("snap-paused", NO_WHEEL_STEP_IDS.has(nearestSectionId()));
    }
    function update() {
      raf = 0;
      setPreciseSectionId(nearestSectionId());
    }
    function onScroll() {
      updateSnapPaused();
      if (!raf) raf = requestAnimationFrame(update);
    }
    updateSnapPaused();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("snap-paused");
    };
  }, []);

  // The footer nav only cares about the *grouped* id (e.g. all
  // 3 "numbers" sub-sections count as one "Company" tab).
  const activeGroupId = SECTIONS.find((s) => s.id === preciseSectionId)?.sectionId ?? SECTIONS[0].sectionId;

  const numbersIntroRef = useRef<HTMLElement | null>(null);
  const numbersIntroInView = useInView(numbersIntroRef, { once: true, amount: 0.5 });

  const numbersUsersRef = useRef<HTMLElement | null>(null);
  const numbersUsersInView = useInView(numbersUsersRef, { once: true, amount: 0.5 });

  const partnersRef = useRef<HTMLElement | null>(null);
  const partnersInView = useInView(partnersRef, { once: true, amount: 0.5 });

  const inPressRef = useRef<HTMLElement | null>(null);
  const inPressInView = useInView(inPressRef, { once: true, amount: 0.4 });

  const contactsRef = useRef<HTMLElement | null>(null);
  const contactsInView = useInView(contactsRef, { once: true, amount: 0.5 });
  const [contactsArriving, setContactsArriving] = useState(false);
  const [contactsArrived, setContactsArrived] = useState(false);

  // Same render-time-adjustment pattern: kick off "arriving" the moment
  // contactsInView first flips true (it never flips back, thanks to `once`).
  const [prevContactsInView, setPrevContactsInView] = useState(contactsInView);
  if (contactsInView !== prevContactsInView) {
    setPrevContactsInView(contactsInView);
    if (contactsInView) setContactsArriving(true);
  }

  // The actual external-timer subscription belongs in an effect.
  useEffect(() => {
    if (!contactsArriving) return;
    const t = setTimeout(() => {
      setContactsArriving(false);
      setContactsArrived(true);
    }, CONTACTS_ARRIVE_MS);
    return () => clearTimeout(t);
  }, [contactsArriving]);

  // One wheel/trackpad gesture advances exactly one section and stops
  // there, echoing the original fixed deck's one-input-per-slide feel
  // (CSS scroll-snap alone isn't enough for this: a single ordinary mouse-
  // wheel click's delta is usually far short of the ~50% of a section's
  // height a native snap needs to commit forward, so it would just spring
  // back — see WHEEL_STEP_THRESHOLD above). Left to NO_WHEEL_STEP_IDS's
  // sections entirely while one of them is nearest: each scrubs its own
  // continuous animation on wheel/scroll input instead.
  useEffect(() => {
    // The step's gesture is still going (see WHEEL_GESTURE_GAP_MS).
    let gestureHeld = false;
    let lastWheelAt = 0;
    let accum = 0;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    // Where the current step is heading (scrollY), null once it has landed.
    // Until then (and while the Company flow is still playing) every wheel is
    // swallowed: a step's animation always plays out before the next one.
    let targetY: number | null = null;
    let stepAt = 0;
    // Last time the page actually moved: a step has landed once scrolling has
    // stopped, even if snap settled it a few px off `targetY`.
    let movedAt = 0;
    // Hold after the current step lands (see STEP_DWELL_MS), and until when.
    let dwellMs = 0;
    let holdUntil = 0;
    const onScroll = () => {
      movedAt = performance.now();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    function snapTop(el: HTMLElement) {
      return Math.max(0, el.offsetTop - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0));
    }

    // Same "which section are we in" rule as `nearestSectionId` (a section
    // is current once its snap point is reached), but for any scroll
    // position — the step's target while one is moving.
    function indexAt(y: number) {
      let best = 0;
      SECTIONS.forEach((s, i) => {
        const el = sectionElsRef.current.get(s.id);
        if (el && snapTop(el) <= y + 2) best = i;
      });
      return best;
    }

    // #numbers-air's wheel stops (scrollY): its snap point, the scrub's
    // three equal thirds (A + text, I + text with R moving aside, R's text;
    // see NumbersAirSlideScroll), and #products. Null until the
    // scrub has measured itself.
    //
    // #products' snap point is read only while AIR is not pinned: while it
    // is, the pin's spacer pushes everything below a viewport further down,
    // and a fast wheel that read it then glided ~900px past Solutions.
    let productsSnap = Number.NaN;
    function airWheelStops() {
      const air = sectionElsRef.current.get("numbers-air");
      const products = sectionElsRef.current.get("products");
      const { start, end } = airScrubRange;
      if (!air || !products || !(end > start)) return null;
      const sy = window.scrollY;
      if (Number.isNaN(productsSnap) || sy < start || sy > end) productsSnap = snapTop(products);
      const third = (end - start) / 3;
      return [snapTop(air), start + third, start + 2 * third, end, productsSnap];
    }
    window.addEventListener("resize", resetProductsSnap);
    function resetProductsSnap() {
      productsSnap = Number.NaN;
    }

    // Scroll animation for the hero ↔ Company step (see HERO_STEP_MS).
    let anim = 0;
    function cancelAnim() {
      cancelAnimationFrame(anim);
      anim = 0;
    }
    function animateScrollTo(target: number, ms: number) {
      cancelAnim();
      const from = window.scrollY;
      const t0 = performance.now();
      const tick = (now: number) => {
        const u = Math.min(1, (now - t0) / ms);
        const k = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
        window.scrollTo({ top: from + (target - from) * k, behavior: "instant" });
        anim = u < 1 ? requestAnimationFrame(tick) : 0;
      };
      anim = requestAnimationFrame(tick);
    }

    /** One step: a smooth scroll (or, with `ms`, the hero's own glide) to `y`. */
    function stepTo(y: number, ms?: number, dwell = 0) {
      dwellMs = dwell;
      y = Math.min(y, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
      targetY = y;
      stepAt = performance.now();
      if (ms) {
        animateScrollTo(y, ms);
      } else {
        cancelAnim();
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }

    function onWheel(e: WheelEvent) {
      // Any wheel event while the Demo modal is open must reach that
      // modal's own independently-scrollable form — this page-wide stepper
      // previously swallowed every wheel tick unconditionally (preventDefault
      // below), including ones aimed at the modal sitting on top of it, so
      // the modal's content looked "cut off" with no way to scroll down to
      // the rest of the form. Checked by the modal's mere presence in the
      // DOM, not by walking up from e.target: the modal portals to
      // document.body as a sibling of this whole page, and a WebGL canvas
      // elsewhere on the page can end up as the wheel event's target even
      // while the modal is visually on top, which a target-ancestry check
      // alone would miss.
      // Same for the notice curtain (NoticeCurtain.tsx): its own listener
      // folds it on this wheel, and the page mustn't step behind it.
      if (document.querySelector(".demo-modal-overlay, .npc:not([hidden])")) return;
      const now = performance.now();
      const gap = now - lastWheelAt;
      lastWheelAt = now;
      const settled = now - stepAt > STEP_SETTLE_MS && now - movedAt > STEP_SETTLE_MS;
      if (targetY !== null && !anim && (Math.abs(window.scrollY - targetY) <= 2 || settled || now - stepAt > STEP_LOCK_MAX_MS)) {
        targetY = null;
        holdUntil = Math.max(movedAt, stepAt) + dwellMs;
      }
      // Locked while a step is still moving or the Company flow's text is
      // still playing (T2 playing out before AIR included).
      if (targetY !== null || now < holdUntil || companyFlowPlay.busy) {
        e.preventDefault();
        accum = 0;
        return;
      }
      const y = window.scrollY;
      const idx = indexAt(y);
      const id = SECTIONS[idx].id;
      // #numbers-air is free-scroll but has wheel stops of its own (one per
      // AIR letter, see airWheelStops).
      // Also from #products' very top going up (its first step back is R).
      const products = sectionElsRef.current.get("products");
      const atProductsTop = id === "products" && e.deltaY < 0 && products !== undefined && y <= snapTop(products) + 2;
      const stops = id === "numbers-air" || atProductsTop ? airWheelStops() : null;
      // #mission going down: one wheel anywhere in the hero goes all the way
      // to #numbers-intro (T1), instead of free-scrolling its 200vh.
      const intro = sectionElsRef.current.get("numbers-intro");
      const heroDown = id === "mission" && e.deltaY > 0 && intro !== undefined && y < snapTop(intro) - 2;
      if (NO_WHEEL_STEP_IDS.has(id) && !stops && !heroDown) {
        // Free-scrolling down off #products' end into #partners (Excellence):
        // land on it as a step, so it holds there like every other section
        // instead of the next notch running straight on to #in-press.
        const next = SECTIONS[idx + 1];
        const nextEl = id === "products" && e.deltaY > 0 && next ? sectionElsRef.current.get(next.id) : undefined;
        if (nextEl && y + e.deltaY >= snapTop(nextEl) - 2) {
          e.preventDefault();
          accum = 0;
          gestureHeld = true;
          stepTo(snapTop(nextEl), undefined, DWELL_IDS.has(next.id) ? STEP_DWELL_MS : 0);
        }
        return;
      }
      // Block the browser's own native scroll on every tick in this
      // section, not just once the threshold below is crossed — letting
      // even a little native scroll through while accumulating was landing
      // the page halfway into the next section (its own tiny scroll) right
      // before the smooth scroll fired on top of it, i.e. exactly the
      // "stops halfway" stutter this handler exists to avoid.
      e.preventDefault();
      if (gestureHeld && gap < WHEEL_GESTURE_GAP_MS) return;
      gestureHeld = false;
      accum += e.deltaY;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        accum = 0;
      }, WHEEL_ACCUM_RESET_MS);
      if (Math.abs(accum) < WHEEL_STEP_THRESHOLD) return;
      const dir = accum > 0 ? 1 : -1;
      accum = 0;
      gestureHeld = true;
      // Hero ↔ Company, both ways: one wheel, played over HERO_STEP_MS.
      const heroUp = id === "numbers-intro" && dir < 0;
      if ((heroDown && dir > 0 && intro) || heroUp) {
        stepTo(heroUp ? 0 : snapTop(intro!), HERO_STEP_MS);
        return;
      }
      if (stops) {
        const target = dir > 0 ? stops.find((s) => s > y + 2) : [...stops].reverse().find((s) => s < y - 2);
        if (target !== undefined) {
          stepTo(target);
          return;
        }
        // Past the last stop: the normal step (AIR's top going up → #numbers-users).
      }
      const next = SECTIONS[idx + dir];
      const el = next && sectionElsRef.current.get(next.id);
      if (!el) return;
      if (id === "numbers-users" && dir > 0 && companyFlowPlay.parked === 2) {
        // Company → AIR with T2 fully open: one wheel plays T2 out first and
        // then scrolls, so AIR never shows under the leaving text.
        companyFlowPlay.leave = { go: () => stepTo(snapTop(el)), fired: false };
      } else {
        stepTo(snapTop(el), undefined, DWELL_IDS.has(next.id) ? STEP_DWELL_MS : 0);
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", resetProductsSnap);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(resetTimer);
      cancelAnim();
    };
  }, []);

  // Space also steps to the next of the 8 sections, same one-input-per-step
  // feel as the wheel-stepper above. Guarded the same way as the fixed
  // deck's own Space handler (BoilerLabApp.tsx) so typing a space mid-edit
  // or activating a button doesn't also scroll the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "BUTTON" ||
        target?.tagName === "A";
      if (isEditable) return;
      const idx = SECTIONS.findIndex((s) => s.id === preciseSectionId);
      // Same restriction as the wheel-stepper above, for the same verified
      // reason (see NO_WHEEL_STEP_IDS's own comment): a programmatic jump
      // through mission/products/numbers-air's own scrubbed animation is a
      // confirmed bug (opacity/scale snapping back mid-transition), not
      // just an untested guess — so space falls through to the browser's
      // own default scroll there instead of jumping.
      if (NO_WHEEL_STEP_IDS.has(SECTIONS[idx]?.id)) return;
      e.preventDefault();
      const next = SECTIONS[idx + 1];
      const el = next && sectionElsRef.current.get(next.id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preciseSectionId]);

  // Continuous, scroll-progress-driven crossfade between the plain slide
  // sections — the ones that currently just hard-cut in/out with nothing
  // but their own one-shot entrance (`present`/`useInView`) and no exit
  // treatment at all. Deliberately scoped to ONLY these five ids, not every
  // section: "mission"/"products"/"numbers-air" already have their own
  // carefully-tuned, independently scroll-linked treatment (HeroSlideScroll's
  // pin+fade+shrink, and the two GSAP-scrubbed sections) — piling this same
  // transform on top of an already-pinned/scrubbed section risks fighting
  // its own positioning (a `position: sticky` element's stickiness is
  // computed from its pre-transform box, so an added translateY there can
  // visibly detach it from its own pin), which is exactly the kind of
  // regression explicitly ruled out here. This is purely additive/isolated:
  // it only ever touches these five elements' own `opacity`/`transform`.
  //
  // Modeled directly on the reference file's own `stageUI` ("Design® — 3D
  // glass orb scroll site.html") — a single,
  // continuously (rAF-)recomputed scroll progress `p` (lerped toward the
  // raw scroll position for a speed-matched feel, not a discrete per-scroll-
  // event snapshot), each tracked section given its own "center" breakpoint
  // in that same 0–1 range (computed from its real layout position, not
  // hand-picked like the reference's `K`/`s.c` — this page's section sizes
  // vary too much for one fixed set of breakpoints to fit all of them), and
  // opacity/translateY falling off with distance from that breakpoint. A
  // near-zero opacity also gets `visibility: hidden` — the reference does
  // this too, and for the same confirmed reason this codebase already hit
  // once before (see NumbersIntroScroll's own history comment): an
  // opacity-only "invisible" sibling still intercepts clicks meant for
  // whatever's actually showing.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Captured once — same Map instance for the component's whole lifetime
    // (registerSection mutates it in place, never replaces it), so reading
    // through this local both in `frame` and in cleanup is equivalent to
    // `sectionElsRef.current` but doesn't trip the "ref value may have
    // changed by cleanup time" lint rule, which can't know that.
    const sectionEls = sectionElsRef.current;
    // numbers-intro / numbers-users are driven by the Company flow
    // (company-flow.ts, run from SharedMoon) instead.
    const ids = ["partners", "in-press", "contacts"];
    let target = 0;
    let p = 0;
    let prevP = 0;
    let last = performance.now();

    // Layout is measured only when it changes (offsetTop/offsetHeight aren't
    // affected by the transforms written below), never per frame: reading it
    // right after writing another section's style forced a style recalc for
    // every section on every frame.
    let max = 0;
    let layout: { el: HTMLElement; top: number; height: number; trails: HTMLElement[] }[] = [];
    function measure() {
      max = document.documentElement.scrollHeight - window.innerHeight;
      layout = ids.flatMap((id) => {
        const el = sectionEls.get(id);
        // `--t` goes straight onto the elements that draw the trail (only
        // the numbers sections have any): set on the section, the inherited
        // custom property restyled its whole subtree every frame.
        const trails = el ? [...el.querySelectorAll<HTMLElement>(".numbers-trail, .numbers-trail-soft")] : [];
        return el ? [{ el, top: el.offsetTop, height: el.offsetHeight, trails }] : [];
      });
    }
    function readScroll() {
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }
    // Last written values per element, so a settled page writes nothing.
    const written = new Map<HTMLElement, string>();

    // On framer-motion's frame loop (update step), after every loop's reads;
    // scroll comes from the per-frame snapshot (frame-sync.ts).
    function frame({ timestamp: now }: FrameData) {
      target = max > 0 ? Math.min(1, Math.max(0, view.scrollY / max)) : 0;
      // Capped high enough that a throttled/low-fps frame still catches up
      // instead of crawling (a 0.05 cap made 2fps take ~10s to settle).
      const dt = Math.min(0.25, (now - last) / 1000 || 0.016);
      last = now;
      // Same smoothing rate as the reference's frame loop.
      p += (target - p) * (1 - Math.exp(-dt * 5));
      const vel = (p - prevP) / Math.max(dt, 0.001);
      prevP = p;

      for (const { el, top, height, trails } of layout) {
        if (max <= 0) continue;
        const centerY = top + height / 2 - view.innerHeight / 2;
        const c = Math.min(1, Math.max(0, centerY / max));
        const d = p - c;
        const ad = Math.abs(d);
        // The reference's stages sit 0.2 apart on its progress axis, with
        // `o = 1 - (ad - 0.03) / 0.065` (a 0.03 fully-visible plateau, then
        // a 0.065 falloff) and `ty = -d * 720`. Here the spacing between
        // sections is one section's own height in progress units (`span`),
        // so the same curve is kept by expressing those constants as
        // fractions of the reference's 0.2 spacing: plateau 0.15, falloff
        // 0.325, and 144px of travel per full span (720 × 0.2).
        const span = height / max;
        const plateau = span * 0.15;
        const falloff = span * 0.325;
        const linear = Math.min(1, Math.max(0, 1 - (ad - plateau) / falloff));
        const opacity = linear * linear * (3 - 2 * linear); // smoothstep, as the reference
        // Past (d > 0) drifts up, upcoming (d < 0) rises from below. The
        // reference's "end" stage (no exit) needs no special case here:
        // #contacts is the last section, so its center is progress 1 and
        // `d` can never go positive for it.
        // Clamped to the fade range (±0.475 span): the reference leaves it
        // unbounded because its stages are `position: fixed`, but these are
        // in-flow sections, and an off-screen one translated thousands of px
        // extends the document's scrollable overflow — feeding back into
        // `max` (and so every section's `c`) above.
        const reach = (plateau + falloff) / span;
        const ty = -Math.max(-reach, Math.min(reach, d / span)) * 144;
        // Depth (stage 4): an upcoming section starts a little small, as if
        // still far out in space, and grows to full size as it arrives; a
        // past one swells slightly as it drifts by the camera. Same clamped
        // range as the fade, so a centred section is exactly scale 1.
        const u = Math.max(-1, Math.min(1, d / span / reach));
        const scale = u < 0 ? 1 + u * 0.06 : 1 + u * 0.03;
        // The reference's stretched "echo" trail (`--t`, read by
        // `.numbers-trail` text-shadows): grows with distance from center
        // and with scroll speed — both rescaled from its 0.2 stage spacing.
        const adRef = (ad / span) * 0.2;
        const velRef = (vel / span) * 0.2;
        const trail = Math.min(26, Math.max(0, (adRef - 0.015) * 380)) + Math.min(10, Math.abs(velRef) * 22);
        const o = opacity.toFixed(3);
        const tf = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        const t = trails.length ? trail.toFixed(1) : "";
        const key = `${o}|${tf}|${t}`;
        if (written.get(el) === key) continue;
        written.set(el, key);
        el.style.opacity = o;
        el.style.transform = tf;
        el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
        for (const tr of trails) tr.style.setProperty("--t", t);
      }
    }

    function onResize() {
      measure();
      readScroll();
    }
    measure();
    readScroll();
    p = target;
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener("resize", onResize);
    const unsubscribe = subscribeFrameView();
    frameLoop.update(frame, true);
    return () => {
      cancelFrame(frame);
      unsubscribe();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      for (const id of ids) {
        const el = sectionEls.get(id);
        if (!el) continue;
        el.style.opacity = "";
        el.style.transform = "";
        el.querySelectorAll<HTMLElement>(".numbers-trail, .numbers-trail-soft").forEach((tr) => tr.style.removeProperty("--t"));
        el.style.visibility = "";
      }
    };
  }, []);

  function handleFooterNavigate(sectionId: string) {
    const target = SECTIONS.find((s) => s.sectionId === sectionId);
    if (!target) return;
    document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="boilerlab-root scroll-mode" data-loading={loading ? "" : undefined}>
      {/* Deep-space backdrop, visible through every section (DeepSpace). */}
      <DeepSpace />
      {/* Moonlight on the Excellence / Partner card edges. */}
      <Moonlight />
      {/* One moon for hero → numbers, scroll-scrubbed (see SharedMoon). */}
      <SharedMoon contactsArriving={contactsArriving} />
      <SiteHeader onNavigate={handleFooterNavigate} />
      <div className="reveal">
        <div className="slides">
          {SECTIONS.map((section) => {
            const className = ["slide", section.extraClass].filter(Boolean).join(" ");
            const commonProps = {
              id: section.id,
              "data-section-id": section.sectionId,
              className,
            };

            if (section.id === "mission") {
              return (
                <section key={section.id} {...commonProps} ref={registerSection(section.id)}>
                  <HeroSlideScroll />
                </section>
              );
            }
            if (section.id === "numbers-intro") {
              return (
                <section
                  key={section.id}
                  {...commonProps}
                  className={`${className}${numbersIntroInView ? " present" : ""}`}
                  ref={mergeRefs(registerSection(section.id), (el) => (numbersIntroRef.current = el))}
                >
                  <NumbersIntroScroll active={numbersIntroInView} />
                </section>
              );
            }
            if (section.id === "numbers-users") {
              return (
                <section
                  key={section.id}
                  {...commonProps}
                  className={`${className}${numbersUsersInView ? " present" : ""}`}
                  ref={mergeRefs(registerSection(section.id), (el) => (numbersUsersRef.current = el))}
                >
                  <NumbersUsersScroll active={numbersUsersInView} />
                </section>
              );
            }
            if (section.id === "numbers-air") {
              return (
                <section key={section.id} {...commonProps} ref={registerSection(section.id)}>
                  <NumbersAirSlideScroll />
                </section>
              );
            }
            if (section.id === "partners") {
              return (
                <section
                  key={section.id}
                  {...commonProps}
                  className={`${className}${partnersInView ? " present partners-open" : ""}`}
                  ref={mergeRefs(registerSection(section.id), (el) => (partnersRef.current = el))}
                >
                  <PartnersSlideScroll />
                </section>
              );
            }
            if (section.id === "products") {
              return (
                <section key={section.id} {...commonProps} ref={registerSection(section.id)}>
                  <ProductsFerrisScroll />
                </section>
              );
            }
            if (section.id === "in-press") {
              return (
                <section
                  key={section.id}
                  {...commonProps}
                  className={`${className}${inPressInView ? " present" : ""}`}
                  ref={mergeRefs(registerSection(section.id), (el) => (inPressRef.current = el))}
                >
                  <InPressSlide />
                </section>
              );
            }
            // contacts
            return (
              <section
                key={section.id}
                {...commonProps}
                className={`${className}${contactsArriving ? " contacts-arriving" : ""}`}
                ref={mergeRefs(registerSection(section.id), (el) => (contactsRef.current = el))}
              >
                <ContactsSlide arriving={contactsArriving} arrived={contactsArrived} renderMoon={false} />
              </section>
            );
          })}
        </div>
      </div>
      <SiteFooter activeSectionId={activeGroupId} onNavigate={handleFooterNavigate} />
    </div>
  );
}
