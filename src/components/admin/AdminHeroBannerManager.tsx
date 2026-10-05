'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  Tag,
  Layers,
  ArrowUpRight,
  Code2,
  Copy,
  Info,
  SlidersHorizontal,
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
  getHeroBanners,
  getActiveHeroBanner,
  saveHeroBanner,
  setActiveHeroBanner,
  deleteHeroBanner,
  uploadHeroBannerImage,
  subscribeToDataChanges,
} from '@/lib/db';
import { HeroBannerModel, BannerAspectRatio } from '@/lib/supabase/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface AdminHeroBannerManagerProps {
  canCreateEdit?: boolean;
  canDelete?: boolean;
}

export function AdminHeroBannerManager({
  canCreateEdit = true,
  canDelete = true,
}: AdminHeroBannerManagerProps) {
  const [banners, setBanners] = useState<HeroBannerModel[]>([]);
  const [activeBanner, setActiveBanner] = useState<HeroBannerModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HeroBannerModel> | null>(null);
  const [previewingBanner, setPreviewingBanner] = useState<HeroBannerModel | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form tab: 'upload' | 'url'
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'custom' | 'default'>('all');

  const loadData = async () => {
    try {
      const [allList, active] = await Promise.all([
        getHeroBanners(),
        getActiveHeroBanner(),
      ]);
      setBanners(allList);
      setActiveBanner(active);
    } catch (err) {
      console.error('Failed to load hero banners:', err);
      toast.error('Failed to load hero banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Quick 1-click banner activation
  const handleSetActive = async (banner: HeroBannerModel) => {
    try {
      // Optimistically update UI state immediately
      setActiveBanner({ ...banner, is_active: true });
      setBanners((prev) =>
        prev.map((b) => ({
          ...b,
          is_active: b.id === banner.id,
        }))
      );
      await setActiveHeroBanner(banner.id);
      await loadData();
      toast.success(`"${banner.title}" is now live on the homepage!`);
    } catch (err) {
      console.error('Error activating banner:', err);
      toast.error('Failed to set active banner');
    }
  };

  // Reset to default hero image
  const handleResetToDefault = async () => {
    const defaultBanner = banners.find((b) => b.is_default || b.id === 'hero-default');
    if (!defaultBanner) {
      toast.error('Default hero banner not found');
      return;
    }
    await handleSetActive(defaultBanner);
  };

  // File Upload Handler
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Processing and optimizing banner image...');

    try {
      const resultUrl = await uploadHeroBannerImage(file);
      setEditingBanner((prev) => (prev ? { ...prev, image_url: resultUrl } : null));
      toast.success('Image ready for banner!', { id: toastId });
    } catch (err) {
      console.error('Failed to upload banner image:', err);
      toast.error('Failed to upload image. Please try again or use an Image URL.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Banner (Create or Edit)
  const handleSaveBanner = async () => {
    if (!editingBanner) return;

    if (!editingBanner.title?.trim()) {
      toast.error('Please enter a banner title');
      return;
    }

    if (!editingBanner.image_url?.trim()) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving hero banner to database...');

    try {
      const isDefault = editingBanner.is_default || editingBanner.id === 'hero-default';
      const shouldBeActive = editingBanner.is_active ?? (editingBanner.id ? false : true);

      const saved = await saveHeroBanner({
        id: editingBanner.id,
        title: editingBanner.title.trim(),
        subtitle: editingBanner.subtitle?.trim() || '',
        badge_text: editingBanner.badge_text?.trim() || '',
        image_url: editingBanner.image_url.trim(),
        link_url: editingBanner.link_url?.trim() || '',
        button_text: editingBanner.button_text?.trim() || 'Claim Offer',
        aspect_ratio: (editingBanner.aspect_ratio as BannerAspectRatio) || 'auto',
        is_active: shouldBeActive,
        is_default: isDefault,
        display_order: editingBanner.display_order ?? banners.length,
      });

      if (shouldBeActive) {
        await setActiveHeroBanner(saved.id);
      }

      toast.success(
        editingBanner.id
          ? `Updated "${saved.title}" successfully!`
          : `Created new banner "${saved.title}"!`,
        { id: toastId }
      );

      setIsEditModalOpen(false);
      setEditingBanner(null);
      await loadData();
    } catch (err) {
      console.error('Error saving hero banner:', err);
      toast.error('Failed to save hero banner. Please check console.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Banner Handler
  const handleDeleteBanner = async (bannerId: string) => {
    if (bannerId === 'hero-default') {
      toast.error('Cannot delete the default hero banner.');
      setDeleteConfirmId(null);
      return;
    }
    const target = banners.find((b) => b.id === bannerId);
    if (target?.is_default) {
      toast.error('Cannot delete the default hero banner.');
      setDeleteConfirmId(null);
      return;
    }

    // Optimistically update UI immediately
    setBanners((prev) => prev.filter((b) => b.id !== bannerId));
    if (activeBanner?.id === bannerId) {
      const defaultBanner = banners.find((b) => b.is_default || b.id === 'hero-default');
      if (defaultBanner) {
        setActiveBanner({ ...defaultBanner, is_active: true });
      }
    }
    setDeleteConfirmId(null);

    try {
      const success = await deleteHeroBanner(bannerId);
      if (success) {
        toast.success('Banner deleted successfully');
        await loadData();
      } else {
        toast.error('Cannot delete the default hero banner.');
        await loadData();
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      toast.error('Failed to delete banner');
      await loadData();
    }
  };

  // Filtered banners list
  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.badge_text && b.badge_text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'active') return b.is_active;
    if (filterType === 'default') return b.is_default;
    if (filterType === 'custom') return !b.is_default;
    return true;
  });

  const sqlSetupCode = `-- Run this in Supabase SQL Editor to initialize hero_banners table
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id TEXT PRIMARY KEY DEFAULT ('hero-' || gen_random_uuid()),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT DEFAULT 'Claim Offer',
    aspect_ratio TEXT DEFAULT 'auto',
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security & grant access to anon and authenticated users
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view hero_banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Service role full access hero_banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Allow all hero_banners" ON public.hero_banners;

CREATE POLICY "Allow all hero_banners" 
    ON public.hero_banners 
    FOR ALL 
    TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Insert Default Showcase Seed
INSERT INTO public.hero_banners (id, title, subtitle, badge_text, image_url, link_url, button_text, aspect_ratio, is_active, is_default, display_order)
VALUES
('hero-default', 'Default Agency Showcase', 'XGRO AI Platform & Agency Growth Suite Mockup', '⚡ Core Showcase', '/home/hero.png', '/contact', 'Get Started', 'mockup', true, true, 0)
ON CONFLICT (id) DO NOTHING;`;

  return (
    <div className="space-y-8">
      {/* 1. Live Active Banner Master Card */}
      <Card className="rounded-3xl border border-cyan/30 bg-gradient-to-br from-card/90 via-surface/80 to-card/90 backdrop-blur-xl shadow-xl shadow-cyan/5 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border/80">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold px-3 py-1">
                  CURRENTLY LIVE ON HOMEPAGE
                </Badge>
                {activeBanner?.is_default && (
                  <Badge variant="outline" className="border-cyan/30 bg-cyan/10 text-cyan text-xs font-semibold">
                    Default Original Hero Image
                  </Badge>
                )}
                {activeBanner?.badge_text && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold">
                    {activeBanner.badge_text}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-2">
                {activeBanner?.title || 'Default Agency Showcase'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                {activeBanner?.subtitle ||
                  'This banner or image is currently displayed front-and-center to every visitor on your homepage hero section.'}
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {canCreateEdit && (
                <Button
                  onClick={() => {
                    setEditingBanner({
                      title: '',
                      subtitle: '',
                      badge_text: '🎉 Festival Mega Offer',
                      image_url: '',
                      link_url: '/contact',
                      button_text: 'Claim Offer',
                      aspect_ratio: 'banner',
                      is_active: true,
                      is_default: false,
                    });
                    setImageInputMode('upload');
                    setIsEditModalOpen(true);
                  }}
                  className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs sm:text-sm px-5 h-10 shadow-md shadow-cyan/20 gap-2 flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4" /> Upload New Offer Banner
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                disabled={activeBanner?.is_default}
                className="rounded-full border-border hover:border-cyan/40 hover:bg-surface text-xs font-semibold h-10 px-4 gap-2 flex-1 sm:flex-none"
              >
                <RefreshCw className="h-3.5 w-3.5 text-cyan" /> Switch to Default Hero
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSqlModalOpen(true)}
                className="rounded-full text-xs font-medium text-muted-foreground hover:text-cyan gap-1.5 h-10"
              >
                <Code2 className="h-3.5 w-3.5" /> Supabase SQL
              </Button>
            </div>
          </div>

          {/* Active Banner Visual Preview Container */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8">
              <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-surface/50 shadow-inner group">
                {activeBanner?.image_url ? (
                  <div className="relative w-full max-h-[380px] min-h-[220px] flex items-center justify-center bg-black/40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeBanner.image_url}
                      alt={activeBanner.title}
                      className="w-full h-auto max-h-[380px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {activeBanner.badge_text && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/75 text-cyan border border-cyan/40 backdrop-blur-md shadow-lg">
                          <Sparkles className="h-3.5 w-3.5 text-cyan animate-pulse" />
                          {activeBanner.badge_text}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
                    No image active
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metadata & Controls sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-2xl bg-surface/70 border border-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Display Aspect Ratio:</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-cyan/30 text-cyan">
                    {activeBanner?.aspect_ratio || 'Auto'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Action Link Target:</span>
                  <span className="font-mono text-[11px] text-foreground truncate max-w-[150px]">
                    {activeBanner?.link_url || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Button Label:</span>
                  <span className="text-foreground font-semibold">
                    {activeBanner?.button_text || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Banner Type:</span>
                  <span className="text-foreground font-medium">
                    {activeBanner?.is_default ? 'Built-in Showcase Mockup' : 'Custom Festival / Offer Banner'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeBanner) {
                      setPreviewingBanner(activeBanner);
                      setIsPreviewModalOpen(true);
                    }
                  }}
                  className="rounded-xl flex-1 text-xs font-bold border-cyan/30 text-cyan hover:bg-cyan/10 h-9 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Full Hero Preview
                </Button>
                {canCreateEdit && activeBanner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBanner(activeBanner);
                      setImageInputMode(activeBanner.image_url.startsWith('http') ? 'url' : 'upload');
                      setIsEditModalOpen(true);
                    }}
                    className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-9 px-3 gap-1.5"
                >
                  <Link href="/" target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> View Public Site
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Saved Banners Gallery & Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan" />
              Saved Hero Banners & Showcase Gallery
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any previous festival or offer banner to put it live on the homepage with 1 click, or upload new creative banners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search banners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs rounded-xl h-9 w-44 sm:w-56 bg-surface"
            />
            <div className="flex items-center rounded-xl bg-surface p-1 border border-border">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === 'all'
                    ? 'bg-primary text-primary-foreground dark:bg-cyan dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({banners.length})
              </button>
              <button
                onClick={() => setFilterType('active')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === 'active'
                    ? 'bg-primary text-primary-foreground dark:bg-cyan dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterType('custom')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === 'custom'
                    ? 'bg-primary text-primary-foreground dark:bg-cyan dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Offers & Festivals
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanners.map((banner) => {
            const isCurrentlyActive = banner.is_active;

            return (
              <Card
                key={banner.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'border-cyan shadow-lg shadow-cyan/10 bg-card/90 ring-1 ring-cyan/40'
                    : 'border-border bg-card/60 hover:border-cyan/40 hover:shadow-md'
                }`}
              >
                {/* Banner Thumbnail */}
                <div className="relative aspect-[16/9] w-full bg-black/40 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    {isCurrentlyActive ? (
                      <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-md flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE LIVE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-slate-300 border-white/20 text-[10px] font-semibold">
                        Inactive
                      </Badge>
                    )}

                    {banner.is_default && (
                      <Badge variant="outline" className="bg-cyan/90 text-slate-950 border-cyan font-bold text-[10px]">
                        Default Showcase
                      </Badge>
                    )}
                  </div>

                  {banner.badge_text && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/90 text-slate-950 shadow-sm">
                        {banner.badge_text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content & Details */}
                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-foreground text-sm line-clamp-1">
                      {banner.title}
                    </h4>
                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Tag className="h-3 w-3 text-cyan" />
                      {banner.aspect_ratio || 'auto'}
                    </span>
                    {banner.link_url && (
                      <span className="font-mono text-cyan truncate max-w-[120px]">
                        {banner.link_url}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    {isCurrentlyActive ? (
                      <Button
                        size="sm"
                        disabled
                        className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex-1 h-8 cursor-default"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Live on Site
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSetActive(banner)}
                        className="rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 text-xs font-bold flex-1 h-8 shadow-sm"
                      >
                        Set as Active Hero
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewingBanner(banner);
                        setIsPreviewModalOpen(true);
                      }}
                      className="rounded-xl text-xs font-semibold h-8 px-2.5"
                      title="Preview banner mockup"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>

                    {canCreateEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBanner(banner);
                          setImageInputMode(banner.image_url.startsWith('http') ? 'url' : 'upload');
                          setIsEditModalOpen(true);
                        }}
                        className="rounded-xl text-xs font-semibold h-8 px-2.5"
                        title="Edit banner details"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}

                    {canDelete && !banner.is_default && banner.id !== 'hero-default' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(banner.id)}
                        className="rounded-xl text-xs font-semibold h-8 px-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                        title="Delete banner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredBanners.length === 0 && !isLoading && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
            <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-bold text-foreground">No hero banners found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or upload a new festival offer banner.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. CREATE / EDIT BANNER MODAL DIALOG                          */}
      {/* ============================================================ */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan" />
              {editingBanner?.id ? 'Edit Hero Banner' : 'Create & Upload New Hero Banner'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your hero image or festival promotion banner. Upload any size or ratio (mockup, 16:9, or 21:9 wide banner).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Banner Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Banner Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. Diwali Mega Growth Bonanza / Festive 50% Off"
                value={editingBanner?.title || ''}
                onChange={(e) =>
                  setEditingBanner((prev) => (prev ? { ...prev, title: e.target.value } : null))
                }
                className="text-xs rounded-xl h-10 bg-surface"
              />
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Subtitle / Promotional Tagline (Optional)
              </label>
              <Input
                placeholder="e.g. Flat 50% discount on all website development & AI chatbot setups"
                value={editingBanner?.subtitle || ''}
                onChange={(e) =>
                  setEditingBanner((prev) => (prev ? { ...prev, subtitle: e.target.value } : null))
                }
                className="text-xs rounded-xl h-10 bg-surface"
              />
            </div>

            {/* Festival Badge Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-cyan" />
                  Offer / Festival Badge Text
                </label>
                <Input
                  placeholder="e.g. 🎉 Diwali Special • 50% Off"
                  value={editingBanner?.badge_text || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, badge_text: e.target.value } : null))
                  }
                  className="text-xs rounded-xl h-10 bg-surface"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan" />
                  Display Aspect Ratio Format
                </label>
                <select
                  value={editingBanner?.aspect_ratio || 'auto'}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, aspect_ratio: e.target.value as BannerAspectRatio } : null
                    )
                  }
                  className="w-full text-xs rounded-xl h-10 bg-surface border border-border px-3 text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-cyan"
                >
                  <option value="auto">Auto Adaptive (Recommended)</option>
                  <option value="banner">Ultra-wide Banner (21:9 / Festival Promo)</option>
                  <option value="16:9">Standard High-Res (16:9)</option>
                  <option value="mockup">App & UI Mockup (like Default Hero)</option>
                  <option value="4:3">Compact Card (4:3)</option>
                </select>
              </div>
            </div>

            {/* Target Link & CTA Button Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-cyan" />
                  Target Redirect URL (On Banner Click)
                </label>
                <Input
                  placeholder="e.g. /contact or /pricing or https://wa.me/..."
                  value={editingBanner?.link_url || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, link_url: e.target.value } : null))
                  }
                  className="text-xs rounded-xl h-10 bg-surface"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Button Label
                </label>
                <Input
                  placeholder="e.g. Claim 50% Offer Now / Get Started"
                  value={editingBanner?.button_text || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, button_text: e.target.value } : null))
                  }
                  className="text-xs rounded-xl h-10 bg-surface"
                />
              </div>
            </div>

            {/* Image Upload / URL Selector */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan" />
                  Banner Creative Image <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center rounded-lg bg-surface p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      imageInputMode === 'upload'
                        ? 'bg-cyan text-slate-950 shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                      imageInputMode === 'url'
                        ? 'bg-cyan text-slate-950 shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {imageInputMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-cyan/60 bg-surface/50 hover:bg-surface rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
                  >
                    <Upload className="h-8 w-8 text-cyan mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-foreground">
                      {isUploading ? 'Uploading & compressing image...' : 'Click to select or drop banner image'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      PNG, JPG, WebP, SVG supported • Saves directly to Supabase
                    </p>
                  </div>
                </div>
              ) : (
                <Input
                  placeholder="https://example.com/festival-banner.png or /home/hero.png"
                  value={editingBanner?.image_url || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, image_url: e.target.value } : null))
                  }
                  className="text-xs rounded-xl h-10 bg-surface"
                />
              )}

              {/* Image Preview inside modal */}
              {editingBanner?.image_url && (
                <div className="relative rounded-2xl overflow-hidden border border-border bg-black/40 mt-3 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingBanner.image_url}
                    alt="Banner preview"
                    className="w-full h-auto max-h-48 object-contain"
                  />
                  <span className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                    Image Selected
                  </span>
                </div>
              )}
            </div>

            {/* Set as Active toggle checkbox */}
            <div className="p-3 rounded-xl bg-surface/80 border border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Make this banner live immediately</p>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, this banner will automatically replace the currently active hero on the homepage.
                </p>
              </div>
              <input
                type="checkbox"
                checked={editingBanner?.is_active ?? false}
                onChange={(e) =>
                  setEditingBanner((prev) => (prev ? { ...prev, is_active: e.target.checked } : null))
                }
                className="h-4 w-4 rounded accent-cyan cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBanner(null);
              }}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBanner}
              disabled={isSaving || isUploading}
              className="rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-md shadow-cyan/20"
            >
              {isSaving ? 'Saving...' : editingBanner?.id ? 'Save Changes' : 'Publish Hero Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 4. LIVE HERO INTERACTIVE SIMULATION PREVIEW MODAL            */}
      {/* ============================================================ */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface border-border p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan" />
              Homepage Hero Section Preview Simulation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Here is how &quot;<strong>{previewingBanner?.title}</strong>&quot; looks on the live homepage.
            </DialogDescription>
          </DialogHeader>

          {previewingBanner && (
            <div className="relative rounded-3xl border border-border bg-card p-6 sm:p-8 overflow-hidden my-2 shadow-2xl">
              <div className="text-center max-w-2xl mx-auto space-y-3 pb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
                  <Sparkles className="h-3 w-3 text-cyan" />
                  <span>5X Your Business Revenue with AI Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Your Digital Growth <span className="text-cyan">Partner</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Websites, AI Chatbots, SEO & Brand Systems engineered to turn online attention into paying clients.
                </p>
              </div>

              {/* Simulated Hero Banner */}
              <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-cyan/30 shadow-2xl group bg-black/40">
                {previewingBanner.badge_text && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/80 text-cyan border border-cyan/40 backdrop-blur-md shadow-lg">
                      <Sparkles className="h-3.5 w-3.5 text-cyan animate-pulse" />
                      {previewingBanner.badge_text}
                    </span>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewingBanner.image_url}
                  alt={previewingBanner.title}
                  className="w-full h-auto max-h-[420px] object-cover rounded-2xl"
                />
                {previewingBanner.link_url && (
                  <div className="absolute inset-0 bg-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-cyan text-slate-950 font-black text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                      {previewingBanner.button_text || 'Explore Offer'}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {previewingBanner && !previewingBanner.is_active && (
              <Button
                onClick={async () => {
                  await handleSetActive(previewingBanner);
                  setIsPreviewModalOpen(false);
                }}
                className="rounded-xl bg-cyan text-slate-950 font-bold text-xs"
              >
                Set as Active Live Banner
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsPreviewModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 5. DELETE CONFIRMATION DIALOG                                */}
      {/* ============================================================ */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Delete Banner
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this hero banner? If it is currently active, the default showcase hero image will be restored automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deleteConfirmId && handleDeleteBanner(deleteConfirmId)}
              className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4"
            >
              Delete Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 6. SUPABASE SQL SETUP MODAL                                  */}
      {/* ============================================================ */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Code2 className="h-4 w-4 text-cyan" />
              Supabase Hero Banners SQL Schema
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Copy and execute this script in your Supabase SQL Editor if you want to sync hero banners to your PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-surface border border-border text-[11px] font-mono overflow-x-auto max-h-64 text-slate-300">
              {sqlSetupCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(sqlSetupCode);
                toast.success('SQL copied to clipboard!');
              }}
              className="absolute top-2 right-2 rounded-lg text-xs font-semibold h-7 px-2.5 gap-1 bg-card/80 border-cyan/40 text-cyan"
            >
              <Copy className="h-3 w-3" /> Copy SQL
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSqlModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
