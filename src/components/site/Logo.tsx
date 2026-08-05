"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="XGRO home">
      <img
        src="/xlogo.png"
        alt="XGRO logo"
        width={56}
        height={56}
        className="h-12 w-12 shrink-0"
      />
    </Link>
  );
}