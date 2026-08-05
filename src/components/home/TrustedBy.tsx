"use client";

import { clients } from "@/lib/site";

export function TrustedBy() {
  const row = [...clients, ...clients];
  return (
    <section className="border-y border-border bg-background py-8" aria-label="Clients we work with">
      <p className="px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Trusted by growing businesses across India
      </p>
      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto px-4 sm:justify-center sm:flex-wrap sm:overflow-visible">
        {row.slice(0, clients.length).map((c) => (
          <div
            key={c.name}
            className="shrink-0 rounded-xl border border-border bg-surface px-4 py-3 text-left"
          >
            <p className="whitespace-nowrap font-display text-sm font-bold text-foreground">{c.name}</p>
            <p className="whitespace-nowrap text-[11px] text-muted-foreground">{c.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}