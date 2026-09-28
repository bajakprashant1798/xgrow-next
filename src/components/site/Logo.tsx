"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  href?: string | null;
  badge?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  size?: "sm" | "default" | "lg";
}

export function Logo({
  className,
  href = "/",
  badge,
  showSubtitle = true,
  subtitle = "GROWTH STUDIO",
  size = "default",
}: LogoProps) {
  const logoImage = (
    <Image
      src="/xlogo.png"
      alt="XGRO logo"
      width={size === "lg" ? 56 : size === "sm" ? 36 : 48}
      height={size === "lg" ? 48 : size === "sm" ? 30 : 40}
      priority
      className={cn(
        "w-auto object-contain shrink-0 transition-transform duration-300 group-hover:scale-105",
        size === "lg" ? "h-11 sm:h-12" : size === "sm" ? "h-7 sm:h-8" : "h-9 sm:h-9.5"
      )}
    />
  );

  const textContent = (
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-display font-black tracking-tight text-foreground leading-none",
            size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-base" : "text-[18px] sm:text-[19px]"
          )}
        >
          XGRO
        </span>
        {badge && (
          <span className="text-[9.5px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30 leading-none">
            {badge}
          </span>
        )}
      </div>
      {showSubtitle && (
        <span
          className={cn(
            "font-bold uppercase tracking-[0.18em] text-[#00d2ff] leading-none mt-1 truncate max-w-[130px] sm:max-w-xs block",
            size === "lg" ? "text-xs" : size === "sm" ? "text-[8.5px]" : "text-[9.5px] sm:text-[10px]"
          )}
        >
          {subtitle}
        </span>
      )}
    </div>
  );

  const inner = (
    <>
      {logoImage}
      {textContent}
    </>
  );

  if (!href) {
    return (
      <div className={cn("group flex items-center gap-2.5 shrink-0 select-none", className)}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0", className)}
      aria-label="XGRO home"
    >
      {inner}
    </Link>
  );
}