"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Code2,
  Bot,
  Search,
  Palette,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Gauge,
  ArrowRight,
  Crown,
  FileText,
  Share2,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

export function ServicesOverview() {
  const [servicesList, setServicesList] = useState<ServiceModel[]>([]);

  const loadServices = async () => {
    const data = await getServices();
    const published = data.filter((s) => s.status === "published");
    setServicesList(published.length > 0 ? published : (fallbackServices as any));
  };

  useEffect(() => {
    loadServices();
    return subscribeToDataChanges(loadServices);
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);

  // Helper to extract service details by slug or fallback index
  const getService = (slug: string, fallbackIdx: number) => {
    return displayServices.find((s: any) => s.slug === slug) || displayServices[fallbackIdx] || fallbackServices[fallbackIdx];
  };

  const webDev = getService("website-development", 0);
  const aiBot = getService("ai-automation", 4);
  const seo = getService("seo", 3);
  const design = getService("graphic-design", 1);
  const marketing = getService("digital-marketing", 5);
  const branding = getService("branding", 6);
  const content = getService("content-marketing", 2);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      {/* Ambient background decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 h-96 w-[48rem] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 70%)" }}
      />

      <SectionHeading
        eyebrow="Capabilities & Architecture"
        title="Everything your business needs to grow online"
        sub="Engineered for maximum conversion and speed. Explore all 7 growth modules or let us construct your complete autonomous growth engine."
        action={
          <Button asChild variant="outline" className="rounded-full border-cyan/40 hover:border-cyan hover:bg-cyan/10">
            <Link href="/services" className="flex items-center gap-1.5 font-bold text-xs">
              Explore All Services <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* BENTO GRID CONTAINER */}
      <div className="relative mt-12 grid grid-cols-1 gap-5 md:grid-cols-12 lg:gap-6">
        {/* ========================================================================= */}
        {/* ROW 1 — BENTO 1: High-Performance Web & App Development (7-Col Span)       */}
        {/* ========================================================================= */}
        <Reveal className="md:col-span-12 lg:col-span-7">
          <Link
            href={`/services#${webDev?.slug || "website-development"}`}
            className="group relative flex h-full min-h-[390px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-cyan/15 blur-3xl group-hover:bg-cyan/25 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan">
                  <Code2 className="h-3.5 w-3.5 text-cyan" /> Web Engineering
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <h3 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {webDev?.title || "Website & Web App Development"}
              </h3>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {webDev?.short_description || webDev?.blurb || "High-speed, conversion-first business sites, SaaS web apps, and ecommerce stores built with Next.js to turn traffic into qualified revenue."}
              </p>
            </div>

            {/* Interactive Speed & Architecture Mockup Box */}
            <div className="mt-6 rounded-2xl border border-border/70 bg-surface/90 p-4 backdrop-blur-sm shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground ml-1.5">xgro-stack.config.ts</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Gauge className="h-3.5 w-3.5" /> 99+ Core Web Vitals
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">Next.js 16</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">React 19</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">Tailwind CSS</span>
                  <span className="rounded-md bg-cyan/15 text-cyan-800 dark:text-cyan border border-cyan/20 px-2 py-0.5 text-[10px] font-bold">&lt; 1.2s Load Time</span>
                </div>
                <span className="font-extrabold text-cyan text-xs">
                  {webDev?.price ? webDev.price : "From ₹14,999"}
                </span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 1 — BENTO 2: AI Automation & WhatsApp Lead Bots (5-Col Span)           */}
        {/* ========================================================================= */}
        <Reveal delay={80} className="md:col-span-12 lg:col-span-5">
          <Link
            href={`/services#${aiBot?.slug || "ai-automation"}`}
            className="group relative flex h-full min-h-[390px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-cyan/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Bot className="h-3.5 w-3.5" /> AI & WhatsApp
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <h3 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {aiBot?.title || "AI & WhatsApp Automation"}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {aiBot?.short_description || aiBot?.blurb || "Intelligent 24/7 AI agents that capture leads, auto-respond on WhatsApp, and schedule meetings without human intervention."}
              </p>
            </div>

            {/* Simulated WhatsApp / AI Live Chat Widget */}
            <div className="mt-6 space-y-2 rounded-2xl border border-border/70 bg-surface/90 p-3.5 backdrop-blur-sm text-xs shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-1.5 border-b border-border/50">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 24/7 Live AI Agent
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Instant Response</span>
              </div>

              <div className="space-y-1.5">
                <div className="rounded-xl bg-secondary/90 p-2.5 text-[11px] text-secondary-foreground leading-snug w-[88%]">
                  👋 "Hi! Need an instant quotation for our business web app."
                </div>
                <div className="ml-auto rounded-xl bg-cyan/15 border border-cyan/30 p-2.5 text-[11px] text-foreground leading-snug w-[92%] shadow-sm">
                  ⚡ "Custom proposal & quotation prepared in 10s. Connecting to WhatsApp..."
                </div>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 2 — BENTO 3: Local SEO & Google Maps Dominance (4-Col Span)             */}
        {/* ========================================================================= */}
        <Reveal delay={120} className="md:col-span-6 lg:col-span-4">
          <Link
            href={`/services#${seo?.slug || "seo"}`}
            className="group relative flex h-full min-h-[330px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <Search className="h-3 w-3" /> SEO & Google Maps
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {seo?.title || "Search Engine Optimization (SEO)"}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {seo?.short_description || seo?.blurb || "Dominate Google Search and Google Maps in your target cities with high-ranking keywords & local schema."}
              </p>
            </div>

            {/* Google Maps / Local SEO Metric Card */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-surface/90 p-3.5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> #1 Local 3-Pack
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  +240% Inbound Calls
                </span>
              </div>
              <div className="mt-2.5 text-[11px] text-muted-foreground flex flex-wrap gap-1.5">
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Google Business Profile</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">City Keywords</span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 2 — BENTO 4: Graphic Design & Creative Studio (4-Col Span)             */}
        {/* ========================================================================= */}
        <Reveal delay={160} className="md:col-span-6 lg:col-span-4">
          <Link
            href={`/services#${design?.slug || "graphic-design"}`}
            className="group relative flex h-full min-h-[330px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Palette className="h-3 w-3" /> Creative Studio
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {design?.title || "Graphic Design & Creatives"}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {design?.short_description || design?.blurb || "High-end visual identity, modern logo systems, social media creatives, and premium print packaging."}
              </p>
            </div>

            {/* Design Swatch / Palette Widget */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-surface/90 p-3.5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                <span>Visual Creative Suite</span>
                <span className="text-[10px] text-cyan-800 dark:text-cyan font-mono">Figma + Ai</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-cyan shadow-sm" title="Cyan Accent" />
                <div className="h-5 w-5 rounded-full bg-indigo-500 shadow-sm" title="Indigo Primary" />
                <div className="h-5 w-5 rounded-full bg-slate-900 border border-border shadow-sm" title="Deep Slate" />
                <div className="h-5 w-5 rounded-full bg-emerald-400 shadow-sm" title="Emerald Accent" />
                <span className="text-[10px] text-muted-foreground ml-auto font-medium">Print CMYK Ready</span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 2 — BENTO 5: Digital Marketing & Meta Ads (4-Col Span)                 */}
        {/* ========================================================================= */}
        <Reveal delay={200} className="md:col-span-12 lg:col-span-4">
          <Link
            href={`/services#${marketing?.slug || "digital-marketing"}`}
            className="group relative flex h-full min-h-[330px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <TrendingUp className="h-3 w-3" /> Performance Ads
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {marketing?.title || "Digital Marketing & Ads"}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {marketing?.short_description || marketing?.blurb || "High-ROAS Meta & Google ad campaigns engineered around cost per qualified lead, not vanity impressions."}
              </p>
            </div>

            {/* Ads ROAS Metric Box */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-surface/90 p-3.5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> 4.8x Average ROAS
                </span>
                <span className="text-[10px] font-bold text-cyan-800 dark:text-cyan bg-cyan/10 border border-cyan/20 px-2 py-0.5 rounded-full">
                  Targeted Funnels
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="text-[10px] font-medium">Meta & Google Ads</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">High Intent Leads</span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 3 — BENTO 6: Brand Identity & Positioning (6-Col Span)                 */}
        {/* ========================================================================= */}
        <Reveal delay={220} className="md:col-span-12 lg:col-span-6">
          <Link
            href={`/services#${branding?.slug || "branding"}`}
            className="group relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-12 -bottom-12 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-cyan/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  <Crown className="h-3 w-3" /> Brand Architecture
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {branding?.title || "Branding & Identity Systems"}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {branding?.short_description || branding?.blurb || "Complete identity systems, vector logo suites, brand books, and packaging designed to elevate pricing power."}
              </p>
            </div>

            {/* Brand Architecture Mockup Card */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-surface/90 p-3.5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/50 text-[11px]">
                <span className="font-bold text-foreground">Brand Guidelines & Assets</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">100% Vector Ownership</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Typography Scale</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Logo Formats (SVG/PNG)</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Stationery & Packaging</span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 3 — BENTO 7: Content Marketing & Copywriting (6-Col Span)              */}
        {/* ========================================================================= */}
        <Reveal delay={240} className="md:col-span-12 lg:col-span-6">
          <Link
            href={`/services#${content?.slug || "content-marketing"}`}
            className="group relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-surface/80 to-card p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan/70 hover:shadow-2xl hover:shadow-cyan/10"
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-52 w-52 rounded-full bg-cyan/10 blur-3xl group-hover:bg-cyan/20 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan">
                  <FileText className="h-3 w-3 text-cyan" /> Content Marketing
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground group-hover:bg-cyan group-hover:text-slate-950 transition-all duration-300">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-cyan transition-colors">
                {content?.title || "Content Marketing & SEO Copy"}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {content?.short_description || content?.blurb || "High-ranking search engine articles, conversion copywriting, and viral social hooks that sell while you sleep."}
              </p>
            </div>

            {/* Content Marketing Metric Card */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-surface/90 p-3.5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/50 text-[11px]">
                <span className="font-bold text-foreground">Organic Search & Copy</span>
                <span className="text-cyan-800 dark:text-cyan font-bold text-[10px]">+380% Organic Reach</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">SEO Pillar Blogs</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Conversion Copywriting</span>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Email Funnels</span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* ========================================================================= */}
        {/* ROW 4 — BENTO 8: Full-Suite Growth Ecosystem Callout Banner (12-Col Span)  */}
        {/* ========================================================================= */}
        <Reveal delay={260} className="md:col-span-12">
          <div className="group relative flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden rounded-3xl border border-cyan/30 bg-gradient-to-r from-card via-surface to-card p-6 sm:p-8 shadow-lg">
            {/* Top Glow Accent */}
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan/15 blur-2xl" />

            <div className="space-y-2 max-w-2xl relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan/15 border border-cyan/30 px-3 py-1 text-xs font-bold text-cyan-800 dark:text-cyan">
                <Sparkles className="h-3.5 w-3.5 text-cyan" /> Complete Growth Ecosystem
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-foreground">
                Need a custom full-stack growth bundle for your business?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Combine Web Development, SEO, AI Automation, Branding, and Marketing Retainers with unified billing and a dedicated growth strategist.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 shrink-0">
              <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-extrabold text-xs px-6 py-5 shadow-lg shadow-cyan/20">
                <Link href="/calculator">
                  <Zap className="mr-1.5 h-4 w-4" /> Calculate Project Cost
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-border/80 hover:border-cyan/60 font-bold text-xs px-6 py-5">
                <Link href="/contact" className="flex items-center gap-1.5">
                  Book Free Consultation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}