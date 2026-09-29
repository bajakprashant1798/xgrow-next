import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');

function getStoredCredentials(): Record<string, any> {
  const defaultCredentials: Record<string, any> = {
    'bajakprashant1998@gmail.com': {
      email: 'bajakprashant1998@gmail.com',
      name: 'Prashant Bajak',
      role: 'admin',
      department: 'Super Admin & Agency Director',
      temporaryPassword: 'password123',
      status: 'active',
    },
    'admin@xgro.in': {
      email: 'admin@xgro.in',
      name: 'Admin',
      role: 'admin',
      department: 'Administration',
      temporaryPassword: 'adminpassword',
      status: 'active',
    },
    'bhautik@xgro.in': {
      email: 'bhautik@xgro.in',
      name: 'Bhautik Chauhan',
      role: 'admin',
      department: 'Executive Leadership',
      temporaryPassword: 'adminpassword',
      status: 'active',
    },
    'rockhappy1798@gmail.com': {
      email: 'rockhappy1798@gmail.com',
      name: 'Rock Happy',
      role: 'client',
      company_name: 'Rock Global Ventures',
      temporaryPassword: 'password123',
      status: 'active',
    },
  };

  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return { ...defaultCredentials, ...parsed };
      }
    }
  } catch (e) {}

  return defaultCredentials;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || !url.startsWith('http')) return null;
  return createBrowserClient(url, anonKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const rawPassword = body.password || '';
    const enteredPassword = rawPassword.trim();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Please enter your email address.' }, { status: 400 });
    }
    if (!enteredPassword) {
      return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });
    }

    const store = getStoredCredentials();
    const userRecord = store[cleanEmail];

    let isAuthenticated = false;
    let userId: string | undefined = undefined;

    // 1. Verify against server stored credential (server-side only, never leaked)
    if (userRecord && userRecord.temporaryPassword) {
      if (
        userRecord.temporaryPassword === enteredPassword ||
        userRecord.temporaryPassword === rawPassword ||
        userRecord.temporaryPassword.trim() === enteredPassword
      ) {
        isAuthenticated = true;
      }
    }

    // 2. Also attempt Supabase Auth if not matched in store
    if (!isAuthenticated) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: enteredPassword,
          });
          if (!error && data?.user) {
            isAuthenticated = true;
            userId = data.user.id;
          }
        } catch (e) {}
      }
    }

    if (!isAuthenticated) {
      if (userRecord) {
        return NextResponse.json(
          {
            success: false,
            error: 'The password you entered is incorrect. Please double-check your password and try again.',
          },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `No registered account found with email "${cleanEmail}". Please check your email address or contact an administrator.`,
          },
          { status: 404 }
        );
      }
    }

    // Account status check
    if (userRecord?.status === 'inactive') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account has been deactivated by the Administrator. Please contact support.',
        },
        { status: 403 }
      );
    }

    if (userRecord?.status === 'pending_approval') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account is pending administrator approval.',
        },
        { status: 403 }
      );
    }

    // Build safe user profile payload WITHOUT exposing passwords
    const safeUser = {
      id: userId || `user-${Date.now()}`,
      email: cleanEmail,
      name: userRecord?.name || (cleanEmail === 'bajakprashant1998@gmail.com' ? 'Prashant Bajak' : cleanEmail.split('@')[0]),
      role: userRecord?.role || (cleanEmail === 'bajakprashant1998@gmail.com' ? 'admin' : 'client'),
      phone: userRecord?.phone,
      company_name: userRecord?.company_name,
      department: userRecord?.department,
      address: userRecord?.address,
      selected_plan: userRecord?.selected_plan,
      status: userRecord?.status || 'active',
    };

    return NextResponse.json({
      success: true,
      role: safeUser.role,
      user: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication error occurred.' },
      { status: 500 }
    );
  }
}
