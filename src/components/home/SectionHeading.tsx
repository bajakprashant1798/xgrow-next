"use client";

import type { ReactNode } from "react";
import { Reveal } from "@/components/site/Reveal";

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  action,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <Reveal>
      <div
        className={`flex flex-col gap-4 ${
          align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
        }`}
      >
        <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
          {sub && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
    </Reveal>
  );
}