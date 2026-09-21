"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { CookieConsent } from "@/components/site/CookieConsent";
import { AiChatWidget } from "@/components/site/AiChatWidget";
import { TimedLeadPopup } from "@/components/site/TimedLeadPopup";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  // Check if current route is an Admin Dashboard, Client Portal, Auth, or Studio view
  const isDashboardOrAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/client") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/studio");

  // In production SaaS/Agency platforms, dashboards have their own custom App Shell
  // and do not render public marketing headers, footers, or marketing lead popups.
  if (isDashboardOrAuth) {
    return <main className="min-h-screen w-full bg-background">{children}</main>;
  }

  // Public marketing website layout
  return (
    <>
      <div className="flex min-h-screen flex-col overflow-x-hidden w-full max-w-full">
        <Header />
        <main className="flex-1 overflow-x-hidden w-full max-w-full">{children}</main>
        <Footer />
      </div>
      <FloatingActions />
      <CookieConsent />
      <AiChatWidget />
      <TimedLeadPopup />
    </>
  );
}
