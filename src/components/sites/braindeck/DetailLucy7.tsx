import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Media & Content",
  title: "AI Music Generation",
  productCode: "LUCY-7",
  subtitle: "Automatically generates royalty-free music of the desired genre and mood with a simple text prompt.",
  problemText:
    "Video producers, game developers, and advertisers need custom music that perfectly matches specific moods and genres without the complexity of licensing. LUCY-7 creates unique, royalty-free compositions on demand.",
  useCases: [
    "Background music for video content",
    "Game soundtrack generation",
    "Advertising jingle creation",
    "Podcast intro/outro music",
  ],
  keyFeatures: [
    "Text-to-music generation",
    "Genre & mood control sliders",
    "Stem separation output",
    "Commercial license included",
    "Variable length (5s–10min)",
    "Style transfer from reference",
  ],
  securityText: "Generated music is unique and royalty-free. Blockchain-based ownership verification available for enterprise clients.",
  howItWorksText:
    "A diffusion-based architecture converts text descriptions into rich musical compositions by understanding genre conventions, harmonic progressions, and instrumentation patterns. The model supports hundreds of musical styles with fine-grained control over arrangement and dynamics.",
  faqItems: [
    {
      question: "What genres and styles are supported?",
      answer:
        "Over 200 musical styles are supported, from classical and jazz to electronic and hip-hop. Genre and mood control sliders allow fine-grained customization of arrangement and dynamics.",
    },
    {
      question: "Can I edit or remix generated music?",
      answer:
        "Yes. Stem separation output provides individual tracks for vocals, drums, bass, and melody that you can edit, remix, or combine independently using any standard DAW.",
    },
    {
      question: "What is the maximum composition length?",
      answer:
        "Compositions can be generated from 5 seconds up to 10 minutes in length. Variable-length generation ensures consistent quality and musical coherence throughout the entire piece.",
    },
  ],
};

/** detail-lucy-7 (Figma node 94:875) — the "Learn more" destination for the LUCY-7 solution card. */
export function DetailLucy7() {
  return <DetailPageTemplate data={DATA} />;
}
