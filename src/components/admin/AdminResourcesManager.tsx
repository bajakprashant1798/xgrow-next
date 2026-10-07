'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Flame,
  CheckCircle2,
  Calendar,
  Download,
  Zap,
  Eye,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  Code2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Terminal,
  ArrowUpDown,
  Phone,
  Mail,
  MessageSquare,
  Users,
  FileSpreadsheet,
  Link as LinkIcon,
  FileUp,
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
  getResources,
  saveResource,
  deleteResource,
  getRoles,
  getResourceLeads,
  deleteResourceLead,
  uploadResourceThumbnail,
  uploadResourcePdf,
  subscribeToDataChanges,
} from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { CustomRoleModel, ResourceLeadModel } from '@/lib/supabase/types';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
  RESOURCE_CATEGORIES,
  initialResources,
} from '@/lib/resourcesData';
import { compressImageFile } from '@/lib/image-compressor';
import { PromptCopyModal } from '@/components/resources/PromptCopyModal';

const GRADIENT_PRESETS = [
  { name: 'Purple / Pink / Rose', value: 'from-purple-600 via-pink-600 to-rose-600' },
  { name: 'Cyan / Blue / Indigo', value: 'from-cyan-500 via-blue-600 to-indigo-700' },
  { name: 'Emerald / Teal / Cyan', value: 'from-emerald-500 via-teal-600 to-cyan-700' },
  { name: 'Amber / Orange / Red', value: 'from-amber-500 via-orange-600 to-red-600' },
  { name: 'Blue / Indigo / Violet', value: 'from-blue-600 via-indigo-600 to-violet-700' },
  { name: 'Fuchsia / Purple / Blue', value: 'from-fuchsia-600 via-purple-600 to-blue-600' },
  { name: 'Sky / Blue / Indigo', value: 'from-sky-500 via-blue-600 to-indigo-600' },
  { name: 'Slate / Dark Zinc', value: 'from-slate-700 via-slate-800 to-slate-950' },
  { name: 'Rose / Pink / Purple', value: 'from-rose-500 via-pink-600 to-purple-700' },
];

const RESOURCE_TYPES: { type: ResourceType; label: string; defaultFormat: string }[] = [
  { type: 'prompt', label: 'AI Prompt Pack', defaultFormat: 'AI Prompt Pack' },
  { type: 'canva', label: 'Canva Template', defaultFormat: 'Canva Template' },
  { type: 'pdf', label: 'PDF Guide & Rate Card', defaultFormat: 'PDF Document' },
  { type: 'tool', label: 'Interactive Web Tool', defaultFormat: 'Interactive Tool' },
  { type: 'link', label: 'Useful Web Link', defaultFormat: 'Web Link' },
  { type: 'checklist', label: 'Action Checklist', defaultFormat: 'PDF Checklist' },
];

const SUPABASE_RESOURCES_SQL = `-- 1. Create the resources table for Supabase
CREATE TABLE IF NOT EXISTS public.resources (
    id TEXT PRIMARY KEY DEFAULT ('res-' || gen_random_uuid()),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prompt', 'canva', 'pdf', 'tool', 'link', 'checklist')),
    file_format TEXT NOT NULL DEFAULT 'PDF Document',
    file_size TEXT DEFAULT 'Instant',
    thumbnail_url TEXT,
    download_url TEXT,
    link_url TEXT,
    prompt_content TEXT,
    gradient TEXT DEFAULT 'from-purple-600 via-pink-600 to-rose-600',
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    download_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the resource leads table
CREATE TABLE IF NOT EXISTS public.resource_leads (
    id TEXT PRIMARY KEY DEFAULT ('lead-' || gen_random_uuid()),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT,
    country TEXT,
    notes TEXT,
    resource_id TEXT,
    resource_title TEXT NOT NULL,
    resource_type TEXT DEFAULT 'resource',
    coupon_code TEXT DEFAULT 'XGROW-SAVE15',
    calc_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow all access to resources" ON public.resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to resource_leads" ON public.resource_leads FOR ALL USING (true) WITH CHECK (true);

-- 4. Storage Bucket for Resources (Images & PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access resources" ON storage.objects;
CREATE POLICY "Public Access resources"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'resources')
WITH CHECK (bucket_id = 'resources');
`;

