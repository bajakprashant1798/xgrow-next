"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import { QuotationDownloadModal } from "./QuotationDownloadModal";

export function ResourceDownloadTriggerButton({
  resourceTitle,
  type = "pricelist",
}: {
  resourceTitle: string;
  type?: "pricelist" | "resource" | "calculator";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-sm px-8 py-6 shadow-xl shadow-cyan/20 transition-transform hover:scale-105"
      >
        <Download className="mr-2 h-5 w-5" /> Download Price List & Coupon
      </Button>

      <QuotationDownloadModal
        open={open}
        onOpenChange={setOpen}
        type={type}
        resourceTitle={resourceTitle}
      />
    </>
  );
}
