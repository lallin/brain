import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteEditsHydrator } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/editable/SiteEditsHydrator";
import "./globals.css";

const overusedGrotesk = localFont({
  variable: "--font-overused-grotesk",
  src: [
    {
      path: "../../public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/fonts/OverusedGrotesk-Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/fonts/OverusedGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/fonts/OverusedGrotesk-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  display: "optional",
});

const jetBrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  src: [
    {
      path: "../../public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/fonts/JetBrainsMono-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/sites/boilerlab-ai-93c3cf36/root-8a5edab2/fonts/JetBrainsMono-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boiler Lab | AI startups at rocket speed",
  description:
    "We build AI products used by over 20 million people globally — private, fast, and built to scale.",
  icons: {
    icon: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/seo/favicon-black.png",
  },
  manifest: "/sites/boilerlab-ai-93c3cf36/root-8a5edab2/seo/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${overusedGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full">
        <SiteEditsHydrator />
        {children}
      </body>
    </html>
  );
}
