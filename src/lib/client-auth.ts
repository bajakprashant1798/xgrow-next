'use client';

import { ClientModel } from './supabase/types';
import { initialClients } from './seed-data';
import { getClients } from './db';

const CURRENT_CLIENT_KEY = 'xgro_active_client_id';

export function getActiveClientId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authStored = localStorage.getItem('xgro_current_auth_user');
    if (authStored) {
      const authUser = JSON.parse(authStored);
      if (authUser?.role === 'client' && authUser.id) return authUser.id;
    }
    const stored = localStorage.getItem(CURRENT_CLIENT_KEY);
    return stored || null;
  } catch (e) {
    return null;
  }
}

export function setActiveClientId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_CLIENT_KEY, id);
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving active client id', e);
  }
}

export async function getActiveClient(): Promise<ClientModel | null> {
  const currentId = getActiveClientId();
  const clients = await getClients();
  if (currentId) {
    const matched = clients.find((c) => c.id === currentId || c.email.toLowerCase() === currentId.toLowerCase());
    if (matched) return matched;
  }
  return null;
}
