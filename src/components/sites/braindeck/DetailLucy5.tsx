import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Media & Content",
  title: "Voice Cloning TTS",
  productCode: "LUCY-5",
  subtitle: "Clones a natural voice from a small amount of voice samples for use in various content production pipelines.",
  problemText:
    "Content creators need personalized, natural-sounding voices for games, audiobooks, and media production. LUCY-5 creates studio-quality voice clones from minimal samples, dramatically reducing production costs and time.",
  useCases: [
    "Audiobook narration with author's voice",
    "Game character voice generation",
    "Personalized virtual assistants",
    "Multilingual content dubbing",
  ],
  keyFeatures: [
    "5-second voice sample enrollment",
    "Emotional tone control",
    "20+ language support",
    "Studio-quality output (48kHz)",
    "Real-time voice synthesis",
    "Speaker identity preservation",
  ],
  securityText: "Voice biometric data encrypted at rest. Consent verification required for all voice cloning operations.",
  howItWorksText:
    "Neural codec language models decompose voice characteristics into discrete tokens, enabling high-fidelity reconstruction from minimal samples while preserving speaker identity, emotion, and natural cadence across multiple languages.",
  faqItems: [
    {
      question: "How much voice data is needed for enrollment?",
      answer:
        "Only 5 seconds of clean voice audio is required for enrollment. Longer samples of 30 to 60 seconds improve speaker identity preservation and emotional range in the synthesized output.",
    },
    {
      question: "Can it reproduce emotional nuance accurately?",
      answer:
        "Yes. The emotional tone control system captures and reproduces subtle nuances including stress, joy, sadness, and urgency while maintaining the speaker's natural cadence and personality.",
    },
    {
      question: "What languages are currently supported?",
      answer:
        "LUCY-5 supports over 20 languages including English, Korean, Japanese, Chinese, Spanish, French, and German. Multilingual content dubbing allows seamless voice synthesis across languages.",
    },
  ],
};

/** detail-lucy-5 (Figma node 94:768) — the "Learn more" destination for the LUCY-5 solution card. */
export function DetailLucy5() {
  return <DetailPageTemplate data={DATA} />;
}
