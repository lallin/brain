import type { PressItem } from "@/types/boilerlab";
import { EditableText } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/EditableText";
import { DraggableBox } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/DraggableBox";

// Repositioned as a clean, symmetric 2x2 frame around the centered title
// (was a scattered/rotated "press collage" layout inherited from the
// original 7-quote design — fine for loose press mentions, messy for a
// tidy 4-item trust-point grid). Corners mirror left/right and top/bottom
// around the 50%/50% title.
const PRESS_ITEMS: PressItem[] = [
  {
    author: "Movez",
    handle: "@0xMovez",
    url: "https://x.com/0xMovez/status/2049891014249431141?s=20",
    quote: "Trading bots/agents on Polymarket generated over $60M in profit in 2025-2026. 77%",
    left: "6%",
    top: "26%",
    width: "24.7rem",
    rotate: "-0.3deg",
    z: 4,
    delay: "-1.6s",
    duration: "7.8s",
    index: 0,
  },
  {
    author: "kyt dotson",
    handle: "@kit_dotson",
    url: "https://siliconangle.com/2025/12/22/sigma-launches-privacy-focused-ai-native-browser-local-llm/",
    quote:
      "Sigma Browser OÜ Friday announced the launch of its privacy-focused web browser, which features a local artificial intelligence model that doesn't send data to the cloud",
    left: "94%",
    top: "26%",
    width: "24.7rem",
    rotate: "0.3deg",
    z: 3,
    delay: "-4.7s",
    duration: "9.2s",
    index: 2,
  },
  {
    author: "Peter Steinberger",
    handle: "@steipete",
    url: "https://x.com/steipete/status/2055570810513850777?s=20",
    quote:
      "Hermes Agent vs OpenClaw using Qwen 35B Local Model\n\nWe asked agents to scrape GitHub star history for both tools, find what caused the...",
    left: "15%",
    top: "75%",
    width: "27.3rem",
    rotate: "0.25deg",
    z: 4,
    delay: "-5.4s",
    duration: "10s",
    index: 4,
  },
  {
    author: "skywork",
    handle: "@skywork_ai",
    url: "https://skywork.ai/skypage/en/Overchat-AI-Review-The-All-in-One-AI-Super-App-You-Need/1976167089273106432",
    quote: "As someone who lives and breathes AI and SEO, my browser is a chaotic collection of tabs: one for",
    left: "85%",
    top: "75%",
    width: "26rem",
    rotate: "-0.25deg",
    z: 3,
    delay: "-6.8s",
    duration: "9.6s",
    index: 5,
  },
];

export function InPressSlide() {
  return (
    <div className="slide-inner hero-content in-press-content">
      <div className="in-press-orbit" aria-label="Press mentions">
        <EditableText id="inpress.title" as="h3" className="eyebrow in-press-title" html="1234" />
        {PRESS_ITEMS.map((item) => (
          // A plain div, not a link: these are now trust-point cards, not
          // press-mention quotes, so there's no external URL that makes
          // sense to send someone to on click (item.url/target/rel were
          // dropped along with the <a>; item.url is kept on PRESS_ITEMS
          // only because it's harmless leftover data, unused here).
          <DraggableBox
            key={item.handle}
            id={`inpress.${item.index}`}
            className="in-press-card"
            style={
              {
                "--press-left": item.left,
                "--press-top": item.top,
                "--press-width": item.width,
                "--press-rotate": item.rotate,
                "--press-z": item.z,
                "--press-delay": item.delay,
                "--press-duration": item.duration,
                "--press-index": item.index,
              } as React.CSSProperties
            }
          >
            {/* Trust-point cards only ever needed a title + description —
                the original "press mention" markup also had a handle line
                and a "read more" link, both left empty once repurposed,
                which meant an empty-but-still-padded/margined element
                sitting between and below the real content on every card
                (the "awkward spacing" reported). Dropped rather than left
                empty. */}
            <article className="in-press-card-surface">
              <EditableText id={`inpress.${item.index}.author`} as="strong">
                1234
              </EditableText>
              <EditableText id={`inpress.${item.index}.quote`} as="p">
                1234
              </EditableText>
            </article>
          </DraggableBox>
        ))}
      </div>
    </div>
  );
}
