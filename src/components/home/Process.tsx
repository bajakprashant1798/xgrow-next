"use client";

import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { processSteps } from "@/lib/site";

export function Process() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="How it works"
          title="Five steps from first call to steady growth"
          sub="No jargon, no black boxes. You always know what is happening and what it costs."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 70} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-sm font-bold text-cyan">STEP {i + 1}</span>
                <h3 className="mt-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}