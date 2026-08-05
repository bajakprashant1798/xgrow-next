"use client";

import Link from "next/link";
import mark from "@/assets/xgro-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="XGRO home">
      <img
        src={mark.src}
        alt="XGRO logo: navy circle with a white arrow forming an X"
        width={40}
        height={40}
        className="h-9 w-9 shrink-0"
      />
      {showWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight text-primary dark:text-foreground">
          XG<span className="text-cyan">RO</span>
        </span>
      )}
    </Link>
  );
}