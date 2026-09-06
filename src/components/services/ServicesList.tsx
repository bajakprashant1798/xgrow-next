"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Cpu, Laptop, Palette, TrendingUp, Sparkles } from "lucide-react";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices, serviceCategories } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export function ServicesList() {
  const [selectedCat, setSelectedCat] = useState<string>("All");
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

  // Handle scrolling to hash after component mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);

  const filteredServices = selectedCat === "All" 
    ? displayServices 
    : displayServices.filter((s: any) => s.category === selectedCat);

  const getCategoryIcon = (category: string, iconName?: string) => {
    if (iconName === "Cpu" || category === "AI") return <Cpu className="h-6 w-6 text-cyan" />;
    if (iconName === "Palette" || category === "Creative") return <Palette className="h-6 w-6 text-cyan" />;
    if (iconName === "TrendingUp" || category === "Marketing") return <TrendingUp className="h-6 w-6 text-cyan" />;
    if (iconName === "Sparkles") return <Sparkles className="h-6 w-6 text-cyan" />;
    return <Laptop className="h-6 w-6 text-cyan" />;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-8">
        {serviceCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
              selectedCat === cat
                ? "bg-primary text-primary-foreground shadow-lg dark:bg-cyan dark:text-cyan-foreground"
                : "border border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {cat} {cat !== "All" && `(${displayServices.filter((s: any) => s.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="mt-16 space-y-12">
        {filteredServices.map((s: any) => {
          const items = s.features || s.items || [];
          const blurb = s.short_description || s.blurb || "";

          return (
            <Reveal
              key={s.id || s.slug}
              id={s.slug}
              className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:border-cyan/50 hover:shadow-xl sm:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-[1.5fr_2fr] items-start">
                {/* Left Column: Image Banner + Heading + Actions */}
                <div>
                  {s.image_url && (
                    <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-slate-900 mb-6 border border-border/60 shadow-md group">
                      <img
                        src={s.image_url}
                        alt={s.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan">
                        {s.category}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/10">
                      {getCategoryIcon(s.category, s.icon)}
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground">
                      {s.category}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl">
                    {s.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {blurb}
                  </p>

                  {s.price && (
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Starts at:</span>
                      <span className="text-xl font-extrabold text-cyan">{s.price}</span>
                      {s.discount_price && (
                        <span className="text-xs text-muted-foreground line-through">{s.discount_price}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button asChild className="rounded-full font-bold">
                      <Link href={`/contact?service=${s.slug}`}>Start project</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full font-semibold">
                      <a href={`https://wa.me/916395319725?text=Hi%20XGRO%2C%20I%20want%20to%20know%20more%20about%20your%20${encodeURIComponent(s.title)}%20services.`} target="_blank" rel="noreferrer">
                        WhatsApp details
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Right Column: Offerings Checklists */}
                <div className="rounded-2xl bg-surface p-6 sm:p-8 border border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    What's included in this service
                  </h3>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {items.map((item: string) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-cyan">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-foreground leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
