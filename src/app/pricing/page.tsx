import type { Metadata } from "next";
import { PricingPreview } from "@/components/home/PricingPreview";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { FaqSection } from "@/components/home/FaqSection";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Pricing Packages — Fixed, Honest Agency Rates | XGRO",
  description: "Starter, Growth, and Scale plans mapped to your business size. Google, Meta ads, SEO, and AI automation rates.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col pt-10">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Simple plans</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Transparent investment, zero surprises
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We focus on building value. Review our package options below, and explore the complete feature comparison list.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pricing Tier Summary Cards */}
      <PricingPreview />

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal className="mx-auto max-w-3xl text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Feature comparison</p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Compare plans side-by-side
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            See exactly what goes into each build level. Feel free to ask about custom hybrid additions.
          </p>
        </Reveal>

        <Reveal>
          <ComparisonTable />
        </Reveal>
      </section>

      {/* FAQs Section */}
      <div className="border-t border-border">
        <FaqSection />
      </div>
    </div>
  );
}
