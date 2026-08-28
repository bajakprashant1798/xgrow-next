import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n";
import { SiteShell } from "@/components/site/SiteShell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xgrow.agency"),
  title: {
    default: "XGRO — Your Digital Growth Partner",
    template: "%s | XGRO Agency",
  },
  description:
    "Premium digital growth agency: websites, branding, SEO, marketing and AI automation for businesses in India and the USA.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon/favicon.ico"],
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    title: "XGRO — Your Digital Growth Partner",
    description: "Websites, branding, SEO and AI automation built to generate leads and scale revenue.",
    url: "https://xgrow.agency",
    siteName: "XGRO Digital Agency",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/xlogo.png",
        width: 800,
        height: 800,
        alt: "XGRO Brand Logo",
      },
      {
        url: "/home/hero.png",
        width: 1200,
        height: 630,
        alt: "XGRO Digital Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XGRO — Your Digital Growth Partner",
    description: "Websites, branding, SEO and AI automation built to generate leads.",
    images: ["/xlogo.png", "/home/hero.png"],
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
      className={`${dmSans.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <SiteShell>{children}</SiteShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


