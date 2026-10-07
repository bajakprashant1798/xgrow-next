'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Zap,
  Check,
  Loader2,
  Briefcase,
  X,
  Power,
  KeyRound,
  Eye,
  EyeOff,
  Dices,
  Lock,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getClients,
  saveClient,
  deleteClient,
  approveClient,
  saveTeamMember,
  getProjects,
  saveProject,
  getRoles,
  checkUserEmailExists,
  assignProjectsToClient,
  updateUserRoleAndProfile,
  subscribeToDataChanges,
  saveUserCredential,
  generateSecurePassword,
  resetUserPassword,
  EmailCheckResult,
} from '@/lib/db';
import { ClientModel, ProjectModel, CustomRoleModel, ProjectStatus, ClientServiceSchedule } from '@/lib/supabase/types';
import {
  AVAILABLE_AGENCY_SERVICES,
  BILLING_CYCLES,
  PLAN_SERVICE_PRESETS,
  getServiceDefinition,
  getBillingCycleDefinition,
  getServicesForPlan,
  getDefaultDueDateForService,
  formatTimelineDate,
  calculateTimelineStatus,
  SERVICE_TIMELINE_CONFIG,
} from '@/lib/client-services';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { OneTimeCredentialsModal } from '@/components/admin/OneTimeCredentialsModal';

interface OnboardUserData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_name?: string;
  department?: string;
  address?: string;
  status: 'active' | 'pending_approval' | 'inactive';
  selected_plan?: string;
  services: string[];
  service_schedules?: Record<string, ClientServiceSchedule>;
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'quarterly';
  subscription_tier: 'Standard' | 'Growth' | 'Premium Enterprise';
  retainer_amount?: number;
  notes?: string;
  assignedProjectIds: string[];
  autoCreateProject?: boolean;
  initialProjectTitle?: string;
}

