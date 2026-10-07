import type { ProductItem } from "@/types/boilerlab";

const REAL_ROOT = "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/products/real";
const LOGO_ROOT = "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/images/products";

// Icons + per-box images/copy are the real ones from https://www.braindeck.net/'s
// own Solutions section (inspected directly — its category icons are
// lucide-react components, e.g. `<svg class="lucide lucide-music">`, and
// each box below matches one of its real sub-solution cards), replacing the
// earlier generic boilerlab.ai placeholder logo/photos this clone started
// with. `sigma`'s single box previously mixed reused, unrelated visuals in
// for 3 of `atomic-mail`'s 4 slots (see the old comment removed from here) —
// that's gone now that every box has its own real, correct image.
export const PRODUCTS: ProductItem[] = [
  {
    id: "sigma",
    name: "Voucher",
    icon: "Ticket",
    url: "https://sigmabrowser.com/",
    boxes: [
      {
        image: `${LOGO_ROOT}/sigma-visual.webp`,
        name: "Copyright Voucher",
        headline: "Leverage Braindeck's AI solutions through the voucher program.",
        description: "",
      },
    ],
  },
  {
    id: "atomic-mail",
    name: "Media & Content",
    icon: "Music",
    url: "https://atomicmail.io/",
    // Same order, names and descriptions as braindeck.net's Media & Content
    // cards (its English locale).
    boxes: [
      {
        image: `${REAL_ROOT}/deepfake-music-protection.jpg`,
        name: "Deepfake Music Detection",
        headline: "IRIS - 5",
        description: "Protect copyrights by accurately distinguishing between AI-generated music and real music",
        slug: "deepfake-music-detection",
      },
      {
        image: `${REAL_ROOT}/deepfake-video-protection.jpg`,
        name: "Deepfake Image/Video Detection",
        headline: "IRIS - 6",
        description: "Prevents the spread of false information by detecting AI-manipulated images and videos in real time",
        slug: "deepfake-media-detection",
      },
      {
        image: `${REAL_ROOT}/cloning-tts.png`,
        name: "Voice Cloning TTS",
        headline: "LUCY - 5",
        description: "Clones a natural voice from a small amount of voice samples for use in various content creation",
        slug: "cloning-tts",
      },
      {
        image: `${REAL_ROOT}/music-generation.jpg`,
        name: "AI Music Generation",
        headline: "LUCY - 7",
        description: "Automatically generates music of the desired genre and mood with a text prompt",
        slug: "music-generation",
      },
    ],
  },
  {
    id: "aimlapi",
    name: "Health Care",
    icon: "Heart",
    url: "https://aimlapi.com/",
    boxes: [
      {
        image: `${REAL_ROOT}/aac-voice-communication.jpg`,
        name: "AAC Voice Communication",
        headline: "BLINGS (AAC)",
        description: "Converts disordered speech into normal speech in real time",
        slug: "aac-voice-communication",
      },
      {
        image: `${REAL_ROOT}/diagnosis-rehabilitation.png`,
        name: "Diagnosis & Rehabilitation Integration",
        headline: "Revocal",
        description: "Automatically generates a customized rehabilitation program based on voice diagnosis data",
        slug: "diagnosis-rehabilitation",
      },
    ],
  },
  {
    id: "atomicbot",
    name: "Enterprise / Industrial AX",
    icon: "Cpu",
    url: "https://atomicbot.ai/",
    boxes: [
      {
        image: `${REAL_ROOT}/robot-defect-detection.jpg`,
        name: "AI-Powered Zero-Defect Detection for Robot Components",
        headline: "Robot Component Defect Detection",
        description:
          "Real-time detection of micro-defects in robot reducers within 1ms using VIB and Distributional Reinforcement Learning.",
        slug: "robot-defect-detection",
      },
      {
        image: `${REAL_ROOT}/emotion-recognition.png`,
        name: "Multimodal Advanced Emotion Recognition",
        headline: "Multimodal Emotion Recognition",
        description:
          "A precise emotion prediction solution that integrates speech, facial expressions, and biosignals to minimize uncertainty.",
        slug: "emotion-recognition",
      },
    ],
  },
];
