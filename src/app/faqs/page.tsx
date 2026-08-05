import type { Metadata } from "next";
import { FaqSection } from "@/components/home/FaqSection";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs — Pricing, Delivery & Strategy Questions | XGRO",
  description: "Find answers to common questions about website pricing, development timelines, project ownership, and ongoing marketing.",
  alternates: {
    canonical: "/faqs",
  },
};

export default function FaqsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">All answers</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Clear parameters. Direct replies. If your query isn't listed below, reach out to us on WhatsApp or write to our support team.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQs Accordion */}
      <FaqSection />

      {/* Fallback Support Banner */}
      <section className="border-t border-border bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-extrabold text-foreground">Still have questions?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We answer our phones Monday to Saturday, 10 AM to 7 PM. Chat with our founder directly or submit a message.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link href="/contact">Message Us</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href={site.whatsapp} target="_blank" rel="noreferrer">
                  WhatsApp Support
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
