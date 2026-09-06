'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpDown,
  X,
  Star,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getPricingPlans, savePricingPlan, deletePricingPlan, subscribeToDataChanges } from '@/lib/db';
import { PricingPlanModel, PricingStatus } from '@/lib/supabase/types';

export default function PricingManagementPage() {
  const [plans, setPlans] = useState<PricingPlanModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlanModel> | null>(null);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const loadData = async () => {
    const data = await getPricingPlans();
    setPlans(data);
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const openCreateDialog = () => {
    setEditingPlan({
      name: '',
      slug: '',
      price: '₹14,999',
      discount_price: '₹24,999',
      tag: 'Ideal for local businesses',
      highlighted: false,
      features: [],
      status: 'published',
      display_order: plans.length + 1,
      cta_label: 'Get started',
      cta_link: '/contact',
    });
    setFeaturesList([
      '5-page responsive website',
      'Mobile-first design',
      'Basic on-page SEO',
      'WhatsApp enquiry button',
      'Free 1 month support',
    ]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: PricingPlanModel) => {
    setEditingPlan(plan);
    setFeaturesList(plan.features || []);
    setIsDialogOpen(true);
  };

  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeaturesList([...featuresList, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.name || !editingPlan?.price) {
      toast.error('Plan Name and Price are required');
      return;
    }

    try {
      await savePricingPlan({
        ...editingPlan,
        features: featuresList,
      } as PricingPlanModel);

      toast.success(
        editingPlan.id ? 'Pricing plan updated!' : 'New pricing plan created!'
      );
      setIsDialogOpen(false);
      setEditingPlan(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save pricing plan');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the plan "${name}"?`)) {
      await deletePricingPlan(id);
      toast.success(`Plan "${name}" removed`);
      loadData();
    }
  };

  const handleToggleStatus = async (plan: PricingPlanModel) => {
    const newStatus: PricingStatus = plan.status === 'published' ? 'draft' : 'published';
    await savePricingPlan({
      ...plan,
      status: newStatus,
    });
    toast.success(`Plan status changed to ${newStatus}`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-cyan" />
            Pricing Plans CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage packages displayed on the public site, pricing tiers, badges, and features.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Plan
        </Button>
      </div>

      {/* Example Pricing Blueprints */}
      <div className="p-4 rounded-2xl bg-surface/50 border border-border/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            Quick Example Pricing Templates (Click to Load Blueprint):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: '📈 Monthly SEO & Local Growth Retainer',
              name: 'SEO & Growth Retainer',
              price: '₹18,500/mo',
              discount_price: '₹25,000/mo',
              tag: 'Monthly managed SEO, citations & Google ranking',
              highlighted: false,
              features: [
                'Google Business Profile Weekly Optimization & Posts',
                'Local 3-Pack Maps Ranking Strategy',
                '4 High-Intent SEO Articles per Month',
                'Technical Crawl Audits & Schema Markup',
                'Monthly Live Traffic & Leads Analytics Call'
              ]
            },
            {
              label: '🚀 Full-Stack AI & Performance Package',
              name: 'Full Growth Suite',
              price: '₹49,999',
              discount_price: '₹75,000',
              tag: 'Complete custom website, AI chatbot & paid ads engine',
              highlighted: true,
              features: [
                'Up to 15 Pages Custom Next.js Web App',
                '24/7 WhatsApp AI Support Agent Integration',
                'High-ROAS Meta (Facebook/Instagram) & Google Ads Setup',
                'Client Project Milestone Portal Access',
                '3 Months Priority SLA Support & Maintenance'
              ]
            },
            {
              label: '🛡️ Annual Agency SLA & Web Maintenance',
              name: 'Annual Care SLA',
              price: '₹14,999/yr',
              discount_price: '₹22,000/yr',
              tag: 'Hosting, security, uptime & monthly revisions',
              highlighted: false,
              features: [
                '99.9% Uptime Hosting & Cloudflare CDN Monitoring',
                'Weekly Automated Off-Site Backups',
                'Unlimited Minor Content & Banner Revisions',
                'SSL Security & Malware Protection',
                'Dedicated Technical Support WhatsApp Desk'
              ]
            }
          ].map((tmpl) => (
            <Button
              key={tmpl.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPlan({
                  name: tmpl.name,
                  slug: tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  price: tmpl.price,
                  discount_price: tmpl.discount_price,
                  tag: tmpl.tag,
                  highlighted: tmpl.highlighted,
                  features: tmpl.features,
                  status: 'published',
                  display_order: plans.length + 1,
                  cta_label: 'Get Started',
                  cta_link: '/contact',
                });
                setFeaturesList(tmpl.features);
                setIsDialogOpen(true);
                toast.info(`Loaded blueprint for "${tmpl.name}"!`);
              }}
              className="rounded-xl text-xs h-7 border-border hover:border-cyan/40 bg-card/70 font-semibold"
            >
              {tmpl.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
              plan.highlighted
                ? 'border-cyan/70 bg-primary/10 shadow-xl dark:bg-card/90'
                : 'border-border bg-card/60'
            }`}
          >
            <div>
              {/* Card Top */}
              <div className="p-6 pb-4 border-b border-border/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xl text-foreground">{plan.name}</h3>
                    {plan.highlighted && (
                      <Badge className="bg-cyan text-slate-950 font-extrabold text-[10px] uppercase tracking-wider">
                        ★ Highlighted
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.tag}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    plan.status === 'published'
                      ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                      : 'border-amber-500/40 text-amber-500 bg-amber-500/10'
                  }`}
                >
                  {plan.status}
                </Badge>
              </div>

              {/* Price & Features */}
              <div className="p-6 space-y-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-black text-foreground">
                    {plan.price}
                  </span>
                  {plan.discount_price && (
                    <span className="text-sm text-muted-foreground line-through font-medium">
                      {plan.discount_price}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    What's Included:
                  </p>
                  <ul className="space-y-2 text-xs">
                    {(plan.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-foreground/90 leading-snug">
                        <Check className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
                  <span>Display Order: #{plan.display_order}</span>
                  <span>CTA: "{plan.cta_label || 'Get started'}"</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleStatus(plan)}
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {plan.status === 'published' ? (
                  <span className="flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5" /> Unpublish
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <Eye className="h-3.5 w-3.5" /> Publish
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(plan)}
                  className="h-8 rounded-full border-border text-xs px-3 font-semibold"
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-cyan" />
              {editingPlan?.id ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure package title, pricing, highlighted badge, and bullet deliverables.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              {/* Plan Name & Badge Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Plan Name *</label>
                  <Input
                    placeholder="e.g. Professional"
                    value={editingPlan.name || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Subtitle / Badge Tag</label>
                  <Input
                    placeholder="e.g. Most popular for growing brands"
                    value={editingPlan.tag || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tag: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Price & Discount Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Price *</label>
                  <Input
                    placeholder="e.g. ₹39,999 or Custom"
                    value={editingPlan.price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                    required
                    className="h-9 text-xs rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Strikethrough Price</label>
                  <Input
                    placeholder="e.g. ₹59,999"
                    value={editingPlan.discount_price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, discount_price: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Display Order</label>
                  <Input
                    type="number"
                    value={editingPlan.display_order ?? 1}
                    onChange={(e) => setEditingPlan({ ...editingPlan, display_order: parseInt(e.target.value) || 1 })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Highlight Switch & Status */}
              <div className="p-3 bg-surface/60 rounded-2xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Highlight / Feature this Plan</p>
                  <p className="text-[11px] text-muted-foreground">
                    Displays "Most Popular" glow and elevated border on public site.
                  </p>
                </div>
                <Switch
                  checked={editingPlan.highlighted ?? false}
                  onCheckedChange={(val) => setEditingPlan({ ...editingPlan, highlighted: val })}
                />
              </div>

              {/* Features Builder */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Included Deliverables in this Price</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {featuresList.length} items
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Up to 12 pages + dynamic blog"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    size="sm"
                    className="rounded-xl bg-cyan text-slate-950 font-bold text-xs px-4"
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5 mt-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-surface/50 border border-border">
                  {featuresList.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-card border border-border px-3 py-1.5 rounded-lg text-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-cyan" />
                        {f}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border flex sm:justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-full text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 shadow-md"
                >
                  Save Plan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
