import { BoilerLabApp } from "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/BoilerLabApp";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/boilerlab.css";
import "@/components/sites/boilerlab-ai-93c3cf36/root-8a5edab2/product-gallery.css";

// The original fixed, wheel/keyboard-driven slide deck (pixel-perfect
// emulation of boilerlab.ai). Moved here when the scroll-native version
// (previously at /scroll) became the main "/" page — kept as a reference/
// fallback rather than deleted.
export default function ClassicPage() {
  return <BoilerLabApp />;
}
