"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { services, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchDialog } from "./SearchDialog";

const links = [
  { to: "/about", key: "nav.about" },
  { to: "/portfolio", key: "nav.portfolio" },
  { to: "/pricing", key: "nav.pricing" },
  { to: "/blog", key: "nav.blog" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-border bg-surface/85 backdrop-blur-xl" : "border-transparent bg-surface"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Logo />

        <nav className="relative hidden items-center justify-center gap-1 lg:flex" aria-label="Main">
          <div
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <Link
              href="/services"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              aria-expanded={megaOpen}
            >
              {t("nav.services")}
            </Link>
            {megaOpen && (
              <div className="absolute left-1/2 top-full w-[min(56rem,90vw)] -translate-x-1/2 pt-3">
                <div className="grid gap-1 rounded-2xl border border-border bg-popover p-3 shadow-2xl sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/services#${s.slug}`}
                      className="rounded-xl p-3 transition-colors hover:bg-secondary"
                      onClick={() => setMegaOpen(false)}
                    >
                      <span className="block text-sm font-semibold text-foreground">{s.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {s.items.slice(0, 3).join(" · ")}
                      </span>
                    </Link>
                  ))}
                  <div className="rounded-xl bg-primary p-4 text-primary-foreground">
                    <p className="text-sm font-semibold">Not sure what you need?</p>
                    <p className="mt-1 text-xs opacity-85">Book a free 30-minute growth call.</p>
                    <Link
                      href="/contact"
                      onClick={() => setMegaOpen(false)}
                      className="mt-3 inline-block rounded-full bg-cyan px-3 py-1.5 text-xs font-semibold text-cyan-foreground"
                    >
                      {t("cta.consultation")}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {links.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${pathname === l.to ? "bg-secondary text-foreground" : "text-foreground/80"}`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="icon" aria-label="Search site" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="hidden h-9 rounded-full border border-border px-3 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary sm:block"
            aria-label={`Switch language to ${lang === "en" ? "Hindi" : "English"}`}
          >
            {lang === "en" ? "EN" : "हिं"}
          </button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild className="hidden rounded-full md:inline-flex">
            <Link href="/contact">{t("cta.consultation")}</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-2 flex flex-col gap-1">
                <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-base font-semibold">
                  {t("nav.home")}
                </Link>
                <Link href="/services" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-base font-semibold">
                  {t("nav.services")}
                </Link>
                <ul className="mb-1 ml-3 border-l border-border pl-3">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/services#${s.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-muted-foreground"
                      >
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {links.map((l) => (
                  <Link
                    key={l.to}
                    href={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold"
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <div className="mt-4 flex gap-2">
                  <Button asChild className="flex-1 rounded-full">
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      {t("cta.consultation")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <a href={site.whatsapp} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                </div>
                <button
                  onClick={() => setLang(lang === "en" ? "hi" : "en")}
                  className="mt-3 self-start rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  {lang === "en" ? "हिंदी में देखें" : "View in English"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}