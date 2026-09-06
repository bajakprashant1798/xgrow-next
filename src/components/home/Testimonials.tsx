"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { getTestimonials, subscribeToDataChanges } from "@/lib/db";
import { testimonials as fallbackTestimonials } from "@/lib/site";
import { TestimonialModel } from "@/lib/supabase/types";

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; left: number } | null>(null);
  const [testimonialsList, setTestimonialsList] = useState<TestimonialModel[]>([]);

  const loadTestimonials = async () => {
    const data = await getTestimonials();
    const published = data.filter((t) => t.status === "published");
    setTestimonialsList(published.length > 0 ? published : (fallbackTestimonials as any));
  };

  useEffect(() => {
    loadTestimonials();
    return subscribeToDataChanges(loadTestimonials);
  }, []);

  const displayTestimonials = testimonialsList.length > 0 ? testimonialsList : (fallbackTestimonials as any);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const currentScrollLeft = el.scrollLeft;

    if (dir === 1 && currentScrollLeft >= maxScrollLeft - 15) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && currentScrollLeft <= 15) {
      el.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * 380, behavior: "smooth" });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="Client voices"
        title="What owners say after launch"
        sub="Short, unedited feedback from the people who signed the invoice."
        action={
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll testimonials left"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hover:text-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll testimonials right"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hover:text-cyan"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <div
        ref={trackRef}
        className={`no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 ${
          drag ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        onPointerDown={(e) => {
          const el = trackRef.current;
          if (!el) return;
          setDrag({ x: e.clientX, left: el.scrollLeft });
        }}
        onPointerMove={(e) => {
          const el = trackRef.current;
          if (!el || !drag) return;
          el.scrollLeft = drag.left - (e.clientX - drag.x);
        }}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        {displayTestimonials.map((tm: any, i: number) => (
          <figure
            key={tm.id || tm.org || i}
            className="flex w-[85vw] shrink-0 snap-start flex-col rounded-3xl border border-border bg-card p-7 transition-colors hover:border-cyan/40 sm:w-[26rem]"
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