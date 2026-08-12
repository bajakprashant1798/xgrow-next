"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";
import { ResourceItem } from "@/lib/resourcesData";

export function PromptCopyModal({
  resource,
  open,
  onOpenChange,
}: {
  resource: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!resource) return null;

  const handleCopy = () => {
    if (resource.promptContent) {
      navigator.clipboard.writeText(resource.promptContent);
      setCopied(true);
      toast.success("AI Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 px-3 py-1 font-bold">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> FREE AI PROMPT PACK
            </Badge>
          </div>
          <DialogTitle className="mt-2 text-xl font-black text-foreground">
            {resource.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Copy this ready-to-use prompt directly into ChatGPT, Midjourney, or Claude.
          </DialogDescription>
        </DialogHeader>

        {/* Prompt Content Display Box */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5 text-cyan font-bold">
              <Terminal className="h-4 w-4" /> Ready-to-Copy Prompt
            </span>
            <span className="text-[11px] text-muted-foreground">Updated {resource.dateAdded}</span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground bg-background p-4 rounded-xl border border-border/80 max-h-60 overflow-y-auto">
            {resource.promptContent || "No prompt content available."}
          </pre>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            ⚡ Replace bracketed text like <span className="text-cyan font-bold">[PRODUCT/SERVICE]</span> before running!
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-bold"
            >
              Close
            </Button>
            <Button
              onClick={handleCopy}
              className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-5 py-5 shadow-lg"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-950" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
