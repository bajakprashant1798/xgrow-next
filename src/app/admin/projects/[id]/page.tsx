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
  addProjectInvoice,
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
} from '@/lib/supabase/types';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'border-slate-500 text-slate-500 bg-slate-500/10' },
  requirement: { label: 'Requirement Phase', color: 'border-cyan text-cyan bg-cyan/10' },
  planning: { label: 'Planning & Specs', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
  design: { label: 'UI/UX Design', color: 'border-purple-500 text-purple-500 bg-purple-500/10' },
  development: { label: 'Development Build', color: 'border-amber-500 text-amber-500 bg-amber-500/10' },
  testing: { label: 'QA & Testing', color: 'border-orange-500 text-orange-500 bg-orange-500/10' },
  revision: { label: 'Client Revision', color: 'border-rose-500 text-rose-500 bg-rose-500/10' },
  completed: { label: 'Completed', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
  delivered: { label: 'Delivered Live', color: 'border-green-600 text-green-600 bg-green-600/10' },
  on_hold: { label: 'On Hold', color: 'border-destructive text-destructive bg-destructive/10' },
};

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<ProjectModel | null>(null);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Progress state
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>('requirement');
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
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState<number>(24000);
  const [newInvoiceType, setNewInvoiceType] = useState<'quotation' | 'invoice'>('invoice');

  const loadProject = async () => {
    try {
      const [proj, t, c, s] = await Promise.all([
        getProjectById(projectId),
        getTeamMembers(),
        getClients(),
        getServices(),
      ]);
      if (proj) {
        setProject(proj);
        setCurrentProgress(proj.progress_percentage);
        setCurrentStatus(proj.status);
      }
      setTeam(t);
      setClients(c);
      setServices(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    return subscribeToDataChanges(loadProject);
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

  // Handle live progress update & client notification
  const handleSaveProgress = async () => {
    await updateProjectProgress(
      project.id,
      currentProgress,
      currentStatus,
      updateLogMessage.trim() || undefined,
      getManagerName()
    );

    toast.success(`Progress saved (${currentProgress}%) & Stage set to ${currentStatus}!`);
    setUpdateLogMessage('');
    loadProject();
  };

  // Edit Project Details
  const handleOpenEditProject = () => {
    setEditingProjectForm({
      ...project,
    });
    setIsEditProjectModalOpen(true);
  };

  const handleSaveEditedProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectForm.project_name || !editingProjectForm.client_id) {
      toast.error('Project name and client are required');
      return;
    }

    try {
      await saveProject(editingProjectForm as any);
      toast.success('Project details updated successfully!');
      setIsEditProjectModalOpen(false);
      loadProject();
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  // Safe Delete Project (GitHub-Style)
  const handleSafeDeleteProject = async () => {
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
    let nextStatus: 'pending' | 'in_progress' | 'completed' = 'in_progress';
    if (milestone.status === 'pending') nextStatus = 'in_progress';
    else if (milestone.status === 'in_progress') nextStatus = 'completed';
    else if (milestone.status === 'completed') nextStatus = 'pending';

    const updated = await toggleMilestoneStatus(project.id, milestone.id, nextStatus);
    if (updated) {
      toast.success(`Milestone set to ${nextStatus}`);
      loadProject();
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    await addMilestone(project.id, newMilestoneTitle, newMilestoneDesc);
    toast.success('Milestone added!');
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setIsMilestoneModalOpen(false);
    loadProject();
  };

  const handleOpenEditMilestone = (ms: MilestoneModel, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMilestone({ ...ms });
    setIsEditMilestoneModalOpen(true);
  };

  const handleSaveEditedMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !editingMilestone.title.trim()) {
      toast.error('Milestone title is required');
      return;
    }

    await editMilestone(project.id, editingMilestone.id, {
      title: editingMilestone.title,
      description: editingMilestone.description,
      status: editingMilestone.status,
    });

    toast.success('Milestone updated successfully!');
    setIsEditMilestoneModalOpen(false);
    setEditingMilestone(null);
    loadProject();
  };

  const handleDeleteMilestone = async (milestoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this milestone? Project progress percentage will be recalculated.')) {
      await deleteMilestone(project.id, milestoneId);
      toast.success('Milestone deleted');
      loadProject();
    }
  };

  // Task actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTask(project.id, newTaskTitle, newTaskAssignee || undefined, newTaskPriority);
    toast.success('Task assigned to employee!');
    setNewTaskTitle('');
    setIsTaskModalOpen(false);
    loadProject();
  };

  const handleToggleTaskStatus = async (task: TaskModel) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'in_progress' : 'done';
    await updateTaskStatus(project.id, task.id, nextStatus);
    toast.success(nextStatus === 'done' ? 'Task marked complete!' : 'Task reopened');
    loadProject();
  };

  // Quick Post Update
  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    loadProject();
  };

  // Invoice / Document action
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceTitle.trim()) return;

    await addProjectInvoice(project.id, {
      client_id: project.client_id,
      type: newInvoiceType,
      title: newInvoiceTitle,
      amount: newInvoiceAmount,
      status: 'sent',
      issue_date: new Date().toISOString().split('T')[0],
      reference_number: `${newInvoiceType.toUpperCase().slice(0, 3)}-2026-${Math.floor(100 + Math.random() * 900)}`,
    });

    toast.success(`${newInvoiceType === 'quotation' ? 'Quotation' : 'Invoice'} added!`);
    setNewInvoiceTitle('');
    setIsInvoiceModalOpen(false);
    loadProject();
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
              <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
              {project.project_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenEditProject}
            className="rounded-full text-xs font-semibold border-border hover:border-cyan hover:text-cyan"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Details
          </Button>
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
          <Button asChild variant="outline" className="rounded-full text-xs font-semibold border-border">
            <Link href="/client" target="_blank">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-cyan" /> Client View
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Manager Banner Card */}
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
                Team Lead
              </Badge>
            </div>
            <p className="text-sm font-black text-foreground mt-0.5">
              {getManagerName()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-cyan" />
          <span>Timeline: {project.start_date || 'Feb 2026'} → {project.expected_completion_date || 'Ongoing'}</span>
        </div>
      </div>

      {/* Progress Controller Bar */}
      <Card className="rounded-3xl border-border bg-gradient-to-r from-card via-surface/80 to-card shadow-sm p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                <h3 className="font-extrabold text-base text-foreground">
                  Live Project Progress & Stage Controller
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update progress percentage and stage (e.g. Planning → Design → Development → Delivered).
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-3xl font-black text-foreground">{currentProgress}%</span>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-widest">
                  Completed
                </span>
              </div>
              <Button
                onClick={handleSaveProgress}
                className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 shadow-md h-10"
              >
                Save & Notify Client
              </Button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <Slider
              value={[currentProgress]}
              max={100}
              step={5}
              onValueChange={(vals) => setCurrentProgress(vals[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>0% Kickoff</span>
              <span>25% Planning</span>
              <span>50% Design/Dev</span>
              <span>75% Testing</span>
              <span>100% Delivered</span>
            </div>
          </div>

          {/* Stage Dropdown & Update Note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Current Stage Status</label>
              <Select
                value={currentStatus}
                onValueChange={(val: ProjectStatus) => setCurrentStatus(val)}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-card">
                  <SelectValue placeholder="Stage" />
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

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Optional Update Note to Client (e.g. "Services and pricing modules implemented")
              </label>
              <Input
                placeholder="Type update message sent directly to client notifications feed..."
                value={updateLogMessage}
                onChange={(e) => setUpdateLogMessage(e.target.value)}
                className="h-9 text-xs rounded-xl bg-card"
              />
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Project Milestones Timeline</h3>
              <p className="text-xs text-muted-foreground">
                Click status circle to cycle status. Use edit or delete buttons on any milestone to adjust deliverables.
              </p>
            </div>
            <Button
              onClick={() => setIsMilestoneModalOpen(true)}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Milestone
            </Button>
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
                      onClick={() => handleToggleMilestone(ms)}
                      title="Click to change status"
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                        isDone
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : isInProgress
                          ? 'bg-cyan text-slate-950 font-black animate-pulse'
                          : 'border border-muted-foreground/40 text-muted-foreground hover:border-cyan'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4" />
                      ) : isInProgress ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
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
                      onClick={() => handleToggleMilestone(ms)}
                      className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full cursor-pointer select-none ${
                        isDone
                          ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                          : isInProgress
                          ? 'border-cyan/40 text-cyan bg-cyan/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {ms.status.replace('_', ' ')}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleOpenEditMilestone(ms, e)}
                      title="Edit milestone"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteMilestone(ms.id, e)}
                      title="Delete milestone"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
            <Button
              onClick={() => setIsTaskModalOpen(true)}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Assign Task
            </Button>
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
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`h-5 w-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors ${
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

          {/* Timeline */}
          <div className="space-y-3 mt-6">
            {(project.updates || []).map((upd) => (
              <div key={upd.id} className="p-4 rounded-2xl border border-border bg-card/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{upd.title}</span>
                    {upd.progress_percent && (
                      <Badge className="bg-cyan/15 text-cyan border border-cyan/30 text-[10px]">
                        {upd.progress_percent}%
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(upd.created_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  "{upd.message}"
                </p>
                <p className="text-[10px] text-cyan font-semibold">
                  By {upd.author_name} ({upd.author_role || 'Lead'})
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 4. INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Quotations & Invoices</h3>
              <p className="text-xs text-muted-foreground">
                Attach billing and scope documents visible on the client portal.
              </p>
            </div>
            <Button
              onClick={() => setIsInvoiceModalOpen(true)}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Invoice / Quote
            </Button>
          </div>

          <div className="space-y-3">
            {(project.invoices || []).map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl border border-border bg-card/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-cyan/15 text-cyan flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{inv.title}</span>
                      <span className="text-xs text-muted-foreground font-mono">({inv.reference_number})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issued: {inv.issue_date} {inv.due_date && `· Due: ${inv.due_date}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-extrabold text-foreground">
                    ₹{inv.amount.toLocaleString('en-IN')}
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
                </div>
              </div>
            ))}
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
              <label className="text-xs font-bold">Milestone Title</label>
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
                  onValueChange={(val: ProjectStatus) => setEditingProjectForm({ ...editingProjectForm, status: val })}
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
                      progress_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
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
                <label className="text-xs font-bold text-foreground">Expected Completion</label>
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
                value={editingProjectForm.assigned_manager_id || 'team-2'}
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

      {/* 6. Add Invoice Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Quotation / Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInvoice} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">Document Type</label>
              <Select value={newInvoiceType} onValueChange={(v: any) => setNewInvoiceType(v)}>
                <SelectTrigger className="text-xs rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="quotation">Quotation / Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Title</label>
              <Input
                placeholder="e.g. Final Phase 2 Invoice"
                value={newInvoiceTitle}
                onChange={(e) => setNewInvoiceTitle(e.target.value)}
                required
                className="text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">Amount (₹)</label>
              <Input
                type="number"
                value={newInvoiceAmount}
                onChange={(e) => setNewInvoiceAmount(parseFloat(e.target.value) || 0)}
                required
                className="text-xs rounded-xl font-bold"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-5">
                Create & Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
