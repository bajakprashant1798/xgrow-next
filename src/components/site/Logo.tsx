"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3 transition-opacity hover:opacity-95", className)}
      aria-label="XGRO home"
    >
      {/* Xiaomi-style icon container with smooth slide-in/out hover transition */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-md transition-all duration-300 group-hover:scale-105 border border-cyan/40 group-hover:border-cyan group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <img
          src="/xlogo.png"
          alt="XGRO logo"
          width={44}
          height={44}
          className="h-full w-full object-contain transition-transform duration-300 ease-in-out group-hover:translate-x-12"
        />
        <img
          src="/xlogo.png"
          alt=""
          aria-hidden
          width={44}
          height={44}
          className="absolute h-full w-full object-contain -translate-x-12 transition-transform duration-300 ease-in-out group-hover:translate-x-0"
        />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground leading-none">
          XGRO
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan leading-none mt-1">
          Growth Studio
        </span>
      </div>
    </Link>
  );
}