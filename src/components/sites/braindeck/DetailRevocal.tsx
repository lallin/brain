import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Health Care",
  title: "Diagnosis & Rehabilitation Integration",
  productCode: "Revocal",
  subtitle: "AI-driven voice analysis that automatically generates personalized rehabilitation programs and continuously adapts to patient progress.",
  problemText:
    "Traditional rehabilitation programs lack personalization and real-time adaptation to patient progress. Revocal combines AI-driven voice biomarker analysis with clinical expertise to create continuously optimizing therapy plans that improve outcomes.",
  useCases: [
    "Speech therapy program design",
    "Post-stroke voice rehabilitation",
    "Voice disorder treatment planning",
    "Remote therapy progress monitoring",
  ],
  keyFeatures: [
    "Voice biomarker diagnosis engine",
    "Adaptive rehabilitation programs",
    "Real-time progress dashboard",
    "Therapist collaboration portal",
    "Multi-language clinical support",
    "EHR/EMR system integration",
  ],
  securityText: "Full HIPAA and GDPR compliance. Clinical data stored with AES-256 enterprise-grade encryption across all deployment regions.",
  howItWorksText:
    "Revocal's clinical AI engine analyzes over 200 voice biomarkers to assess speech function and pathology severity, then generates personalized rehabilitation exercise sequences. The system continuously adapts the therapy program based on measured progress and therapist feedback.",
  faqItems: [
    {
      question: "What clinical conditions does Revocal support?",
      answer:
        "Revocal supports post-stroke voice rehabilitation, voice disorders, dysphonia, and speech therapy program design. The AI engine analyzes over 200 voice biomarkers for comprehensive assessment.",
    },
    {
      question: "How does it integrate with existing EHR systems?",
      answer:
        "Revocal offers native EHR/EMR system integration through standard healthcare APIs including HL7 FHIR. Clinical data syncs seamlessly with existing workflows and therapist collaboration portals.",
    },
    {
      question: "What peer-reviewed evidence supports the platform?",
      answer:
        "Revocal's adaptive rehabilitation approach is supported by multiple peer-reviewed studies demonstrating improved patient outcomes compared to traditional fixed-protocol therapy programs.",
    },
  ],
};

/** detail-revocal (Figma node 94:1089) — the "Learn more" destination for the Revocal solution card. */
export function DetailRevocal() {
  return <DetailPageTemplate data={DATA} />;
}
