import type { Metadata } from "next";
import { PortfolioList } from "@/components/portfolio/PortfolioList";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Portfolio — Client Results & Case Studies | XGRO",
  description: "Explore case studies from hotels, coaching institutes and retail brands. Problem, solution, and result analysis.",
  alternates: {
    canonical: "/portfolio",
  },
};

export default function PortfolioPage() {
  return (
    <div className="flex flex-col pt-10">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Our accomplishments</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Proven results from real projects
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We focus on ROI, conversions, and speed. Browse our selected client case studies in web, design, and marketing campaigns below.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Interactive Case Studies List */}
      <PortfolioList />
    </div>
  );
}
