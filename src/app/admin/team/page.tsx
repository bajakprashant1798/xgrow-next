'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Check,
  Edit2,
  Trash2,
  Crown,
  ShieldCheck,
  ArrowUpRight,
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
import { toast } from 'sonner';
import {
  getTeamMembers,
  saveTeamMember,
  deleteTeamMember,
  getProjects,
  getRoles,
  updateTaskStatus,
  subscribeToDataChanges,
} from '@/lib/db';
import { TeamMemberModel, ProjectModel, CustomRoleModel, TaskModel } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

export default function TeamManagementPage() {
  const { isAdmin } = useAuth();
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMemberModel> | null>(null);

  const loadData = async () => {
    const [t, p, r] = await Promise.all([getTeamMembers(), getProjects(), getRoles()]);
    setTeam(t);
    setProjects(p);
    setRoles(r);
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const openCreateDialog = () => {
    const defaultRoleKey = roles.find((r) => !r.is_system)?.key || 'developer';
    setEditingMember({
      name: '',
      email: '',
      phone: '',
      role: defaultRoleKey,
      department: 'Engineering',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (member: TeamMemberModel) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.email) {
      toast.error('Name and Email are required');
      return;
    }

    try {
      await saveTeamMember(editingMember as any);
      toast.success(editingMember.id ? 'Team member updated!' : 'New employee added successfully!');
      setIsDialogOpen(false);
      setEditingMember(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save team member');
    }
  };

  const handleDeleteMember = async (member: TeamMemberModel) => {
    if (member.email === 'bajakprashant1998@gmail.com') {
      toast.error('Cannot remove the primary Super Admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.name} from the agency team?`)) {
      return;
    }

    try {
      const ok = await deleteTeamMember(member.id);
      if (ok) {
        toast.success(`Removed ${member.name} from team.`);
        loadData();
      } else {
        toast.error('Could not delete member');
      }
    } catch (err) {
      toast.error('Failed to remove team member');
    }
  };

  const handleToggleTask = async (projectId: string, task: TaskModel) => {
    const newStatus = task.status === 'done' ? 'in_progress' : 'done';
    await updateTaskStatus(projectId, task.id, newStatus);
    toast.success(newStatus === 'done' ? 'Task completed!' : 'Task reopened');
    loadData();
  };

  const getRoleDisplayName = (roleKey?: string) => {
    if (!roleKey) return 'Staff';
    const found = roles.find((r) => r.key === roleKey || r.id === roleKey);
    if (found) return found.name;
    return roleKey.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Collect tasks by employee
  const allTasksWithProject = projects.flatMap((p) =>
    (p.tasks || []).map((t) => ({ ...t, projectId: p.id, projectName: p.project_name }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-cyan" />
            Team & Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Admin can add employees, assign custom roles, oversee tasks, and manage staff access.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin/roles">
            <Button
              variant="outline"
              className="rounded-full border-border hover:border-cyan/40 font-bold text-xs px-4"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-cyan" />
              Manage Roles & Permissions
              <ArrowUpRight className="h-3 w-3 ml-1 text-muted-foreground" />
            </Button>
          </Link>
          <Button
            onClick={openCreateDialog}
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member) => {
          const isSuperAdmin = member.email === 'bajakprashant1998@gmail.com';
          const memberTasks = allTasksWithProject.filter((t) => t.assigned_to === member.id);
          const completedTasks = memberTasks.filter((t) => t.status === 'done').length;
          const roleName = isSuperAdmin ? 'Super Admin' : getRoleDisplayName(member.role);

          return (
            <Card
              key={member.id}
              className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                isSuperAdmin
                  ? 'border-cyan/60 bg-gradient-to-br from-card via-cyan/5 to-card shadow-lg'
                  : 'border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan/40'
              }`}
            >
              <div>
                <div className="p-6 pb-4 border-b border-border/60 bg-surface/30 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm border ${
                        isSuperAdmin
                          ? 'bg-cyan text-slate-950 border-cyan'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-base text-foreground">
                          {member.name}
                        </h3>
                        {isSuperAdmin && (
                          <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-cyan capitalize">
                        {roleName} · {member.department}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-bold ${
                      isSuperAdmin
                        ? 'border-cyan text-cyan bg-cyan/15'
                        : 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Active'}
                  </Badge>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-cyan" />
                    <span className="font-mono text-[11px] text-foreground">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-cyan" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Assigned Tasks */}
                  <div className="pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Assigned Project Tasks
                      </p>
                      <span className="text-[10px] font-extrabold text-cyan">
                        {completedTasks}/{memberTasks.length} Done
                      </span>
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {memberTasks.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic py-1">
                          No active tasks assigned currently.
                        </p>
                      ) : (
                        memberTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs transition-colors ${
                              task.status === 'done'
                                ? 'bg-surface/40 border-border opacity-70'
                                : 'bg-card border-border hover:border-cyan/40'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task.projectId, task)}
                                className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                                  task.status === 'done'
                                    ? 'bg-cyan border-cyan text-slate-950'
                                    : 'border-border bg-surface'
                                }`}
                              >
                                {task.status === 'done' && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    task.status === 'done'
                                      ? 'line-through text-muted-foreground'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {task.projectName}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase text-amber-500">
                              {task.priority}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground capitalize">
                  Role: <strong className="text-foreground">{roleName}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(member)}
                    className="rounded-full text-xs font-semibold h-8 px-3 border-border"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  {!isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMember(member)}
                      className="rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Member Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-cyan" />
              {editingMember?.id ? 'Edit Team Member Profile' : 'Add Employee / Team Member'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure employee profile and assign them to an agency role.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <form onSubmit={handleSaveMember} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Full Name *</label>
                <Input
                  placeholder="e.g. Aman Saxena"
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Email (Login ID) *</label>
                <Input
                  type="email"
                  placeholder="e.g. aman@xgro.in"
                  value={editingMember.email || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Assigned Role</label>
                  <Select
                    value={editingMember.role || 'developer'}
                    onValueChange={(val: string) =>
                      setEditingMember({ ...editingMember, role: val })
                    }
                  >
                    <SelectTrigger className="text-xs rounded-xl h-9">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.key !== 'client')
                        .map((r) => (
                          <SelectItem key={r.id} value={r.key || r.id} className="text-xs">
                            {r.name} {r.is_system ? '(System)' : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Department</label>
                  <Input
                    placeholder="e.g. Frontend Engineering"
                    value={editingMember.department || ''}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, department: e.target.value })
                    }
                    className="text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
                <Input
                  placeholder="e.g. +91 98222 33445"
                  value={editingMember.phone || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6"
                >
                  Save Employee Profile
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
