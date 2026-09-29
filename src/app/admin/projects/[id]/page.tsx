'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  Plus,
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
  Trash2,
  ExternalLink,
  Edit,
  Pencil,
  AlertTriangle,
  Sparkles,
  Save,
  RotateCcw,
  Zap,
  Link2,
  Download,
  Mail,
  ShieldAlert,
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getProjectById,
  updateProjectProgress,
  toggleMilestoneStatus,
  addMilestone,
  editMilestone,
  deleteMilestone,
  saveProject,
  deleteProject,
  addTask,
  updateTaskStatus,
  addProjectUpdate,
  updateProjectUpdate,
  deleteProjectUpdate,
  addProjectInvoice,
  updateProjectInvoice,
  deleteProjectInvoice,
  getTeamMembers,
  getClients,
  getServices,
  subscribeToDataChanges,
} from '@/lib/db';
import {
  ProjectModel,
  MilestoneModel,
  TaskModel,
  ProjectUpdateModel,
  TeamMemberModel,
  ClientModel,
  ServiceModel,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  InvoiceDocumentModel,
} from '@/lib/supabase/types';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { sendInvoiceEmail } from '@/lib/email-service';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    defaultProgress: number;
    minProgress: number;
    maxProgress: number;
    color: string;
    activeBg: string;
    border: string;
    dotColor: string;
  }
