"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getServices, getFaqs, subscribeToDataChanges } from "@/lib/db";
import { faqs as fallbackFaqs, services as fallbackServices } from "@/lib/site";
import { ServiceModel, FaqModel } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n";

const pages = [
  { label: "Home", to: "/" },
  { label: "About XGRO", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Portfolio & case studies", to: "/portfolio" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "FAQs", to: "/faqs" },
  { label: "Careers", to: "/careers" },
  { label: "Contact", to: "/contact" },
] as const;

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [servicesList, setServicesList] = useState<ServiceModel[]>([]);
  const [faqsList, setFaqsList] = useState<FaqModel[]>([]);

  const loadData = async () => {
    const [sData, fData] = await Promise.all([getServices(), getFaqs()]);
    const publishedServices = sData.filter((s) => s.status === "published");
    setServicesList(publishedServices.length > 0 ? publishedServices : (fallbackServices as any));
    const publishedFaqs = fData.filter((f) => f.status === "published");
    setFaqsList(publishedFaqs.length > 0 ? publishedFaqs : (fallbackFaqs as any));
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const displayServices = servicesList.length > 0 ? servicesList : (fallbackServices as any);
  const displayFaqs = faqsList.length > 0 ? faqsList : (fallbackFaqs as any);

  const go = (to: string, hash?: string) => {
    onOpenChange(false);
    if (hash) router.push(`${to}#${hash}`);
    else router.push(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("search.placeholder")} />
      <CommandList>
        <CommandEmpty>Nothing found. Try “SEO”, “pricing” or “WhatsApp”.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Services">
          {displayServices.map((s: any) => {
            const items = (s.features || s.items || []) as string[];
            return (
              <CommandItem
                key={s.id || s.slug}
                value={`${s.title} ${items.join(" ")}`}
                onSelect={() => go("/services", s.slug)}
              >
                {s.title}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Answers">
          {displayFaqs.map((f: any, idx: number) => {
            const question = f.question || f.q;
            return (
              <CommandItem key={f.id || question || idx} value={question} onSelect={() => go("/faqs")}>
                {question}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}