"use client";

import { useState } from "react";
import { Sparkles, ArrowUpRight, ShieldCheck, Code, Cpu, Palette, Megaphone } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: "Leadership" | "Design & Brand" | "Engineering" | "Marketing & SEO" | "AI & Automation";
  badge: string;
  bio: string;
  skills: string[];
  image: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: "prashant-kumar",
    name: "Prashant Kumar",
    role: "Founder & Chief Strategist",
    department: "Leadership",
    badge: "FOUNDER",
    bio: "Leads agency vision, sits in client strategy sessions, and signs off on every growth roadmap.",
    skills: ["Growth Strategy", "Client Delivery", "ROI Systems"],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "ananya-sharma",
    name: "Ananya Sharma",
    role: "Creative Director",
    department: "Design & Brand",
    badge: "CREATIVE LEAD",
    bio: "Transforms local identity into high-converting visual systems and brand experiences.",
    skills: ["Brand Systems", "Visual Identity", "Figma"],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "rahul-verma",
    name: "Rahul Verma",
    role: "Lead Full-Stack Architect",
    department: "Engineering",
    badge: "TECH LEAD",
    bio: "Engineers sub-1.2s Next.js web engines, cloud architecture, and high-load web systems.",
    skills: ["Next.js", "React 19", "TypeScript", "Performance"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "priya-singh",
    name: "Priya Singh",
    role: "Senior UI/UX Specialist",
    department: "Design & Brand",
    badge: "UI/UX LEAD",
    bio: "Crafts conversion-first mobile interfaces, wireframes, and smooth micro-interactions.",
    skills: ["Mobile UI", "Design Systems", "Prototyping"],
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "vikas-yadav",
    name: "Vikas Yadav",
    role: "AI Automation Engineer",
    department: "AI & Automation",
    badge: "AI SPECIALIST",
    bio: "Builds 24/7 WhatsApp AI bots, CRM sync flows, and lead qualification engines.",
    skills: ["WhatsApp API", "Python", "CRM Automation"],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "kavita-gupta",
    name: "Kavita Gupta",
    role: "Technical SEO Lead",
    department: "Marketing & SEO",
    badge: "SEO LEAD",
    bio: "Drives top 3 Google Maps and search engine rankings for regional and national brands.",
    skills: ["Local SEO", "Technical Audits", "Keywords"],
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    role: "Performance Marketer",
    department: "Marketing & SEO",
    badge: "ADS LEAD",
    bio: "Manages ROI-focused Meta & Google Ads campaigns measured on lead cost, not likes.",
    skills: ["Google Ads", "Meta Ads", "Lead Generation"],
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "neha-rastogi",
    name: "Neha Rastogi",
    role: "Content Strategist & Copywriter",
    department: "Marketing & SEO",
    badge: "CONTENT LEAD",
    bio: "Writes search-optimized, high-impact copy that quietly sells while you run your business.",
    skills: ["Copywriting", "SEO Content", "Brand Voice"],
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
  },
];

const departments = [
  "All",
  "Leadership",
  "Design & Brand",
  "Engineering",
  "Marketing & SEO",
  "AI & Automation",
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
            Our Studio Team
          </span>
          <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.1]">
            25+ DIGITAL ACTIVISTS & BUILDERS DEDICATED TO YOUR GROWTH
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No account managers or offshore hand-offs. Direct access to the specialists crafting your brand, code, and growth funnel.
          </p>

          {/* Segmented Department Filter Bar (Inspired by rblln toggle) */}
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
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {filteredMembers.map((member, index) => (
            <Reveal key={member.id} delay={index * 60}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-2 hover:border-cyan/60 hover:shadow-[0_20px_50px_rgba(6,182,212,0.18)]">
                {/* Image Container with Aspect Ratio & Studio Backdrop */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-top filter saturate-[0.85] grayscale-[0.15] transition-all duration-700 ease-out group-hover:scale-105 group-hover:saturate-110 group-hover:grayscale-0"
                    loading="lazy"
                  />

                  {/* Top Badge Overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan border border-white/10">
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
                  <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 text-white">
                    <h3 className="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-cyan transition-colors">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-cyan/90">
                      {member.role}
                    </p>

                    {/* Interactive Hover Reveal Drawer */}
                    <div className="max-h-0 opacity-0 transition-all duration-400 ease-out group-hover:max-h-36 group-hover:opacity-100">
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
          Showing {filteredMembers.length} active project leads & studio members. Real team photography will be updated shortly.
        </p>
      </div>
    </section>
  );
}
