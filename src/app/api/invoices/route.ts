import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { InvoiceDocumentModel } from '@/lib/supabase/types';

interface StoredInvoicesData {
  invoices: InvoiceDocumentModel[];
  deletedIds: string[];
  updated_at?: string;
}

let inMemoryData: StoredInvoicesData | null = null;

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'invoices.json');
  } catch {
    return path.join('/tmp', 'invoices.json');
  }
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function readStoredData(): { invoices: InvoiceDocumentModel[]; deletedIds: string[] } {
  let invoices: InvoiceDocumentModel[] = inMemoryData?.invoices ? [...inMemoryData.invoices] : [];
  let deletedIds: string[] = inMemoryData?.deletedIds ? [...inMemoryData.deletedIds] : [];

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed) {
        if (Array.isArray(parsed.deletedIds)) {
          deletedIds = parsed.deletedIds;
        }
        if (Array.isArray(parsed.invoices)) {
          invoices = parsed.invoices;
        } else if (Array.isArray(parsed)) {
          invoices = parsed;
        }
      }
    }
  } catch (e) {}

  // Filter out any previously deleted IDs
  const activeInvoices = invoices.filter(
    (inv) => inv && inv.id && !deletedIds.includes(inv.id) && (!inv.reference_number || !deletedIds.includes(inv.reference_number))
  );

  return { invoices: activeInvoices, deletedIds };
}

function writeStoredData(invoices: InvoiceDocumentModel[], deletedIds: string[]) {
  const dataToSave: StoredInvoicesData = {
    invoices,
    deletedIds,
    updated_at: new Date().toISOString(),
  };
  inMemoryData = dataToSave;

  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (e) {}
}

