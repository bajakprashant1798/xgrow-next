"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { useLang } from "@/lib/i18n";

export function FloatingActions() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href={site.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label={t("cta.whatsapp")}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.72_0.18_147)] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6"
      >
        <MessageCircle className="h-6 w-6" />
      </a>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 px-4 py-2.5 backdrop-blur-xl transition-transform duration-300 sm:hidden ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-2">
          <a
            href={`tel:+91${site.phone}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Call XGRO"
          >
            <Phone className="h-4 w-4" />
          </a>
          <Link
            href="/contact"
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {t("cta.consultation")}
          </Link>
        </div>
      </div>
    </>
  );
}