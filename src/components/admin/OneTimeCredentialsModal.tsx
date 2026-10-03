'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CredentialsPayload,
  downloadCredentialsFile,
  getCredentialsFileName,
  buildWhatsAppCredentialsText,
} from '@/lib/credentials-download';

interface OneTimeCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CredentialsPayload | null;
  title?: string;
  description?: string;
}

export function OneTimeCredentialsModal({
  open,
  onOpenChange,
  data,
  title = 'One-Time Login Credentials Ready',
  description = 'For enterprise security, this temporary password is only displayed right now. Please download the credentials file or copy and share it with the user immediately.',
}: OneTimeCredentialsModalProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  if (!data) return null;

  const fileName = getCredentialsFileName(data.name, data.email);
  const loginUrl =
    data.loginUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://xgro.in/login');

  const handleDownload = () => {
    downloadCredentialsFile({
      ...data,
      loginUrl,
    });
    setHasDownloaded(true);
    toast.success(`Downloaded "${fileName}"! Keep this file secure.`);
  };

  const handleCopy = () => {
    const text = buildWhatsAppCredentialsText({
      ...data,
      loginUrl,
    });
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
    toast.success('Credentials copied to clipboard (WhatsApp / Email format)!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8 bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-cyan">
            <KeyRound className="h-5 w-5" />
            <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Security Alert Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300 animate-in fade-in-50 duration-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold block text-amber-200">One-Time Password Notice</span>
            This temporary password will <strong className="text-amber-100">not be displayed again</strong> in the admin tables. Download or copy it now before closing.
          </div>
        </div>

        {/* Formatted Credential Card */}
        <div className="p-4 rounded-2xl bg-surface/80 border border-cyan/40 space-y-2.5 font-mono text-xs shadow-inner">
          <div className="flex justify-between items-center border-b border-border/80 pb-2">
            <span className="text-muted-foreground font-sans text-xs">Account Name:</span>
            <span className="font-bold text-foreground font-sans text-xs">{data.name}</span>
          </div>

          <div className="flex justify-between items-center border-b border-border/80 pb-2">
            <span className="text-muted-foreground font-sans text-xs">Assigned Role:</span>
            <span className="font-bold text-cyan font-sans text-xs">
              {data.roleDisplayName || 'Client (Portal Workspace)'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-border/80 pb-2">
            <span className="text-muted-foreground font-sans text-xs">Login Email:</span>
            <span className="font-bold text-foreground text-xs break-all">{data.email}</span>
          </div>

          <div className="flex justify-between items-center border-b border-border/80 pb-2">
            <span className="text-muted-foreground font-sans text-xs">Temporary Password:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                {showPassword ? data.password : '••••••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground p-1"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5 text-cyan" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="text-muted-foreground font-sans text-xs">Portal URL:</span>
            <span className="font-mono text-cyan text-[11px] truncate max-w-[200px]">
              {loginUrl}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Primary Action: Download File */}
          <Button
            type="button"
            onClick={handleDownload}
            className="w-full rounded-2xl bg-cyan text-slate-950 hover:bg-cyan/90 font-extrabold text-xs h-10 shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download Credentials Document (.txt)</span>
          </Button>

          {/* Secondary Action: Copy WhatsApp Text */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full rounded-2xl border-border bg-surface/60 hover:bg-surface text-foreground font-bold text-xs h-9.5 flex items-center justify-center gap-2"
          >
            {hasCopied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-cyan" />
                <span>Copy for WhatsApp / Email</span>
              </>
            )}
          </Button>

          {/* Close Modal Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground h-8"
          >
            Done & Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
