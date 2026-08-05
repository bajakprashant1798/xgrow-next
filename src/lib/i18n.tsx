"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  "nav.home": { en: "Home", hi: "होम" },
  "nav.about": { en: "About", hi: "हमारे बारे में" },
  "nav.services": { en: "Services", hi: "सेवाएँ" },
  "nav.portfolio": { en: "Portfolio", hi: "पोर्टफोलियो" },
  "nav.pricing": { en: "Pricing", hi: "मूल्य" },
  "nav.blog": { en: "Blog", hi: "ब्लॉग" },
  "nav.contact": { en: "Contact", hi: "संपर्क" },
  "nav.faqs": { en: "FAQs", hi: "सामान्य प्रश्न" },
  "nav.careers": { en: "Careers", hi: "करियर" },
  "cta.consultation": { en: "Get Free Consultation", hi: "मुफ़्त सलाह लें" },
  "cta.quote": { en: "Get a Quote", hi: "कोटेशन पाएँ" },
  "cta.portfolio": { en: "View Portfolio", hi: "पोर्टफोलियो देखें" },
  "cta.start": { en: "Start Your Project", hi: "प्रोजेक्ट शुरू करें" },
  "cta.whatsapp": { en: "Chat on WhatsApp", hi: "WhatsApp पर बात करें" },
  "cta.visit": { en: "Schedule Visit", hi: "विज़िट तय करें" },
  "hero.eyebrow": { en: "Premium Digital Growth Agency", hi: "प्रीमियम डिजिटल ग्रोथ एजेंसी" },
  "hero.title": { en: "Your Digital Growth Partner", hi: "आपका डिजिटल ग्रोथ पार्टनर" },
  "hero.sub": {
    en: "We build websites, brands and AI-powered systems that bring your business more customers — from Moradabad to the USA.",
    hi: "हम वेबसाइट, ब्रांड और AI-आधारित सिस्टम बनाते हैं जो आपके व्यवसाय को और ग्राहक दिलाते हैं — मुरादाबाद से अमेरिका तक।",
  },
  "search.placeholder": { en: "Search services, work, answers…", hi: "सेवाएँ, काम, जवाब खोजें…" },
} as const;

type Key = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("xgro-lang") as Lang | null;
    if (stored === "hi" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("xgro-lang", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((k: Key) => dict[k][lang] ?? dict[k].en, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
