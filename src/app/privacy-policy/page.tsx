import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | XGRO",
  description: "How XGRO collects, uses and protects your information.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-extrabold text-foreground">Privacy Policy</h1>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        We collect only the details you share with us through forms, WhatsApp or email — name, contact details and
        project information — and use them solely to respond to your enquiry and deliver work you have asked for.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        We never sell your data. Analytics cookies are used to understand site usage and can be declined from the
        consent banner. To request deletion of your data, write to {site.email}.
      </p>
    </article>
  );
}
