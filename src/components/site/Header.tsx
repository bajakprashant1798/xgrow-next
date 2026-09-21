"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Code2,
  Cpu,
  Globe,
  LayoutGrid,
  Megaphone,
  Menu,
  Moon,
  Palette,
  Search,
  Sparkles,
  Sun,
  X,
  Layers,
  CheckCircle2
} from "lucide-react";
import { Logo } from "./Logo";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import { getServices, subscribeToDataChanges } from "@/lib/db";
import { services as fallbackServices, site } from "@/lib/site";
import { ServiceModel } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchDialog } from "./SearchDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/about", key: "nav.about" },
  { to: "/portfolio", key: "nav.portfolio" },
  { to: "/pricing", key: "nav.pricing" },
  { to: "/resources", key: "Resources" },
  { to: "/blog", key: "nav.blog" },
  { to: "/support", key: "Support" },
  { to: "/contact", key: "nav.contact" },
] as const;

const serviceCategoryIcons = [Code2, Palette, Megaphone, Globe, Cpu, Megaphone, Palette];

export function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [servicesList, setServicesList] = useState<ServiceModel[]>([]);

  const loadServices = async () => {
    const data = await getServices();
    const published = data.filter((s) => s.status === "published");
    setServicesList(published.length > 0 ? published : (fallbackServices as any));
  };

  useEffect(() => {
    loadServices();
    return subscribeToDataChanges(loadServices);
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setMegaOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setMegaOpen(false);
    }, 200);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Close sub-nav mega menu on scroll
      setMegaOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  return (
    <header
      className={`relative sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? "border-border bg-surface/90 backdrop-blur-2xl shadow-lg" : "border-transparent bg-surface"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0 z-10">
          <Logo />
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden items-center justify-center gap-0.5 xl:gap-1 lg:flex" aria-label="Main">
          {/* Home Link */}
          <Link
            href="/"
            className={`rounded-full px-2.5 py-1.5 xl:px-3.5 xl:py-2 text-xs xl:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              pathname === "/"
                ? "bg-secondary text-foreground shadow-sm font-bold"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t("nav.home")}
          </Link>

          {/* Xiaomi-style Services Dropdown & Sub-nav Trigger */}
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/services"
              onClick={() => setMegaOpen((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 xl:px-3.5 xl:py-2 text-xs xl:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                megaOpen || pathname === "/services"
                  ? "bg-secondary text-foreground shadow-sm font-bold"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              }`}
              aria-expanded={megaOpen}
            >
              {t("nav.services")}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${megaOpen ? "rotate-180 text-cyan" : ""}`} />
            </Link>
          </div>

          {links.filter((l) => l.to !== "/").map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className={`rounded-full px-2 py-1.5 xl:px-3 xl:py-2 text-xs xl:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                pathname === l.to
                  ? "bg-secondary text-foreground shadow-sm font-bold"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {l.key.startsWith("nav.") ? t(l.key as any) : l.key}
            </Link>
          ))}
        </nav>

        {/* Right: Header Actions */}
        <div className="flex items-center justify-end gap-1.5 xl:gap-2 shrink-0 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label="Search site" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="hidden h-8 rounded-full border border-border px-2.5 text-xs font-bold text-foreground/80 transition-colors hover:bg-secondary sm:block"
            aria-label={`Switch language to ${lang === "en" ? "Hindi" : "English"}`}
          >
            {lang === "en" ? "EN" : "हिं"}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={toggle} aria-label="Toggle dark mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="outline" className="hidden rounded-full font-bold sm:inline-flex border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan hover:text-slate-950 text-xs px-3 h-8 shadow-sm whitespace-nowrap">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="hidden rounded-full font-bold md:inline-flex text-xs xl:text-sm h-8 xl:h-9 px-3 xl:px-4 whitespace-nowrap">
            <Link href="/contact">{t("cta.consultation")}</Link>
          </Button>

          {/* Mobile Slide Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-surface/95 backdrop-blur-2xl p-6">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <Logo />
                </div>

                {/* Mobile Search Button Bar */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-cyan"
                >
                  <Search className="h-4 w-4 text-cyan" />
                  <span>Search services, blog, support...</span>
                </button>

                {/* Mobile Nav Links List */}
                <div className="flex flex-col gap-2">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold text-foreground hover:bg-secondary"
                  >
                    {t("nav.home")}
                  </Link>

                  <div className="rounded-2xl border border-border bg-card p-3">
                    <Link
                      href="/services"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-2 py-1.5 text-base font-bold text-foreground"
                    >
                      <span>{t("nav.services")}</span>
                      <ArrowRight className="h-4 w-4 text-cyan" />
                    </Link>
                    <ul className="mt-2 space-y-1 border-t border-border pt-2">
                      {displayServices.map((s: any) => (
                        <li key={s.id || s.slug}>
                          <Link
                            href={`/services#${s.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {links.map((l) => (
                    <Link
                      key={l.to}
                      href={l.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold text-foreground hover:bg-secondary"
                    >
                      {l.key.startsWith("nav.") ? t(l.key as any) : l.key}
                    </Link>
                  ))}
                </div>

                {/* Mobile Actions Footer */}
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
                  <Button asChild variant="outline" className="w-full rounded-2xl font-bold border-cyan/40 bg-cyan/10 text-cyan text-xs py-5">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign In to Dashboard
                    </Link>
                  </Button>

                  <Button asChild className="w-full rounded-full font-bold py-6">
                    <Link href="/contact" onClick={() => setMobileOpen(false)}>
                      {t("cta.consultation")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full font-bold py-6">
                    <a href={site.whatsapp} target="_blank" rel="noreferrer">
                      Chat on WhatsApp
                    </a>
                  </Button>
                  <button
                    onClick={() => setLang(lang === "en" ? "hi" : "en")}
                    className="mt-2 self-center rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground"
                  >
                    {lang === "en" ? "हिंदी में देखें" : "View in English"}
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Squarespace-Style Floating Sub-Nav Mega Card Dropdown */}
      {megaOpen && (
        <div className="absolute left-0 right-0 top-full z-[100] px-4 sm:px-6 pb-8 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          {/* Invisible backdrop overlay to close menu on click outside */}
          <div
            className="fixed inset-0 top-16 -z-10 pointer-events-auto"
            onClick={() => setMegaOpen(false)}
          />

          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative mx-auto max-w-6xl rounded-3xl border border-border/90 bg-surface/98 text-popover-foreground p-6 sm:p-8 shadow-2xl backdrop-blur-3xl pointer-events-auto mt-1"
          >
            {/* Invisible Top Hover Bridge touching header link to prevent closing on gap */}
            <div className="absolute -top-4 left-0 right-0 h-4" />

            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan">XGRO Service Ecosystem</p>
                  <h3 className="text-base font-extrabold text-foreground">Explore core digital capabilities</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMegaOpen(false);
                    setServicesModalOpen(true);
                  }}
                  className="rounded-full bg-cyan/15 px-3.5 py-1.5 text-xs font-bold text-cyan hover:bg-cyan hover:text-slate-950 transition-colors shadow-sm"
                >
                  ⚡ Open Full Services Popup
                </button>
                <Link
                  href="/services"
                  onClick={() => setMegaOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan hover:underline"
                >
                  All Services <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {displayServices.map((s: any, idx: number) => {
                const IconComponent = serviceCategoryIcons[idx % serviceCategoryIcons.length] || Code2;
                const blurb = s.short_description || s.blurb || "";
                const items = (s.features || s.items || []) as string[];

                return (
                  <Link
                    key={s.id || s.slug}
                    href={`/services#${s.slug}`}
                    onClick={() => setMegaOpen(false)}
                    className="group/item flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-cyan/60 hover:shadow-xl"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan/10 text-cyan group-hover/item:bg-cyan group-hover/item:text-slate-950 transition-colors">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover/item:text-cyan transition-colors">
                          {s.title}
                        </h4>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {blurb}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-2">
                      {items.slice(0, 2).map((item: string) => (
                        <span key={item} className="rounded-md bg-secondary px-2 py-0.5 text-[9px] font-medium text-secondary-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Squarespace Card Footer Promo */}
            <div className="mt-5 flex flex-wrap items-center justify-between rounded-2xl bg-radial from-slate-900 via-slate-950 to-[#0B1120] border border-white/10 p-4 text-white shadow-md">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-cyan shrink-0" />
                <span className="text-xs font-semibold text-slate-200">
                  Looking for bespoke Next.js apps, local SEO, or automated AI WhatsApp bots?
                </span>
              </div>
              <Button asChild size="sm" className="rounded-full bg-cyan text-slate-950 font-bold hover:bg-cyan/90 text-xs mt-2 sm:mt-0 h-8">
                <Link href="/contact" onClick={() => setMegaOpen(false)}>
                  {t("cta.consultation")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* POPUP MODAL: Interactive Services Overview Dialog */}
      <Dialog open={servicesModalOpen} onOpenChange={setServicesModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-cyan" /> XGRO Service Portfolio
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select any capability below to view details or request a custom proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {displayServices.map((s: any, idx: number) => {
              const IconComponent = serviceCategoryIcons[idx % serviceCategoryIcons.length] || Code2;
              const blurb = s.short_description || s.blurb || "";
              const items = (s.features || s.items || []) as string[];

              return (
                <Link
                  key={s.id || s.slug}
                  href={`/services#${s.slug}`}
                  onClick={() => setServicesModalOpen(false)}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-cyan hover:shadow-lg group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan group-hover:bg-cyan group-hover:text-slate-950 transition-colors">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-foreground group-hover:text-cyan transition-colors">
                        {s.title}
                      </h4>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {blurb}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {items.map((item: string) => (
                        <span key={item} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              onClick={() => setServicesModalOpen(false)}
              variant="outline"
              className="rounded-full text-xs font-bold"
            >
              Close
            </Button>
            <Button asChild className="rounded-full bg-cyan text-slate-950 font-bold text-xs">
              <Link href="/contact" onClick={() => setServicesModalOpen(false)}>
                Book Free Consultation
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}