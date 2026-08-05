"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { services } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function ServicesOverview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="What we do"
        title="Everything your business needs to grow online"
        sub="Seven services, one team. Pick a single project or let us run the whole growth engine for you."
        action={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/services">All services</Link>
          </Button>
        }
      />

      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i * 60}>
            <Link
              href={`/services#${s.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {s.items.slice(0, 4).map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}