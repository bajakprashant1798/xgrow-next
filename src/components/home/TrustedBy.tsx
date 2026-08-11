"use client";

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
  Building
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
};

export function TrustedBy() {
  // Quadruple client list for seamless infinite looping
  const marqueeItems = [...clients, ...clients, ...clients, ...clients];

  return (
    <section className="relative overflow-hidden border-y border-border bg-background/80 py-10" aria-label="Clients we work with">
      {/* Left and Right Fade Overlays for Smooth Edge Masking */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-36 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-36 bg-gradient-to-l from-background to-transparent" />

      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan">
          Trusted by growing businesses across India & USA
        </p>
      </div>

      {/* Marquee Continuous Container (Moving Right to Left, Slower Speed) */}
      <div className="mt-7 flex overflow-hidden">
        <div className="animate-marquee-left flex gap-4 sm:gap-6 py-2">
          {marqueeItems.map((c, idx) => {
            const IconComp = (c.icon && iconMap[c.icon]) ? iconMap[c.icon]! : Building;
            return (
              <div
                key={`${c.name}-${idx}`}
                className="group flex shrink-0 items-center gap-3.5 rounded-2xl border border-border/80 bg-surface/90 px-5 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan/50 hover:bg-card hover:shadow-lg"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan group-hover:bg-cyan group-hover:text-slate-950 transition-colors">
                  <IconComp className="h-4.5 w-4.5" />
                </div>
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