> = {
  not_started: {
    label: 'Not Started',
    defaultProgress: 0,
    minProgress: 0,
    maxProgress: 0,
    color: 'border-slate-500 text-slate-400 bg-slate-500/10',
    activeBg: 'bg-slate-700 text-white border-slate-500 shadow-slate-500/20',
    border: 'border-slate-600',
    dotColor: 'bg-slate-400',
  },
  requirement: {
    label: 'Requirement Phase',
    defaultProgress: 15,
    minProgress: 1,
    maxProgress: 20,
    color: 'border-cyan text-cyan bg-cyan/10',
    activeBg: 'bg-cyan text-slate-950 font-black border-cyan shadow-cyan/30',
    border: 'border-cyan/40',
    dotColor: 'bg-cyan',
  },
  planning: {
    label: 'Planning & Specs',
    defaultProgress: 30,
    minProgress: 21,
    maxProgress: 35,
    color: 'border-blue-500 text-blue-400 bg-blue-500/10',
    activeBg: 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30',
    border: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
  },
  design: {
    label: 'UI/UX Design',
    defaultProgress: 45,
    minProgress: 36,
    maxProgress: 55,
    color: 'border-purple-500 text-purple-400 bg-purple-500/10',
    activeBg: 'bg-purple-600 text-white border-purple-500 shadow-purple-500/30',
    border: 'border-purple-500/40',
    dotColor: 'bg-purple-400',
  },
  development: {
    label: 'Development Build',
    defaultProgress: 65,
    minProgress: 56,
    maxProgress: 75,
    color: 'border-amber-500 text-amber-400 bg-amber-500/10',
    activeBg: 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-amber-500/30',
    border: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  testing: {
    label: 'QA & Testing',
    defaultProgress: 80,
    minProgress: 76,
    maxProgress: 88,
    color: 'border-orange-500 text-orange-400 bg-orange-500/10',
    activeBg: 'bg-orange-500 text-white border-orange-500 shadow-orange-500/30',
    border: 'border-orange-500/40',
    dotColor: 'bg-orange-400',
  },
  revision: {
    label: 'Client Revision',
    defaultProgress: 90,
    minProgress: 89,
    maxProgress: 99,
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    activeBg: 'bg-rose-600 text-white border-rose-500 shadow-rose-500/30',
    border: 'border-rose-500/40',
    dotColor: 'bg-rose-400',
  },
  completed: {
    label: 'Completed',
    defaultProgress: 100,
    minProgress: 100,
    maxProgress: 100,
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    activeBg: 'bg-emerald-500 text-slate-950 font-black border-emerald-500 shadow-emerald-500/30',
    border: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  delivered: {
    label: 'Delivered Live',
    defaultProgress: 100,
    minProgress: 100,
    maxProgress: 100,
    color: 'border-green-600 text-green-400 bg-green-600/10',
    activeBg: 'bg-green-600 text-white font-black border-green-500 shadow-green-600/30',
    border: 'border-green-600/40',
    dotColor: 'bg-green-400',
  },
  on_hold: {
    label: 'On Hold',
    defaultProgress: 0,
    minProgress: 0,
    maxProgress: 100,
    color: 'border-destructive text-destructive bg-destructive/10',
    activeBg: 'bg-destructive text-white border-destructive shadow-destructive/30',
    border: 'border-destructive/40',
    dotColor: 'bg-destructive',
  },
};

export function getRecommendedStageForProgress(progress: number, currentStage?: ProjectStatus): ProjectStatus {
  if (currentStage === 'on_hold') return 'on_hold';
  if (progress === 0) return 'not_started';
  if (progress <= 20) return 'requirement';
  if (progress <= 35) return 'planning';
  if (progress <= 55) return 'design';
  if (progress <= 75) return 'development';
  if (progress <= 88) return 'testing';
  if (progress < 100) return 'revision';
  if (currentStage === 'delivered') return 'delivered';
  return 'completed';
}

const PROGRESS_PRESETS: { label: string; value: number; stage: ProjectStatus }[] = [
  { label: '0% Not Started', value: 0, stage: 'not_started' },
  { label: '25% Planning', value: 25, stage: 'planning' },
  { label: '45% UI Design', value: 45, stage: 'design' },
  { label: '65% Development', value: 65, stage: 'development' },
  { label: '80% QA Testing', value: 80, stage: 'testing' },
  { label: '100% Delivered', value: 100, stage: 'delivered' },
];

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { user, isAdmin, hasPermission } = useAuth();

  // RBAC Gating permissions
  const canView = isAdmin || hasPermission('projects', 'view');
  const canEditProject = isAdmin || hasPermission('projects', 'create_edit');
  const canDeleteProject = isAdmin || hasPermission('projects', 'delete');
  const canUpdateProgress = isAdmin || hasPermission('projects', 'update_progress');
  const canAssignTasks = isAdmin || hasPermission('tasks', 'assign');
  const canUpdateTaskStatus = isAdmin || hasPermission('tasks', 'update_status');
  const canCreateInvoice = isAdmin || hasPermission('invoices', 'create_edit');
  const canDeleteInvoice = isAdmin || hasPermission('invoices', 'delete');

  const [project, setProject] = useState<ProjectModel | null>(null);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);

  // Progress & Stage state
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>('requirement');
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [updateLogMessage, setUpdateLogMessage] = useState('');

  // Modals state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');

  // Milestone Edit Modal
  const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneModel | null>(null);

  // Project Edit Modal
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProjectForm, setEditingProjectForm] = useState<Partial<ProjectModel>>({});

  // Project Safe Delete Modal (GitHub style)
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDocumentModel | null>(null);

  // Activity Update Edit & Delete Modal
  const [isEditUpdateModalOpen, setIsEditUpdateModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdateModel | null>(null);
  const [editUpdateTitle, setEditUpdateTitle] = useState('');
  const [editUpdateMessage, setEditUpdateMessage] = useState('');
  const [editUpdateProgress, setEditUpdateProgress] = useState<number | undefined>(undefined);
  const [editUpdateVisibleToClient, setEditUpdateVisibleToClient] = useState(true);

  const [isDeleteUpdateModalOpen, setIsDeleteUpdateModalOpen] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  const loadProject = async (isInitial = false) => {
    try {
      const [proj, t, c, s] = await Promise.all([
        getProjectById(projectId),
        getTeamMembers(),
        getClients(),
        getServices(),
      ]);
      if (proj) {
        setProject(proj);
        if (isInitial) {
          setCurrentProgress(proj.progress_percentage);
          setCurrentStatus(proj.status);
        }
      }
      setTeam(t);
      setClients(c);
      setServices(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject(true);
    return subscribeToDataChanges(() => loadProject(false));
  }, [projectId]);

  if (loading && !project) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-8 w-64 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-80 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return <AdminAccessDenied moduleName="Projects & Milestones" requiredAction="View Projects" />;
  }

  if (!project) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button asChild className="rounded-full">
          <Link href="/admin/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const getManagerName = () => {
    if (project.assigned_manager?.name) return project.assigned_manager.name;
    const found = team.find(
      (t) => t.id === project.assigned_manager_id || t.id === project.assigned_manager?.id
    );
    if (found) return `${found.name} (${found.role})`;
    return 'Prashant Bajak (Super Admin & Lead)';
  };

  const totalMilestones = (project.milestones || []).length;
  const completedMilestones = (project.milestones || []).filter((m) => m.status === 'completed').length;
  const calculatedMilestonePercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // Handle stage selection with intelligent progress alignment
  const handleSelectStage = (stage: ProjectStatus) => {
    if (!canUpdateProgress) {
      toast.error('You do not have permission to change project stages');
      return;
    }
    setCurrentStatus(stage);
    if (autoSync) {
      if (stage === 'not_started') {
        setCurrentProgress(0);
      } else if (stage === 'completed' || stage === 'delivered') {
        setCurrentProgress(100);
      } else if (stage !== 'on_hold') {
        const defaultProg = STATUS_CONFIG[stage]?.defaultProgress ?? 15;
        setCurrentProgress(defaultProg);
      }
    } else {
      // Basic sanity fix even if autoSync is off
      if (stage === 'not_started' && currentProgress > 0) {
        setCurrentProgress(0);
      } else if ((stage === 'completed' || stage === 'delivered') && currentProgress < 100) {
        setCurrentProgress(100);
      }
    }
  };

  // Handle progress slider / direct number change
  const handleProgressChange = (newVal: number) => {
    if (!canUpdateProgress) {
      toast.error('You do not have permission to adjust progress');
      return;
    }
    const clamped = Math.max(0, Math.min(100, newVal));
    setCurrentProgress(clamped);
    if (autoSync && currentStatus !== 'on_hold') {
      const recStage = getRecommendedStageForProgress(clamped, currentStatus);
      if (recStage !== currentStatus) {
        setCurrentStatus(recStage);
      }
    }
  };

  // Handle preset click
  const handleSelectPreset = (preset: { label: string; value: number; stage: ProjectStatus }) => {
    if (!canUpdateProgress) return;
    setCurrentProgress(preset.value);
    setCurrentStatus(preset.stage);
  };

  // Sync progress directly with deliverable milestones
  const handleSyncWithMilestones = () => {
    if (!canUpdateProgress) return;
    setCurrentProgress(calculatedMilestonePercent);
    if (autoSync || calculatedMilestonePercent === 0 || calculatedMilestonePercent === 100) {
      const recStage = getRecommendedStageForProgress(calculatedMilestonePercent, currentStatus);
      setCurrentStatus(recStage);
    }
    toast.info(`Progress aligned to milestones (${calculatedMilestonePercent}%) & Stage updated to "${STATUS_CONFIG[getRecommendedStageForProgress(calculatedMilestonePercent, currentStatus)]?.label}".`);
  };

  // Detect logical conflict / mismatch between stage and progress
  const isMismatched = (() => {
    if (currentStatus === 'on_hold') return false;
    if (currentStatus === 'not_started' && currentProgress > 0) return true;
    if ((currentStatus === 'completed' || currentStatus === 'delivered') && currentProgress < 100) return true;
    const config = STATUS_CONFIG[currentStatus];
    if (!config) return false;
    return currentProgress < config.minProgress - 15 || currentProgress > config.maxProgress + 15;
  })();

  // Handle live progress update & client notification
  const handleSaveProgress = async () => {
    if (!canUpdateProgress) {
      toast.error('You do not have permission to update project progress');
      return;
    }
    setSavingProgress(true);
    try {
      const updated = await updateProjectProgress(
        project.id,
        currentProgress,
        currentStatus,
        updateLogMessage.trim() || undefined,
        getManagerName()
      );

      if (updated) {
        setProject(updated);
        setCurrentProgress(updated.progress_percentage);
        setCurrentStatus(updated.status);
      }

      toast.success(
        `Progress saved (${currentProgress}%) & Stage set to "${STATUS_CONFIG[currentStatus]?.label || currentStatus}"!`
      );
      setUpdateLogMessage('');
    } catch (err) {
      toast.error('Failed to save project progress');
    } finally {
      setSavingProgress(false);
    }
  };

  // Edit Project Details
  const handleOpenEditProject = () => {
    if (!canEditProject) {
      toast.error('You do not have permission to edit project details');
      return;
    }
    setEditingProjectForm({
      ...project,
    });
    setIsEditProjectModalOpen(true);
  };

  const handleSaveEditedProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProject) {
      toast.error('You do not have permission to edit project details');
      return;
    }
    if (!editingProjectForm.project_name || !editingProjectForm.client_id) {
      toast.error('Project name and client are required');
      return;
    }

    try {
      const saved = await saveProject(editingProjectForm as any);
      setProject(saved);
      setCurrentProgress(saved.progress_percentage);
      setCurrentStatus(saved.status);
      toast.success('Project details updated successfully!');
      setIsEditProjectModalOpen(false);
      loadProject(false);
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  // Safe Delete Project (GitHub-Style)
  const handleSafeDeleteProject = async () => {
    if (!canDeleteProject) {
      toast.error('You do not have permission to delete projects');
      return;
    }
    if (deleteConfirmInput.trim() !== project.project_name.trim()) {
      toast.error('Project name does not match');
      return;
    }

    try {
      await deleteProject(project.id);
      toast.success(`Project "${project.project_name}" has been deleted.`);
      setIsDeleteProjectModalOpen(false);
      router.push('/admin/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  // Milestone toggling
  const handleToggleMilestone = async (milestone: MilestoneModel) => {
    if (!canUpdateProgress) {
      toast.error('You do not have permission to update milestones');
      return;
    }
    let nextStatus: 'pending' | 'in_progress' | 'completed' = 'in_progress';
    if (milestone.status === 'pending') nextStatus = 'in_progress';
    else if (milestone.status === 'in_progress') nextStatus = 'completed';
    else if (milestone.status === 'completed') nextStatus = 'pending';

    const updated = await toggleMilestoneStatus(project.id, milestone.id, nextStatus);
    if (updated) {
      setProject(updated);
      setCurrentProgress(updated.progress_percentage);
      if (autoSync) {
        const recStage = getRecommendedStageForProgress(updated.progress_percentage, updated.status);
        setCurrentStatus(recStage);
      } else {
        setCurrentStatus(updated.status);
      }
      toast.success(`Milestone set to ${nextStatus.replace('_', ' ')} (${updated.progress_percentage}% completed)`);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProgress) {
      toast.error('You do not have permission to add milestones');
      return;
    }
    if (!newMilestoneTitle.trim()) return;

    const updated = await addMilestone(project.id, newMilestoneTitle, newMilestoneDesc);
    if (updated) {
      setProject(updated);
      setCurrentProgress(updated.progress_percentage);
    }
    toast.success('Milestone added!');
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setIsMilestoneModalOpen(false);
  };

  const handleOpenEditMilestone = (ms: MilestoneModel, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUpdateProgress) return;
    setEditingMilestone({ ...ms });
    setIsEditMilestoneModalOpen(true);
  };

  const handleSaveEditedMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProgress) return;
    if (!editingMilestone || !editingMilestone.title.trim()) {
      toast.error('Milestone title is required');
      return;
    }

    const updated = await editMilestone(project.id, editingMilestone.id, {
      title: editingMilestone.title,
      description: editingMilestone.description,
      status: editingMilestone.status,
    });

    if (updated) {
      setProject(updated);
      setCurrentProgress(updated.progress_percentage);
    }

    toast.success('Milestone updated successfully!');
    setIsEditMilestoneModalOpen(false);
    setEditingMilestone(null);
  };

  const handleDeleteMilestone = async (milestoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUpdateProgress) return;
    if (confirm('Are you sure you want to delete this milestone? Project progress percentage will be recalculated.')) {
      const updated = await deleteMilestone(project.id, milestoneId);
      if (updated) {
        setProject(updated);
        setCurrentProgress(updated.progress_percentage);
      }
      toast.success('Milestone deleted');
    }
  };

  // Task actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignTasks) {
      toast.error('You do not have permission to assign tasks');
      return;
    }
    if (!newTaskTitle.trim()) return;

    await addTask(project.id, newTaskTitle, newTaskAssignee || undefined, newTaskPriority);
    toast.success('Task assigned to employee!');
    setNewTaskTitle('');
    setIsTaskModalOpen(false);
    loadProject(false);
  };

  const handleToggleTaskStatus = async (task: TaskModel) => {
    if (!canUpdateTaskStatus) {
      toast.error('You do not have permission to update task status');
      return;
    }
    const nextStatus: TaskStatus = task.status === 'done' ? 'in_progress' : 'done';
    await updateTaskStatus(project.id, task.id, nextStatus);
    toast.success(nextStatus === 'done' ? 'Task marked complete!' : 'Task reopened');
    loadProject(false);
  };

  // Quick Post Update
  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProgress) {
      toast.error('You do not have permission to post activity updates');
      return;
    }
    if (!updateLogMessage.trim()) {
      toast.error('Please enter an update message');
      return;
    }

    await addProjectUpdate(
      project.id,
      `Progress Update (${currentProgress}%)`,
      updateLogMessage,
      getManagerName(),
      'Lead Project Manager',
      currentProgress
    );

    toast.success('Update published & notification sent to client portal!');
    setUpdateLogMessage('');
    loadProject(false);
  };

  // Edit and Delete Activity Updates
  const handleOpenEditUpdate = (upd: ProjectUpdateModel) => {
    if (!canUpdateProgress) return;
    setEditingUpdate(upd);
    setEditUpdateTitle(upd.title || '');
    setEditUpdateMessage(upd.message || '');
    setEditUpdateProgress(upd.progress_percent);
    setEditUpdateVisibleToClient(upd.is_visible_to_client ?? true);
    setIsEditUpdateModalOpen(true);
  };

  const handleSaveEditUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateProgress) return;
    if (!project || !editingUpdate) return;
    if (!editUpdateMessage.trim()) {
      toast.error('Please enter an update message');
      return;
    }

    await updateProjectUpdate(project.id, editingUpdate.id, {
      title: editUpdateTitle.trim() || `Progress Update (${editUpdateProgress ?? project.progress_percentage}%)`,
      message: editUpdateMessage.trim(),
      progress_percent: typeof editUpdateProgress === 'number' ? editUpdateProgress : undefined,
      is_visible_to_client: editUpdateVisibleToClient,
    });

    toast.success('Activity update successfully saved!');
    setIsEditUpdateModalOpen(false);
    setEditingUpdate(null);
    loadProject(false);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!canUpdateProgress) return;
    if (!project) return;
    await deleteProjectUpdate(project.id, updateId);
    toast.success('Activity update deleted');
    setIsDeleteUpdateModalOpen(false);
    setDeletingUpdateId(null);
    loadProject(false);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!canDeleteInvoice) {
      toast.error('You do not have permission to delete invoices');
      return;
    }
    if (!project) return;
    if (confirm('Are you sure you want to delete this invoice document?')) {
      await deleteProjectInvoice(project.id, invoiceId);
      toast.success('Invoice deleted');
      loadProject(false);
    }
  };

  // Invoice / Document actions
  const handleStatusChangeInvoice = async (invoiceId: string, newStatus: any) => {
    if (!project) return;
    await updateProjectInvoice(project.id, invoiceId, { status: newStatus });
    toast.success(`Invoice marked as ${newStatus}`);
    if (viewingInvoice && viewingInvoice.id === invoiceId) {
      setViewingInvoice({ ...viewingInvoice, status: newStatus });
    }
    loadProject(false);
  };

  const handleSendInvoiceEmail = async (inv: InvoiceDocumentModel) => {
    if (!project) return;
    const client = clients.find((c) => c.id === project.client_id);
    const result = await sendInvoiceEmail({
      invoice: inv,
      client,
      project,
    });
    if (result.simulated) {
      toast.success(`📧 Invoice #${inv.reference_number || inv.id} queued for ${result.recipient}!`, {
        description: 'Ready for live delivery when email API keys are connected.',
      });
    } else {
      toast.success(`Invoice emailed directly to ${result.recipient}!`);
    }
  };

  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.requirement;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full border-border">
            <Link href="/admin/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">
                Projects / {project.client?.company_name || project.client?.name}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full transition-colors ${statusInfo.color}`}
              >
                ● {statusInfo.label}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
              {project.project_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditProject && (
            <Button
              variant="outline"
              onClick={handleOpenEditProject}
              className="rounded-full text-xs font-semibold border-border hover:border-cyan hover:text-cyan"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Details
            </Button>
          )}
          {canDeleteProject && (
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmInput('');
                setIsDeleteProjectModalOpen(true);
              }}
              className="rounded-full text-xs font-semibold border-border text-rose-500 hover:bg-rose-500/10 hover:border-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Project
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full text-xs font-semibold border-border">
            <Link href="/client" target="_blank">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-cyan" /> Client View
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Manager & Meta Banner Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-cyan/5 border border-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-cyan text-slate-950 font-black text-sm flex items-center justify-center shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan">
                Assigned Project Manager
              </span>
              <Badge variant="outline" className="text-[9px] bg-card border-border font-bold">
                Lead In-Charge
              </Badge>
            </div>
            <p className="text-sm font-black text-foreground mt-0.5">
              {getManagerName()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan" />
            <span>Timeline: {project.start_date || 'Feb 2026'} → {project.expected_completion_date ? <strong className="text-emerald-400 font-bold">Target Delivery: {project.expected_completion_date}</strong> : 'Ongoing'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-400">
              ₹{(project.project_value || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE PROGRESS & STAGE CONTROLLER CARD */}
      <Card className="rounded-3xl border-border bg-gradient-to-r from-card via-surface/80 to-card shadow-sm p-6 sm:p-8 space-y-6">
        {!canUpdateProgress && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-cyan/10 border border-cyan/20 text-xs text-cyan">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>View-only Mode: You have read-only access to progress tracking and project deliverables.</span>
          </div>
        )}

        {/* Section Top Header & Auto-Sync Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan" />
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                Live Project Progress &amp; Stage Controller
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Smartly synchronized with automatic stage detection and client portal alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 self-start sm:self-auto">
            {/* Auto-Sync Switch */}
            <div className="flex items-center gap-2 bg-surface/70 px-3 py-1.5 rounded-full border border-border">
              <Link2 className={`h-3.5 w-3.5 ${autoSync ? 'text-cyan' : 'text-muted-foreground'}`} />
              <span className="text-[11px] font-bold text-foreground">Auto-Link Stage &amp; %</span>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
                disabled={!canUpdateProgress}
                className="scale-90"
              />
            </div>

            {/* Percentage Display & Input */}
            <div className="text-right flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={currentProgress}
                  disabled={!canUpdateProgress}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    handleProgressChange(isNaN(num) ? 0 : num);
                  }}
                  className="w-16 h-10 text-xl font-black text-center rounded-xl bg-card border-border font-mono px-1 text-cyan disabled:opacity-80"
                />
                <span className="text-2xl font-black text-foreground">%</span>
              </div>
            </div>

            {canUpdateProgress && (
              <Button
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 shadow-md h-10 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                {savingProgress ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Save className="h-4 w-4 stroke-[2.5]" />
                )}
                {savingProgress ? 'Saving...' : 'Save & Notify Client'}
              </Button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar & Slider */}
        <div className="space-y-3 bg-surface/50 p-4 sm:p-5 rounded-2xl border border-border/80">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
              Completion Progress Slider
            </span>
            <span className="text-foreground font-mono font-bold text-sm">
              {currentProgress}% / 100% · Stage: <strong className="text-cyan">{statusInfo.label}</strong>
            </span>
          </div>

          <Slider
            value={[currentProgress]}
            max={100}
            step={1}
            disabled={!canUpdateProgress}
            onValueChange={(vals) => handleProgressChange(vals[0])}
            className="py-2"
          />

          {/* Quick Preset Buttons & Milestone Sync */}
          {canUpdateProgress && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {PROGRESS_PRESETS.map((preset) => {
                  const isCurrent = currentProgress === preset.value && currentStatus === preset.stage;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan text-slate-950 border-cyan font-black shadow-sm'
                          : 'bg-card border-border/80 text-muted-foreground hover:border-cyan hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSyncWithMilestones}
                title="Align progress to completed deliverable milestones"
                className="px-3 py-1 rounded-full text-[11px] font-bold border border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Auto-Sync from Milestones ({calculatedMilestonePercent}%)
              </button>
            </div>
          )}
        </div>

        {/* Status Mismatch Warning Banner */}
        {isMismatched && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Stage &amp; Progress Mismatch:</strong> Stage is set to <strong>&ldquo;{statusInfo.label}&rdquo;</strong> but progress is <strong>{currentProgress}%</strong>.
              </span>
            </div>
            {canUpdateProgress && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const config = STATUS_CONFIG[currentStatus];
                  if (config) setCurrentProgress(config.defaultProgress);
                }}
                className="rounded-full text-[11px] h-7 px-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 self-start sm:self-auto"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Auto-Fix to {STATUS_CONFIG[currentStatus]?.defaultProgress}%
              </Button>
            )}
          </div>
        )}

        {/* 1-Click Interactive Stage Status Pills Selector */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan" />
              Select Current Project Stage Status
            </label>
            <span className="text-xs text-muted-foreground font-semibold">
              Currently: <strong className="text-foreground">{statusInfo.label}</strong> ({currentProgress}%)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const isSelected = currentStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canUpdateProgress}
                  onClick={() => canUpdateProgress && handleSelectStage(key as ProjectStatus)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                    !canUpdateProgress ? 'cursor-default opacity-85' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? `${config.activeBg} shadow-md ring-1 ring-cyan scale-[1.02]`
                      : 'bg-card/70 border-border hover:border-cyan/50 hover:bg-surface text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isSelected ? 'bg-current ring-2 ring-current/40' : config.dotColor
                      }`}
                    />
                    <span className="text-xs font-bold truncate">{config.label}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Dropdown (Alternative) & Optional Update Note to Client */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Stage Dropdown</label>
            <Select
              value={currentStatus}
              disabled={!canUpdateProgress}
              onValueChange={(val: ProjectStatus) => handleSelectStage(val)}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-card border-border disabled:opacity-80">
                <SelectValue placeholder="Choose Stage" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Optional Live Update Message to Client Portal
            </label>
            <Input
              placeholder="e.g. Services and pricing modules implemented. Moving to QA testing..."
              value={updateLogMessage}
              disabled={!canUpdateProgress}
              onChange={(e) => setUpdateLogMessage(e.target.value)}
              className="h-9 text-xs rounded-xl bg-card border-border disabled:opacity-80"
            />
          </div>
        </div>
      </Card>

      {/* Tabs: Milestones, Tasks, Updates Log, Invoices */}
      <Tabs defaultValue="milestones" className="space-y-6">
        <TabsList className="bg-surface/80 p-1 rounded-2xl border border-border">
          <TabsTrigger value="milestones" className="rounded-xl text-xs font-bold px-4 py-2">
            Milestones Timeline ({(project.milestones || []).length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl text-xs font-bold px-4 py-2">
            Task Assignments ({(project.tasks || []).length})
          </TabsTrigger>
          <TabsTrigger value="updates" className="rounded-xl text-xs font-bold px-4 py-2">
            Activity Updates ({(project.updates || []).length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-xl text-xs font-bold px-4 py-2">
            Invoices & Quotes ({(project.invoices || []).length})
          </TabsTrigger>
        </TabsList>

        {/* 1. MILESTONES TAB */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-4 rounded-2xl border border-border">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan" />
                Project Milestones Timeline ({completedMilestones}/{totalMilestones} Done · {calculatedMilestonePercent}%)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canUpdateProgress
                  ? 'Click the status circle or badge to cycle status. Use edit or delete buttons on any milestone to adjust deliverables.'
                  : 'Milestones and delivery phases for this project.'}
              </p>
            </div>
            {canUpdateProgress && (
              <div className="flex items-center gap-2">
                {totalMilestones > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncWithMilestones}
                    className="rounded-full text-xs font-bold border-cyan/40 text-cyan hover:bg-cyan/10"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" /> Sync Progress ({calculatedMilestonePercent}%)
                  </Button>
                )}
                <Button
                  onClick={() => setIsMilestoneModalOpen(true)}
                  size="sm"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Milestone
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(project.milestones || []).map((ms, index) => {
              const isDone = ms.status === 'completed';
              const isInProgress = ms.status === 'in_progress';

              const modifiedTimestamp = ms.updated_at
                ? `Modified: ${new Date(ms.updated_at).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ms.created_at
                ? `Created: ${new Date(ms.created_at).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}`
                : '';

              return (
                <div
                  key={ms.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isInProgress
                      ? 'bg-cyan/10 border-cyan/40 shadow-sm'
                      : 'bg-card/60 border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!canUpdateProgress}
                      onClick={() => canUpdateProgress && handleToggleMilestone(ms)}
                      title={canUpdateProgress ? "Click to change status (Pending → In Progress → Completed)" : "Milestone status"}
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        !canUpdateProgress ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'
                      } ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-emerald-500/20 shadow-md'
                          : isInProgress
                          ? 'bg-cyan text-slate-950 font-black animate-pulse shadow-cyan/20 shadow-md'
                          : 'border border-muted-foreground/40 text-muted-foreground'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isInProgress ? (
                        <PlayCircle className="h-4 w-4 fill-slate-950 text-cyan" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {ms.title}
                        </h4>
                        {modifiedTimestamp && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-surface/60 px-2 py-0.5 rounded-md border border-border/50">
                            {modifiedTimestamp}
                          </span>
                        )}
                      </div>
                      {ms.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge
                      variant="outline"
                      onClick={() => canUpdateProgress && handleToggleMilestone(ms)}
                      className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full select-none transition-colors ${
                        !canUpdateProgress ? 'cursor-default' : 'cursor-pointer'
                      } ${
                        isDone
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                          : isInProgress
                          ? 'border-cyan/40 text-cyan bg-cyan/10'
                          : 'border-border text-muted-foreground hover:border-cyan'
                      }`}
                    >
                      ● {ms.status.replace('_', ' ')}
                    </Badge>

                    {canUpdateProgress && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEditMilestone(ms, e)}
                          title="Edit milestone"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteMilestone(ms.id, e)}
                          title="Delete milestone"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* 2. TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Employee Tasks</h3>
              <p className="text-xs text-muted-foreground">
                Assign tasks to developers, designers and SEO leads.
              </p>
            </div>
            {canAssignTasks && (
              <Button
                onClick={() => setIsTaskModalOpen(true)}
                size="sm"
                className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Assign Task
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(project.tasks || []).map((task) => {
              const assignedUser = team.find((t) => t.id === task.assigned_to);
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isDone ? 'bg-surface/40 border-border opacity-70' : 'bg-card/70 border-border hover:border-cyan/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={!canUpdateTaskStatus}
                      onClick={() => canUpdateTaskStatus && handleToggleTaskStatus(task)}
                      className={`h-5 w-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors ${
                        !canUpdateTaskStatus ? 'cursor-default opacity-80' : 'cursor-pointer'
                      } ${
                        isDone
                          ? 'bg-cyan border-cyan text-slate-950'
                          : 'border-border bg-surface hover:border-cyan'
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <p className={`text-xs font-bold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-cyan" />
                          {assignedUser?.name || 'Unassigned'}
                        </span>
                        <span>•</span>
                        <span className="uppercase font-bold text-[10px] text-amber-500">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-extrabold tracking-wider ${
                      isDone ? 'text-emerald-500 border-emerald-500/30' : 'text-cyan border-cyan/30'
                    }`}
                  >
                    {task.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* 3. UPDATES TAB */}
        <TabsContent value="updates" className="space-y-4">
          {canUpdateProgress && (
            <Card className="rounded-3xl border-border bg-card/60 p-6">
              <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-cyan" />
                Post Live Update to Client Portal
              </h3>
              <form onSubmit={handlePostUpdate} className="space-y-3">
                <Textarea
                  placeholder="e.g. Homepage and Services section completed. Testing responsive views..."
                  value={updateLogMessage}
                  onChange={(e) => setUpdateLogMessage(e.target.value)}
                  rows={3}
                  className="text-xs rounded-xl"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">
                    * Triggers notification on client dashboard and email alert.
                  </span>
                  <Button type="submit" size="sm" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                    Publish Update
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Timeline */}
          <div className="space-y-3 mt-6">
            {(project.updates || []).length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border p-6 text-center bg-card/30">
                <Send className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-foreground">No activity updates posted yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Post live milestones or announcements to keep the client informed.
                </p>
              </Card>
            ) : (
              (project.updates || []).map((upd) => (
                <div
                  key={upd.id}
                  className="group p-4 rounded-2xl border border-border bg-card/40 hover:border-cyan/30 hover:bg-card/70 transition-all space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground">{upd.title}</span>
                      {upd.progress_percent !== undefined && (
                        <Badge className="bg-cyan/15 text-cyan border border-cyan/30 text-[10px]">
                          {upd.progress_percent}%
                        </Badge>
                      )}
                      {!upd.is_visible_to_client && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 bg-amber-500/10">
                          Internal Only
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-muted-foreground font-mono mr-1">
                        {new Date(upd.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {upd.updated_at && (
                          <span className="text-[9px] text-cyan block text-right font-sans">
                            (edited)
                          </span>
                        )}
                      </span>

                      {canUpdateProgress && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditUpdate(upd)}
                            title="Edit update"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingUpdateId(upd.id);
                              setIsDeleteUpdateModalOpen(true);
                            }}
                            title="Delete update"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed pl-1 border-l-2 border-cyan/40">
                    &ldquo;{upd.message}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span className="text-cyan font-semibold">
                      By {upd.author_name} ({upd.author_role || 'Lead'})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* 4. INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-foreground">Quotations & Invoices</h3>
              <p className="text-xs text-muted-foreground">
                Attach billing and scope documents visible on the client portal with PDF download and email dispatch.
              </p>
            </div>
            {canCreateInvoice && (
              <Button
                onClick={() => setIsInvoiceModalOpen(true)}
                size="sm"
                className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4 shadow-sm gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Invoice / Quote
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {(project.invoices || []).length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/30">
                <FileText className="mx-auto h-8 w-8 text-cyan mb-2" />
                <p className="text-xs font-bold text-foreground">No invoices or quotations yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Create a new invoice or quotation to issue to the client.
                </p>
                {canCreateInvoice && (
                  <Button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    size="sm"
                    variant="outline"
                    className="mt-3 rounded-full text-xs font-bold"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Create First Invoice
                  </Button>
                )}
              </Card>
            ) : (
              (project.invoices || []).map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{inv.title}</span>
                        <span className="text-xs text-muted-foreground font-mono">({inv.reference_number || inv.id})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issued: {inv.issue_date || '28 Sep 2026'} {inv.due_date && `· Due: ${inv.due_date}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                    <span className="text-base font-extrabold text-foreground font-mono">
                      ₹{Number(inv.amount).toLocaleString('en-IN')}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                        inv.status === 'paid'
                          ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                          : 'border-cyan/40 text-cyan bg-cyan/10'
                      }`}
                    >
                      {inv.status}
                    </Badge>

                    <div className="flex items-center gap-1.5 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingInvoice(inv)}
                        className="h-8 rounded-xl text-xs font-bold border-cyan/30 text-cyan hover:bg-cyan/10 gap-1"
                      >
                        <Download className="h-3 w-3" /> View / PDF
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSendInvoiceEmail(inv)}
                        title="Email Invoice"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      {canDeleteInvoice && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          title="Delete Invoice"
                          className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 1. Add Milestone Modal */}
      <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Project Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMilestone} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">Milestone Title *</label>
              <Input
                placeholder="e.g. Services Page Completed"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                required
                className="text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Description (Optional)</label>
              <Input
                placeholder="e.g. Verified responsive layouts on mobile devices"
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                Add Milestone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Milestone Modal */}
      <Dialog open={isEditMilestoneModalOpen} onOpenChange={setIsEditMilestoneModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-cyan" />
              Edit Milestone
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update milestone deliverable title, description, or status.
            </DialogDescription>
          </DialogHeader>
          {editingMilestone && (
            <form onSubmit={handleSaveEditedMilestone} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold">Milestone Title *</label>
                <Input
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Description</label>
                <Input
                  value={editingMilestone.description || ''}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Milestone Status</label>
                <Select
                  value={editingMilestone.status}
                  onValueChange={(val: any) => setEditingMilestone({ ...editingMilestone, status: val })}
                >
                  <SelectTrigger className="text-xs rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-3 flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMilestoneModalOpen(false)}
                  className="rounded-full text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. Edit Full Project Details Modal */}
      <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Edit className="h-5 w-5 text-cyan" />
              Edit Project Workspace
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modify project name, stage status, progress percentage, assigned Project Manager, and dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditedProject} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Name *</label>
              <Input
                value={editingProjectForm.project_name || ''}
                onChange={(e) => setEditingProjectForm({ ...editingProjectForm, project_name: e.target.value })}
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Client *</label>
                <Select
                  value={editingProjectForm.client_id || ''}
                  onValueChange={(val) => setEditingProjectForm({ ...editingProjectForm, client_id: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Choose Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.company_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Service Type</label>
                <Select
                  value={editingProjectForm.service_name || 'Website Development'}
                  onValueChange={(val) => setEditingProjectForm({ ...editingProjectForm, service_name: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.title}>
                        {s.title} ({s.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Project Stage Status</label>
                <Select
                  value={editingProjectForm.status || 'requirement'}
                  onValueChange={(val: ProjectStatus) => {
                    const defaultProg = STATUS_CONFIG[val]?.defaultProgress ?? 15;
                    setEditingProjectForm({
                      ...editingProjectForm,
                      status: val,
                      progress_percentage: val === 'not_started' ? 0 : val === 'completed' || val === 'delivered' ? 100 : (editingProjectForm.progress_percentage === 0 ? defaultProg : editingProjectForm.progress_percentage),
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-card">
                    <SelectValue placeholder="Choose Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Completion Progress ({editingProjectForm.progress_percentage || 0}%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editingProjectForm.progress_percentage ?? 0}
                  onChange={(e) =>
                    setEditingProjectForm({
                      ...editingProjectForm,
                      progress_percentage: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                    })
                  }
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={editingProjectForm.start_date || ''}
                  onChange={(e) => setEditingProjectForm({ ...editingProjectForm, start_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Target Delivery Date (Client Deadline)</label>
                <Input
                  type="date"
                  value={editingProjectForm.expected_completion_date || ''}
                  onChange={(e) => setEditingProjectForm({ ...editingProjectForm, expected_completion_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Project Value (₹)</label>
                <Input
                  type="number"
                  value={editingProjectForm.project_value || ''}
                  onChange={(e) => setEditingProjectForm({ ...editingProjectForm, project_value: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Assigned Project Manager</label>
              <Select
                value={editingProjectForm.assigned_manager_id || 'team-admin-1'}
                onValueChange={(val) => setEditingProjectForm({ ...editingProjectForm, assigned_manager_id: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Choose Project Manager" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Description & Scope</label>
              <Textarea
                value={editingProjectForm.description || ''}
                onChange={(e) => setEditingProjectForm({ ...editingProjectForm, description: e.target.value })}
                rows={3}
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border flex sm:justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditProjectModalOpen(false)}
                className="rounded-full text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 shadow-md"
              >
                Save Project Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. GitHub-Style Safe Delete Confirmation Dialog */}
      <Dialog open={isDeleteProjectModalOpen} onOpenChange={setIsDeleteProjectModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 border-destructive/50">
          <DialogHeader className="space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto sm:mx-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              Delete Project Workspace?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action <span className="font-bold text-destructive">CANNOT</span> be undone. This will permanently delete the project workspace, all milestones, employee tasks, client updates, and associated invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs">
              <p className="text-muted-foreground">To confirm deletion, type the exact project name below:</p>
              <p className="font-mono font-black text-foreground mt-1 select-all break-words">
                {project.project_name}
              </p>
            </div>

            <div className="space-y-1.5">
              <Input
                placeholder="Type project name to confirm"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="h-9 text-xs rounded-xl border-destructive/40 focus-visible:ring-destructive font-semibold"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteProjectModalOpen(false)}
                className="rounded-full text-xs font-bold w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSafeDeleteProject}
                disabled={deleteConfirmInput.trim() !== project.project_name.trim()}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black text-xs px-5 w-full sm:w-auto disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Permanently Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Add Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Assign Employee Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">Task Title</label>
              <Input
                placeholder="e.g. Implement About Page Layout"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
                className="text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Assign To Employee</label>
              <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                <SelectTrigger className="text-xs rounded-xl">
                  <SelectValue placeholder="Select Team Member" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Priority</label>
              <Select value={newTaskPriority} onValueChange={(v: TaskPriority) => setNewTaskPriority(v)}>
                <SelectTrigger className="text-xs rounded-xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Create Invoice Modal */}
      <CreateInvoiceModal
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        defaultProjectId={project.id}
        onInvoiceCreated={() => loadProject(false)}
      />

      {/* 7. View & Print Invoice Modal */}
      <InvoiceViewModal
        invoice={viewingInvoice}
        client={clients.find((c) => c.id === project.client_id)}
        project={project}
        open={Boolean(viewingInvoice)}
        onOpenChange={(open) => {
          if (!open) setViewingInvoice(null);
        }}
        isAdminView={true}
        onStatusChange={(newStatus) => {
          if (viewingInvoice) handleStatusChangeInvoice(viewingInvoice.id, newStatus);
        }}
      />

      {/* 8. Edit Activity Update Modal */}
      <Dialog open={isEditUpdateModalOpen} onOpenChange={setIsEditUpdateModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-cyan" />
              Edit Activity Update
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the headline, progress milestone, or message for this live update.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditUpdate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Update Headline / Title</label>
              <Input
                value={editUpdateTitle}
                onChange={(e) => setEditUpdateTitle(e.target.value)}
                placeholder="e.g. Progress Update (45%)"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Update Message <span className="text-rose-400">*</span>
              </label>
              <Textarea
                rows={4}
                value={editUpdateMessage}
                onChange={(e) => setEditUpdateMessage(e.target.value)}
                placeholder="Detailed explanation of deliverables, testing completed, or next steps..."
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Progress Milestone %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editUpdateProgress !== undefined ? editUpdateProgress : ''}
                  onChange={(e) =>
                    setEditUpdateProgress(e.target.value !== '' ? Number(e.target.value) : undefined)
                  }
                  placeholder="e.g. 50"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Client Portal</label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={editUpdateVisibleToClient}
                    onCheckedChange={setEditUpdateVisibleToClient}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {editUpdateVisibleToClient ? 'Public to Client' : 'Internal Note'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditUpdateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-cyan text-slate-950 font-bold text-xs px-4"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 9. Delete Activity Update Confirmation Modal */}
      <Dialog open={isDeleteUpdateModalOpen} onOpenChange={setIsDeleteUpdateModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
              Delete Activity Update?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this update from the project timeline and client history?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteUpdateModalOpen(false);
                setDeletingUpdateId(null);
              }}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => deletingUpdateId && handleDeleteUpdate(deletingUpdateId)}
              className="rounded-xl text-xs font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
