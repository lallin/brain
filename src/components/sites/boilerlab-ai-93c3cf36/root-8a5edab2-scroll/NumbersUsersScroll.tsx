"use client";

import { Typewriter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/Typewriter";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";

const USERS_EYEBROW_TEXT = "1234";
const USERS_SUBTITLE_TEXT = "1234";
const USERS_WORLDWIDE_TEXT = "1234";

/**
 * "Company" users stat ("20M+ users worldwide") — a normal discrete stepped
 * section, split out of the former NumbersIntroUsersScroll crossfade. See
 * NumbersIntroScroll's own comment for why.
 */
export function NumbersUsersScroll({ active }: { active: boolean }) {
  return (
    <div className="slide-inner stars-slide">
      <div
        // Entrance / exit come from the Company flow (company-flow.ts), not
        // the one-shot company-fwd-in pop or the typewriter.
        className="stars-slide-inner hero-content numbers-stage"
      >
        {/* Moon: shared fixed `.numbers-orb` (see BoilerLabScrollApp). */}
        {/* Right text block — position + trail echo from the reference's
            `.block.right` ("Design® — 3D glass orb scroll site"). */}
        <div className="numbers-block numbers-block-right">
          {/* What the line below stands for (Company flow: fades with it). */}
          <EditableText id="numbers.users.label" as="p" className="numbers-label">
            Vision
          </EditableText>
          <Typewriter
            as="h2"
            text={USERS_EYEBROW_TEXT}
            active={active}
            editKey="numbers.users.eyebrow"
            className="eyebrow numbers-trail"
            animate={false}
          />
          <p className="subtitle numbers-trail-soft">
            <Typewriter
              as="span"
              text={USERS_SUBTITLE_TEXT}
              active={active}
              editKey="numbers.users.subtitle"
              animate={false}
            />{" "}
            <Typewriter
              as="span"
              text={USERS_WORLDWIDE_TEXT}
              active={active}
              editKey="numbers.users.worldwide"
              className="worldwide"
              animate={false}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
