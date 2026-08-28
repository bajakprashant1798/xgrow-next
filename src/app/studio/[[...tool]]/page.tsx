import { isSanityConfigured } from "@/sanity/env";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Studio } from "./Studio";

export const dynamic = "force-dynamic";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl text-center shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sanity Credentials Required</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            To activate Sanity Studio, add your <code className="bg-secondary px-1.5 py-0.5 rounded text-cyan font-mono text-xs">NEXT_PUBLIC_SANITY_PROJECT_ID</code> to <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono text-xs">.env.local</code>.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-cyan text-slate-950 font-bold hover:bg-cyan/90 py-2.5 px-4 text-sm transition-colors"
            >
              Get Free Project ID on Sanity.io
            </a>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Studio />;
}
