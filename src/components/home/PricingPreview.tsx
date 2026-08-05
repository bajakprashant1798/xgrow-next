"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { pricingTiers } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function PricingPreview() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Pricing"
          title="Fixed prices, written before we start"
          sub="Packages below cover most projects. Anything custom gets a written quote after the discovery call."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 80}>
              <div
                className={`flex h-full flex-col rounded-3xl border p-7 ${
                  tier.highlighted
                    ? "border-cyan bg-primary text-primary-foreground shadow-xl lg:-translate-y-3"
                    : "border-border bg-card"
                }`}
              >
                {tier.highlighted && (
                  <span className="mb-3 w-fit rounded-full bg-cyan px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{tier.name}</h3>
                <p className={`text-xs ${tier.highlighted ? "opacity-75" : "text-muted-foreground"}`}>{tier.tag}</p>
                <p className="mt-5 font-display text-4xl font-extrabold">{tier.price}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                      <span className={tier.highlighted ? "opacity-90" : "text-muted-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={tier.highlighted ? "secondary" : "outline"}
                  className="mt-7 rounded-full"
                >
                  <Link href="/contact">Get started</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}