import { DetailPageTemplate, type DetailPageData } from "./DetailPageTemplate";

const DATA: DetailPageData = {
  badgeLabel: "Enterprise / Industrial AX",
  title: "AI-Powered Zero-Defect Detection",
  productCode: "Robot Component Defect Detection",
  subtitle: "Real-time detection of micro-defects in robot reducers within 1ms, ensuring manufacturing quality at production speed.",
  problemText:
    "Manufacturing quality control for precision components requires detecting microscopic defects at production line speed. Traditional visual inspection misses 15-30% of defects. Our AI solution uses vibration and acoustic emission analysis for sub-millisecond, non-destructive detection.",
  useCases: [
    "Robot reducer quality inspection",
    "Precision component manufacturing QC",
    "Predictive maintenance integration",
    "Automated production line quality gates",
  ],
  keyFeatures: [
    "Sub-1ms defect detection",
    "Vibration & acoustic emission analysis",
    "Predictive maintenance alerting",
    "99.9% defect capture rate",
    "Non-destructive testing method",
    "Production line API integration",
  ],
  securityText: "Industrial IoT data encrypted in transit (TLS 1.3) and at rest (AES-256). Full on-premises deployment available for air-gapped environments.",
  howItWorksText:
    "The system captures vibration signatures and acoustic emissions from robot components at high frequency, processes them through specialized convolutional neural networks trained on millions of defect patterns, and delivers deterministic pass/fail decisions within 1 millisecond.",
  faqItems: [
    {
      question: "What minimum defect size can it reliably detect?",
      answer:
        "The system reliably detects micro-defects as small as 10 micrometers using vibration and acoustic emission analysis, achieving a 99.9% defect capture rate through non-destructive testing.",
    },
    {
      question: "How does it integrate with existing production lines?",
      answer:
        "Integration is seamless via production line API. The system connects with existing PLCs, SCADA systems, and MES platforms, functioning as an automated quality gate without disrupting workflow.",
    },
    {
      question: "What is the typical setup and calibration time?",
      answer:
        "Initial setup and calibration typically takes 2 to 3 days for a standard production line. The system self-calibrates continuously, adapting to environmental changes and component variations.",
    },
  ],
};

/** detail-robot-component-defect-detection (Figma node 94:1196) — the "Learn more" destination for the Robot Component Defect Detection solution card. */
export function DetailRobotDefectDetection() {
  return <DetailPageTemplate data={DATA} />;
}
