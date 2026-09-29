import { NextRequest, NextResponse } from 'next/server';
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
      temporaryPassword: 'password123',
    },
    'admin@xgro.in': {
      email: 'admin@xgro.in',
      name: 'Admin',
      role: 'admin',
      temporaryPassword: 'adminpassword',
    },
    'bhautik@xgro.in': {
      email: 'bhautik@xgro.in',
      name: 'Bhautik Chauhan',
      role: 'admin',
      temporaryPassword: 'adminpassword',
    },
    'rockhappy1798@gmail.com': {
      email: 'rockhappy1798@gmail.com',
      name: 'Rock Happy',
      role: 'client',
      temporaryPassword: 'password123',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cleanEmail = (body.email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Email parameter required.' }, { status: 400 });
    }

    const store = getStoredCredentials();
    const cred = store[cleanEmail];

    if (!cred) {
      return NextResponse.json({ success: false, error: 'User credential record not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      name: cred.name || cleanEmail.split('@')[0],
      role: cred.role || 'client',
      password: cred.temporaryPassword || '',
      hasTemporaryPassword: !!cred.temporaryPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
