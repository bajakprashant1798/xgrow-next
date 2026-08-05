import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/site/Reveal";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact XGRO — Book a Free Growth Consultation",
  description: "Talk to XGRO about your website, branding, SEO or AI automation project. Located in MDA Moradabad.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  // JSON-LD LocalBusiness Schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "XGRO",
    "image": "https://xgro.in/assets/xgro-mark.png",
    "telephone": "+916395319725",
    "email": "xgro.services@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "MDA",
      "addressLocality": "Moradabad",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "244001",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "10:00",
      "closes": "19:00"
    }
  };

  return (
    <div className="flex flex-col pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Hero Header */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Get in touch</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Let's build your growth engine
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Have questions? Book a free audit session, call our office, or stop by for a hot cup of tea. We answer when you call.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Main Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1.5fr]">
          {/* Left: Contact Info */}
          <div className="space-y-8">
            <Reveal className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Contact Details</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We work directly with founders, marketers, and developers across India and the USA. No middlemen, no offshore delay.
              </p>
            </Reveal>

            <ul className="space-y-6 text-sm">
              <Reveal as="li" delay={50} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <MapPin className="h-6 w-6 shrink-0 text-cyan" />
                <div>
                  <h3 className="font-bold text-foreground">Office Address</h3>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{site.address}</p>
                </div>
              </Reveal>

              <Reveal as="li" delay={100} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <Phone className="h-6 w-6 shrink-0 text-cyan" />
                <div>
                  <h3 className="font-bold text-foreground">Call/WhatsApp</h3>
                  <p className="mt-1 text-muted-foreground">
                    <a href={`tel:+91${site.phone}`} className="hover:text-cyan font-semibold transition-colors">
                      {site.phoneDisplay}
                    </a>
                  </p>
                </div>
              </Reveal>

              <Reveal as="li" delay={150} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <Mail className="h-6 w-6 shrink-0 text-cyan" />
                <div>
                  <h3 className="font-bold text-foreground">Email Support</h3>
                  <p className="mt-1 text-muted-foreground">
                    <a href={`mailto:${site.email}`} className="hover:text-cyan font-semibold transition-colors">
                      {site.email}
                    </a>
                  </p>
                </div>
              </Reveal>

              <Reveal as="li" delay={200} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <Clock className="h-6 w-6 shrink-0 text-cyan" />
                <div>
                  <h3 className="font-bold text-foreground">Working Hours</h3>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{site.hours}</p>
                </div>
              </Reveal>
            </ul>
          </div>

          {/* Right: Consultation Form */}
          <Reveal delay={100}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* Map Integration */}
      <section className="mx-auto max-w-7xl w-full px-4 pb-24 sm:px-6">
        <Reveal className="h-96 w-full rounded-[2rem] border border-border overflow-hidden bg-card shadow-inner">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.316812836263!2d78.7782637!3d28.8473215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390afb3ad0254c7d%3A0xd64f4347715f5d88!2sMDA%20Moradabad!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="XGRO location map - MDA Moradabad"
          />
        </Reveal>
      </section>
    </div>
  );
}
