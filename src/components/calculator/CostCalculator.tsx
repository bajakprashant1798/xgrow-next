"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ShoppingBag,
  Rocket,
  User,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Bot,
  MessageCircle,
  CreditCard,
  Layout,
  Layers,
  HelpCircle,
  RotateCcw,
  BadgePercent,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QuotationDownloadModal } from "@/components/resources/QuotationDownloadModal";

const businessTypes = [
  {
    id: "corporate",
    name: "Business / Corporate",
    icon: Building2,
    baseCostINR: 24000,
    baseCostUSD: 320,
    desc: "Company profile, services, contact, team & client proof",
  },
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    icon: ShoppingBag,
    baseCostINR: 42000,
    baseCostUSD: 550,
    desc: "Product catalog, shopping cart, checkout & inventory management",
  },
  {
    id: "startup",
    name: "Startup / Custom SaaS",
    icon: Rocket,
    baseCostINR: 68000,
    baseCostUSD: 890,
    desc: "Bespoke web application, user auth, dashboard & APIs",
  },
  {
    id: "landing",
    name: "Portfolio / Landing Page",
    icon: User,
    baseCostINR: 14000,
    baseCostUSD: 180,
    desc: "High-converting single page, showcase & direct leads",
  },
  {
    id: "academy",
    name: "School / Institute / Booking",
    icon: GraduationCap,
    baseCostINR: 32000,
    baseCostUSD: 420,
    desc: "Courses, online admission, booking calendar & fee details",
  },
];

const pageRanges = [
  { id: "1-3", label: "1 – 3 Pages", addINR: 0, addUSD: 0 },
  { id: "4-8", label: "4 – 8 Pages", addINR: 6000, addUSD: 80 },
  { id: "9-15", label: "9 – 15 Pages", addINR: 14000, addUSD: 180 },
  { id: "16-30", label: "16 – 30 Pages", addINR: 28000, addUSD: 360 },
  { id: "30+", label: "30+ Custom Pages", addINR: 48000, addUSD: 600 },
];

