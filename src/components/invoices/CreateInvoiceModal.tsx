'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  FileText,
  Mail,
  CheckCircle2,
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  InvoiceDocumentModel,
  InvoiceLineItem,
  ProjectModel,
  ClientModel,
} from '@/lib/supabase/types';
import { addProjectInvoice, getProjects, getClients } from '@/lib/db';
import { sendInvoiceEmail } from '@/lib/email-service';

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  onInvoiceCreated?: () => void;
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  defaultProjectId,
  onInvoiceCreated,
}: CreateInvoiceModalProps) {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');

  // Form states
  const [type, setType] = useState<'invoice' | 'quotation'>('invoice');
  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid'>('sent');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [notes, setNotes] = useState('Payment is due within 15 days of invoice date. Thank you for choosing XGRO!');
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true);

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: 'Website Development & Design Phase', quantity: 1, unit_price: 35000, total: 35000 },
  ]);

  useEffect(() => {
    if (open) {
      loadInitialData();
      // Generate reference number
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const prefix = type === 'quotation' ? 'QT' : 'INV';
      setReferenceNumber(`${prefix}-2026-${randomDigits}`);
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
    }
  }, [open, type, defaultProjectId]);

  const loadInitialData = async () => {
    const [p, c] = await Promise.all([getProjects(), getClients()]);
    setProjects(p);
    setClients(c);
    if (!selectedProjectId && p.length > 0) {
      setSelectedProjectId(defaultProjectId || p[0].id);
    }
  };

  // Line item handlers
  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
      const p = field === 'unit_price' ? parseFloat(value) || 0 : item.unit_price;
      item.total = q * p;
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Financial Calculations
  const subtotal = lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const taxAmount = taxRate > 0 ? Math.round((subtotal * taxRate) / 100) : 0;
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Invoice title is required');
      return;
    }
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    const currentProject = projects.find((p) => p.id === selectedProjectId);
    const clientId = currentProject?.client_id || 'cli-1';
    const client = clients.find((c) => c.id === clientId);

    const newInvoice: Omit<InvoiceDocumentModel, 'id' | 'created_at'> = {
      project_id: selectedProjectId,
      project_name: currentProject?.project_name,
      client_id: clientId,
      client_name: client?.name,
      client_email: client?.email,
      client_company: client?.company_name,
      type: type,
      title: title.trim(),
      reference_number: referenceNumber.trim(),
      amount: grandTotal,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      status: status,
      issue_date: issueDate,
      due_date: dueDate,
      notes: notes,
      items: lineItems,
    };

    try {
      await addProjectInvoice(selectedProjectId, newInvoice);

      if (sendEmailImmediately) {
        await sendInvoiceEmail({
          invoice: { ...newInvoice, id: `inv-${Date.now()}` },
          client: client,
          project: currentProject,
        });
        toast.success(`${type === 'quotation' ? 'Quotation' : 'Invoice'} created & email dispatched!`);
      } else {
        toast.success(`${type === 'quotation' ? 'Quotation' : 'Invoice'} created successfully!`);
      }

      onOpenChange(false);
      if (onInvoiceCreated) onInvoiceCreated();
    } catch (err) {
      toast.error('Failed to create invoice');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan/15 text-cyan border-cyan/30 px-3 py-1 font-bold">
              BILLING GENERATOR
            </Badge>
          </div>
          <DialogTitle className="mt-2 text-xl font-black text-foreground">
            Create Invoice or Quotation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Itemize project deliverables, calculate GST, and issue to client dashboard & email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Project & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Assigned Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newT = e.target.value as any;
                  setType(newT);
                  const randomDigits = Math.floor(100 + Math.random() * 900);
                  setReferenceNumber(`${newT === 'quotation' ? 'QT' : 'INV'}-2026-${randomDigits}`);
                }}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
              >
                <option value="invoice">Official Tax Invoice</option>
                <option value="quotation">Commercial Quotation / Estimate</option>
              </select>
            </div>
          </div>

          {/* Title & Reference No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Next.js Growth Platform — Milestone 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs rounded-xl bg-card border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Reference Number</label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="text-xs rounded-xl bg-card border-border font-mono"
              />
            </div>
          </div>

          {/* Dates & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Issue Date</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="text-xs rounded-xl bg-card border-border h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs rounded-xl bg-card border-border h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-9 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-cyan"
              >
                <option value="sent">Sent / Pending Payment</option>
                <option value="paid">Paid & Settled</option>
                <option value="draft">Draft Only</option>
              </select>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-cyan" />
                Line Items & Deliverables
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs rounded-lg gap-1 border-dashed"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Description of work or deliverable..."
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    required
                    className="text-xs rounded-xl bg-card border-border flex-1 h-9"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="text-xs rounded-xl bg-card border-border w-16 h-9 text-center font-mono"
                  />
                  <Input
                    type="number"
                    placeholder="Rate (₹)"
                    value={item.unit_price}
                    onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="text-xs rounded-xl bg-card border-border w-28 h-9 text-right font-mono"
                  />
                  <span className="text-xs font-bold font-mono w-24 text-right pr-1">
                    ₹{(item.total || 0).toLocaleString('en-IN')}
                  </span>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, GST & Grand Total Summary */}
          <div className="p-4 rounded-2xl bg-card/80 border border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-muted-foreground">GST / Tax Rate:</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs font-semibold"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={18}>18% Standard GST</option>
                <option value={12}>12% Reduced GST</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-muted-foreground">Subtotal: </span>
                <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Due: </span>
                <span className="font-mono font-extrabold text-cyan text-sm">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Notes & Terms</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl bg-card border-border leading-relaxed"
            />
          </div>

          {/* Email Option Checkbox & Footer */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailImmediately}
                onChange={(e) => setSendEmailImmediately(e.target.checked)}
                className="h-4 w-4 rounded border-border text-cyan focus:ring-cyan"
              />
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-cyan" /> Send Email Notification to Client on Create
              </span>
            </label>

            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 font-black text-xs px-5 shadow-md"
              >
                Create & Publish {type === 'quotation' ? 'Quote' : 'Invoice'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
