"use client";

import { useState, useEffect, type FormEvent } from "react";
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
  ExternalLink,
  Link as LinkIcon,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { site } from "@/lib/site";
import { downloadQuotationPDF, downloadPriceListPDF, type QuoteDetails } from "@/lib/pdfGenerator";
import { ResourceItem } from "@/lib/resourcesData";
import { getUnlockedLead, saveResourceLead, setUnlockedLead } from "@/lib/db";
import { sendLeadNotificationEmail } from "@/lib/email-service";

export interface QuotationDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "calculator" | "pricelist" | "resource";
  resourceTitle?: string;
  resource?: ResourceItem | null;
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
  resource,
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
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState("XGROW-SAVE15");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const effectiveTitle = resource?.title || resourceTitle;
  const effectiveLink = resource?.linkUrl || resource?.link_url || "";
  const effectiveDownload = resource?.downloadUrl || resource?.download_url || resource?.pdf_file || "";

  // Auto-detect if visitor already filled details once before
  useEffect(() => {
    if (open) {
      const existingLead = getUnlockedLead();
      if (existingLead) {
        setName(existingLead.name || "");
        setBusinessName(existingLead.business_name || "");
        setEmail(existingLead.email || "");
        setPhone(existingLead.phone || "");
        setGeneratedCoupon(existingLead.coupon_code || "XGROW-SAVE15");
        setIsExistingUser(true);
        // Automatically set submitted = true so they get instant access without refilling!
        setSubmitted(true);
      } else {
        setIsExistingUser(false);
        setSubmitted(false);
      }
    }
  }, [open, resource]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Generate a unique 15% discount coupon
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const coupon = `XGROW-SAVE15-${randomSuffix}`;
      setGeneratedCoupon(coupon);

      const fullPhone = phone.startsWith("+") ? phone.trim() : `${country.dialCode} ${phone.trim()}`;

      // Save lead to CRM database & Supabase
      const savedLead = await saveResourceLead({
        name: name.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
        phone: fullPhone,
        country: `${country.flag} ${country.name} (${country.dialCode})`,
        notes: notes.trim(),
        resource_id: resource?.id,
        resource_title: type === "calculator" ? "Custom Calculator Quote" : effectiveTitle,
        resource_type: resource?.type || type,
        coupon_code: coupon,
        calc_data: calcData || null,
      });

      // Dispatch notification email to admin
      sendLeadNotificationEmail({
        lead: savedLead,
        resourceTitle: effectiveTitle,
      }).catch(() => {});

      setSubmitted(true);
      toast.success("All-access pass activated! Your resource & 15% discount voucher are unlocked.");
    } catch (err) {
      toast.error("Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(generatedCoupon);
    setCopiedCoupon(true);
    toast.success("Coupon code copied to clipboard!");
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  const handleCopyLink = (linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    toast.success("Direct resource link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
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

    const fullPhone = phone.startsWith("+") ? phone.trim() : `${country.dialCode} ${phone.trim()}`;

    // 1. If resource has a direct uploaded PDF or external download URL
    if (effectiveDownload && (effectiveDownload.startsWith("http://") || effectiveDownload.startsWith("https://") || effectiveDownload.startsWith("data:") || effectiveDownload.endsWith(".pdf"))) {
      window.open(effectiveDownload, "_blank");
      toast.success(`Opening "${effectiveTitle}" in new tab...`);
      return;
    }

    // 2. If resource has a link URL (e.g. Google Drive, Canva, Notion, or external web link)
    if (effectiveLink && (effectiveLink.startsWith("http://") || effectiveLink.startsWith("https://") || effectiveLink.startsWith("/"))) {
      if (effectiveLink.startsWith("/")) {
        window.location.href = effectiveLink;
      } else {
        window.open(effectiveLink, "_blank");
      }
      toast.success(`Opening "${effectiveTitle}" link in new tab...`);
      return;
    }

    // 3. If it is the custom interactive calculator quote
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
      return;
    }

    // 4. Only if it is explicitly the generic "Official Agency Price List & Rate Card"
    if (type === "pricelist") {
      downloadPriceListPDF({
        resourceTitle: effectiveTitle,
        resourceCategory: "Price List",
        clientName: name.trim(),
        clientEmail: email.trim(),
        clientPhone: fullPhone,
        businessName: businessName.trim(),
        couponCode: generatedCoupon || "XGROW-SAVE15",
        date: today,
      });
      toast.success("Official PDF document opened! Click 'Print / Save as PDF' in window.");
      return;
    }

    toast.info(`Access unlocked for "${effectiveTitle}"!`);
  };

  const handleWhatsAppRedirect = () => {
    let msg = `Hi XGRO Team! My name is ${name.trim()}. `;
    if (type === "calculator" && calcData) {
      msg += `I just used your AI Cost Calculator for my ${calcData.businessType} project (${calcData.pagesCount}). Estimated quote: ${calcData.currencySymbol}${calcData.finalMinPrice.toLocaleString()} - ${calcData.currencySymbol}${calcData.finalMaxPrice.toLocaleString()}. My Discount Coupon Code is ${generatedCoupon}. I'd like to proceed!`;
    } else {
      msg += `I unlocked the "${effectiveTitle}" with discount coupon ${generatedCoupon}. I'd like to discuss my project requirements.`;
    }
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${site.phone}?text=${encoded}`, "_blank");
  };

  const handleReset = () => {
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
                  <Gift className="mr-1.5 h-3.5 w-3.5" /> 15% OFF DISCOUNT & ALL-ACCESS PASS
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-xl sm:text-2xl font-black text-foreground">
                {type === "calculator"
                  ? "Get Detailed Quote & Claim Coupon"
                  : `Unlock "${effectiveTitle}"`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Fill in your details once to unlock instant PDF downloads, cloud links, Canva kits, and your personalized 15% discount coupon!
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
                  placeholder="Tell us any specific project features, launch date or requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-3.5 text-xs text-foreground flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan shrink-0" />
                <p className="leading-snug">
                  <strong className="text-cyan font-bold">1-Time Unlock:</strong> After filling this once, you can freely download and access all resources without filling this form again!
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlocking...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-4 w-4" /> Unlock & Access Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-2 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-foreground">
                Resource & Discount Unlocked!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {name ? (
                  <>Welcome back, <span className="text-foreground font-bold">{name}</span>! Your resource access and discount coupon are ready below.</>
                ) : (
                  <>Your resource access and exclusive discount coupon code are ready below.</>
                )}
              </p>
            </div>

            {/* Direct Link Section (If resource has a Link URL) */}
            {effectiveLink && (
              <div className="rounded-2xl border border-cyan/40 bg-cyan/5 p-4 text-left space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-cyan">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" /> Direct Resource Link
                  </span>
                  <Badge variant="outline" className="text-[9px] border-cyan/30 text-cyan">
                    Cloud / Web Link
                  </Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border font-mono text-xs text-muted-foreground truncate select-all">
                  {effectiveLink}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => {
                      if (effectiveLink.startsWith("/")) {
                        window.location.href = effectiveLink;
                      } else {
                        window.open(effectiveLink, "_blank");
                      }
                    }}
                    className="flex-1 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs h-9 shadow-md"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in New Tab
                  </Button>
                  <Button
                    onClick={() => handleCopyLink(effectiveLink)}
                    variant="outline"
                    className="rounded-xl text-xs font-bold h-9"
                  >
                    {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            )}

            {/* Direct PDF Download / Document Button */}
            {(effectiveDownload || type === "calculator" || type === "pricelist" || (!effectiveLink && (resource?.type === "pdf" || resource?.type === "checklist"))) && (
              <div className="rounded-2xl border border-border bg-card/80 p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-cyan">
                    <FileText className="h-3.5 w-3.5" /> {effectiveTitle}
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    {effectiveDownload ? "File Ready" : "Document Ready"}
                  </Badge>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-extrabold text-xs h-10 shadow-md"
                >
                  <Download className="mr-1.5 h-4 w-4" /> Download / View Document
                </Button>
              </div>
            )}

            {/* AI Prompt Section (If resource is an AI prompt) */}
            {(resource?.type === "prompt" || resource?.promptContent || resource?.prompt_content) && (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/10 p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Ready-to-Use AI Prompt
                  </span>
                  <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-300">
                    Instant Copy
                  </Badge>
                </div>
                <pre className="p-3 rounded-xl bg-surface border border-border font-mono text-[11px] text-foreground leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                  {resource.promptContent || resource.prompt_content || "Prompt ready to copy"}
                </pre>
                <Button
                  onClick={() => {
                    const promptText = resource.promptContent || resource.prompt_content || "";
                    if (promptText) {
                      navigator.clipboard.writeText(promptText);
                      toast.success("AI Prompt copied to clipboard!");
                    }
                  }}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Prompt to Clipboard
                </Button>
              </div>
            )}

            {/* Coupon Code Display Box */}
            <div className="rounded-2xl border border-dashed border-cyan/60 bg-gradient-to-br from-cyan/10 via-surface to-cyan/5 p-4">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-cyan uppercase tracking-wider">
                <Ticket className="h-4 w-4" /> 15% Instant Discount Coupon
              </div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-foreground bg-background px-4 py-2 rounded-xl border border-border">
                  {generatedCoupon}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCoupon}
                  title="Copy Coupon"
                  className="h-10 w-10 rounded-xl"
                >
                  {copiedCoupon ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Save or mention this code to get 15% OFF on your project scope!
              </p>
            </div>

            {/* WhatsApp Contact Button */}
            <div className="pt-1">
              <Button
                onClick={handleWhatsAppRedirect}
                variant="outline"
                className="w-full rounded-2xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs h-10"
              >
                <MessageSquare className="mr-2 h-4 w-4 text-emerald-400" /> Chat on WhatsApp with Project Lead
              </Button>
            </div>

            {/* One-Time Unlock Badge Note */}
            <div className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan" />
              <span>All-Access Pass Active — explore other resources without refilling!</span>
            </div>

            <div className="border-t border-border pt-3 text-center">
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground underline font-semibold"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