async function deleteInvoiceQrCodeFromStorage(imageUrl?: string) {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.startsWith('data:')) {
    return;
  }

  // 1. Delete from Supabase Storage bucket
  const supabase = getSupabaseServerClient();
  if (supabase && imageUrl.includes('/storage/v1/object/public/')) {
    try {
      const publicMarker = '/storage/v1/object/public/';
      const idx = imageUrl.indexOf(publicMarker);
      if (idx !== -1) {
        const rest = imageUrl.substring(idx + publicMarker.length);
        const firstSlash = rest.indexOf('/');
        if (firstSlash !== -1) {
          const bucket = rest.substring(0, firstSlash);
          const filePath = decodeURIComponent(rest.substring(firstSlash + 1));
          const { error } = await supabase.storage.from(bucket).remove([filePath]);
          if (!error) {
            console.log(`[Invoices API] Deleted QR code from Supabase Storage: ${bucket}/${filePath}`);
          }
        }
      }
    } catch (err) {
      console.warn('[Invoices API] Notice deleting QR code from Supabase storage:', err);
    }
  }

  // 2. Delete from local public uploads folder if saved locally
  if (imageUrl.startsWith('/uploads/invoices/')) {
    try {
      const fileName = imageUrl.replace('/uploads/invoices/', '');
      const localFilePath = path.join(process.cwd(), 'public', 'uploads', 'invoices', fileName);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`[Invoices API] Deleted local QR code file: ${localFilePath}`);
      }
    } catch (e) {
      console.warn('[Invoices API] Notice deleting local upload file:', e);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const { invoices: diskInvoices, deletedIds } = readStoredData();

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let query = supabase
          .from('invoices_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data: supaInvoices, error: supaErr } = await query;
        if (!supaErr && supaInvoices && Array.isArray(supaInvoices)) {
          const remoteList = supaInvoices as InvoiceDocumentModel[];
          const map = new Map<string, InvoiceDocumentModel>();

          // Merge disk + remote, strictly excluding any deleted IDs
          for (const item of diskInvoices) {
            if (item && item.id && !deletedIds.includes(item.id) && (!item.reference_number || !deletedIds.includes(item.reference_number))) {
              map.set(item.id, item);
            }
          }
          for (const item of remoteList) {
            if (item && item.id && !deletedIds.includes(item.id) && (!item.reference_number || !deletedIds.includes(item.reference_number))) {
              map.set(item.id, { ...map.get(item.id), ...item });
            }
          }

          const combined = Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.issue_date || a.created_at || '').getTime();
            const dateB = new Date(b.issue_date || b.created_at || '').getTime();
            return dateB - dateA;
          });

          writeStoredData(combined, deletedIds);
          return NextResponse.json({ success: true, invoices: combined, deletedIds });
        }
      } catch (err) {
        console.warn('[Invoices API] Supabase query notice:', err);
      }
    }

    const filtered = (projectId
      ? diskInvoices.filter((i) => i.project_id === projectId)
      : diskInvoices
    ).filter((i) => !deletedIds.includes(i.id) && (!i.reference_number || !deletedIds.includes(i.reference_number)));

    return NextResponse.json({ success: true, invoices: filtered, deletedIds });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'create';
    const invoiceData: Partial<InvoiceDocumentModel> = body.invoice || body;
    const now = new Date().toISOString();

    const { invoices: currentInvoices, deletedIds: currentDeletedIds } = readStoredData();
    let savedInvoice: InvoiceDocumentModel;

    if (action === 'update' && invoiceData.id) {
      const idx = currentInvoices.findIndex((i) => i.id === invoiceData.id);
      savedInvoice = {
        ...(idx >= 0 ? currentInvoices[idx] : {}),
        ...invoiceData,
        updated_at: now,
      } as InvoiceDocumentModel;

      if (idx >= 0) {
        currentInvoices[idx] = savedInvoice;
      } else {
        currentInvoices.unshift(savedInvoice);
      }
    } else {
      const id = invoiceData.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      savedInvoice = {
        id,
        project_id: invoiceData.project_id || '',
        project_name: invoiceData.project_name || '',
        client_id: invoiceData.client_id || '',
        client_name: invoiceData.client_name || '',
        client_email: invoiceData.client_email || '',
        client_company: invoiceData.client_company || '',
        client_address: invoiceData.client_address || '',
        type: invoiceData.type || 'invoice',
        title: invoiceData.title || 'Invoice',
        reference_number: invoiceData.reference_number || `INV-${Date.now().toString().slice(-4)}`,
        amount: Number(invoiceData.amount) || 0,
        subtotal: Number(invoiceData.subtotal) || Number(invoiceData.amount) || 0,
        tax_rate: Number(invoiceData.tax_rate) || 0,
        tax_amount: Number(invoiceData.tax_amount) || 0,
        discount_amount: Number(invoiceData.discount_amount) || 0,
        status: invoiceData.status || 'sent',
        issue_date: invoiceData.issue_date || now.split('T')[0],
        due_date: invoiceData.due_date || '',
        notes: invoiceData.notes || '',
        payment_terms: invoiceData.payment_terms || '',
        payment_mode: invoiceData.payment_mode || 'bank_transfer',
        qr_code_url: invoiceData.qr_code_url || undefined,
        upi_id: invoiceData.upi_id || undefined,
        bank_name: invoiceData.bank_name || undefined,
        account_name: invoiceData.account_name || undefined,
        account_number: invoiceData.account_number || undefined,
        ifsc_code: invoiceData.ifsc_code || undefined,
        branch_name: invoiceData.branch_name || undefined,
        items: invoiceData.items || [],
        created_at: now,
        updated_at: now,
      };

      currentInvoices.unshift(savedInvoice);
    }

    // Un-delete if previously deleted
    const updatedDeletedIds = currentDeletedIds.filter(
      (dId) => dId !== savedInvoice.id && dId !== savedInvoice.reference_number
    );

    writeStoredData(currentInvoices, updatedDeletedIds);

    // Sync to Supabase table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const payload: Record<string, any> = {
          type: savedInvoice.type,
          title: savedInvoice.title,
          reference_number: savedInvoice.reference_number,
          amount: savedInvoice.amount,
          subtotal: savedInvoice.subtotal,
          tax_rate: savedInvoice.tax_rate,
          tax_amount: savedInvoice.tax_amount,
          discount_amount: savedInvoice.discount_amount,
          status: savedInvoice.status,
          issue_date: savedInvoice.issue_date,
          due_date: savedInvoice.due_date,
          notes: savedInvoice.notes,
          payment_terms: savedInvoice.payment_terms,
          payment_mode: savedInvoice.payment_mode,
          qr_code_url: savedInvoice.qr_code_url,
          upi_id: savedInvoice.upi_id,
          bank_name: savedInvoice.bank_name,
          account_name: savedInvoice.account_name,
          account_number: savedInvoice.account_number,
          ifsc_code: savedInvoice.ifsc_code,
          branch_name: savedInvoice.branch_name,
          items: savedInvoice.items,
        };

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (savedInvoice.project_id && uuidRegex.test(savedInvoice.project_id)) {
          payload.project_id = savedInvoice.project_id;
        }
        if (savedInvoice.client_id && uuidRegex.test(savedInvoice.client_id)) {
          payload.client_id = savedInvoice.client_id;
        }

        if (action === 'update' && savedInvoice.id && uuidRegex.test(savedInvoice.id)) {
          await supabase.from('invoices_documents').update(payload).eq('id', savedInvoice.id);
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from('invoices_documents')
            .insert(payload)
            .select()
            .single();

          if (!insErr && inserted && inserted.id) {
            savedInvoice.id = inserted.id;
            const idx = currentInvoices.findIndex((i) => i.reference_number === savedInvoice.reference_number);
            if (idx >= 0) {
              currentInvoices[idx] = savedInvoice;
              writeStoredData(currentInvoices, updatedDeletedIds);
            }
          }
        }
      } catch (sbErr) {
        console.warn('[Invoices API] Supabase insert/update notice:', sbErr);
      }
    }

    return NextResponse.json({ success: true, invoice: savedInvoice });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error saving invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const referenceNumber = searchParams.get('ref');

    if (!id && !referenceNumber) {
      return NextResponse.json({ success: false, error: 'Invoice ID or Reference Number is required' }, { status: 400 });
    }

    const { invoices: currentInvoices, deletedIds: currentDeletedIds } = readStoredData();
    const targetInvoice = currentInvoices.find(
      (i) => (id && i.id === id) || (referenceNumber && i.reference_number === referenceNumber)
    );

    // Delete associated QR code image from Supabase Storage & local disk
    if (targetInvoice?.qr_code_url) {
      await deleteInvoiceQrCodeFromStorage(targetInvoice.qr_code_url);
    }
    if (targetInvoice?.file_url) {
      await deleteInvoiceQrCodeFromStorage(targetInvoice.file_url);
    }

    // Add to deleted IDs to prevent resurrection
    const idsToBlacklist = new Set(currentDeletedIds);
    if (id) idsToBlacklist.add(id);
    if (referenceNumber) idsToBlacklist.add(referenceNumber);
    if (targetInvoice?.id) idsToBlacklist.add(targetInvoice.id);
    if (targetInvoice?.reference_number) idsToBlacklist.add(targetInvoice.reference_number);

    const updatedDeletedIds = Array.from(idsToBlacklist);
    const updatedInvoices = currentInvoices.filter(
      (i) =>
        (!id || i.id !== id) &&
        (!referenceNumber || i.reference_number !== referenceNumber) &&
        (!targetInvoice || i.id !== targetInvoice.id)
    );

    writeStoredData(updatedInvoices, updatedDeletedIds);

    // Delete from Supabase table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (id && uuidRegex.test(id)) {
          await supabase.from('invoices_documents').delete().eq('id', id);
        }
        if (targetInvoice?.id && uuidRegex.test(targetInvoice.id)) {
          await supabase.from('invoices_documents').delete().eq('id', targetInvoice.id);
        }
        const refToDelete = referenceNumber || targetInvoice?.reference_number;
        if (refToDelete) {
          await supabase.from('invoices_documents').delete().eq('reference_number', refToDelete);
        }
        if (targetInvoice?.title) {
          await supabase.from('invoices_documents').delete().eq('title', targetInvoice.title);
        }
      } catch (e) {
        console.warn('[Invoices API] Supabase delete notice:', e);
      }
    }

    return NextResponse.json({ success: true, deletedId: id || referenceNumber, deletedIds: updatedDeletedIds });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting invoice' },
      { status: 500 }
    );
  }
}