export function AdminResourcesManager() {
  const { user, isAdmin, hasPermission: checkPerm } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'leads'>('catalog');
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [leads, setLeads] = useState<ResourceLeadModel[]>([]);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'published' | 'draft'>('All');

  // Search for Leads
  const [leadsSearchQuery, setLeadsSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<ResourceItem> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [pdfSourceMode, setPdfSourceMode] = useState<'file' | 'link'>('file');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview & Delete modals
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<ResourceLeadModel | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Permissions check
  const canCreateOrEdit = isAdmin || checkPerm('cms_content', 'create_edit');
  const canDelete = isAdmin || checkPerm('cms_content', 'delete');

  const loadData = async () => {
    try {
      const [allRes, allRoles, allLeads] = await Promise.all([
        getResources({ includeDrafts: true }),
        getRoles(),
        getResourceLeads(),
      ]);
      if (Array.isArray(allRes)) {
        setResources(allRes);
      }
      if (Array.isArray(allRoles)) {
        setRoles(allRoles);
      }
      if (Array.isArray(allLeads)) {
        setLeads(allLeads);
      }
    } catch (e) {
      console.error('Error loading resources in admin:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Filtered resources calculation
  const filteredResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    return list.filter((res) => {
      if (!res) return false;
      const matchesCategory =
        categoryFilter === 'All' || res.category === categoryFilter;
      const matchesType =
        typeFilter === 'All' || res.type === typeFilter;
      const matchesStatus =
        statusFilter === 'All' || (res.status || 'published') === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (res.title && res.title.toLowerCase().includes(q)) ||
        (res.description && res.description.toLowerCase().includes(q)) ||
        (res.category && res.category.toLowerCase().includes(q)) ||
        (Array.isArray(res.tags) && res.tags.some((t) => t && t.toLowerCase().includes(q)));

      return matchesCategory && matchesType && matchesStatus && matchesSearch;
    });
  }, [resources, categoryFilter, typeFilter, statusFilter, searchQuery]);

  // Filtered leads calculation
  const filteredLeads = useMemo(() => {
    const list = Array.isArray(leads) ? leads : [];
    const q = leadsSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      (l.business_name && l.business_name.toLowerCase().includes(q)) ||
      (l.resource_title && l.resource_title.toLowerCase().includes(q)) ||
      (l.coupon_code && l.coupon_code.toLowerCase().includes(q))
    );
  }, [leads, leadsSearchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    const total = list.length;
    const published = list.filter((r) => (r.status || 'published') === 'published').length;
    const drafts = list.filter((r) => r.status === 'draft').length;
    const totalDownloads = list.reduce((acc, r) => acc + (r.downloadCount || 0), 0);
    const featured = list.filter((r) => Boolean(r.featured)).length;
    return { total, published, drafts, totalDownloads, featured, totalLeads: leads.length };
  }, [resources, leads]);

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!canCreateOrEdit) {
      toast.error('You do not have permission to add new resources.');
      return;
    }
    const list = Array.isArray(resources) ? resources : [];
    setEditingResource({
      title: '',
      description: '',
      category: 'AI Prompts',
      type: 'prompt',
      fileFormat: 'AI Prompt Pack',
      fileSize: 'Instant Copy',
      promptContent: '',
      downloadUrl: '',
      download_url: '',
      linkUrl: '',
      link_url: '',
      pdf_file: '',
      thumbnail_url: '',
      thumbnailUrl: '',
      gradient: 'from-purple-600 via-pink-600 to-rose-600',
      tags: ['ChatGPT', 'Marketing'],
      featured: false,
      status: 'published',
      downloadCount: 0,
      display_order: list.length + 1,
    });
    setTagsInput('ChatGPT, Marketing');
    setPdfSourceMode('file');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (res: ResourceItem) => {
    if (!canCreateOrEdit) {
      toast.error('You do not have permission to edit resources.');
      return;
    }
    const thumb = res.thumbnail_url || res.thumbnailUrl || '';
    const dl = res.downloadUrl || res.download_url || res.pdf_file || '';
    const lk = res.linkUrl || res.link_url || '';
    setEditingResource({
      ...res,
      thumbnail_url: thumb,
      thumbnailUrl: thumb,
      downloadUrl: dl,
      download_url: dl,
      linkUrl: lk,
      link_url: lk,
      pdf_file: res.pdf_file || (dl.startsWith('data:') ? dl : ''),
    });
    setPdfSourceMode(dl.startsWith('data:') ? 'file' : lk || dl ? 'link' : 'file');
    setTagsInput(res.tags ? res.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  // Duplicate Resource
  const handleDuplicate = async (res: ResourceItem) => {
    if (!canCreateOrEdit) {
      toast.error('You do not have permission to create resources.');
      return;
    }
    try {
      const duplicated: Partial<ResourceItem> & { title: string; category: string; type: ResourceType } = {
        ...res,
        id: `res-${Date.now()}`,
        title: `${res.title} (Copy)`,
        downloadCount: 0,
        status: 'draft',
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      };
      await saveResource(duplicated);
      toast.success(`Resource "${res.title}" duplicated as draft!`);
      loadData();
    } catch (e) {
      toast.error('Failed to duplicate resource');
    }
  };

  // Image Upload Handling (Direct Supabase Storage with WebP fallback)
  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    setIsUploadingImage(true);
    try {
      const publicUrl = await uploadResourceThumbnail(file);
      setEditingResource((prev) => (prev ? { ...prev, thumbnail_url: publicUrl, thumbnailUrl: publicUrl } : null));
      toast.success(`Thumbnail "${file.name}" uploaded successfully!`);
    } catch (err) {
      toast.error('Failed to process image file');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // PDF Document File Upload Handling (Direct Supabase Storage with DataURL fallback)
  const handlePdfUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF file size must be less than 25MB');
      return;
    }
    setIsUploadingPdf(true);
    try {
      const sizeFormatted = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const resultUrl = await uploadResourcePdf(file);
      setEditingResource((prev) => (prev ? {
        ...prev,
        pdf_file: resultUrl,
        download_url: resultUrl,
        downloadUrl: resultUrl,
        fileSize: sizeFormatted,
        fileFormat: 'PDF Document',
      } : null));
      toast.success(`PDF "${file.name}" (${sizeFormatted}) uploaded successfully!`);
    } catch (err) {
      toast.error('Failed to upload PDF file');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Save Form Handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource?.title?.trim()) {
      toast.error('Resource Title is required');
      return;
    }
    if (!editingResource.category) {
      toast.error('Category is required');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const thumbnailVal = editingResource.thumbnail_url || editingResource.thumbnailUrl || '';
    const downloadVal = editingResource.download_url || editingResource.downloadUrl || editingResource.pdf_file || '';
    const linkVal = editingResource.link_url || editingResource.linkUrl || '';

    try {
      await saveResource({
        ...editingResource,
        title: editingResource.title.trim(),
        description: editingResource.description?.trim() || '',
        category: editingResource.category,
        type: editingResource.type || 'pdf',
        thumbnail_url: thumbnailVal,
        thumbnailUrl: thumbnailVal,
        download_url: downloadVal,
        downloadUrl: downloadVal,
        link_url: linkVal,
        linkUrl: linkVal,
        pdf_file: editingResource.pdf_file || '',
        tags: tagsArray,
      } as any);

      toast.success(editingResource.id ? 'Resource updated successfully!' : 'New resource published to database!');
      setIsModalOpen(false);
      setEditingResource(null);
      await loadData();
    } catch (err) {
      toast.error('Failed to save resource to database');
    }
  };

  // Delete Resource Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      toast.error('You do not have permission to delete resources.');
      return;
    }
    try {
      await deleteResource(deleteTarget.id);
      toast.success(`Resource "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  // Delete Lead Handler
  const handleDeleteLeadConfirm = async () => {
    if (!deleteLeadTarget) return;
    try {
      await deleteResourceLead(deleteLeadTarget.id);
      toast.success(`Lead for "${deleteLeadTarget.name}" deleted.`);
      setDeleteLeadTarget(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  // Export Leads as CSV
  const handleExportLeadsCsv = () => {
    if (leads.length === 0) {
      toast.error('No leads available to export');
      return;
    }
    const headers = ['ID', 'Name', 'Business', 'Email', 'Phone', 'Resource Title', 'Coupon', 'Date'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.business_name || '').replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.phone.replace(/"/g, '""')}"`,
      `"${(l.resource_title || '').replace(/"/g, '""')}"`,
      `"${l.coupon_code}"`,
      `"${new Date(l.created_at).toLocaleString()}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xgro-resource-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Visitor leads exported as CSV!');
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Free Resources & Lead Hub
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage prompts, PDF guides, Canva templates, tools, and track unlocked visitor leads.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsSqlModalOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold border-border gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Code2 className="h-3.5 w-3.5 text-cyan" />
            Supabase SQL
          </Button>

          {activeTab === 'catalog' ? (
            <Button
              onClick={handleOpenCreate}
              disabled={!canCreateOrEdit}
              className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-4 h-9 shadow-md gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Add New Resource
            </Button>
          ) : (
            <Button
              onClick={handleExportLeadsCsv}
              variant="outline"
              size="sm"
              className="rounded-full border-cyan/30 text-cyan hover:bg-cyan/10 font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Leads CSV
            </Button>
          )}
        </div>
      </div>

      {/* Main Switcher Tabs (Catalog vs Visitor Leads) */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'catalog'
              ? 'bg-cyan text-slate-950 shadow-md scale-105'
              : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Resources Catalog</span>
          <Badge className={`text-[10px] px-2 py-0 ${activeTab === 'catalog' ? 'bg-slate-950 text-white' : 'bg-card text-muted-foreground'}`}>
            {resources.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'leads'
              ? 'bg-cyan text-slate-950 shadow-md scale-105'
              : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Visitor Leads & Downloads</span>
          <Badge className={`text-[10px] px-2 py-0 ${activeTab === 'leads' ? 'bg-slate-950 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {leads.length}
          </Badge>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESOURCES CATALOG                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          {/* Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="rounded-2xl border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Resources
                </span>
                <Layers className="h-4 w-4 text-cyan" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{metrics.total}</span>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {metrics.published} Live
                </span>
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Featured Items
                </span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{metrics.featured}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Priority</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Drafts / Hidden
                </span>
                <FileText className="h-4 w-4 text-orange-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{metrics.drafts}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Unpublished</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Leads Captured
                </span>
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {metrics.totalLeads}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">Visitors</span>
              </div>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <Card className="rounded-2xl border-border bg-card/40 p-4 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, category, prompt text, or #tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs bg-surface border-border"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                >
                  <option value="All">All Categories</option>
                  {RESOURCE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                >
                  <option value="All">All Types</option>
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                >
                  <option value="All">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts Only</option>
                </select>

                {(categoryFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('All');
                      setTypeFilter('All');
                      setStatusFilter('All');
                      setSearchQuery('');
                    }}
                    className="h-10 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Resources Cards Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((res) => {
                const hasThumbnail = Boolean(res.thumbnail_url || res.thumbnailUrl);
                const isDraft = res.status === 'draft';

                return (
                  <Card
                    key={res.id}
                    className={`group flex flex-col justify-between rounded-3xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-xl ${
                      isDraft ? 'border-amber-500/40 opacity-80' : 'border-border hover:border-cyan/60'
                    }`}
                  >
                    <div>
                      {/* Visual Header / Cover */}
                      <div
                        className={`h-36 w-full relative overflow-hidden flex flex-col justify-between p-4 ${
                          hasThumbnail ? 'bg-slate-900' : `bg-gradient-to-r ${res.gradient || 'from-purple-600 via-pink-600 to-rose-600'}`
                        }`}
                      >
                        {hasThumbnail && (
                          <img
                            src={res.thumbnail_url || res.thumbnailUrl}
                            alt={res.title}
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/30" />

                        {/* Top Badges */}
                        <div className="relative z-10 flex items-center justify-between">
                          <Badge className="bg-slate-950/80 text-white border-white/20 text-[10px] font-bold backdrop-blur-md px-2.5 py-0.5">
                            {res.fileFormat}
                          </Badge>

                          <div className="flex items-center gap-1.5">
                            {res.featured && (
                              <Badge className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 flex items-center gap-1 shadow-md">
                                <Flame className="h-3 w-3 fill-slate-950" /> FEATURED
                              </Badge>
                            )}
                            <Badge
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                                isDraft
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {isDraft ? 'Draft' : 'Live'}
                            </Badge>
                          </div>
                        </div>

                        {/* Bottom Title / Info Overlay */}
                        <div className="relative z-10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cyan drop-shadow-md">
                            {res.category}
                          </span>
                          <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-2 mt-0.5">
                            <span>{res.fileSize || 'Instant'}</span>
                            <span>•</span>
                            <span>{(res.downloadCount || 0).toLocaleString()} downloads</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <CardContent className="p-5">
                        <h3 className="text-sm font-black text-foreground line-clamp-2 leading-snug group-hover:text-cyan transition-colors">
                          {res.title}
                        </h3>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {res.description || 'No description provided.'}
                        </p>

                        {/* Direct Link or PDF indicator */}
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          {res.pdf_file || (res.downloadUrl && res.downloadUrl.endsWith('.pdf')) ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-sans font-bold">
                              <FileText className="h-3 w-3" /> Direct PDF Attached
                            </span>
                          ) : res.linkUrl || res.downloadUrl ? (
                            <span className="flex items-center gap-1 text-cyan font-sans font-bold truncate max-w-[220px]">
                              <LinkIcon className="h-3 w-3 shrink-0" /> {res.linkUrl || res.downloadUrl}
                            </span>
                          ) : null}
                        </div>

                        {/* Tags */}
                        {res.tags && res.tags.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {res.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-5 pt-0 border-t border-border/40 mt-auto">
                      <div className="pt-3 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3 text-cyan" /> {res.dateAdded || 'Aug 2026'}
                        </span>

                        <div className="flex items-center gap-1">
                          {res.type === 'prompt' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewResource(res)}
                              title="Preview Prompt"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(res)}
                            disabled={!canCreateOrEdit}
                            title="Duplicate Resource"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(res)}
                            disabled={!canCreateOrEdit}
                            title="Edit Resource"
                            className="h-8 w-8 rounded-lg text-cyan hover:bg-cyan/10"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(res)}
                            disabled={!canDelete}
                            title="Delete Resource"
                            className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/30">
              <Sparkles className="mx-auto h-10 w-10 text-cyan mb-3" />
              <h4 className="text-base font-bold text-foreground">No resources found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No resources matched your current search filters.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  onClick={handleOpenCreate}
                  disabled={!canCreateOrEdit}
                  size="sm"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 stroke-[3]" /> Add First Resource
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VISITOR LEADS & DOWNLOADS TABLE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Leads Search Bar */}
          <Card className="rounded-2xl border-border bg-card/40 p-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search leads by name, email, phone, business, resource, or coupon code..."
                  value={leadsSearchQuery}
                  onChange={(e) => setLeadsSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs bg-surface border-border"
                />
                {leadsSearchQuery && (
                  <button
                    onClick={() => setLeadsSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Showing {filteredLeads.length} of {leads.length} Leads
                </span>
              </div>
            </div>
          </Card>

          {/* Leads Table */}
          {filteredLeads.length > 0 ? (
            <Card className="rounded-3xl border-border bg-card/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/80 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Visitor & Business</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Resource Accessed</th>
                      <th className="py-3.5 px-4 text-center">Coupon Code</th>
                      <th className="py-3.5 px-4">Unlocked Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredLeads.map((lead) => {
                      const cleanPhoneDigits = (lead.phone || '').replace(/\D/g, '');

                      return (
                        <tr key={lead.id} className="hover:bg-surface/40 transition-colors">
                          {/* Visitor Name & Business */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-sm text-foreground">
                              {lead.name}
                            </div>
                            {lead.business_name && (
                              <div className="text-[11px] text-cyan font-semibold">
                                {lead.business_name}
                              </div>
                            )}
                            {lead.notes && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                                "{lead.notes}"
                              </p>
                            )}
                          </td>

                          {/* Contact Info (WhatsApp & Email) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <a
                                href={`https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(`Hi ${lead.name}, regarding your interest in ${lead.resource_title} from XGRO Digital Agency...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </a>
                              <a
                                href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your XGRO Resource: ${lead.resource_title}`)}`}
                                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-cyan truncate max-w-[200px]"
                              >
                                <Mail className="h-3 w-3" />
                                <span>{lead.email}</span>
                              </a>
                            </div>
                          </td>

                          {/* Resource Title */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground line-clamp-2 max-w-[240px]">
                              {lead.resource_title}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">
                              Type: {lead.resource_type || 'Resource'}
                            </span>
                          </td>

                          {/* Coupon Code */}
                          <td className="py-3.5 px-4 text-center">
                            <Badge className="bg-cyan/15 text-cyan border border-cyan/30 font-mono text-[10px] font-bold">
                              {lead.coupon_code}
                            </Badge>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                            {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Recent'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`https://wa.me/${cleanPhoneDigits}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteLeadTarget(lead)}
                                className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                title="Delete Lead"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/30">
              <Users className="mx-auto h-10 w-10 text-cyan mb-3" />
              <h4 className="text-base font-bold text-foreground">No visitor leads captured yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                When visitors unlock prompts, download PDF guides, or request quotes, their details and coupon codes will appear here instantly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE / EDIT RESOURCE MODAL DIALOG                          */}
      {/* ============================================================ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan/15 text-cyan border-cyan/30 px-3 py-1 font-bold">
                {editingResource?.id ? 'EDIT RESOURCE' : 'NEW RESOURCE'}
              </Badge>
            </div>
            <DialogTitle className="mt-2 text-xl font-black text-foreground">
              {editingResource?.id ? 'Edit Resource Details' : 'Publish New Free Resource'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload custom thumbnail, attach PDF file or link URL, and publish to database.
            </DialogDescription>
          </DialogHeader>

          {editingResource && (
            <form onSubmit={handleSaveForm} className="space-y-5 mt-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. 50+ High-Converting Meta & Google Ads Headline Prompts"
                  value={editingResource.title || ''}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, title: e.target.value })
                  }
                  className="text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Category & Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingResource.category || 'AI Prompts'}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, category: e.target.value })
                    }
                    className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                  >
                    {RESOURCE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Resource Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingResource.type || 'prompt'}
                    onChange={(e) => {
                      const newType = e.target.value as ResourceType;
                      const typePreset = RESOURCE_TYPES.find((t) => t.type === newType);
                      setEditingResource({
                        ...editingResource,
                        type: newType,
                        fileFormat: typePreset?.defaultFormat || editingResource.fileFormat,
                      });
                    }}
                    className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thumbnail Image Uploader & Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-cyan" />
                    Cover Thumbnail Image (Optional)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Auto-compressed (WebP/PNG)
                  </span>
                </label>

                {editingResource.thumbnail_url || editingResource.thumbnailUrl ? (
                  <div className="relative rounded-2xl border border-border bg-card p-3 flex items-center gap-4">
                    <img
                      src={editingResource.thumbnail_url || editingResource.thumbnailUrl}
                      alt="Thumbnail Preview"
                      className="h-20 w-32 object-cover rounded-xl border border-border shadow-sm bg-slate-900"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Thumbnail Attached
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {editingResource.thumbnail_url?.startsWith('data:') ? 'Custom uploaded image (optimized)' : editingResource.thumbnail_url}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="cursor-pointer text-xs font-bold text-cyan hover:underline flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Replace Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                          />
                        </label>
                        <span className="text-muted-foreground">•</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingResource({
                              ...editingResource,
                              thumbnail_url: '',
                              thumbnailUrl: '',
                            })
                          }
                          className="h-6 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 rounded-lg"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Remove Image
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        handleImageUpload(file);
                      } else {
                        toast.error('Please drop an image file (PNG, JPG, WebP, SVG)');
                      }
                    }}
                    className={`rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                      isDragging ? 'border-cyan bg-cyan/5' : 'border-border hover:border-cyan/50 bg-card/40'
                    }`}
                  >
                    <Upload className="mx-auto h-7 w-7 text-cyan mb-1.5" />
                    <p className="text-xs font-bold text-foreground">
                      Drag & Drop image here, or{' '}
                      <label className="text-cyan cursor-pointer hover:underline font-bold">
                        browse file
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      PNG, JPG, WebP, SVG up to 10MB (automatically optimized)
                    </p>

                    <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2">
                      <Input
                        placeholder="Or paste external image URL (https://...)"
                        value={editingResource.thumbnail_url || editingResource.thumbnailUrl || ''}
                        onChange={(e) =>
                          setEditingResource({
                            ...editingResource,
                            thumbnail_url: e.target.value,
                            thumbnailUrl: e.target.value,
                          })
                        }
                        className="text-xs rounded-xl bg-card border-border h-8"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Deliverable Content: PDF File/Link vs Canva/Tool Link vs AI Prompt */}
              {editingResource.type === 'pdf' || editingResource.type === 'checklist' ? (
                <div className="space-y-3 p-4 rounded-2xl border border-border bg-card/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-cyan" />
                      PDF / Document Delivery Source
                    </label>

                    {/* Dual Mode Switcher: File Upload vs Direct Link */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface border border-border">
                      <button
                        type="button"
                        onClick={() => setPdfSourceMode('file')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          pdfSourceMode === 'file' ? 'bg-cyan text-slate-950 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Option 1: Upload PDF File
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfSourceMode('link')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          pdfSourceMode === 'link' ? 'bg-cyan text-slate-950 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Option 2: Cloud / Link URL
                      </button>
                    </div>
                  </div>

                  {pdfSourceMode === 'file' ? (
                    <div>
                      {editingResource.pdf_file || (editingResource.download_url && editingResource.download_url.startsWith('data:')) ? (
                        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                Custom PDF Document Attached
                              </p>
                              <p className="text-[10px] text-emerald-400 font-mono">
                                Size: {editingResource.fileSize || 'Attached'}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingResource({
                                ...editingResource,
                                pdf_file: '',
                                download_url: '',
                                downloadUrl: '',
                              })
                            }
                            className="h-7 text-xs text-rose-400 hover:text-rose-300"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border border-dashed border-border rounded-xl p-4 text-center bg-surface/40">
                          <FileUp className="mx-auto h-7 w-7 text-cyan mb-1.5" />
                          <p className="text-xs font-bold text-foreground">
                            Upload PDF Guide / Checklist
                          </p>
                          <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs cursor-pointer shadow-sm">
                            <Upload className="h-3.5 w-3.5" />
                            {isUploadingPdf ? 'Uploading...' : 'Browse PDF File'}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePdfUpload(file);
                              }}
                            />
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            PDF files up to 20MB supported directly.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        placeholder="e.g. https://drive.google.com/file/d/... or /resources/file.pdf"
                        value={editingResource.download_url || editingResource.downloadUrl || ''}
                        onChange={(e) =>
                          setEditingResource({
                            ...editingResource,
                            download_url: e.target.value,
                            downloadUrl: e.target.value,
                          })
                        }
                        className="text-xs rounded-xl bg-card border-border"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Paste a direct download link, Google Drive link, or external PDF URL.
                      </p>
                    </div>
                  )}
                </div>
              ) : editingResource.type === 'canva' || editingResource.type === 'link' || editingResource.type === 'tool' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="h-4 w-4 text-cyan" />
                    Target Resource Link URL (Canva, Tool, Webpage) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. https://www.canva.com/template/... or /pricing"
                    value={editingResource.link_url || editingResource.linkUrl || ''}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        link_url: e.target.value,
                        linkUrl: e.target.value,
                      })
                    }
                    className="text-xs rounded-xl bg-card border-border"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    When visitors unlock this resource, they can open this link in 1-click in a new tab or copy it.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-cyan" />
                      Copyable AI Prompt Template <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-cyan font-mono">
                      {(editingResource.promptContent || '').length} characters
                    </span>
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Enter the prompt template... Use brackets like [PRODUCT_NAME] for placeholders users will replace."
                    value={editingResource.promptContent || ''}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, promptContent: e.target.value })
                    }
                    className="text-xs font-mono rounded-xl bg-card border-border leading-relaxed"
                  />
                </div>
              )}

              {/* Gradient Banner Preset Picker (Fallback / Theme) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Visual Gradient Theme (Card Backdrop)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Used if no image thumbnail is set
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {GRADIENT_PRESETS.map((grad) => {
                    const isSelected = editingResource.gradient === grad.value;
                    return (
                      <button
                        key={grad.value}
                        type="button"
                        onClick={() =>
                          setEditingResource({ ...editingResource, gradient: grad.value })
                        }
                        className={`h-8 rounded-xl bg-gradient-to-r ${grad.value} transition-all relative ${
                          isSelected ? 'ring-2 ring-cyan ring-offset-2 ring-offset-surface scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={grad.name}
                      >
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-white mx-auto drop-shadow-md" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Description & What’s Included
                </label>
                <Textarea
                  rows={2}
                  placeholder="Summary of what the resource contains, target audience, and key benefits..."
                  value={editingResource.description || ''}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, description: e.target.value })
                  }
                  className="text-xs rounded-xl bg-card border-border leading-relaxed"
                />
              </div>

              {/* File Format, Size & Download Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Format Badge</label>
                  <Input
                    placeholder="e.g. AI Prompt Pack"
                    value={editingResource.fileFormat || ''}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, fileFormat: e.target.value })
                    }
                    className="text-xs rounded-xl bg-card border-border h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Size / Detail</label>
                  <Input
                    placeholder="e.g. 25 Designs or 1.4 MB"
                    value={editingResource.fileSize || ''}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, fileSize: e.target.value })
                    }
                    className="text-xs rounded-xl bg-card border-border h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Downloads Count</label>
                  <Input
                    type="number"
                    value={editingResource.downloadCount ?? 0}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        downloadCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-xs rounded-xl bg-card border-border h-9"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Search Tags (Comma separated)
                </label>
                <Input
                  placeholder="ChatGPT, Marketing, Prompts, Local SEO"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Status & Featured Checkboxes */}
              <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingResource.featured)}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, featured: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-cyan focus:ring-cyan"
                  />
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400" /> Mark as Featured Resource
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Status:</span>
                  <select
                    value={editingResource.status || 'published'}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, status: e.target.value as any })
                    }
                    className="h-8 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-5 shadow-md"
                >
                  {editingResource.id ? 'Save Changes' : 'Publish Resource'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" /> Delete Resource?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">"{deleteTarget?.title}"</strong>? This will remove it from the public website immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Confirmation Dialog */}
      <Dialog open={Boolean(deleteLeadTarget)} onOpenChange={(open) => !open && setDeleteLeadTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> Remove Lead Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Remove the lead entry for <strong className="text-foreground">{deleteLeadTarget?.name}</strong> ({deleteLeadTarget?.email})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteLeadTarget(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteLeadConfirm}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
            >
              Remove Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Preview Modal */}
      <PromptCopyModal
        resource={previewResource}
        open={Boolean(previewResource)}
        onOpenChange={(open) => !open && setPreviewResource(null)}
      />

      {/* Supabase SQL Documentation Modal */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan/15 text-cyan border-cyan/30 text-xs font-bold">
                SUPABASE SQL SCHEMA
              </Badge>
            </div>
            <DialogTitle className="mt-2 text-lg font-black text-foreground">
              Resources & Visitor Leads Schema
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Run this in your Supabase SQL Editor if creating the tables for the first time.
            </DialogDescription>
          </DialogHeader>

          <pre className="p-4 rounded-2xl bg-card border border-border font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto select-all">
            {SUPABASE_RESOURCES_SQL}
          </pre>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_RESOURCES_SQL);
                toast.success('SQL copied to clipboard!');
              }}
              className="rounded-xl bg-cyan text-slate-950 font-bold text-xs"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy SQL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
