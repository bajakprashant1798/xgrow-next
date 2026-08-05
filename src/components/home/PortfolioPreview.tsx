"use client";

import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { caseStudies } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function PortfolioPreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="Selected work"
        title="Problem, solution, result — in that order"
        sub="Real businesses in Moradabad and beyond. Same pattern every time: find the leak, fix it, then scale what works."
        action={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/portfolio">View portfolio</Link>
          </Button>
        }
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {caseStudies.map((c, i) => (
          <Reveal key={c.slug} delay={i * 80}>
            <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 transition-shadow hover:shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c.category}</p>
              <h3 className="mt-2 text-xl font-bold text-foreground">{c.client}</h3>
              <p className="mt-5 font-display text-3xl font-extrabold text-gradient-brand">{c.metric}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">Problem</dt>
                  <dd className="text-muted-foreground">{c.problem}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Solution</dt>
                  <dd className="text-muted-foreground">{c.solution}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Result</dt>
                  <dd className="text-muted-foreground">{c.result}</dd>
                </div>
              </dl>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}