"use client";

import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { caseStudies } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function PortfolioPreview() {
  // Display top 3 featured case study cards on homepage
  const previewCaseStudies = caseStudies.slice(0, 3);
  const remainingCount = caseStudies.length - 3;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        eyebrow="Selected work"
        title="Problem, solution, result — in that order"
        sub="Real businesses in Moradabad and beyond. Same pattern every time: find the leak, fix it, then scale what works."
        action={
          <Button asChild variant="outline" className="hidden sm:inline-flex rounded-full">
            <Link href="/portfolio" className="flex items-center gap-2">
              View all portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {previewCaseStudies.map((c, i) => (
          <Reveal key={c.slug} delay={i * 80}>
            <article className="flex h-full flex-col rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan/50 hover:shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                  {c.category}
                </span>

                {c.logo && (
                  <div className="flex h-9 max-w-[110px] items-center justify-center rounded-xl bg-white px-2 py-1 shadow-sm border border-slate-200 dark:border-slate-800">
                    <Image
                      src={c.logo}
                      alt={c.client}
                      width={100}
                      height={32}
                      className="h-6 w-auto max-w-[90px] object-contain"
                    />
                  </div>
                )}
              </div>

              <h3 className="mt-4 text-xl font-bold text-foreground">{c.client}</h3>
              <p className="mt-4 font-display text-3xl font-extrabold text-gradient-brand">
                {c.metric}
              </p>

              <dl className="mt-5 space-y-3 border-t border-border/60 pt-5 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">Problem</dt>
                  <dd className="text-muted-foreground text-xs leading-relaxed mt-0.5">{c.problem}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Solution</dt>
                  <dd className="text-muted-foreground text-xs leading-relaxed mt-0.5">{c.solution}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Result</dt>
                  <dd className="text-muted-foreground text-xs leading-relaxed mt-0.5">{c.result}</dd>
                </div>
              </dl>
            </article>
          </Reveal>
        ))}
      </div>

      {/* View More Banner leading to Portfolio Page */}
      <div className="mt-12 text-center">
        <Reveal>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-cyan/30 bg-surface/90 p-5 sm:px-8 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-cyan" /> Want to explore all growth stories? See {remainingCount}+ more client case studies in our portfolio.
            </div>
            <Button asChild className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold px-6 py-2.5 text-sm shadow-md">
              <Link href="/portfolio" className="flex items-center gap-2">
                View More Portfolio Projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}