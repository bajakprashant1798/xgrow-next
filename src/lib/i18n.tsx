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

function applyGoogleTranslate(targetLang: Lang) {
  if (typeof window === "undefined") return;

  const cookieVal = targetLang === "hi" ? "/en/hi" : "/en/en";
  const domain = window.location.hostname;

  // Set translation cookie for Google Translate
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain}`;
  document.cookie = `googtrans=${cookieVal}; path=/;`;

  // Inject Google Translate engine script if not already present
  if (!document.getElementById("google-translate-script")) {
    window.googleTranslateElementInit = () => {
      // @ts-expect-error Google Translate WidgetInit
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }

  // Poll for combo element to trigger change event safely WITHOUT window.location.reload()
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      if (select.value !== (targetLang === "hi" ? "hi" : "en")) {
        select.value = targetLang === "hi" ? "hi" : "en";
        select.dispatchEvent(new Event("change"));
      }
      clearInterval(interval);
    } else if (attempts >= 15) {
      clearInterval(interval);
    }
  }, 150);
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("xgro-lang") as Lang | null;
    if (stored === "hi" || stored === "en") {
      setLangState(stored);
      if (stored === "hi") {
        applyGoogleTranslate("hi");
      }
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("xgro-lang", l);
    document.documentElement.lang = l;
    applyGoogleTranslate(l);
  }, []);

  const t = useCallback((k: Key) => dict[k][lang] ?? dict[k].en, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

