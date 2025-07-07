
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingCTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { WebVMPreview } from "@/components/landing/webvm-preview";
import { WorkspaceShowcase } from "@/components/landing/workspace-showcase";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <WebVMPreview />
        <WorkspaceShowcase />
        <LandingTestimonials />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
