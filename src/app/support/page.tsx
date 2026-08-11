"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquareText,
  Headphones,
  CalendarCheck2,
  MailCheck,
  PackageCheck,
  Video,
  Accessibility,
  PhoneCall,
  ChevronRight,
  Search,
  CheckCircle2,
  X,
  Clock,
  Send,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { site, services } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SupportCardItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  actionType: "chat" | "appointment" | "email" | "tracking" | "video" | "call" | "faq";
  badge?: string;
};

const supportCards: SupportCardItem[] = [
  {
    id: "chat-now",
    title: "Chat Now (हिंदी / English)",
    subtitle: "Instant WhatsApp & AI Assistant support · Available 10 AM to 7 PM IST",
    icon: MessageSquareText,
    actionType: "chat",
    badge: "Fastest Response",
  },
  {
    id: "online-help",
    title: "Online Help & Tickets",
    subtitle: "Submit project queries, bug reports & instant support tickets",
    icon: Headphones,
    actionType: "faq",
  },
  {
    id: "book-appointment",
    title: "Book Service Appointments",
    subtitle: "Schedule a 1-on-1 growth consultation or service kickoff call",
    icon: CalendarCheck2,
    actionType: "appointment",
    badge: "Popular",
  },
  {
    id: "email-us",
    title: "Email Us",
    subtitle: "Detailed inquiries & proposal requests (xgro.services@gmail.com)",
    icon: MailCheck,
    actionType: "email",
  },
  {
    id: "pick-tracking",
    title: "Project Track & Delivery",
    subtitle: "Check live development milestones & website launch progress",
    icon: PackageCheck,
    actionType: "tracking",
  },
  {
    id: "video-assistance",
    title: "Video Assistance & Demo",
    subtitle: "Screen share & live website / AI automation walkthrough",
    icon: Video,
    actionType: "video",
  },
  {
    id: "sign-language",
    title: "Inclusive & Sign Language",
    subtitle: "Accessible communication & dedicated assisted support",
    icon: Accessibility,
    actionType: "email",
  },
  {
    id: "direct-call",
    title: "Direct Hotline Call",
    subtitle: "+91 63953 19725 · Immediate emergency project assistance",
    icon: PhoneCall,
    actionType: "call",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<"appointment" | "email" | "video" | "tracking" | null>(null);

  // Form states for modals
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedService, setSelectedService] = useState(services[0].title);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [message, setMessage] = useState("");

  const filteredCards = supportCards.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (card: SupportCardItem) => {
    if (card.actionType === "chat") {
      window.open(site.whatsapp, "_blank");
    } else if (card.actionType === "call") {
      window.location.href = `tel:${site.phone}`;
    } else if (card.actionType === "appointment") {
      setActiveModal("appointment");
      setFormSubmitted(false);
    } else if (card.actionType === "email") {
      setActiveModal("email");
      setFormSubmitted(false);
    } else if (card.actionType === "video") {
      setActiveModal("video");
      setFormSubmitted(false);
    } else if (card.actionType === "tracking") {
      setActiveModal("tracking");
      setFormSubmitted(false);
    } else if (card.actionType === "faq") {
      const el = document.getElementById("faq-section");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Top Banner & Search Section */}
      <section className="relative overflow-hidden border-b border-border bg-surface py-16 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-7xl -translate-x-1/2 bg-radial from-cyan/10 via-transparent to-transparent blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative text-center">
          <Reveal>
            <span className="rounded-full bg-cyan/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan">
              XGRO Support Hub
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              How can we help your business today?
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground sm:text-lg">
              Get immediate assistance, book service consultations, track active project milestones, or speak directly with our team.
            </p>
          </Reveal>

          {/* Search Box Bar */}
          <div className="mt-10 max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-cyan" />
              <input
                type="text"
                placeholder="Search support options (e.g. Chat, Appointment, Email, Video Call)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-sm text-foreground shadow-xl transition-all focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Xiaomi-Style Support Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filteredCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.id} delay={idx * 50}>
                <div
                  onClick={() => handleCardClick(card)}
                  className="group relative flex items-center justify-between rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] cursor-pointer overflow-hidden"
                >
                  {/* Left Column: Text & Arrow */}
                  <div className="flex-1 pr-6">
                    {card.badge && (
                      <span className="inline-block rounded-full bg-cyan/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan mb-2">
                        {card.badge}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-foreground group-hover:text-cyan transition-colors">
                        {card.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-cyan group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Right Column: Xiaomi-Style Large Outline Icon */}
                  <div className="flex shrink-0 items-center justify-center">
                    <Icon className="h-14 w-14 sm:h-16 sm:w-16 stroke-[1.5] text-cyan transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan" />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Quick Emergency & Direct Contact Bar */}
      <section className="border-y border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">Support Hours & Emergency Contact</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {site.hours} · Phone: {site.phoneDisplay}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-cyan text-slate-950 font-bold hover:bg-cyan/90">
              <a href={site.whatsapp} target="_blank" rel="noreferrer">
                WhatsApp Support
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-bold">
              <a href={`tel:${site.phone}`}>Call Us Now</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faq-section" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <span className="rounded-full bg-cyan/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan">
            Help Center FAQs
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Frequently Asked Support Questions
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">How fast does XGRO support respond to inquiries?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              WhatsApp and Live Chat inquiries are answered within 5 to 15 minutes during support hours (10 AM to 7 PM IST). Email tickets are addressed within 2 business hours.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">How do I book a 1-on-1 service appointment or consultation call?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Click "Book Service Appointments" above to open the instant booking popup, select your service (Web Development, SEO, AI, Design), and pick your preferred time slot.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">Can I request a live video screen share demo for AI Automations or Web designs?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Yes! Click "Video Assistance & Demo" to schedule a live 20-minute Zoom or Google Meet session with our lead engineers.
            </p>
          </div>
        </div>
      </section>

      {/* MODAL 1: Book Service Appointment Popup Modal */}
      <Dialog open={activeModal === "appointment"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-cyan" /> Book Service Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select your service interest and contact info. Our team will confirm your slot immediately.
            </DialogDescription>
          </DialogHeader>

          {formSubmitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan/20 text-cyan mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Appointment Scheduled!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We have received your appointment request for <strong className="text-cyan">{selectedService}</strong>. A confirmation message has been sent to your phone/WhatsApp.
              </p>
              <Button
                onClick={() => setActiveModal(null)}
                className="mt-6 rounded-full bg-cyan text-slate-950 font-bold"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Select Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.slug} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Notes / Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what you'd like to discuss..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full bg-cyan text-slate-950 font-bold py-6">
                Confirm Service Appointment
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Email & Support Ticket Popup Modal */}
      <Dialog open={activeModal === "email"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <MailCheck className="h-6 w-6 text-cyan" /> Email Support Ticket
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send a direct query or proposal request to xgro.services@gmail.com
            </DialogDescription>
          </DialogHeader>

          {formSubmitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan/20 text-cyan mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Support Ticket Sent!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your ticket has been dispatched to our support queue. We will reply to your email shortly.
              </p>
              <Button
                onClick={() => setActiveModal(null)}
                className="mt-6 rounded-full bg-cyan text-slate-950 font-bold"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Subject / Inquiry Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website quote, SEO audit, AI Chatbot"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Detailed Query / Message
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details about your project or question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full bg-cyan text-slate-950 font-bold py-6">
                Send Support Ticket <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Video Assistance Popup Modal */}
      <Dialog open={activeModal === "video"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Video className="h-6 w-6 text-cyan" /> Video Assistance & Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Book a live 20-minute screen share demo on Google Meet or Zoom.
            </DialogDescription>
          </DialogHeader>

          {formSubmitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan/20 text-cyan mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Video Session Booked!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We have generated a Google Meet link for your session and sent it to your email/WhatsApp.
              </p>
              <Button
                onClick={() => setActiveModal(null)}
                className="mt-6 rounded-full bg-cyan text-slate-950 font-bold"
              >
                Great!
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-cyan focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full bg-cyan text-slate-950 font-bold py-6">
                Request Video Demo Link
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
