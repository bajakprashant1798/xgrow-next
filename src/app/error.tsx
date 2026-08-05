"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics or error tracking service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center bg-background px-4 py-16 text-center sm:px-6">
      <div className="max-w-md">
        <span className="rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-destructive">
          Error 500
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          An unexpected server error occurred. Try refreshing the page state, or contact our support if the problem persists.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
