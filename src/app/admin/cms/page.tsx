'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  HelpCircle,
  Star,
  Quote,
  Check,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getTestimonials,
  saveTestimonial,
  deleteTestimonial,
  getFaqs,
  saveFaq,
  deleteFaq,
  subscribeToDataChanges,
} from '@/lib/db';
import { TestimonialModel, FaqModel } from '@/lib/supabase/types';

export default function CmsManagementPage() {
  const [testimonials, setTestimonials] = useState<TestimonialModel[]>([]);
  const [faqs, setFaqs] = useState<FaqModel[]>([]);

  // Modals
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialModel> | null>(null);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqModel> | null>(null);

  const loadData = async () => {
    const [t, f] = await Promise.all([getTestimonials(), getFaqs()]);
    setTestimonials(t);
    setFaqs(f);
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Testimonial Handlers
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial?.quote || !editingTestimonial?.name) {
      toast.error('Quote and Client Name are required');
      return;
    }

    await saveTestimonial(editingTestimonial as any);
    toast.success('Testimonial saved!');
    setIsTestimonialModalOpen(false);
    setEditingTestimonial(null);
    loadData();
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (confirm('Delete this testimonial?')) {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted');
      loadData();
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) {
      toast.error('Question and Answer are required');
      return;
    }

    await saveFaq(editingFaq as any);
    toast.success('FAQ item saved!');
    setIsFaqModalOpen(false);
    setEditingFaq(null);
    loadData();
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm('Delete this FAQ?')) {
      await deleteFaq(id);
      toast.success('FAQ deleted');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan" />
            Website Content & Testimonials CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Edit client reviews, testimonials, and frequently asked questions on the public website.
          </p>
        </div>
      </div>

      <Tabs defaultValue="testimonials" className="space-y-6">
        <TabsList className="bg-surface/80 p-1 rounded-2xl border border-border">
          <TabsTrigger value="testimonials" className="rounded-xl text-xs font-bold px-4 py-2">
            Client Testimonials ({testimonials.length})
          </TabsTrigger>
          <TabsTrigger value="faqs" className="rounded-xl text-xs font-bold px-4 py-2">
            FAQs & Knowledge ({faqs.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. TESTIMONIALS */}
        <TabsContent value="testimonials" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              These client reviews are shown on the homepage and landing pages.
            </p>
            <Button
              onClick={() => {
                setEditingTestimonial({
                  quote: '',
                  name: '',
                  org: '',
                  rating: 5,
                  status: 'published',
                  display_order: testimonials.length + 1,
                });
                setIsTestimonialModalOpen(true);
              }}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4 self-start"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Testimonial
            </Button>
          </div>

          {/* Quick Testimonial Blueprints */}
          <div className="p-3.5 rounded-2xl bg-surface/50 border border-border space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan" /> Quick Example Testimonials (Click to Load):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: '🏥 Dr. Alok Verma (ABC Hospital)',
                  name: 'Dr. Alok Verma',
                  org: 'ABC Super Speciality Hospital, Moradabad',
                  quote: 'XGRO revamped our entire hospital website and set up an automated WhatsApp OPD booking agent. Our online patient inquiries jumped by over 180% in 60 days.',
                  rating: 5,
                },
                {
                  label: '🌿 Vikram Singhania (Bio90 Wellness)',
                  name: 'Vikram Singhania',
                  org: 'Bio90 Wellness D2C',
                  quote: 'The speed of delivery and conversion-focused design of our Shopify store was outstanding. The Meta Ads pipeline they set up generated our highest monthly revenue yet.',
                  rating: 5,
                },
                {
                  label: '💎 Suresh Agarwal (SP Jewellers)',
                  name: 'Suresh Agarwal',
                  org: 'SP Jewellers, Bazar Ganj',
                  quote: 'Our jewellery catalog website looks world-class. Local walk-ins from Google Maps increased dramatically after XGRO optimized our local SEO profile.',
                  rating: 5,
                }
              ].map((tmpl) => (
                <Button
                  key={tmpl.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTestimonial({
                      name: tmpl.name,
                      org: tmpl.org,
                      quote: tmpl.quote,
                      rating: tmpl.rating,
                      status: 'published',
                      display_order: testimonials.length + 1,
                    });
                    setIsTestimonialModalOpen(true);
                    toast.info(`Loaded example testimonial for ${tmpl.name}!`);
                  }}
                  className="rounded-xl text-[11px] h-7 border-border hover:border-cyan/40 bg-card/60"
                >
                  {tmpl.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((test) => (
              <Card
                key={test.id}
                className="rounded-3xl border-border bg-card/60 backdrop-blur-sm p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(test.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-emerald-500 border-emerald-500/30">
                      {test.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed italic">
                    "{test.quote}"
                  </p>

                  <div className="pt-2 border-t border-border/60">
                    <h4 className="font-extrabold text-sm text-foreground">{test.name}</h4>
                    <p className="text-xs text-muted-foreground">{test.org}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTestimonial(test);
                      setIsTestimonialModalOpen(true);
                    }}
                    className="h-8 rounded-full text-xs px-3"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteTestimonial(test.id)}
                    className="h-8 w-8 text-destructive rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 2. FAQS */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Frequently asked questions displayed on the /pricing and /faqs pages.
            </p>
            <Button
              onClick={() => {
                setEditingFaq({
                  question: '',
                  answer: '',
                  category: 'Pricing',
                  status: 'published',
                  display_order: faqs.length + 1,
                });
                setIsFaqModalOpen(true);
              }}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
            </Button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card
                key={faq.id}
                className="rounded-2xl border-border bg-card/60 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-cyan border-cyan/30">
                      {faq.category || 'General'}
                    </Badge>
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                      {faq.question}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-start">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFaq(faq);
                      setIsFaqModalOpen(true);
                    }}
                    className="h-8 rounded-full text-xs px-3"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="h-8 w-8 text-destructive rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Testimonial Modal */}
      <Dialog open={isTestimonialModalOpen} onOpenChange={setIsTestimonialModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingTestimonial?.id ? 'Edit Testimonial' : 'Add Client Testimonial'}
            </DialogTitle>
          </DialogHeader>
          {editingTestimonial && (
            <form onSubmit={handleSaveTestimonial} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold">Client Name *</label>
                <Input
                  placeholder="e.g. Dr. Alok Verma"
                  value={editingTestimonial.name || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Organization / Designation *</label>
                <Input
                  placeholder="e.g. ABC Super Speciality Hospital, Moradabad"
                  value={editingTestimonial.org || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, org: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Review Quote *</label>
                <Textarea
                  placeholder="What the client said about XGRO..."
                  value={editingTestimonial.quote || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                  required
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                  Save Testimonial
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* FAQ Modal */}
      <Dialog open={isFaqModalOpen} onOpenChange={setIsFaqModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingFaq?.id ? 'Edit FAQ Item' : 'Add FAQ Item'}
            </DialogTitle>
          </DialogHeader>
          {editingFaq && (
            <form onSubmit={handleSaveFaq} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold">Question *</label>
                <Input
                  placeholder="e.g. How much does a website cost?"
                  value={editingFaq.question || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Category</label>
                <Input
                  placeholder="e.g. Pricing / Timeline"
                  value={editingFaq.category || 'Pricing'}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Answer *</label>
                <Textarea
                  placeholder="Detailed answer for potential clients..."
                  value={editingFaq.answer || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  required
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                  Save FAQ
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
