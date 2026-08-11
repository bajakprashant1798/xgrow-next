"use client";

import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "./Logo";
import { services, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("You're on the list. Growth tips, once a month — no spam.");
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{site.description}</p>
            <p className="mt-4 text-sm font-semibold text-foreground">{site.promise}</p>
          </div>

          <nav aria-label="Services">
            <h2 className="text-sm font-semibold text-foreground">Services</h2>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services#${s.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-sm font-semibold text-foreground">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                ["/about", "About"],
                ["/portfolio", "Portfolio"],
                ["/pricing", "Pricing"],
                ["/blog", "Blog"],
                ["/support", "Support Center"],
                ["/careers", "Careers"],
                ["/faqs", "FAQs"],
                ["/contact", "Contact"],
                ["/privacy-policy", "Privacy Policy"],
                ["/terms", "Terms & Conditions"],
                ["/refund-policy", "Refund Policy"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link href={to!} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                {site.address}
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <a href={`tel:+91${site.phone}`} className="hover:text-foreground">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <a href={`mailto:${site.email}`} className="break-all hover:text-foreground">
                  {site.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                {site.hours}
              </li>
            </ul>

            <form onSubmit={subscribe} className="mt-6">
              <label htmlFor="footer-email" className="text-sm font-semibold text-foreground">
                Monthly growth newsletter
              </label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="h-10"
                />
                <Button type="submit" className="h-10 shrink-0">
                  Join
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} XGRO. {site.positioning}. Serving {site.countries}.
          </p>
          <p>GST-compliant invoicing · Data handled per our Privacy Policy</p>
        </div>
      </div>
    </footer>
  );
}