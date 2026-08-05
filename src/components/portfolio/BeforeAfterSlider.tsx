"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Eye, ShieldAlert, Sparkles } from "lucide-react";

export function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, []);

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
        className="relative mt-8 h-80 w-full select-none overflow-hidden rounded-2xl border border-border bg-card sm:h-[400px]"
      >
        {/* RIGHT LAYER: After (Premium XGRO Design) */}
        <div className="absolute inset-0 flex flex-col justify-between bg-radial from-slate-900 via-slate-950 to-[#0B1120] p-8 text-white">
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
            <h4 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
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

        {/* LEFT LAYER: Before (Legacy Design) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden border-r border-cyan/40 bg-zinc-100 dark:bg-zinc-800 p-8 text-zinc-800 dark:text-zinc-200"
          style={{ width: `${sliderPos}%` }}
        >
          <div className="flex h-full min-w-[320px] sm:min-w-[500px] flex-col justify-between" style={{ width: containerRef.current?.getBoundingClientRect().width }}>
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
              <h4 className="text-3xl font-bold tracking-tight text-zinc-400 dark:text-zinc-500 line-through">
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
        </div>

        {/* DRAG HANDLE */}
        <div
          className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 cursor-ew-resize bg-cyan"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={() => {
            isDragging.current = true;
          }}
          onTouchStart={() => {
            isDragging.current = true;
          }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cyan text-cyan-foreground shadow-2xl transition-transform hover:scale-110 active:scale-95">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
