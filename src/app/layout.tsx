import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { CookieConsent } from "@/components/site/CookieConsent";
import { AiChatWidget } from "@/components/site/AiChatWidget";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "XGRO — Your Digital Growth Partner",
  description:
    "Premium digital growth agency: websites, branding, SEO, marketing and AI automation for businesses in India and the USA.",
  openGraph: {
    title: "XGRO — Your Digital Growth Partner",
    description: "Websites, branding, SEO and AI automation built to generate leads.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <FloatingActions />
            <CookieConsent />
            <AiChatWidget />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
