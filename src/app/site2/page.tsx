import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site 2 (placeholder)",
  description: "Reserved route for a second site — not cloned yet.",
};

// Placeholder for a second, independent site living alongside the one at
// "/" — no target has been chosen yet. Once given a URL (or specific
// sections to pull from one or more sites), this becomes a real page,
// following the same pattern as the boilerlab-ai clone: its own
// src/components/sites/<slug>/ folder, its own assets under public/sites/,
// left entirely separate from that existing site's code.
export default function Site2Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">/site2</p>
      <h1 className="text-2xl font-semibold">Second site placeholder (still empty)</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Tell us which site, or which parts of it, to bring in and this page will be filled in.
      </p>
    </main>
  );
}
