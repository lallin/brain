import { HeroSection } from "@/components/sites/braindeck/HeroSection";
import { CoreSolutionsSection } from "@/components/sites/braindeck/CoreSolutionsSection";
import { VoucherIntroSection } from "@/components/sites/braindeck/VoucherIntroSection";
import { CarouselSection } from "@/components/sites/braindeck/CarouselSection";
import { HealthcareSection } from "@/components/sites/braindeck/HealthcareSection";
import { EnterpriseSection } from "@/components/sites/braindeck/EnterpriseSection";
import { AwardsTrustSection } from "@/components/sites/braindeck/AwardsTrustSection";

/**
 * Section order follows the Figma canvas's own left-to-right x positions
 * (hero 8126 -> page2 10246 -> voucher-intro 12346 -> carousel-main-1..4
 * 16546-31246 -> transition-media-to-healthcare 33346 ->
 * healthcare-main-1/2 35446-39646 -> transition-healthcare-to-enterprise
 * 42796 -> enterprise-main-1/2 45946-50146 -> awards-trust-main 54206),
 * which is the file's own record of the intended scroll sequence.
 */
export default function BraindeckPage() {
  return (
    <main className="snap-y snap-mandatory overflow-y-auto h-screen">
      <section className="snap-start">
        <HeroSection />
      </section>
      <section className="snap-start">
        <CoreSolutionsSection />
      </section>
      <section className="snap-start">
        <VoucherIntroSection />
      </section>
      <section id="section-media" className="snap-start">
        <CarouselSection />
      </section>
      <section id="section-healthcare" className="snap-start">
        <HealthcareSection />
      </section>
      <section id="section-enterprise" className="snap-start">
        <EnterpriseSection />
      </section>
      <section className="snap-start">
        <AwardsTrustSection />
      </section>
    </main>
  );
}
