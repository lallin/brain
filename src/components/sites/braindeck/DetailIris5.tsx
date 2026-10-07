import { Stage, px } from "./stage";
import { BraindeckHeader } from "./BraindeckHeader";
import { BackButton, WhiteButton, DarkButton } from "./Buttons";
import { FaqAccordionItem } from "./FaqAccordionItem";

const USE_CASES = [
  "AI-generated music filtering on streaming platforms",
  "Copyright protection system for record labels",
  "Authenticity verification for music competitions",
  "Quality control for music distributors",
];

const KEY_FEATURES = [
  { left: 160, top: 70, text: "Real-time AI-generated music detection (accuracy 98%+)" },
  { left: 680, top: 70, text: "Recognition of various music generation model patterns" },
  { left: 1200, top: 70, text: "Streaming platform API integration" },
  { left: 160, top: 162, text: "Bulk music inspection support" },
  { left: 680, top: 162, text: "Detailed analysis report provided" },
];

const FAQ_ITEMS = [
  {
    question: "What AI music generation tools can it detect?",
    answer:
      "IRIS-5 detects content from all major AI music generators including Suno, Udio, MusicLM, and Stable Audio. The system continuously updates its detection models to cover new generation tools as they emerge.",
  },
  {
    question: "What is the real-time processing speed?",
    answer:
      "IRIS-5 processes audio at over 100x real-time speed, analyzing a 3-minute track in under 2 seconds. Batch processing can handle thousands of tracks per hour via streaming platform API integration.",
  },
  {
    question: "What is the false positive rate?",
    answer:
      "Our false positive rate is below 0.1% across all tested scenarios. The multi-model pattern recognition system cross-validates results to minimize false detections while maintaining 99%+ accuracy.",
  },
];

function FeatureCard({ left, top, text }: { left: number; top: number; text: string }) {
  return (
    <div
      className="absolute bg-[#171717] border border-[#242424] overflow-hidden"
      style={{ left: px(left), top: px(top), width: px(500), height: px(72), borderRadius: px(10) }}
    >
      <span className="absolute bg-[#00d959] rounded-full" style={{ left: px(19), top: px(31), width: px(8), height: px(8) }} />
      <p
        className="absolute font-medium not-italic text-[#bfbfbf]"
        style={{ left: px(39), top: px(25), width: px(440), fontSize: px(14) }}
      >
        {text}
      </p>
    </div>
  );
}

