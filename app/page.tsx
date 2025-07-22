
import { LandingNavbar } from "@/components/landing/navbar";
import { EnhancedLandingHero } from "@/components/landing/enhanced-hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { LandingPricing } from "@/components/landing/pricing";
import { EnhancedLandingCTA } from "@/components/landing/enhanced-cta";
import { LandingFooter } from "@/components/landing/footer";
import { WebVMPreview } from "@/components/landing/webvm-preview";
import { WorkspaceShowcase } from "@/components/landing/workspace-showcase";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main>
        <EnhancedLandingHero />
        <LandingFeatures />
        <WebVMPreview />
        <WorkspaceShowcase />
        <LandingTestimonials />
        <LandingPricing />
        <EnhancedLandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
