"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0", className)}
      aria-label="XGRO home"
    >
      <Image
        src="/xlogo.png"
        alt="XGRO logo"
        width={48}
        height={40}
        priority
        className="h-9 sm:h-10 w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.03]"
      />
      <div className="flex flex-col justify-center">
        <span className="font-display text-lg sm:text-xl font-black tracking-tight text-foreground leading-none">
          XGRO
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan leading-none mt-1">
          Growth Studio
        </span>
      </div>
    </Link>
  );
}