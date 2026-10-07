import { notFound } from "next/navigation";
import { SolutionPageChrome } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/SolutionPageChrome";
import { CategoryHubView } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/CategoryHubView";
import { CATEGORY_HUBS, getCategoryHub } from "@/components/sites/boilerlab-ai-93c3cf36/solutions-data";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/boilerlab.css";
import "@/components/sites/boilerlab-ai-93c3cf36/solutions.css";

export function generateStaticParams() {
  return CATEGORY_HUBS.map((c) => ({ slug: c.slug }));
}

export default async function CategoryHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getCategoryHub(slug)) notFound();

  return (
    <SolutionPageChrome>
      <CategoryHubView slug={slug} />
    </SolutionPageChrome>
  );
}
