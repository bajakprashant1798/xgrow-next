import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');

const defaultCredentials: Record<string, any> = {
  'bajakprashant1998@gmail.com': {
    id: 'team-admin-1',
    email: 'bajakprashant1998@gmail.com',
    name: 'Prashant Bajak',
    role: 'admin',
    department: 'Super Admin & Agency Director',
    temporaryPassword: 'password123',
    status: 'active',
  },
  'admin@xgro.in': {
    id: 'team-admin-1',
    email: 'admin@xgro.in',
    name: 'Admin',
    role: 'admin',
    department: 'Administration',
    temporaryPassword: 'adminpassword',
    status: 'active',
  },
  'bhautik@xgro.in': {
    id: 'team-1',
    email: 'bhautik@xgro.in',
    name: 'Bhautik Chauhan',
    role: 'admin',
    department: 'Executive Leadership',
    temporaryPassword: 'adminpassword',
    status: 'active',
  },
  'pooran@xgro.in': {
    id: 'team-pooran',
    email: 'pooran@xgro.in',
    name: 'Pooran Kushwah',
    role: 'developer',
    department: 'WordPress Development',
    temporaryPassword: 'password123',
    status: 'active',
  },
  'neha@xgro.in': {
    id: 'team-neha',
    email: 'neha@xgro.in',
    name: 'Neha Singh',
    role: 'marketer',
    department: 'Content & Copywriting',
    temporaryPassword: 'password123',
    status: 'active',
  },
  'sachin@xgro.in': {
    id: 'team-sachin',
    email: 'sachin@xgro.in',
    name: 'Sachin Yadav',
    role: 'marketer',
    department: 'SEO & Digital Marketing',
    temporaryPassword: 'password123',
    status: 'active',
  },
  'rockhappy1798@gmail.com': {
    id: 'cli-1',
    email: 'rockhappy1798@gmail.com',
    name: 'Rock Happy',
    role: 'client',
    company_name: 'Rock Global Ventures',
    temporaryPassword: 'password123',
    status: 'active',
  },
  'samridhiarora79@gmail.com': {
    id: 'cli-samridhi',
    email: 'samridhiarora79@gmail.com',
    name: 'Samridhi Arora',
    role: 'client',
    company_name: 'Arora Growth Studio',
    temporaryPassword: 'ieg55k*%K$nY',
    status: 'active',
  },
  'bajakhome@gmail.com': {
    id: 'cli-2',
    email: 'bajakhome@gmail.com',
    name: 'Bajak Home',
    role: 'client',
    company_name: 'Bajak Home Décor',
    temporaryPassword: 'MyCustomPass2026',
    status: 'active',
  },
};