/** detail-iris-5 (Figma node 94:554) — the "Learn more" destination for the IRIS-5 solution card. */
export function DetailIris5() {
  return (
    <Stage height={2460} className="bg-[#0a0a0a]">
      <BraindeckHeader logoTop={28} navTop={30} />
      <BackButton href="/braindeck" />
      <div className="absolute bg-[#242424]" style={{ left: 0, top: px(80), width: "100%", height: 1 }} />

      <div className="absolute bg-[#0a0a0a]" style={{ left: 0, top: px(80), width: "100%", height: px(340) }}>
        <div
          className="absolute bg-[#003314] border border-[#006626] inline-flex items-start"
          style={{ left: px(160), top: px(80), paddingInline: px(10), paddingBlock: px(5), borderRadius: px(12) }}
        >
          <p className="font-semibold not-italic text-[#00d959] whitespace-nowrap" style={{ fontSize: px(11) }}>
            Media & Content
          </p>
        </div>
        <p className="absolute font-bold not-italic text-white" style={{ left: px(160), top: px(116), width: px(900), fontSize: px(52) }}>
          Deepfake Music Detection
        </p>
        <p className="absolute font-medium not-italic text-[#8c8c8c] whitespace-nowrap" style={{ left: px(160), top: px(182), fontSize: px(14) }}>
          IRIS-5
        </p>
        <p
          className="absolute font-light not-italic text-[#bfbfbf]"
          style={{ left: px(160), top: px(220), width: px(700), fontSize: px(18), lineHeight: px(30) }}
        >
          Protect copyrights by accurately distinguishing between AI-generated music and real music
        </p>
        <div className="absolute bg-[#00d959]" style={{ left: px(160), top: px(310), width: px(60), height: px(3), borderRadius: px(2) }} />
      </div>

      <div className="absolute bg-[#0f0f0f]" style={{ left: 0, top: px(420), width: "100%", height: px(400) }}>
        <p
          className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap"
          style={{ left: px(160), top: px(40), fontSize: px(11), letterSpacing: px(4) }}
        >
          PROBLEM & SOLUTION
        </p>
        <p className="absolute font-bold not-italic text-white whitespace-nowrap" style={{ left: px(160), top: px(64), fontSize: px(36) }}>
          What it Solves
        </p>
        <p
          className="absolute font-normal not-italic text-[#8c8c8c]"
          style={{ left: px(160), top: px(120), width: px(680), fontSize: px(15), lineHeight: px(26) }}
        >
          Music streaming platforms and record labels are facing copyright infringement and authenticity verification
          issues due to the proliferation of AI-generated music. This solution protects the platform&apos;s reliability
          by detecting deepfake music in real time.
        </p>

        <div
          className="absolute bg-[#171717] border border-[#242424] overflow-hidden"
          style={{ left: px(920), top: px(40), width: px(700), height: px(340), borderRadius: px(14) }}
        >
          <p className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap" style={{ left: px(27), top: px(19), fontSize: px(18) }}>
            Use Cases
          </p>
          <div className="absolute bg-[#242424]" style={{ left: px(27), top: px(51), width: px(644), height: 1 }} />
          {USE_CASES.map((useCase, i) => (
            <div key={useCase}>
              {i > 0 && <div className="absolute bg-[#242424]" style={{ left: px(27), top: px(51 + i * 52), width: px(644), height: 1 }} />}
              <p
                className="absolute font-medium not-italic text-[#00d959] whitespace-nowrap"
                style={{ left: px(27), top: px(69 + i * 52), fontSize: px(14) }}
              >
                →
              </p>
              <p
                className="absolute font-medium not-italic text-[#bfbfbf]"
                style={{ left: px(55), top: px(69 + i * 52), width: px(600), fontSize: px(14) }}
              >
                {useCase}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bg-[#0a0a0a]" style={{ left: 0, top: px(820), width: "100%", height: px(380) }}>
        <p
          className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap"
          style={{ left: px(160), top: px(36), fontSize: px(11), letterSpacing: px(4) }}
        >
          KEY FEATURES
        </p>
        {KEY_FEATURES.map((feature) => (
          <FeatureCard key={feature.text} {...feature} />
        ))}
        <div
          className="absolute bg-[#0d140d] border border-[#142e14] overflow-hidden"
          style={{ left: px(160), top: px(260), width: px(1600), height: px(64), borderRadius: px(10) }}
        >
          <span className="absolute text-white font-normal" style={{ left: px(19), top: px(21), fontSize: px(14) }}>
            🔒
          </span>
          <p className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap" style={{ left: px(45), top: px(13), fontSize: px(13) }}>
            Security & Data Handling
          </p>
          <p className="absolute font-normal not-italic text-[#8c8c8c]" style={{ left: px(45), top: px(35), width: px(1520), fontSize: px(12) }}>
            All music data is transmitted encrypted and deleted immediately after analysis. It provides an infrastructure
            that complies with GDPR and personal information protection laws.
          </p>
        </div>
      </div>

      <div className="absolute bg-[#080f08]" style={{ left: 0, top: px(1200), width: "100%", height: px(440) }}>
        <p
          className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap"
          style={{ left: px(160), top: px(50), fontSize: px(11), letterSpacing: px(4) }}
        >
          HOW IT WORKS
        </p>
        <p className="absolute font-bold not-italic text-white whitespace-nowrap" style={{ left: px(160), top: px(80), fontSize: px(36) }}>
          Technical Overview
        </p>
        <div className="absolute bg-[#00d959]" style={{ left: px(160), top: px(150), width: px(3), height: px(120), borderRadius: px(2) }} />
        <p
          className="absolute font-light not-italic text-[#bfbfbf]"
          style={{ left: px(184), top: px(150), width: px(800), fontSize: px(20), lineHeight: px(34) }}
        >
          The deep learning-based audio analysis engine examines the spectrum, frequency patterns, and generation
          artifacts of music in real time to determine whether it is AI-generated. It continuously adapts to new
          deepfake techniques by learning characteristics of emerging generation models.
        </p>
      </div>

      <div className="absolute bg-[#0f0f0f]" style={{ left: 0, top: px(1640), width: "100%", height: px(400) }}>
        <p
          className="absolute font-semibold not-italic text-[#00d959] whitespace-nowrap"
          style={{ left: px(160), top: px(40), fontSize: px(11), letterSpacing: px(4) }}
        >
          F.A.Q
        </p>
        <div className="absolute font-bold not-italic text-white" style={{ left: px(160), top: px(66), fontSize: px(36) }}>
          <p style={{ lineHeight: px(44) }}>Frequently Asked</p>
          <p style={{ lineHeight: px(44) }}>Questions</p>
        </div>
        {FAQ_ITEMS.map((item, i) => (
          <FaqAccordionItem key={item.question} question={item.question} answer={item.answer} left={660} top={50 + i * 110} width={1040} />
        ))}
      </div>

      <div className="absolute bg-[#0a0a0a]" style={{ left: 0, top: px(2060), width: "100%", height: px(360) }}>
        <div
          className="absolute bg-[#051433] border border-[#0d264d] overflow-hidden"
          style={{ left: px(160), top: px(40), width: px(1600), height: px(260), borderRadius: px(20) }}
        >
          <div
            className="absolute bg-[#00d959] inline-flex items-start"
            style={{ left: px(759), top: px(29), paddingInline: px(12), paddingBlock: px(4), borderRadius: px(12) }}
          >
            <p className="font-semibold not-italic text-white whitespace-nowrap" style={{ fontSize: px(11) }}>
              IRIS-5
            </p>
          </div>
          <p
            className="absolute font-bold not-italic text-white whitespace-nowrap"
            style={{ left: px(559), top: px(69), fontSize: px(28) }}
          >
            Experience this solution firsthand
          </p>
          <p
            className="absolute font-normal not-italic text-[#8c8c8c]"
            style={{ left: px(519), top: px(114), width: px(560), fontSize: px(14) }}
          >
            Test in a real environment for 24 hours after approval and evaluate business suitability
          </p>
          <div className="absolute flex" style={{ left: px(627), top: px(169), gap: px(16) }}>
            <WhiteButton paddingX={32} paddingY={12} fontSize={14} radius={24}>
              Request Demo
            </WhiteButton>
            <DarkButton paddingX={32} paddingY={12} fontSize={14} radius={24}>
              Watch Tutorial
            </DarkButton>
          </div>
        </div>
      </div>

      <div className="absolute bg-[#242424]" style={{ left: 0, top: px(2420), width: "100%", height: 1 }} />
      <p className="absolute font-normal not-italic text-[#404040] whitespace-nowrap" style={{ left: px(160), top: px(2440), fontSize: px(12) }}>
        © 2024 Braindeck Inc. All rights reserved.
      </p>
      <p className="absolute font-normal not-italic text-[#404040] whitespace-pre" style={{ left: px(1420), top: px(2440), fontSize: px(12) }}>
        Privacy Policy &nbsp;&nbsp;&middot;&nbsp;&nbsp; Terms of Service &nbsp;&nbsp;&middot;&nbsp;&nbsp; Contact
      </p>
    </Stage>
  );
}
