import { notFound } from "next/navigation";
import { SolutionPageChrome } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SolutionPageChrome";
import { SolutionDetailView } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SolutionDetailView";
import { getSolution, SOLUTIONS } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/boilerlab.css";
import "@/components/sites/boilerlab-ai-93c3cf36/solutions.css";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getSolution(slug)) notFound();

  return (
    <SolutionPageChrome>
      <SolutionDetailView slug={slug} />
    </SolutionPageChrome>
  );
}
