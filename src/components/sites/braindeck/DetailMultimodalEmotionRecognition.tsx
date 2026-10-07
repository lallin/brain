import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Enterprise / Industrial AX",
  title: "Multimodal Emotion Recognition",
  productCode: "Multimodal Emotion Recognition",
  subtitle: "Precise emotion prediction by integrating speech prosody, facial expressions, and physiological signals into a unified analysis.",
  problemText:
    "Understanding human emotions accurately is critical for customer service optimization, educational engagement, and healthcare diagnostics. Single-modality approaches miss nuance. Our solution fuses speech, visual, and physiological signals for comprehensive, culturally-aware emotion analysis.",
  useCases: [
    "Customer service quality optimization",
    "Educational engagement monitoring",
    "Mental health screening tools",
    "Market research & UX testing",
  ],
  keyFeatures: [
    "Speech + face + bio-signal fusion",
    "7 primary emotion categories",
    "Real-time streaming analysis",
    "Privacy-preserving on-device AI",
    "Cultural adaptation models",
    "Confidence score calibration",
  ],
  securityText: "On-device processing ensures biometric data never leaves the user's device. Full GDPR and privacy regulation compliance across all deployment regions.",
  howItWorksText:
    "The multimodal fusion engine combines speech prosody analysis, facial action unit detection (AU recognition), and physiological signal processing through a cross-attention transformer architecture that dynamically weights each modality based on signal quality for optimal emotion prediction accuracy.",
  faqItems: [
    {
      question: "What emotion categories can it detect and distinguish?",
      answer:
        "The system recognizes 7 primary emotion categories: happiness, sadness, anger, fear, surprise, disgust, and contempt, plus nuanced blends with confidence score calibration.",
    },
    {
      question: "What is the cross-cultural recognition accuracy?",
      answer:
        "Cross-cultural accuracy exceeds 92% thanks to cultural adaptation models trained on diverse global datasets. The system adjusts recognition parameters based on cultural context and expression norms.",
    },
    {
      question: "How does on-device processing protect user privacy?",
      answer:
        "All biometric analysis runs entirely on-device. Speech, facial, and physiological data never leaves the user's device, ensuring full GDPR compliance across all deployment regions.",
    },
  ],
};

/** detail-multimodal-emotion-recognition (Figma node 94:1303) — the "Learn more" destination for the Multimodal Emotion Recognition solution card. */
export function DetailMultimodalEmotionRecognition() {
  return <DetailPageTemplate data={DATA} />;
}