export default function ClientsManagementPage() {
  const { user, isAdmin, hasPermission } = useAuth();

  // RBAC Gating permissions
  const canView = isAdmin || hasPermission('clients', 'view');
  const canCreateEdit = isAdmin || hasPermission('clients', 'create_edit');
  const canDelete = isAdmin || hasPermission('clients', 'delete');

  const [clients, setClients] = useState<ClientModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Unified Onboard User/Client Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userData, setUserData] = useState<OnboardUserData>(() => {
    const initialSchedules: Record<string, ClientServiceSchedule> = {
      website: {
        service_id: 'website',
        due_date: getDefaultDueDateForService('website'),
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
      },
      seo: {
        service_id: 'seo',
        due_date: getDefaultDueDateForService('seo'),
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
      },
    };
    return {
      name: '',
      email: '',
      phone: '',
      role: 'client',
      company_name: '',
      department: 'Engineering',
      address: '',
      status: 'active',
      selected_plan: 'Scale Growth Plan (₹39,999/mo)',
      services: ['website', 'seo'],
      service_schedules: initialSchedules,
      billing_cycle: 'monthly',
      subscription_tier: 'Growth',
      retainer_amount: 39999,
      notes: '',
      assignedProjectIds: [],
      autoCreateProject: true,
      initialProjectTitle: '',
    };
  });

  // Debounced Email Check state for dialog
  const [originalEmail, setOriginalEmail] = useState('');
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);

  // Dedicated Service Timelines & Due Dates Modal state (for quick 1-click edit from client cards)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [activeClientForTimeline, setActiveClientForTimeline] = useState<ClientModel | null>(null);
  const [tempSchedules, setTempSchedules] = useState<Record<string, ClientServiceSchedule>>({});

  // One-Time Credentials Modal state
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{
    name: string;
    email: string;
    password: string;
    roleDisplayName: string;
    loginUrl: string;
  } | null>(null);

  // Reset Password Dialog state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetTargetClient, setResetTargetClient] = useState<ClientModel | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Assign Projects to existing client modal state
  const [isAssignProjectDialogOpen, setIsAssignProjectDialogOpen] = useState(false);
  const [activeClientForAssign, setActiveClientForAssign] = useState<ClientModel | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearchFilter, setProjectSearchFilter] = useState('');
  const [showQuickCreateProject, setShowQuickCreateProject] = useState(false);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [quickServiceName, setQuickServiceName] = useState('Website Development & Growth Engine');
  const [quickProjectValue, setQuickProjectValue] = useState(39999);

  const loadData = async () => {
    try {
      const [c, p, r] = await Promise.all([getClients(), getProjects(), getRoles()]);
      setClients(c);
      setProjects(p);
      setRoles(r);
    } catch (e) {
      console.warn('Error loading clients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Debounce email availability check whenever email input changes in Onboarding Dialog
  useEffect(() => {
    const email = userData.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setEmailCheckStatus('idle');
      setEmailCheckResult(null);
      return;
    }

    // If editing existing user and email is unchanged from original, it's valid & available
    if (originalEmail && email === originalEmail.trim().toLowerCase()) {
      setEmailCheckStatus('idle');
      setEmailCheckResult(null);
      return;
    }

    setEmailCheckStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await checkUserEmailExists(email, userData.id, originalEmail);
        if (result.exists) {
          setEmailCheckStatus('duplicate');
          setEmailCheckResult(result);
        } else {
          setEmailCheckStatus('available');
          setEmailCheckResult(null);
        }
      } catch (e) {
        setEmailCheckStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userData.email, userData.id, originalEmail]);

  const handleApplyPlanPreset = (presetKey: string) => {
    const preset = PLAN_SERVICE_PRESETS[presetKey];
    if (!preset) return;

    const nextSchedules: Record<string, ClientServiceSchedule> = { ...(userData.service_schedules || {}) };
    preset.services.forEach((sId) => {
      if (!nextSchedules[sId]) {
        nextSchedules[sId] = {
          service_id: sId,
          due_date: getDefaultDueDateForService(sId),
          status: 'in_progress',
          start_date: new Date().toISOString().split('T')[0],
        };
      }
    });

    setUserData((prev) => ({
      ...prev,
      selected_plan: preset.name,
      services: [...preset.services],
      service_schedules: nextSchedules,
      billing_cycle: preset.billing_cycle,
      subscription_tier: preset.tier,
      retainer_amount: preset.defaultAmount,
    }));
    toast.success(`Applied "${preset.name.split('(')[0].trim()}" package! Configured ${preset.services.length} services with individual delivery timelines.`);
  };

  const toggleService = (serviceId: string) => {
    setUserData((prev) => {
      const exists = prev.services.includes(serviceId);
      const nextServices = exists
        ? prev.services.filter((id) => id !== serviceId)
        : [...prev.services, serviceId];

      const nextSchedules: Record<string, ClientServiceSchedule> = { ...(prev.service_schedules || {}) };
      if (!exists && !nextSchedules[serviceId]) {
        nextSchedules[serviceId] = {
          service_id: serviceId,
          due_date: getDefaultDueDateForService(serviceId),
          status: 'in_progress',
          start_date: new Date().toISOString().split('T')[0],
        };
      }

      return { ...prev, services: nextServices, service_schedules: nextSchedules };
    });
  };

  const updateServiceSchedule = (
    serviceId: string,
    updates: Partial<ClientServiceSchedule>
  ) => {
    setUserData((prev) => {
      const current = prev.service_schedules?.[serviceId] || {
        service_id: serviceId,
        due_date: getDefaultDueDateForService(serviceId),
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        service_schedules: {
          ...(prev.service_schedules || {}),
          [serviceId]: { ...current, ...updates },
        },
      };
    });
  };

  const addDaysToServiceDueDate = (serviceId: string, daysToAdd: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const dateStr = targetDate.toISOString().split('T')[0];
    updateServiceSchedule(serviceId, { due_date: dateStr });
    toast.info(`Set due date for ${getServiceDefinition(serviceId).shortName} to ${formatTimelineDate(dateStr)} (+${daysToAdd} days)`);
  };

  const openCreateDialog = () => {
    const defaultPreset = PLAN_SERVICE_PRESETS.growth;
    const initialSchedules: Record<string, ClientServiceSchedule> = {};
    defaultPreset.services.forEach((sId) => {
      initialSchedules[sId] = {
        service_id: sId,
        due_date: getDefaultDueDateForService(sId),
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
      };
    });

    setOriginalEmail('');
    setUserData({
      name: '',
      email: '',
      phone: '',
      role: 'client',
      company_name: '',
      department: 'Engineering',
      address: '',
      status: 'active',
      selected_plan: defaultPreset.name,
      services: [...defaultPreset.services],
      service_schedules: initialSchedules,
      billing_cycle: defaultPreset.billing_cycle,
      subscription_tier: defaultPreset.tier,
      retainer_amount: defaultPreset.defaultAmount,
      notes: '',
      assignedProjectIds: [],
      autoCreateProject: true,
      initialProjectTitle: '',
    });
    setEmailCheckStatus('idle');
    setEmailCheckResult(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: ClientModel) => {
    const cleanEmail = client.email.trim().toLowerCase();
    setOriginalEmail(client.email);
    const clientProjects = projects
      .filter(
        (p) =>
          p.client_id === client.id ||
          (cleanEmail &&
            (p.client?.email?.toLowerCase() === cleanEmail ||
              p.client_id?.toLowerCase() === cleanEmail))
      )
      .map((p) => p.id);

    const effectivePlan = client.selected_plan || 'Growth Engine Retainer (₹39,999/mo)';
    const effectiveServices =
      client.services && client.services.length > 0
        ? client.services
        : getServicesForPlan(effectivePlan);

    const existingSchedules: Record<string, ClientServiceSchedule> = { ...(client.service_schedules || {}) };
    effectiveServices.forEach((sId) => {
      if (!existingSchedules[sId]) {
        existingSchedules[sId] = {
          service_id: sId,
          due_date: getDefaultDueDateForService(sId, client.created_at ? new Date(client.created_at) : new Date()),
          status: client.status === 'active' ? 'in_progress' : 'pending',
          start_date: client.created_at ? client.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        };
      }
    });

    setUserData({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      role: 'client',
      company_name: client.company_name || '',
      department: 'Engineering',
      address: client.address || '',
      status: client.status || 'active',
      selected_plan: effectivePlan,
      services: [...effectiveServices],
      service_schedules: existingSchedules,
      billing_cycle: client.billing_cycle || 'monthly',
      subscription_tier: client.subscription_tier || 'Growth',
      retainer_amount: client.retainer_amount !== undefined ? client.retainer_amount : 39999,
      notes: client.notes || '',
      assignedProjectIds: clientProjects,
      autoCreateProject: false,
    });
    setEmailCheckStatus('idle');
    setEmailCheckResult(null);
    setIsDialogOpen(true);
  };

  const openServiceTimelineModal = (client: ClientModel) => {
    setActiveClientForTimeline(client);
    const effectiveServices =
      client.services && client.services.length > 0
        ? client.services
        : getServicesForPlan(client.selected_plan);

    const schedules: Record<string, ClientServiceSchedule> = { ...(client.service_schedules || {}) };
    effectiveServices.forEach((sId) => {
      if (!schedules[sId]) {
        schedules[sId] = {
          service_id: sId,
          due_date: getDefaultDueDateForService(sId, client.created_at ? new Date(client.created_at) : new Date()),
          status: client.status === 'active' ? 'in_progress' : 'pending',
          start_date: client.created_at ? client.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        };
      }
    });

    setTempSchedules(schedules);
    setIsTimelineModalOpen(true);
  };

  const updateTempSchedule = (serviceId: string, updates: Partial<ClientServiceSchedule>) => {
    setTempSchedules((prev) => {
      const current = prev[serviceId] || {
        service_id: serviceId,
        due_date: getDefaultDueDateForService(serviceId),
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        [serviceId]: { ...current, ...updates },
      };
    });
  };

  const addDaysToTempDueDate = (serviceId: string, daysToAdd: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const dateStr = targetDate.toISOString().split('T')[0];
    updateTempSchedule(serviceId, { due_date: dateStr });
    toast.info(`Set due date for ${getServiceDefinition(serviceId).shortName} to ${formatTimelineDate(dateStr)} (+${daysToAdd} days)`);
  };

  const handleSaveTimelineModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientForTimeline) return;

    try {
      const updatedClient: ClientModel = {
        ...activeClientForTimeline,
        service_schedules: tempSchedules,
      };

      await saveClient(updatedClient);
      toast.success(`Service due dates & timelines updated for ${activeClientForTimeline.name}!`);
      setIsTimelineModalOpen(false);
      setActiveClientForTimeline(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update service timelines');
    }
  };

  const openAssignProjectsModal = (client: ClientModel) => {
    setActiveClientForAssign(client);
    const cleanEmail = client.email.trim().toLowerCase();
    const linkedProjectIds = projects
      .filter(
        (p) =>
          p.client_id === client.id ||
          (cleanEmail &&
            (p.client?.email?.toLowerCase() === cleanEmail ||
              p.client_id?.toLowerCase() === cleanEmail))
      )
      .map((p) => p.id);
    setSelectedProjectIds(linkedProjectIds);
    setProjectSearchFilter('');
    setShowQuickCreateProject(false);
    setQuickProjectName(`${client.company_name || client.name} — Web Platform`);
    setIsAssignProjectDialogOpen(true);
  };

  const openResetPasswordModal = (client: ClientModel) => {
    setResetTargetClient(client);
    const pass = generateSecurePassword(12);
    setNewResetPassword(pass);
    setShowResetPassword(false);
    setIsResetPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetClient) return;
    if (!newResetPassword.trim() || newResetPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await resetUserPassword(resetTargetClient.email, newResetPassword.trim());
      setIsResetPasswordModalOpen(false);
      loadData();

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
      setCredentialsData({
        name: resetTargetClient.name,
        email: resetTargetClient.email,
        password: res.password,
        roleDisplayName: 'Client (Portal Workspace)',
        loginUrl: `${origin}/login`,
      });
      setIsCredentialsModalOpen(true);
      toast.success(`Password reset successfully for ${resetTargetClient.name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.name.trim() || !userData.email.trim()) {
      toast.error('Full Name and Email address are required');
      return;
    }

    if (emailCheckStatus === 'duplicate' && emailCheckResult?.exists) {
      toast.error(`Email "${userData.email}" is already registered (${emailCheckResult.name} as ${emailCheckResult.role}). Please use a unique email.`);
      return;
    }

    try {
      if (userData.role === 'client') {
        const saved = await saveClient({
          id: userData.id,
          name: userData.name.trim(),
          email: userData.email.trim().toLowerCase(),
          phone: userData.phone || '',
          company_name: userData.company_name?.trim() || `${userData.name.trim()}'s Business`,
          address: userData.address || '',
          status: userData.status,
          selected_plan: userData.selected_plan,
          services: userData.services,
          service_schedules: userData.service_schedules,
          billing_cycle: userData.billing_cycle,
          subscription_tier: userData.subscription_tier,
          retainer_amount: userData.retainer_amount,
          notes: userData.notes,
        });

        // If projects were selected, assign them cleanly
        if (userData.assignedProjectIds.length > 0) {
          await assignProjectsToClient(saved.id, userData.assignedProjectIds, saved.email);
        }

        // If new client & auto-create workspace toggle is checked and no project was linked
        if (!userData.id && userData.autoCreateProject && userData.assignedProjectIds.length === 0) {
          const autoProj: ProjectModel = {
            id: `proj-${Date.now()}`,
            client_id: saved.id,
            project_name: userData.initialProjectTitle?.trim() || `${saved.company_name || saved.name} — Digital Growth Platform`,
            service_name: saved.selected_plan ? saved.selected_plan.split('(')[0].trim() : 'Website Development',
            start_date: new Date().toISOString().split('T')[0],
            project_value: 39999,
            status: 'requirement',
            progress_percentage: 15,
            assigned_employee_ids: [],
            description: `Workspace initialized for ${saved.company_name || saved.name}.`,
            milestones: [
              { id: `ms-${Date.now()}-1`, project_id: '', title: 'Discovery & Requirements Setup', status: 'completed', order_index: 1 },
              { id: `ms-${Date.now()}-2`, project_id: '', title: 'UI/UX Design & Figma Mockups', status: 'in_progress', order_index: 2 },
              { id: `ms-${Date.now()}-3`, project_id: '', title: 'Development & Core Integrations', status: 'pending', order_index: 3 },
              { id: `ms-${Date.now()}-4`, project_id: '', title: 'Quality Assurance & Launch', status: 'pending', order_index: 4 },
            ],
            tasks: [],
            updates: [
              {
                id: `upd-${Date.now()}`,
                project_id: '',
                author_name: 'Super Admin',
                author_role: 'Admin',
                title: 'Client Workspace Initialized',
                message: `Client account created and project workspace setup initiated for ${saved.company_name}.`,
                progress_percent: 15,
                is_visible_to_client: true,
                created_at: new Date().toISOString(),
              },
            ],
            invoices: [],
            created_at: new Date().toISOString(),
          };
          await saveProject(autoProj as any);
        }

        if (!userData.id) {
          const generatedPass = generateSecurePassword(12);
          await saveUserCredential(saved.email, generatedPass, true, {
            name: saved.name,
            role: 'client',
            phone: saved.phone,
            company_name: saved.company_name,
            address: saved.address,
            selected_plan: saved.selected_plan,
            status: saved.status,
          });

          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
          setCredentialsData({
            name: saved.name,
            email: saved.email,
            password: generatedPass,
            roleDisplayName: 'Client (Portal Workspace)',
            loginUrl: `${origin}/login`,
          });
          setIsCredentialsModalOpen(true);
        }

        toast.success(userData.id ? 'Client account updated successfully!' : 'New client account created successfully!');
      } else {
        if (userData.id) {
          await updateUserRoleAndProfile({
            id: userData.id,
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
            phone: userData.phone || '',
            newRole: userData.role,
            department: userData.department || 'Engineering',
            status: 'active',
          });
        } else {
          // Staff / Admin Member creation
          await saveTeamMember({
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
            phone: userData.phone || '',
            role: userData.role,
            department: userData.department || 'Engineering',
            status: 'active',
          });

          const generatedPass = generateSecurePassword(12);
          await saveUserCredential(userData.email.trim().toLowerCase(), generatedPass, true, {
            name: userData.name.trim(),
            role: userData.role,
            phone: userData.phone,
            department: userData.department || 'Engineering',
            status: 'active',
          });

          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
          const roleDisplayName = roles.find((r) => r.key === userData.role)?.name || userData.role;
          setCredentialsData({
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
            password: generatedPass,
            roleDisplayName,
            loginUrl: `${origin}/login`,
          });
          setIsCredentialsModalOpen(true);
        }
        toast.success(`Staff user "${userData.name}" saved successfully with role "${userData.role}"!`);
      }

      setIsDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user account');
    }
  };

  const handleSaveAssignedProjects = async () => {
    if (!activeClientForAssign) return;

    try {
      await assignProjectsToClient(activeClientForAssign.id, selectedProjectIds, activeClientForAssign.email);
      toast.success(`Updated assigned projects for ${activeClientForAssign.name}!`);
      setIsAssignProjectDialogOpen(false);
      setActiveClientForAssign(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project assignments');
    }
  };

  const handleQuickCreateAndAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientForAssign || !quickProjectName.trim()) {
      toast.error('Project Name is required');
      return;
    }

    try {
      const newProj = await saveProject({
        project_name: quickProjectName.trim(),
        client_id: activeClientForAssign.id,
        service_name: quickServiceName,
        project_value: quickProjectValue || 39999,
        start_date: new Date().toISOString().split('T')[0],
        status: 'requirement',
        progress_percentage: 15,
        description: `Dedicated project workspace for ${activeClientForAssign.company_name || activeClientForAssign.name}.`,
      } as any);

      // Auto check the newly created project in selection
      setSelectedProjectIds((prev) => [...prev, newProj.id]);
      setShowQuickCreateProject(false);
      setQuickProjectName('');
      toast.success(`Project "${newProj.project_name}" created and assigned to ${activeClientForAssign.name}!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create new project');
    }
  };

  const handleApproveClient = async (client: ClientModel) => {
    try {
      await approveClient(client.id);
      toast.success(`Approved ${client.name}'s account! Project workspace is now active.`);
      loadData();
    } catch (err) {
      toast.error('Failed to approve client');
    }
  };

  const handleToggleClientStatus = async (client: ClientModel) => {
    const nextStatus = client.status === 'active' ? 'inactive' : 'active';
    const actionWord = nextStatus === 'active' ? 'activate' : 'deactivate';

    if (
      !confirm(
        `Are you sure you want to ${actionWord} ${client.name} (${client.company_name})? ${
          nextStatus === 'inactive'
            ? 'Their portal login will be disabled, but project workspaces and history remain preserved.'
            : 'Portal access will be restored.'
        }`
      )
    ) {
      return;
    }

    try {
      await saveClient({ id: client.id, email: client.email, name: client.name, status: nextStatus });
      toast.success(`${client.name} is now ${nextStatus === 'active' ? 'Active' : 'Deactivated'}.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update client status');
    }
  };

  const pendingClients = clients.filter((c) => c.status === 'pending_approval');
  const activeClients = clients.filter((c) => c.status === 'active');

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.services || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.billing_cycle || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return c.status === 'pending_approval';
    if (statusFilter === 'active') return c.status === 'active';

    if (serviceFilter !== 'all') {
      const clientServices =
        c.services && c.services.length > 0
          ? c.services
          : getServicesForPlan(c.selected_plan);
      if (!clientServices.includes(serviceFilter)) return false;
    }

    return true;
  });

  const filteredProjectsForAssign = projects.filter((p) => {
    if (!projectSearchFilter) return true;
    return (
      p.project_name.toLowerCase().includes(projectSearchFilter.toLowerCase()) ||
      p.service_name.toLowerCase().includes(projectSearchFilter.toLowerCase()) ||
      p.status.toLowerCase().includes(projectSearchFilter.toLowerCase())
    );
  });

  const getRoleDisplayName = (roleKey?: string) => {
    if (!roleKey) return 'Client';
    if (roleKey === 'client') return 'Client (Portal User)';
    if (roleKey === 'admin' || roleKey === 'super_admin') return 'Super Admin';
    if (roleKey === 'manager') return 'Project Manager';
    if (roleKey === 'developer') return 'Developer / Engineer';
    if (roleKey === 'designer') return 'UI/UX Designer';
    if (roleKey === 'seo_specialist') return 'SEO Specialist';
    const found = roles.find((r) => r.key === roleKey || r.id === roleKey);
    return found ? found.name : roleKey.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!canView) {
    return <AdminAccessDenied moduleName="Client Accounts" requiredAction="View Clients" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-cyan" />
            Client Accounts & Retainer Services
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage client subscriptions, active deliverables (Website, SEO, AI Automation, Graphic Design, GBP), monthly/yearly retainers & project workspaces.
          </p>
        </div>
        {canCreateEdit && (
          <Button
            onClick={openCreateDialog}
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Onboard New Client
          </Button>
        )}
      </div>

      {/* Pending Approval Alert Banner (if any pending) */}
      {pendingClients.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">
                {pendingClients.length} New Client Registration(s) Awaiting Review
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                These clients have registered and are waiting for Super Admin approval before their full project milestone dashboard activates.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className="rounded-full bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
          >
            Review Pending ({pendingClients.length})
          </Button>
        </div>
      )}

      {/* Filter Tabs & Search & Service Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
        <Tabs
          value={statusFilter}
          onValueChange={(val: any) => setStatusFilter(val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 bg-surface/80 rounded-xl p-1 border border-border">
            <TabsTrigger value="all" className="rounded-lg text-xs font-bold py-1.5">
              All ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs font-bold py-1.5 text-amber-400">
              Pending ({pendingClients.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg text-xs font-bold py-1.5 text-emerald-400">
              Active ({activeClients.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2.5 flex-1 max-w-lg w-full justify-end">
          {/* Service Filter */}
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="h-9 text-xs rounded-full bg-surface border-border w-44 shrink-0">
              <SelectValue placeholder="Filter by Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services & Products</SelectItem>
              {AVAILABLE_AGENCY_SERVICES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, company, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full bg-surface"
            />
          </div>
        </div>
      </div>

      {/* Clients Cards Grid / Skeleton State */}
      {loading && clients.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="rounded-3xl border-border bg-card/60 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
              <div className="pt-4 flex justify-between">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card/40 p-12 text-center space-y-4 col-span-full">
          <div className="h-12 w-12 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">No Clients Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No client accounts match your current filter criteria.'
                : 'No client accounts registered yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter(
              (p) =>
                p.client_id === client.id ||
                (client.email && (p.client?.email?.toLowerCase() === client.email.toLowerCase() || p.client_id?.toLowerCase() === client.email.toLowerCase()))
            );
            const isPending = client.status === 'pending_approval';

            return (
              <Card
                key={client.id}
                className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isPending
                    ? 'border-amber-500/40 bg-gradient-to-br from-card via-amber-500/5 to-card shadow-md ring-1 ring-amber-500/30'
                    : 'border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/50 hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="p-6 pb-4 border-b border-border/60 bg-surface/30 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm border ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-cyan/20 text-cyan border-cyan/40'
                        }`}
                      >
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-foreground">
                          {client.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-cyan" />
                          {client.company_name || 'Individual Client'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-bold ${
                        isPending
                          ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                          : 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                      }`}
                    >
                      {isPending ? 'Pending Review' : 'Active Client'}
                    </Badge>
                  </div>

                  <div className="p-6 space-y-3.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-cyan shrink-0" />
                      <span className="font-mono text-[11px] text-foreground truncate">{client.email}</span>
                    </div>

                    {client.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-cyan shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}

                    {/* Subscribed Agency Services & Products with Individual Due Dates */}
                    <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/80 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-cyan" />
                          Individual Service Timelines
                        </span>
                        <Badge
                          className={`text-[9px] font-black uppercase tracking-wider ${
                            getBillingCycleDefinition(client.billing_cycle).tagClass
                          }`}
                        >
                          {getBillingCycleDefinition(client.billing_cycle).badge}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        {(client.services && client.services.length > 0
                          ? client.services
                          : getServicesForPlan(client.selected_plan)
                        ).map((sId) => {
                          const sDef = getServiceDefinition(sId);
                          const schedule = client.service_schedules?.[sId];
                          const effectiveDueDate =
                            schedule?.due_date ||
                            getDefaultDueDateForService(
                              sId,
                              client.created_at ? new Date(client.created_at) : new Date()
                            );
                          const effectiveStatus =
                            schedule?.status ||
                            (client.status === 'active' ? 'in_progress' : 'pending');
                          const timeline = calculateTimelineStatus(
                            schedule?.due_date || effectiveDueDate,
                            effectiveStatus
                          );

                          return (
                            <div
                              key={sId}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[11px] transition-colors ${
                                effectiveStatus === 'completed'
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : 'bg-card/70 border-border/70 hover:border-cyan/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${timeline.dotColor}`} />
                                <span className="font-semibold text-foreground truncate">
                                  {sDef.shortName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {formatTimelineDate(schedule?.due_date || effectiveDueDate)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[8.5px] px-1.5 py-0 font-bold uppercase tracking-wider ${timeline.badgeClass}`}
                                >
                                  {effectiveStatus === 'completed'
                                    ? 'Done'
                                    : timeline.isOverdue
                                    ? 'Overdue'
                                    : timeline.isToday
                                    ? 'Due Today'
                                    : `${timeline.daysRemaining}d left`}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-1 flex items-center justify-between border-t border-border/40">
                        {client.retainer_amount ? (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span>Retainer:</span>
                            <span className="font-mono font-bold text-foreground">
                              ₹{Number(client.retainer_amount).toLocaleString('en-IN')}
                              {client.billing_cycle === 'yearly' ? '/yr' : '/mo'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Deliverables Active</span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openServiceTimelineModal(client)}
                          className="h-6 text-[10px] font-bold text-cyan hover:text-cyan hover:bg-cyan/10 rounded-full px-2 gap-1"
                        >
                          <Calendar className="h-3 w-3" /> Manage Due Dates
                        </Button>
                      </div>
                    </div>

                    {client.selected_plan && (
                      <div className="p-2.5 rounded-xl bg-surface/40 border border-border text-[11px] space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Package Scope:
                        </span>
                        <p className="font-semibold text-foreground">{client.selected_plan}</p>
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                        "{client.notes}"
                      </p>
                    )}

                    {/* Assigned Projects Section */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5 uppercase">
                        <span>Assigned Projects</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan">{clientProjects.length} Active</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {clientProjects.length === 0 ? (
                          <div className="p-3 rounded-xl border border-dashed border-border text-center space-y-1">
                            <p className="text-[11px] text-muted-foreground italic">
                              {isPending
                                ? 'Awaiting approval to activate workspaces.'
                                : 'No project workspace linked yet.'}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignProjectsModal(client)}
                              className="h-6 text-[10px] font-bold text-cyan hover:text-cyan hover:bg-cyan/10 rounded-full px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Assign or Create Project
                            </Button>
                          </div>
                        ) : (
                          clientProjects.map((p) => (
                            <Link
                              key={p.id}
                              href={`/admin/projects/${p.id}`}
                              className="p-2 rounded-xl border border-border bg-surface/40 hover:border-cyan/40 flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FolderKanban className="h-3.5 w-3.5 text-cyan shrink-0" />
                                <span className="font-semibold text-foreground truncate max-w-[160px] group-hover:text-cyan transition-colors">
                                  {p.project_name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-cyan shrink-0">
                                {p.progress_percentage}% →
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                {canCreateEdit && (
                  <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between gap-2 flex-wrap">
                    {isPending ? (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClient(client)}
                          className="flex-1 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs h-8 px-3 shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve Client
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignProjectsModal(client)}
                          className="rounded-full text-xs font-semibold h-8 px-2.5 border-cyan/40 text-cyan hover:bg-cyan/10"
                          title="Assign Project Workspaces"
                        >
                          <FolderKanban className="h-3.5 w-3.5 mr-1" /> Projects
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openServiceTimelineModal(client)}
                            className="rounded-full text-xs font-semibold h-8 px-2.5 border-cyan/40 text-cyan hover:bg-cyan/10"
                            title="Set individual service due dates & completion timelines"
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1" /> Timelines
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignProjectsModal(client)}
                            className="rounded-full text-xs font-semibold h-8 px-2.5 border-border hover:border-cyan/40 text-muted-foreground hover:text-foreground"
                          >
                            <FolderKanban className="h-3.5 w-3.5 mr-1 text-cyan" /> Projects
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(client)}
                            className="rounded-full text-xs font-semibold h-8 px-2.5 border-border hover:border-cyan/40"
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResetPasswordModal(client)}
                            className="rounded-full text-xs font-semibold h-8 px-2.5 border-border hover:border-cyan/40"
                            title="Reset Password & Download Credentials"
                          >
                            <KeyRound className="h-3 w-3 mr-1 text-cyan" /> Password
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleClientStatus(client)}
                          className={`rounded-full text-xs font-semibold h-8 px-2.5 transition-colors ${
                            client.status === 'inactive'
                              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                          }`}
                          title={client.status === 'inactive' ? 'Activate Client' : 'Deactivate Client'}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {client.status === 'inactive' ? 'Activate' : 'Deactivate'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dedicated Assign Projects to Client Modal */}
      <Dialog open={isAssignProjectDialogOpen} onOpenChange={setIsAssignProjectDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl w-[95vw] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-cyan" />
              Assign Projects to {activeClientForAssign?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select which agency projects are linked to <strong>{activeClientForAssign?.company_name || activeClientForAssign?.name}</strong>. The client will see all assigned projects in their Client Portal.
            </DialogDescription>
          </DialogHeader>

          {activeClientForAssign && (
            <div className="space-y-4 mt-2">
              {/* Client summary pill */}
              <div className="p-3 rounded-2xl bg-surface/60 border border-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">{activeClientForAssign.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{activeClientForAssign.email}</p>
                </div>
                <Badge variant="outline" className="text-cyan border-cyan/40 bg-cyan/10 text-[10px]">
                  {selectedProjectIds.length} Selected Project(s)
                </Badge>
              </div>

              {/* Project Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter projects by title, service, status..."
                  value={projectSearchFilter}
                  onChange={(e) => setProjectSearchFilter(e.target.value)}
                  className="pl-8.5 h-8.5 text-xs rounded-xl bg-surface/80"
                />
              </div>

              {/* Project Selection List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {projects.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No agency projects created yet. Create a project below.
                  </div>
                ) : filteredProjectsForAssign.length === 0 ? (
                  <div className="p-4 rounded-xl border border-border text-center text-xs text-muted-foreground">
                    No projects match "{projectSearchFilter}".
                  </div>
                ) : (
                  filteredProjectsForAssign.map((p) => {
                    const isSelected = selectedProjectIds.includes(p.id);
                    const isAssignedToOther = p.client_id && p.client_id !== activeClientForAssign.id;
                    const otherClient = isAssignedToOther ? clients.find((c) => c.id === p.client_id) : null;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                          } else {
                            setSelectedProjectIds([...selectedProjectIds, p.id]);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-cyan bg-cyan/10 shadow-sm'
                            : 'border-border bg-card/60 hover:border-cyan/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProjectIds([...selectedProjectIds, p.id]);
                              } else {
                                setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">{p.project_name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                              <span>{p.service_name}</span>
                              <span>•</span>
                              <span className="font-mono text-cyan">{p.progress_percentage}% completed</span>
                              {isAssignedToOther && otherClient && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold truncate max-w-[120px]">
                                    (Currently: {otherClient.name})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-bold shrink-0 ${
                            isSelected
                              ? 'border-cyan/50 text-cyan bg-cyan/20'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {isSelected ? 'Assigned' : 'Unassigned'}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Create Project Inline Collapsible */}
              <div className="pt-2 border-t border-border/80">
                {!showQuickCreateProject ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickCreateProject(true)}
                    className="text-xs font-bold text-cyan hover:text-cyan hover:bg-cyan/10 rounded-xl w-full justify-start px-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> + Quick Create New Project for this Client
                  </Button>
                ) : (
                  <div className="p-4 rounded-2xl bg-surface/80 border border-cyan/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-cyan" />
                        Quick Create & Link Project
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickCreateProject(false)}
                        className="h-6 w-6 p-0 rounded-full text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Name *</label>
                        <Input
                          placeholder="e.g. Apex Hospital Next.js Redesign"
                          value={quickProjectName}
                          onChange={(e) => setQuickProjectName(e.target.value)}
                          className="text-xs rounded-xl h-8 bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Type</label>
                        <Input
                          placeholder="e.g. Website Development"
                          value={quickServiceName}
                          onChange={(e) => setQuickServiceName(e.target.value)}
                          className="text-xs rounded-xl h-8 bg-background"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleQuickCreateAndAssignProject}
                      className="rounded-xl bg-cyan text-slate-950 font-bold text-xs h-8 px-4 w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Create & Link Project Now
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignProjectDialogOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAssignedProjects}
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6"
                >
                  Save Project Assignments ({selectedProjectIds.length})
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dedicated Onboard / Edit Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl lg:max-w-5xl rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan" />
              {userData.id ? 'Edit Client Account' : 'Onboard New Client'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter client details, business information, choose subscribed services, and configure individual deliverable due dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="space-y-4.5 mt-2">
            {/* Basic Info (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Full Name *</label>
                <Input
                  placeholder="e.g. Dr. Alok Verma"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>

              {/* Email with Debounced Real-time Duplicate Check */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Email Address (Login ID) *</label>
                  {emailCheckStatus === 'checking' && (
                    <span className="text-[10px] text-cyan flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                    </span>
                  )}
                  {emailCheckStatus === 'available' && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Email available
                    </span>
                  )}
                  {emailCheckStatus === 'duplicate' && (
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Email already registered!
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  placeholder="e.g. contact@abchospital.in"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  required
                  className={`text-xs rounded-xl h-9 font-mono transition-colors ${
                    emailCheckStatus === 'duplicate'
                      ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5'
                      : emailCheckStatus === 'available'
                      ? 'border-emerald-500 focus-visible:ring-emerald-500 bg-emerald-500/5'
                      : ''
                  }`}
                />
                {emailCheckStatus === 'duplicate' && emailCheckResult && (
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[10.5px] text-rose-300 flex items-start gap-1.5 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      An account already exists for <strong>{emailCheckResult.name}</strong> ({emailCheckResult.role}).
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={userData.phone || ''}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              {/* Company / Brand */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Company / Hospital / Brand *</label>
                <Input
                  placeholder="e.g. ABC Super Speciality Hospital"
                  value={userData.company_name || ''}
                  onChange={(e) => setUserData({ ...userData, company_name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>
            </div>

            {/* Subscribed Agency Services & Products Multi-select */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-surface/60 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan" />
                  Growth Plan & Subscribed Deliverables *
                </label>
                <Badge variant="outline" className="text-[10px] text-cyan border-cyan/40 bg-cyan/10 font-bold">
                  {userData.services.length} Services Selected
                </Badge>
              </div>

              {/* Quick Plan Preset Loader */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Select Plan Template (Auto-checks Respective Services):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(PLAN_SERVICE_PRESETS).map(([key, preset]) => {
                    const isCurrent = userData.selected_plan === preset.name;
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPlanPreset(key)}
                        className={`h-9 text-[10.5px] font-bold rounded-xl px-2.5 transition-all justify-start truncate ${
                          isCurrent
                            ? 'bg-cyan text-slate-950 border-cyan shadow-sm font-black'
                            : 'bg-card/60 hover:bg-cyan/15 hover:text-cyan hover:border-cyan/40 border-border'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        <span className="truncate">{preset.name.split('(')[0].trim()}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1.5">
                <div className="flex items-center justify-between pb-1.5">
                  <p className="text-[11px] text-muted-foreground">
                    Check or customize any active services for this client:
                  </p>
                  <span className="text-[10px] text-muted-foreground italic">Click card to toggle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {AVAILABLE_AGENCY_SERVICES.map((svc) => {
                    const isChecked = userData.services.includes(svc.id);
                    return (
                      <div
                        key={svc.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleService(svc.id);
                          }
                        }}
                        onClick={() => toggleService(svc.id)}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
                          isChecked
                            ? 'border-cyan bg-cyan/15 font-bold text-cyan shadow-sm ring-1 ring-cyan/40'
                            : 'border-border bg-card/60 text-muted-foreground hover:border-cyan/30 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-cyan border-cyan text-slate-950'
                                : 'border-muted-foreground/40 bg-surface'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="truncate text-xs font-semibold">{svc.shortName}</span>
                        </div>
                        <span className="text-[8.5px] uppercase tracking-wider opacity-75 truncate shrink-0">
                          {svc.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual Service Due Dates & Delivery Timelines Configuration */}
            {userData.services.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-surface/70 border border-cyan/30 shadow-inner">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-cyan" />
                      Individual Service Due Dates & Completion Timelines *
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Assign independent finish dates & deliverable statuses for each selected service (e.g. Website 14 days, SEO 90 days). Clients will receive timeline countdown notifications for each service separately.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-cyan border-cyan/40 bg-cyan/10 font-bold shrink-0">
                    {userData.services.length} Timelines
                  </Badge>
                </div>

                <div className="space-y-3 pt-1">
                  {userData.services.map((svcId) => {
                    const svcDef = getServiceDefinition(svcId);
                    const schedule = userData.service_schedules?.[svcId] || {
                      service_id: svcId,
                      due_date: getDefaultDueDateForService(svcId),
                      status: 'in_progress',
                      start_date: new Date().toISOString().split('T')[0],
                    };
                    const effectiveDueDate = schedule.due_date || getDefaultDueDateForService(svcId);
                    const timeline = calculateTimelineStatus(effectiveDueDate, schedule.status || 'in_progress');
                    const config = SERVICE_TIMELINE_CONFIG[svcId];

                    return (
                      <div
                        key={svcId}
                        className="p-3.5 rounded-2xl border border-border/80 bg-card/80 space-y-3 shadow-sm hover:border-cyan/40 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-xl border flex items-center justify-center font-bold text-xs ${svcDef.badgeClass}`}>
                              {svcDef.shortName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-foreground">
                                {svcDef.name}
                              </h4>
                              <span className="text-[9.5px] uppercase font-bold text-muted-foreground">
                                {svcDef.category} • Recommended: {config?.label || 'Sprint Delivery'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[9.5px] px-2 py-0.5 font-bold ${timeline.badgeClass}`}>
                              {schedule.status === 'completed'
                                ? '✓ Completed'
                                : timeline.isOverdue
                                ? '⚠️ Overdue'
                                : timeline.isToday
                                ? '⚡ Due Today'
                                : `${timeline.daysRemaining} days left`}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          {/* Due Date Picker with Quick Date Offset Buttons */}
                          <div className="sm:col-span-7 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                <Clock className="h-3 w-3 text-cyan" />
                                Target Completion Date:
                              </span>
                              <div className="flex items-center gap-1 font-mono">
                                <button
                                  type="button"
                                  onClick={() => addDaysToServiceDueDate(svcId, 7)}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                  title="Add 7 Days from today"
                                >
                                  +7d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addDaysToServiceDueDate(svcId, 14)}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                  title="Add 14 Days from today"
                                >
                                  +14d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addDaysToServiceDueDate(svcId, 30)}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                  title="Add 30 Days from today"
                                >
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => addDaysToServiceDueDate(svcId, 90)}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                  title="Add 90 Days from today (SEO milestone)"
                                >
                                  +90d
                                </button>
                              </div>
                            </div>
                            <Input
                              type="date"
                              value={effectiveDueDate}
                              onChange={(e) => updateServiceSchedule(svcId, { due_date: e.target.value })}
                              className="text-xs rounded-xl h-8.5 bg-surface/90 font-mono"
                            />
                          </div>

                          {/* Individual Deliverable Status */}
                          <div className="sm:col-span-5 space-y-1">
                            <span className="text-[10px] text-muted-foreground font-semibold block">
                              Service Status:
                            </span>
                            <Select
                              value={schedule.status || 'in_progress'}
                              onValueChange={(val: any) => updateServiceSchedule(svcId, { status: val })}
                            >
                              <SelectTrigger className="text-xs rounded-xl h-8.5 bg-surface/90">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_progress">● In Progress (Active)</SelectItem>
                                <SelectItem value="completed">✓ Completed / Delivered</SelectItem>
                                <SelectItem value="ongoing">✦ Ongoing Retainer</SelectItem>
                                <SelectItem value="pending">○ Pending Kickoff</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Deliverable Scope & Milestone Note */}
                        <div className="space-y-1">
                          <Input
                            placeholder={`Scope note (e.g. "${config?.recommendedDescription || 'Milestone scope'}")`}
                            value={schedule.notes || ''}
                            onChange={(e) => updateServiceSchedule(svcId, { notes: e.target.value })}
                            className="text-[11px] rounded-xl h-8 bg-surface/70"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Retainer & Billing Model Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Billing / Retainer</label>
                <Select
                  value={userData.billing_cycle}
                  onValueChange={(val: any) => setUserData({ ...userData, billing_cycle: val })}
                >
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue placeholder="Billing Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((bc) => (
                      <SelectItem key={bc.id} value={bc.id}>
                        {bc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Retainer Tier</label>
                <Select
                  value={userData.subscription_tier}
                  onValueChange={(val: any) => setUserData({ ...userData, subscription_tier: val })}
                >
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard Client</SelectItem>
                    <SelectItem value="Growth">Growth Partner</SelectItem>
                    <SelectItem value="Premium Enterprise">Premium Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Retainer Fee (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 39999"
                  value={userData.retainer_amount !== undefined ? userData.retainer_amount : ''}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      retainer_amount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="text-xs rounded-xl h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Account Status</label>
                <Select
                  value={userData.status}
                  onValueChange={(val: any) => setUserData({ ...userData, status: val })}
                >
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Verified Access)</SelectItem>
                    <SelectItem value="pending_approval">Pending Admin Review</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Package Scope Title</label>
                <Input
                  placeholder="e.g. Scale Growth Retainer (₹39,999/mo)"
                  value={userData.selected_plan || ''}
                  onChange={(e) => setUserData({ ...userData, selected_plan: e.target.value })}
                  className="text-xs rounded-xl h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Location / City</label>
              <Input
                placeholder="e.g. Civil Lines, Moradabad, UP"
                value={userData.address || ''}
                onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                className="text-xs rounded-xl h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Onboarding Notes</label>
              <Textarea
                placeholder="Requirement details, scope notes..."
                value={userData.notes || ''}
                onChange={(e) => setUserData({ ...userData, notes: e.target.value })}
                rows={2}
                className="text-xs rounded-xl resize-none"
              />
            </div>

            {/* Project Assignment Section for New Client */}
            {!userData.id && (
              <div className="p-3.5 rounded-2xl bg-surface/60 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-cyan" />
                    Assign Project(s) to this Client
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {userData.assignedProjectIds.length} Selected
                  </span>
                </div>

                {projects.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Link existing agency projects:
                    </p>
                    {projects.map((p) => {
                      const isChecked = userData.assignedProjectIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (isChecked) {
                              setUserData({
                                ...userData,
                                assignedProjectIds: userData.assignedProjectIds.filter((id) => id !== p.id),
                              });
                            } else {
                              setUserData({
                                ...userData,
                                assignedProjectIds: [...userData.assignedProjectIds, p.id],
                              });
                            }
                          }}
                          className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            isChecked ? 'border-cyan bg-cyan/10' : 'border-border bg-card/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Checkbox checked={isChecked} />
                            <span className="font-semibold truncate">{p.project_name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan">{p.progress_percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {userData.assignedProjectIds.length === 0 && (
                  <div className="pt-2 border-t border-border flex items-center gap-2">
                    <Checkbox
                      id="autoCreateProject"
                      checked={userData.autoCreateProject}
                      onCheckedChange={(checked) =>
                        setUserData({ ...userData, autoCreateProject: !!checked })
                      }
                    />
                    <label
                      htmlFor="autoCreateProject"
                      className="text-[11px] text-muted-foreground cursor-pointer"
                    >
                      Auto-initialize dedicated project milestone workspace for this client
                    </label>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="submit"
                disabled={emailCheckStatus === 'duplicate'}
                className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full disabled:opacity-50"
              >
                {userData.id ? 'Save Changes' : 'Onboard Client & Link Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-Time Credentials Created / Reset Modal with Download (.txt) support */}
      <OneTimeCredentialsModal
        open={isCredentialsModalOpen}
        onOpenChange={setIsCredentialsModalOpen}
        data={credentialsData}
      />

      {/* Reset Client Password Modal */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan" />
              Reset Password for Client
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate a new secure temporary password for <strong>{resetTargetClient?.name}</strong> ({resetTargetClient?.email}). You will be able to download or copy the credentials document immediately.
            </DialogDescription>
          </DialogHeader>

          {resetTargetClient && (
            <form onSubmit={handleConfirmResetPassword} className="space-y-4 mt-2">
              <div className="p-3 rounded-2xl bg-surface/60 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client Name:</span>
                  <span className="font-bold text-foreground">{resetTargetClient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Email:</span>
                  <span className="font-mono text-cyan">{resetTargetClient.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">New Temporary Password *</label>
                  <button
                    type="button"
                    onClick={() => setNewResetPassword(generateSecurePassword(12))}
                    className="text-[11px] font-bold text-cyan hover:underline flex items-center gap-1"
                  >
                    <Dices className="h-3 w-3" /> Auto-Generate Strong
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10 text-xs font-mono rounded-xl h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6"
                >
                  Confirm & Show Credentials
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dedicated Service Timelines & Due Dates Modal */}
      <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl lg:max-w-5xl w-[95vw] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan" />
              Service Timelines & Due Dates — {activeClientForTimeline?.name}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Configure independent target completion dates and deliverable milestones for each subscribed service. Since website development, SEO, and AI automation have different delivery timelines, each service countdown is tracked independently for client notifications.
            </DialogDescription>
          </DialogHeader>

          {activeClientForTimeline && (
            <form onSubmit={handleSaveTimelineModal} className="space-y-4 mt-2">
              {/* Client Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-surface/70 border border-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-cyan" />
                    {activeClientForTimeline.company_name || activeClientForTimeline.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {activeClientForTimeline.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    className={`text-[9.5px] font-black uppercase tracking-wider ${
                      getBillingCycleDefinition(activeClientForTimeline.billing_cycle).tagClass
                    }`}
                  >
                    {getBillingCycleDefinition(activeClientForTimeline.billing_cycle).badge}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activeClientForTimeline.selected_plan || 'Growth Engine'}
                  </p>
                </div>
              </div>

              {/* Service Schedules List */}
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {(activeClientForTimeline.services && activeClientForTimeline.services.length > 0
                  ? activeClientForTimeline.services
                  : getServicesForPlan(activeClientForTimeline.selected_plan)
                ).map((svcId) => {
                  const svcDef = getServiceDefinition(svcId);
                  const schedule = tempSchedules[svcId] || {
                    service_id: svcId,
                    due_date: getDefaultDueDateForService(svcId),
                    status: 'in_progress',
                    start_date: new Date().toISOString().split('T')[0],
                  };
                  const effectiveDueDate =
                    schedule.due_date ||
                    getDefaultDueDateForService(
                      svcId,
                      activeClientForTimeline.created_at
                        ? new Date(activeClientForTimeline.created_at)
                        : new Date()
                    );
                  const effectiveStatus = schedule.status || 'in_progress';
                  const timeline = calculateTimelineStatus(effectiveDueDate, effectiveStatus);
                  const config = SERVICE_TIMELINE_CONFIG[svcId];

                  return (
                    <div
                      key={svcId}
                      className="p-3.5 rounded-2xl border border-border bg-card/80 space-y-3 shadow-sm hover:border-cyan/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-xs ${svcDef.badgeClass}`}>
                            {svcDef.shortName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-foreground">
                              {svcDef.name}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              {svcDef.category} • Recommended: {config?.label || 'Sprint Delivery'}
                            </span>
                          </div>
                        </div>

                        <Badge variant="outline" className={`text-[9.5px] px-2 py-0.5 font-bold ${timeline.badgeClass}`}>
                          {effectiveStatus === 'completed'
                            ? '✓ Completed'
                            : timeline.isOverdue
                            ? '⚠️ Overdue'
                            : timeline.isToday
                            ? '⚡ Due Today'
                            : `${timeline.daysRemaining} days left`}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* Due Date Picker with Quick Date Offset Buttons */}
                        <div className="sm:col-span-7 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3 text-cyan" />
                              Target Completion Date:
                            </span>
                            <div className="flex items-center gap-1 font-mono">
                              <button
                                type="button"
                                onClick={() => addDaysToTempDueDate(svcId, 7)}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                title="Add 7 Days from today"
                              >
                                +7d
                              </button>
                              <button
                                type="button"
                                onClick={() => addDaysToTempDueDate(svcId, 14)}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                title="Add 14 Days from today"
                              >
                                +14d
                              </button>
                              <button
                                type="button"
                                onClick={() => addDaysToTempDueDate(svcId, 30)}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                title="Add 30 Days from today"
                              >
                                +30d
                              </button>
                              <button
                                type="button"
                                onClick={() => addDaysToTempDueDate(svcId, 90)}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border hover:border-cyan hover:text-cyan transition-colors"
                                title="Add 90 Days from today (SEO milestone)"
                              >
                                +90d
                              </button>
                            </div>
                          </div>
                          <Input
                            type="date"
                            value={effectiveDueDate}
                            onChange={(e) => updateTempSchedule(svcId, { due_date: e.target.value })}
                            className="text-xs rounded-xl h-8.5 bg-surface/90 font-mono"
                          />
                        </div>

                        {/* Individual Deliverable Status */}
                        <div className="sm:col-span-5 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold block">
                            Service Status:
                          </span>
                          <Select
                            value={effectiveStatus}
                            onValueChange={(val: any) => updateTempSchedule(svcId, { status: val })}
                          >
                            <SelectTrigger className="text-xs rounded-xl h-8.5 bg-surface/90">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_progress">● In Progress (Active)</SelectItem>
                              <SelectItem value="completed">✓ Completed / Delivered</SelectItem>
                              <SelectItem value="ongoing">✦ Ongoing Retainer</SelectItem>
                              <SelectItem value="pending">○ Pending Kickoff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Deliverable Scope & Milestone Note */}
                      <div className="space-y-1">
                        <Input
                          placeholder={`Scope note (e.g. "${config?.recommendedDescription || 'Milestone scope'}")`}
                          value={schedule.notes || ''}
                          onChange={(e) => updateTempSchedule(svcId, { notes: e.target.value })}
                          className="text-[11px] rounded-xl h-8 bg-surface/70"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTimelineModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 shadow-sm"
                >
                  Save Service Timelines & Due Dates
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
