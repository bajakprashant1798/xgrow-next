"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Cpu, Laptop, Palette, TrendingUp } from "lucide-react";
import { services, serviceCategories } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";

export function ServicesList() {
  const [selectedCat, setSelectedCat] = useState<string>("All");

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

  const filteredServices = selectedCat === "All" 
    ? services 
    : services.filter(s => s.category === selectedCat);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Web": return <Laptop className="h-6 w-6 text-cyan" />;
      case "Creative": return <Palette className="h-6 w-6 text-cyan" />;
      case "Marketing": return <TrendingUp className="h-6 w-6 text-cyan" />;
      case "AI": return <Cpu className="h-6 w-6 text-cyan" />;
      default: return <Laptop className="h-6 w-6 text-cyan" />;
    }
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
            {cat} {cat !== "All" && `(${services.filter((s) => s.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="mt-16 space-y-12">
        {filteredServices.map((s, idx) => (
          <Reveal
            key={s.slug}
            id={s.slug}
            className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:border-cyan/50 hover:shadow-xl sm:p-10"
          >
            <div className="grid gap-8 lg:grid-cols-[1.5fr_2fr]">
              {/* Left Column: Heading */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/10">
                    {getCategoryIcon(s.category)}
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground">
                    {s.category}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl">
                  {s.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full">
                    <Link href={`/contact?service=${s.slug}`}>Start project</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <a href={`https://wa.me/916395319725?text=Hi%20XGRO%2C%20I%20want%20to%20know%20more%20about%20your%20${encodeURIComponent(s.title)}%20services.`} target="_blank" rel="noreferrer">
                      WhatsApp details
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right Column: Offerings Checklists */}
              <div className="rounded-2xl bg-surface p-6 sm:p-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  What's included in this service
                </h3>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {s.items.map((item) => (
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
        ))}
      </div>
    </section>
  );
}
