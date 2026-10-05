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
  Building2,
  Globe,
  ExternalLink,
  Code2,
  Copy,
  ArrowUp,
  ArrowDown,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Hotel,
  GraduationCap,
  BookOpen,
  Brain,
  Compass,
  Activity,
  Gem,
  ShieldCheck,
  Building,
  Laptop,
  Briefcase,
  Zap,
  ShoppingBag,
  Upload,
  X,
  Link2,
  AlertCircle,
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
  getTrustedLogos,
  saveTrustedLogo,
  deleteTrustedLogo,
  getTrustedSectionTitle,
  saveTrustedSectionTitle,
  subscribeToDataChanges,
} from '@/lib/db';
import { TestimonialModel, FaqModel, TrustedLogoModel } from '@/lib/supabase/types';
import { compressImageFile } from '@/lib/image-compressor';
import { AdminResourcesManager } from '@/components/admin/AdminResourcesManager';
import { AdminHeroBannerManager } from '@/components/admin/AdminHeroBannerManager';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

const PRESET_ICONS = [
  { name: 'Building2', icon: Building2, label: 'Building / Corporate' },
  { name: 'Hotel', icon: Hotel, label: 'Hotel & Hospitality' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Education / Academy' },
  { name: 'BookOpen', icon: BookOpen, label: 'EdTech / Books' },
  { name: 'Brain', icon: Brain, label: 'Coaching / AI' },
  { name: 'Compass', icon: Compass, label: 'Travel & Tours' },
  { name: 'Activity', icon: Activity, label: 'Health & Wellness' },
  { name: 'Gem', icon: Gem, label: 'Jewellery & Luxury' },
  { name: 'Sparkles', icon: Sparkles, label: 'Beauty & Lifestyle' },
  { name: 'Globe', icon: Globe, label: 'Export & Global' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Legal & Security' },
  { name: 'Laptop', icon: Laptop, label: 'Tech & Software' },
  { name: 'Briefcase', icon: Briefcase, label: 'Consulting / Agency' },
  { name: 'Zap', icon: Zap, label: 'Energy / Startup' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Retail & Ecommerce' },
];

const PRESET_LOCAL_LOGOS = [
  { label: "Minds Eye", path: "/trustedByLogos/Minds eye.png", note: "Education & Learning" },
  { label: "Bio90", path: "/trustedByLogos/bio90_logo-removebg-preview.png", note: "Wellness & Health" },
  { label: "Metrocity Salon", path: "/trustedByLogos/Metrocity Salon.png", note: "Salon & Beauty" },
  { label: "Iconic", path: "/trustedByLogos/ICONIC LOGO.png", note: "Lifestyle & Apparel" },
  { label: "SP Jewellers", path: "/trustedByLogos/sp.png", note: "Luxury Retail" },
  { label: "Central Boutique Hotel", path: "/trustedByLogos/IMG_4188 (1).PNG", note: "Hospitality · Moradabad" },
];

const SUPABASE_TRUSTED_LOGOS_SQL = `-- 1. Create the trusted_logos table for Supabase
CREATE TABLE IF NOT EXISTS public.trusted_logos (
    id TEXT PRIMARY KEY DEFAULT ('brand-' || gen_random_uuid()),
    name TEXT NOT NULL,
    note TEXT,
    logo_url TEXT,
    icon TEXT DEFAULT 'Building2',
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Prevent duplicate brand names at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_trusted_logos_name_lower ON public.trusted_logos (lower(trim(name)));

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trusted_logos ENABLE ROW LEVEL SECURITY;

-- 4. Public Read Policy
CREATE POLICY "Allow public read access to published trusted logos"
ON public.trusted_logos
FOR SELECT
USING (true);

-- 5. Admin / Service Role Full Access Policy
CREATE POLICY "Allow all access for authenticated users or service role"
ON public.trusted_logos
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Helpful Indexing
CREATE INDEX IF NOT EXISTS idx_trusted_logos_order ON public.trusted_logos (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_trusted_logos_status ON public.trusted_logos (status);

-- 7. Seed Initial Data
INSERT INTO public.trusted_logos (id, name, note, icon, logo_url, status, display_order)
VALUES
  ('brand-1', 'Minds Eye', 'Education & Learning', 'GraduationCap', '/trustedByLogos/Minds eye.png', 'published', 1),
  ('brand-2', 'Bio90', 'Wellness & Health', 'Activity', '/trustedByLogos/bio90_logo-removebg-preview.png', 'published', 2),
  ('brand-3', 'Metrocity Salon', 'Salon & Beauty', 'Gem', '/trustedByLogos/Metrocity Salon.png', 'published', 3),
  ('brand-4', 'Iconic', 'Lifestyle & Apparel', 'Sparkles', '/trustedByLogos/ICONIC LOGO.png', 'published', 4),
  ('brand-5', 'SP Jewellers', 'Luxury Retail', 'Gem', '/trustedByLogos/sp.png', 'published', 5),
  ('brand-6', 'Central Boutique Hotel', 'Hospitality · Moradabad', 'Hotel', '/trustedByLogos/IMG_4188 (1).PNG', 'published', 6),
  ('brand-7', 'Ramanujan Classes', 'Coaching & EdTech', 'BookOpen', NULL, 'published', 7),
  ('brand-8', 'Maths Mind', 'Competitive Exams', 'Brain', NULL, 'published', 8),
  ('brand-9', 'Highway Yatra', 'Travel & Tours', 'Compass', NULL, 'published', 9),
  ('brand-10', 'Moradabad Handicrafts', 'Global Export', 'Globe', NULL, 'published', 10),
  ('brand-11', 'Apex Diagnostics', 'Healthcare', 'Building2', NULL, 'published', 11),
  ('brand-12', 'SilverOak Legal', 'Corporate Law', 'ShieldCheck', NULL, 'published', 12)
ON CONFLICT (id) DO NOTHING;`;

export default function CmsManagementPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canView = isAdmin || hasPermission('cms_content', 'view');
  const canCreateEdit = isAdmin || hasPermission('cms_content', 'create_edit');
  const canDelete = isAdmin || hasPermission('cms_content', 'delete');

  const [testimonials, setTestimonials] = useState<TestimonialModel[]>([]);
  const [faqs, setFaqs] = useState<FaqModel[]>([]);
  const [trustedLogos, setTrustedLogos] = useState<TrustedLogoModel[]>([]);
  const [sectionHeading, setSectionHeading] = useState('Trusted by growing businesses across India & USA');
  const [logoSearch, setLogoSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Modals
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialModel> | null>(null);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqModel> | null>(null);

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Partial<TrustedLogoModel> | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState(false);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Real-time debounced duplicate check when user stops typing
  useEffect(() => {
    if (!isLogoModalOpen) {
      setDuplicateError(null);
      setIsCheckingDuplicate(false);
      setIsNameAvailable(false);
      return;
    }

    const rawName = editingLogo?.name || '';
    const cleanName = rawName.trim();

    if (!cleanName) {
      setDuplicateError(null);
      setIsCheckingDuplicate(false);
      setIsNameAvailable(false);
      return;
    }

    setIsCheckingDuplicate(true);
    setIsNameAvailable(false);

    const timer = setTimeout(() => {
      const normalized = cleanName.toLowerCase();
      const duplicate = trustedLogos.find((l) => {
        if (editingLogo?.id && l.id === editingLogo.id) return false;
        return l.name.trim().toLowerCase() === normalized;
      });

      if (duplicate) {
        setDuplicateError(`Brand name "${cleanName}" already exists!`);
        setIsNameAvailable(false);
      } else {
        setDuplicateError(null);
        setIsNameAvailable(true);
      }
      setIsCheckingDuplicate(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [editingLogo?.name, editingLogo?.id, isLogoModalOpen, trustedLogos]);

  const loadData = async () => {
    const [t, f, l, title] = await Promise.all([
      getTestimonials(),
      getFaqs(),
      getTrustedLogos(),
      getTrustedSectionTitle(),
    ]);
    setTestimonials(t);
    setFaqs(f);
    setTrustedLogos(l);
    if (title) setSectionHeading(title);
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const handleSaveHeading = async () => {
    if (!canCreateEdit) {
      toast.error('You do not have permission to modify website headings');
      return;
    }
    await saveTrustedSectionTitle(sectionHeading);
    toast.success('Section heading updated on homepage!');
  };

  // Image Upload Handlers
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file, 400, 200, 0.85);
      setEditingLogo((prev) => (prev ? { ...prev, logo_url: compressedDataUrl } : null));
      toast.success(`Logo image "${file.name}" compressed and ready!`);
    } catch (err) {
      toast.error('Failed to process image file');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file, 400, 200, 0.85);
      setEditingLogo((prev) => (prev ? { ...prev, logo_url: compressedDataUrl } : null));
      toast.success(`Logo image "${file.name}" compressed and ready!`);
    } catch (err) {
      toast.error('Failed to process image file');
    }
  };

  // Testimonial Handlers
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateEdit) {
      toast.error('You do not have permission to edit testimonials');
      return;
    }
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
    if (!canDelete) {
      toast.error('You do not have permission to delete testimonials');
      return;
    }
    if (confirm('Delete this testimonial?')) {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted');
      loadData();
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateEdit) {
      toast.error('You do not have permission to edit FAQs');
      return;
    }
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
    if (!canDelete) {
      toast.error('You do not have permission to delete FAQs');
      return;
    }
    if (confirm('Delete this FAQ?')) {
      await deleteFaq(id);
      toast.success('FAQ deleted');
      loadData();
    }
  };

  // Helper: check if brand name is already used by another entry
  const isBrandNameDuplicate = (name?: string, currentId?: string): boolean => {
    if (!name || !name.trim()) return false;
    const normalized = name.trim().toLowerCase();
    return trustedLogos.some((l) => {
      if (currentId && l.id === currentId) return false;
      return l.name.trim().toLowerCase() === normalized;
    });
  };

  // Trusted Logo Handlers
  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateEdit) {
      toast.error('You do not have permission to save brand logos');
      return;
    }
    const cleanName = (editingLogo?.name || '').trim();
    if (!cleanName) {
      toast.error('Brand / Business Name is required');
      return;
    }

    if (isBrandNameDuplicate(cleanName, editingLogo?.id) || duplicateError) {
      toast.error(`Cannot save: Brand "${cleanName}" already exists! Duplicate brands are not allowed.`);
      return;
    }

    // Fresh verification to prevent race conditions
    const latestLogos = await getTrustedLogos();
    const isDuplicateFresh = latestLogos.some((l) => {
      if (editingLogo?.id && l.id === editingLogo.id) return false;
      return l.name.trim().toLowerCase() === cleanName.toLowerCase();
    });

    if (isDuplicateFresh) {
      toast.error(`Cannot save: Brand "${cleanName}" already exists in database.`);
      setDuplicateError(`Brand name "${cleanName}" already exists!`);
      return;
    }

    await saveTrustedLogo({
      ...editingLogo,
      name: cleanName,
    } as any);

    toast.success(editingLogo?.id ? 'Brand logo updated!' : 'Brand logo added!');
    setIsLogoModalOpen(false);
    setEditingLogo(null);
    setDuplicateError(null);
    setIsNameAvailable(false);
    await loadData();
  };

  const handleDeleteLogo = async (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete brand logos');
      return;
    }
    const target = trustedLogos.find((l) => l.id === id);
    const brandName = target?.name || 'this brand logo';
    if (confirm(`Delete "${brandName}" from the homepage? This action cannot be undone.`)) {
      // Optimistic update so UI updates immediately
      setTrustedLogos((prev) =>
        prev.filter(
          (l) => l.id !== id && (target ? l.name.trim().toLowerCase() !== target.name.trim().toLowerCase() : true)
        )
      );
      await deleteTrustedLogo(id);
      toast.success(`"${brandName}" removed from homepage`);
      await loadData();
    }
  };

  const handleToggleLogoStatus = async (logo: TrustedLogoModel) => {
    if (!canCreateEdit) {
      toast.error('You do not have permission to modify brand logos');
      return;
    }
    const nextStatus = logo.status === 'published' ? 'draft' : 'published';
    await saveTrustedLogo({ ...logo, status: nextStatus });
    toast.success(`Logo marked as ${nextStatus}`);
    loadData();
  };

  const handleMoveOrder = async (logo: TrustedLogoModel, direction: 'up' | 'down') => {
    if (!canCreateEdit) {
      toast.error('You do not have permission to reorder brand logos');
      return;
    }
    const currentIndex = trustedLogos.findIndex((l) => l.id === logo.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= trustedLogos.length) return;

    // Create array copy and swap position
    const newLogos = [...trustedLogos];
    const [movedItem] = newLogos.splice(currentIndex, 1);
    newLogos.splice(targetIndex, 0, movedItem);

    // Re-index all display_orders sequentially (1, 2, 3...) to eliminate any collisions
    const updatedWithOrders = newLogos.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setTrustedLogos(updatedWithOrders);

    await Promise.all(
      updatedWithOrders.map((l) => saveTrustedLogo(l))
    );

    toast.success('Reordered brand logos');
    await loadData();
  };

  const filteredLogos = trustedLogos.filter(
    (l) =>
      l.name.toLowerCase().includes(logoSearch.toLowerCase()) ||
      (l.note && l.note.toLowerCase().includes(logoSearch.toLowerCase()))
  );

  if (!canView) {
    return <AdminAccessDenied moduleName="Website Content & Brand CMS" requiredAction="View CMS Content" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan" />
            Website Content & Brand CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage Trusted by logos, client reviews, testimonials, and FAQs on the public website.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSqlModalOpen(true)}
          className="rounded-full text-xs font-bold border-cyan/40 text-cyan hover:bg-cyan/10 self-start sm:self-auto gap-1.5"
        >
          <Code2 className="h-4 w-4" />
          Supabase SQL Setup
        </Button>
      </div>

      <Tabs defaultValue="hero-banner" className="space-y-6">
        <TabsList className="bg-surface/80 p-1 rounded-2xl border border-border flex-wrap h-auto gap-1">
          <TabsTrigger value="hero-banner" className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            Hero & Festival Banners
          </TabsTrigger>
          <TabsTrigger value="resources" className="rounded-xl text-xs font-bold px-4 py-2">
            Free Resources Hub
          </TabsTrigger>
          <TabsTrigger value="trusted-logos" className="rounded-xl text-xs font-bold px-4 py-2">
            Trusted Logos & Brands ({trustedLogos.length})
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="rounded-xl text-xs font-bold px-4 py-2">
            Client Testimonials ({testimonials.length})
          </TabsTrigger>
          <TabsTrigger value="faqs" className="rounded-xl text-xs font-bold px-4 py-2">
            FAQs & Knowledge ({faqs.length})
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* HERO & FESTIVAL BANNERS CMS TAB                              */}
        {/* ============================================================ */}
        <TabsContent value="hero-banner" className="space-y-6">
          <AdminHeroBannerManager
            canCreateEdit={canCreateEdit}
            canDelete={canDelete}
          />
        </TabsContent>

        {/* ============================================================ */}
        {/* 0. FREE RESOURCES HUB TAB                                    */}
        {/* ============================================================ */}
        <TabsContent value="resources" className="space-y-6">
          <AdminResourcesManager />
        </TabsContent>

        {/* ============================================================ */}
        {/* 1. TRUSTED LOGOS & BRANDS TAB                                */}
        {/* ============================================================ */}
        <TabsContent value="trusted-logos" className="space-y-6">
          {/* Section Heading Editor Card */}
          {canCreateEdit && (
            <Card className="rounded-2xl border-border bg-card/70 p-4 sm:p-5 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-cyan" />
                    Section Heading Text (Homepage Banner)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <Input
                      placeholder="e.g. Trusted by growing businesses across India & USA"
                      value={sectionHeading}
                      onChange={(e) => setSectionHeading(e.target.value)}
                      className="text-xs rounded-xl h-9 font-semibold flex-1 bg-surface"
                    />
                    <Button
                      onClick={handleSaveHeading}
                      size="sm"
                      className="rounded-xl bg-cyan text-slate-950 font-bold text-xs px-4 h-9 whitespace-nowrap shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Update Heading
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Manage the live client logos in the &quot;<strong>{sectionHeading}</strong>&quot; marquee.
              </p>
            </div>
            {canCreateEdit && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setEditingLogo({
                      name: '',
                      note: '',
                      logo_url: '',
                      icon: 'Building2',
                      website_url: '',
                      status: 'published',
                      display_order: trustedLogos.length + 1,
                    });
                    setIsLogoModalOpen(true);
                  }}
                  size="sm"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Brand Logo
                </Button>
              </div>
            )}
          </div>

          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-surface/50 border border-border">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search brand name or industry..."
                value={logoSearch}
                onChange={(e) => setLogoSearch(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl bg-card"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Published: <strong className="text-emerald-500">{trustedLogos.filter(l => l.status === 'published').length}</strong></span>
              <span>Drafts: <strong className="text-amber-500">{trustedLogos.filter(l => l.status === 'draft').length}</strong></span>
              <span>Total: <strong className="text-foreground">{trustedLogos.length}</strong></span>
            </div>
          </div>

          {/* Quick Preset Logo Blueprints */}
          {canCreateEdit && (
            <div className="p-3.5 rounded-2xl bg-surface/50 border border-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan" /> Quick-Add from Local Assets (Click to Autofill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOCAL_LOGOS.map((tmpl) => {
                  const alreadyAdded = trustedLogos.some(
                    (l) => l.name.trim().toLowerCase() === tmpl.label.trim().toLowerCase()
                  );
                  return (
                    <Button
                      key={tmpl.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={alreadyAdded}
                      onClick={() => {
                        if (alreadyAdded) {
                          toast.warning(`"${tmpl.label}" is already in your trusted logos list.`);
                          return;
                        }
                        setEditingLogo({
                          name: tmpl.label,
                          note: tmpl.note,
                          logo_url: tmpl.path,
                          icon: 'Building2',
                          status: 'published',
                          display_order: trustedLogos.length + 1,
                        });
                        setIsLogoModalOpen(true);
                        toast.info(`Loaded preset logo for ${tmpl.label}`);
                      }}
                      className={`rounded-xl text-[11px] h-7 border-border transition-all ${
                        alreadyAdded
                          ? 'opacity-60 bg-muted/30 text-muted-foreground border-dashed cursor-not-allowed'
                          : 'hover:border-cyan/40 bg-card/60'
                      }`}
                    >
                      {alreadyAdded ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-500" /> {tmpl.label} (Added)
                        </>
                      ) : (
                        tmpl.label
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogos.map((logo, index) => {
              const hasLogoImage = Boolean(logo.logo_url && logo.logo_url.trim().length > 0);
              const matchedIcon = PRESET_ICONS.find((i) => i.name === logo.icon) || PRESET_ICONS[0];
              const IconComponent = matchedIcon.icon;

              return (
                <Card
                  key={logo.id}
                  className="rounded-2xl border-border bg-card/60 backdrop-blur-sm p-4 flex flex-col justify-between transition-all duration-200 hover:border-cyan/40 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Top Row: Order Badge & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold">
                          #{logo.display_order ?? index + 1}
                        </span>
                        {logo.website_url && (
                          <a
                            href={logo.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-cyan transition-colors"
                            title="Visit website"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleLogoStatus(logo)}
                        className="cursor-pointer"
                        title="Click to toggle status"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-bold transition-colors ${
                            logo.status === 'published'
                              ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          {logo.status}
                        </Badge>
                      </button>
                    </div>

                    {/* Logo & Info Display */}
                    <div className="flex items-center gap-3.5 pt-1">
                      {hasLogoImage ? (
                        <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                          <img
                            src={logo.logo_url!}
                            alt={logo.name}
                            className="h-10 w-auto max-w-[72px] object-contain"
                            onError={(e) => {
                              // If image fails, hide image element
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan border border-cyan/30">
                          <IconComponent className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-foreground truncate">
                          {logo.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {logo.note || 'Partner Business'}
                        </p>
                        {logo.logo_url && (
                          <span className="text-[10px] text-cyan/80 font-mono truncate block mt-0.5" title={logo.logo_url}>
                            {logo.logo_url.split('/').pop() || logo.logo_url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>                  {/* Actions Row */}
                  {(canCreateEdit || canDelete) && (
                    <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
                      {/* Reordering */}
                      {canCreateEdit ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(logo, 'up')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Move left / up in marquee"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === filteredLogos.length - 1}
                            onClick={() => handleMoveOrder(logo, 'down')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Move right / down in marquee"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : <div />}

                      <div className="flex items-center gap-1.5">
                        {canCreateEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLogo(logo);
                              setIsLogoModalOpen(true);
                            }}
                            className="h-7 rounded-full text-xs px-2.5 gap-1"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteLogo(logo.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {filteredLogos.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-foreground">No brand logos found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {logoSearch ? 'Try a different search term.' : 'Add your first partner logo to show on the website marquee.'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* 2. TESTIMONIALS TAB                                          */}
        {/* ============================================================ */}
        <TabsContent value="testimonials" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              These client reviews are shown on the homepage and landing pages.
            </p>
            {canCreateEdit && (
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
            )}
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
                    &quot;{test.quote}&quot;
                  </p>

                  <div className="pt-2 border-t border-border/60">
                    <h4 className="font-extrabold text-sm text-foreground">{test.name}</h4>
                    <p className="text-xs text-muted-foreground">{test.org}</p>
                  </div>
                </div>

                {(canCreateEdit || canDelete) && (
                  <div className="pt-4 border-t border-border mt-4 flex items-center justify-end gap-2">
                    {canCreateEdit && (
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
                    )}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteTestimonial(test.id)}
                        className="h-8 w-8 text-destructive rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* 3. FAQS TAB                                                  */}
        {/* ============================================================ */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Frequently asked questions displayed on the /pricing and /faqs pages.
            </p>
            {canCreateEdit && (
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
            )}
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

                {(canCreateEdit || canDelete) && (
                  <div className="flex items-center gap-1 self-end sm:self-start">
                    {canCreateEdit && (
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
                    )}
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="h-8 w-8 text-destructive rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* BRAND LOGO EDIT / ADD MODAL                                  */}
      {/* ============================================================ */}
      <Dialog open={isLogoModalOpen} onOpenChange={setIsLogoModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan" />
              {editingLogo?.id ? 'Edit Brand Logo' : 'Add Brand Logo to Homepage'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the company logo or icon shown in the &quot;Trusted by growing businesses&quot; marquee.
            </DialogDescription>
          </DialogHeader>

          {editingLogo && (
            <form onSubmit={handleSaveLogo} className="space-y-4 mt-2">
              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-surface border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Live Marquee Preview:
                </span>
                <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-sm w-fit max-w-full">
                  {editingLogo.logo_url && editingLogo.logo_url.trim().length > 0 ? (
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                      <img
                        src={editingLogo.logo_url}
                        alt={editingLogo.name || 'Preview'}
                        className="h-10 w-auto max-w-[72px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                      {(() => {
                        const Icon = PRESET_ICONS.find((i) => i.name === editingLogo.icon)?.icon || Building2;
                        return <Icon className="h-5.5 w-5.5" />;
                      })()}
                    </div>
                  )}

                  <div className="text-left">
                    <p className="whitespace-nowrap font-display text-sm font-extrabold text-foreground">
                      {editingLogo.name || 'Brand Name'}
                    </p>
                    <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                      {editingLogo.note || 'Industry Note'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Brand / Client Name *</label>
                    {isCheckingDuplicate && (
                      <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-ping inline-block" /> Checking...
                      </span>
                    )}
                    {!isCheckingDuplicate && isNameAvailable && (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Name available
                      </span>
                    )}
                    {!isCheckingDuplicate && duplicateError && (
                      <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Duplicate name
                      </span>
                    )}
                  </div>

                  <Input
                    placeholder="e.g. Bio90 or SP Jewellers"
                    value={editingLogo.name || ''}
                    onChange={(e) => setEditingLogo({ ...editingLogo, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (duplicateError || isBrandNameDuplicate(editingLogo.name, editingLogo.id)) {
                          toast.error(`Brand "${editingLogo.name?.trim()}" already exists! Duplicates are not allowed.`);
                        } else {
                          handleSaveLogo(e as any);
                        }
                      }
                    }}
                    required
                    className={`text-xs rounded-xl h-9 transition-all ${
                      duplicateError
                        ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/10 text-rose-300 shadow-sm'
                        : isNameAvailable
                        ? 'border-emerald-500/40 focus-visible:ring-emerald-500 bg-emerald-500/5'
                        : ''
                    }`}
                  />

                  {duplicateError && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-semibold mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <p className="font-bold">Duplicate Brand Name</p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          &quot;{editingLogo.name?.trim()}&quot; is already registered in your trusted partner logos. Please choose a unique name to avoid duplicates.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Industry / Subtitle Note</label>
                  <Input
                    placeholder="e.g. Wellness & Health"
                    value={editingLogo.note || ''}
                    onChange={(e) => setEditingLogo({ ...editingLogo, note: e.target.value })}
                    className="text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              {/* Logo Image Upload Zone & URL */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-surface/70 border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-cyan" />
                    Company Logo Image File
                  </label>
                  {editingLogo.logo_url && (
                    <button
                      type="button"
                      onClick={() => setEditingLogo({ ...editingLogo, logo_url: '' })}
                      className="text-[11px] text-destructive hover:underline font-semibold flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Clear Image (Use Icon)
                    </button>
                  )}
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-cyan bg-cyan/10 scale-[1.01]'
                      : 'border-border hover:border-cyan/50 bg-card/60'
                  }`}
                >
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoFileUpload}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="h-9 w-9 rounded-full bg-cyan/15 text-cyan flex items-center justify-center shadow-sm">
                        <Upload className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Click to upload new image or drag &amp; drop
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          PNG, SVG, JPG, WebP (Transparent logo recommended, max 5MB)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Secondary Image Link / Path Input */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Or enter local path / hosted image URL:</span>
                    {editingLogo.logo_url?.startsWith('data:') && (
                      <Badge variant="outline" className="text-[9px] text-cyan border-cyan/30 bg-cyan/10 font-bold">
                        Uploaded File Ready
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="e.g. /trustedByLogos/bio90.png or https://..."
                      value={editingLogo.logo_url?.startsWith('data:') ? 'Uploaded custom file (Data URL ready to save)' : (editingLogo.logo_url || '')}
                      onChange={(e) => setEditingLogo({ ...editingLogo, logo_url: e.target.value })}
                      disabled={editingLogo.logo_url?.startsWith('data:')}
                      className="h-8 pl-8 text-xs rounded-xl font-mono bg-card"
                    />
                  </div>
                </div>
              </div>

              {/* Fallback Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Fallback Icon (when no logo image)</label>
                <div className="grid grid-cols-5 gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-xl border border-border bg-surface/50">
                  {PRESET_ICONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = (editingLogo.icon || 'Building2') === item.name;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => setEditingLogo({ ...editingLogo, icon: item.name })}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] transition-all ${
                          isSelected
                            ? 'bg-cyan text-slate-950 font-bold shadow-sm'
                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                        }`}
                        title={item.label}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[9px] truncate max-w-[50px] mt-0.5">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Website Link & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Website URL (Optional)</label>
                  <Input
                    placeholder="https://example.com"
                    value={editingLogo.website_url || ''}
                    onChange={(e) => setEditingLogo({ ...editingLogo, website_url: e.target.value })}
                    className="text-xs rounded-xl h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Display Order & Status</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Order"
                      value={editingLogo.display_order ?? 1}
                      onChange={(e) => setEditingLogo({ ...editingLogo, display_order: parseInt(e.target.value) || 1 })}
                      className="text-xs rounded-xl h-9 w-20"
                    />
                    <select
                      value={editingLogo.status || 'published'}
                      onChange={(e) => setEditingLogo({ ...editingLogo, status: e.target.value as any })}
                      className="text-xs rounded-xl h-9 px-3 bg-card border border-border flex-1 text-foreground"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLogoModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !editingLogo.name?.trim() ||
                    Boolean(duplicateError) ||
                    isCheckingDuplicate ||
                    isBrandNameDuplicate(editingLogo.name, editingLogo.id)
                  }
                  onClick={(e) => {
                    if (duplicateError || isBrandNameDuplicate(editingLogo.name, editingLogo.id)) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.error(`Cannot save: Brand "${editingLogo.name?.trim()}" already exists! Duplicates are not allowed.`);
                    }
                  }}
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingLogo.id ? 'Save Changes' : 'Add Brand Logo'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* SUPABASE SQL SCRIPT DIALOG                                    */}
      {/* ============================================================ */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-cyan" />
              Supabase SQL for &quot;trusted_logos&quot; Table
            </DialogTitle>
            <DialogDescription className="text-xs">
              Run this SQL script in your Supabase SQL Editor to create the table, RLS policies, and seed data.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[350px] border border-white/10 leading-relaxed">
              {SUPABASE_TRUSTED_LOGOS_SQL}
            </pre>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_TRUSTED_LOGOS_SQL);
                toast.success('SQL copied to clipboard!');
              }}
              className="absolute top-3 right-3 rounded-xl bg-cyan text-slate-950 font-bold text-xs px-3 h-7 shadow-md"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy SQL
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSqlModalOpen(false)}
              className="rounded-full text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
