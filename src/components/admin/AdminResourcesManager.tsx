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
  subscribeToDataChanges,
} from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/permissions';
import { CustomRoleModel } from '@/lib/supabase/types';
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Policy
CREATE POLICY "Allow public read access to published resources"
ON public.resources
FOR SELECT
USING (true);

-- 4. Admin / Service Role Full Access Policy
CREATE POLICY "Allow all access for authenticated users or service role"
ON public.resources
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_order ON public.resources (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON public.resources (featured);
`;

export function AdminResourcesManager() {
  const { user, isAdmin } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'published' | 'draft'>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<ResourceItem> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview & Delete modals
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Permissions check
  const canCreateOrEdit = isAdmin || hasPermission(user?.role, 'cms_content', 'create_edit', roles);
  const canDelete = isAdmin || hasPermission(user?.role, 'cms_content', 'delete', roles);

  const loadData = async () => {
    try {
      const [allRes, allRoles] = await Promise.all([
        getResources({ includeDrafts: true }),
        getRoles(),
      ]);
      if (Array.isArray(allRes)) {
        setResources(allRes);
      }
      if (Array.isArray(allRoles)) {
        setRoles(allRoles);
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

  // Summary Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    const total = list.length;
    const published = list.filter((r) => (r.status || 'published') === 'published').length;
    const drafts = list.filter((r) => r.status === 'draft').length;
    const totalDownloads = list.reduce((acc, r) => acc + (r.downloadCount || 0), 0);
    const featured = list.filter((r) => Boolean(r.featured)).length;
    return { total, published, drafts, totalDownloads, featured };
  }, [resources]);

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
      linkUrl: '',
      thumbnail_url: '',
      gradient: 'from-purple-600 via-pink-600 to-rose-600',
      tags: ['ChatGPT', 'Marketing'],
      featured: false,
      status: 'published',
      downloadCount: 0,
      display_order: list.length + 1,
    });
    setTagsInput('ChatGPT, Marketing');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (res: ResourceItem) => {
    if (!canCreateOrEdit) {
      toast.error('You do not have permission to edit resources.');
      return;
    }
    setEditingResource({ ...res });
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
    } catch (e) {
      toast.error('Failed to duplicate resource');
    }
  };

  // Toggle Status (Published / Draft)
  const handleToggleStatus = async (res: ResourceItem) => {
    if (!canCreateOrEdit) {
      toast.error('Permission denied to update status.');
      return;
    }
    const newStatus = (res.status || 'published') === 'published' ? 'draft' : 'published';
    try {
      await saveResource({
        ...res,
        status: newStatus,
      });
      toast.success(`Resource marked as ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (res: ResourceItem) => {
    if (!canCreateOrEdit) {
      toast.error('Permission denied.');
      return;
    }
    try {
      await saveResource({
        ...res,
        featured: !res.featured,
      });
      toast.success(res.featured ? 'Removed from featured' : 'Marked as featured resource!');
    } catch (e) {
      toast.error('Failed to update featured flag');
    }
  };

  // Image Upload Handling
  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    setIsUploadingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 600, 400, 0.85);
      setEditingResource((prev) => (prev ? { ...prev, thumbnail_url: compressedDataUrl, thumbnailUrl: compressedDataUrl } : null));
      toast.success(`Thumbnail "${file.name}" compressed and attached!`);
    } catch (err) {
      toast.error('Failed to process image file');
    } finally {
      setIsUploadingImage(false);
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

    try {
      await saveResource({
        ...editingResource,
        title: editingResource.title.trim(),
        description: editingResource.description?.trim() || '',
        category: editingResource.category,
        type: editingResource.type || 'pdf',
        tags: tagsArray,
      } as any);

      toast.success(editingResource.id ? 'Resource updated successfully!' : 'New resource published to database!');
      setIsModalOpen(false);
      setEditingResource(null);
    } catch (err) {
      toast.error('Failed to save resource to database');
    }
  };

  // Delete Handler
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
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Free Resources Hub CMS
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage prompts, Canva templates, PDF guides, tools, checklists, and visual thumbnails served to visitors.
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

          <Button
            onClick={handleOpenCreate}
            disabled={!canCreateOrEdit}
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-4 h-9 shadow-md gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add New Resource
          </Button>
        </div>
      </div>

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
              Total Downloads
            </span>
            <Download className="h-4 w-4 text-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {metrics.totalDownloads.toLocaleString()}
            </span>
            <span className="text-[10px] text-cyan font-bold">Interactions</span>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border-border bg-card/40 p-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
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

          {/* Category Filter */}
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

            {/* Type Filter */}
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

            {/* Status Filter */}
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

                    {/* Dark gradient overlay for readability */}
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

                    {/* Tags */}
                    {res.tags && res.tags.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap gap-1">
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
                      {/* Preview Button */}
                      {res.type === 'prompt' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewResource(res)}
                          title="Preview & Copy Prompt"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* Duplicate Button */}
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

                      {/* Edit Button */}
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

                      {/* Delete Button */}
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
            {searchQuery || categoryFilter !== 'All' || typeFilter !== 'All'
              ? 'No items matched your current search filters.'
              : 'No resources have been added to the database yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || categoryFilter !== 'All' || typeFilter !== 'All') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setTypeFilter('All');
                  setStatusFilter('All');
                }}
                className="rounded-full text-xs font-bold"
              >
                Reset Filters
              </Button>
            )}
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
              Upload custom thumbnail, specify prompt or link URL, and publish to database.
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
                      className="h-20 w-32 object-cover rounded-xl border border-border shadow-sm"
                    />
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Thumbnail Attached
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Image will display on the resource card and banner.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingResource({
                            ...editingResource,
                            thumbnail_url: undefined,
                            thumbnailUrl: undefined,
                          })
                        }
                        className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 rounded-lg"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove Image
                      </Button>
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
                      <label className="text-cyan cursor-pointer hover:underline">
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
                        value={editingResource.thumbnail_url || ''}
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

              {/* Dynamic Content: AI Prompt vs External Link vs PDF Download */}
              {editingResource.type === 'prompt' ? (
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
                  <p className="text-[10px] text-muted-foreground">
                    💡 Users can copy this prompt in 1-click via the public modal into ChatGPT or Claude.
                  </p>
                </div>
              ) : editingResource.type === 'canva' || editingResource.type === 'link' || editingResource.type === 'tool' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="h-4 w-4 text-cyan" />
                    Target Link URL (Canva, Tool, Webpage)
                  </label>
                  <Input
                    placeholder="e.g. https://www.canva.com/template/... or /pricing"
                    value={editingResource.linkUrl || ''}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, linkUrl: e.target.value })
                    }
                    className="text-xs rounded-xl bg-card border-border"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-cyan" />
                    Download File URL (PDF or ZIP Guide)
                  </label>
                  <Input
                    placeholder="e.g. /resources/xgro-price-list-2026.pdf or direct link"
                    value={editingResource.downloadUrl || ''}
                    onChange={(e) =>
                      setEditingResource({ ...editingResource, downloadUrl: e.target.value })
                    }
                    className="text-xs rounded-xl bg-card border-border"
                  />
                </div>
              )}

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
                  Tags (Comma separated)
                </label>
                <Input
                  placeholder="ChatGPT, Meta Ads, Copywriting, Marketing"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Toggles: Featured & Status */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border">
                <div className="flex items-center gap-6">
                  {/* Featured */}
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
                      <Flame className="h-3.5 w-3.5 text-amber-500" /> Featured Badge
                    </span>
                  </label>

                  {/* Status */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingResource.status !== 'draft'}
                      onChange={(e) =>
                        setEditingResource({
                          ...editingResource,
                          status: e.target.checked ? 'published' : 'draft',
                        })
                      }
                      className="h-4 w-4 rounded border-border text-cyan focus:ring-cyan"
                    />
                    <span className="text-xs font-bold text-foreground">
                      Published (Live on site)
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 justify-end">
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
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION DIALOG                                   */}
      {/* ============================================================ */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-rose-500/30 bg-surface p-6 shadow-2xl backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <AlertCircle className="h-4 w-4" />
              </span>
              <DialogTitle className="text-lg font-black text-foreground">
                Delete Resource?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to permanently remove{' '}
              <strong className="text-foreground">"{deleteTarget?.title}"</strong>? This will remove it from the public resources directory and database.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Preview Modal */}
      <PromptCopyModal
        resource={previewResource}
        open={Boolean(previewResource)}
        onOpenChange={(open) => {
          if (!open) setPreviewResource(null);
        }}
      />

      {/* ============================================================ */}
      {/* SUPABASE SQL SCRIPT MODAL                                    */}
      {/* ============================================================ */}
      <Dialog open={isSqlModalOpen} onOpenChange={setIsSqlModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
                <Code2 className="h-4 w-4" />
              </span>
              <DialogTitle className="text-lg font-black text-foreground">
                Supabase SQL Setup for Free Resources
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Run this script once in your Supabase project's SQL Editor to create the `resources` table with RLS policies and indexes.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-3">
            <pre className="p-4 rounded-2xl bg-card border border-border text-[11px] font-mono leading-relaxed text-cyan overflow-x-auto max-h-72">
              {SUPABASE_RESOURCES_SQL}
            </pre>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_RESOURCES_SQL);
                toast.success('SQL script copied to clipboard!');
              }}
              size="sm"
              className="absolute top-3 right-3 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs shadow-md"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy SQL
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsSqlModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
