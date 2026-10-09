'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Download,
  Mail,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  CreditCard,
  Trash2,
  Eye,
  Send,
  Sparkles,
  ArrowUpDown,
  DollarSign,
  ChevronRight,
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
import { toast } from 'sonner';
import {
  getAllInvoices,
  getProjects,
  getClients,
  updateProjectInvoice,
  deleteProjectInvoice,
  subscribeToDataChanges,
} from '@/lib/db';
import { InvoiceDocumentModel, ProjectModel, ClientModel } from '@/lib/supabase/types';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { sendInvoiceEmail } from '@/lib/email-service';
import { useAuth } from '@/lib/auth-context';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';

export default function AdminInvoicesPage() {
  const { user, isAdmin, hasPermission } = useAuth();
  const canView = isAdmin || hasPermission('invoices', 'view');
  const canCreateEdit = isAdmin || hasPermission('invoices', 'create_edit');
  const canDelete = isAdmin || hasPermission('invoices', 'delete');

  const [invoices, setInvoices] = useState<InvoiceDocumentModel[]>([]);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'sent' | 'paid' | 'draft' | 'overdue'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'invoice' | 'quotation'>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDocumentModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceDocumentModel | null>(null);

  const loadData = async () => {
    try {
      const [invs, projs, clis] = await Promise.all([
        getAllInvoices(),
        getProjects(),
        getClients(),
      ]);
      setInvoices(invs);
      setProjects(projs);
      setClients(clis);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToDataChanges(loadData);
  }, []);

  // Filtered calculation
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchesType = typeFilter === 'All' || inv.type === typeFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        inv.title.toLowerCase().includes(q) ||
        (inv.reference_number && inv.reference_number.toLowerCase().includes(q)) ||
        (inv.client_name && inv.client_name.toLowerCase().includes(q)) ||
        (inv.project_name && inv.project_name.toLowerCase().includes(q));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [invoices, statusFilter, typeFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const totalBilled = invoices
      .filter((i) => i.status !== 'draft')
      .reduce((acc, i) => acc + (i.amount || 0), 0);

    const totalPaid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + (i.amount || 0), 0);

    const totalPending = invoices
      .filter((i) => i.status === 'sent')
      .reduce((acc, i) => acc + (i.amount || 0), 0);

    const totalDrafts = invoices.filter((i) => i.status === 'draft').length;

    return { totalBilled, totalPaid, totalPending, totalDrafts, count: invoices.length };
  }, [invoices]);

  // Status Change Handler
  const handleStatusChange = async (inv: InvoiceDocumentModel, newStatus: any) => {
    if (!canCreateEdit) {
      toast.error('You do not have permission to modify invoice status');
      return;
    }
    if (!inv.project_id) return;
    try {
      await updateProjectInvoice(inv.project_id, inv.id, { status: newStatus });
      toast.success(`Invoice #${inv.reference_number || inv.id} status marked as ${newStatus}`);
      if (viewingInvoice?.id === inv.id) {
        setViewingInvoice({ ...viewingInvoice, status: newStatus });
      }
      loadData();
    } catch (err) {
      toast.error('Failed to update invoice status');
    }
  };

  // Email Dispatch Handler
  const handleSendEmail = async (inv: InvoiceDocumentModel) => {
    const project = projects.find((p) => p.id === inv.project_id);
    const client = clients.find((c) => c.id === inv.client_id);

    try {
      const result = await sendInvoiceEmail({
        invoice: inv,
        client: client,
        project: project,
      });

      if (result.simulated) {
        toast.success(`📧 Invoice #${inv.reference_number || inv.id} queued for ${result.recipient}!`, {
          description: 'Delivery is ready for when live SMTP/API key is configured.',
        });
      } else {
        toast.success(`Invoice successfully sent to ${result.recipient}!`);
      }
    } catch (err) {
      toast.error('Failed to send invoice email');
    }
  };

  // Delete Handler
  const handleDeleteInvoice = async (inv: InvoiceDocumentModel) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete invoices');
      return;
    }
    // Optimistic instant UI update
    setInvoices((prev) => prev.filter((i) => i.id !== inv.id && (!inv.reference_number || i.reference_number !== inv.reference_number)));
    try {
      await deleteProjectInvoice(inv.project_id || '', inv.id, inv.reference_number);
      toast.success(`Invoice #${inv.reference_number || inv.id} deleted & assets removed`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error('Failed to delete invoice');
      await loadData();
    }
  };

  if (!canView) {
    return <AdminAccessDenied moduleName="Invoices & Billing Hub" requiredAction="View Invoices" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/15 text-cyan">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Invoices & Billing Hub
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Generate branded invoices, issue quotations, download client PDFs, and manage billing records.
          </p>
        </div>

        {canCreateEdit && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-4 h-9 shadow-md gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Create Invoice / Quote
          </Button>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Invoiced
            </span>
            <CreditCard className="h-4 w-4 text-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              ₹{metrics.totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Collected (Paid)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              ₹{metrics.totalPaid.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending / Due
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              ₹{metrics.totalPending.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Documents
            </span>
            <FileText className="h-4 w-4 text-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{metrics.count}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              ({metrics.totalDrafts} Drafts)
            </span>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border-border bg-card/40 p-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by invoice title, #ref, client name, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-surface border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
            >
              <option value="All">All Statuses</option>
              <option value="paid">Paid Receipts</option>
              <option value="sent">Sent / Pending</option>
              <option value="draft">Drafts</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
            >
              <option value="All">All Types</option>
              <option value="invoice">Invoices Only</option>
              <option value="quotation">Quotations Only</option>
            </select>

            {(statusFilter !== 'All' || typeFilter !== 'All' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('All');
                  setTypeFilter('All');
                  setSearchQuery('');
                }}
                className="h-10 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      {filteredInvoices.length > 0 ? (
        <Card className="rounded-3xl border-border bg-card/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/80 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Document / Ref</th>
                  <th className="py-3.5 px-4">Client & Project</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isDraft = inv.status === 'draft';
                  const isQuote = inv.type === 'quotation';

                  return (
                    <tr key={inv.id} className="hover:bg-surface/40 transition-colors">
                      {/* Document Ref & Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isQuote
                                ? 'bg-purple-500/15 text-purple-400'
                                : 'bg-cyan/15 text-cyan'
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              <span>{inv.title}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                ({inv.reference_number || inv.id})
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Issued: {inv.issue_date || '28 Sep 2026'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client & Project */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {inv.client_name || 'Client Account'}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {inv.project_name || 'Project'}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-extrabold text-foreground font-mono">
                          ₹{Number(inv.amount).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center">
                        <Badge
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isDraft
                              ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 text-[11px] text-muted-foreground">
                        {inv.due_date || 'Upon Receipt'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Download PDF Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingInvoice(inv)}
                            className="h-8 rounded-xl text-xs font-bold border-cyan/30 text-cyan hover:bg-cyan/10 gap-1"
                          >
                            <Download className="h-3 w-3" /> View / PDF
                          </Button>

                          {/* Send Email */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSendEmail(inv)}
                            title="Send to client email"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/10"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>

                          {/* Quick Mark as Paid Toggle */}
                          {canCreateEdit && !isPaid && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleStatusChange(inv, 'paid')}
                              title="Mark as Paid"
                              className="h-8 w-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteInvoice(inv)}
                              title="Delete Invoice"
                              className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </Card>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/30">
          <FileText className="mx-auto h-10 w-10 text-cyan mb-3" />
          <h4 className="text-base font-bold text-foreground">No invoices found</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No billing records match your current filters.'
              : 'No invoices or quotations have been issued yet.'}
          </p>
          {canCreateEdit && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="mt-4 rounded-full bg-cyan text-slate-950 font-bold text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5 stroke-[3]" /> Issue First Invoice
            </Button>
          )}
        </div>
      )}

      {/* Invoice View & Print Modal */}
      <InvoiceViewModal
        invoice={viewingInvoice}
        client={clients.find((c) => c.id === viewingInvoice?.client_id)}
        project={projects.find((p) => p.id === viewingInvoice?.project_id)}
        open={Boolean(viewingInvoice)}
        onOpenChange={(open) => {
          if (!open) setViewingInvoice(null);
        }}
        isAdminView={true}
        onStatusChange={(newStatus) => {
          if (viewingInvoice) handleStatusChange(viewingInvoice, newStatus);
        }}
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onInvoiceCreated={loadData}
      />
    </div>
  );
}
