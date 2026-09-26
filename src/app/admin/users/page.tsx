'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building,
  FolderKanban,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Zap,
  Power,
  ShieldAlert,
  Dices,
  Share2,
  Briefcase,
  Layers,
  ChevronRight,
  Filter,
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
  getAllUsers,
  UnifiedUserModel,
  createUserWithRole,
  toggleUserStatus,
  resetUserPassword,
  generateSecurePassword,
  checkUserEmailExists,
  updateUserRoleAndProfile,
  getRoles,
  getProjects,
  assignProjectsToClient,
  saveClient,
  saveTeamMember,
  subscribeToDataChanges,
  EmailCheckResult,
} from '@/lib/db';
import { CustomRoleModel, ProjectModel } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';

export default function UsersManagementPage() {
  const { user: currentAuthUser, isAdmin } = useAuth();

  const [users, setUsers] = useState<UnifiedUserModel[]>([]);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'client' | 'team' | 'admin' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState('client');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('Engineering');
  const [newUserPlan, setNewUserPlan] = useState('Growth Plan (₹39,999)');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserNotes, setNewUserNotes] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Edit User & Change Role Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UnifiedUserModel | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('client');
  const [editDepartment, setEditDepartment] = useState('Engineering');
  const [editCompany, setEditCompany] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'pending_approval'>('active');

  // Email duplicate check state
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResult | null>(null);

  // Share / Copy Credentials Dialog state
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
  const [resetTargetUser, setResetTargetUser] = useState<UnifiedUserModel | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Assign Projects Modal state
  const [isAssignProjectsModalOpen, setIsAssignProjectsModalOpen] = useState(false);
  const [assignTargetClient, setAssignTargetClient] = useState<UnifiedUserModel | null>(null);
  const [clientProjectIds, setClientProjectIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      const [u, r, p] = await Promise.all([getAllUsers(), getRoles(), getProjects()]);
      setUsers(u);
      setRoles(r);
      setProjects(p);
    } catch (e) {
      console.warn('Error loading users list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Debounced Email Check for User Creation
  useEffect(() => {
    const clean = newUserEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setEmailCheckStatus('idle');
      setEmailCheckResult(null);
      return;
    }

    setEmailCheckStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await checkUserEmailExists(clean);
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
  }, [newUserEmail]);

  const openCreateDialog = () => {
    const generated = generateSecurePassword(12);
    setNewUserRole('client');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserCompany('');
    setNewUserDepartment('Engineering');
    setNewUserPlan('Growth Plan (₹39,999)');
    setNewUserAddress('');
    setNewUserNotes('');
    setNewUserPassword(generated);
    setShowPassword(false);
    setSelectedProjectIds([]);
    setEmailCheckStatus('idle');
    setEmailCheckResult(null);
    setIsCreateDialogOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const pass = generateSecurePassword(12);
    setNewUserPassword(pass);
    toast.success('Generated strong secure password!');
  };

  const handleGenerateResetPassword = () => {
    const pass = generateSecurePassword(12);
    setNewResetPassword(pass);
    toast.success('Generated new secure password!');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Full Name and Email are required');
      return;
    }

    if (emailCheckStatus === 'duplicate' && emailCheckResult?.exists) {
      toast.error(`Email "${newUserEmail}" is already in use by ${emailCheckResult.name} (${emailCheckResult.role}).`);
      return;
    }

    try {
      const finalPassword = newUserPassword.trim() || generateSecurePassword(12);
      const res = await createUserWithRole({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        phone: newUserPhone.trim(),
        role: newUserRole,
        password: finalPassword,
        company_name: newUserCompany.trim() || `${newUserName.trim()}'s Business`,
        department: newUserDepartment,
        address: newUserAddress,
        selected_plan: newUserPlan,
        notes: newUserNotes,
        assignedProjectIds: selectedProjectIds,
      });

      setIsCreateDialogOpen(false);
      loadData();

      // Show formatted credentials modal
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
      const roleDisplayName =
        newUserRole === 'client'
          ? 'Client (Portal Workspace)'
          : roles.find((r) => r.key === newUserRole)?.name || newUserRole.toUpperCase();

      setCredentialsData({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: finalPassword,
        roleDisplayName,
        loginUrl: `${origin}/login`,
      });
      setIsCredentialsModalOpen(true);
      toast.success(`User "${newUserName}" created successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const openEditUserModal = (u: UnifiedUserModel) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditDepartment(u.department || 'Engineering');
    setEditCompany(u.company_name || '');
    setEditStatus(u.status);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim()) {
      toast.error('Full Name is required');
      return;
    }

    try {
      await updateUserRoleAndProfile({
        id: editingUser.id,
        email: editingUser.email,
        name: editName.trim(),
        phone: editPhone.trim(),
        newRole: editRole,
        department: editDepartment,
        company_name: editCompany,
        status: editStatus,
      });

      toast.success(`Updated role & profile for ${editName.trim()}!`);
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user profile and role');
    }
  };

  const handleToggleStatus = async (user: UnifiedUserModel) => {
    if (user.email.toLowerCase() === 'bajakprashant1998@gmail.com') {
      toast.error('Cannot deactivate the primary Super Admin account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionWord = nextStatus === 'active' ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${actionWord} the account for ${user.name} (${user.email})? ${nextStatus === 'inactive' ? 'The user will immediately be blocked from logging in.' : 'The user will regain portal access.'}`)) {
      return;
    }

    try {
      await toggleUserStatus(user.id, user.userType, nextStatus);
      toast.success(`Account for ${user.name} is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const openResetPasswordModal = (user: UnifiedUserModel) => {
    setResetTargetUser(user);
    const pass = generateSecurePassword(12);
    setNewResetPassword(pass);
    setShowResetPassword(false);
    setIsResetPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (!newResetPassword.trim() || newResetPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await resetUserPassword(resetTargetUser.email, newResetPassword.trim());
      setIsResetPasswordModalOpen(false);
      loadData();

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
      setCredentialsData({
        name: resetTargetUser.name,
        email: resetTargetUser.email,
        password: res.password,
        roleDisplayName: resetTargetUser.roleDisplayName,
        loginUrl: `${origin}/login`,
      });
      setIsCredentialsModalOpen(true);
      toast.success(`Password reset successfully for ${resetTargetUser.name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const openAssignProjectsModal = (clientUser: UnifiedUserModel) => {
    setAssignTargetClient(clientUser);
    const cleanEmail = clientUser.email.trim().toLowerCase();
    const currentAssigned = projects
      .filter(
        (p) =>
          p.client_id === clientUser.id ||
          (cleanEmail &&
            (p.client?.email?.toLowerCase() === cleanEmail ||
              p.client_id?.toLowerCase() === cleanEmail))
      )
      .map((p) => p.id);
    setClientProjectIds(currentAssigned);
    setIsAssignProjectsModalOpen(true);
  };

  const handleSaveAssignedProjects = async () => {
    if (!assignTargetClient) return;

    try {
      await assignProjectsToClient(assignTargetClient.id, clientProjectIds, assignTargetClient.email);
      toast.success(`Updated assigned projects for ${assignTargetClient.name}!`);
      setIsAssignProjectsModalOpen(false);
      setAssignTargetClient(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign projects');
    }
  };

  const handleCopyCredentials = () => {
    if (!credentialsData) return;
    const text = `🔐 *XGRO PLATFORM ACCESS CREDENTIALS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *User Name:* ${credentialsData.name}
🎖️ *Role:* ${credentialsData.roleDisplayName}
📧 *Email / Login ID:* ${credentialsData.email}
🔑 *Temporary Password:* ${credentialsData.password}
🌐 *Portal Login URL:* ${credentialsData.loginUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_Please keep these credentials secure. You can sign in and change your password anytime._`;

    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard! Ready to send via WhatsApp or Email.');
  };

  // Metrics
  const totalCount = users.length;
  const clientCount = users.filter((u) => u.userType === 'client').length;
  const teamCount = users.filter((u) => u.userType === 'team').length;
  const inactiveCount = users.filter((u) => u.status === 'inactive').length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleDisplayName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'client') return u.userType === 'client';
    if (categoryFilter === 'team') return u.userType === 'team';
    if (categoryFilter === 'admin') return u.role === 'admin' || u.role === 'super_admin';
    if (categoryFilter === 'inactive') return u.status === 'inactive';
    return true;
  });

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'admin' || role === 'super_admin') {
      return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
    }
    if (role === 'client') {
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
    }
    if (role === 'manager') {
      return 'border-blue-500/40 bg-blue-500/10 text-blue-400';
    }
    if (role === 'developer') {
      return 'border-cyan/40 bg-cyan/10 text-cyan';
    }
    if (role === 'designer') {
      return 'border-purple-500/40 bg-purple-500/10 text-purple-400';
    }
    if (role === 'seo_specialist') {
      return 'border-orange-500/40 bg-orange-500/10 text-orange-400';
    }
    return 'border-border bg-surface text-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-cyan" />
            Users Management & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Super Admin directory for all platform users (Clients, Staff, Admins). Generate passwords, copy credentials, assign projects, and toggle active status.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add New User & Generate Password
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4 text-cyan" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalCount}</p>
          <p className="text-[10px] text-muted-foreground">Active in database backend</p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Client Accounts</span>
            <Building className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{clientCount}</p>
          <p className="text-[10px] text-muted-foreground">Portal workspace users</p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Staff & Admins</span>
            <UserCheck className="h-4 w-4 text-cyan" />
          </div>
          <p className="text-2xl font-black text-cyan">{teamCount}</p>
          <p className="text-[10px] text-muted-foreground">{adminCount} Super Admin(s)</p>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inactive Accounts</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{inactiveCount}</p>
          <p className="text-[10px] text-muted-foreground">Login access deactivated</p>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
        <Tabs
          value={categoryFilter}
          onValueChange={(val: any) => setCategoryFilter(val)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-5 bg-surface/80 rounded-xl p-1 border border-border">
            <TabsTrigger value="all" className="rounded-lg text-xs font-bold py-1.5">
              All ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="client" className="rounded-lg text-xs font-bold py-1.5 text-emerald-400">
              Clients ({clientCount})
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg text-xs font-bold py-1.5 text-cyan">
              Staff ({teamCount})
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg text-xs font-bold py-1.5 text-amber-400">
              Admins ({adminCount})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg text-xs font-bold py-1.5 text-rose-400">
              Inactive ({inactiveCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full bg-surface"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading && users.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card/60 p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-12 w-full rounded-xl" />
          ))}
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card/40 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center mx-auto">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Users Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `No user matches "${searchQuery}" under ${categoryFilter} filter.`
              : 'No users registered in this category.'}
          </p>
        </Card>
      ) : (
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">User Account</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Organization / Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Workspaces</th>
                  <th className="p-4">Credentials</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => {
                  const isInactive = u.status === 'inactive';
                  const isPending = u.status === 'pending_approval';
                  const isSuperAdminAccount = u.email.toLowerCase() === 'bajakprashant1998@gmail.com';

                  return (
                    <tr
                      key={`${u.userType}-${u.id}`}
                      className={`hover:bg-surface/40 transition-colors ${
                        isInactive ? 'opacity-65 bg-surface/20' : ''
                      }`}
                    >
                      {/* User Info */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${
                              u.userType === 'client'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-cyan/20 text-cyan border-cyan/40'
                            }`}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-xs truncate">{u.name}</span>
                              {isSuperAdminAccount && (
                                <Badge className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/40 uppercase font-black">
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <p className="font-mono text-[11px] text-muted-foreground truncate">{u.email}</p>
                            {u.phone && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">{u.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Role */}
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {u.roleDisplayName}
                        </Badge>
                      </td>

                      {/* Organization / Dept */}
                      <td className="p-4 text-foreground/90">
                        {u.userType === 'client' ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold flex items-center gap-1 text-xs">
                              <Building className="h-3 w-3 text-cyan shrink-0" />
                              {u.company_name || 'Individual Client'}
                            </span>
                            {u.selected_plan && (
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                                {u.selected_plan}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-xs flex items-center gap-1">
                            <Briefcase className="h-3 w-3 text-cyan shrink-0" />
                            {u.department || 'Agency Operations'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-extrabold ${
                            isPending
                              ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                              : isInactive
                              ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                              : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {isPending ? 'Pending' : isInactive ? 'Inactive' : 'Active'}
                        </Badge>
                      </td>

                      {/* Workspaces */}
                      <td className="p-4">
                        {u.assignedProjectsCount > 0 || u.userType === 'client' ? (
                          <button
                            onClick={() => openAssignProjectsModal(u)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan hover:underline"
                            title="View & Assign Client Projects"
                          >
                            <FolderKanban className="h-3.5 w-3.5" />
                            <span>{u.assignedProjectsCount} Project(s)</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Staff Member (0 Projects)</span>
                        )}
                      </td>

                      {/* Credentials Status */}
                      <td className="p-4">
                        {u.hasTemporaryPassword ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xgro.in';
                              setCredentialsData({
                                name: u.name,
                                email: u.email,
                                password: u.temporaryPassword || 'Generated Password',
                                roleDisplayName: u.roleDisplayName,
                                loginUrl: `${origin}/login`,
                              });
                              setIsCredentialsModalOpen(true);
                            }}
                            className="h-7 text-[10px] font-bold rounded-full border-cyan/40 text-cyan hover:bg-cyan/10 px-2.5"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy Credentials
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Encrypted / User-Set
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Edit Profile & Change Role Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditUserModal(u)}
                            className="h-7 text-[11px] font-semibold rounded-full border-border hover:border-cyan/40 px-2.5"
                            title="Edit User Profile & Change Role"
                          >
                            <Edit2 className="h-3 w-3 mr-1 text-cyan" /> Edit Role
                          </Button>

                          {/* Reset Password Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResetPasswordModal(u)}
                            className="h-7 text-[11px] font-semibold rounded-full border-border hover:border-cyan/40 px-2.5"
                            title="Reset Password & Share"
                          >
                            <KeyRound className="h-3 w-3 mr-1 text-cyan" /> Reset Password
                          </Button>

                          {/* Assign Projects */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignProjectsModal(u)}
                            className="h-7 text-[11px] font-semibold rounded-full border-border hover:border-cyan/40 px-2.5 hidden sm:inline-flex"
                            title="Assign Projects"
                          >
                            <FolderKanban className="h-3 w-3 text-cyan" />
                          </Button>

                          {/* Toggle Active / Inactive Status (Cannot delete) */}
                          {!isSuperAdminAccount && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(u)}
                              className={`h-7 px-2 rounded-full text-xs font-bold transition-colors ${
                                isInactive
                                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                              }`}
                              title={isInactive ? 'Activate Account' : 'Deactivate Account'}
                            >
                              <Power className="h-3.5 w-3.5 mr-1" />
                              {isInactive ? 'Activate' : 'Deactivate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credentials Created / Ready to Share Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan" />
              Login Credentials Ready
            </DialogTitle>
            <DialogDescription className="text-xs">
              Copy this formatted credential card to securely share with the user via WhatsApp, Email, or Slack.
            </DialogDescription>
          </DialogHeader>

          {credentialsData && (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-2xl bg-surface/80 border border-cyan/40 space-y-2.5 font-mono text-xs shadow-inner">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground font-sans">Name:</span>
                  <span className="font-bold text-foreground font-sans">{credentialsData.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground font-sans">Role:</span>
                  <span className="font-bold text-cyan font-sans">{credentialsData.roleDisplayName}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground font-sans">Email / Login ID:</span>
                  <span className="font-bold text-foreground">{credentialsData.email}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 items-center">
                  <span className="text-muted-foreground font-sans">Temporary Password:</span>
                  <span className="font-extrabold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md">
                    {credentialsData.password}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-muted-foreground font-sans">Login Portal:</span>
                  <span className="font-semibold text-cyan truncate max-w-[200px]">
                    {credentialsData.loginUrl}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="w-full rounded-full bg-cyan text-slate-950 font-black text-xs h-10 shadow-md flex items-center justify-center gap-2"
                >
                  <Copy className="h-4 w-4" /> Copy Complete Credentials (WhatsApp / Email Format)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="w-full rounded-full text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset User Password Modal */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan" />
              Reset User Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate a new replacement password for <strong>{resetTargetUser?.name}</strong> ({resetTargetUser?.email}). Existing passwords are encrypted for zero-knowledge security.
            </DialogDescription>
          </DialogHeader>

          {resetTargetUser && (
            <form onSubmit={handleConfirmResetPassword} className="space-y-4 mt-2">
              <div className="p-3 rounded-2xl bg-surface/60 border border-border text-xs space-y-1">
                <p className="font-bold text-foreground">{resetTargetUser.name}</p>
                <p className="text-muted-foreground font-mono text-[11px]">{resetTargetUser.email}</p>
                <Badge variant="outline" className="text-[9px] mt-1 text-cyan border-cyan/30">
                  {resetTargetUser.roleDisplayName}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">New Password *</label>
                  <button
                    type="button"
                    onClick={handleGenerateResetPassword}
                    className="text-[10px] font-bold text-cyan hover:underline flex items-center gap-1"
                  >
                    <Dices className="h-3 w-3" /> 🎲 Generate Random
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Enter or generate password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    required
                    className="text-xs rounded-xl h-9 pr-8 font-mono bg-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showResetPassword ? <EyeOff className="h-3.5 w-3.5 text-cyan" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Confirm & Generate Credentials
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User & Generate Password Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan" />
              Add User & Generate Credentials
            </DialogTitle>
            <DialogDescription className="text-xs">
              Super Admin can create any account (Client or Staff), generate a secure password, and copy credentials to send to the user.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Account Role / Type *</label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="text-xs rounded-xl h-10 bg-surface/60">
                  <SelectValue placeholder="Select Account Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">👤 Client (Client Portal Workspace)</SelectItem>
                  <SelectItem value="admin">👑 Super Admin (Full Control)</SelectItem>
                  <SelectItem value="manager">📊 Project Manager</SelectItem>
                  <SelectItem value="developer">💻 Developer / Engineer</SelectItem>
                  <SelectItem value="designer">🎨 UI/UX Designer</SelectItem>
                  <SelectItem value="seo_specialist">🚀 SEO & Growth Specialist</SelectItem>
                  {roles
                    .filter(
                      (r) =>
                        !['client', 'admin', 'super_admin', 'manager', 'developer', 'designer', 'seo_specialist'].includes(
                          r.key || ''
                        ) &&
                        !['client', 'admin', 'super_admin', 'manager', 'developer', 'designer', 'seo_specialist'].includes(
                          r.id || ''
                        )
                    )
                    .map((r) => (
                      <SelectItem key={`custom-new-${r.id}`} value={r.key || r.id}>
                        ⚡ {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Full Name *</label>
              <Input
                placeholder="e.g. Dr. Alok Verma"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="text-xs rounded-xl h-9"
              />
            </div>

            {/* Email with Debounced Real-time duplicate check */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Email Address (Login ID) *</label>
                {emailCheckStatus === 'checking' && (
                  <span className="text-[10px] text-cyan">Checking availability...</span>
                )}
                {emailCheckStatus === 'available' && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Email available
                  </span>
                )}
                {emailCheckStatus === 'duplicate' && (
                  <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Already registered
                  </span>
                )}
              </div>
              <Input
                type="email"
                placeholder="e.g. alok@abchospital.in"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className={`text-xs rounded-xl h-9 font-mono ${
                  emailCheckStatus === 'duplicate'
                    ? 'border-rose-500 bg-rose-500/5'
                    : emailCheckStatus === 'available'
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : ''
                }`}
              />
              {emailCheckStatus === 'duplicate' && emailCheckResult && (
                <p className="text-[11px] text-rose-400 font-semibold">
                  An account already exists for {emailCheckResult.name} ({emailCheckResult.role}). Duplicate emails are strictly blocked.
                </p>
              )}
            </div>

            {/* Password Section with Generator */}
            <div className="p-3.5 rounded-2xl bg-surface/60 border border-cyan/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-cyan" />
                  Account Password *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-[10px] font-bold text-cyan hover:underline flex items-center gap-1"
                >
                  <Dices className="h-3 w-3" /> 🎲 Generate Password
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Set or generate password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  className="text-xs rounded-xl h-9 pr-8 font-mono bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 text-cyan" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Upon saving, you can copy the login details in 1-click to share with the user.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
              <Input
                placeholder="+91 98765 43210"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                className="text-xs rounded-xl h-9"
              />
            </div>

            {/* Conditional Fields */}
            {newUserRole === 'client' ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Company / Organization *</label>
                  <Input
                    placeholder="e.g. ABC Super Speciality Hospital"
                    value={newUserCompany}
                    onChange={(e) => setNewUserCompany(e.target.value)}
                    required
                    className="text-xs rounded-xl h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Selected Plan</label>
                  <Input
                    placeholder="e.g. Growth Plan (₹39,999)"
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value)}
                    className="text-xs rounded-xl h-9"
                  />
                </div>

                {/* Project Assignment */}
                {projects.length > 0 && (
                  <div className="space-y-2 p-3 rounded-2xl bg-surface/40 border border-border">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 text-cyan" />
                      Assign Existing Projects (Optional)
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {projects.map((p) => {
                        const isChecked = selectedProjectIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                              } else {
                                setSelectedProjectIds([...selectedProjectIds, p.id]);
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
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Department</label>
                <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering / Development</SelectItem>
                    <SelectItem value="Design">Design & Branding</SelectItem>
                    <SelectItem value="Marketing">Marketing & SEO</SelectItem>
                    <SelectItem value="Management">Executive & Operations</SelectItem>
                    <SelectItem value="Support">Client Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={emailCheckStatus === 'duplicate'}
                className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full disabled:opacity-50"
              >
                Create Account & View Credentials
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Projects to Client Modal */}
      <Dialog open={isAssignProjectsModalOpen} onOpenChange={setIsAssignProjectsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-cyan" />
              Assign Projects to {assignTargetClient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select which agency project workspaces belong to this client.
            </DialogDescription>
          </DialogHeader>

          {assignTargetClient && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-2xl bg-surface/60 border border-border text-xs">
                <p className="font-bold text-foreground">{assignTargetClient.name}</p>
                <p className="font-mono text-muted-foreground text-[11px]">{assignTargetClient.email}</p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {projects.map((p) => {
                  const isChecked = clientProjectIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isChecked) {
                          setClientProjectIds(clientProjectIds.filter((id) => id !== p.id));
                        } else {
                          setClientProjectIds([...clientProjectIds, p.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between ${
                        isChecked ? 'border-cyan bg-cyan/10' : 'border-border bg-card/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Checkbox checked={isChecked} />
                        <div className="truncate">
                          <p className="font-bold truncate">{p.project_name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.service_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-cyan shrink-0">
                        {p.progress_percentage}%
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={handleSaveAssignedProjects}
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full"
                >
                  Save Project Assignments ({clientProjectIds.length})
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Profile Dialog (Strict separation for Client vs Staff) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-cyan" />
              {editingUser?.userType === 'client' ? 'Edit Client Profile' : 'Edit Staff Member & Role'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingUser?.userType === 'client'
                ? 'Update client contact details, company information, and account status.'
                : 'Update employee details, department, or promote/assign a team role.'}
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveEditUser} className="space-y-4 mt-2">
              {/* User Email & Primary Admin Notice */}
              <div className="p-3 rounded-2xl bg-surface/60 border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-muted-foreground text-[11px]">{editingUser.email}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold ${
                      editingUser.userType === 'client'
                        ? 'text-cyan border-cyan/30 bg-cyan/5'
                        : 'text-purple-400 border-purple-500/30 bg-purple-500/5'
                    }`}
                  >
                    {editingUser.roleDisplayName}
                  </Badge>
                </div>
                {editingUser.email.toLowerCase() === 'bajakprashant1998@gmail.com' && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5 mt-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Primary Super Admin:</strong> This account is the platform owner and its Super Admin role is immutable to guarantee system integrity.
                    </span>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Full Name *</label>
                <Input
                  placeholder="e.g. Aman Saxena"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>

              {/* Client vs Team Specific Fields */}
              {editingUser.userType === 'client' ? (
                <>
                  {/* Company / Business Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Company / Business Name *</label>
                    <Input
                      placeholder="e.g. ABC Super Speciality Hospital"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      required
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Team Member Role Selector (Internal roles only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Assigned Staff Role *</label>
                    <Select
                      value={editRole}
                      onValueChange={setEditRole}
                      disabled={editingUser.email.toLowerCase() === 'bajakprashant1998@gmail.com'}
                    >
                      <SelectTrigger className="text-xs rounded-xl h-10 bg-surface/60">
                        <SelectValue placeholder="Select Staff Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">👑 Super Admin (Full Platform Control)</SelectItem>
                        <SelectItem value="manager">📊 Project Manager (Client & Task Lead)</SelectItem>
                        <SelectItem value="developer">💻 Developer / Engineer</SelectItem>
                        <SelectItem value="designer">🎨 UI/UX Designer</SelectItem>
                        <SelectItem value="seo_specialist">🚀 SEO & Growth Specialist</SelectItem>
                        {roles
                          .filter(
                            (r) =>
                              !['client', 'admin', 'super_admin', 'manager', 'developer', 'designer', 'seo_specialist'].includes(
                                r.key || ''
                              ) &&
                              !['client', 'admin', 'super_admin', 'manager', 'developer', 'designer', 'seo_specialist'].includes(
                                r.id || ''
                              )
                          )
                          .map((r) => (
                            <SelectItem key={`custom-edit-${r.id}`} value={r.key || r.id}>
                              ⚡ {r.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Department</label>
                    <Select value={editDepartment} onValueChange={setEditDepartment}>
                      <SelectTrigger className="text-xs rounded-xl h-9">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering / Development</SelectItem>
                        <SelectItem value="Design">Design & Branding</SelectItem>
                        <SelectItem value="Marketing">Marketing & SEO</SelectItem>
                        <SelectItem value="Management">Executive & Operations</SelectItem>
                        <SelectItem value="Support">Client Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Phone / WhatsApp */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              {/* Account Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Account Status</label>
                <Select
                  value={editStatus}
                  onValueChange={(val: any) => setEditStatus(val)}
                  disabled={editingUser.email.toLowerCase() === 'bajakprashant1998@gmail.com'}
                >
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Full Portal Access)</SelectItem>
                    <SelectItem value="inactive">Inactive (Login Deactivated)</SelectItem>
                    <SelectItem value="pending_approval">Pending Admin Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full"
                >
                  {editingUser.userType === 'client' ? 'Save Client Profile' : 'Save Staff Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