export function CostCalculator() {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [selectedBiz, setSelectedBiz] = useState("corporate");
  const [selectedPages, setSelectedPages] = useState("4-8");
  const [needPayment, setNeedPayment] = useState(true);
  const [needAdmin, setNeedAdmin] = useState(true);
  const [aiChatbotType, setAiChatbotType] = useState<"advanced" | "basic" | "none">("advanced");
  const [whatsappBotType, setWhatsappBotType] = useState<"automated" | "simple" | "none">("automated");
  const [multiLang, setMultiLang] = useState(false);
  const [seoPackage, setSeoPackage] = useState<"advanced" | "basic">("advanced");

  const [modalOpen, setModalOpen] = useState(false);

  // Dynamic cost computation
  const calcData = useMemo(() => {
    const bizObj = businessTypes.find((b) => b.id === selectedBiz) || businessTypes[0];
    const pageObj = pageRanges.find((p) => p.id === selectedPages) || pageRanges[1];

    const isINR = currency === "INR";

    let base = isINR ? bizObj.baseCostINR : bizObj.baseCostUSD;
    base += isINR ? pageObj.addINR : pageObj.addUSD;

    const paymentCost = needPayment ? (isINR ? 8000 : 100) : 0;
    const adminCost = needAdmin ? (isINR ? 12000 : 150) : 0;

    let aiCost = 0;
    if (aiChatbotType === "advanced") aiCost = isINR ? 16000 : 200;
    else if (aiChatbotType === "basic") aiCost = isINR ? 7000 : 90;

    let waCost = 0;
    if (whatsappBotType === "automated") waCost = isINR ? 12000 : 150;

    const langCost = multiLang ? (isINR ? 7000 : 90) : 0;
    const seoCost = seoPackage === "advanced" ? (isINR ? 10000 : 130) : 0;

    const totalMinExact = base + paymentCost + adminCost + aiCost + waCost + langCost + seoCost;
    // Upper range variation (~25% overhead for custom assets/revisions buffer)
    const totalMaxExact = Math.round(totalMinExact * 1.28);

    const discountPercent = 15;
    const finalMin = Math.round(totalMinExact * (1 - discountPercent / 100));
    const finalMax = Math.round(totalMaxExact * (1 - discountPercent / 100));

    const sym = isINR ? "₹" : "$";

    const featureList = [
      { name: `Project Type: ${bizObj.name}`, included: true, costText: `${sym}${isINR ? bizObj.baseCostINR.toLocaleString("en-IN") : bizObj.baseCostUSD}` },
      { name: `Page Scale (${pageObj.label})`, included: true, costText: pageObj.addINR > 0 ? `+${sym}${isINR ? pageObj.addINR.toLocaleString("en-IN") : pageObj.addUSD}` : "Included Base" },
      { name: "Payment Gateway Integration", included: needPayment, costText: needPayment ? `+${sym}${isINR ? "8,000" : "100"}` : "Not Selected" },
      { name: "Admin Panel / Custom CMS", included: needAdmin, costText: needAdmin ? `+${sym}${isINR ? "12,000" : "150"}` : "Not Selected" },
      { name: `AI Chatbot (${aiChatbotType === "advanced" ? "Smart Trained Assistant" : aiChatbotType === "basic" ? "Basic FAQs Bot" : "None"})`, included: aiChatbotType !== "none", costText: aiChatbotType === "advanced" ? `+${sym}${isINR ? "16,000" : "200"}` : aiChatbotType === "basic" ? `+${sym}${isINR ? "7,000" : "90"}` : "Not Selected" },
      { name: `WhatsApp Bot (${whatsappBotType === "automated" ? "Automated 24/7 Lead Bot" : whatsappBotType === "simple" ? "WhatsApp Button" : "None"})`, included: whatsappBotType !== "none", costText: whatsappBotType === "automated" ? `+${sym}${isINR ? "12,000" : "150"}` : "Included Free" },
      { name: "Multi-Language Support (Hindi + English)", included: multiLang, costText: multiLang ? `+${sym}${isINR ? "7,000" : "90"}` : "Not Selected" },
      { name: `SEO Setup (${seoPackage === "advanced" ? "Advanced Local + Tech SEO" : "Basic On-Page"})`, included: true, costText: seoPackage === "advanced" ? `+${sym}${isINR ? "10,000" : "130"}` : "Free" },
    ];

    return {
      businessType: bizObj.name,
      pagesCount: pageObj.label,
      currency,
      currencySymbol: sym,
      minPrice: totalMinExact,
      maxPrice: totalMaxExact,
      discountPercent,
      finalMinPrice: finalMin,
      finalMaxPrice: finalMax,
      features: featureList,
    };
  }, [
    selectedBiz,
    selectedPages,
    needPayment,
    needAdmin,
    aiChatbotType,
    whatsappBotType,
    multiLang,
    seoPackage,
    currency,
  ]);

  const handleReset = () => {
    setSelectedBiz("corporate");
    setSelectedPages("4-8");
    setNeedPayment(true);
    setNeedAdmin(true);
    setAiChatbotType("advanced");
    setWhatsappBotType("automated");
    setMultiLang(false);
    setSeoPackage("advanced");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border/80 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan/15 text-cyan border-cyan/30 px-3 py-1 font-bold">
              ⭐ INTERACTIVE COST ESTIMATOR
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Instant Real-time Quotation
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
            AI Website Cost Calculator
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your project requirements below to see instant estimated pricing and unlock a 15% discount coupon!
          </p>
        </div>

        {/* Currency Switcher & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-2xl border border-border bg-card p-1">
            <button
              onClick={() => setCurrency("INR")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                currency === "INR"
                  ? "bg-cyan text-slate-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇮🇳 INR (₹)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                currency === "USD"
                  ? "bg-cyan text-slate-950 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
            title="Reset options"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Interactive Options Selection */}
        <div className="space-y-8">
          {/* Step 1: Business Type */}
          <div>
            <label className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-slate-950 font-extrabold text-xs">
                1
              </span>
              Select Business / Project Type
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {businessTypes.map((b) => {
                const IconComponent = b.icon;
                const isSelected = selectedBiz === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBiz(b.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-cyan bg-cyan/10 shadow-lg shadow-cyan/5 text-foreground ring-1 ring-cyan"
                        : "border-border/80 bg-card hover:border-cyan/50 hover:bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            isSelected ? "bg-cyan text-slate-950" : "bg-secondary text-cyan"
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-cyan" />}
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-foreground">{b.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-snug line-clamp-2">{b.desc}</p>
                    </div>
                    <div className="mt-3 border-t border-border/50 pt-2 text-[11px] font-bold text-cyan">
                      From {calcData.currencySymbol}
                      {currency === "INR" ? b.baseCostINR.toLocaleString("en-IN") : b.baseCostUSD}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Number of Pages */}
          <div>
            <label className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-slate-950 font-extrabold text-xs">
                2
              </span>
              Number of Pages
            </label>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {pageRanges.map((p) => {
                const isSelected = selectedPages === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPages(p.id)}
                    className={`rounded-2xl border px-4 py-3 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-cyan bg-cyan text-slate-950 shadow-md font-black"
                        : "border-border bg-card text-foreground hover:border-cyan/50 hover:bg-secondary"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Core Features & Systems */}
          <div>
            <label className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-slate-950 font-extrabold text-xs">
                3
              </span>
              Core Integrations & Functionality
            </label>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {/* Payment Gateway Toggle Card */}
              <div
                onClick={() => setNeedPayment(!needPayment)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  needPayment
                    ? "border-cyan bg-cyan/10 ring-1 ring-cyan"
                    : "border-border bg-card hover:border-cyan/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Need Payment Gateway?</h4>
                      <p className="text-xs text-muted-foreground">Razorpay, Stripe, UPI & Cards</p>
                    </div>
                  </div>
                  <div
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      needPayment ? "bg-cyan" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-slate-950 transition-transform ${
                        needPayment ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Panel / CMS Toggle Card */}
              <div
                onClick={() => setNeedAdmin(!needAdmin)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  needAdmin
                    ? "border-cyan bg-cyan/10 ring-1 ring-cyan"
                    : "border-border bg-card hover:border-cyan/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                      <Layout className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Need Admin Panel / CMS?</h4>
                      <p className="text-xs text-muted-foreground">Manage content, leads & orders</p>
                    </div>
                  </div>
                  <div
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      needAdmin ? "bg-cyan" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-slate-950 transition-transform ${
                        needAdmin ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: AI & WhatsApp Bot Add-ons */}
          <div>
            <label className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-slate-950 font-extrabold text-xs">
                4
              </span>
              AI & Automation Capabilities
            </label>

            <div className="mt-3 space-y-4">
              {/* AI Chatbot selection */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-5 w-5 text-cyan" />
                  <h4 className="text-sm font-bold text-foreground">Need AI Chatbot Assistant?</h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "advanced", label: "Smart Trained AI Bot", desc: "Qualifies leads & answers FAQs 24/7" },
                    { id: "basic", label: "Basic FAQs Bot", desc: "Simple rule-based menu responses" },
                    { id: "none", label: "No AI Chatbot", desc: "Standard contact forms only" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAiChatbotType(opt.id as any)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        aiChatbotType === opt.id
                          ? "border-cyan bg-cyan/15 font-bold text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{opt.label}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Bot selection */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-foreground">Need WhatsApp Bot Automation?</h4>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "automated", label: "Automated Lead Bot", desc: "Auto-replies, catalog & WhatsApp CRM" },
                    { id: "simple", label: "WhatsApp Button", desc: "Direct chat link button on site" },
                    { id: "none", label: "No WhatsApp Bot", desc: "Email/phone inquiries only" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWhatsappBotType(opt.id as any)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        whatsappBotType === opt.id
                          ? "border-emerald-500 bg-emerald-500/10 font-bold text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{opt.label}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: SEO & Multi-language Options */}
          <div>
            <label className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-slate-950 font-extrabold text-xs">
                5
              </span>
              SEO & Multi-Language Enhancements
            </label>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {/* Multi-language switch */}
              <div
                onClick={() => setMultiLang(!multiLang)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  multiLang ? "border-cyan bg-cyan/10 ring-1 ring-cyan" : "border-border bg-card hover:border-cyan/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-cyan" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Multi-Language (Hindi + English)</h4>
                      <p className="text-xs text-muted-foreground">Reach non-English visitors</p>
                    </div>
                  </div>
                  <div className={`h-6 w-11 rounded-full p-0.5 transition-colors ${multiLang ? "bg-cyan" : "bg-secondary"}`}>
                    <div className={`h-5 w-5 rounded-full bg-slate-950 transition-transform ${multiLang ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>

              {/* SEO Switch */}
              <div
                onClick={() => setSeoPackage(seoPackage === "advanced" ? "basic" : "advanced")}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  seoPackage === "advanced" ? "border-cyan bg-cyan/10 ring-1 ring-cyan" : "border-border bg-card hover:border-cyan/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Advanced Local & Tech SEO</h4>
                      <p className="text-xs text-muted-foreground">Google Maps & keyword setup</p>
                    </div>
                  </div>
                  <div className={`h-6 w-11 rounded-full p-0.5 transition-colors ${seoPackage === "advanced" ? "bg-cyan" : "bg-secondary"}`}>
                    <div className={`h-5 w-5 rounded-full bg-slate-950 transition-transform ${seoPackage === "advanced" ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Calculated Result & Quotation Output Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="rounded-3xl border border-cyan/40 bg-radial from-slate-900 via-slate-950 to-background p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Sparkles className="h-40 w-40 text-cyan" />
            </div>

            <CardContent className="p-0 relative z-10">
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <Badge className="bg-cyan text-slate-950 font-black px-3 py-1 text-xs uppercase tracking-wider">
                  Real-Time Calculation
                </Badge>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Fixed Price Guarantee
                </span>
              </div>

              {/* Main Price Output Display */}
              <div className="mt-6 text-center">
                <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  Estimated Investment Range
                </p>
                <div className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                  <span className="text-cyan">{calcData.currencySymbol}</span>
                  <span>{calcData.finalMinPrice.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground font-light mx-1">–</span>
                  <span>{calcData.currencySymbol}{calcData.finalMaxPrice.toLocaleString("en-IN")}</span>
                </div>

                {/* Original price before discount */}
                <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="line-through">
                    Standard: {calcData.currencySymbol}{calcData.minPrice.toLocaleString("en-IN")} – {calcData.currencySymbol}{calcData.maxPrice.toLocaleString("en-IN")}
                  </span>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] font-bold">
                    Save {calcData.discountPercent}%
                  </Badge>
                </div>
              </div>

              {/* Discount Offer Banner */}
              <div className="mt-6 rounded-2xl border border-dashed border-cyan/40 bg-cyan/10 p-4 text-left flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan text-slate-950 font-black">
                  <BadgePercent className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-cyan uppercase tracking-wider">
                    Discount Coupon Available!
                  </h5>
                  <p className="mt-0.5 text-xs text-slate-200 leading-snug">
                    Get an instant 15% OFF voucher code + itemized PDF quote sent immediately to your phone.
                  </p>
                </div>
              </div>

              {/* Selected Features Checklist */}
              <div className="mt-6 border-t border-border/80 pt-4">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Scope Included in Estimate:
                </h5>
                <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {calcData.features.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-2 truncate">
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${f.included ? "text-cyan" : "text-muted-foreground opacity-40"}`} />
                        <span className={f.included ? "font-medium" : "line-through opacity-50"}>
                          {f.name}
                        </span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-2">
                        {f.costText}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Primary Call to Action Button */}
              <div className="mt-8 space-y-3">
                <Button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-sm py-6 shadow-xl shadow-cyan/20 hover:scale-[1.02] transition-transform"
                >
                  <Download className="mr-2 h-4 w-4" /> Get Detailed Quote & Claim Coupon
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  ⚡ Instantly downloads PDF quotation with 100% source code ownership details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal for Lead Download */}
      <QuotationDownloadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type="calculator"
        calcData={calcData}
      />
    </div>
  );
}
