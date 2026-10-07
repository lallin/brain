import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Health Care",
  title: "AAC Voice Communication",
  productCode: "BLINGS (AAC)",
  subtitle: "Converts disordered speech into natural, clear speech in real time, empowering people with speech impairments to communicate freely.",
  problemText:
    "Individuals with speech impairments due to conditions like cerebral palsy, ALS, or stroke face significant daily communication barriers. BLINGS uses advanced neural speech reconstruction to restore natural voice communication while preserving the speaker's identity.",
  useCases: [
    "Assistive communication for speech disorders",
    "Rehabilitation progress monitoring",
    "Telehealth speech consultations",
    "Educational support for children",
  ],
  keyFeatures: [
    "Real-time speech reconstruction",
    "Personalized voice profile creation",
    "Mobile & tablet native support",
    "Clinical-grade accuracy (97%+)",
    "Full offline processing mode",
    "Emotion preservation engine",
  ],
  securityText: "HIPAA-compliant data handling with enterprise-grade encryption. Patient speech data is anonymized and never shared with third parties.",
  howItWorksText:
    "The neural speech reconstruction engine analyzes disordered speech patterns in real time, extracts the speaker's linguistic intent and emotional tone, then regenerates clear, natural speech that preserves the speaker's unique voice characteristics and personality.",
  faqItems: [
    {
      question: "What speech disorders does BLINGS support?",
      answer:
        "BLINGS supports a wide range of conditions including cerebral palsy, ALS, stroke-related aphasia, dysarthria, and developmental speech disorders. The system adapts to each individual's unique speech patterns.",
    },
    {
      question: "Can it function fully offline?",
      answer:
        "Yes. Full offline processing mode ensures uninterrupted communication in any environment. All neural speech reconstruction runs locally on the device without requiring an internet connection.",
    },
    {
      question: "How is patient data privacy protected?",
      answer:
        "BLINGS is fully HIPAA-compliant with enterprise-grade encryption. Patient speech data is anonymized and never shared with third parties, ensuring complete privacy protection.",
    },
  ],
};

/** detail-blings--aac- (Figma node 94:982) — the "Learn more" destination for the BLINGS (AAC) solution card. */
export function DetailBlingsAac() {
  return <DetailPageTemplate data={DATA} />;
}
