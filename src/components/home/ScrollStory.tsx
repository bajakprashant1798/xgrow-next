"use client";

import { useEffect, useRef, useState } from "react";

const chapters = [
  {
    label: "01 — Listen",
    title: "We start with your customer, not your website.",
    body: "A jeweller in Moradabad and a coaching institute in Delhi need very different first screens. We map who is searching, what they type, and what makes them pick up the phone.",
  },
  {
    label: "02 — Build",
    title: "A site engineered to load before they lose patience.",
    body: "Mobile-first, under two seconds on 4G, accessible, and structured so Google understands every page. Speed is not a feature here — it is the floor.",
  },
  {
    label: "03 — Automate",
    title: "AI answers the moment the enquiry lands.",
    body: "Chatbots qualify the question, WhatsApp automation follows up, and your CRM fills itself. No lead waits until Monday morning.",
  },
  {
    label: "04 — Grow",
    title: "Then we compound it, month after month.",
    body: "SEO, ads and content run on a measured loop. You see cost per lead, not impressions — and you own every account we touch.",
  },
];

export function ScrollStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.min(Math.max(-rect.top / total, 0), 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = Math.min(chapters.length - 1, Math.floor(progress * chapters.length * 0.999));

  return (
    <div ref={sectionRef} className="relative bg-surface" style={{ height: `${chapters.length * 90}vh` }}>
      <section className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl transition-all duration-700"
          style={{
            width: `${28 + progress * 34}rem`,
            height: `${28 + progress * 34}rem`,
            background: "radial-gradient(circle, var(--color-cyan), transparent 65%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[auto_1fr] lg:gap-20">
          <ol className="flex gap-3 lg:flex-col lg:gap-6" aria-label="Our approach">
            {chapters.map((c, i) => (
              <li key={c.label} className="flex items-center gap-3">
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 lg:h-10 lg:w-1.5 ${
                    i === active ? "w-10 bg-cyan lg:h-16" : "w-5 bg-border"
                  }`}
                />
                <span
                  className={`hidden text-xs font-semibold uppercase tracking-widest transition-colors lg:block ${
                    i === active ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                >
                  {c.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="relative min-h-[22rem]">
            {chapters.map((c, i) => (
              <div
                key={c.title}
                aria-hidden={i !== active}
                className="absolute inset-0 transition-all duration-700"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: `translateY(${(i - active) * 28}px)`,
                  pointerEvents: i === active ? "auto" : "none",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan lg:hidden">{c.label}</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {c.title}
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-border">
          <div className="h-full bg-cyan transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
      </section>
    </div>
  );
}