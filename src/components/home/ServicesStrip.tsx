"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { services } from "@/lib/site";

export function ServicesStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; left: number } | null>(null);

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
      el.scrollBy({ left: dir * 360, behavior: "smooth" });
    }
  };

  return (
    <section className="overflow-hidden border-y border-border bg-primary py-16 text-primary-foreground dark:text-neutral-950 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan dark:text-indigo-950/80">Browse sideways</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Drag through the work we do</h2>
          <p className="mt-3 text-sm opacity-80 dark:opacity-90">
            Swipe on mobile, drag or scroll on desktop. Every card is a service you can start this week.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll services left"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-foreground/25 dark:border-neutral-950/20 transition-colors hover:bg-primary-foreground/10 dark:hover:bg-neutral-950/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll services right"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-primary-foreground/25 dark:border-neutral-950/20 transition-colors hover:bg-primary-foreground/10 dark:hover:bg-neutral-950/10"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pl-4 pr-4 sm:pl-6 sm:pr-6 xl:pl-[calc(50vw-640px+1.5rem)] xl:pr-[calc(50vw-640px+1.5rem)] scroll-pl-4 sm:scroll-pl-6 xl:scroll-pl-[calc(50vw-640px+1.5rem)] ${
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
        {services.map((s, i) => (
          <article
            key={s.slug}
            className="flex w-[78vw] shrink-0 snap-start flex-col justify-between rounded-3xl border border-primary-foreground/15 bg-brand-hover p-6 shadow-lg transition-colors hover:border-cyan sm:w-[22rem] text-primary-foreground"
          >
            <div>
              <span className="font-display text-5xl font-extrabold text-primary-foreground/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-primary-foreground">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">{s.blurb}</p>
            </div>
            <ul className="mt-6 space-y-1.5 text-sm text-primary-foreground/90">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-cyan">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={`/services#${s.slug}`}
              className="mt-6 inline-flex w-fit rounded-full bg-primary-foreground text-primary px-4 py-2 text-sm font-semibold hover:bg-primary-foreground/90 transition-colors"
            >
              Explore {s.title}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}