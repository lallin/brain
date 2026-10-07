"use client";

import { useEffect, useRef, useState } from "react";
import { Typewriter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/Typewriter";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";

const MISSION_TEXT = "1234";
const SIGNOFF_TEXT = "1234";

/** Slide 1 of 3 in the "numbers" topic group — typewriter mission statement. */
export function NumbersIntroSlide({ present }: { present: boolean }) {
  return (
    <div className="slide-inner stars-slide">
      <div className="stars-slide-inner mission-content">
        <Typewriter text={MISSION_TEXT} active={present} editKey="numbers.intro.mission" />
        <Typewriter text={SIGNOFF_TEXT} active={present} editKey="numbers.intro.signoff" />
      </div>
    </div>
  );
}

/** Slide 2 of 3 — "20+ million users of our products worldwide". */
export function NumbersUsersSlide() {
  return (
    <div className="slide-inner stars-slide">
      <div className="stars-slide-inner hero-content">
        <EditableText id="numbers.users.eyebrow" as="h2" className="eyebrow">
          1234
        </EditableText>
        <p className="subtitle">
          <EditableText id="numbers.users.subtitle" as="span">
            1234
          </EditableText>{" "}
          <EditableText id="numbers.users.worldwide" as="span" className="worldwide">
            1234
          </EditableText>
        </p>
      </div>
    </div>
  );
}

interface AirValue {
  letter: "A" | "I" | "R";
  name: string;
  description: string;
}

// Braindeck's core values (about_page.values in the site's own
// locales/ko/translation.json), translated to English to match the rest of
// this deck's copy.
const AIR_VALUES: AirValue[] = [
  {
    letter: "A",
    name: "Authenticity",
    description:
      "Genuine and unembellished — we communicate with a trustworthy, consistent attitude and put the values we stand for into practice.",
  },
  {
    letter: "I",
    name: "Initiative",
    description: "We find and solve problems ourselves, driving new attempts and creating positive momentum.",
  },
  {
    letter: "R",
    name: "Respect",
    description:
      "We respect colleagues, customers, and partners alike, embracing diversity and building a collaborative culture on trust and care.",
  },
];

const AIR_STEP_LOCK_MS = 550; // matches the products box-slide's own step lock (ProductsSlide.tsx)

interface NumbersAirSlideProps {
  present?: boolean;
  /**
   * Enables the classic deck's own wheel-jacked "reveal one value per
   * scroll" interaction (sketch supplied by the user): starts on just the
   * "AIR" title, then each wheel step reveals the next value card in order
   * and marks that letter "active" in the title, while previously revealed
   * cards stay visible. Mirrors ProductsSlide's own discrete
   * step-per-wheel model (own wheel listener while `present`,
   * preventDefault+lock while stepping, bubble to the deck-level handler
   * once fully revealed/at the start) rather than a continuous drag.
   *
   * The scroll-native page has no wheel capture anywhere else on it
   * (everything there is normal document scroll), so it leaves this off
   * and simply shows every card at once, same as before this feature.
   */
  wheelReveal?: boolean;
}

/** Slide 3 of 3 — Braindeck's "AIR" core values (Authenticity / Initiative / Respect). */
export function NumbersAirSlide({ present = false, wheelReveal = false }: NumbersAirSlideProps) {
  const [revealed, setRevealed] = useState(wheelReveal ? 0 : AIR_VALUES.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef(revealed);
  const lockRef = useRef(false);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    if (!wheelReveal || !present) return;
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      const dir = e.deltaY > 0 ? 1 : -1;
      const max = AIR_VALUES.length;
      const atStartGoingBack = dir < 0 && revealedRef.current <= 0;
      const atEndGoingForward = dir > 0 && revealedRef.current >= max;
      if (atStartGoingBack || atEndGoingForward) return; // bubble to deck-level nav
      if (Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      e.stopPropagation();
      if (lockRef.current) return;
      const next = Math.max(0, Math.min(max, revealedRef.current + dir));
      if (next === revealedRef.current) return;
      lockRef.current = true;
      revealedRef.current = next;
      setRevealed(next);
      setTimeout(() => {
        lockRef.current = false;
      }, AIR_STEP_LOCK_MS);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [present, wheelReveal]);

  return (
    <div className="slide-inner stars-slide">
      <div className="stars-slide-inner hero-content air-content" ref={containerRef}>
        {wheelReveal ? (
          <h2 className="eyebrow air-eyebrow" aria-label="AIR">
            {AIR_VALUES.map((value, i) => (
              <span key={value.letter} className={i < revealed ? "air-letter is-active" : "air-letter"}>
                {value.letter}
              </span>
            ))}
          </h2>
        ) : (
          <EditableText id="air.eyebrow" as="h2" className="eyebrow">
            AIR
          </EditableText>
        )}
        <EditableText id="air.intro" as="p" className="subtitle">
          The core values Braindeck believes in
        </EditableText>
        <div className="air-values">
          {AIR_VALUES.map((value, i) => (
            // Two elements per card, same split as .in-press-card/-surface:
            // the outer carries the staggered entrance (position/opacity),
            // the inner carries the idle float + hover (background/
            // transform) — one element can't own two animations that both
            // drive `transform` without one silently overriding the other.
            <div
              className={`air-value-card${i < revealed ? " is-revealed" : ""}`}
              key={value.letter}
              style={{ "--air-index": i } as React.CSSProperties}
            >
              <div className="air-value-surface">
                <span className="air-value-letter" aria-hidden="true">
                  {value.letter}
                </span>
                <EditableText id={`air.${value.letter}.name`} as="h3" className="air-value-name">
                  {value.name}
                </EditableText>
                <EditableText id={`air.${value.letter}.description`} as="p" className="air-value-description">
                  {value.description}
                </EditableText>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
