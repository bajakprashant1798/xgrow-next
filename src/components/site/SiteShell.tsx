"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { CookieConsent } from "@/components/site/CookieConsent";
import { AiChatWidget } from "@/components/site/AiChatWidget";
import { TimedLeadPopup } from "@/components/site/TimedLeadPopup";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");

  if (isStudio) {
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <FloatingActions />
      <CookieConsent />
      <AiChatWidget />
      <TimedLeadPopup />
    </>
  );
}
