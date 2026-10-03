import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';

export interface StoredUserCredential {
  email: string;
  temporaryPassword?: string;
  name?: string;
  role?: string;
  phone?: string;
  company_name?: string;
  department?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending_approval';
  selected_plan?: string;
  updatedAt: string;
  createdByAdmin: boolean;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');

// Default initial system accounts
const defaultCredentials: Record<string, StoredUserCredential & { id?: string }> = {
  'bajakprashant1998@gmail.com': {
    id: 'team-admin-1',
    email: 'bajakprashant1998@gmail.com',
    name: 'Prashant Bajak',
    role: 'admin',
    department: 'Super Admin & Agency Director',
    temporaryPassword: 'password123',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'admin@xgro.in': {
    id: 'team-admin-1',
    email: 'admin@xgro.in',
    name: 'Admin',
    role: 'admin',
    department: 'Administration',
    temporaryPassword: 'adminpassword',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'bhautik@xgro.in': {
    id: 'team-1',
    email: 'bhautik@xgro.in',
    name: 'Bhautik Chauhan',
    role: 'admin',
    department: 'Executive Leadership',
    temporaryPassword: 'adminpassword',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'pooran@xgro.in': {
    id: 'team-pooran',
    email: 'pooran@xgro.in',
    name: 'Pooran Kushwah',
    role: 'developer',
    department: 'WordPress Development',
    temporaryPassword: 'password123',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'neha@xgro.in': {
    id: 'team-neha',
    email: 'neha@xgro.in',
    name: 'Neha Singh',
    role: 'marketer',
    department: 'Content & Copywriting',
    temporaryPassword: 'password123',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'sachin@xgro.in': {
    id: 'team-sachin',
    email: 'sachin@xgro.in',
    name: 'Sachin Yadav',
    role: 'marketer',
    department: 'SEO & Digital Marketing',
    temporaryPassword: 'password123',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'rockhappy1798@gmail.com': {
    id: 'cli-1',
    email: 'rockhappy1798@gmail.com',
    name: 'Rock Happy',
    role: 'client',
    company_name: 'Rock Global Ventures',
    temporaryPassword: 'password123',
    updatedAt: new Date().toISOString(),
    createdByAdmin: false,
    status: 'active',
  },
  'samridhiarora79@gmail.com': {
    id: 'cli-samridhi',
    email: 'samridhiarora79@gmail.com',
    name: 'Samridhi Arora',
    role: 'client',
    company_name: 'Arora Growth Studio',
    temporaryPassword: 'ieg55k*%K$nY',
    updatedAt: new Date().toISOString(),
    createdByAdmin: true,
    status: 'active',
  },
  'bajakhome@gmail.com': {
    id: 'cli-2',
    email: 'bajakhome@gmail.com',
    name: 'Bajak Home',
    role: 'client',
    temporaryPassword: 'MyCustomPass2026',
    updatedAt: new Date().toISOString(),
    createdByAdmin: true,
    status: 'active',
  },
};

// In-memory server-side cache
let memoryStore: Record<string, StoredUserCredential> = { ...defaultCredentials };

// Helper to read from disk
function readStoreFromDisk(): Record<string, StoredUserCredential> {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        memoryStore = { ...defaultCredentials, ...parsed };
        return memoryStore;
      }
    }
  } catch (e) {
    console.warn('[Credentials API] Error reading disk storage:', e);
  }
  return memoryStore;
}

// Helper to write to disk
function writeStoreToDisk(store: Record<string, StoredUserCredential>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Credentials API] Error writing disk storage:', e);
  }
}

// Initialize on module load
readStoreFromDisk();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || !url.startsWith('http')) return null;
  return createBrowserClient(url, anonKey);
}

// Strip sensitive passwords for public requests
function sanitizeCredential(cred: StoredUserCredential, isAdmin: boolean) {
  if (isAdmin) return cred;
  return {
    ...cred,
    hasTemporaryPassword: !!cred.temporaryPassword,
    temporaryPassword: undefined, // Never expose password in public GET requests
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailParam = searchParams.get('email')?.trim().toLowerCase();
  const isAdmin =
    request.headers.get('x-admin-auth') === 'true' ||
    searchParams.get('admin_view') === 'true';

  // If memory store is empty or needs init, read from disk once
  if (Object.keys(memoryStore).length <= 4) {
    readStoreFromDisk();
  }

  if (emailParam) {
    const cred = memoryStore[emailParam] || null;
    if (!cred) {
      return NextResponse.json({ success: true, credential: null, email: emailParam });
    }
    return NextResponse.json({
      success: true,
      credential: sanitizeCredential(cred, isAdmin),
      email: emailParam,
    });
  }

  const sanitizedMap: Record<string, any> = {};
  for (const [key, val] of Object.entries(memoryStore)) {
    sanitizedMap[key] = sanitizeCredential(val, isAdmin);
  }

  return NextResponse.json({ success: true, credentials: sanitizedMap });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabase();

    readStoreFromDisk();

    if (body.credentials && typeof body.credentials === 'object') {
      Object.assign(memoryStore, body.credentials);
    } else if (body.email) {
      const cleanEmail = body.email.trim().toLowerCase();
      const existing = memoryStore[cleanEmail] || {};
      memoryStore[cleanEmail] = {
        ...existing,
        email: cleanEmail,
        temporaryPassword: body.password || body.temporaryPassword || existing.temporaryPassword,
        name: body.name || existing.name,
        role: body.role || existing.role || 'client',
        phone: body.phone || existing.phone,
        company_name: body.company_name || existing.company_name,
        department: body.department || existing.department,
        address: body.address || existing.address,
        status: body.status || existing.status || 'active',
        selected_plan: body.selected_plan || existing.selected_plan,
        updatedAt: new Date().toISOString(),
        createdByAdmin: body.createdByAdmin ?? existing.createdByAdmin ?? true,
      };
    }

    // Persist to disk
    writeStoreToDisk(memoryStore);

    // Sync to Supabase custom_roles table if accessible
    if (supabase) {
      try {
        await supabase.from('custom_roles').upsert({
          id: 'role-sys-credentials',
          name: 'System Auth Credentials Store',
          key: '_sys_auth_credentials',
          description: 'Internal credential synchronization cache',
          is_system: true,
          permissions: { credentials: memoryStore } as any,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[Credentials API] Supabase upsert note:', e);
      }
    }

    return NextResponse.json({ success: true, count: Object.keys(memoryStore).length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
