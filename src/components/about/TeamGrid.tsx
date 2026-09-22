"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: "WordPress Development" | "Content & Copywriting" | "SEO & Digital Marketing";
  badge: string;
  bio: string;
  skills: string[];
  image: string;
  isAvatar?: boolean;
};

export const teamMembers: TeamMember[] = [
  {
    id: "pooran-kushwah",
    name: "Pooran Kushwah",
    role: "WordPress Developer",
    department: "WordPress Development",
    badge: "WP DEVELOPER",
    bio: "Engineers blazing-fast, custom WordPress architectures, WooCommerce stores, custom theme development, and speed-optimized web platforms.",
    skills: ["WordPress", "PHP", "WooCommerce", "Theme Customization", "Elementor", "Speed Optimization"],
    image: "/team/pooran_kushwah.jpeg",
    isAvatar: false,
  },
  {
    id: "neha-singh",
    name: "Neha Singh",
    role: "Copywriter",
    department: "Content & Copywriting",
    badge: "COPYWRITER",
    bio: "Crafts high-converting landing page copy, persuasive sales messaging, and search-optimized narratives that turn casual readers into loyal customers.",
    skills: ["Conversion Copywriting", "Content Strategy", "Brand Voice", "SEO Copywriting", "Ad Copy"],
    image: "/team/neha_singh.jpg",
    isAvatar: true,
  },
  {
    id: "sachin-yadav",
    name: "Sachin Yadav",
    role: "SEO & Digital Marketing Expert",
    department: "SEO & Digital Marketing",
    badge: "SEO & MARKETING",
    bio: "Drives top Google rankings, technical search engine audits, keyword growth strategies, and high-ROI multi-channel digital marketing campaigns.",
    skills: ["Technical SEO", "Google Search Console", "Performance Ads", "Local SEO & GMB", "Conversion Optimization"],
    image: "/team/sachin_yadav.jpg",
    isAvatar: true,
  },
];

const departments = [
  "All",
  "WordPress Development",
  "Content & Copywriting",
  "SEO & Digital Marketing",
] as const;

export function TeamGrid() {
  const [selectedDept, setSelectedDept] = useState<string>("All");

  const filteredMembers =
    selectedDept === "All"
      ? teamMembers
      : teamMembers.filter((m) => m.department === selectedDept);

  return (
    <section className="relative overflow-hidden bg-surface py-20 lg:py-28 border-t border-border">
      {/* Background Subtle Gradient */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-radial from-cyan/5 via-transparent to-transparent blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
        {/* Header (Inspired by rblln display typography) */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="rounded-full bg-cyan/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
            Our Core Specialists
          </span>
          <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.1]">
            THE SPECIALISTS DEDICATED TO YOUR DIGITAL GROWTH
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No account managers or offshore hand-offs. Direct access to the developers, copywriters, and marketers building your digital success.
          </p>

          {/* Segmented Department Filter Bar */}
          <div className="mt-8 flex flex-wrap justify-center gap-1.5 rounded-full border border-border bg-card p-1.5 shadow-xl">
            {departments.map((dept) => {
              const isActive = selectedDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-cyan text-slate-950 shadow-md scale-105"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 max-w-6xl mx-auto">
          {filteredMembers.map((member, index) => (
            <Reveal key={member.id} delay={index * 80}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-2 hover:border-cyan/60 hover:shadow-[0_20px_50px_rgba(6,182,212,0.18)]">
                {/* Image Container with Aspect Ratio & Studio Backdrop */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-top filter saturate-[0.9] transition-all duration-700 ease-out group-hover:scale-105 group-hover:saturate-110"
                    loading="lazy"
                  />

                  {/* Top Badge Overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan border border-white/10 shadow-sm">
                      {member.badge}
                    </span>
                  </div>

                  {/* Top Right Action Icon */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-slate-950 shadow-lg">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Bottom Gradient Fade & Card Content */}
                  <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-5 text-white">
                    <h3 className="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-cyan transition-colors">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-cyan/90">
                      {member.role}
                    </p>

                    {/* Interactive Hover Reveal Drawer */}
                    <div className="max-h-0 opacity-0 transition-all duration-400 ease-out group-hover:max-h-40 group-hover:opacity-100">
                      <p className="mt-3 border-t border-white/15 pt-2.5 text-[11px] leading-snug text-slate-300">
                        {member.bio}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {member.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-medium text-slate-200 backdrop-blur-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-center text-xs text-muted-foreground">
          Showing {filteredMembers.length} active project leads & specialists dedicated to delivering your project.
        </p>
      </div>
    </section>
  );
}
