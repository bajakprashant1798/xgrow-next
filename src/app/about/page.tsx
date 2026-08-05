import type { Metadata } from "next";
import { Compass, Eye, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { TeamShowcase } from "@/components/home/TeamShowcase";
import { Reveal, Counter } from "@/components/site/Reveal";
import { stats, values } from "@/lib/site";

export const metadata: Metadata = {
  title: "About XGRO — India's AI-Powered Digital Agency",
  description: "Learn about XGRO's mission, values, and the expert team helping businesses grow across India and the USA.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Our Story</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                We don't just build websites — we build businesses.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                XGRO was founded with a clear, singular goal: to help small-to-medium businesses, startups, and coaching institutes bridge the gap between static digital storefronts and active growth channels. By embedding AI solutions, marketing automation, and speed optimizations, we create sites that actively generate inquiries.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 sm:p-10">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan">
                <Compass className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">Our Mission</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                To empower businesses to scale faster by equipping them with high-performing websites, modern branding, search engine prominence, and custom AI automations. We focus on results, transparency, and accessible, honest pricing.
              </p>
            </div>
            <p className="mt-8 text-sm font-semibold text-cyan">01 / IMPACT DRIVEN</p>
          </Reveal>

          <Reveal delay={100} className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 sm:p-10">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
                <Eye className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-foreground">Our Vision</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                To become India's most trusted AI-powered digital agency for local and regional businesses seeking metro-level quality, transparent communications, and immediate support.
              </p>
            </div>
            <p className="mt-8 text-sm font-semibold text-cyan">02 / FUTURE FIRST</p>
          </Reveal>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Core Values</p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            The principles that guide our everyday decisions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We hold ourselves to strict execution standards. No jargon, no excuses, just pure growth.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => {
            const icons = [ShieldCheck, Sparkles, Trophy, Users, ShieldCheck, Sparkles];
            const Icon = icons[i] || ShieldCheck;
            return (
              <Reveal as="li" key={v} delay={i * 50} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary dark:text-cyan">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{v}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Our commitment to {v.toLowerCase()} runs deep in all deliverables, communications, and long-term client support schedules.
                </p>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Team Showcase */}
      <TeamShowcase />
    </div>
  );
}
