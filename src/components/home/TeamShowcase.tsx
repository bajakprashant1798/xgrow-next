"use client";

import { useState } from "react";
import { teamGroups } from "@/lib/site";

export function TeamShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-foreground text-background dark:bg-surface dark:text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">The studio</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            A small team that answers the phone
          </h2>
          <p className="mt-4 text-base leading-relaxed opacity-70">
            No account layers, no offshore hand-off. Hover or tap a role to meet the people who will actually work on
            your project.
          </p>
        </div>

        <ul className="mt-12 border-t border-current/15">
          {teamGroups.map((group, i) => (
            <li key={group.role} className="border-b border-current/15">
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={active === i}
                className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-6 text-left transition-colors"
              >
                <span className="font-display text-sm tabular-nums opacity-50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`font-display text-2xl font-extrabold transition-all duration-300 sm:text-4xl ${
                    active === i ? "translate-x-2 text-cyan" : ""
                  }`}
                >
                  {group.role}
                </span>
                <span className="hidden text-right text-xs opacity-60 sm:block">
                  {group.people.length} {group.people.length === 1 ? "person" : "people"}
                </span>
              </button>
              <div
                className="grid overflow-hidden transition-all duration-500"
                style={{ gridTemplateRows: active === i ? "1fr" : "0fr" }}
              >
                <div className="min-h-0">
                  <div className="pb-7 pl-10 sm:pl-14">
                    <p className="max-w-xl text-sm leading-relaxed opacity-75">{group.body}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {group.people.map((p) => (
                        <li
                          key={p}
                          className="rounded-full border border-current/25 px-3 py-1.5 text-xs font-medium"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm opacity-60">
          Names and photos of the full team are being added — the roles above are the people on every project today.
        </p>
      </div>
    </section>
  );
}