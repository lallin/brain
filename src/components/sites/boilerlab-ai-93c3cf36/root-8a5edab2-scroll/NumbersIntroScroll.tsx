"use client";

import { Typewriter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/Typewriter";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";

const MISSION_TEXT = "1234";
const SIGNOFF_TEXT = "1234";

/**
 * "Company" mission statement — a normal discrete stepped section (one
 * wheel notch/scroll commits straight here, same as PartnersSlideScroll/
 * InPressSlide), not a continuous scrub.
 *
 * This and NumbersUsersScroll used to be ONE component sharing a single
 * pinned 200vh scroll range, crossfading between this text and the "20M+
 * users" text based on scroll position. Split back into two plain sections
 * per explicit request — that crossfade was the source of several real,
 * reported bugs a plain stepped section doesn't have: an invisible
 * overlapping sibling (opacity 0 still intercepts clicks) stealing clicks
 * meant for the visible text, a scroll resting mid-crossfade showing both
 * texts blended together indefinitely, and scrolling "reaching partway
 * then stopping" instead of committing straight through to the next
 * section.
 *
 * `active` (from BoilerLabScrollApp's `useInView(..., { once: true })`,
 * same pattern as partners'/in-press' own `.present` flag) drives both the
 * typewriter reveal and the one-shot `company-fwd-in` zoom-in — the
 * section committing into view **is** the "arrival" moment now, with no
 * scroll-progress math needed to decide when that happens.
 */
export function NumbersIntroScroll({ active }: { active: boolean }) {
  return (
    <div className="slide-inner stars-slide">
      <div
        // Entrance / exit come from the Company flow (company-flow.ts), not
        // the one-shot company-fwd-in pop or the typewriter.
        className="stars-slide-inner mission-content numbers-stage"
      >
        {/* The moon is one shared fixed orb now (BoilerLabScrollApp's
            `.numbers-orb`), gliding between the numbers sections. */}
        {/* Left text block — position + trail echo from the reference's
            `.block.left` ("Design® — 3D glass orb scroll site"). */}
        <div className="numbers-block numbers-block-left numbers-trail">
          <Typewriter text={MISSION_TEXT} active={active} editKey="numbers.intro.mission" animate={false} />
          {/* What the line below stands for (Company flow: fades with it). */}
          <EditableText id="numbers.intro.label" as="p" className="numbers-label">
            Core Value
          </EditableText>
          <Typewriter text={SIGNOFF_TEXT} active={active} editKey="numbers.intro.signoff" animate={false} />
        </div>
      </div>
    </div>
  );
}
