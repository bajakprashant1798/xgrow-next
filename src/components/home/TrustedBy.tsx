"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Hotel,
  GraduationCap,
  BookOpen,
  Brain,
  Compass,
  Activity,
  Gem,
  Globe,
  Building2,
  ShieldCheck,
  Building,
  Sparkles,
  Laptop,
  Briefcase,
  Zap,
  ShoppingBag,
  Stethoscope,
  Plane,
  Truck,
  Layers,
} from "lucide-react";
import type { ComponentType } from "react";
import { getTrustedLogos, getTrustedSectionTitle, subscribeToDataChanges } from "@/lib/db";
import { initialTrustedLogos } from "@/lib/seed-data";
import { TrustedLogoModel } from "@/lib/supabase/types";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Hotel,
  GraduationCap,
  BookOpen,
  Brain,
  Compass,
  Activity,
  Gem,
  Globe,
  Building2,
  ShieldCheck,
  Sparkles,
  Building,
  Laptop,
  Briefcase,
  Zap,
  ShoppingBag,
  Stethoscope,
  Plane,
  Truck,
  Layers,
};

export function TrustedBy() {
  const [logos, setLogos] = useState<TrustedLogoModel[]>(() =>
    initialTrustedLogos.filter((l) => l.status === "published")
  );
  const [sectionTitle, setSectionTitle] = useState<string>("Trusted by growing businesses across India & USA");

  useEffect(() => {
    const loadData = async () => {
      const [data, title] = await Promise.all([getTrustedLogos(), getTrustedSectionTitle()]);
      const published = data.filter((l) => l.status === "published");
      if (published.length > 0) {
        setLogos(published);
      }
      if (title) {
        setSectionTitle(title);
      }
    };

    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Multiply items for seamless infinite looping
  const displayItems = logos.length > 0 ? logos : initialTrustedLogos;
  const marqueeItems = [...displayItems, ...displayItems, ...displayItems, ...displayItems];

  return (
    <section className="relative overflow-hidden border-y border-border bg-background/90 py-12" aria-label="Clients we work with">
      {/* Left and Right Fade Overlays for Smooth Edge Masking */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 sm:w-44 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 sm:w-44 bg-gradient-to-l from-background to-transparent" />

      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan">
          {sectionTitle}
        </p>
      </div>

      {/* Marquee Continuous Container (Moving Right to Left, Smooth Speed) */}
      <div className="mt-8 flex overflow-hidden">
        <div className="animate-marquee-left flex gap-5 sm:gap-7 py-3">
          {marqueeItems.map((c, idx) => {
            const IconComp = (c.icon && iconMap[c.icon]) ? iconMap[c.icon]! : Building;
            const hasLogo = Boolean(c.logo_url && c.logo_url.trim().length > 0);

            const Content = (
              <div
                key={`${c.id || c.name}-${idx}`}
                className="group flex shrink-0 items-center gap-3.5 rounded-2xl border border-border/80 bg-surface/95 px-4.5 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan/60 hover:bg-card hover:shadow-lg"
              >
                {hasLogo ? (
                  <div className="flex h-13 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <img
                      src={c.logo_url!}
                      alt={c.name}
                      className="h-11 w-auto max-w-[150px] object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-slate-950 transition-colors">
                    <IconComp className="h-5.5 w-5.5" />
                  </div>
                )}

                <div className="text-left">
                  <p className="whitespace-nowrap font-display text-sm font-extrabold text-foreground group-hover:text-cyan transition-colors">
                    {c.name}
                  </p>
                  {c.note && (
                    <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                      {c.note}
                    </p>
                  )}
                </div>
              </div>
            );

            if (c.website_url) {
              return (
                <a
                  key={`${c.id || c.name}-${idx}`}
                  href={c.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus:outline-none"
                >
                  {Content}
                </a>
              );
            }

            return Content;
          })}
        </div>
      </div>
    </section>
  );
}