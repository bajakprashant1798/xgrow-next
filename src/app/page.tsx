import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { TrustedBy } from "@/components/home/TrustedBy";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { ServicesStrip } from "@/components/home/ServicesStrip";
import { ScrollStory } from "@/components/home/ScrollStory";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Process } from "@/components/home/Process";
import { PortfolioPreview } from "@/components/home/PortfolioPreview";
import { TeamShowcase } from "@/components/home/TeamShowcase";
import { Testimonials } from "@/components/home/Testimonials";
import { PricingPreview } from "@/components/home/PricingPreview";
import { FaqSection } from "@/components/home/FaqSection";
import { ContactCta } from "@/components/home/ContactCta";
import { getServerActiveHeroBanner } from "@/lib/server-hero-banners";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "XGRO — Digital Growth Agency in Moradabad | Websites, SEO & AI",
  description:
    "XGRO builds conversion-focused websites, branding, SEO and AI automation for businesses across India and the USA. Fixed pricing, fast delivery, real leads.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const activeHeroBanner = await getServerActiveHeroBanner();

  return (
    <>
      <Hero initialActiveBanner={activeHeroBanner} />
      <TrustedBy />
      <ServicesOverview />
      <ServicesStrip />
      <ScrollStory />
      <WhyChoose />
      <Process />
      <PortfolioPreview />
      <TeamShowcase />
      <Testimonials />
      <PricingPreview />
      <FaqSection />
      <ContactCta />
    </>
  );
}

