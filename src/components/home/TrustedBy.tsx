"use client";

import Image from "next/image";
import { clients } from "@/lib/site";
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
} from "lucide-react";
import type { ComponentType } from "react";

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
};

export function TrustedBy() {
  // Quadruple client list for seamless infinite looping
  const marqueeItems = [...clients, ...clients, ...clients, ...clients];

  return (
    <section className="relative overflow-hidden border-y border-border bg-background/90 py-12" aria-label="Clients we work with">
      {/* Left and Right Fade Overlays for Smooth Edge Masking */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 sm:w-44 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 sm:w-44 bg-gradient-to-l from-background to-transparent" />

      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan">
          Trusted by growing businesses across India & USA
        </p>
      </div>

      {/* Marquee Continuous Container (Moving Right to Left, Slower Speed) */}
      <div className="mt-8 flex overflow-hidden">
        <div className="animate-marquee-left flex gap-5 sm:gap-7 py-3">
          {marqueeItems.map((c, idx) => {
            const IconComp = (c.icon && iconMap[c.icon]) ? iconMap[c.icon]! : Building;
            return (
              <div
                key={`${c.name}-${idx}`}
                className="group flex shrink-0 items-center gap-3.5 rounded-2xl border border-border/80 bg-surface/95 px-4.5 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan/60 hover:bg-card hover:shadow-lg"
              >
                {c.logo ? (
                  <div className="flex h-13 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <Image
                      src={c.logo}
                      alt={c.name}
                      width={150}
                      height={50}
                      className="h-11 w-auto max-w-[150px] object-contain"
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
                  <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                    {c.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}