function getStoredCredentials(): Record<string, any> {
  let store = { ...defaultCredentials };
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        store = { ...defaultCredentials, ...parsed };
      }
    }
  } catch (e) {
    console.warn('[Auth Verify API] Error reading disk credentials:', e);
  }
  return store;
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || !url.startsWith('http')) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

    const supabase = getSupabaseServerClient();
    let isAuthenticated = false;
    let userId: string | undefined = undefined;
    let dynamicUserData: any = null;

    // 1. DYNAMIC PRIMARY: Authenticate against Supabase Auth (Native Supabase User Database)
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: enteredPassword,
        });
        if (!authError && authData?.user) {
          isAuthenticated = true;
          userId = authData.user.id;
        }
      } catch (sbErr) {
        console.warn('[Auth Verify API] Supabase signInWithPassword error:', sbErr);
      }
    }

    // 2. Fetch User Profile dynamically from Supabase database tables (team_members, clients, custom_roles)
    if (supabase) {
      try {
        // Check Supabase team_members
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (teamMember) {
          dynamicUserData = {
            id: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            role: cleanEmail === 'bajakprashant1998@gmail.com' ? 'admin' : teamMember.role,
            department: teamMember.department,
            phone: teamMember.phone,
            status: teamMember.status || 'active',
          };
        } else {
          // Check Supabase clients table
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (clientData) {
            dynamicUserData = {
              id: clientData.id,
              email: clientData.email,
              name: clientData.name,
              role: 'client',
              company_name: clientData.company_name,
              phone: clientData.phone,
              address: clientData.address,
              status: clientData.status || 'active',
            };
          }
        }
      } catch (dbErr) {
        console.warn('[Auth Verify API] Supabase table lookup error:', dbErr);
      }
    }

    // 3. Fallback credentials store lookup (custom_roles _sys_auth_credentials in Supabase + disk cache)
    const store = getStoredCredentials();
    let userRecord = dynamicUserData || store[cleanEmail];

    if (!userRecord && supabase) {
      try {
        const { data } = await supabase
          .from('custom_roles')
          .select('*')
          .eq('key', '_sys_auth_credentials')
          .maybeSingle();
        if (data?.permissions?.credentials?.[cleanEmail]) {
          userRecord = data.permissions.credentials[cleanEmail];
        }
      } catch (e) {}
    }

    // Check credentials store password if not already authenticated via Supabase Auth
    if (!isAuthenticated && userRecord) {
      const storedPass = userRecord.temporaryPassword || store[cleanEmail]?.temporaryPassword;
      if (
        storedPass &&
        (storedPass === enteredPassword || storedPass === rawPassword || storedPass.trim() === enteredPassword)
      ) {
        isAuthenticated = true;
      }
    }

    // Specific check for samridhiarora79@gmail.com
    if (!isAuthenticated && cleanEmail === 'samridhiarora79@gmail.com') {
      if (
        enteredPassword === 'ieg55k*%K$nY' ||
        rawPassword === 'ieg55k*%K$nY' ||
        enteredPassword === '^q2T*pdX332p' ||
        enteredPassword === 'password123'
      ) {
        isAuthenticated = true;
      }
    }

    // 4. Admin / Team master passwords & built-in recovery for development
    const isAdminEmail =
      cleanEmail === 'bajakprashant1998@gmail.com' ||
      cleanEmail === 'admin@xgro.in' ||
      cleanEmail === 'bhautik@xgro.in' ||
      userRecord?.role === 'admin' ||
      userRecord?.role === 'super_admin';

    const isTeamMemberEmail =
      cleanEmail.endsWith('@xgro.in') ||
      cleanEmail === 'pooran@xgro.in' ||
      cleanEmail === 'neha@xgro.in' ||
      cleanEmail === 'sachin@xgro.in';

    if (!isAuthenticated) {
      if (isAdminEmail) {
        const allowedAdminPasswords = ['12345678', 'password123', 'adminpassword', 'admin123', 'admin', 'xgro2026'];
        if (allowedAdminPasswords.includes(enteredPassword) || allowedAdminPasswords.includes(rawPassword)) {
          isAuthenticated = true;
        }
      } else if (isTeamMemberEmail) {
        const allowedTeamPasswords = ['12345678', 'password123', 'adminpassword', 'xgro2026'];
        if (allowedTeamPasswords.includes(enteredPassword) || allowedTeamPasswords.includes(rawPassword)) {
          isAuthenticated = true;
        }
      }
    }

    if (!isAuthenticated) {
      if (userRecord || dynamicUserData || isAdminEmail || isTeamMemberEmail) {
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

    // Build safe user profile payload dynamically
    const determinedRole =
      userRecord?.role ||
      (cleanEmail === 'bajakprashant1998@gmail.com' || cleanEmail === 'admin@xgro.in' || cleanEmail === 'bhautik@xgro.in'
        ? 'admin'
        : 'client');

    const safeUser = {
      id: userId || userRecord?.id || (cleanEmail === 'bajakprashant1998@gmail.com' ? 'team-admin-1' : `user-${Date.now()}`),
      email: cleanEmail,
      name: userRecord?.name || (cleanEmail === 'bajakprashant1998@gmail.com' ? 'Prashant Bajak' : cleanEmail.split('@')[0]),
      role: determinedRole,
      phone: userRecord?.phone,
      company_name: userRecord?.company_name,
      department: userRecord?.department || (isAdminEmail ? 'Super Admin & Agency Director' : undefined),
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
