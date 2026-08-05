import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy | XGRO",
  description: "XGRO refund guidelines, project deposits, cancellations and milestone structures.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-foreground">Refund Policy</h1>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        At XGRO, we prioritize transparency and clear milestone agreements. Please review our policies regarding deposits, cancellations, and refunds:
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">1. Milestone Deposits</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Most project structures require a deposit to secure studio slots and initiate design research. Deposits are fully refundable up to 48 hours after project signup, provided no design work has commenced. Once design mocks have been created, deposits are non-refundable.
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">2. Project Cancellation</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        If a client chooses to cancel a project mid-way, they agree to pay for work completed up to that cancellation point, based on scope benchmarks. XGRO will hand over all source files completed up to the paid milestone.
      </p>

      <h2 className="mt-8 text-xl font-bold text-foreground">3. Ongoing Retainers & Support</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Monthly management plans, SEO retainers, and paid ad management fees are billed at the start of each service cycle. Cycles can be cancelled at any time by giving 10 days notice. No partial refunds are issued for cycles already started.
      </p>

      <p className="mt-12 text-xs text-muted-foreground">
        Last updated: August 2026. For questions regarding refund claims, contact us at {site.email}.
      </p>
    </article>
  );
}
