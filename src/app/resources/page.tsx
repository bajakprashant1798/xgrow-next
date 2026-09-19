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
      {/* ========================================================================= */}
      {/* OPTION 1 (ACTIVE): Ambient Radial Glow & Surface Theme (Matches Homepage)  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cyan-500/15 via-surface to-background dark:from-cyan-950/40 dark:via-surface dark:to-background py-16 sm:py-24 border-b border-border">
        {/* Ambient Brand Radial Glow Effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 h-[42rem] w-[54rem] rounded-full opacity-30 dark:opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 60%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-20 h-[36rem] w-[36rem] rounded-full opacity-25 dark:opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent 65%)" }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
          <Reveal className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan mb-4 shadow-sm">
              <Gift className="h-4 w-4 text-cyan" />
              <span>100% FREE DIGITAL RESOURCES & DOWNLOADS</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              XGRO <span className="text-gradient-brand">Free Resources Hub</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Download AI prompts, Canva templates, PDF guides, tools, and marketing checklists — completely free in one central hub!
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* OPTION 2 (ALTERNATIVE / COMMENTED OUT): Full Top-to-Bottom Gradient Banner*/}
      {/* Uncomment this section below and comment out Option 1 above if needed.    */}
      {/* ========================================================================= */}
      {/*
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0369a1] via-[#0284c7] via-[#0ea5e9]/60 via-[#38bdf8]/15 to-background dark:from-[#082f49] dark:via-[#0c4a6e]/90 dark:via-[#0f172a]/95 dark:to-background pt-16 pb-20 sm:pt-20 sm:pb-28 text-white border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.25),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_60%,transparent_100%)] opacity-70"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
          <Reveal className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white mb-5 backdrop-blur-md shadow-lg shadow-sky-950/10">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200 fill-cyan-200/30" />
              <span>100% FREE DIGITAL RESOURCES & DOWNLOADS</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-sm">
              XGRO <span className="text-cyan-200 dark:text-cyan">Free Resources Hub</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-sky-50/95 dark:text-slate-200 font-medium max-w-2xl mx-auto">
              Download AI prompts, Canva templates, PDF guides, tools, and marketing checklists — completely free in one central hub!
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-bold text-white/95">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 backdrop-blur-sm shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" /> Free Instant Downloads
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 backdrop-blur-sm shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" /> No Credit Card Required
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 backdrop-blur-sm shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" /> Verified 2026 Edition
              </span>
            </div>
          </Reveal>
        </div>
      </section>
      */}

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
            <div className="rounded-3xl border border-cyan/40 bg-radial from-slate-900 via-slate-950 to-[#0B1120] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
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
