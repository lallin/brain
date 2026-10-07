import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { px } from "./stage";
import { NAV_ITEMS } from "./BraindeckHeader";
import { FaqAccordionItem } from "./FaqAccordionItem";

const ICONS = {
  alertTriangle: "/sites/braindeck/icons/voucher-alert-triangle.svg",
  checkDark: "/sites/braindeck/icons/voucher-check-dark.svg",
  checkBlack: "/sites/braindeck/icons/voucher-check-black.svg",
  shield: "/sites/braindeck/icons/voucher-shield.svg",
  star: "/sites/braindeck/icons/voucher-star.svg",
  folder: "/sites/braindeck/icons/voucher-folder.svg",
} as const;

function Icon({ src, size }: { src: string; size: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: px(size), height: px(size) }}>
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-contain pointer-events-none" />
    </span>
  );
}

function SectionTitles({ eyebrow, title, dark }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center w-full" style={{ gap: px(12) }}>
      <p className="font-bold uppercase text-[#0f6]" style={{ fontSize: px(12), letterSpacing: px(3) }}>
        {eyebrow}
      </p>
      <p className={`font-extrabold ${dark ? "text-white" : "text-white"}`} style={{ fontSize: px(36) }}>
        {title}
      </p>
    </div>
  );
}

function ChecklistItem({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <div className="flex items-center w-full" style={{ gap: px(12) }}>
      <Icon src={dark ? ICONS.checkBlack : ICONS.checkDark} size={16} />
      <p className="font-medium flex-1" style={{ fontSize: px(15), color: dark ? "#0d0d0d" : "#bfbfbf" }}>
        {text}
      </p>
    </div>
  );
}

