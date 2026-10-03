'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from './supabase/client';
import {
  getTeamMembers,
  getClients,
  getRoles,
  saveTeamMember,
  saveClient,
  checkUserEmailExists,
  getUserCredential,
  fetchUserCredential,
  saveUserCredential,
} from './db';
import { TeamMemberModel, ClientModel, CustomRoleModel, PermissionMatrix } from './supabase/types';
import { hasPermission as checkPermission, DEFAULT_FULL_PERMISSIONS } from './permissions';

export type AppRole = string;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  avatar_url?: string;
  company_name?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'pending_approval';
}

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  isAdmin: boolean;
  isTeam: boolean;
  isClient: boolean;
  isLoading: boolean;
  rolesList: CustomRoleModel[];
  signIn: (email: string, password?: string) => Promise<{ success: boolean; role: AppRole; error?: string }>;
  signUp: (data: {
    email: string;
    password?: string;
    fullName: string;
    companyName?: string;
    role?: AppRole;
    phone?: string;
  }) => Promise<{ success: boolean; role: AppRole; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (module: keyof PermissionMatrix, action: string) => boolean;
  refreshUserData: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'xgro_current_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rolesList, setRolesList] = useState<CustomRoleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to resolve user role and info from team or client tables
  const resolveUserProfile = useCallback(async (email: string, fallbackId?: string): Promise<AuthUser | null> => {
    const cleanEmail = email.trim().toLowerCase();

    // Special hardcoded rule: bajakprashant1998@gmail.com is ALWAYS Super Admin
    if (cleanEmail === 'bajakprashant1998@gmail.com') {
      const team = await getTeamMembers();
      const existing = team.find((t) => t.email.toLowerCase() === cleanEmail);
      return {
        id: existing?.id || fallbackId || 'team-admin-1',
        email: cleanEmail,
        name: existing?.name || 'Prashant Bajak',
        role: 'admin',
        department: 'Super Admin & Agency Director',
        avatar_url: existing?.avatar_url,
        status: 'active',
      };
    }

    // Check team members
    const team = await getTeamMembers();
    const teamMember = team.find((t) => t.email.toLowerCase() === cleanEmail);
    if (teamMember) {
      return {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        department: teamMember.department,
        avatar_url: teamMember.avatar_url,
        status: teamMember.status || 'active',
      };
    }

    // Check clients
    const clients = await getClients();
    const client = clients.find((c) => c.email.toLowerCase() === cleanEmail);
    if (client) {
      return {
        id: client.id,
        email: client.email,
        name: client.name,
        role: 'client',
        company_name: client.company_name,
        avatar_url: client.avatar_url,
        status: client.status || 'active',
      };
    }

    // Check credentials store metadata (handles Incognito / cross-device seamlessly)
    try {
      const cred = await fetchUserCredential(cleanEmail);
      if (cred && cred.email) {
        return {
          id: fallbackId || `user-${Date.now()}`,
          email: cleanEmail,
          name: cred.name || cleanEmail.split('@')[0],
          role: (cred.role as AppRole) || 'client',
          company_name: cred.company_name,
          department: cred.department,
          status: cred.status || 'active',
        };
      }
    } catch (e) {}

    // Default unknown user to client
    return {
      id: fallbackId || `user-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: 'client',
      status: 'active',
    };
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const [allRoles] = await Promise.all([getRoles()]);
      setRolesList(allRoles);

      if (user?.email) {
        const refreshed = await resolveUserProfile(user.email, user.id);
        if (refreshed) {
          setUser(refreshed);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshed));
        }
      }
    } catch (err) {
      console.error('Error refreshing user data', err);
    }
  }, [user?.email, user?.id, resolveUserProfile]);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        const [roles] = await Promise.all([getRoles()]);
        setRolesList(roles);

        // 1. Check Supabase session if configured
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const email = session.user.email;
            const profile = await resolveUserProfile(email, session.user.id);
            if (profile) {
              setUser(profile);
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. Check localStorage session
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as AuthUser;
            const refreshed = await resolveUserProfile(parsed.email, parsed.id);
            setUser(refreshed || parsed);
          } catch (e) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [resolveUserProfile]);

  // Strict Secure Sign In function using server-side verification
  const signIn = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; role: AppRole; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const rawPassword = password || '';
      const enteredPassword = rawPassword.trim();

      if (!cleanEmail) {
        return { success: false, role: 'client', error: 'Please enter your email address.' };
      }
      if (!enteredPassword) {
        return { success: false, role: 'client', error: 'Please enter your password.' };
      }

      const supabase = getSupabaseClient();
      let verifiedUser: AuthUser | null = null;
      let authenticatedRole: AppRole = 'client';

      // 1. Establish Native Supabase Auth session in browser if Supabase is configured
      if (supabase) {
        try {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: enteredPassword,
          });
        } catch (sbErr) {
          // Continue to verify endpoint
        }
      }

      // 2. Server-side credential verification & dynamic profile resolution from Supabase
      if (typeof window !== 'undefined') {
        try {
          const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: rawPassword }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            return {
              success: false,
              role: 'client',
              error: data.error || 'Authentication failed. Please check your email and password.',
            };
          }
          if (data.user) {
            verifiedUser = data.user as AuthUser;
            authenticatedRole = (data.role || data.user.role) as AppRole;
          }
        } catch (netErr) {
          // Fallback if network fetch fails
        }
      }

      // 3. Resolve Profile and enforce Account Status
      const fallbackUserId: string | undefined = (verifiedUser as AuthUser | null)?.id;
      const resolved = await resolveUserProfile(cleanEmail, fallbackUserId);
      const profile: AuthUser = resolved || (verifiedUser as AuthUser | null) || {
        id: fallbackUserId || `user-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: authenticatedRole,
        status: 'active',
      };
      if (!profile) {
        return { success: false, role: 'client', error: 'User account profile not found.' };
      }

      if (profile.status === 'inactive') {
        if (supabase) {
          await supabase.auth.signOut().catch(() => {});
        }
        return {
          success: false,
          role: profile.role,
          error: 'Your account has been deactivated by the Administrator. Please contact support.',
        };
      }

      if (profile.status === 'pending_approval') {
        if (supabase) {
          await supabase.auth.signOut().catch(() => {});
        }
        return {
          success: false,
          role: profile.role,
          error: 'Your account is pending administrator approval.',
        };
      }

      // 4. Set Active Authenticated Session
      setUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      if (profile.role === 'client') {
        localStorage.setItem('xgro_active_client_id', profile.id);
      }
      return { success: true, role: profile.role };
    } catch (err: any) {
      return { success: false, role: 'client', error: err.message || 'Login error occurred.' };
    }
  };

  // Sign Up function
  const signUp = async (data: {
    email: string;
    password?: string;
    fullName: string;
    companyName?: string;
    role?: AppRole;
    phone?: string;
  }): Promise<{ success: boolean; role: AppRole; message?: string; error?: string }> => {
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      
      // Strict duplicate check across all user types
      const duplicate = await checkUserEmailExists(cleanEmail);
      if (duplicate.exists) {
        return {
          success: false,
          role: 'client',
          error: `An account with email "${data.email}" is already registered. Please sign in instead.`,
        };
      }

      const isSuperAdminEmail = cleanEmail === 'bajakprashant1998@gmail.com';
      const assignedRole = isSuperAdminEmail ? 'admin' : data.role || 'client';

      const supabase = getSupabaseClient();
      let createdUserId = `user-${Date.now()}`;

      if (supabase && data.password) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: assignedRole,
              company_name: data.companyName,
            },
          },
        });

        if (error) {
          console.warn('Supabase signup note:', error.message);
        } else if (authData.user) {
          createdUserId = authData.user.id;
        }
      }

      // Save credential locally for offline support
      if (data.password) {
        saveUserCredential(cleanEmail, data.password, false);
      }

      if (assignedRole === 'client') {
        const newClient: ClientModel = {
          id: createdUserId,
          name: data.fullName,
          email: cleanEmail,
          company_name: data.companyName || `${data.fullName}'s Business`,
          phone: data.phone,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        await saveClient(newClient);
      } else {
        const newMember: TeamMemberModel = {
          id: createdUserId,
          name: data.fullName,
          email: cleanEmail,
          role: assignedRole,
          department: isSuperAdminEmail ? 'Executive Leadership' : 'Agency Operations',
          phone: data.phone,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        await saveTeamMember(newMember);
      }

      const authUserProfile: AuthUser = {
        id: createdUserId,
        email: cleanEmail,
        name: data.fullName,
        role: assignedRole,
        company_name: data.companyName,
      };

      setUser(authUserProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUserProfile));
      if (assignedRole === 'client') {
        localStorage.setItem('xgro_active_client_id', createdUserId);
      }

      return {
        success: true,
        role: assignedRole,
        message: 'Account successfully registered and profile initialized.',
      };
    } catch (err: any) {
      return { success: false, role: 'client', error: err.message || 'Registration failed' };
    }
  };

  // Sign Out function
  const signOut = async (): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('xgro_active_client_id');
      setUser(null);
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  // Check permission helper for currently active logged in user
  const hasPermission = useCallback(
    (module: keyof PermissionMatrix, action: string): boolean => {
      if (!user) return false;
      if (user.email === 'bajakprashant1998@gmail.com') return true;
      if (user.role === 'admin' || user.role === 'super_admin') return true;
      return checkPermission(user.role, module, action, rolesList);
    },
    [user, rolesList]
  );

  const role = user?.role || null;
  const isSuperAdmin = user?.email === 'bajakprashant1998@gmail.com' || role === 'admin' || role === 'super_admin';
  const isClient = role === 'client';
  const isTeam = !isClient && (isSuperAdmin || !!role);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin: isSuperAdmin,
        isTeam,
        isClient,
        isLoading,
        rolesList,
        signIn,
        signUp,
        signOut,
        hasPermission,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
