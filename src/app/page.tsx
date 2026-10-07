import { IBM_Plex_Sans_KR, Inter, Space_Grotesk, Syne } from "next/font/google";
import { BoilerLabScrollApp } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2-scroll/BoilerLabScrollApp";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/boilerlab.css";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/product-gallery.css";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2-scroll/boilerlab-scroll.css";
import { NoticeCurtain } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2-scroll/NoticeCurtain";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2-scroll/notice-curtain.css";

// "Horizon" type for the main page only (see boilerlab-scroll.css →
// Typography): Syne for titles, Inter for body copy, Space Grotesk for
// labels/buttons. Only the weights in use are loaded.
const syne = Syne({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-syne", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500"], variable: "--font-space-grotesk", display: "swap" });
// Notice curtain (NoticeCurtain.tsx) keeps its original Korean typeface.
const plexKr = IBM_Plex_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-kr", display: "swap", preload: false });

// The scroll-native version (formerly at /scroll) is now the main page.
// The original fixed slide deck moved to /classic.
export default function Home() {
  return (
    <div className={`contents ${syne.variable} ${inter.variable} ${spaceGrotesk.variable} ${plexKr.variable}`}>
      <NoticeCurtain />
      <BoilerLabScrollApp />
    </div>
  );
}
