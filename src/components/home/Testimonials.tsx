"use client";

import { useRef } from "react";
import { Quote } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { testimonials } from "@/lib/site";

export function Testimonials() {
  const track = useRef<HTMLDivElement>(null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="Client voices"
        title="What owners say after launch"
        sub="Short, unedited feedback from the people who signed the invoice."
      />
      <div
        ref={track}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {testimonials.map((tm) => (
          <figure
            key={tm.org}
            className="flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card p-7 sm:w-[26rem]"
          >
            <Quote className="h-7 w-7 text-cyan" aria-hidden />
            <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">“{tm.quote}”</blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-semibold text-foreground">{tm.name}</span>
              <span className="block text-muted-foreground">{tm.org}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}