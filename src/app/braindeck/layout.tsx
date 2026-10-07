import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-braindeck-inter" });

export const metadata: Metadata = {
  title: "Braindeck | Inspiring the Next",
  description: "Trusted human-centered AI solutions for media, healthcare, and enterprise.",
};

export default function BraindeckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-[family-name:var(--font-braindeck-inter)] bg-[#0a0a0a]`}>{children}</div>
  );
}
