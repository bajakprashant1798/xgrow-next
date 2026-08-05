"use client";

import Link from "next/link";
import { ArrowUpRight, MessageCircle, Star } from "lucide-react";
import { Counter } from "@/components/site/Reveal";
import { useLang } from "@/lib/i18n";
import { site, stats } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -left-32 h-[34rem] w-[34rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-primary), transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              {t("hero.eyebrow")}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              {t("hero.title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-gradient-brand">{t("hero.title").split(" ").slice(-1)}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.sub")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                <Link href="/contact">
                  {t("cta.consultation")}
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 text-base">
                <a href={site.whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {t("cta.whatsapp")}
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="flex" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-cyan text-cyan" />
                  ))}
                </span>
                Rated by 500+ clients
              </span>
              <span>Serving {site.countries}</span>
              <span>Replies within 1 working hour</span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl border border-border p-5 sm:p-6 ${
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                <dd className="font-display text-3xl font-extrabold sm:text-4xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </dd>
                <dt className={`mt-1 text-xs sm:text-sm ${i === 0 ? "opacity-85" : "text-muted-foreground"}`}>
                  {s.label}
                </dt>
              </div>
            ))}
            <div className="col-span-2 rounded-2xl border border-cyan/40 bg-cyan/10 p-5">
              <p className="text-sm font-semibold text-foreground">
                Live project counter: <Counter value={37} /> active projects this quarter
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across websites, branding, SEO and AI automation for 25+ industries.
              </p>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}