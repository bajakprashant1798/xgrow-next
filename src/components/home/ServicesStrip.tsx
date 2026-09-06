"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";

export function ServicesStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; left: number } | null>(null);
  const [servicesList, setServicesList] = useState<ServiceModel[]>([]);

  const loadServices = async () => {
    const data = await getServices();
    const published = data.filter((s) => s.status === "published");
    setServicesList(published.length > 0 ? published : (fallbackServices as any));
  };

  useEffect(() => {
    loadServices();
    return subscribeToDataChanges(loadServices);
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);

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
        {displayServices.map((s: any, i: number) => {
          const blurb = s.short_description || s.blurb || "";
          const items = (s.features || s.items || []) as string[];

          return (
            <article
              key={s.id || s.slug}
              className="flex w-[82vw] shrink-0 snap-start flex-col justify-between rounded-3xl border border-primary-foreground/15 bg-brand-hover p-5 shadow-lg transition-all hover:border-cyan sm:w-[23rem] text-primary-foreground overflow-hidden group"
            >
              <div>
                {/* Card Image Banner */}
                <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-black/40 mb-4 border border-white/10">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-900 to-cyan/20 flex items-center justify-center">
                      <span className="text-3xl">🚀</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan border border-white/10">
                    {s.category || 'Service'}
                  </span>
                  <span className="absolute bottom-2 right-2.5 font-display text-2xl font-black text-white/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-primary-foreground group-hover:text-cyan transition-colors">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-primary-foreground/80 line-clamp-2">{blurb}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-primary-foreground/15">
                <ul className="space-y-1.5 text-xs text-primary-foreground/90">
                  {items.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-center gap-1.5 truncate">
                      <span className="text-cyan font-bold">—</span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services#${s.slug}`}
                  className="mt-4 inline-flex w-full justify-center rounded-full bg-primary-foreground text-primary py-2 text-xs font-bold hover:bg-primary-foreground/90 transition-colors shadow-sm"
                >
                  Explore {s.title}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}