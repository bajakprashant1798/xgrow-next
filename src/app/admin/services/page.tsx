'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Laptop,
  Palette,
  TrendingUp,
  Cpu,
  Sparkles,
  ExternalLink,
  ArrowUpDown,
  X,
  Image as ImageIcon,
  Upload,
  Link2,
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
import { getServices, saveService, deleteService, subscribeToDataChanges } from '@/lib/db';
import { ServiceModel, ServiceStatus } from '@/lib/supabase/types';
import { compressImageFile } from '@/lib/image-compressor';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

const CATEGORIES = ['All', 'Web', 'Creative', 'Marketing', 'AI'];
const ICONS = ['Laptop', 'Palette', 'TrendingUp', 'Cpu', 'Sparkles'];

export default function ServicesManagementPage() {
  const { user, isAdmin, hasPermission } = useAuth();

  // RBAC Gating permissions
  const canView = isAdmin || hasPermission('services', 'view');
  const canCreateEdit = isAdmin || hasPermission('services', 'create_edit');
  const canPublish = isAdmin || hasPermission('services', 'publish');
  const canDelete = isAdmin || hasPermission('services', 'delete');

  const [services, setServices] = useState<ServiceModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceModel> | null>(null);

  // Form states for features
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const loadData = async () => {
    const data = await getServices();
    setServices(data);
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file, 800, 600, 0.85);
      setEditingService((prev) => (prev ? { ...prev, image_url: compressedDataUrl } : null));
      toast.success('Image compressed and preview ready!');
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const openCreateDialog = () => {
    setEditingService({
      title: '',
      slug: '',
      category: 'Web',
      short_description: '',
      full_description: '',
      price: '₹14,999',
      discount_price: '₹24,999',
      features: [],
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      icon: 'Laptop',
      status: 'published',
      display_order: services.length + 1,
      meta_title: '',
      meta_description: '',
    });
    setFeaturesList([
      'Custom Responsive Design',
      'Mobile Optimization',
      'SEO Friendly Architecture',
    ]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: ServiceModel) => {
    setEditingService(service);
    setFeaturesList(service.features || []);
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
    if (!canCreateEdit) {
      toast.error('You do not have permission to create or edit services');
      return;
    }
    if (!editingService?.title) {
      toast.error('Service Name is required');
      return;
    }

    try {
      await saveService({
        ...editingService,
        features: featuresList,
      } as ServiceModel);

      toast.success(
        editingService.id ? 'Service updated successfully!' : 'New service published to CMS!'
      );
      setIsDialogOpen(false);
      setEditingService(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save service');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete services');
      return;
    }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteService(id);
      toast.success(`Service "${name}" deleted`);
      loadData();
    }
  };

  const handleToggleStatus = async (service: ServiceModel) => {
    if (!canPublish) {
      toast.error('You do not have permission to publish or draft services');
      return;
    }
    const newStatus: ServiceStatus = service.status === 'published' ? 'draft' : 'published';
    await saveService({
      ...service,
      status: newStatus,
    });
    toast.success(`Service status set to ${newStatus}`);
    loadData();
  };

  // Filter services
  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="h-4 w-4 text-cyan" />;
      case 'Palette':
        return <Palette className="h-4 w-4 text-cyan" />;
      case 'TrendingUp':
        return <TrendingUp className="h-4 w-4 text-cyan" />;
      case 'Cpu':
        return <Cpu className="h-4 w-4 text-cyan" />;
      default:
        return <Sparkles className="h-4 w-4 text-cyan" />;
    }
  };

  if (!canView) {
    return <AdminAccessDenied moduleName="Services CMS" requiredAction="View Services" />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-cyan" />
            Services Management CMS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage public agency services, pricing, included features, SEO tags, and order dynamically.
          </p>
        </div>
        {canCreateEdit && (
          <Button
            onClick={openCreateDialog}
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Service
          </Button>
        )}
      </div>

      {/* Filters & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full bg-surface"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan text-slate-950 font-bold shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground hover:bg-surface/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Example Templates Bar */}
      <div className="p-4 rounded-2xl bg-surface/50 border border-border/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            Quick Example Templates (Click to Load Production Blueprint):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: '🏥 Hospital & Healthcare Web Portal',
              title: 'Hospital & Healthcare Web Portal',
              category: 'Web',
              slug: 'healthcare-portal',
              short_description: 'HIPAA-conscious high-speed medical website with OPD appointment booking and doctor profiles.',
              full_description: 'Engineered for hospitals, specialty clinics, and doctors to capture patient inquiries and automate OPD booking.',
              price: '₹24,999',
              discount_price: '₹34,999',
              image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop',
              features: [
                'Doctor Directory & OPD Schedule Finder',
                'Online Appointment Booking via WhatsApp',
                'Local Google Maps & Healthcare SEO Package',
                'Emergency Contact Floating Widget',
                'Patient Testimonials & Video Stories Showcase'
              ],
              icon: 'Laptop',
            },
            {
              label: '🛍️ D2C Ecommerce & Meta Ads Engine',
              title: 'D2C Ecommerce Store & Meta Ads Funnel',
              category: 'Marketing',
              slug: 'd2c-ecommerce-growth',
              short_description: 'Fast Shopify or Next.js store combined with high-ROAS Meta Ads & automated checkout recovery.',
              full_description: 'Turn cold traffic into repeat brand customers with high-converting product pages, abandoned cart WhatsApp bots, and targeted Meta ads.',
              price: '₹29,999',
              discount_price: '₹44,999',
              image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
              features: [
                'Custom Shopify or Next.js Storefront',
                'Razorpay & Cash on Delivery (COD) Integration',
                'Abandoned Cart WhatsApp Auto-Recovery Bot',
                'Meta Pixel & CAPI High-ROAS Ad Tracking',
                'Post-Purchase Upsells & Review Generation'
              ],
              icon: 'TrendingUp',
            },
            {
              label: '🤖 24/7 AI WhatsApp Support Agent',
              title: 'AI WhatsApp Support & CRM Agent',
              category: 'AI',
              slug: 'whatsapp-ai-agent',
              short_description: 'Intelligent 24/7 WhatsApp AI agent that answers inquiries, qualifies leads, and schedules discovery calls.',
              full_description: 'Never lose a lead outside business hours. Our AI WhatsApp agent answers questions naturally, collects customer details, and syncs directly to your CRM.',
              price: '₹19,999',
              discount_price: '₹29,999',
              image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
              features: [
                'Official WhatsApp Cloud API Verification',
                'Custom Trained on Your Business FAQs & Docs',
                'Instant Lead Qualification & Google Sheets Sync',
                'Automated Appointment Calendar Booking',
                'Live Human Handover Trigger'
              ],
              icon: 'Cpu',
            },
            {
              label: '📍 Google Maps Local 3-Pack Dominance',
              title: 'Local Google Maps #1 Ranking Engine',
              category: 'Marketing',
              slug: 'local-seo-dominance',
              short_description: 'Dominate Google Local 3-Pack search results for customers searching near you.',
              full_description: 'Guaranteed boost in local phone calls, direction requests, and organic inquiries from Google Maps and local search queries.',
              price: '₹14,999',
              discount_price: '₹22,999',
              image_url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=800&auto=format&fit=crop',
              features: [
                'Google Business Profile Full Audit & Optimization',
                '50+ High-Authority Local Geo Citations',
                'Automated 5-Star Review Generation Funnel',
                'Localized Geo-Tagged Landing Pages',
                'Monthly Google Call & Directions Analytics'
              ],
              icon: 'TrendingUp',
            }
          ].map((tmpl) => (
            <Button
              key={tmpl.slug}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingService({
                  title: tmpl.title,
                  category: tmpl.category,
                  slug: tmpl.slug,
                  short_description: tmpl.short_description,
                  full_description: tmpl.full_description,
                  price: tmpl.price,
                  discount_price: tmpl.discount_price,
                  image_url: tmpl.image_url,
                  features: tmpl.features,
                  icon: tmpl.icon,
                  status: 'published',
                  display_order: services.length + 1,
                  meta_title: `${tmpl.title} | XGRO`,
                  meta_description: tmpl.short_description,
                });
                setFeaturesList(tmpl.features);
                setIsDialogOpen(true);
                toast.info(`Loaded blueprint for "${tmpl.title}"!`);
              }}
              className="rounded-xl text-xs h-7 border-border hover:border-cyan/40 bg-card/70 font-semibold"
            >
              {tmpl.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Services Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className="rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/50 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div>
              {/* Card Top Image Banner */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden border-b border-border/60">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-900 via-cyan/20 to-slate-950 flex items-center justify-center">
                    {getCategoryIcon(service.icon)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan">
                    {service.category}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md ${
                      service.status === 'published'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/70'
                        : 'border-amber-500/40 text-amber-400 bg-amber-950/70'
                    }`}
                  >
                    {service.status}
                  </Badge>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-cyan/20 backdrop-blur-md border border-cyan/40 flex items-center justify-center shrink-0">
                    {getCategoryIcon(service.icon)}
                  </div>
                  <h3 className="font-extrabold text-base text-white leading-snug drop-shadow-sm truncate">
                    {service.title}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {service.short_description}
                </p>

                {/* Price tag */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-extrabold text-foreground">
                    {service.price || 'Custom Quote'}
                  </span>
                  {service.discount_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {service.discount_price}
                    </span>
                  )}
                </div>

                {/* Features Highlights */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Included Features ({service.features?.length || 0})
                  </p>
                  <ul className="space-y-1.5">
                    {(service.features || []).slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-foreground/90">
                        <Check className="h-3 w-3 text-cyan shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                    {(service.features?.length || 0) > 3 && (
                      <li className="text-[11px] text-cyan font-semibold pl-5">
                        + {(service.features?.length || 0) - 3} more items
                      </li>
                    )}
                  </ul>
                </div>

                {/* Slug & Order Meta */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Slug: <code className="text-foreground">/{service.slug}</code></span>
                  <span>Order: #{service.display_order}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleStatus(service)}
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {service.status === 'published' ? (
                    <span className="flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5" /> Draft
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <Eye className="h-3.5 w-3.5" /> Publish
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(service)}
                  className="h-8 rounded-full border-border text-xs px-3 font-semibold"
                >
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(service.id, service.title)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Service Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan" />
              {editingService?.id ? 'Edit Service' : 'Add New Service to CMS'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure public information, image banner, pricing, SEO titles, and deliverables.
            </DialogDescription>
          </DialogHeader>

          {editingService && (
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              {/* Service Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Service Name *</label>
                  <Input
                    placeholder="e.g. Website Development"
                    value={editingService.title || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      setEditingService({ ...editingService, title, slug });
                    }}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Slug (URL endpoint)</label>
                  <Input
                    placeholder="e.g. website-development"
                    value={editingService.slug || ''}
                    onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                    className="h-9 text-xs rounded-xl font-mono text-cyan"
                  />
                </div>
              </div>

              {/* Category & Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Category</label>
                  <Select
                    value={editingService.category || 'Web'}
                    onValueChange={(val) => setEditingService({ ...editingService, category: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web">Web Development</SelectItem>
                      <SelectItem value="Creative">Creative & Graphic Design</SelectItem>
                      <SelectItem value="Marketing">Marketing & SEO</SelectItem>
                      <SelectItem value="AI">AI & Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Icon</label>
                  <Select
                    value={editingService.icon || 'Laptop'}
                    onValueChange={(val) => setEditingService({ ...editingService, icon: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select Icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop (Web)</SelectItem>
                      <SelectItem value="Palette">Palette (Creative)</SelectItem>
                      <SelectItem value="TrendingUp">Trending Up (Marketing / SEO)</SelectItem>
                      <SelectItem value="Cpu">CPU (AI Automation)</SelectItem>
                      <SelectItem value="Sparkles">Sparkles (Branding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Card Image (Upload File or URL) */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-surface/70 border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-cyan" />
                    Service Card Image Banner (For Public Site & Cards)
                  </label>
                  {editingService.image_url && (
                    <button
                      type="button"
                      onClick={() => setEditingService({ ...editingService, image_url: '' })}
                      className="text-[11px] text-destructive hover:underline font-semibold"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Thumbnail Preview */}
                  <div className="relative h-28 rounded-xl overflow-hidden border border-border bg-slate-950 flex items-center justify-center sm:col-span-1 shadow-inner">
                    {editingService.image_url ? (
                      <img
                        src={editingService.image_url}
                        alt="Service Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] text-muted-foreground">No Image Selected</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button & URL Field */}
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-cyan/15 hover:bg-cyan hover:text-slate-950 text-cyan px-3 py-1.5 text-xs font-bold transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />
                      </label>
                      <span className="text-[11px] text-muted-foreground">or enter image link</span>
                    </div>

                    <div className="relative">
                      <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="https://images.unsplash.com/..."
                        value={editingService.image_url || ''}
                        onChange={(e) => setEditingService({ ...editingService, image_url: e.target.value })}
                        className="h-8 pl-8 text-xs rounded-xl"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">Presets:</span>
                      {[
                        { name: 'Web', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop' },
                        { name: 'Design', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop' },
                        { name: 'Content', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop' },
                        { name: 'SEO', url: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?q=80&w=800&auto=format&fit=crop' },
                        { name: 'AI Bot', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop' },
                        { name: 'Ads', url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=800&auto=format&fit=crop' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setEditingService({ ...editingService, image_url: preset.url })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border hover:border-cyan text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Short Description (Blurb) *</label>
                <Textarea
                  placeholder="One or two sentences explaining the core promise of this service..."
                  value={editingService.short_description || ''}
                  onChange={(e) => setEditingService({ ...editingService, short_description: e.target.value })}
                  rows={2}
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Pricing & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Starting Price</label>
                  <Input
                    placeholder="e.g. ₹14,999"
                    value={editingService.price || ''}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                    className="h-9 text-xs rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Original / Strikethrough</label>
                  <Input
                    placeholder="e.g. ₹24,999"
                    value={editingService.discount_price || ''}
                    onChange={(e) => setEditingService({ ...editingService, discount_price: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Display Order</label>
                  <Input
                    type="number"
                    value={editingService.display_order ?? 1}
                    onChange={(e) => setEditingService({ ...editingService, display_order: parseInt(e.target.value) || 1 })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Features List Builder */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Included Features / Deliverables</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {featuresList.length} items added
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a bullet point feature..."
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

                <div className="flex flex-wrap gap-1.5 mt-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-surface/50 border border-border">
                  {featuresList.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs bg-card border border-border px-2.5 py-1 rounded-full text-foreground"
                    >
                      <Check className="h-3 w-3 text-cyan" />
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="text-muted-foreground hover:text-destructive ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* SEO Meta Information */}
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-bold text-foreground">SEO & Metadata</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Meta Title</label>
                    <Input
                      placeholder="e.g. Website Development | XGRO"
                      value={editingService.meta_title || ''}
                      onChange={(e) => setEditingService({ ...editingService, meta_title: e.target.value })}
                      className="h-8 text-xs rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Status</label>
                    <Select
                      value={editingService.status || 'published'}
                      onValueChange={(val: ServiceStatus) => setEditingService({ ...editingService, status: val })}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-lg mt-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  Save Service
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
