import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center bg-background px-4 py-16 text-center sm:px-6">
      <div className="max-w-md">
        <span className="rounded-full bg-cyan/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
          Error 404
        </span>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Page Not Found
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          The page you are looking for doesn't exist, has been removed, or was renamed. Let's redirect you to a working pathway.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
