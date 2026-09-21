"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CountryPhoneInput } from "@/components/ui/country-phone-input";
import { DEFAULT_COUNTRY, Country } from "@/lib/countries";
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Gift,
  Loader2,
  MessageSquare,
  Sparkles,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { site } from "@/lib/site";
import { downloadQuotationPDF, downloadPriceListPDF, type QuoteDetails } from "@/lib/pdfGenerator";

export interface QuotationDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "calculator" | "pricelist" | "resource";
  resourceTitle?: string;
  calcData?: {
    businessType: string;
    pagesCount: string;
    currency: "INR" | "USD";
    currencySymbol: string;
    features: { name: string; included: boolean; costText: string }[];
    minPrice: number;
    maxPrice: number;
    discountPercent: number;
    finalMinPrice: number;
    finalMaxPrice: number;
  };
}

export function QuotationDownloadModal({
  open,
  onOpenChange,
  type,
  resourceTitle = "Official Price List & Rate Card 2026",
  calcData,
}: QuotationDownloadModalProps) {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState("");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

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

    setLoading(true);

    setTimeout(() => {
      // Generate a unique 15% discount coupon
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const coupon = `XGROW-SAVE15-${randomSuffix}`;
      setGeneratedCoupon(coupon);

      const fullPhone = `${country.dialCode} ${phone.trim()}`;

      // Save lead to local CRM storage so marketing team has visitor info
      try {
        const existingLeads = JSON.parse(localStorage.getItem("xgro_leads") || "[]");
        const newLead = {
          id: `LEAD-${Date.now()}`,
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          phone: fullPhone,
          country: `${country.flag} ${country.name} (${country.dialCode})`,
          notes: notes.trim(),
          type,
          resourceTitle: type === "calculator" ? "Custom Calculator Quote" : resourceTitle,
          coupon,
          calcData: calcData || null,
          createdAt: new Date().toISOString(),
        };
        existingLeads.unshift(newLead);
        localStorage.setItem("xgro_leads", JSON.stringify(existingLeads));
      } catch (err) {
        console.error("Local lead save error:", err);
      }

      setLoading(false);
      setSubmitted(true);
      toast.success("Details saved! Your discount coupon and PDF download are ready.");
    }, 600);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(generatedCoupon);
    setCopied(true);
    toast.success("Coupon code copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPDF = () => {
    const today = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const validUntil = new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const fullPhone = `${country.dialCode} ${phone.trim()}`;

    if (type === "calculator" && calcData) {
      const quoteDetails: QuoteDetails = {
        quoteId: `${Math.floor(100000 + Math.random() * 900000)}`,
        couponCode: generatedCoupon || "XGROW-SAVE15",
        clientName: name.trim(),
        businessName: businessName.trim() || "Valued Client",
        clientEmail: email.trim(),
        clientPhone: fullPhone,
        businessType: calcData.businessType,
        pagesCount: calcData.pagesCount,
        currency: calcData.currency,
        currencySymbol: calcData.currencySymbol,
        features: calcData.features,
        minPrice: calcData.minPrice,
        maxPrice: calcData.maxPrice,
        discountPercent: calcData.discountPercent,
        finalMinPrice: calcData.finalMinPrice,
        finalMaxPrice: calcData.finalMaxPrice,
        date: today,
        validUntil: validUntil,
      };
      downloadQuotationPDF(quoteDetails);
      toast.success("Quotation PDF opened! Click 'Print / Save as PDF' in the window.");
    } else {
      downloadPriceListPDF({
        resourceTitle: resourceTitle,
        resourceCategory: type === "pricelist" ? "Price List" : "Resource Hub",
        clientName: name.trim(),
        clientEmail: email.trim(),
        clientPhone: fullPhone,
        businessName: businessName.trim(),
        couponCode: generatedCoupon || "XGROW-SAVE15",
        date: today,
      });
      toast.success("Official Price List PDF opened! Click 'Print / Save as PDF' in window.");
    }
  };

  const handleWhatsAppRedirect = () => {
    let msg = `Hi XGRO Team! My name is ${name.trim()}. `;
    if (type === "calculator" && calcData) {
      msg += `I just used your AI Cost Calculator for my ${calcData.businessType} project (${calcData.pagesCount}). Estimated quote: ${calcData.currencySymbol}${calcData.finalMinPrice.toLocaleString()} - ${calcData.currencySymbol}${calcData.finalMaxPrice.toLocaleString()}. My Discount Coupon Code is ${generatedCoupon}. I'd like to proceed!`;
    } else {
      msg += `I requested the ${resourceTitle} with discount coupon ${generatedCoupon}. I'd like to discuss my project requirement.`;
    }
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${site.phone}?text=${encoded}`, "_blank");
  };

  const handleReset = () => {
    setSubmitted(false);
    setGeneratedCoupon("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">
        {!submitted ? (
          <>
            <DialogHeader className="pr-9">
              <div className="flex items-center gap-2">
                <Badge className="bg-cyan/15 text-cyan hover:bg-cyan/20 border-cyan/30 px-3 py-1 font-bold">
                  <Gift className="mr-1.5 h-3.5 w-3.5" /> 15% OFF DISCOUNT COUPON
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-xl sm:text-2xl font-black text-foreground">
                {type === "calculator"
                  ? "Get Detailed Quote & Claim Coupon"
                  : `Download ${resourceTitle}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter your details to receive your customized PDF quotation, official rate card, and instant 15% discount code!
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="visitor-name" className="text-xs font-bold text-foreground">
                    Your Name <span className="text-cyan">*</span>
                  </Label>
                  <Input
                    id="visitor-name"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={`h-10 rounded-xl ${
                      errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visitor-biz" className="text-xs font-bold text-foreground">
                    Business / Brand Name
                  </Label>
                  <Input
                    id="visitor-biz"
                    placeholder="e.g. Acme Enterprises"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="visitor-email" className="text-xs font-bold text-foreground">
                    Email Address <span className="text-cyan">*</span>
                  </Label>
                  <Input
                    id="visitor-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={`h-10 rounded-xl ${
                      errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visitor-phone" className="text-xs font-bold text-foreground">
                    WhatsApp / Mobile Number <span className="text-cyan">*</span>
                  </Label>
                  <CountryPhoneInput
                    id="visitor-phone"
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="visitor-notes" className="text-xs font-bold text-foreground">
                  Specific Requirements / Timeline (Optional)
                </Label>
                <Textarea
                  id="visitor-notes"
                  rows={2}
                  placeholder="Tell us any specific features, launch date or requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-3.5 text-xs text-foreground flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan shrink-0" />
                <p className="leading-snug">
                  <strong className="text-cyan font-bold">Marketing Guarantee:</strong> You will instantly receive a printable PDF download link + 15% discount voucher.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-extrabold text-xs px-6 py-5 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" /> Unlock & Download PDF
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-2xl font-black text-foreground">
              Quote & Discount Unlocked!
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Thank you, <span className="text-foreground font-bold">{name}</span>! Here is your exclusive discount coupon code and PDF document download.
            </p>

            {/* Coupon Code Display Box */}
            <div className="mt-6 rounded-2xl border border-dashed border-cyan/60 bg-gradient-to-br from-cyan/10 via-surface to-cyan/5 p-5">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-cyan uppercase tracking-wider">
                <Ticket className="h-4 w-4" /> 15% Instant Discount Coupon
              </div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-black tracking-widest text-foreground bg-background px-4 py-2 rounded-xl border border-border">
                  {generatedCoupon}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCoupon}
                  title="Copy Coupon"
                  className="h-10 w-10 rounded-xl"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Save or mention this code to get 15% OFF on your project scope!
              </p>
            </div>

            {/* Actions: Download PDF & WhatsApp */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownloadPDF}
                className="flex-1 rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-extrabold text-xs py-5 shadow-lg"
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF Quotation
              </Button>
              <Button
                onClick={handleWhatsAppRedirect}
                variant="outline"
                className="flex-1 rounded-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs py-5"
              >
                <MessageSquare className="mr-2 h-4 w-4 text-emerald-400" /> Share on WhatsApp
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-center">
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground underline font-semibold"
              >
                Close & Return to Site
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
