'use client';

import { useState } from 'react';
import {
  Globe,
  Palette,
  Bot,
  MapPin,
  TrendingUp,
  Video,
  Share2,
  Target,
  Sparkles,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ClientModel } from '@/lib/supabase/types';
import {
  AVAILABLE_AGENCY_SERVICES,
  getServiceDefinition,
  getBillingCycleDefinition,
  getServicesForPlan,
  AgencyServiceDefinition,
} from '@/lib/client-services';

interface ClientServicesWidgetProps {
  client: ClientModel;
  onUpdateClient?: (updated: ClientModel) => void;
  isClientView?: boolean;
}

export function ClientServicesWidget({
  client,
  onUpdateClient,
  isClientView = true,
}: ClientServicesWidgetProps) {
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AgencyServiceDefinition | null>(null);
  const [addonNote, setAddonNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Extract client's active services (explicitly chosen by Admin OR derived from selected package plan)
  const clientServiceIds =
    client.services && client.services.length > 0
      ? client.services
      : getServicesForPlan(client.selected_plan);

  const activeServices = clientServiceIds.map((id) => getServiceDefinition(id));
  const availableAddons = AVAILABLE_AGENCY_SERVICES.filter(
    (s) => !clientServiceIds.includes(s.id)
  );

  const billingCycle = getBillingCycleDefinition(client.billing_cycle || 'monthly');
  const isYearly = client.billing_cycle === 'yearly';

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe':
        return <Globe className="h-5 w-5" />;
      case 'Palette':
        return <Palette className="h-5 w-5" />;
      case 'Bot':
        return <Bot className="h-5 w-5" />;
      case 'MapPin':
        return <MapPin className="h-5 w-5" />;
      case 'TrendingUp':
        return <TrendingUp className="h-5 w-5" />;
      case 'Video':
        return <Video className="h-5 w-5" />;
      case 'Share2':
        return <Share2 className="h-5 w-5" />;
      case 'Target':
        return <Target className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const handleRequestAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddon) return;
    setSubmitting(true);

    try {
      // Simulate dispatching request to admin
      await new Promise((res) => setTimeout(res, 600));
      toast.success(`Add-on Request for "${selectedAddon.name}" Sent!`, {
        description: 'Our agency lead has been notified. We will contact you on WhatsApp with scope details.',
      });
      setIsAddonModalOpen(false);
      setSelectedAddon(null);
      setAddonNote('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="services" className="space-y-4">
      {/* Header with Title and Retainer Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-card via-surface/80 to-card p-4 sm:p-5 rounded-3xl border border-border shadow-sm">
        <div className="space-y-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                Active Services & Subscribed Products
              </h3>
              <Badge className={`text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap ${billingCycle.tagClass}`}>
                {billingCycle.badge}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pl-7 sm:pl-7.5">
            {isYearly
              ? 'Premium early annual partner contract with dedicated multidisciplinary team allocation.'
              : 'Ongoing retained agency deliverables with priority sprint execution and monthly reporting.'}
          </p>
        </div>

        {isClientView && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedAddon(availableAddons[0] || AVAILABLE_AGENCY_SERVICES[0]);
              setIsAddonModalOpen(true);
            }}
            className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4 h-9 shadow-sm hover:shadow-cyan/20 hover:scale-105 transition-all gap-1.5 shrink-0 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Request Add-on Service
          </Button>
        )}
      </div>

      {/* Active Subscribed Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeServices.map((svc) => (
          <div
            key={svc.id}
            className={`p-5 rounded-3xl border bg-gradient-to-br ${svc.bgGradient} space-y-3 relative group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 mt-0.5 ${svc.badgeClass}`}>
                  {getServiceIcon(svc.iconName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-foreground group-hover:text-cyan transition-colors leading-snug break-words">
                    {svc.name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
                    {svc.category}
                  </span>
                </div>
              </div>

              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 shrink-0 whitespace-nowrap self-start">
                ● Active
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {svc.description}
            </p>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-mono flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan shrink-0" />
                Verified Agency Deliverable
              </span>
              <span className="font-bold text-foreground shrink-0">
                {client.billing_cycle === 'yearly' ? 'Annual Plan' : 'Monthly'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add-on Services Quick Discovery Strip */}
      {availableAddons.length > 0 && (
        <Card className="rounded-3xl border-border bg-card/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Available Add-On Growth Modules
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Expand your growth package anytime
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {availableAddons.slice(0, 4).map((addon) => (
              <button
                key={addon.id}
                type="button"
                onClick={() => {
                  setSelectedAddon(addon);
                  setIsAddonModalOpen(true);
                }}
                className="p-3 rounded-2xl border border-border bg-surface/40 hover:border-cyan/40 hover:bg-surface text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`h-7 w-7 rounded-xl flex items-center justify-center border text-xs ${addon.badgeClass}`}>
                    {getServiceIcon(addon.iconName)}
                  </div>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cyan transition-colors" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-cyan transition-colors leading-snug break-words">
                    {addon.shortName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{addon.category}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Add-on Request Modal */}
      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border text-foreground rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan" />
              Request Add-on Service: {selectedAddon?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add {selectedAddon?.shortName} to your active agency deliverables and monthly retainer.
            </DialogDescription>
          </DialogHeader>

          {selectedAddon && (
            <div className="p-4 rounded-2xl bg-surface/60 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${selectedAddon.badgeClass}`}>
                  {getServiceIcon(selectedAddon.iconName)}
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground">{selectedAddon.name}</p>
                  <p className="text-[10px] text-cyan font-semibold">{selectedAddon.category}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{selectedAddon.description}</p>
            </div>
          )}

          <form onSubmit={handleRequestAddon} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Specific Scope Requirements or Goals
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. We want to start daily Instagram Reels and optimize our Google Business reviews..."
                value={addonNote}
                onChange={(e) => setAddonNote(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="p-3 rounded-xl bg-cyan/5 border border-cyan/20 flex items-center gap-2 text-xs text-cyan">
              <Zap className="h-4 w-4 shrink-0" />
              <span>
                Our technical director will review this request and contact you directly via WhatsApp & Email within 2 hours.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddonModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="rounded-xl bg-cyan text-slate-950 font-bold text-xs px-5"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
