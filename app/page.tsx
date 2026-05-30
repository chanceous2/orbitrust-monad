import { LandingHero } from "@/components/landing/LandingHero";
import { LandingWhatIs } from "@/components/landing/LandingWhatIs";
import { LandingReviewSecurity } from "@/components/landing/LandingReviewSecurity";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingIntegrations } from "@/components/landing/LandingIntegrations";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div data-presentation-landing className="presentation-deck w-full">
      <LandingHero />
      <LandingWhatIs />
      <LandingComparison />
      <LandingIntegrations />
      <LandingReviewSecurity />
      <LandingFooter />
    </div>
  );
}
