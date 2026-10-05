"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Star, Sparkles, CheckCircle2, Tag } from "lucide-react";
import { Counter, Reveal } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";
import { site, stats } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { getActiveHeroBanner, subscribeToDataChanges } from "@/lib/db";
import { HeroBannerModel } from "@/lib/supabase/types";
import { initialHeroBanners } from "@/lib/seed-data";

export function Hero() {
  const { t } = useLang();
  const [activeBanner, setActiveBanner] = useState<HeroBannerModel>(initialHeroBanners[0]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBanner() {
      try {
        const banner = await getActiveHeroBanner();
        if (isMounted && banner) {
          setActiveBanner(banner);
          setImageError(false);
        }
      } catch (err) {
        console.warn("Failed to load active hero banner:", err);
      }
    }
    loadBanner();
    return subscribeToDataChanges(loadBanner);
  }, []);

  const isCustomOfferBanner = !activeBanner?.is_default && activeBanner?.id !== "hero-default";
  const displayImageUrl = activeBanner?.image_url || "/home/hero.png";

  return (
    <section className="relative overflow-hidden bg-surface pt-12 pb-16 sm:pt-20 sm:pb-24">
      {/* Background Radial Glow Effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 h-[42rem] w-[54rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Centered Hero Header Content (AiSensy Style) */}
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan animate-pulse" />
              <span>
                {activeBanner?.badge_text?.trim()
                  ? activeBanner.badge_text
                  : "5X Your Business Revenue with AI & High-Converting Web Engine"}
              </span>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {t("hero.title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-gradient-brand">{t("hero.title").split(" ").slice(-1)}</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
              {t("hero.sub")}
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={180}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <Button asChild size="lg" className="h-13 rounded-full px-7 text-base font-bold shadow-lg shadow-cyan/20">
                <Link href="/contact" className="flex items-center gap-2">
                  {t("cta.consultation")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 rounded-full px-7 text-base font-semibold border-cyan/40 hover:border-cyan hover:bg-cyan/10">
                <a href={site.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-cyan" />
                  {t("cta.whatsapp")}
                </a>
              </Button>
            </div>
          </Reveal>

          {/* Trust Badges */}
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <span className="flex" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-cyan text-cyan" />
                  ))}
                </span>
                Rated 4.9/5 by 500+ clients
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> Serving {site.countries}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> 1-Hour Response Time
              </span>
            </div>
          </Reveal>
        </div>

        {/* Featured Image Showcase Below Hero Text */}
        <Reveal delay={300} className="mt-12 sm:mt-16">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl">
            {activeBanner?.badge_text?.trim() && (
              <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/50 bg-slate-950/85 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-cyan backdrop-blur-md shadow-xl">
                  <Sparkles className="h-3.5 w-3.5 text-cyan animate-pulse" />
                  {activeBanner.badge_text}
                </span>
              </div>
            )}
            {activeBanner?.link_url ? (
              <Link
                href={activeBanner.link_url}
                className="block relative cursor-pointer"
                target={activeBanner.link_url.startsWith("http") ? "_blank" : undefined}
                rel={activeBanner.link_url.startsWith("http") ? "noreferrer" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImageUrl}
                  alt={activeBanner?.title || "XGRO AI Platform & Agency Growth Suite"}
                  className="w-full h-auto object-cover rounded-3xl"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/home/hero.png")) {
                      target.src = "/home/hero.png";
                    }
                  }}
                />
              </Link>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={displayImageUrl}
                alt={activeBanner?.title || "XGRO AI Platform & Agency Growth Suite"}
                className="w-full h-auto object-cover rounded-3xl"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("/home/hero.png")) {
                    target.src = "/home/hero.png";
                  }
                }}
              />
            )}
          </div>
        </Reveal>

        {/* Key Stats Bar Below Hero Image */}
        <Reveal delay={360} className="mt-12 sm:mt-16">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-center shadow-sm transition-all duration-300 hover:border-cyan/50 hover:shadow-lg"
              >
                <dd className="font-display text-3xl font-black text-gradient-brand sm:text-4xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </dd>
                <dt className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
                  {s.label}
                </dt>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}