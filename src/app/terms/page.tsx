import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions | XGRO",
  description: "Terms and conditions governing projects, deliverables, payments and support at XGRO.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-foreground">Terms & Conditions</h1>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        By engaging XGRO for design, development, SEO, or AI automation services, you agree to follow our service terms:
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">1. Project Scope & Quotes</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        All projects are governed by a written, fixed-price quote and scope sheet. Any work requested outside the agreed scope sheet will be treated as an addition and quoted separately. No hourly fees are charged unless explicitly structured.
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">2. Client Review & Feedback</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We prioritize transparency and present progress weekly. Clients agree to provide timely feedback during stages. Delays in reviews might extend agreed completion deadlines proportionately.
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">3. Ownership & Delivery</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Upon full receipt of project payment, ownership of all assets (including custom code, graphic design layouts, and marketing materials) transfers completely to the client. XGRO holds no lock-in conditions.
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">4. Support Limits</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Starter packages receive 1 month of free support, and Growth packages receive 3 months. Support covers bug fixes, basic text adjustments, and performance checkups. Feature modifications are not covered under basic support limits.
      </p>

      <p className="mt-8 text-xs text-muted-foreground">
        Last updated: August 2026. For questions regarding terms, write to {site.email}.
      </p>
    </article>
  );
}
