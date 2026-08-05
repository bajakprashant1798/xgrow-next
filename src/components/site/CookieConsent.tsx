"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem("xgro-cookie-consent")) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const decide = (value: "all" | "essential") => {
    window.localStorage.setItem("xgro-cookie-consent", value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-16 left-4 z-50 max-w-sm rounded-2xl border border-border bg-popover p-4 shadow-2xl sm:bottom-4"
    >
      <p className="text-sm text-foreground">
        We use cookies to understand how visitors use this site and to improve it. You can accept all or keep only
        what's essential.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Read our{" "}
        <Link href="/privacy-policy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="rounded-full" onClick={() => decide("all")}>
          Accept all
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => decide("essential")}>
          Essential only
        </Button>
      </div>
    </div>
  );
}