"use client";

import { useState } from "react";
import { caseStudies } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { Check } from "lucide-react";

export function PortfolioList() {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = ["All", "Website Projects", "Branding", "Marketing Campaigns"];

  const filteredCaseStudies = selectedCat === "All"
    ? caseStudies
    : caseStudies.filter(c => c.category === selectedCat);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
              selectedCat === cat
                ? "bg-primary text-primary-foreground shadow-lg dark:bg-cyan dark:text-cyan-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Case Studies Grid */}
      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredCaseStudies.map((c, i) => (
          <Reveal key={c.slug} delay={i * 80}>
            <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-2xl">
              <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                {c.category}
              </span>
              <h3 className="mt-4 text-xl font-bold text-foreground">{c.client}</h3>
              <p className="mt-4 font-display text-4xl font-extrabold text-gradient-brand">
                {c.metric}
              </p>
              
              <div className="mt-6 flex-1 space-y-4 border-t border-border pt-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problem</h4>
                  <p className="mt-1 text-sm text-foreground leading-relaxed">{c.problem}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solution</h4>
                  <p className="mt-1 text-sm text-foreground leading-relaxed">{c.solution}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</h4>
                  <p className="mt-1 text-sm text-foreground leading-relaxed">{c.result}</p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Before/After Design Comparison Section */}
      <div className="mt-24 border-t border-border pt-20">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Real Craft, Tangible Transformation
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            We don't just optimize code. We overhaul the brand presentation and customer flows to capture maximum traffic value.
          </p>
        </div>
        <BeforeAfterSlider />
      </div>
    </section>
  );
}
