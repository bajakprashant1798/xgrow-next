import type { Metadata } from "next";
import Link from "next/link";
import { Download, Sparkles, Calculator as CalcIcon } from "lucide-react";
import { PricingPreview } from "@/components/home/PricingPreview";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { FaqSection } from "@/components/home/FaqSection";
import { Reveal } from "@/components/site/Reveal";
import { CostCalculator } from "@/components/calculator/CostCalculator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing Packages & AI Cost Calculator — Fixed Agency Rates | XGRO",
  description: "Starter, Growth, and Scale plans mapped to your business size. Use our AI website cost calculator to estimate custom quote & download price list.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Simple plans & Calculator</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Transparent investment, zero surprises
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Review our package options below, calculate your custom website cost interactively, or download our official 2026 Price List.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 py-5 shadow-lg">
                <a href="#calculator">
                  <CalcIcon className="mr-2 h-4 w-4" /> AI Cost Calculator
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border font-bold text-xs px-6 py-5">
                <Link href="/resources">
                  <Download className="mr-2 h-4 w-4 text-cyan" /> Download Price List PDF
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing Tier Summary Cards */}
      <PricingPreview />

      {/* Interactive AI Website Cost Calculator */}
      <section id="calculator" className="bg-surface py-20 border-t border-border">
        <Reveal>
          <CostCalculator />
        </Reveal>
      </section>

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