function UseCaseArrowItem({ text }: { text: string }) {
  return (
    <div className="flex items-start" style={{ gap: px(8) }}>
      <p className="font-semibold text-[#0f6] shrink-0" style={{ fontSize: px(14) }}>
        →
      </p>
      <p className="font-normal text-[#bfbfbf] flex-1" style={{ fontSize: px(14), lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      className="bg-[#141414] border border-[#242424] flex-1 flex flex-col items-start"
      style={{ gap: px(20), padding: px(32), borderRadius: px(16) }}
    >
      <p className="font-bold text-white w-full" style={{ fontSize: px(20) }}>
        {title}
      </p>
      <div className="flex flex-col items-start w-full" style={{ gap: px(12) }}>
        {items.map((text) => (
          <UseCaseArrowItem key={text} text={text} />
        ))}
      </div>
    </div>
  );
}

interface DeliveryCardProps {
  badge: string;
  badgeHighlight?: boolean;
  title: string;
  subtitle: string;
  items: string[];
}

function DeliveryCard({ badge, badgeHighlight, title, subtitle, items }: DeliveryCardProps) {
  return (
    <div
      className="bg-[#141414] border border-[#242424] flex-1 flex flex-col items-start"
      style={{ gap: px(24), padding: px(40), borderRadius: px(24) }}
    >
      <div
        className="inline-flex items-start"
        style={{
          paddingInline: px(12),
          paddingBlock: px(6),
          borderRadius: px(8),
          background: badgeHighlight ? "#003314" : "#242424",
          border: badgeHighlight ? "1px solid #006626" : undefined,
        }}
      >
        <p className="font-bold uppercase whitespace-nowrap" style={{ fontSize: px(11), color: badgeHighlight ? "#0f6" : "#bfbfbf" }}>
          {badge}
        </p>
      </div>
      <p className="font-bold text-white" style={{ fontSize: px(22) }}>
        {title}
      </p>
      <p className="font-semibold text-[#0f6]" style={{ fontSize: px(14) }}>
        {subtitle}
      </p>
      <div className="flex flex-col items-start w-full" style={{ gap: px(12) }}>
        {items.map((text) => (
          <ChecklistItem key={text} text={text} />
        ))}
      </div>
    </div>
  );
}

function IndustryAccordionRow({ label }: { label: string }) {
  return (
    <div
      className="bg-[#141414] border border-[#242424] flex items-center justify-between w-full"
      style={{ padding: px(20), borderRadius: px(12) }}
    >
      <div className="flex items-center" style={{ gap: px(16) }}>
        <div className="bg-[#242424] flex items-center justify-center" style={{ padding: px(8), borderRadius: px(8), width: px(32), height: px(32) }}>
          <Icon src={ICONS.folder} size={16} />
        </div>
        <p className="font-semibold text-white" style={{ fontSize: px(16) }}>
          {label}
        </p>
      </div>
      <p className="font-light text-[#8c8c8c]" style={{ fontSize: px(18) }}>
        +
      </p>
    </div>
  );
}

interface WorkflowStepProps {
  number: string;
  title: string;
  subtitle: string;
  showArrow: boolean;
}

function WorkflowStep({ number, title, subtitle, showArrow }: WorkflowStepProps) {
  return (
    <div className="flex-1 flex items-center">
      <div
        className="bg-[#141414] border border-[#242424] flex-1 flex flex-col items-start h-full"
        style={{ gap: px(12), padding: px(24), borderRadius: px(16) }}
      >
        <p className="font-extrabold text-[#0f6]" style={{ fontSize: px(28) }}>
          {number}
        </p>
        <p className="font-bold text-white" style={{ fontSize: px(16) }}>
          {title}
        </p>
        <p className="font-normal text-[#8c8c8c]" style={{ fontSize: px(13), lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>
      {showArrow && (
        <div className="flex items-center justify-center shrink-0" style={{ width: px(48) }}>
          <p className="font-bold text-[#006626]" style={{ fontSize: px(20) }}>
            →
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ children, bg, style }: { children: ReactNode; bg?: string; style?: CSSProperties }) {
  return (
    <div className={`flex flex-col items-center w-full ${bg ?? ""}`} style={{ paddingInline: px(160), paddingBlock: px(100), ...style }}>
      {children}
    </div>
  );
}

const LIMITATIONS = ["Static ID-based tracking", "File-level identification", "Manual post-analysis"];
const SOLUTIONS = [
  "AI pattern and route analysis beyond simple ID mapping",
  "Similarity-based identification of modified, edited, or re-encoded content",
  "Response to AI-generated content including deepfake music and video detection",
  "Automated detection of repetitive and organized leak patterns",
];

const FEATURE_CARDS = [
  {
    title: "Global DRM Integration",
    items: [
      "Integration with proven overseas DRM technologies",
      "Playback copying and access control",
      "Applicable to web platform and B2B delivery environments",
    ],
  },
  {
    title: "Dynamic Watermarking & Digital Forensics",
    items: [
      "Dynamic insertion of identification info by content session and distribution target",
      "Forensic design based on AI analysis rather than simple insertion",
      "Automated identification of leaked content",
    ],
  },
  {
    title: "AI-Based Leak Analysis",
    items: [
      "Automated learning and classification of leak patterns",
      "Detection of repetitive and organized leak behavior",
      "Analyzing how and through what routes leaks occur, not just who leaked it",
    ],
  },
];

const INDUSTRIES = [
  "E-Book Companies",
  "Audio/Music Companies",
  "Image/Video Companies",
  "AI Content Generation Companies",
  "B2B Content Distribution",
  "IP Owners/Brand Companies",
];

const WORKFLOW_STEPS = [
  { number: "01", title: "Client Request", subtitle: "Online/Offline Meeting" },
  { number: "02", title: "Requirements & Analysis", subtitle: "Detailed Needs Assessment" },
  { number: "03", title: "Custom Development", subtitle: "Building Tailored Solutions" },
  { number: "04", title: "Delivery & Settlement", subtitle: "Final Inspection & Completion" },
  { number: "05", title: "Satisfaction Evaluation", subtitle: "Post-management & Feedback" },
];

const FAQ_ITEMS = [
  "How does this differ from existing DRM or forensic solutions?",
  "Is this simply a combination of AI technology and DRM?",
  "Can the AI analysis results be used as legal evidence?",
];

/**
 * detail-voucher-protection (Figma node 136:52) — the "Learn more" destination
 * for the Boho Shieldh voucher card. Unlike the other detail pages, this
 * frame is authored with natural flex flow rather than absolute positioning,
 * so it doesn't use the `Stage` fixed-height/absolute-position pattern —
 * it flows to its own height like an ordinary page.
 */
export function DetailVoucherProtection() {
  return (
    <div className="bg-[#0d0d0d] flex flex-col items-center w-full" style={{ containerType: "inline-size" }}>
      <div
        className="bg-[#0a0a0a] border-b border-[#242424] flex items-center justify-between w-full"
        style={{ height: px(90), paddingInline: px(160) }}
      >
        <Link
          href="/braindeck"
          className="bg-[#1f1f1f] border border-[#242424] inline-flex items-center text-[#bfbfbf] font-medium whitespace-pre"
          style={{ paddingInline: px(12), paddingBlock: px(6), borderRadius: px(16), fontSize: px(13) }}
        >
          ← Back to Solutions
        </Link>
        <p className="font-black text-[#0f6]" style={{ fontSize: px(22), letterSpacing: px(3) }}>
          B R A I N D E C K
        </p>
        <div className="flex items-center font-medium text-[#ccc] whitespace-nowrap" style={{ gap: px(36), fontSize: px(15) }}>
          {NAV_ITEMS.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>

      <Section bg="bg-[#080808]">
        <div className="flex flex-col items-center" style={{ gap: px(24), width: px(1000) }}>
          <div
            className="bg-[#003314] border border-[#006626] inline-flex items-start"
            style={{ paddingInline: px(14), paddingBlock: px(6), borderRadius: px(12) }}
          >
            <p className="font-bold uppercase text-[#0f6]" style={{ fontSize: px(12), letterSpacing: px(1.5) }}>
              Braindeck Secure Cloud
            </p>
          </div>
          <p className="font-extrabold text-white text-center" style={{ fontSize: px(54), lineHeight: 1.2 }}>
            AI-Powered Digital Content Protection Infrastructure
          </p>
          <p className="font-normal text-[#bfbfbf] text-center" style={{ fontSize: px(18), lineHeight: 1.6 }}>
            A next-generation copyright protection solution that preemptively blocks illegal leaks of digital content and uses AI to analyze
            patterns and routes to track the responsible parties if a leak occurs.
          </p>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center w-full" style={{ gap: px(48) }}>
          <SectionTitles eyebrow="Technology Comparison" title="Limitations of the Past vs. AI Infrastructure" />
          <div className="flex items-start" style={{ gap: px(32), width: px(1200) }}>
            <div className="bg-[#141414] border border-[#242424] flex-1 flex flex-col items-start" style={{ gap: px(32), padding: px(40), borderRadius: px(24) }}>
              <div className="flex items-center" style={{ gap: px(16) }}>
                <div className="bg-[#242424] flex items-center justify-center rounded-full" style={{ width: px(48), height: px(48) }}>
                  <Icon src={ICONS.alertTriangle} size={24} />
                </div>
                <p className="font-bold text-white" style={{ fontSize: px(22) }}>
                  Limitations of Existing Technology
                </p>
              </div>
              <div className="flex flex-col items-start w-full" style={{ gap: px(18) }}>
                {LIMITATIONS.map((text) => (
                  <ChecklistItem key={text} text={text} />
                ))}
              </div>
            </div>
            <div className="bg-[#0f6] border border-[#006626] flex-1 flex flex-col items-start" style={{ gap: px(32), padding: px(40), borderRadius: px(24) }}>
              <div className="flex items-center" style={{ gap: px(16) }}>
                <div className="bg-[#003314] flex items-center justify-center rounded-full" style={{ width: px(48), height: px(48) }}>
                  <Icon src={ICONS.shield} size={24} />
                </div>
                <p className="font-bold text-[#0d0d0d]" style={{ fontSize: px(22) }}>
                  Our AI-Powered Solution
                </p>
              </div>
              <div className="flex flex-col items-start w-full" style={{ gap: px(18) }}>
                {SOLUTIONS.map((text) => (
                  <ChecklistItem key={text} text={text} dark />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="bg-[#1a1a1a] border border-[#242424] flex flex-col items-start" style={{ gap: px(24), padding: px(48), borderRadius: px(24), width: px(1200) }}>
          <div className="flex items-center" style={{ gap: px(16) }}>
            <div className="bg-[#003314] flex items-center justify-center rounded-full" style={{ width: px(48), height: px(48) }}>
              <Icon src={ICONS.star} size={24} />
            </div>
            <p className="font-extrabold text-white" style={{ fontSize: px(24) }}>
              Our Approach
            </p>
          </div>
          <p className="font-normal text-[#bfbfbf]" style={{ fontSize: px(18), lineHeight: 1.6 }}>
            &ldquo;We place AI analysis technology at the center of protection, flexibly integrating proven global DRM and digital forensic
            technologies to provide copyright protection as platform infrastructure rather than just a solution. DRM serves as the control
            measure, while AI acts as the core engine for judgment, analysis, and tracking.&rdquo;
          </p>
        </div>
      </Section>

      <Section bg="bg-[#080808]">
        <div className="flex flex-col items-center w-full" style={{ gap: px(48) }}>
          <SectionTitles eyebrow="Core Competencies" title="Key Features" />
          <div className="flex items-stretch" style={{ gap: px(24), width: px(1200) }}>
            {FEATURE_CARDS.map((card) => (
              <FeatureCard key={card.title} title={card.title} items={card.items} />
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center w-full" style={{ gap: px(48) }}>
          <SectionTitles eyebrow="Deployment Flexibility" title="Flexible Delivery Models" />
          <div className="flex items-start" style={{ gap: px(32), width: px(1200) }}>
            <DeliveryCard
              badge="Enterprise API"
              title="Platform-Integrated Protection Infrastructure"
              subtitle="FOR LARGE CONTENT COMPANIES AND PLATFORMS"
              items={[
                "Seamless Integration via API / SDK",
                "Streaming and large-scale content protection",
                "Real-time monitoring and advanced analysis dashboards",
              ]}
            />
            <DeliveryCard
              badge="White-Label Web-App"
              badgeHighlight
              title="Dedicated Protected Web-App Delivery"
              subtitle="FOR CONTENT COMPANIES WITHOUT A PLATFORM"
              items={[
                "Provision of a dedicated protected web-app",
                "Unified process: Content upload → Protection → Distribution",
                "Immediate use without additional platform development",
              ]}
            />
          </div>
        </div>
      </Section>

      <Section bg="bg-[#080808]">
        <div className="flex flex-col items-center w-full" style={{ gap: px(40) }}>
          <SectionTitles eyebrow="Market Comparison" title="Specialized Protection Solutions by Industry" />
          <div className="flex flex-col items-start" style={{ gap: px(16), width: px(1200) }}>
            {INDUSTRIES.map((label) => (
              <IndustryAccordionRow key={label} label={label} />
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-center w-full" style={{ gap: px(48) }}>
          <SectionTitles eyebrow="How We Partner" title="Workflow — Service Process" />
          <div className="flex items-start" style={{ width: px(1200) }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <WorkflowStep key={step.number} {...step} showArrow={i < WORKFLOW_STEPS.length - 1} />
            ))}
          </div>
        </div>
      </Section>

      <Section bg="bg-[#0f0f0f]">
        <div className="flex flex-col items-start" style={{ gap: px(40), width: px(1040) }}>
          <div className="flex flex-col items-start" style={{ gap: px(12) }}>
            <p className="font-semibold uppercase text-[#0f6]" style={{ fontSize: px(11), letterSpacing: px(4) }}>
              F.A.Q
            </p>
            <p className="font-bold text-white" style={{ fontSize: px(36), lineHeight: px(44) }}>
              Frequently Asked Questions
            </p>
          </div>
          <div className="relative w-full" style={{ height: px(FAQ_ITEMS.length * 100) }}>
            {FAQ_ITEMS.map((question, i) => (
              <FaqAccordionItem key={question} question={question} left={0} top={i * 100} width={1040} />
            ))}
          </div>
        </div>
      </Section>

      <div className="flex flex-col items-center w-full" style={{ paddingInline: px(160), paddingBlock: px(120) }}>
        <div
          className="bg-[#1a1a1a] border border-[#242424] flex flex-col items-center"
          style={{ gap: px(32), padding: px(64), borderRadius: px(24), width: px(1200) }}
        >
          <div className="bg-[#003314] border border-[#006626] inline-flex items-start" style={{ paddingInline: px(14), paddingBlock: px(6), borderRadius: px(12) }}>
            <p className="font-bold uppercase text-[#0f6]" style={{ fontSize: px(12), letterSpacing: px(1) }}>
              Voucher Program
            </p>
          </div>
          <p className="font-extrabold text-white text-center" style={{ fontSize: px(32) }}>
            Experience this solution firsthand
          </p>
          <p className="font-normal text-[#bfbfbf] text-center" style={{ fontSize: px(16), lineHeight: 1.5, width: px(700) }}>
            Apply for our verified voucher program today and evaluate next-generation digital content protection tailored to your enterprise
            environment.
          </p>
          <div className="flex items-start justify-center w-full" style={{ gap: px(16) }}>
            <button type="button" className="bg-white text-[#0d0d0d] font-bold inline-flex items-start" style={{ paddingInline: px(32), paddingBlock: px(14), borderRadius: px(100), fontSize: px(14) }}>
              Request Demo
            </button>
            <button
              type="button"
              className="bg-[#1a1a24] border border-[#33334d] text-white font-bold inline-flex items-start"
              style={{ paddingInline: px(32), paddingBlock: px(14), borderRadius: px(100), fontSize: px(14) }}
            >
              Watch Tutorial
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#242424] flex items-center justify-between w-full text-[#8c8c8c]" style={{ paddingInline: px(160), paddingBlock: px(40), fontSize: px(14) }}>
        <p>© 2024 Braindeck Inc. All rights reserved.</p>
        <p>Privacy Policy &nbsp;&nbsp;&middot;&nbsp;&nbsp; Terms of Service &nbsp;&nbsp;&middot;&nbsp;&nbsp; Contact</p>
      </div>
    </div>
  );
}
