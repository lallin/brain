"use client";

import { useState } from "react";
import { DemoModal } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/DemoModal";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { DraggableBox } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/DraggableBox";

/** The Contacts slide's big "Demo" CTA — opens the same access-request
 * modal as the header's 데모 pill, instead of a mailto: link. */
export function ContactsDemoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* `pointerEvents: "auto"` override: this wrapper sits directly under
          `.contacts-content`, which is `pointer-events: none` by default —
          `.contacts-button` itself gets re-enabled via a compound selector
          keyed to `.arrived` (see boilerlab.css), but that rule targets the
          button element specifically, not this new intermediate wrapper, so
          without the explicit override the wrapper would never see its own
          hover (needed for DraggableBox's drag handle) even though the
          button inside it still clicks fine either way. */}
      <DraggableBox id="contacts.cta-box" style={{ display: "inline-block", pointerEvents: "auto" }}>
        <button type="button" className="button primary-button big contacts-button" onClick={() => setOpen(true)}>
          <EditableText id="contacts.cta" as="span">
            1234
          </EditableText>
          <span aria-hidden="true">→</span>
        </button>
      </DraggableBox>
      <DemoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
