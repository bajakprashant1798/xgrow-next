"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";

export function ContactCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-primary p-8 text-primary-foreground sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 65%)" }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">
                Let's talk about the leads you're missing.
              </h2>
              <p className="mt-4 max-w-lg text-base opacity-80">
                A free 30-minute call. We'll look at your current site, your competitors and tell you exactly what we'd
                do first — whether or not you hire us.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-full bg-cyan px-6 text-sm font-semibold text-cyan-foreground transition-transform hover:-translate-y-0.5"
                >
                  Book a free consultation
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center rounded-full border border-primary-foreground/30 px-6 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp us
                </a>
              </div>
            </div>

            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <a href={`tel:+91${site.phone}`} className="hover:underline">
                  {site.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <a href={`mailto:${site.email}`} className="break-all hover:underline">
                  {site.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span className="opacity-85">
                  {site.address}
                  <span className="block opacity-70">{site.hours}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}