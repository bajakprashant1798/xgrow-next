'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Lock,
  Unlock,
  Check,
  X,
  Edit2,
  Trash2,
  Users,
  Sparkles,
  Shield,
  Key,
  Info,
  CheckCircle2,
  AlertCircle,
  Layers,
  Crown,
  UserPlus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  getRoles,
  saveRole,
  deleteRole,
  getTeamMembers,
  saveTeamMember,
  updateUserRoleAndProfile,
  subscribeToDataChanges,
} from '@/lib/db';
import { CustomRoleModel, TeamMemberModel, PermissionMatrix } from '@/lib/supabase/types';
import {
  PERMISSION_MODULES,
  DEFAULT_EMPTY_PERMISSIONS,
  DEFAULT_FULL_PERMISSIONS,
  ROLE_PRESET_TEMPLATES,
  ModuleDefinition,
} from '@/lib/permissions';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default function RolesManagementPage() {
  const { user, isAdmin, refreshUserData, hasPermission } = useAuth();
  const canManageRoles = isAdmin || hasPermission('team_roles', 'manage_permissions');

  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [team, setTeam] = useState<TeamMemberModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<CustomRoleModel> | null>(null);
  const [activeRoleForAssign, setActiveRoleForAssign] = useState<CustomRoleModel | null>(null);
  const [selectedMemberIdForAssign, setSelectedMemberIdForAssign] = useState<string>('');

  const loadData = async () => {
    try {
      const [r, t] = await Promise.all([getRoles(), getTeamMembers()]);
      setRoles(r);
      setTeam(t);
    } catch (err) {
      console.error('Error loading roles data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  const openCreateDialog = () => {
    setEditingRole({
      name: '',
      key: '',
      description: '',
      is_system: false,
      permissions: JSON.parse(JSON.stringify(DEFAULT_EMPTY_PERMISSIONS)),
    });
    setIsRoleDialogOpen(true);
  };

  const openEditDialog = (role: CustomRoleModel) => {
    setEditingRole(JSON.parse(JSON.stringify(role)));
    setIsRoleDialogOpen(true);
  };

  const openAssignDialog = (role: CustomRoleModel) => {
    setActiveRoleForAssign(role);
    setSelectedMemberIdForAssign('');
    setIsAssignDialogOpen(true);
  };

  const applyPreset = (preset: typeof ROLE_PRESET_TEMPLATES[0]) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      name: editingRole.name || preset.name,
      description: editingRole.description || preset.description,
      permissions: JSON.parse(JSON.stringify(preset.permissions)),
    });
    toast.info(`Applied "${preset.name}" preset permissions.`);
  };

  const toggleAllPermissions = (grant: boolean) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      permissions: JSON.parse(
        JSON.stringify(grant ? DEFAULT_FULL_PERMISSIONS : DEFAULT_EMPTY_PERMISSIONS)
      ),
    });
    toast.info(grant ? 'Granted full agency permissions' : 'Cleared all permissions');
  };

  const handleTogglePermission = (
    moduleKey: keyof PermissionMatrix,
    actionKey: string
  ) => {
    if (!editingRole || !editingRole.permissions) return;
    const currentModule = (editingRole.permissions as any)[moduleKey] || {};
    const updatedModule = {
      ...currentModule,
      [actionKey]: !currentModule[actionKey],
    };

    // If enabling a write/delete permission, ensure view is also enabled
    if (!currentModule[actionKey] && actionKey !== 'view') {
      updatedModule.view = true;
    }

    setEditingRole({
      ...editingRole,
      permissions: {
        ...editingRole.permissions,
        [moduleKey]: updatedModule,
      },
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.name?.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      const saved = await saveRole(editingRole as any);
      toast.success(
        editingRole.id
          ? `Role "${saved.name}" permissions updated successfully!`
          : `Custom role "${saved.name}" created successfully!`
      );
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      await loadData();
      await refreshUserData();
    } catch (err) {
      toast.error('Failed to save role');
    }
  };

  const handleDeleteRole = async (role: CustomRoleModel) => {
    if (role.is_system) {
      toast.error('Cannot delete system fixed roles (Super Admin & Client).');
      return;
    }

    // Check if any team member is currently assigned to this role
    const assigned = team.filter((m) => m.role === role.key || m.role === role.id);
    if (assigned.length > 0) {
      if (
        !confirm(
          `There are ${assigned.length} staff member(s) assigned to "${role.name}". Deleting this role will keep their account but remove their role association. Are you sure?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to permanently delete the "${role.name}" role?`)) {
        return;
      }
    }

    try {
      await deleteRole(role.id);
      toast.success(`Role "${role.name}" deleted.`);
      await loadData();
      await refreshUserData();
    } catch (err) {
      toast.error('Failed to delete role');
    }
  };

  const handleAssignUserToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoleForAssign || !selectedMemberIdForAssign) {
      toast.error('Please select a team member');
      return;
    }

    const member = team.find((m) => m.id === selectedMemberIdForAssign);
    if (!member) return;

    try {
      await updateUserRoleAndProfile({
        id: member.id,
        email: member.email,
        name: member.name,
        phone: member.phone || '',
        newRole: activeRoleForAssign.key || activeRoleForAssign.id,
        department: member.department,
        status: member.status || 'active',
      });
      toast.success(`Assigned ${member.name} to "${activeRoleForAssign.name}" role!`);
      setIsAssignDialogOpen(false);
      setSelectedMemberIdForAssign('');
      await loadData();
      await refreshUserData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role to member');
    }
  };

  const calculatePermissionCount = (perms?: PermissionMatrix) => {
    if (!perms) return { total: 0, granted: 0, percentage: 0 };
    let total = 0;
    let granted = 0;

    Object.values(perms).forEach((moduleObj) => {
      if (typeof moduleObj === 'object' && moduleObj !== null) {
        Object.values(moduleObj).forEach((val) => {
          total++;
          if (val === true) granted++;
        });
      }
    });

    const percentage = total > 0 ? Math.round((granted / total) * 100) : 0;
    return { total, granted, percentage };
  };

  if (!canManageRoles) {
    return <AdminAccessDenied moduleName="Roles & Permissions Access Control" requiredAction="Manage Roles & RBAC (Super Admin)" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-cyan" />
              Roles & Permissions Access Control
            </h1>
            <Badge className="bg-cyan/15 text-cyan border border-cyan/30 text-[10px] font-bold">
              Super Admin Only
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Super Admin can create custom agency roles, configure granular permissions (View, Create, Edit, Delete), and assign users.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Custom Role
        </Button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-cyan/5 border border-cyan/20 flex items-start gap-3 text-xs">
        <Crown className="h-4 w-4 text-cyan shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">
            System Hierarchy Rules:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            • <strong className="text-foreground">Super Admin</strong> (Prashant Bajak) and <strong className="text-foreground">Client</strong> are permanent system roles.
            <br />
            • Super Admin can create unlimited custom roles (e.g., Project Manager, Lead Developer, UI Designer, SEO Specialist, Finance Lead) and assign permissions across all 9 agency modules.
            <br />
            • Any team member assigned to a role will strictly inherit that role's granted permissions.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Total Defined Roles</p>
          <p className="text-2xl font-black text-foreground mt-1">{roles.length}</p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Custom Roles</p>
          <p className="text-2xl font-black text-cyan mt-1">
            {roles.filter((r) => !r.is_system).length}
          </p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Assigned Staff</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{team.length}</p>
        </Card>
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Fixed System Roles</p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {roles.filter((r) => r.is_system).length}
          </p>
        </Card>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const { granted, total, percentage } = calculatePermissionCount(role.permissions);
          const isSuperAdminRole = role.is_system && role.key === 'admin';
          const isClientRole = role.is_system && role.key === 'client';
          const assignedMembers = team.filter(
            (m) => m.role === role.key || m.role === role.id || (isSuperAdminRole && m.email === 'bajakprashant1998@gmail.com')
          );

          return (
            <Card
              key={role.id}
              className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                isSuperAdminRole
                  ? 'border-cyan/50 bg-gradient-to-br from-card via-cyan/5 to-card shadow-lg'
                  : role.is_system
                  ? 'border-border bg-card/60'
                  : 'border-border bg-card/80 hover:border-cyan/40 shadow-sm'
              }`}
            >
              <div>
                {/* Role Header */}
                <div className="p-5 pb-4 border-b border-border/60 bg-surface/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm border shrink-0 ${
                        isSuperAdminRole
                          ? 'bg-cyan text-slate-950 border-cyan'
                          : role.is_system
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {isSuperAdminRole ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <Shield className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-foreground">
                          {role.name}
                        </h3>
                        {role.is_system ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold border-amber-500/40 text-amber-400 bg-amber-500/10"
                          >
                            Fixed System Role
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold border-cyan/40 text-cyan bg-cyan/10"
                          >
                            Custom Role
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        Role Key: <span className="text-cyan">@{role.key || role.name.toLowerCase()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      Coverage
                    </span>
                    <span
                      className={`text-xs font-black ${
                        percentage === 100
                          ? 'text-cyan'
                          : percentage > 40
                          ? 'text-indigo-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isSuperAdminRole ? '100% (Full Access)' : `${percentage}% (${granted}/${total})`}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  {/* Description */}
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {role.description || 'No description provided for this role.'}
                  </p>

                  {/* Assigned Team Members */}
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-cyan" />
                        Assigned Users ({assignedMembers.length})
                      </p>
                      {!isClientRole && (
                        <button
                          type="button"
                          onClick={() => openAssignDialog(role)}
                          className="text-[10px] font-bold text-cyan hover:underline flex items-center gap-1"
                        >
                          <UserPlus className="h-2.5 w-2.5" /> Assign User
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {assignedMembers.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          No users assigned to this role yet.
                        </span>
                      ) : (
                        assignedMembers.map((m) => (
                          <Badge
                            key={m.id}
                            variant="secondary"
                            className="text-[11px] font-semibold rounded-lg bg-surface/80 border border-border flex items-center gap-1 py-0.5 px-2"
                          >
                            <span className="h-3.5 w-3.5 rounded-full bg-cyan/20 text-cyan text-[8px] font-black flex items-center justify-center">
                              {m.name.slice(0, 1).toUpperCase()}
                            </span>
                            {m.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Permission Matrix Preview */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Module Access Breakdown
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {PERMISSION_MODULES.map((mod) => {
                        const modulePerms = (role.permissions as any)?.[mod.key] || {};
                        const enabledActions = mod.actions.filter((a) => modulePerms[a.key] === true);

                        return (
                          <div
                            key={mod.key}
                            className={`p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                              enabledActions.length > 0
                                ? 'bg-surface/50 border-border/80'
                                : 'bg-surface/20 border-border/30 opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-[11px]">
                                {mod.name}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground">
                                {enabledActions.length}/{mod.actions.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {enabledActions.length === 0 ? (
                                <span className="text-[9px] text-muted-foreground italic">No access</span>
                              ) : (
                                enabledActions.map((act) => (
                                  <span
                                    key={act.key}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20 font-medium"
                                  >
                                    {act.key === 'create_edit'
                                      ? 'Edit'
                                      : act.key === 'update_progress'
                                      ? 'Progress'
                                      : act.key}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(role)}
                    className="rounded-full text-xs font-semibold h-8 px-3 border-border hover:border-cyan/40"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    {role.is_system ? 'View Permissions' : 'Configure Permissions'}
                  </Button>
                </div>

                {!role.is_system && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRole(role)}
                    className="rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* CREATE / EDIT ROLE DIALOG */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan" />
              {editingRole?.id ? `Configure Role: ${editingRole.name}` : 'Create New Custom Role'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the role identity and configure precise permissions across all agency modules.
            </DialogDescription>
          </DialogHeader>

          {editingRole && (
            <form onSubmit={handleSaveRole} className="space-y-6 mt-2">
              {/* Presets Bar */}
              {!editingRole.is_system && (
                <div className="p-3.5 rounded-2xl bg-surface/80 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-cyan" /> Quick Role Presets:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(true)}
                        className="text-[10px] font-bold text-cyan hover:underline px-1.5"
                      >
                        Grant All
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(false)}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-1.5"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_PRESET_TEMPLATES.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="rounded-xl text-[11px] h-7 border-border hover:border-cyan/40 bg-card/60"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Role Name *</label>
                  <Input
                    placeholder="e.g. Lead QA Engineer"
                    value={editingRole.name || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    disabled={editingRole.is_system}
                    required
                    className="text-xs rounded-xl h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Role Identifier Key</label>
                  <Input
                    placeholder="e.g. lead_qa"
                    value={editingRole.key || ''}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      })
                    }
                    disabled={editingRole.is_system}
                    className="text-xs rounded-xl h-9 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Role Description</label>
                <Textarea
                  placeholder="Describe what responsibilities and scope this role has in the agency..."
                  value={editingRole.description || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  rows={2}
                  disabled={editingRole.is_system}
                  className="text-xs rounded-xl resize-none"
                />
              </div>

              {/* Granular Permissions Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Granular Module Permissions
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Click checkboxes to toggle access
                  </span>
                </div>

                <div className="space-y-3">
                  {PERMISSION_MODULES.map((mod) => {
                    const modulePerms = (editingRole.permissions as any)?.[mod.key] || {};

                    return (
                      <div
                        key={mod.key}
                        className="p-3.5 rounded-2xl border border-border bg-surface/30 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-extrabold text-foreground">{mod.name}</p>
                            <p className="text-[11px] text-muted-foreground">{mod.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                          {mod.actions.map((act) => {
                            const isChecked = !!modulePerms[act.key];

                            return (
                              <label
                                key={act.key}
                                className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-cyan/10 border-cyan/40 text-foreground'
                                    : 'bg-card border-border/60 text-muted-foreground hover:border-border'
                                } ${editingRole.is_system ? 'cursor-not-allowed opacity-80' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={editingRole.is_system}
                                  onChange={() => handleTogglePermission(mod.key, act.key)}
                                  className="mt-0.5 rounded text-cyan focus:ring-cyan h-3.5 w-3.5 rounded border-border"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-bold leading-none">{act.label}</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight">
                                    {act.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRoleDialogOpen(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                {!editingRole.is_system ? (
                  <Button
                    type="submit"
                    className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-6"
                  >
                    Save Role & Permissions
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsRoleDialogOpen(false)}
                    className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6"
                  >
                    Close (System Protected)
                  </Button>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSIGN USER TO ROLE DIALOG */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan" />
              Assign User to Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign an agency employee to the{' '}
              <strong className="text-foreground">{activeRoleForAssign?.name}</strong> role.
            </DialogDescription>
          </DialogHeader>

          {activeRoleForAssign && (
            <form onSubmit={handleAssignUserToRole} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Select Team Member</label>
                <Select
                  value={selectedMemberIdForAssign}
                  onValueChange={(val) => setSelectedMemberIdForAssign(val)}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Choose an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name} ({m.email}) — Current: {m.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-surface/60 border border-border text-[11px] space-y-1 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Target Role:</strong> {activeRoleForAssign.name}
                </p>
                <p>{activeRoleForAssign.description}</p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={!selectedMemberIdForAssign}
                  className="w-full rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs h-10"
                >
                  Confirm Role Assignment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
