"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "./SectionHeading";
import { getFaqs, subscribeToDataChanges } from "@/lib/db";
import { faqs as fallbackFaqs } from "@/lib/site";
import { FaqModel } from "@/lib/supabase/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const [faqsList, setFaqsList] = useState<FaqModel[]>([]);

  const loadFaqs = async () => {
    const data = await getFaqs();
    const published = data.filter((f) => f.status === "published");
    setFaqsList(published.length > 0 ? published : (fallbackFaqs as any));
  };

  useEffect(() => {
    loadFaqs();
    return subscribeToDataChanges(loadFaqs);
  }, []);

  const displayFaqs = faqsList.length > 0 ? faqsList : (fallbackFaqs as any);

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:py-28">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions we get on the first call"
        align="center"
      />
      <Accordion type="single" collapsible className="mt-10">
        {displayFaqs.map((f: any, i: number) => {
          const question = f.question || f.q;
          const answer = f.answer || f.a;

          return (
            <AccordionItem key={f.id || question || i} value={question}>
              <AccordionTrigger className="text-left text-base font-semibold">{question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}