"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, CheckCircle2, Zap, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { DEFAULT_COUNTRY, Country } from "@/lib/countries";
import { site } from "@/lib/site";
import { toast } from "sonner";

export function TimedLeadPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [service, setService] = useState("Website Development");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

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

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Please enter your name";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address (e.g. name@company.com)";
    }

    // Phone validation
    const digitsOnly = phone.replace(/\D/g, "");
    if (!digitsOnly) {
      newErrors.phone = "Please enter your phone number";
    } else if (country.code === "IN") {
      if (digitsOnly.length !== 10) {
        newErrors.phone = "Indian mobile number must be exactly 10 digits";
      } else if (!/^[6-9]/.test(digitsOnly)) {
        newErrors.phone = "Indian mobile numbers must start with 6, 7, 8, or 9";
      }
    } else {
      if (digitsOnly.length < country.minLength || digitsOnly.length > country.maxLength) {
        newErrors.phone = `Phone number must be ${country.minLength === country.maxLength ? country.minLength : `${country.minLength}-${country.maxLength}`} digits for ${country.name}`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitted(true);
    sessionStorage.setItem("xgro_lead_popup_dismissed", "true");
    toast.success("Thank you! Our growth team will contact you within 2 hours.");

    // Redirect to WhatsApp with prefilled enquiry including country code & email
    const fullPhone = `${country.dialCode} ${phone.trim()}`;
    const message = encodeURIComponent(
      `Hi XGRO! I requested a Free Growth Assessment.\n• Name: ${name.trim()}\n• Email: ${email.trim()}\n• Country: ${country.flag} ${country.name} (${country.dialCode})\n• Phone: ${fullPhone}\n• Service: ${service}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/916395319725?text=${message}`, "_blank");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[430px] max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-cyan/40 bg-surface/98 backdrop-blur-3xl p-4 sm:p-6 shadow-2xl">
        {/* Decorative Glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-cyan/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        </div>

        <DialogHeader className="relative z-10 text-left pr-9">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan w-fit mb-1.5">
            <Zap className="h-3 w-3 fill-cyan" /> Special Limited Offer
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            Scale Your Business Online <span className="text-gradient-brand">3x Faster</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-snug mt-1">
            Get a complimentary Website & SEO Audit + 2026 growth blueprint valued at ₹15,000 — 100% Free!
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="relative z-10 my-4 flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-cyan/10 border border-cyan/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan text-slate-950 mb-2.5 shadow-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">Consultation Request Received!</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Opening WhatsApp now to connect you directly with our senior strategist...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 mt-3 space-y-2.5">
            {/* Name Field */}
            <div>
              <label htmlFor="popup-name" className="text-[11px] font-bold text-foreground mb-1 block">
                Your Name / Company Name <span className="text-cyan">*</span>
              </label>
              <Input
                id="popup-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`h-9 sm:h-10 rounded-xl bg-card text-xs sm:text-sm px-3 ${
                  errors.name ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                }`}
              />
              {errors.name && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="popup-email" className="text-[11px] font-bold text-foreground mb-1 block">
                Email Address <span className="text-cyan">*</span>
              </label>
              <Input
                id="popup-email"
                type="email"
                placeholder="rahul@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`h-9 sm:h-10 rounded-xl bg-card text-xs sm:text-sm px-3 ${
                  errors.email ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                }`}
              />
              {errors.email && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.email}</p>}
            </div>

            {/* Phone Field with Country Selector */}
            <div>
              <label htmlFor="popup-phone" className="text-[11px] font-bold text-foreground mb-1 block">
                WhatsApp / Mobile Number <span className="text-cyan">*</span>
              </label>
              <CountryPhoneInput
                id="popup-phone"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                selectedCountry={country}
                onCountryChange={(c) => {
                  setCountry(c);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
              />
              {errors.phone && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.phone}</p>}
            </div>

            {/* Service Requirement Dropdown */}
            <div>
              <label htmlFor="popup-service" className="text-[11px] font-bold text-foreground mb-1 block">
                Core Requirement
              </label>
              <select
                id="popup-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="h-9 sm:h-10 w-full rounded-xl border border-border bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan"
              >
                <option value="Website Development">Website & Mobile Apps</option>
                <option value="Graphic Design & Branding">Graphic Design & Branding</option>
                <option value="SEO & Local Ranking">SEO & Google Maps Ranking</option>
                <option value="AI & WhatsApp Automation">AI & WhatsApp Automation</option>
                <option value="Digital Marketing & Ads">Digital Marketing & Meta Ads</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-1.5 flex flex-col gap-2">
              <Button
                type="submit"
                className="h-10 sm:h-11 w-full rounded-xl bg-cyan font-bold text-slate-950 hover:bg-cyan/90 text-xs sm:text-sm shadow-md shadow-cyan/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Claim Free Audit & Strategy Call
              </Button>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <a
                  href={site.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan hover:underline"
                >
                  <MessageSquare className="h-3 w-3" /> Chat on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  No thanks, I&apos;ll browse first
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="relative z-10 mt-3 border-t border-border/50 pt-2 text-center">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-cyan" /> 100% Free · No Obligation · Fast Response
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
