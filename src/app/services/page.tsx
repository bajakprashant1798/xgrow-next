import type { Metadata } from "next";
import { ServicesList } from "@/components/services/ServicesList";
import { PricingPreview } from "@/components/home/PricingPreview";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Services — Websites, Branding, SEO & AI Automation | XGRO",
  description: "Seven services under one roof: web, design, content, SEO, AI, ads, branding.",
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col pt-10">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Our capabilities</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Everything your business needs to grow online
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Select an individual category below to browse specific project scopes. From quick landing pages to complex AI bots, we construct systems that yield leads.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filterable Services List */}
      <ServicesList />

      {/* Pricing Showcase */}
      <PricingPreview />
    </div>
  );
}
