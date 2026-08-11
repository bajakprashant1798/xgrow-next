"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, CheckCircle2, Zap, Send, Phone, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site } from "@/lib/site";
import { toast } from "sonner";

export function TimedLeadPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Website Development");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or submitted popup in this session
    const dismissed = sessionStorage.getItem("xgro_lead_popup_dismissed");
    if (dismissed) return;

    // Trigger popup after exactly 10 seconds (10000ms)
    const timer = setTimeout(() => {
      setOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (!newOpenState) {
      sessionStorage.setItem("xgro_lead_popup_dismissed", "true");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number.");
      return;
    }

    setSubmitted(true);
    sessionStorage.setItem("xgro_lead_popup_dismissed", "true");
    toast.success("Thank you! Our growth team will contact you within 2 hours.");

    // Redirect to WhatsApp with prefilled enquiry
    const message = encodeURIComponent(
      `Hi XGRO! I requested a 10-Second Growth Assessment.\nName: ${name}\nPhone: ${phone}\nService: ${service}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/916395319725?text=${message}`, "_blank");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl border border-cyan/40 bg-surface/98 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />

        <DialogHeader className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan/15 px-3 py-1 text-xs font-bold text-cyan w-fit mb-2">
            <Zap className="h-3.5 w-3.5 fill-cyan" /> Special Limited Offer
          </div>
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Scale Your Business Online <span className="text-gradient-brand">3x Faster</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Get a complimentary Website & Local SEO Audit + custom 2026 growth blueprint valued at ₹15,000 — 100% Free!
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="relative z-10 my-6 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-cyan/10 border border-cyan/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan text-slate-950 mb-3 shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-lg font-bold text-foreground">Consultation Request Received!</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Opening WhatsApp now to connect you directly with our senior strategist...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 mt-4 space-y-3.5">
            <div>
              <label htmlFor="popup-name" className="text-xs font-bold text-foreground mb-1 block">
                Your Name / Company Name
              </label>
              <Input
                id="popup-name"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl bg-card border-border text-sm"
              />
            </div>

            <div>
              <label htmlFor="popup-phone" className="text-xs font-bold text-foreground mb-1 block">
                WhatsApp Phone Number
              </label>
              <Input
                id="popup-phone"
                required
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-xl bg-card border-border text-sm"
              />
            </div>

            <div>
              <label htmlFor="popup-service" className="text-xs font-bold text-foreground mb-1 block">
                Core Requirement
              </label>
              <select
                id="popup-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan"
              >
                <option value="Website Development">Website & Mobile Apps</option>
                <option value="Graphic Design & Branding">Graphic Design & Branding</option>
                <option value="SEO & Local Ranking">SEO & Google Maps Ranking</option>
                <option value="AI & WhatsApp Automation">AI & WhatsApp Automation</option>
                <option value="Digital Marketing & Ads">Digital Marketing & Meta Ads</option>
              </select>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-cyan font-bold text-slate-950 hover:bg-cyan/90 text-sm shadow-lg shadow-cyan/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" /> Claim Free Audit & Strategy Call
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat Directly on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  No thanks, I&apos;ll browse first
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="relative z-10 mt-4 border-t border-border/60 pt-3 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> 100% Free · No Obligation · Fast Response
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
