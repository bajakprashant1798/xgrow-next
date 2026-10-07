'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDocumentModel, ClientModel, ProjectModel } from '@/lib/supabase/types';
import { sendInvoiceEmail } from '@/lib/email-service';
import { Logo } from '@/components/site/Logo';

interface InvoiceViewModalProps {
  invoice: InvoiceDocumentModel | null;
  client?: ClientModel | null;
  project?: ProjectModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdminView?: boolean;
  onStatusChange?: (newStatus: any) => void;
}

export function InvoiceViewModal({
  invoice,
  client,
  project,
  open,
  onOpenChange,
  isAdminView = false,
  onStatusChange,
}: InvoiceViewModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const isQuotation = invoice.type === 'quotation';
  const docTitle = isQuotation ? 'COMMERCIAL QUOTATION' : 'TAX INVOICE';
  const docRef = invoice.reference_number || invoice.id;

  const clientName = client?.name || invoice.client_name || 'Client Account';
  const clientCompany = client?.company_name || invoice.client_company || '';
  const clientEmail = client?.email || invoice.client_email || '';
  const clientPhone = client?.phone || '';
  const projectName = project?.project_name || invoice.project_name || 'Agency Deliverables';

  // Calculate items or default breakdown
  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description: `${projectName} — ${invoice.title}`,
            quantity: 1,
            unit_price: invoice.amount,
            total: invoice.amount,
          },
        ];

  const subtotal = invoice.subtotal || invoice.amount;
  const taxAmount = invoice.tax_amount || 0;
  const grandTotal = invoice.amount;

  const handlePrint = () => {
    // Inject print styling and trigger browser print dialog
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = `${docTitle}_${docRef}`;
    window.print();
    document.title = originalTitle;
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const result = await sendInvoiceEmail({
        invoice,
        client: client || { name: clientName, email: clientEmail },
        project: project || { project_name: projectName },
      });

      if (result.simulated) {
        toast.success(`📧 Invoice #${docRef} formatted & queued for ${result.recipient}!`, {
          description: 'Ready for live delivery when email API keys are connected.',
        });
      } else {
        toast.success(`Invoice emailed directly to ${result.recipient}!`);
      }
    } catch (err) {
      toast.error('Failed to dispatch invoice email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-background p-4 sm:p-8 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4 pr-6">
          <div className="flex items-center gap-2">
            <Badge className="bg-cyan/15 text-cyan border-cyan/30 px-3 py-1 font-bold">
              {isQuotation ? 'ESTIMATE / QUOTE' : 'OFFICIAL INVOICE'}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              #{docRef}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-bold gap-1.5 border-border shadow-sm hover:border-cyan"
            >
              <Printer className="h-3.5 w-3.5 text-cyan" />
              Download / Print PDF
            </Button>

            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              size="sm"
              className="rounded-full bg-cyan text-slate-950 hover:bg-cyan/90 font-bold text-xs px-3.5 gap-1.5 shadow-sm"
            >
              <Mail className="h-3.5 w-3.5" />
              {isSendingEmail ? 'Sending...' : 'Send to Email'}
            </Button>
          </div>
        </DialogHeader>

        {/* ========================================================================= */}
        {/* PRINTABLE INVOICE CONTAINER                                               */}
        {/* ========================================================================= */}
        <div
          id="printable-invoice"
          className="mt-4 rounded-2xl border border-border bg-card p-6 sm:p-10 text-foreground space-y-8 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:text-black"
        >
          {/* Top Header: Logo + Invoice Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border pb-8 print:border-gray-300">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/xlogo.png"
                  alt="XGRO Logo"
                  className="h-10 w-10 object-contain rounded-xl"
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground print:text-black">
                    XGRO
                  </h1>
                  <p className="text-[11px] font-semibold text-cyan uppercase tracking-widest print:text-gray-700">
                    Growth & Digital Agency
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground print:text-gray-600 leading-relaxed space-y-0.5">
                <p className="font-semibold text-foreground print:text-black">XGRO Tech Solutions LLP</p>
                <p>Civil Lines, Station Road, Moradabad, UP 244001</p>
                <p>NCR Office: Sector 62, Noida, Delhi NCR</p>
                <p>Email: billing@xgro.in · Phone: +91 63953 19725</p>
                <p className="font-mono text-[11px]">GSTIN: 09AABCU9603R1ZM (Sample/Provisional)</p>
              </div>
            </div>

            <div className="sm:text-right space-y-2">
              <h2 className="text-2xl font-black text-foreground print:text-black uppercase tracking-tight">
                {docTitle}
              </h2>
              <p className="text-sm font-bold font-mono text-cyan print:text-black">
                #{docRef}
              </p>

              <div className="pt-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30 print:border-amber-600 print:text-amber-700'
                  }`}
                >
                  {isPaid ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> PAID RECEIPT
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" /> PAYMENT DUE
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To & Invoice Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-surface/80 border border-border/80 print:border-gray-200 print:bg-gray-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan print:text-gray-700">
                Billed To (Client):
              </span>
              <p className="text-sm font-extrabold text-foreground print:text-black">
                {clientName}
              </p>
              {clientCompany && (
                <p className="font-semibold text-muted-foreground print:text-gray-700">
                  {clientCompany}
                </p>
              )}
              {clientEmail && (
                <p className="text-muted-foreground print:text-gray-600">
                  {clientEmail}
                </p>
              )}
              {clientPhone && (
                <p className="text-muted-foreground print:text-gray-600">
                  {clientPhone}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-surface/80 border border-border/80 print:border-gray-200 print:bg-gray-50 space-y-1.5 sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan print:text-gray-700">
                Project & Billing Dates:
              </span>
              <p className="text-xs font-bold text-foreground print:text-black">
                Project: {projectName}
              </p>
              <div className="flex justify-between sm:justify-end gap-4 text-muted-foreground print:text-gray-600">
                <span>Issue Date:</span>
                <strong className="text-foreground print:text-black">{invoice.issue_date || '28 Sep 2026'}</strong>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 text-muted-foreground print:text-gray-600">
                <span>Due Date:</span>
                <strong className="text-foreground print:text-black">{invoice.due_date || 'Upon Receipt'}</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-border print:border-gray-300 text-muted-foreground print:text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface/40">
                    <td className="py-3.5 px-3 font-semibold text-foreground print:text-black">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-muted-foreground print:text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-muted-foreground print:text-gray-700">
                      ₹{item.unit_price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold font-mono text-foreground print:text-black">
                      ₹{item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Totals */}
          <div className="flex flex-col sm:flex-row justify-end gap-6 pt-4 border-t border-border print:border-gray-300">
            {/* Price Calculation Box */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground print:text-gray-700">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-foreground print:text-black">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground print:text-gray-700">
                  <span>GST (18%):</span>
                  <span className="font-mono font-bold text-foreground print:text-black">
                    ₹{taxAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-border text-base font-black text-foreground print:text-black">
                <span>Grand Total:</span>
                <span className="text-xl font-extrabold text-cyan print:text-black font-mono">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {invoice.notes && (
            <div className="text-xs text-muted-foreground print:text-gray-600 pt-4 border-t border-border print:border-gray-200">
              <p className="font-bold text-foreground print:text-black">Notes & Terms:</p>
              <p className="mt-1 leading-relaxed">{invoice.notes}</p>
            </div>
          )}

          {/* Invoice Footer / Signoff */}
          <div className="pt-6 border-t border-border print:border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground print:text-gray-500">
            <p className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Verified Digital Invoice by XGRO Agency
            </p>
            <p>Thank you for your business!</p>
          </div>
        </div>

        {/* Bottom Actions for Admin */}
        {isAdminView && onStatusChange && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground">Quick Status:</span>
              {(['draft', 'sent', 'paid', 'overdue'] as const).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={invoice.status === st ? 'default' : 'outline'}
                  onClick={() => onStatusChange(st)}
                  className={`h-7 rounded-lg text-xs font-bold capitalize ${
                    invoice.status === st && st === 'paid'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : invoice.status === st && st === 'sent'
                      ? 'bg-cyan text-slate-950'
                      : ''
                  }`}
                >
                  {st}
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-bold"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
