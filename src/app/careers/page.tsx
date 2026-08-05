import type { Metadata } from "next";
import { jobs } from "@/lib/site";
import { CareersForm } from "@/components/careers/CareersForm";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers — Join India's Premium Growth Studio | XGRO",
  description: "Explore openings for React/Next.js developers, brand UI/UX designers, and local SEO analysts in Moradabad.",
  alternates: {
    canonical: "/careers",
  },
};

export default function CareersPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">We are expanding</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Build the future of digital agency craft
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We are constantly seeking hungry builders who prioritize client results and clean code over vanity metrics. Browse open roles below.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1.2fr]">
          {/* Open Roles list */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground">Current Openings</h2>
            {jobs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No roles open at this second. Feel free to submit a general inquiry.</p>
            ) : (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <Reveal
                    key={job.id}
                    className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-cyan/40 hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> {job.type}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                        {job.department}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {job.description}
                    </p>
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div>
            <CareersForm />
          </div>
        </div>
      </section>
    </div>
  );
}
