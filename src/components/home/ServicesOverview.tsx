"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

export function ServicesOverview() {
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

      <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayServices.map((s: any, i: number) => {
          const blurb = s.short_description || s.blurb || "";
          const items = (s.features || s.items || []) as string[];
          const imageUrl = s.image_url;

          return (
            <Reveal as="li" key={s.id || s.slug} delay={i * 60}>
              <Link
                href={`/services#${s.slug}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan/70 hover:shadow-2xl overflow-hidden"
              >
                <div>
                  {/* Service Card Image Banner */}
                  <div className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden bg-slate-900 mb-5 border border-border/60">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={s.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-900 via-cyan/20 to-slate-950 flex items-center justify-center">
                        <span className="text-4xl">⚡</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Category Pill Tag */}
                    {s.category && (
                      <span className="absolute top-3 left-3 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan shadow-sm">
                        {s.category}
                      </span>
                    )}

                    {s.price && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-cyan text-slate-950 px-2.5 py-1 text-xs font-black shadow-md">
                        {s.price}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3 px-1">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-cyan transition-colors">
                      {s.title}
                    </h3>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all group-hover:bg-cyan group-hover:text-slate-950">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground px-1 line-clamp-2">
                    {blurb}
                  </p>
                </div>

                <ul className="mt-5 flex flex-wrap gap-1.5 px-1 pt-3 border-t border-border/60">
                  {items.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                    >
                      {item}
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li className="rounded-full bg-cyan/10 text-cyan px-2 py-1 text-[10px] font-bold">
                      +{items.length - 3} more
                    </li>
                  )}
                </ul>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}