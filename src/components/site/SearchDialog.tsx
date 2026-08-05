"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { faqs, services } from "@/lib/site";
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
          {services.map((s) => (
            <CommandItem
              key={s.slug}
              value={`${s.title} ${s.items.join(" ")}`}
              onSelect={() => go("/services", s.slug)}
            >
              {s.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Answers">
          {faqs.map((f) => (
            <CommandItem key={f.q} value={f.q} onSelect={() => go("/faqs")}>
              {f.q}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}