'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Filter,
  DollarSign,
  Edit,
  Trash2,
  AlertTriangle,
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
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getProjects,
  saveProject,
  deleteProject,
  getClients,
  getServices,
  getTeamMembers,
  subscribeToDataChanges,
} from '@/lib/db';
import { ProjectModel, ClientModel, ServiceModel, TeamMemberModel, ProjectStatus } from '@/lib/supabase/types';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'border-slate-500 text-slate-500 bg-slate-500/10' },
  requirement: { label: 'Requirement', color: 'border-cyan text-cyan bg-cyan/10' },
  planning: { label: 'Planning', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
  design: { label: 'Design', color: 'border-purple-500 text-purple-500 bg-purple-500/10' },
  development: { label: 'Development', color: 'border-amber-500 text-amber-500 bg-amber-500/10' },
  testing: { label: 'Testing', color: 'border-orange-500 text-orange-500 bg-orange-500/10' },
  revision: { label: 'Revision', color: 'border-rose-500 text-rose-500 bg-rose-500/10' },
  completed: { label: 'Completed', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
  delivered: { label: 'Delivered', color: 'border-green-600 text-green-600 bg-green-600/10' },
  on_hold: { label: 'On Hold', color: 'border-destructive text-destructive bg-destructive/10' },
};

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [services, setServices] = useState<ServiceModel[]>([]);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit Project state
  const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Safe Delete Project state
  const [projectToDelete, setProjectToDelete] = useState<ProjectModel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // New project form state
  const [newProject, setNewProject] = useState<Partial<ProjectModel>>({
    project_name: '',
    client_id: '',
    service_name: 'Website Development',
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: '',
    project_value: 35000,
    assigned_manager_id: 'team-2',
    assigned_employee_ids: ['team-4'],
    status: 'requirement',
    progress_percentage: 15,
    description: '',
  });

  const loadData = async () => {
    try {
      const [p, c, s, t] = await Promise.all([
        getProjects(),
        getClients(),
        getServices(),
        getTeamMembers(),
      ]);
      setProjects(p);
      setClients(c);
      setServices(s);
      setTeam(t);
    } catch (e) {
      console.warn('Error loading projects list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.project_name || !newProject.client_id) {
      toast.error('Project Name and Client are required');
      return;
    }

    try {
      const saved = await saveProject(newProject as any);
      toast.success(`Project "${saved.project_name}" created successfully!`);
      setIsDialogOpen(false);
      setNewProject({
        project_name: '',
        client_id: '',
        service_name: 'Website Development',
        start_date: new Date().toISOString().split('T')[0],
        project_value: 35000,
        assigned_manager_id: 'team-2',
        assigned_employee_ids: ['team-4'],
        status: 'requirement',
        progress_percentage: 15,
        description: '',
      });
      loadData();
    } catch (err) {
      toast.error('Failed to create project');
    }
  };

  const handleOpenEditModal = (project: ProjectModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingProject({ ...project });
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.project_name?.trim()) {
      toast.error('Project Name is required');
      return;
    }

    try {
      const saved = await saveProject(editingProject);
      toast.success(`Project "${saved.project_name}" updated successfully!`);
      setIsEditDialogOpen(false);
      setEditingProject(null);
      loadData();
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  const handleOpenDeleteModal = (project: ProjectModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setProjectToDelete(project);
    setDeleteConfirmInput('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmSafeDelete = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmInput.trim() !== projectToDelete.project_name.trim()) {
      toast.error('Project name does not match');
      return;
    }

    try {
      await deleteProject(projectToDelete.id);
      toast.success(`Project "${projectToDelete.project_name}" permanently deleted`);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteConfirmInput('');
      loadData();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const getManagerName = (project: ProjectModel) => {
    if (project.assigned_manager?.name) return project.assigned_manager.name;
    const found = team.find(
      (t) => t.id === project.assigned_manager_id || t.id === project.assigned_manager?.id
    );
    if (found) return `${found.name} (${found.role})`;
    return 'Prashant Bajak (Super Admin & PM)';
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getManagerName(p).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderKanban className="h-6 w-6 text-cyan" />
            Project Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track active deliverables, progress percentages, assigned Project Managers, and safe workspace management.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Project
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search project name, client, service, manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full bg-surface"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-44 text-xs rounded-full bg-surface">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({projects.length})</SelectItem>
              <SelectItem value="requirement">Requirement</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="revision">Revision</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid / Skeleton State */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="rounded-3xl border-border bg-card/60 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-6 w-56 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28 rounded-full" />
                  <Skeleton className="h-3 w-12 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card/40 p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center mx-auto">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'No client projects have been created yet. Create a new project to get started.'}
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-full bg-cyan text-slate-950 font-bold text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Create First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.requirement;
            const completedMs = (project.milestones || []).filter((m) => m.status === 'completed').length;
            const totalMs = (project.milestones || []).length;
            const completedTasks = (project.tasks || []).filter((t) => t.status === 'done').length;
            const totalTasks = (project.tasks || []).length;
            const managerName = getManagerName(project);

            return (
              <Card
                key={project.id}
                className="rounded-3xl border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/50 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Top */}
                  <div className="p-6 pb-4 border-b border-border/60 bg-surface/30 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan">
                          {project.service_name}
                        </span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          {project.client?.company_name || project.client?.name || '🏢 Unassigned Client'}
                        </span>
                      </div>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-cyan transition-colors"
                      >
                        {project.project_name}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold shrink-0 ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Assigned Project Manager Banner */}
                    <div className="p-3 rounded-2xl bg-cyan/5 border border-cyan/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-bold text-xs border border-cyan/30">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan block">
                            Project Manager
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {managerName}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-card border-border font-semibold">
                        Lead In-Charge
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                        <span className="text-muted-foreground">Project Completion</span>
                        <span className="text-cyan font-black text-sm">{project.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Summary Badges: Milestones & Tasks */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-surface/50 border border-border/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Milestones
                        </span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {completedMs} / {totalMs} Done
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-surface/50 border border-border/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Tasks
                        </span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {completedTasks} / {totalTasks} Done
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-surface/50 border border-border/60 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Value
                        </span>
                        <span className="text-sm font-extrabold text-emerald-500 mt-0.5 block">
                          ₹{(project.project_value || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Description snippet */}
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-cyan" />
                        <span>Start: {project.start_date || 'Feb 2026'}</span>
                        {project.expected_completion_date && (
                          <span>→ Due: {project.expected_completion_date}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {(project.updates || []).length} Updates Posted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action with Edit & Safe Delete buttons */}
                <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenEditModal(project, e)}
                      className="rounded-full h-8 text-xs font-semibold border-border hover:border-cyan hover:text-cyan"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenDeleteModal(project, e)}
                      className="rounded-full h-8 text-xs font-semibold border-border text-rose-500 hover:bg-rose-500/10 hover:border-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                  <Button asChild size="sm" className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-4">
                    <Link href={`/admin/projects/${project.id}`}>
                      Workspace <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 1. Create Project Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-cyan" />
              Create New Client Project
            </DialogTitle>
            <DialogDescription className="text-xs">
              Initialize client workspace, assign project manager and team members, and configure deliverables.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Name *</label>
              <Input
                placeholder="e.g. ABC Hospital Website & Online Booking"
                value={newProject.project_name || ''}
                onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select Client *</label>
                <Select
                  value={newProject.client_id || ''}
                  onValueChange={(val) => setNewProject({ ...newProject, client_id: val })}
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
                  value={newProject.service_name || 'Website Development'}
                  onValueChange={(val) => setNewProject({ ...newProject, service_name: val })}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={newProject.start_date || ''}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Expected Completion</label>
                <Input
                  type="date"
                  value={newProject.expected_completion_date || ''}
                  onChange={(e) => setNewProject({ ...newProject, expected_completion_date: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Project Value (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 48000"
                  value={newProject.project_value || ''}
                  onChange={(e) => setNewProject({ ...newProject, project_value: parseFloat(e.target.value) || 0 })}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Assigned Project Manager *</label>
                <Select
                  value={newProject.assigned_manager_id || 'team-2'}
                  onValueChange={(val) => setNewProject({ ...newProject, assigned_manager_id: val })}
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
                <label className="text-xs font-bold text-foreground">Initial Status / Stage</label>
                <Select
                  value={newProject.status || 'requirement'}
                  onValueChange={(val: ProjectStatus) => {
                    const defaultProg = val === 'not_started' ? 0 : val === 'completed' || val === 'delivered' ? 100 : val === 'planning' ? 30 : val === 'design' ? 45 : val === 'development' ? 65 : val === 'testing' ? 80 : val === 'revision' ? 90 : 15;
                    setNewProject({
                      ...newProject,
                      status: val,
                      progress_percentage: defaultProg,
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Project Description & Scope</label>
              <Textarea
                placeholder="Details of client requirements, deliverables, and integration specs..."
                value={newProject.description || ''}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="text-xs rounded-xl"
              />
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
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Project Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Edit className="h-5 w-5 text-cyan" />
              Edit Project Details & Stage
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modify project name, stage status, progress percentage, assigned Project Manager, and schedule.
            </DialogDescription>
          </DialogHeader>

          {editingProject && (
            <form onSubmit={handleSaveEditedProject} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Project Name *</label>
                <Input
                  placeholder="e.g. ABC Hospital Website & Online Booking"
                  value={editingProject.project_name || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, project_name: e.target.value })}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Client *</label>
                  <Select
                    value={editingProject.client_id || 'unassigned'}
                    onValueChange={(val) =>
                      setEditingProject({ ...editingProject, client_id: val === 'unassigned' ? '' : val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Choose Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">🏢 Unassigned / Internal Workspace</SelectItem>
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
                    value={editingProject.service_name || 'Website Development'}
                    onValueChange={(val) => setEditingProject({ ...editingProject, service_name: val })}
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
                  <label className="text-xs font-bold text-foreground">Project Stage / Status</label>
                  <Select
                    value={editingProject.status}
                    onValueChange={(val: ProjectStatus) => {
                      const defaultProg = val === 'not_started' ? 0 : val === 'completed' || val === 'delivered' ? 100 : val === 'planning' ? 30 : val === 'design' ? 45 : val === 'development' ? 65 : val === 'testing' ? 80 : val === 'revision' ? 90 : 15;
                      setEditingProject({
                        ...editingProject,
                        status: val,
                        progress_percentage: val === 'not_started' ? 0 : val === 'completed' || val === 'delivered' ? 100 : (editingProject.progress_percentage === 0 ? defaultProg : editingProject.progress_percentage),
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-card">
                      <SelectValue placeholder="Change Status" />
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
                    Completion Progress ({editingProject.progress_percentage || 0}%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingProject.progress_percentage ?? 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
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
                    value={editingProject.start_date || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, start_date: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Expected Completion</label>
                  <Input
                    type="date"
                    value={editingProject.expected_completion_date || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, expected_completion_date: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Project Value (₹)</label>
                  <Input
                    type="number"
                    value={editingProject.project_value || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, project_value: parseFloat(e.target.value) || 0 })}
                    className="h-9 text-xs rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Assigned Project Manager</label>
                <Select
                  value={editingProject.assigned_manager_id || 'team-2'}
                  onValueChange={(val) => setEditingProject({ ...editingProject, assigned_manager_id: val })}
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
                  placeholder="Details of client requirements..."
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border flex sm:justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-full text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-6 shadow-md"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. GitHub-Style Safe Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

          {projectToDelete && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs">
                <p className="text-muted-foreground">To confirm deletion, type the exact project name below:</p>
                <p className="font-mono font-black text-foreground mt-1 select-all break-words">
                  {projectToDelete.project_name}
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
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="rounded-full text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSafeDelete}
                  disabled={deleteConfirmInput.trim() !== projectToDelete.project_name.trim()}
                  className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black text-xs px-5 w-full sm:w-auto disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Permanently Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
