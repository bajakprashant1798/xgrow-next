import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Calculator as CalcIcon, Gift, Download, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { CostCalculator } from "@/components/calculator/CostCalculator";
import { FaqSection } from "@/components/home/FaqSection";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI Website Cost Calculator — Instant Cost Estimator & Quote | XGRO",
  description:
    "Calculate your website, e-commerce, or AI chatbot build cost in 30 seconds. Instant price range estimator with downloadable PDF quote & 15% discount coupon.",
  alternates: {
    canonical: "/calculator",
  },
};

export default function CalculatorPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-background py-16 sm:py-24 text-white border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
          <Reveal className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1.5 text-xs font-bold text-cyan mb-4">
              <CalcIcon className="h-4 w-4" /> AI POWERED INSTANT ESTIMATOR ⭐⭐⭐⭐⭐
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white">
              Website & Software <span className="text-cyan">Cost Calculator</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
              Calculate your exact project investment range in real time. Choose your business type, pages, payment gateways, admin panel, and AI features to download a custom quotation PDF with a <strong className="text-cyan">15% Discount Voucher</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan" /> 100% Transparent Rates
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan" /> Instant PDF Download
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan" /> 15% Discount Voucher Code
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main Interactive Cost Calculator Component */}
      <section className="py-16 sm:py-24 bg-background">
        <Reveal>
          <CostCalculator />
        </Reveal>
      </section>

      {/* Resource Banner CTA */}
      <section className="py-12 bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-cyan/30 bg-card p-6 sm:p-8">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan">
                Need Full Pricing Details?
              </span>
              <h3 className="text-xl font-black text-foreground">
                Download Official XGRO Price List & Rate Card 2026
              </h3>
              <p className="text-xs text-muted-foreground">
                Explore fixed package prices, retainers, and AI service rate cards in a single PDF.
              </p>
            </div>
            <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 py-5">
              <Link href="/resources">
                <Download className="mr-2 h-4 w-4" /> Download Price List
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* FAQs Section */}
      <FaqSection />
    </div>
  );
}
