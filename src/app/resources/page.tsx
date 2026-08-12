import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Download,
  Gift,
  Sparkles,
  Bot,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  PlayCircle,
} from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { CostCalculator } from "@/components/calculator/CostCalculator";
import { FaqSection } from "@/components/home/FaqSection";
import { ResourceDownloadTriggerButton } from "@/components/resources/ResourceDownloadTriggerButton";

export const metadata: Metadata = {
  title: "Free Resources Hub — Prompts, Canva Templates & PDF Guides | XGRO",
  description:
    "Free AI prompts, Canva templates, PDF guides, marketing checklists, website tools, and official XGRO price list. Everything featured in our Instagram & YouTube videos in one place.",
  alternates: {
    canonical: "/resources",
  },
};

export default function ResourcesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-background py-16 sm:py-24 text-white border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
          <Reveal className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1.5 text-xs font-bold text-cyan mb-4">
              <Gift className="h-4 w-4" /> 100% FREE DIGITAL RESOURCES & DOWNLOADS
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white">
              XGRO <span className="text-cyan">Free Resources Hub</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
              Download AI prompts, Canva templates, PDF guides, tools, and marketing checklists — completely free in one central hub!
            </p>
          </Reveal>
        </div>
      </section>

      {/* Main Resource Center Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-3xl text-center mb-10">
            <p className="text-xs font-extrabold uppercase tracking-widest text-cyan">
              Search & Filter Resources
            </p>
            <h2 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
              Explore Prompts, Templates & Checklists
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Select a category below or search by keyword to get instant access to files, prompts, and templates.
            </p>
          </Reveal>

          <ResourceGrid />
        </div>
      </section>

      {/* Featured Price List & Rate Card Download Banner */}
      <section className="py-12 bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-cyan/40 bg-radial from-slate-900 via-slate-950 to-background p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan text-slate-950 font-black px-3 py-1 text-xs uppercase tracking-wider">
                    ★ OFFICIAL AGENCY PRICE LIST
                  </span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> 2026 Edition
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Download Official XGRO Price List & Rate Card
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Looking to hire XGRO for Web Development, E-Commerce, SEO, or AI Bots? Download our complete package rates and claim an instant <strong className="text-cyan">15% Discount Coupon</strong>.
                </p>
              </div>

              <div className="w-full lg:w-auto shrink-0">
                <ResourceDownloadTriggerButton
                  resourceTitle="Official Price List & Rate Card 2026"
                  type="pricelist"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQs Section */}
      <FaqSection />
    </div>
  );
}
