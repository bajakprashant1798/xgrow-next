'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  User,
  Users,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Check,
  Circle,
  PlayCircle,
  Bell,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Download,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Zap,
  Trash2,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getActiveClient } from '@/lib/client-auth';
import {
  getProjects,
  getTeamMembers,
  getPricingPlans,
  saveClient,
  subscribeToDataChanges,
  getNotifications,
  syncClientDueDatesNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  clearAllClientNotifications,
} from '@/lib/db';
import {
  ProjectModel,
  ClientModel,
  TeamMemberModel,
  PricingPlanModel,
  InvoiceDocumentModel,
  NotificationModel,
} from '@/lib/supabase/types';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { ClientServicesWidget } from '@/components/clients/ClientServicesWidget';
import { getServicesForPlan } from '@/lib/client-services';

export default function ClientDashboardPage() {
  const [client, setClient] = useState<ClientModel | null>(null);
  const [clientProjects, setClientProjects] = useState<ProjectModel[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlanModel[]>([]);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoices Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDocumentModel | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Support message form
  const [supportMessage, setSupportMessage] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');

  const loadData = async () => {
    try {
      const currentClient = await getActiveClient();
      setClient(currentClient);

      const [allProjects, allTeam, allPlans] = await Promise.all([
        getProjects(),
        getTeamMembers(),
        getPricingPlans(),
      ]);

      if (currentClient) {
        const notifs = await getNotifications(currentClient.id, currentClient.email);
        setNotifications(notifs);

        // Strict client isolation: match by client_id OR matching email!
        const isolated = allProjects.filter(
          (p) =>
            p.client_id === currentClient.id ||
            (currentClient.email && p.client?.email?.toLowerCase() === currentClient.email.toLowerCase()) ||
            (currentClient.email && p.client_id?.toLowerCase() === currentClient.email.toLowerCase())
        );
        setClientProjects(isolated);
        if (isolated.length > 0) {
          setSelectedProject(isolated[0]);
        }
        if (currentClient.selected_plan) {
          setSelectedPlanName(currentClient.selected_plan);
        }
      }
      setTeam(allTeam);
      setPricingPlans(allPlans);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();

    const unsubscribe = subscribeToDataChanges(() => {
      if (isMounted) loadData();
    });
    const onFocus = () => {
      if (isMounted) loadData();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onFocus);
    };
  }, []);

  const handleSelectPlan = async (plan: PricingPlanModel) => {
    if (!client) return;
    try {
      const planServices = getServicesForPlan(plan.name);
      const updatedClient: ClientModel = {
        ...client,
        selected_plan: `${plan.name} Plan (${plan.price})`,
        services: planServices,
        subscription_tier: plan.name.toLowerCase().includes('scale')
          ? 'Premium Enterprise'
          : plan.name.toLowerCase().includes('growth')
          ? 'Growth'
          : 'Standard',
      };
      await saveClient(updatedClient);
      setClient(updatedClient);
      setSelectedPlanName(`${plan.name} Plan (${plan.price})`);
      toast.success(`Selected "${plan.name} Plan"! Our team has been notified for scope confirmation.`);
    } catch (err) {
      toast.error('Failed to update plan selection');
    }
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    toast.success('Your message has been dispatched to your dedicated Project Lead on WhatsApp and Email!');
    setSupportMessage('');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  if (loading && !client) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="p-8 rounded-3xl border border-border bg-card/60 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-5 w-48 rounded-full" />
          </div>
          <Skeleton className="h-9 w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>

        {/* Content Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold">Please log in to your Client Portal</h2>
        <Button asChild className="rounded-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  const fallbackProject: ProjectModel = {
    id: `proj-${client.id}`,
    client_id: client.id,
    project_name: client.selected_plan
      ? `${client.company_name} — ${client.selected_plan.split('(')[0].trim()}`
      : `${client.company_name} Digital Workspace`,
    service_name: client.selected_plan || 'Digital Marketing & Growth',
    status: 'development',
    progress_percentage: 25,
    start_date: client.created_at ? new Date(client.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Feb 2026',
    expected_completion_date: 'Active Retainer',
    project_value: 0,
    assigned_employee_ids: [],
    milestones: [
      { id: 'm1', project_id: `proj-${client.id}`, title: 'Strategy & Requirements Alignment', status: 'completed', order_index: 1 },
      { id: 'm2', project_id: `proj-${client.id}`, title: 'Active Deliverables Implementation', status: 'in_progress', order_index: 2 },
      { id: 'm3', project_id: `proj-${client.id}`, title: 'Quality Assurance & Delivery', status: 'pending', order_index: 3 },
    ],
    updates: [],
    invoices: [],
  };

  const isPendingApproval = client.status === 'pending_approval';
  const activeProj = selectedProject || clientProjects[0] || (client.status === 'active' ? fallbackProject : null);
  const completedMilestones = (activeProj?.milestones || []).filter((m) => m.status === 'completed').length;
  const totalMilestones = (activeProj?.milestones || []).length;

  // ==============================================================================
  // VIEW 1: PENDING APPROVAL / ONBOARDING WORKSPACE VIEW
  // ==============================================================================
  if (isPendingApproval || !activeProj) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-300">
        {/* Onboarding & Approval Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-surface to-card border border-cyan/30 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-400/40 text-amber-400 bg-amber-400/10">
                Account Status: Pending Review & Plan Activation
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome, {client.name}! ({client.company_name})
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your client account has been registered successfully. Our agency executive leadership is currently reviewing your project requirements and assigning your dedicated technical lead.
            </p>
          </div>

          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
        </div>

        {/* 3-Step Onboarding Status Tracker */}
        <Card className="rounded-3xl border-border bg-card/60 p-6 shadow-sm">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan" />
              Workspace Activation Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">1. Account Registered</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Profile initialized for {client.email}.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-foreground">2. Executive Review & Scope</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Admin verifying deliverables & team allocation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface/40 border border-border flex items-start gap-3 opacity-60">
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">3. Live Project Workspace</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live milestone gauge, invoice hub & team WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Selection & Service Customization */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan" />
                Choose or Confirm Your Growth Package
              </h2>
              <p className="text-xs text-muted-foreground">
                Select your preferred service tier so our team can immediately configure your milestone timeline.
              </p>
            </div>
            {selectedPlanName && (
              <Badge className="bg-cyan/15 text-cyan border border-cyan/30 text-xs font-bold self-start">
                Selected: {selectedPlanName}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const isCurrentSelection = selectedPlanName.includes(plan.name);

              return (
                <Card
                  key={plan.id}
                  className={`rounded-3xl border transition-all flex flex-col justify-between p-6 ${
                    isCurrentSelection
                      ? 'border-cyan bg-cyan/5 shadow-lg ring-1 ring-cyan'
                      : plan.highlighted
                      ? 'border-indigo-500/40 bg-card/80'
                      : 'border-border bg-card/60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                      {plan.highlighted && (
                        <Badge className="bg-cyan text-slate-950 text-[10px] font-black">
                          Popular
                        </Badge>
                      )}
                    </div>

                    <div>
                      <span className="text-2xl font-black text-foreground">{plan.price}</span>
                      {plan.discount_price && (
                        <span className="text-xs line-through text-muted-foreground ml-2">
                          {plan.discount_price}
                        </span>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">{plan.tag}</p>
                    </div>

                    <ul className="space-y-2 text-xs pt-2 border-t border-border">
                      {plan.features.slice(0, 5).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-cyan shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentSelection}
                      className={`w-full rounded-2xl text-xs font-bold h-10 ${
                        isCurrentSelection
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan text-slate-950 hover:bg-cyan/90 shadow-sm'
                      }`}
                    >
                      {isCurrentSelection ? '✓ Selected by You' : `Select ${plan.name} Plan`}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Direct Contact & Support Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-border bg-card/60 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan" />
              Direct Support & Discovery Consultation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need immediate assistance or want to expedite your workspace setup? Reach out to our executive agency leadership directly:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <a
                href="https://wa.me/916395319725?text=Hello%20XGRO%2C%20I%20have%20registered%20as%20a%20client%20and%20want%20to%20discuss%20my%20project%20workspace."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-foreground hover:bg-emerald-500/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-emerald-400">Chat on WhatsApp (Instant Response)</p>
                    <p className="text-[10px] text-muted-foreground">+91 63953 19725 (Project Lead)</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </a>

              <a
                href="mailto:info@xgro.in?subject=Client%20Portal%20Onboarding%20Inquiry"
                className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface/60 text-foreground hover:border-cyan/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-cyan" />
                  <div>
                    <p className="font-bold">Email Executive Desk</p>
                    <p className="text-[10px] text-muted-foreground font-mono">info@xgro.in</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </Card>

          {/* Send Instant Onboarding Note */}
          <Card className="rounded-3xl border-border bg-card/60 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-cyan" />
              Leave a Note for Your Project Manager
            </h3>
            <form onSubmit={handleSendSupport} className="space-y-3">
              <Textarea
                placeholder="Describe any urgent deadline, specific feature requirement, or preferred time for a Google Meet / Zoom call..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={3}
                className="text-xs rounded-2xl resize-none"
              />
              <Button type="submit" className="w-full rounded-2xl bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs h-9">
                <Send className="h-3.5 w-3.5 mr-1.5" /> Send Priority Note to Admin
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // VIEW 2: ACTIVE CLIENT LIVE PROJECT WORKSPACE (ACTIVE & APPROVED)
  // ==============================================================================
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. Welcome Greeting Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-card via-surface to-card border border-border relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-cyan animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan">
              Client Portal · {client.company_name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Welcome back, {client.name}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Here is the live status of your active agency deliverables, completed milestones, and upcoming deployments.
          </p>
        </div>

        {/* Project Switcher if client has multiple projects */}
        {clientProjects.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2 relative z-10">
            {clientProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeProj?.id === p.id
                    ? 'bg-cyan text-slate-950 shadow-md'
                    : 'bg-card border border-border text-foreground hover:bg-surface'
                }`}
              >
                {p.project_name} ({p.progress_percentage}%)
              </button>
            ))}
          </div>
        )}

        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
      </div>

      <div className="space-y-8">
        {/* 1.5 Live Project Alerts & Due Date Notifications Stream */}
        {notifications.length > 0 && (
          <div className="rounded-3xl border border-cyan/30 bg-gradient-to-br from-card via-surface/80 to-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-cyan/15 text-cyan flex items-center justify-center border border-cyan/30 shrink-0">
                  <Bell className="h-4 w-4 text-cyan" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                      Live Project Alerts & Deadline Notifications
                    </h3>
                    {notifications.some((n) => !n.is_read) && (
                      <span className="bg-cyan text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                        {notifications.filter((n) => !n.is_read).length} New
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Instant updates for individual service finish dates, milestones & administrative changes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notifications.some((n) => !n.is_read) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (client) {
                        await markAllNotificationsAsRead(client.id, client.email);
                        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                        toast.success('All project alerts marked as read');
                      }
                    }}
                    className="rounded-full text-xs font-bold h-8 border-border bg-surface/60 hover:bg-surface text-cyan"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Mark All Read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (client) {
                        await clearAllClientNotifications(client.id, client.email);
                        setNotifications([]);
                        toast.success('Cleared notifications');
                      }
                    }}
                    className="rounded-full text-xs text-muted-foreground hover:text-destructive h-8 px-3"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {notifications.slice(0, 6).map((notif) => {
                const isDueDate =
                  notif.type === 'due_date' ||
                  notif.title.toLowerCase().includes('due') ||
                  notif.title.toLowerCase().includes('delivery') ||
                  notif.title.toLowerCase().includes('completion') ||
                  notif.title.toLowerCase().includes('target');
                const isInvoice =
                  notif.type === 'invoice' ||
                  notif.title.toLowerCase().includes('invoice') ||
                  notif.title.toLowerCase().includes('quotation');
                const isTimeline =
                  notif.type === 'service_timeline' ||
                  notif.title.toLowerCase().includes('timeline') ||
                  notif.title.toLowerCase().includes('scope');

                return (
                  <div
                    key={notif.id}
                    onClick={async () => {
                      if (!notif.is_read) {
                        await markNotificationAsRead(notif.id);
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                        );
                      }
                      if (notif.link) {
                        if (notif.link.includes('#')) {
                          scrollToSection(notif.link.split('#')[1]);
                        }
                      }
                    }}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                      !notif.is_read
                        ? isDueDate
                          ? 'border-amber-400/50 bg-amber-400/5 hover:bg-amber-400/10 shadow-sm'
                          : isInvoice
                          ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 shadow-sm'
                          : 'border-cyan/50 bg-cyan/5 hover:bg-cyan/10 shadow-sm'
                        : 'border-border bg-card/60 hover:bg-surface/60 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {isDueDate ? (
                            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          ) : isInvoice ? (
                            <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : isTimeline ? (
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <FolderKanban className="h-3.5 w-3.5 text-cyan shrink-0" />
                          )}
                          <span
                            className={`text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                              isDueDate
                                ? 'text-amber-400'
                                : isInvoice
                                ? 'text-emerald-400'
                                : isTimeline
                                ? 'text-indigo-400'
                                : 'text-cyan'
                            }`}
                          >
                            {isDueDate
                              ? 'Timeline Alert'
                              : isInvoice
                              ? 'Billing Update'
                              : isTimeline
                              ? 'Scope Update'
                              : 'Project Feed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-cyan animate-pulse shrink-0" />
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteNotification(notif.id);
                              setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                              toast.success('Notification removed');
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-foreground leading-snug group-hover:text-cyan transition-colors pr-2">
                        {notif.title}
                      </h4>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                      {notif.link ? (
                        <span className="text-cyan font-bold flex items-center gap-1">
                          <span>Open Details</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Client Workspace</span>
                      )}
                      {!notif.is_read && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markNotificationAsRead(notif.id);
                            setNotifications((prev) =>
                              prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                            );
                          }}
                          className="text-muted-foreground hover:text-cyan font-medium hover:underline text-[10px]"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Main Live Progress Gauge Card */}
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan bg-cyan/10 border border-cyan/30 px-2.5 py-0.5 rounded-full">
                    {activeProj.service_name}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-cyan" /> Started: <strong className="text-foreground">{activeProj.start_date || 'Feb 2026'}</strong>
                  </span>
                  {activeProj.expected_completion_date && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full shadow-sm">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" /> Target Delivery: <strong className="text-emerald-300 font-bold">{activeProj.expected_completion_date}</strong>
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                  {activeProj.project_name}
                </h2>
                <div className="flex items-start sm:items-center gap-1.5 mt-2 text-xs text-muted-foreground leading-relaxed">
                  <User className="h-3.5 w-3.5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
                  <span className="break-words">
                    Project Manager:{' '}
                    <strong className="text-foreground">
                      {activeProj.assigned_manager?.name ||
                        team.find((t) => t.id === activeProj.assigned_manager_id)?.name ||
                        'Prashant Bajak (Lead Project Manager)'}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t border-border/40 sm:border-0">
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1.5 sm:justify-end">
                    <span className="text-3xl sm:text-4xl font-black text-cyan">
                      {activeProj.progress_percentage}%
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">Complete</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-widest">
                    Current Stage: <span className="text-foreground uppercase font-black">{activeProj.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-full border-cyan/40 text-cyan bg-cyan/10 shrink-0"
                >
                  ● {activeProj.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Progress Visual Bar */}
            <div className="space-y-3 pt-2">
              {/* Progress Track */}
              <div className="w-full bg-surface/80 rounded-full h-3 sm:h-3.5 overflow-hidden p-0.5 border border-border shadow-inner">
                <div
                  className="bg-gradient-to-r from-cyan via-indigo-500 to-cyan h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(4, activeProj.progress_percentage)}%` }}
                />
              </div>

              {/* Desktop Timeline Stage Labels (>= 640px) */}
              <div className="hidden sm:flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span className={activeProj.progress_percentage >= 0 ? 'text-cyan font-bold' : ''}>0% Kickoff</span>
                <span className={activeProj.progress_percentage >= 20 ? 'text-cyan font-bold' : ''}>Requirements</span>
                <span className={activeProj.progress_percentage >= 40 ? 'text-cyan font-bold' : ''}>UI Design</span>
                <span className={activeProj.progress_percentage >= 65 ? 'text-cyan font-bold' : ''}>Development</span>
                <span className={activeProj.progress_percentage >= 85 ? 'text-cyan font-bold' : ''}>Testing</span>
                <span className={activeProj.progress_percentage >= 100 ? 'text-cyan font-bold' : ''}>
                  100% {activeProj.expected_completion_date ? `Delivery (${activeProj.expected_completion_date})` : 'Live Delivery'}
                </span>
              </div>

              {/* Mobile Responsive Step Badges (< 640px) */}
              <div className="sm:hidden space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground px-0.5">
                  <span>0% Start</span>
                  <span className="text-cyan font-bold font-sans text-xs">
                    Stage: {activeProj.status.replace('_', ' ').toUpperCase()} ({activeProj.progress_percentage}%)
                  </span>
                  <span className={activeProj.expected_completion_date ? 'text-emerald-400 font-bold' : ''}>
                    {activeProj.expected_completion_date ? `Due: ${activeProj.expected_completion_date}` : '100% Live'}
                  </span>
                </div>

                {/* 3x2 Grid of Clean Stage Chips for Mobile */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { name: 'Kickoff', min: 0 },
                    { name: 'Design', min: 30 },
                    { name: 'Develop', min: 55 },
                    { name: 'Testing', min: 80 },
                    { name: 'Deploy', min: 95 },
                    { name: 'Live', min: 100 },
                  ].map((step, sIdx) => {
                    const isPassed = activeProj.progress_percentage >= step.min;
                    const isCurrent =
                      activeProj.progress_percentage >= step.min &&
                      (sIdx === 5 || activeProj.progress_percentage < [0, 30, 55, 80, 95, 100][sIdx + 1]);

                    return (
                      <div
                        key={step.name}
                        className={`px-2 py-1.5 rounded-xl text-center text-[10px] font-bold border transition-colors ${
                          isCurrent
                            ? 'bg-cyan/15 border-cyan/50 text-cyan shadow-sm'
                            : isPassed
                            ? 'bg-surface/90 border-emerald-500/30 text-emerald-400'
                            : 'bg-surface/40 border-border/60 text-muted-foreground/60'
                        }`}
                      >
                        <span className="block leading-none">{step.name}</span>
                        <span className="text-[8.5px] opacity-75 font-mono mt-0.5 block">
                          {isPassed && !isCurrent ? '✓ done' : isCurrent ? 'active' : `${step.min}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Subscribed Services & Retainer Deliverables */}
        <ClientServicesWidget
          client={client}
          onUpdateClient={(upd) => setClient(upd)}
          isClientView={true}
        />

        {/* 4. Milestones Checklist Timeline */}
        <section id="milestones" className="scroll-mt-24 sm:scroll-mt-28 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start sm:items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                  Deliverable Milestones ({completedMilestones}/{totalMilestones} Completed)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track each verified phase of your digital solution.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeProj.milestones || []).map((milestone, idx) => {
              const isCompleted = milestone.status === 'completed';
              const isInProgress = milestone.status === 'in_progress';

              return (
                <Card
                  key={milestone.id}
                  className={`rounded-3xl border transition-all p-5 flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isInProgress
                      ? 'border-cyan/60 bg-cyan/5 shadow-md ring-1 ring-cyan/40'
                      : 'border-border bg-card/60 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                        Phase {idx + 1}
                      </span>
                      {isCompleted ? (
                        <Badge className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                          ✓ Completed
                        </Badge>
                      ) : isInProgress ? (
                        <Badge className="bg-cyan text-slate-950 text-[9px] font-black uppercase">
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {milestone.description || 'Milestone deliverable specification.'}
                      </p>
                    </div>
                  </div>

                  {milestone.due_date && (
                    <div className="pt-3 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1.5 mt-4">
                      <Calendar className="h-3 w-3 text-cyan" />
                      <span>Target: {milestone.due_date}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* 5. Live Updates Feed (Full Width Dedicated Section) */}
        <section id="updates" className="scroll-mt-24 sm:scroll-mt-28 space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <MessageSquare className="h-5 w-5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                  Live Project Updates & Feed
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time milestone progress logs, sprint notes, and manager announcements.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(activeProj.updates || []).length === 0 ? (
              <Card className="rounded-3xl border-border bg-card/60 p-8 text-center text-xs text-muted-foreground">
                No public updates published yet. Your project lead will log milestone progress here.
              </Card>
            ) : (
              activeProj.updates?.map((upd) => (
                <Card key={upd.id} className="rounded-3xl border-border bg-card/60 p-6 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-cyan/15 text-cyan font-black text-xs flex items-center justify-center border border-cyan/30 shrink-0 mt-0.5">
                        {upd.author_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-foreground leading-snug break-words">{upd.author_name}</p>
                        <p className="text-[10px] text-cyan capitalize mt-0.5">{upd.author_role || 'Project Lead'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap mt-0.5">
                      {upd.created_at ? new Date(upd.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">{upd.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {upd.message}
                    </p>
                  </div>

                  {typeof upd.progress_percent === 'number' && (
                    <div className="pt-2 border-t border-border flex items-center gap-2 text-[11px] text-cyan font-bold">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      <span>Progress milestone updated to {upd.progress_percent}%</span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>

        {/* 6. Combined Billing & Support Hub (Full-Width Sequential Layout) */}
        <section id="billing" className="scroll-mt-24 sm:scroll-mt-28 space-y-8 pb-10">
          {/* Part A: Invoices & Quotations */}
          <div id="invoices" className="scroll-mt-24 sm:scroll-mt-28 space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                    Invoices & Quotations
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official GST billing documents, project quotes, and verified payment receipts.
                  </p>
                </div>
              </div>
              {(activeProj.invoices || []).length > 0 && (
                <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan shrink-0 whitespace-nowrap">
                  {activeProj.invoices?.length} {activeProj.invoices?.length === 1 ? 'Document' : 'Documents'}
                </Badge>
              )}
            </div>

            {(activeProj.invoices || []).length === 0 ? (
              <Card className="rounded-3xl border-border bg-card/60 p-8 text-center text-xs text-muted-foreground">
                No billing documents issued for this project yet.
              </Card>
            ) : (
              <div className="space-y-3.5">
                {activeProj.invoices?.map((inv) => (
                  <Card
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="group rounded-3xl border-border bg-card/60 hover:bg-card/90 p-5 sm:p-6 transition-all cursor-pointer shadow-sm hover:border-cyan/40 hover:shadow-cyan/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Icon, Title, Ref, Dates */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-11 w-11 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center group-hover:bg-cyan group-hover:text-slate-950 transition-colors shrink-0 mt-0.5 sm:mt-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-foreground group-hover:text-cyan transition-colors leading-snug break-words">
                              {inv.title}
                            </span>
                            <Badge
                              className={`text-[9px] uppercase font-black shrink-0 whitespace-nowrap ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : inv.status === 'overdue'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-amber-400 text-slate-950'
                              }`}
                            >
                              ● {inv.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                            <span className="font-mono text-[11px] text-cyan">
                              #{inv.reference_number || inv.id}
                            </span>
                            {inv.issue_date && (
                              <>
                                <span>•</span>
                                <span className="text-[11px]">
                                  Issued: <strong className="text-foreground">{inv.issue_date}</strong>
                                </span>
                              </>
                            )}
                            {inv.due_date && (
                              <>
                                <span>•</span>
                                <span className="text-[11px]">
                                  Due: <strong className="text-foreground">{inv.due_date}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & PDF Modal Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t border-border/50 sm:border-t-0 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                            Invoice Total
                          </span>
                          <span className="font-mono font-black text-foreground text-base sm:text-lg">
                            ₹{Number(inv.amount).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 px-4 text-xs font-bold rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                            setIsInvoiceModalOpen(true);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>View PDF</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Part B: Assigned Team Contacts & Direct Support (Full-Width below Invoices) */}
          <div id="support" className="scroll-mt-24 sm:scroll-mt-28 space-y-4 pt-2">
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <Users className="h-5 w-5 text-cyan shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
                    Assigned Project Team & Support
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Direct communication channels with your designated project leaders and technical leads.
                  </p>
                </div>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Direct Priority Line
              </span>
            </div>

            {(() => {
              const manager =
                activeProj.assigned_manager ||
                team.find((t) => t.id === activeProj.assigned_manager_id) || {
                  name: 'Prashant Bajak',
                  role: 'Super Admin & Project Director',
                  phone: '+91 63953 19725',
                  email: 'info@xgro.in',
                };
              const initials = manager.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card className="rounded-3xl border-border bg-gradient-to-br from-card via-surface/60 to-card p-6 sm:p-7 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Manager Profile Info */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-cyan to-indigo-600 p-0.5 shadow-md">
                          <div className="h-full w-full rounded-2xl bg-card flex items-center justify-center font-black text-base sm:text-lg text-cyan">
                            {initials}
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" title="Online & Active" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
                            {manager.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-bold border-cyan/40 text-cyan bg-cyan/10">
                            {manager.role?.replace('_', ' ') || 'Lead Project Manager'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Dedicated Point of Contact for <strong className="text-foreground">{activeProj.project_name}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan" /> 9:30 AM – 7:30 PM IST
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-sans font-semibold">
                            Avg. response: ~15 mins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t border-border/60 lg:border-t-0">
                      <a
                        href={`https://wa.me/916395319725?text=${encodeURIComponent(
                          `Hello ${manager.name}, regarding project: ${activeProj.project_name}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Chat on WhatsApp</span>
                      </a>
                      <a
                        href="mailto:info@xgro.in"
                        className="px-5 py-2.5 rounded-2xl bg-surface hover:bg-surface/80 border border-border text-xs font-bold hover:border-cyan/40 text-foreground transition-all flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4 text-cyan" />
                        <span>Send Email</span>
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        </section>
      </div>

      {/* Invoice Viewer & PDF Modal */}
      <InvoiceViewModal
        invoice={selectedInvoice}
        client={client}
        project={activeProj}
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        isAdminView={false}
      />
    </div>
  );
}
