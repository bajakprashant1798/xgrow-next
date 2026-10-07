import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { NotificationModel } from '@/lib/supabase/types';

let inMemoryNotifications: NotificationModel[] | null = null;

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'notifications.json');
  } catch {
    return path.join('/tmp', 'notifications.json');
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

function readStoredNotifications(): NotificationModel[] {
  if (inMemoryNotifications !== null) {
    return [...inMemoryNotifications];
  }
  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        inMemoryNotifications = parsed;
        return parsed;
      }
    }
  } catch {}
  inMemoryNotifications = [];
  return [];
}

function writeStoredNotifications(notifications: NotificationModel[]) {
  inMemoryNotifications = notifications;
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2), 'utf-8');
  } catch {}
}

function deduplicateNotifications(notifications: NotificationModel[]): { unique: NotificationModel[]; duplicateIds: string[] } {
  const seen = new Set<string>();
  const unique: NotificationModel[] = [];
  const duplicateIds: string[] = [];

  for (const n of notifications) {
    const key = n.dedup_key || `${n.client_id || n.client_email || 'all'}_${n.title.trim().toLowerCase()}`;
    if (seen.has(key)) {
      duplicateIds.push(n.id);
    } else {
      seen.add(key);
      unique.push(n);
    }
  }

  return { unique, duplicateIds };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId')?.trim();
  const clientEmail = searchParams.get('clientEmail')?.trim().toLowerCase();

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let targetClientId = clientId && clientId.length > 30 ? clientId : undefined;
      if (!targetClientId && clientEmail) {
        try {
          const { data: cRow } = await supabase.from('clients').select('id').ilike('email', clientEmail).maybeSingle();
          if (cRow?.id) targetClientId = cRow.id;
        } catch {}
      }

      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (targetClientId) {
        query = query.eq('client_id', targetClientId);
      }
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        const mapped: NotificationModel[] = data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          client_id: d.client_id,
          client_email: clientEmail || undefined,
          project_id: d.project_id,
          type: d.type,
          dedup_key: d.dedup_key,
          title: d.title,
          message: d.message,
          link: d.link,
          is_read: Boolean(d.is_read),
          created_at: d.created_at,
        }));

        const { unique, duplicateIds } = deduplicateNotifications(mapped);

        // Async cleanup of duplicate records from Supabase
        if (duplicateIds.length > 0) {
          Promise.resolve(supabase.from('notifications').delete().in('id', duplicateIds)).catch(() => {});
        }

        return NextResponse.json({ success: true, notifications: unique });
      }
    } catch {}
  }

  // Fallback to local disk/memory database
  const all = readStoredNotifications();
  const filtered = all.filter((n) => {
    if (!clientId && !clientEmail) return true;
    if (clientId && n.client_id === clientId) return true;
    if (clientEmail && n.client_email?.toLowerCase() === clientEmail) return true;
    return false;
  });

  const { unique, duplicateIds } = deduplicateNotifications(filtered);
  if (duplicateIds.length > 0) {
    writeStoredNotifications(unique);
  }

  return NextResponse.json({ success: true, notifications: unique });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notification } = body;
    if (!notification || !notification.title) {
      return NextResponse.json({ success: false, error: 'Invalid notification data' }, { status: 400 });
    }

    const newNotif: NotificationModel = {
      ...notification,
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      is_read: false,
      created_at: notification.created_at || new Date().toISOString(),
    };

    const current = readStoredNotifications();

    // Deduplication check: if notification with same dedup_key or exact title already exists for this client, don't duplicate
    if (newNotif.dedup_key) {
      const existing = current.find(
        (n) =>
          n.dedup_key === newNotif.dedup_key &&
          (n.client_id === newNotif.client_id || (n.client_email && n.client_email === newNotif.client_email))
      );
      if (existing) {
        return NextResponse.json({ success: true, notification: existing, duplicated: true });
      }
    }

    current.unshift(newNotif);
    writeStoredNotifications(current);

    // Sync to Supabase table
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        let targetClientId = newNotif.client_id && newNotif.client_id.length > 30 ? newNotif.client_id : undefined;
        if (!targetClientId && newNotif.client_email) {
          try {
            const { data: cRow } = await supabase.from('clients').select('id').ilike('email', newNotif.client_email).maybeSingle();
            if (cRow?.id) {
              targetClientId = cRow.id;
              newNotif.client_id = cRow.id;
            }
          } catch {}
        }

        await supabase.from('notifications').insert({
          id: newNotif.id.includes('-') && newNotif.id.length > 30 ? newNotif.id : undefined,
          client_id: targetClientId,
          project_id: newNotif.project_id && newNotif.project_id.length > 30 ? newNotif.project_id : undefined,
          title: newNotif.title,
          message: newNotif.message,
          link: newNotif.link,
          is_read: false,
          dedup_key: newNotif.dedup_key,
        });
      } catch {}
    }

    return NextResponse.json({ success: true, notification: newNotif });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, clientId, clientEmail } = body;

    const current = readStoredNotifications();
    const supabase = getSupabaseServerClient();

    if (action === 'mark_read' && id) {
      const updated = current.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      writeStoredNotifications(updated);

      if (supabase && id.length > 30) {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    if (action === 'mark_all_read') {
      const cleanEmail = clientEmail?.trim().toLowerCase();
      const updated = current.map((n) => {
        if (
          (!clientId && !clientEmail) ||
          (clientId && n.client_id === clientId) ||
          (cleanEmail && n.client_email?.toLowerCase() === cleanEmail)
        ) {
          return { ...n, is_read: true };
        }
        return n;
      });
      writeStoredNotifications(updated);

      if (supabase) {
        try {
          if (clientId && clientId.length > 30) {
            await supabase.from('notifications').update({ is_read: true }).eq('client_id', clientId);
          }
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    let clientId = searchParams.get('clientId');
    let clientEmail = searchParams.get('clientEmail')?.toLowerCase().trim();

    if (!id && !clientId && !clientEmail) {
      try {
        const body = await req.json();
        if (body.id) id = body.id;
        if (body.clientId) clientId = body.clientId;
        if (body.clientEmail) clientEmail = body.clientEmail?.toLowerCase().trim();
      } catch {}
    }

    const current = readStoredNotifications();
    const supabase = getSupabaseServerClient();

    if (id) {
      const updated = current.filter((n) => n.id !== id);
      writeStoredNotifications(updated);

      if (supabase && id.length > 30) {
        try {
          await supabase.from('notifications').delete().eq('id', id);
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    if (clientId || clientEmail) {
      const updated = current.filter((n) => {
        if (clientId && n.client_id === clientId) return false;
        if (clientEmail && n.client_email?.toLowerCase() === clientEmail) return false;
        return true;
      });
      writeStoredNotifications(updated);

      if (supabase && clientId && clientId.length > 30) {
        try {
          await supabase.from('notifications').delete().eq('client_id', clientId);
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Client notifications cleared' });
    }

    return NextResponse.json({ success: false, error: 'Missing id or client identifier' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
