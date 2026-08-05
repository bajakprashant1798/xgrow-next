import type { Metadata } from "next";
import { BlogList } from "@/components/blog/BlogList";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Blog — Insights on AI, SEO & Website Design | XGRO",
  description: "Read marketing strategies, technology updates, AI automation implementation steps, and business advice from XGRO.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="flex flex-col pt-10">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">XGRO Journal</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Knowledge to grow your business online
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We share actionable advice on SEO, branding, frontend technologies, and AI automations. Straightforward concepts, zero fluff.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Interactive Blog list */}
      <BlogList />
    </div>
  );
}
