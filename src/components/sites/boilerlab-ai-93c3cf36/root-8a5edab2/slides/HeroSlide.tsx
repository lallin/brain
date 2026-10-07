import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import ContactsMoon from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/ContactsMoon";

export function HeroSlide({ renderMoon = true }: { renderMoon?: boolean }) {
  return (
    <>
      {/* Same sphere as the Contacts slide's closing moon, bookending the
          deck — own storage id so its size is independent of that one.
          Interactive (drag-to-move/resize), by explicit product choice —
          but marbleClickable={false}: the marble body spatially overlaps
          the vertically centered title here, and its own pointer-events
          (needed elsewhere for the Contacts instance's rotation drag) would
          otherwise swallow clicks meant for that text (confirmed directly:
          the title became unclickable the moment this went interactive).
          The two drag handles are unaffected — they set their own
          pointer-events regardless of this.
          `renderMoon={false}` (only passed by HeroSlideScroll) skips this —
          that variant renders its own separate instance outside the fading
          wrapper this component sits in there, specifically so the ball's
          scroll-linked shrink+sink exit is *not* also tied to that fade
          (it should shrink and sink out of view on its own, not fade away
          with the text). The classic (non-scroll) deck's own HeroSlide
          usage has no such fade to worry about, so it keeps rendering the
          ball right here as before. */}
      {renderMoon && (
        <>
          <ContactsMoon id="hero.moon" interactive marbleClickable={false} wrapClassName="hero-moon-wrap" />
          <div className="moon-gradient" aria-hidden="true" />
        </>
      )}
      <div className="slide-inner stars-slide hero-slide">
        <div className="stars-slide-inner hero-content">
          <div className="text-content">
            <EditableText id="mission.eyebrow" as="h1" className="eyebrow" html="1234" />
            <EditableText id="mission.subtitle" as="p" className="subtitle">
              1234
            </EditableText>
            <EditableText id="mission.scrollHint" as="p" className="scroll-hint">
              1234
            </EditableText>
          </div>
        </div>
      </div>
    </>
  );
}
