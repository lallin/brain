import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Media & Content",
  title: "Deepfake Image/Video Detection",
  productCode: "IRIS-6",
  subtitle: "Prevents the spread of false information by detecting AI-manipulated images and videos with forensic-grade precision.",
  problemText:
    "The rapid advancement of generative AI has made it increasingly difficult to distinguish real from fake visual media. IRIS-6 provides multi-layer forensic analysis to protect organizations against misinformation, identity fraud, and content manipulation at scale.",
  useCases: [
    "Social media content moderation",
    "News & journalism verification",
    "Identity fraud prevention",
    "Legal evidence authentication",
  ],
  keyFeatures: [
    "Frame-by-frame video analysis",
    "GAN artifact detection engine",
    "Face-swap & reenactment detection",
    "Provenance verification system",
    "Content moderator dashboard",
    "Batch processing API",
  ],
  securityText: "End-to-end encrypted media processing with zero-retention policy. All analysis occurs in isolated secure environments.",
  howItWorksText:
    "IRIS-6 employs multi-layer neural analysis examining pixel-level inconsistencies, temporal coherence in videos, and physiological implausibility in facial movements to detect synthetic media with forensic precision across all major generation frameworks.",
  faqItems: [
    {
      question: "What types of deepfakes can it detect?",
      answer:
        "IRIS-6 detects face swaps, facial reenactments, full-body synthesis, and AI-generated images from all major frameworks including GANs, diffusion models, and neural radiance fields.",
    },
    {
      question: "How does it handle compressed video?",
      answer:
        "The system maintains high accuracy even on heavily compressed video. Our GAN artifact detection engine analyzes compression-resilient features that persist across encoding formats and quality levels.",
    },
    {
      question: "What resolution range is supported?",
      answer:
        "IRIS-6 supports video from 240p to 8K resolution. Frame-by-frame analysis adapts to any resolution, with higher-resolution content enabling more precise forensic-level detection.",
    },
  ],
};

/** detail-iris-6 (Figma node 94:661) — the "Learn more" destination for the IRIS-6 solution card. */
export function DetailIris6() {
  return <DetailPageTemplate data={DATA} />;
}
