"use client";

import { Check } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { whyChoose } from "@/lib/site";

export function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="Why XGRO"
        title="Agencies promise reach. We're measured on leads."
        sub="Most of our clients came to us after a bad experience: a slow site, a designer who vanished, or an agency invoice that never matched the result."
      />
      <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
        {whyChoose.map((w, i) => (
          <Reveal as="li" key={w.title} delay={i * 50} className="bg-card p-7">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan/15 text-cyan">
              <Check className="h-4 w-4" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-foreground">{w.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}