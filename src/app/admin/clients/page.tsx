'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  Zap,
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getClients,
  saveClient,
  deleteClient,
  approveClient,
  saveTeamMember,
  getProjects,
  getRoles,
  subscribeToDataChanges,
} from '@/lib/db';
import { ClientModel, ProjectModel, CustomRoleModel } from '@/lib/supabase/types';

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [roles, setRoles] = useState<CustomRoleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<ClientModel> | null>(null);

  // Promote to Team dialog state
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [promotingClient, setPromotingClient] = useState<ClientModel | null>(null);
  const [promoteRole, setPromoteRole] = useState('developer');
  const [promoteDepartment, setPromoteDepartment] = useState('Engineering');

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

  const openCreateDialog = () => {
    setEditingClient({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      address: '',
      status: 'active',
      selected_plan: 'Growth Plan (₹39,999)',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: ClientModel) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const openPromoteDialog = (client: ClientModel) => {
    setPromotingClient(client);
    const defaultRoleKey = roles.find((r) => !r.is_system)?.key || 'developer';
    setPromoteRole(defaultRoleKey);
    setPromoteDepartment('Engineering');
    setIsPromoteDialogOpen(true);
  };

  const handlePromoteToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingClient) return;

    try {
      await saveTeamMember({
        name: promotingClient.name,
        email: promotingClient.email,
        phone: promotingClient.phone || '',
        role: promoteRole,
        department: promoteDepartment,
        status: 'active',
      });
      toast.success(`${promotingClient.name} successfully promoted to ${promoteRole}! They can now log in to the Admin & Staff dashboard.`);
      setIsPromoteDialogOpen(false);
      setPromotingClient(null);
    } catch (err) {
      toast.error('Failed to promote user to team member');
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient?.name || !editingClient?.email) {
      toast.error('Client Name and Email are required');
      return;
    }

    try {
      await saveClient(editingClient as any);
      toast.success(editingClient.id ? 'Client account updated!' : 'Client account created!');
      setIsDialogOpen(false);
      setEditingClient(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save client');
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

  const handleDeleteClient = async (client: ClientModel) => {
    if (!confirm(`Are you sure you want to delete ${client.name} (${client.company_name})? This will also remove their client portal access.`)) {
      return;
    }

    try {
      await deleteClient(client.id);
      toast.success(`Removed client ${client.name}.`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete client');
    }
  };

  const pendingClients = clients.filter((c) => c.status === 'pending_approval');
  const activeClients = clients.filter((c) => c.status === 'active');

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return c.status === 'pending_approval';
    if (statusFilter === 'active') return c.status === 'active';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-cyan" />
            Client Accounts & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Admin can review newly registered clients, approve project workspaces, and manage client access.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Onboard New Client
        </Button>
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

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
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

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full bg-surface"
          />
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
          const clientProjects = projects.filter((p) => p.client_id === client.id);
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
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm border ${
                      isPending
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-cyan/20 text-cyan border-cyan/40'
                    }`}>
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

                  {client.selected_plan && (
                    <div className="p-2.5 rounded-xl bg-surface/60 border border-border text-[11px] space-y-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Plan Scope:
                      </span>
                      <p className="font-semibold text-foreground">{client.selected_plan}</p>
                    </div>
                  )}

                  {client.notes && (
                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                      "{client.notes}"
                    </p>
                  )}

                  {/* Assigned Projects */}
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5 uppercase">
                      <span>Assigned Projects</span>
                      <span className="text-cyan">{clientProjects.length} Active</span>
                    </div>
                    <div className="space-y-1.5">
                      {clientProjects.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">
                          {isPending
                            ? 'Awaiting admin approval to initialize project workspace.'
                            : 'No active project linked yet.'}
                        </p>
                      ) : (
                        clientProjects.map((p) => (
                          <Link
                            key={p.id}
                            href={`/admin/projects/${p.id}`}
                            className="p-2 rounded-xl border border-border bg-surface/40 hover:border-cyan/40 flex items-center justify-between transition-colors block"
                          >
                            <span className="font-semibold text-foreground truncate max-w-[180px]">
                              {p.project_name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-cyan">
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
              <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between gap-2">
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
                      onClick={() => openPromoteDialog(client)}
                      className="rounded-full text-xs font-semibold h-8 px-3 border-cyan/40 text-cyan hover:bg-cyan/10"
                      title="Promote to Staff / Employee"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Move to Team
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(client)}
                        className="rounded-full text-xs font-semibold h-8 px-3 border-border hover:border-cyan/40"
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPromoteDialog(client)}
                        className="rounded-full text-xs font-semibold h-8 px-3 border-cyan/30 text-cyan hover:bg-cyan/10"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Promote to Team
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClient(client)}
                      className="rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    )}

      {/* Promote to Team Member Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan" />
              Promote to Staff / Admin
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign an internal role (Admin, Employee, Project Manager, Developer) to <strong>{promotingClient?.name}</strong> ({promotingClient?.email}).
            </DialogDescription>
          </DialogHeader>

          {promotingClient && (
            <form onSubmit={handlePromoteToTeam} className="space-y-4 mt-2">
              <div className="p-3 rounded-2xl bg-surface/60 border border-border text-xs space-y-1">
                <p className="font-bold text-foreground">{promotingClient.name}</p>
                <p className="font-mono text-muted-foreground text-[11px]">{promotingClient.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select System Role *</label>
                <Select value={promoteRole} onValueChange={setPromoteRole}>
                  <SelectTrigger className="text-xs rounded-xl h-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Super Admin (Full Platform Control)</SelectItem>
                    <SelectItem value="manager">Project Manager</SelectItem>
                    <SelectItem value="developer">Senior Developer / Engineer</SelectItem>
                    <SelectItem value="designer">UI/UX Designer</SelectItem>
                    <SelectItem value="seo_specialist">SEO & Growth Specialist</SelectItem>
                    {roles
                      .filter((r) => !['super_admin', 'admin', 'client'].includes(r.key))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.key}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Department</label>
                <Select value={promoteDepartment} onValueChange={setPromoteDepartment}>
                  <SelectTrigger className="text-xs rounded-xl h-10">
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

              <DialogFooter className="pt-3">
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6 w-full"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Confirm Promotion to Team
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan" />
              {editingClient?.id ? 'Edit Client Account' : 'Onboard New Client'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure client identity, business organization, and portal status.
            </DialogDescription>
          </DialogHeader>

          {editingClient && (
            <form onSubmit={handleSaveClient} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Client Full Name *</label>
                <Input
                  placeholder="e.g. Dr. Alok Verma"
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Company / Hospital / Brand *</label>
                <Input
                  placeholder="e.g. ABC Super Speciality Hospital"
                  value={editingClient.company_name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, company_name: e.target.value })}
                  required
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Client Email *</label>
                  <Input
                    type="email"
                    placeholder="contact@abchospital.in"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    required
                    className="text-xs rounded-xl h-9 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Phone / WhatsApp</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Account Status</label>
                  <Select
                    value={editingClient.status || 'active'}
                    onValueChange={(val: any) => setEditingClient({ ...editingClient, status: val })}
                  >
                    <SelectTrigger className="text-xs rounded-xl h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Full Access)</SelectItem>
                      <SelectItem value="pending_approval">Pending Admin Review</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Selected Package</label>
                  <Input
                    placeholder="e.g. Growth Plan (₹39,999)"
                    value={editingClient.selected_plan || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, selected_plan: e.target.value })}
                    className="text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Location / City</label>
                <Input
                  placeholder="e.g. Civil Lines, Moradabad, UP"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Onboarding Notes</label>
                <Textarea
                  placeholder="Requirement details, scope notes..."
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  rows={2}
                  className="text-xs rounded-xl resize-none"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="submit"
                  className="rounded-full bg-cyan text-slate-950 font-bold text-xs px-6"
                >
                  Save Client Account
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
