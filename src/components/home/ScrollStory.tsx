"use client";

import { useEffect, useRef, useState } from "react";

const chapters = [
  {
    label: "01 — Listen",
    title: "We start with your customer, not your website.",
    body: "A jeweller in Moradabad and a coaching institute in Delhi need very different first screens. We map who is searching, what they type, and what makes them pick up the phone.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
    glow: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 65%)",
    glowColor: "rgba(16, 185, 129, 0.35)",
  },
  {
    label: "02 — Build",
    title: "A site engineered to load before they lose patience.",
    body: "Mobile-first, under two seconds on 4G, accessible, and structured so Google understands every page. Speed is not a feature here — it is the floor.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
    glow: "radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, transparent 65%)",
    glowColor: "rgba(6, 182, 212, 0.35)",
  },
  {
    label: "03 — Automate",
    title: "AI answers the moment the enquiry lands.",
    body: "Chatbots qualify the question, WhatsApp automation follows up, and your CRM fills itself. No lead waits until Monday morning.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200&auto=format&fit=crop",
    glow: "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 65%)",
    glowColor: "rgba(139, 92, 246, 0.35)",
  },
  {
    label: "04 — Grow",
    title: "Then we compound it, month after month.",
    body: "SEO, ads and content run on a measured loop. You see cost per lead, not impressions — and you own every account we touch.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
    glow: "radial-gradient(circle, rgba(236, 72, 153, 0.22) 0%, transparent 65%)",
    glowColor: "rgba(236, 72, 153, 0.35)",
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
      const p = Math.min(Math.max(-rect.top / total, 0), 1);
      setProgress(p);
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

  const scrollToChapter = (index: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset;
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const targetProgress = (index + 0.5) / chapters.length;
    const targetScrollY = scrollTop + rect.top + targetProgress * total;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  return (
    <div ref={sectionRef} className="relative bg-surface border-y border-border/40" style={{ height: `${chapters.length * 95}vh` }}>
      <section className="sticky top-0 flex min-h-screen h-screen items-center overflow-hidden">
        {/* Ambient background glow mapped to active chapter */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl transition-all duration-700"
          style={{
            width: `${32 + progress * 24}rem`,
            height: `${32 + progress * 24}rem`,
            background: chapters[active]?.glow || "radial-gradient(circle, var(--color-cyan), transparent 65%)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[auto_1fr_1.1fr] lg:gap-16 items-center pt-14 lg:pt-0">
          {/* Left Column: Progress Indicators (Interactive) */}
          <ol className="flex gap-2 sm:gap-3 lg:flex-col lg:gap-6 z-10" aria-label="Our approach">
            {chapters.map((c, i) => (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => scrollToChapter(i)}
                  className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan rounded-xl p-1 transition-all cursor-pointer"
                  aria-current={i === active ? "step" : undefined}
                >
                  <span
                    className={`h-1.5 rounded-full transition-all duration-500 lg:h-10 lg:w-1.5 ${
                      i === active ? "w-8 sm:w-10 bg-cyan lg:h-16 shadow-[0_0_12px_rgba(6,182,212,0.6)]" : "w-4 sm:w-5 bg-border/80 group-hover:bg-border"
                    }`}
                    style={{
                      backgroundColor: i === active ? (chapters[active]?.glowColor || "var(--color-cyan)") : undefined,
                    }}
                  />
                  <span
                    className={`hidden text-xs font-semibold uppercase tracking-widest transition-colors lg:block ${
                      i === active ? "text-foreground font-bold" : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {/* Center Column: Text Content */}
          <div className="relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-[24rem] flex flex-col justify-center">
            {chapters.map((c, i) => (
              <div
                key={c.title}
                aria-hidden={i !== active}
                className="absolute inset-0 transition-all duration-500 ease-out flex flex-col justify-center"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: `translateY(${i === active ? 0 : (i < active ? -20 : 20)}px)`,
                  pointerEvents: i === active ? "auto" : "none",
                }}
              >
                <p 
                  className="text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 lg:hidden"
                  style={{ color: chapters[active]?.glowColor }}
                >
                  {c.label}
                </p>
                <h2 className="mt-2 sm:mt-3 text-2xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  {c.title}
                </h2>
                <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Premium Device Mockup with Screen Fading Transitions */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[1.4] lg:aspect-[4/3] max-w-xl mx-auto flex items-center justify-center">
            {/* Glowing device bezel container */}
            <div className="relative w-full h-full rounded-2xl border border-border/80 bg-neutral-950 p-2 sm:p-2.5 shadow-2xl transition-all duration-500 overflow-hidden">
              
              {/* Dynamic outline glow border */}
              <div
                className="absolute -inset-px rounded-2xl opacity-60 transition-all duration-700 pointer-events-none"
                style={{
                  boxShadow: `0 0 20px 2px ${chapters[active]?.glowColor || 'rgba(6, 182, 212, 0.35)'}`,
                  border: `1.5px solid ${chapters[active]?.glowColor || 'rgba(6, 182, 212, 0.35)'}`,
                }}
              />

              {/* Mockup screen slideshow */}
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-950">
                {chapters.map((c, i) => (
                  <div
                    key={c.image}
                    className="absolute inset-0 w-full h-full transition-all duration-500 ease-in-out"
                    style={{
                      opacity: i === active ? 1 : 0,
                      transform: i === active ? "scale(1)" : "scale(1.05)",
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-full object-cover select-none"
                      loading="eager"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-border/40">
          <div 
            className="h-full transition-[width,background-color] duration-300" 
            style={{ 
              width: `${progress * 100}%`,
              backgroundColor: chapters[active]?.glowColor || 'var(--color-cyan)'
            }} 
          />
        </div>
      </section>
    </div>
  );
}