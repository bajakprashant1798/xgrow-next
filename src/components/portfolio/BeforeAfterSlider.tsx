"use client";

import { useRef, useState } from "react";
import { ArrowLeftRight, ShieldAlert, Sparkles } from "lucide-react";

export function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      containerRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="max-w-xl">
        <span className="rounded-full bg-cyan/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
          Interactive Demo
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-foreground">
          See the XGRO Redesign Effect
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Drag the center handle left or right to compare a standard legacy site versus a premium XGRO growth build.
        </p>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        role="slider"
        aria-label="Before and after website design comparison slider"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative mt-8 h-80 w-full select-none overflow-hidden rounded-2xl border border-border bg-card sm:h-[400px] cursor-ew-resize touch-none focus:outline-none focus:ring-2 focus:ring-cyan"
      >
        {/* BOTTOM LAYER: After (Premium XGRO Design) */}
        <div className="absolute inset-0 flex flex-col justify-between bg-radial from-slate-900 via-slate-950 to-[#0B1120] p-6 sm:p-8 text-white pointer-events-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-display font-bold tracking-tight text-cyan">XGRO build</span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-bold text-cyan">
              <Sparkles className="h-3 w-3" /> 95+ PageSpeed
            </span>
          </div>

          <div className="my-auto max-w-sm">
            <h4 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white leading-tight">
              Double your sales pipeline
            </h4>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              We replace cold forms with real-time WhatsApp bots, load in under 1.2s, and rank where local buyers search.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-semibold text-slate-400">Conversion Rate: 7.2%</span>
            <span className="rounded-full bg-cyan px-3 py-1 text-[11px] font-bold text-slate-950">Active Engine</span>
          </div>
        </div>

        {/* TOP LAYER: Before (Legacy Design) - Clipped smoothly */}
        <div
          className="absolute inset-0 flex flex-col justify-between bg-zinc-100 p-6 sm:p-8 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              <span className="font-sans font-semibold text-zinc-500 dark:text-zinc-400">Old site template</span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-1 text-[10px] font-bold text-red-600 dark:text-red-400">
              <ShieldAlert className="h-3 w-3" /> 42 PageSpeed
            </span>
          </div>

          <div className="my-auto max-w-sm">
            <h4 className="text-3xl font-bold tracking-tight text-zinc-400 dark:text-zinc-500 line-through leading-tight">
              Welcome to our company
            </h4>
            <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">
              We offer generic solutions. Scroll down to fill a contact form. We will try to reply within 3-4 working business days.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Conversion Rate: 1.1%</span>
            <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-3 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">Static Brochure</span>
          </div>
        </div>

        {/* DRAG HANDLE & VERTICAL DIVIDER LINE */}
        <div
          className="absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan bg-slate-950 text-cyan shadow-2xl transition-transform group-hover:scale-110">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

