import { useLayoutEffect, useRef } from "react";
import { Typewriter } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/Typewriter";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { ContactsDemoButton } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ContactsDemoButton";
import ContactsMoon from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ContactsMoon";

const DETAIL_LINES = ["1234", "1234"];

export function ContactsSlide({
  arriving,
  arrived,
  renderMoon = true,
}: {
  arriving: boolean;
  arrived: boolean;
  /** false on the scroll page, where SharedMoon (one instance for the whole
   * page) plays this moon instead; the /classic deck keeps its own. */
  renderMoon?: boolean;
}) {
  // How many lines the title wraps to (English: 2; KO/JA: 1 on wide
  // screens), as --contacts-title-lines: the address block below uses it to
  // land at the same height in every language (boilerlab-scroll.css).
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const content = contentRef.current;
    const title = content?.querySelector<HTMLElement>(".contacts-title");
    if (!content || !title) return;
    const update = () => {
      const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
      if (!lineHeight) return;
      const lines = Math.max(1, Math.round(title.getBoundingClientRect().height / lineHeight));
      content.style.setProperty("--contacts-title-lines", String(lines));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(title);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {renderMoon && <ContactsMoon />}
      <div className="moon-gradient" aria-hidden="true" />
      <div ref={contentRef} className={`slide-inner contacts-content${arrived ? " arrived" : ""}`}>
        <EditableText id="contacts.title" as="h2" className="eyebrow contacts-title" html="1234" />
        <EditableText id="contacts.subtitle" as="p" className="contacts-subtitle">
          1234
        </EditableText>
        <ContactsDemoButton />
        <div className="contacts-details" aria-label="Company contacts">
          {/* The bullet row (contacts.address.0–2) was removed at the user's
              request; the email / address lines keep their original keys. */}
          {DETAIL_LINES.map((line, i) => (
            <Typewriter
              key={i}
              text={line}
              active={arriving || arrived}
              editKey={`contacts.address.${i + 3}`}
              className="subtitle"
              animate={false}
            />
          ))}
        </div>
      </div>
    </>
  );
}
