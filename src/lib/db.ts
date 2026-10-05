'use client';

import {
  ServiceModel,
  PricingPlanModel,
  ClientModel,
  TeamMemberModel,
  ProjectModel,
  MilestoneModel,
  TaskModel,
  ProjectUpdateModel,
  InvoiceDocumentModel,
  NotificationModel,
  TestimonialModel,
  FaqModel,
  ProjectStatus,
  CustomRoleModel,
  TrustedLogoModel,
  HeroBannerModel,
} from './supabase/types';

import {
  initialServices,
  initialPricingPlans,
  initialClients,
  initialTeamMembers,
  initialProjects,
  initialNotifications,
  initialTestimonials,
  initialFaqs,
  initialRoles,
  initialTrustedLogos,
  initialHeroBanners,
} from './seed-data';

import { initialResources, ResourceItem, ResourceType } from './resourcesData';
import { getServicesForPlan } from './client-services';

import { getSupabaseClient } from './supabase/client';
import { compressDataUrl, compressImageFile } from './image-compressor';

const STORAGE_KEYS = {
  SERVICES: 'xgro_cms_services',
  PRICING: 'xgro_cms_pricing',
  CLIENTS: 'xgro_clients',
  TEAM: 'xgro_team_members',
  PROJECTS: 'xgro_projects',
  NOTIFICATIONS: 'xgro_notifications',
  TESTIMONIALS: 'xgro_testimonials',
  FAQS: 'xgro_faqs',
  RESOURCES: 'xgro_cms_resources',
  ROLES: 'xgro_custom_roles',
  TRUSTED_LOGOS: 'xgro_trusted_logos',
  TRUSTED_SECTION_TITLE: 'xgro_trusted_section_title',
  USER_CREDENTIALS: 'xgro_user_credentials',
  HERO_BANNERS: 'xgro_hero_banners',
  ACTIVE_HERO_ID: 'xgro_active_hero_id',
};

// Clear stale legacy dummy data and huge uncompressed caches from browser localStorage on init
const STORAGE_CLEAN_VERSION = 'xgro_v8_services_sync';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('xgro_cache_ver') !== STORAGE_CLEAN_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.TEAM);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.TRUSTED_LOGOS);
      localStorage.setItem('xgro_cache_ver', STORAGE_CLEAN_VERSION);
    }
  } catch (e) {
    // Ignore in SSR
  }
}

// Simple event dispatcher for real-time reactivity across components
const listeners = new Set<() => void>();

export function subscribeToDataChanges(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn('Error executing store subscriber callback', err);
      }
    });
  }
}

// In-memory cache for instant 0ms responses across routes
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 30000; // 30 seconds fresh before background revalidation
const inflightRequests: Record<string, Promise<any>> = {};

// Helper to safely read from localStorage
function getLocalItem<T>(key: string, fallback: T): T {
  if (memoryCache[key]?.data !== undefined && memoryCache[key]?.data !== null) {
    return memoryCache[key].data as T;
  }
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'null' || item === 'undefined') {
      if (fallback !== null && fallback !== undefined) {
        try {
          localStorage.setItem(key, JSON.stringify(fallback));
        } catch (_) {}
      }
      return fallback;
    }
    const parsed = JSON.parse(item) as T;
    if (parsed === null || parsed === undefined) {
      return fallback;
    }
    memoryCache[key] = { data: parsed, timestamp: Date.now() };
    return parsed;
  } catch (e) {
    console.warn(`Error reading ${key} from storage, using fallback:`, e);
    return fallback;
  }
}

// Helper to write to localStorage & memory cache with QuotaExceeded resilience
function setLocalItem<T>(key: string, value: T): void {
  memoryCache[key] = { data: value, timestamp: Date.now() };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage quota exceeded in browser — fallback gracefully to memoryCache
      console.warn(`LocalStorage quota exceeded while saving ${key}. Saved to in-memory state.`);
    }
  }
  notifyDataChanged();
}

// Helper to silently update cache without triggering notification cascade
function setLocalItemSilent<T>(key: string, value: T): void {
  memoryCache[key] = { data: value, timestamp: Date.now() };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }
}

// Ultra-fast Stale-While-Revalidate (SWR) cache fetcher
async function fetchWithSWR<T>(
  key: string,
  fetcher: () => Promise<T | null>,
  fallback: T
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache[key];

  // 1. If memory cache exists and is fresh (< CACHE_TTL_MS), return immediately (0ms)
  if (cached && cached.data !== undefined && cached.data !== null && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  // 2. If memory cache exists but is stale, or localStorage has data:
  // Return the cached data instantly AND trigger non-blocking background refresh
  let immediateData: T | null = cached && cached.data !== undefined && cached.data !== null ? (cached.data as T) : null;
  if (!immediateData && typeof window !== 'undefined') {
    const local = getLocalItem<T>(key, fallback);
    if (local !== null && local !== undefined) {
      immediateData = local;
      memoryCache[key] = { data: local, timestamp: now };
    }
  }

  if (immediateData) {
    // Revalidate in background without blocking caller
    if (!inflightRequests[key]) {
      inflightRequests[key] = (async () => {
        try {
          const result = await Promise.race([
            fetcher(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
          ]);
          if (result) {
            const hasChanged = JSON.stringify(result) !== JSON.stringify(immediateData);
            memoryCache[key] = { data: result, timestamp: Date.now() };
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(key, JSON.stringify(result));
              } catch (e) {
                // Ignore storage quota
              }
            }
            if (hasChanged) {
              notifyDataChanged();
            }
          }
        } catch (err) {
          console.warn(`Background sync failed for ${key}:`, err);
        } finally {
          delete inflightRequests[key];
        }
      })();
    }
    return immediateData;
  }

  // 3. First-time load with empty cache: fetch directly with 3s timeout race
  if (!inflightRequests[key]) {
    inflightRequests[key] = (async () => {
      try {
        const result = await Promise.race([
          fetcher(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (result) {
          memoryCache[key] = { data: result, timestamp: Date.now() };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(key, JSON.stringify(result));
            } catch (e) {}
          }
          return result;
        }
      } catch (err) {
        console.warn(`Initial fetch failed for ${key}:`, err);
      } finally {
        delete inflightRequests[key];
      }
      return fallback;
    })();
  }

  const res = await inflightRequests[key];
  return res || fallback;
}

// ==============================================================================
// SERVICES CRUD
// ==============================================================================
export async function getServices(): Promise<ServiceModel[]> {
  return fetchWithSWR<ServiceModel[]>(
    STORAGE_KEYS.SERVICES,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as ServiceModel[];
      }
      return null;
    },
    initialServices
  );
}

export async function saveService(service: Partial<ServiceModel> & { title: string }): Promise<ServiceModel> {
  const current = await getServices();
  const slug = service.slug || service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const existingIdx = current.findIndex(s => s.id === service.id || s.slug === slug);
  let savedService: ServiceModel;

  if (existingIdx >= 0) {
    savedService = {
      ...current[existingIdx],
      ...service,
      slug,
      updated_at: new Date().toISOString(),
    } as ServiceModel;
    current[existingIdx] = savedService;
  } else {
    savedService = {
      id: service.id || `srv-${Date.now()}`,
      slug,
      title: service.title,
      category: service.category || 'Web',
      short_description: service.short_description || '',
      full_description: service.full_description || '',
      price: service.price || '',
      discount_price: service.discount_price || '',
      features: service.features || [],
      image_url: service.image_url || '',
      icon: service.icon || 'Laptop',
      status: service.status || 'published',
      display_order: service.display_order ?? (current.length + 1),
      meta_title: service.meta_title || `${service.title} | XGRO`,
      meta_description: service.meta_description || service.short_description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.push(savedService);
  }

  setLocalItem(STORAGE_KEYS.SERVICES, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = savedService.id && savedService.id.includes('-') && savedService.id.length > 30;
      const { data: upserted, error } = await supabase.from('services').upsert({
        id: isUUID ? savedService.id : undefined,
        slug: savedService.slug,
        title: savedService.title,
        category: savedService.category,
        short_description: savedService.short_description,
        full_description: savedService.full_description,
        price: savedService.price,
        discount_price: savedService.discount_price,
        features: savedService.features,
        image_url: savedService.image_url,
        icon: savedService.icon,
        status: savedService.status,
        display_order: savedService.display_order,
        meta_title: savedService.meta_title,
        meta_description: savedService.meta_description,
      }, { onConflict: 'slug' }).select().single();

      if (!error && upserted) {
        savedService.id = upserted.id;
        const updatedList = current.map(s => s.slug === savedService.slug ? (upserted as ServiceModel) : s);
        setLocalItem(STORAGE_KEYS.SERVICES, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing service to Supabase:', e);
    }
  }

  return savedService;
}

export async function deleteService(id: string): Promise<void> {
  const current = await getServices();
  const serviceToDelete = current.find(s => s.id === id || s.slug === id);
  const filtered = current.filter(s => s.id !== id && s.slug !== id);
  setLocalItem(STORAGE_KEYS.SERVICES, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (id.length > 30) {
        await supabase.from('services').delete().eq('id', id);
      } else if (serviceToDelete?.slug) {
        await supabase.from('services').delete().eq('slug', serviceToDelete.slug);
      }
    } catch (e) {
      console.warn('Error deleting service from Supabase:', e);
    }
  }
}

// ==============================================================================
// PRICING PLANS CRUD
// ==============================================================================
export async function getPricingPlans(): Promise<PricingPlanModel[]> {
  return fetchWithSWR<PricingPlanModel[]>(
    STORAGE_KEYS.PRICING,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as PricingPlanModel[];
      }
      return null;
    },
    initialPricingPlans
  );
}

export async function savePricingPlan(plan: Partial<PricingPlanModel> & { name: string; price: string }): Promise<PricingPlanModel> {
  const current = await getPricingPlans();
  const slug = plan.slug || plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existingIdx = current.findIndex(p => p.id === plan.id || p.slug === slug);
  let savedPlan: PricingPlanModel;

  if (existingIdx >= 0) {
    savedPlan = {
      ...current[existingIdx],
      ...plan,
      slug,
      updated_at: new Date().toISOString(),
    } as PricingPlanModel;
    current[existingIdx] = savedPlan;
  } else {
    savedPlan = {
      id: plan.id || `plan-${Date.now()}`,
      name: plan.name,
      slug,
      price: plan.price,
      discount_price: plan.discount_price,
      tag: plan.tag || '',
      highlighted: plan.highlighted ?? false,
      features: plan.features || [],
      status: plan.status || 'published',
      display_order: plan.display_order ?? (current.length + 1),
      cta_label: plan.cta_label || 'Get started',
      cta_link: plan.cta_link || '/contact',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.push(savedPlan);
  }

  setLocalItem(STORAGE_KEYS.PRICING, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = savedPlan.id && savedPlan.id.includes('-') && savedPlan.id.length > 30;
      const { data: upserted, error } = await supabase.from('pricing_plans').upsert({
        id: isUUID ? savedPlan.id : undefined,
        name: savedPlan.name,
        slug: savedPlan.slug,
        price: savedPlan.price,
        discount_price: savedPlan.discount_price,
        tag: savedPlan.tag,
        highlighted: savedPlan.highlighted,
        features: savedPlan.features,
        status: savedPlan.status,
        display_order: savedPlan.display_order,
        cta_label: savedPlan.cta_label,
        cta_link: savedPlan.cta_link,
      }, { onConflict: 'slug' }).select().single();

      if (!error && upserted) {
        savedPlan.id = upserted.id;
        const updatedList = current.map(p => p.slug === savedPlan.slug ? (upserted as PricingPlanModel) : p);
        setLocalItem(STORAGE_KEYS.PRICING, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing pricing plan to Supabase:', e);
    }
  }

  return savedPlan;
}

export async function deletePricingPlan(id: string): Promise<void> {
  const current = await getPricingPlans();
  const planToDelete = current.find(p => p.id === id || p.slug === id);
  const filtered = current.filter(p => p.id !== id && p.slug !== id);
  setLocalItem(STORAGE_KEYS.PRICING, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (id.length > 30) {
        await supabase.from('pricing_plans').delete().eq('id', id);
      } else if (planToDelete?.slug) {
        await supabase.from('pricing_plans').delete().eq('slug', planToDelete.slug);
      }
    } catch (e) {
      console.warn('Error deleting pricing plan from Supabase:', e);
    }
  }
}

// ==============================================================================
// CLIENTS & TEAM MEMBERS
// ==============================================================================
export async function getClients(): Promise<ClientModel[]> {
  const result = await fetchWithSWR<ClientModel[]>(
    STORAGE_KEYS.CLIENTS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      // 1. Fetch base client rows from Supabase
      const { data: supaClients, error: supaErr } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (supaErr || !supaClients) return null;

      // 2. Fetch dynamic client metadata from Supabase custom_roles (_sys_client_metadata)
      let remoteMetaMap: Record<string, any> = {};
      try {
        const { data: roleData } = await supabase
          .from('custom_roles')
          .select('*')
          .eq('key', '_sys_client_metadata')
          .maybeSingle();

        if (roleData?.permissions?.metadata && typeof roleData.permissions.metadata === 'object') {
          remoteMetaMap = roleData.permissions.metadata;
        }
      } catch (e) {
        console.warn('Error fetching client metadata from Supabase:', e);
      }

      // 3. Read local cached clients to ensure immediate session edits are preserved
      const localClients = getLocalItem<ClientModel[]>(STORAGE_KEYS.CLIENTS, initialClients) || [];

      // 4. Merge Supabase client rows with persistent metadata, local edits, and seed data
      const mergedList: ClientModel[] = supaClients.map((c) => {
        const cleanEmail = (c.email || '').trim().toLowerCase();
        const localMatch = localClients.find(
          (l) => (l.id && l.id === c.id) || (l.email && l.email.trim().toLowerCase() === cleanEmail)
        );
        const seedMatch = initialClients.find(
          (s) => (s.id && s.id === c.id) || (s.email && s.email.trim().toLowerCase() === cleanEmail)
        );
        const remoteMeta = remoteMetaMap[cleanEmail] || remoteMetaMap[c.id] || {};

        const chosenPlan =
          remoteMeta.selected_plan ||
          localMatch?.selected_plan ||
          seedMatch?.selected_plan ||
          'Growth Engine Retainer (₹39,999/mo)';

        // Priority for services: Remote Supabase Metadata -> Local edit -> Seed data -> Plan default
        const chosenServices =
          (Array.isArray(remoteMeta.services) ? remoteMeta.services : null) ??
          (Array.isArray(localMatch?.services) ? localMatch?.services : null) ??
          (Array.isArray(seedMatch?.services) ? seedMatch?.services : null) ??
          getServicesForPlan(chosenPlan);

        return {
          id: c.id,
          name: c.name || localMatch?.name || seedMatch?.name || 'Client',
          email: cleanEmail,
          phone: c.phone || localMatch?.phone || seedMatch?.phone || '',
          company_name: c.company_name || localMatch?.company_name || seedMatch?.company_name || `${c.name}'s Business`,
          avatar_url: c.avatar_url || localMatch?.avatar_url || seedMatch?.avatar_url,
          address: c.address || localMatch?.address || seedMatch?.address || '',
          status: c.status || localMatch?.status || seedMatch?.status || 'active',
          selected_plan: chosenPlan,
          services: chosenServices,
          billing_cycle: remoteMeta.billing_cycle || localMatch?.billing_cycle || seedMatch?.billing_cycle || 'monthly',
          subscription_tier: remoteMeta.subscription_tier || localMatch?.subscription_tier || seedMatch?.subscription_tier || 'Growth',
          retainer_amount: remoteMeta.retainer_amount ?? localMatch?.retainer_amount ?? seedMatch?.retainer_amount ?? 39999,
          notes: remoteMeta.notes || localMatch?.notes || seedMatch?.notes || '',
          created_at: c.created_at || localMatch?.created_at || seedMatch?.created_at || new Date().toISOString(),
        };
      });

      // Also include any local-created clients not yet in Supabase
      for (const local of localClients) {
        const clean = (local.email || '').trim().toLowerCase();
        if (!mergedList.some((m) => (m.id && m.id === local.id) || m.email.trim().toLowerCase() === clean)) {
          mergedList.push(local);
        }
      }

      return mergedList;
    },
    initialClients
  );

  return (result || []).map((c) => ({
    ...c,
    services: Array.isArray(c.services) && c.services.length > 0 ? c.services : getServicesForPlan(c.selected_plan),
  }));
}

export interface EmailCheckResult {
  exists: boolean;
  type?: 'client' | 'team';
  name?: string;
  role?: string;
  user?: ClientModel | TeamMemberModel;
}

export async function checkUserEmailExists(
  email: string,
  excludeId?: string,
  excludeEmail?: string
): Promise<EmailCheckResult> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return { exists: false };

  const cleanExcludeEmail = (excludeEmail || '').trim().toLowerCase();
  // If the email being checked is identical to the user's current original email, it is their own account
  if (cleanExcludeEmail && clean === cleanExcludeEmail) {
    return { exists: false };
  }

  const [clients, team] = await Promise.all([getClients(), getTeamMembers()]);

  // Check in clients list
  const existingClient = clients.find((c) => {
    const cEmail = (c.email || '').trim().toLowerCase();
    const isExcluded = (excludeId && c.id === excludeId) || (cleanExcludeEmail && cEmail === cleanExcludeEmail);
    return cEmail === clean && !isExcluded;
  });
  if (existingClient) {
    return {
      exists: true,
      type: 'client',
      name: existingClient.name,
      role: 'Client (Portal User)',
      user: existingClient,
    };
  }

  // Check in team list
  const existingTeam = team.find((t) => {
    const tEmail = (t.email || '').trim().toLowerCase();
    const isExcluded = (excludeId && t.id === excludeId) || (cleanExcludeEmail && tEmail === cleanExcludeEmail);
    return tEmail === clean && !isExcluded;
  });
  if (existingTeam) {
    return {
      exists: true,
      type: 'team',
      name: existingTeam.name,
      role: existingTeam.role || 'Staff / Admin',
      user: existingTeam,
    };
  }

  // Check in remote credentials store (covers Incognito / other browser sessions)
  try {
    const remoteCred = await fetchUserCredential(clean);
    if (remoteCred && remoteCred.email) {
      const isExcluded =
        (cleanExcludeEmail && clean === cleanExcludeEmail) ||
        (excludeId && ((remoteCred as any).id === excludeId || remoteCred.email?.toLowerCase() === cleanExcludeEmail));
      if (!isExcluded) {
        const isClient = remoteCred.role === 'client' || !remoteCred.role;
        return {
          exists: true,
          type: isClient ? 'client' : 'team',
          name: remoteCred.name || clean.split('@')[0],
          role: remoteCred.role || (isClient ? 'Client (Portal User)' : 'Staff Member'),
        };
      }
    }
  } catch (e) {
    // Ignore fetch error
  }

  return { exists: false };
}

export async function saveClient(client: Partial<ClientModel> & { name: string; email: string }): Promise<ClientModel> {
  const cleanEmail = client.email.trim().toLowerCase();
  const current = await getClients();

  // Check if another client (with a different id) is already using this email
  const conflicting = current.find(
    (c) => c.email.trim().toLowerCase() === cleanEmail && (client.id ? c.id !== client.id : false)
  );
  if (conflicting) {
    throw new Error(`Another client account with email "${client.email}" already exists (${conflicting.name}).`);
  }

  const existingIdx = current.findIndex(
    (c) => (client.id && c.id === client.id) || c.email.trim().toLowerCase() === cleanEmail
  );
  let savedClient: ClientModel;

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    savedClient = {
      ...existing,
      ...client,
      id: existing.id,
      email: cleanEmail,
      services:
        client.services !== undefined
          ? client.services
          : (existing.services && existing.services.length > 0
              ? existing.services
              : getServicesForPlan(client.selected_plan || existing.selected_plan)),
      billing_cycle: client.billing_cycle || existing.billing_cycle || 'monthly',
      subscription_tier: client.subscription_tier || existing.subscription_tier || 'Growth',
      retainer_amount:
        client.retainer_amount !== undefined
          ? client.retainer_amount
          : existing.retainer_amount,
    };
    current[existingIdx] = savedClient;
  } else {
    savedClient = {
      id: client.id || `cli-${Date.now()}`,
      name: client.name,
      email: cleanEmail,
      phone: client.phone || '',
      company_name: client.company_name || client.name,
      avatar_url: client.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}`,
      address: client.address || '',
      status: client.status || 'active',
      selected_plan: client.selected_plan || 'Growth Engine Retainer (₹39,999/mo)',
      services:
        client.services && client.services.length > 0
          ? client.services
          : getServicesForPlan(client.selected_plan),
      billing_cycle: client.billing_cycle || 'monthly',
      subscription_tier: client.subscription_tier || 'Growth',
      retainer_amount: client.retainer_amount || 39999,
      notes: client.notes,
      created_at: new Date().toISOString(),
    };
    current.unshift(savedClient);
  }

  // Update local storage & memory cache immediately
  setLocalItem(STORAGE_KEYS.CLIENTS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    // 1. Sync basic client columns to Supabase clients table
    try {
      await supabase.from('clients').upsert({
        id: savedClient.id.includes('-') && savedClient.id.length > 30 ? savedClient.id : undefined,
        name: savedClient.name,
        email: savedClient.email,
        phone: savedClient.phone,
        company_name: savedClient.company_name,
        avatar_url: savedClient.avatar_url,
        address: savedClient.address,
        status: savedClient.status,
      });
    } catch (e) {
      console.warn('Error syncing client to Supabase:', e);
    }

    // 2. Persist full dynamic client metadata (services, plan, billing, tier, retainer, notes) to Supabase custom_roles
    try {
      const { data: existingRole } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('key', '_sys_client_metadata')
        .maybeSingle();

      const metaStore = existingRole?.permissions?.metadata || {};
      metaStore[cleanEmail] = {
        services: savedClient.services,
        selected_plan: savedClient.selected_plan,
        billing_cycle: savedClient.billing_cycle,
        subscription_tier: savedClient.subscription_tier,
        retainer_amount: savedClient.retainer_amount,
        notes: savedClient.notes,
        updated_at: new Date().toISOString(),
      };
      if (savedClient.id) {
        metaStore[savedClient.id] = metaStore[cleanEmail];
      }

      await supabase.from('custom_roles').upsert({
        id: 'role-sys-client-metadata',
        name: 'System Client Metadata Store',
        key: '_sys_client_metadata',
        description: 'Dynamic persistence store for client services, plans, and retainer metadata',
        is_system: true,
        permissions: { metadata: metaStore } as any,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error syncing client metadata to Supabase custom_roles:', e);
    }
  }

  // 3. Sync to credentials API in background for disk persistence
  if (typeof window !== 'undefined') {
    fetch('/api/auth/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: savedClient.name,
        role: 'client',
        phone: savedClient.phone,
        company_name: savedClient.company_name,
        address: savedClient.address,
        status: savedClient.status,
        selected_plan: savedClient.selected_plan,
        services: savedClient.services,
        billing_cycle: savedClient.billing_cycle,
        subscription_tier: savedClient.subscription_tier,
        retainer_amount: savedClient.retainer_amount,
        notes: savedClient.notes,
      }),
    }).catch(() => {});
  }

  return savedClient;
}

export async function deleteClient(id: string): Promise<boolean> {
  // 1. Unlink any projects assigned to this client first so projects are NEVER deleted
  const currentProjects = await getProjects();
  const updatedProjects = currentProjects.map((p) =>
    p.client_id === id ? { ...p, client_id: '', client: undefined, updated_at: new Date().toISOString() } : p
  );
  setLocalItem(STORAGE_KEYS.PROJECTS, updatedProjects);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('projects').update({ client_id: null }).eq('client_id', id);
    } catch (e) {
      console.warn('Error unlinking projects in Supabase before client delete:', e);
    }
  }

  // 2. Remove client record
  const current = await getClients();
  const filtered = current.filter(c => c.id !== id);
  setLocalItem(STORAGE_KEYS.CLIENTS, filtered);

  if (supabase) {
    try {
      await supabase.from('clients').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting client from Supabase:', e);
    }
  }
  return true;
}

export async function approveClient(id: string, initialProjectName?: string): Promise<ClientModel | null> {
  const current = await getClients();
  const client = current.find(c => c.id === id);
  if (!client) return null;

  client.status = 'active';
  setLocalItem(STORAGE_KEYS.CLIENTS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('clients').update({ status: 'active' }).eq('id', id);
  }

  // Check if client already has a project, if not create an initial active project
  const projects = await getProjects();
  const existingProject = projects.find(p => p.client_id === id);
  if (!existingProject) {
    const newProj: ProjectModel = {
      id: `proj-${Date.now()}`,
      client_id: client.id,
      project_name: initialProjectName || `${client.company_name || client.name} — Digital Growth Platform`,
      service_name: client.selected_plan ? client.selected_plan.split('(')[0].trim() : 'Custom Website & Growth Engine',
      start_date: new Date().toISOString().split('T')[0],
      project_value: 39999,
      status: 'requirement',
      progress_percentage: 15,
      assigned_employee_ids: [],
      description: `Active verified project workspace for ${client.company_name || client.name}.`,
      milestones: [
        {
          id: `ms-${Date.now()}-1`,
          project_id: `proj-${Date.now()}`,
          title: 'Project Kickoff & Requirements Analysis',
          description: 'Initial discovery, tech architecture, and brand assets collection.',
          status: 'completed',
          order_index: 1,
        },
        {
          id: `ms-${Date.now()}-2`,
          project_id: `proj-${Date.now()}`,
          title: 'UI/UX Wireframes & Visual Designs',
          description: 'High-converting interactive Figma mockups and responsive design review.',
          status: 'in_progress',
          order_index: 2,
        },
        {
          id: `ms-${Date.now()}-3`,
          project_id: `proj-${Date.now()}`,
          title: 'Core Development & Integrations',
          description: 'Next.js frontend, CMS integration, and WhatsApp AI automation setup.',
          status: 'pending',
          order_index: 3,
        },
        {
          id: `ms-${Date.now()}-4`,
          project_id: `proj-${Date.now()}`,
          title: 'QA Testing & Live Deployment',
          description: 'Performance benchmarking, security testing, and custom domain deployment.',
          status: 'pending',
          order_index: 4,
        }
      ],
      tasks: [],
      updates: [
        {
          id: `upd-${Date.now()}`,
          project_id: `proj-${Date.now()}`,
          author_name: 'Prashant Bajak',
          author_role: 'Super Admin & Project Lead',
          title: 'Client Account Approved & Workspace Activated',
          message: `Welcome to XGRO! Your account for ${client.company_name || client.name} has been verified and active development setup is underway.`,
          progress_percent: 15,
          is_visible_to_client: true,
          created_at: new Date().toISOString()
        }
      ],
      invoices: [],
      created_at: new Date().toISOString()
    };
    await saveProject(newProj);
  }

  return client;
}

export async function getTeamMembers(): Promise<TeamMemberModel[]> {
  return fetchWithSWR<TeamMemberModel[]>(
    STORAGE_KEYS.TEAM,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as TeamMemberModel[];
      }
      return null;
    },
    initialTeamMembers
  );
}

export async function saveTeamMember(member: Partial<TeamMemberModel> & { name: string; email: string }): Promise<TeamMemberModel> {
  const cleanEmail = member.email.trim().toLowerCase();
  const current = await getTeamMembers();

  // Check if another team member (with a different id) is already using this email
  const conflicting = current.find(
    (t) => t.email.trim().toLowerCase() === cleanEmail && (member.id ? t.id !== member.id : false)
  );
  if (conflicting) {
    throw new Error(`Another team member with email "${member.email}" already exists (${conflicting.name}).`);
  }

  const existingIdx = current.findIndex(
    (t) => (member.id && t.id === member.id) || t.email.trim().toLowerCase() === cleanEmail
  );
  let saved: TeamMemberModel;

  if (existingIdx >= 0) {
    saved = {
      ...current[existingIdx],
      ...member,
      id: current[existingIdx].id,
      email: cleanEmail,
    };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: member.id || `team-${Date.now()}`,
      name: member.name,
      email: cleanEmail,
      phone: member.phone || '',
      role: member.role || 'developer',
      department: member.department || 'Engineering',
      avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`,
      status: member.status || 'active',
      created_at: new Date().toISOString(),
    };
    current.push(saved);
  }

  setLocalItem(STORAGE_KEYS.TEAM, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('team_members').upsert({
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        role: saved.role,
        department: saved.department,
        avatar_url: saved.avatar_url,
        status: saved.status,
      }, { onConflict: 'email' });
    } catch (e) {
      console.warn('Error syncing team member to Supabase:', e);
    }
  }

  return saved;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const current = await getTeamMembers();
  const member = current.find(t => t.id === id);
  if (member?.email?.toLowerCase() === 'bajakprashant1998@gmail.com') {
    return false; // Cannot delete primary super admin account
  }
  const filtered = current.filter(t => t.id !== id);
  setLocalItem(STORAGE_KEYS.TEAM, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('team_members').delete().eq('id', id);
  }
  return true;
}

// ==============================================================================
// PROJECTS, MILESTONES, TASKS & UPDATES
// ==============================================================================
export async function getProjects(): Promise<ProjectModel[]> {
  const projects = await fetchWithSWR<ProjectModel[]>(
    STORAGE_KEYS.PROJECTS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(*), milestones(*), tasks(*), updates:project_updates(*), invoices:invoices_documents(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as unknown as ProjectModel[];
      }
      return null;
    },
    initialProjects
  );

  // Attach client and team info dynamically if not already populated
  const [clients, team] = await Promise.all([getClients(), getTeamMembers()]);

  return (projects || []).map((p) => {
    // If proj-rock lost its client_id in a previous session, restore it to cli-rock
    const effectiveClientId = (!p.client_id && p.id === 'proj-rock') ? 'cli-rock' : p.client_id;
    
    // Check if client_id matches an existing client by ID or Email
    let matchedClient = effectiveClientId
      ? clients.find(
          (c) => c.id === effectiveClientId || c.email.toLowerCase() === effectiveClientId.toLowerCase()
        )
      : undefined;

    // If not matched directly, check if client object or team member matches
    if (!matchedClient && p.client?.email) {
      matchedClient = clients.find((c) => c.email.toLowerCase() === p.client!.email!.toLowerCase());
    }

    if (!matchedClient && effectiveClientId) {
      const matchedTeam = team.find(
        (t) => t.id === effectiveClientId || t.email.toLowerCase() === effectiveClientId.toLowerCase()
      );
      if (matchedTeam) {
        matchedClient = clients.find((c) => c.email.toLowerCase() === matchedTeam.email.toLowerCase()) || {
          id: matchedTeam.id,
          name: matchedTeam.name,
          email: matchedTeam.email,
          phone: matchedTeam.phone || '',
          company_name: matchedTeam.name,
          status: 'active',
          created_at: matchedTeam.created_at || new Date().toISOString(),
        };
      }
    }

    if (matchedClient) {
      return { ...p, client_id: matchedClient.id, client: matchedClient };
    }
    return p;
  });
}

export async function getProjectById(id: string): Promise<ProjectModel | null> {
  const allProjects = await getProjects();
  const matched = allProjects.find(p => p.id === id);
  if (matched) return matched;
  return null;
}

export async function saveProject(project: Partial<ProjectModel> & { project_name: string; client_id: string }): Promise<ProjectModel> {
  const current = await getProjects();
  const existingIdx = current.findIndex(p => p.id === project.id);
  let savedProject: ProjectModel;

  if (existingIdx >= 0) {
    savedProject = {
      ...current[existingIdx],
      ...project,
      updated_at: new Date().toISOString(),
    };
    current[existingIdx] = savedProject;
  } else {
    savedProject = {
      id: project.id || `proj-${Date.now()}`,
      project_name: project.project_name,
      client_id: project.client_id,
      service_id: project.service_id,
      service_name: project.service_name || 'Custom Agency Project',
      start_date: project.start_date || new Date().toISOString().split('T')[0],
      expected_completion_date: project.expected_completion_date,
      project_value: project.project_value || 0,
      assigned_manager_id: project.assigned_manager_id || 'team-admin-1',
      assigned_employee_ids: project.assigned_employee_ids || [],
      status: project.status || 'requirement',
      progress_percentage: project.progress_percentage ?? 0,
      description: project.description || '',
      milestones: project.milestones || [
        { id: `ms-init-1`, project_id: '', title: 'Requirement & Scope Defined', status: 'completed', order_index: 1 },
        { id: `ms-init-2`, project_id: '', title: 'UI/UX Design & Architecture', status: 'in_progress', order_index: 2 },
        { id: `ms-init-3`, project_id: '', title: 'Development & Integrations', status: 'pending', order_index: 3 },
        { id: `ms-init-4`, project_id: '', title: 'Testing & Client Review', status: 'pending', order_index: 4 },
        { id: `ms-init-5`, project_id: '', title: 'Final Deployment & Handover', status: 'pending', order_index: 5 },
      ],
      tasks: project.tasks || [],
      updates: project.updates || [
        {
          id: `upd-${Date.now()}`,
          project_id: '',
          author_name: 'Prashant Bajak',
          author_role: 'Super Admin',
          title: 'Project Initiated',
          message: 'Project workspace initialized. Assigned team is reviewing requirements.',
          progress_percent: project.progress_percentage ?? 0,
          is_visible_to_client: true,
          created_at: new Date().toISOString(),
        }
      ],
      invoices: project.invoices || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.unshift(savedProject);
  }

  setLocalItem(STORAGE_KEYS.PROJECTS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = savedProject.id.includes('-') && savedProject.id.length > 30;
      const isManagerUUID = savedProject.assigned_manager_id && savedProject.assigned_manager_id.includes('-') && savedProject.assigned_manager_id.length > 30;
      await supabase.from('projects').upsert({
        id: isUUID ? savedProject.id : undefined,
        project_name: savedProject.project_name,
        client_id: savedProject.client_id,
        service_name: savedProject.service_name,
        start_date: savedProject.start_date,
        expected_completion_date: savedProject.expected_completion_date,
        project_value: savedProject.project_value,
        assigned_manager_id: isManagerUUID ? savedProject.assigned_manager_id : undefined,
        assigned_employee_ids: savedProject.assigned_employee_ids || [],
        status: savedProject.status,
        progress_percentage: savedProject.progress_percentage,
        description: savedProject.description,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error syncing project to Supabase:', e);
    }
  }

  return savedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const current = await getProjects();
  const filtered = current.filter(p => p.id !== id);
  setLocalItem(STORAGE_KEYS.PROJECTS, filtered);

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting project in Supabase:', e);
    }
  }
  return true;
}

export async function assignProjectsToClient(
  clientId: string,
  projectIds: string[],
  userEmail?: string
): Promise<ProjectModel[]> {
  const [clients, team] = await Promise.all([getClients(), getTeamMembers()]);
  const cleanEmail = (userEmail || (clientId.includes('@') ? clientId : '')).trim().toLowerCase();

  // Find matching client by ID or Email
  let matchedClient = clients.find(
    (c) =>
      c.id === clientId ||
      (cleanEmail && c.email.toLowerCase() === cleanEmail) ||
      c.email.toLowerCase() === clientId.toLowerCase()
  );

  // If not found in clients, check team members to see if they exist there
  if (!matchedClient) {
    const matchedTeam = team.find(
      (t) =>
        t.id === clientId ||
        (cleanEmail && t.email.toLowerCase() === cleanEmail) ||
        t.email.toLowerCase() === clientId.toLowerCase()
    );
    if (matchedTeam) {
      // Create/Ensure a background client record with a stable ID so relational projects stay intact
      matchedClient = await saveClient({
        name: matchedTeam.name,
        email: matchedTeam.email,
        phone: matchedTeam.phone || '',
        company_name: `${matchedTeam.name}'s Business`,
        status: 'active',
      });
    }
  }

  const effectiveClientId = matchedClient?.id || clientId;
  const currentProjects = await getProjects();
  const updated = currentProjects.map((p) => {
    // If selected for this client
    if (projectIds.includes(p.id)) {
      return {
        ...p,
        client_id: effectiveClientId,
        client: matchedClient || p.client,
        updated_at: new Date().toISOString(),
      };
    }
    // If previously assigned to this client/user but now unselected, unassign it (never delete it!)
    const wasAssignedToThisUser =
      p.client_id === effectiveClientId ||
      p.client_id === clientId ||
      (cleanEmail && (p.client?.email?.toLowerCase() === cleanEmail || p.client_id?.toLowerCase() === cleanEmail)) ||
      (matchedClient && (p.client_id === matchedClient.id || p.client_id === matchedClient.email));

    if (wasAssignedToThisUser && !projectIds.includes(p.id)) {
      return { ...p, client_id: '', client: undefined, updated_at: new Date().toISOString() };
    }
    return p;
  });

  setLocalItem(STORAGE_KEYS.PROJECTS, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    // Update all affected projects in Supabase
    for (const p of updated) {
      if (
        projectIds.includes(p.id) ||
        (currentProjects.find((cp) => cp.id === p.id)?.client_id === effectiveClientId &&
          !projectIds.includes(p.id))
      ) {
        try {
          if (p.id.length > 30) {
            await supabase
              .from('projects')
              .update({ client_id: p.client_id || null })
              .eq('id', p.id);
          }
        } catch (e) {
          console.warn('Error syncing project assignment to Supabase:', e);
        }
      }
    }
  }

  return updated;
}

export async function createUserWithRole(data: {
  name: string;
  email: string;
  phone?: string;
  role: string;
  password?: string;
  company_name?: string;
  department?: string;
  address?: string;
  selected_plan?: string;
  notes?: string;
  assignedProjectIds?: string[];
}): Promise<{ user: ClientModel | TeamMemberModel; type: 'client' | 'team'; password?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const duplicate = await checkUserEmailExists(cleanEmail);
  if (duplicate.exists) {
    throw new Error(`An account with email "${data.email}" already exists (${duplicate.name} as ${duplicate.role}). Duplicate emails are not allowed.`);
  }

  const generatedPassword = data.password?.trim() || generateSecurePassword(12);

  // Sync to Supabase Auth if connected
  const supabase = getSupabaseClient();
  if (supabase && generatedPassword) {
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password: generatedPassword,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
            company_name: data.company_name,
          },
        },
      });
    } catch (e) {
      console.warn('Supabase auth signup attempt note:', e);
    }
  }

  if (data.role === 'client') {
    const newClient = await saveClient({
      name: data.name,
      email: cleanEmail,
      phone: data.phone || '',
      company_name: data.company_name || `${data.name}'s Business`,
      address: data.address || '',
      selected_plan: data.selected_plan || 'Growth Plan (₹39,999)',
      notes: data.notes || '',
      status: 'active',
    });

    if (data.assignedProjectIds && data.assignedProjectIds.length > 0) {
      await assignProjectsToClient(newClient.id, data.assignedProjectIds);
    }

    await saveUserCredential(cleanEmail, generatedPassword, true, {
      name: data.name,
      role: 'client',
      phone: data.phone,
      company_name: data.company_name || `${data.name}'s Business`,
      address: data.address,
      selected_plan: data.selected_plan,
      status: 'active',
    });

    return { user: newClient, type: 'client', password: generatedPassword };
  } else {
    const newMember = await saveTeamMember({
      name: data.name,
      email: cleanEmail,
      phone: data.phone || '',
      role: data.role,
      department: data.department || 'Engineering',
      status: 'active',
    });

    await saveUserCredential(cleanEmail, generatedPassword, true, {
      name: data.name,
      role: data.role,
      phone: data.phone,
      department: data.department || 'Engineering',
      status: 'active',
    });

    return { user: newMember, type: 'team', password: generatedPassword };
  }
}

export async function updateProjectProgress(
  projectId: string,
  progress: number,
  status?: ProjectStatus,
  updateMessage?: string,
  authorName: string = 'Admin Team'
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const projectIdx = projects.findIndex(p => p.id === projectId);
  if (projectIdx === -1) return null;

  const project = { ...projects[projectIdx] };
  project.progress_percentage = Math.max(0, Math.min(100, Math.round(progress)));
  if (status) project.status = status;
  project.updated_at = new Date().toISOString();

  // If an update message was provided, append to project updates feed
  if (updateMessage) {
    const newUpdate: ProjectUpdateModel = {
      id: `upd-${Date.now()}`,
      project_id: projectId,
      author_name: authorName,
      author_role: 'Project Lead',
      title: `Project Progress: ${project.progress_percentage}%`,
      message: updateMessage,
      progress_percent: project.progress_percentage,
      is_visible_to_client: true,
      created_at: new Date().toISOString(),
    };
    project.updates = [newUpdate, ...(project.updates || [])];

    // Create client notification
    await addNotification({
      client_id: project.client_id,
      project_id: projectId,
      title: `Project Progress Updated: ${project.progress_percentage}%`,
      message: `${project.project_name}: "${updateMessage}"`,
      link: `/client`,
      is_read: false,
    });

    const supabase = getSupabaseClient();
    if (supabase && projectId.length > 30) {
      try {
        await supabase.from('project_updates').insert({
          project_id: projectId,
          author_name: authorName,
          author_role: 'Project Lead',
          title: `Project Progress: ${project.progress_percentage}%`,
          message: updateMessage,
          progress_percent: project.progress_percentage,
          is_visible_to_client: true,
        });
      } catch (e) {
        console.warn('Error inserting project update in Supabase:', e);
      }
    }
  }

  projects[projectIdx] = project;
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && projectId.length > 30) {
    try {
      await supabase.from('projects').update({
        progress_percentage: project.progress_percentage,
        status: project.status,
        updated_at: project.updated_at,
      }).eq('id', projectId);
    } catch (e) {
      console.warn('Error updating project in Supabase:', e);
    }
  }

  return project;
}

export async function toggleMilestoneStatus(
  projectId: string,
  milestoneId: string,
  newStatus: 'pending' | 'in_progress' | 'completed'
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  project.milestones = (project.milestones || []).map(m => {
    if (m.id === milestoneId) {
      return {
        ...m,
        status: newStatus,
        completed_at: newStatus === 'completed' ? now : undefined,
        updated_at: now,
      };
    }
    return m;
  });

  // Calculate automated progress based on completed milestones
  const total = project.milestones.length;
  const completed = project.milestones.filter(m => m.status === 'completed').length;
  if (total > 0) {
    project.progress_percentage = Math.round((completed / total) * 100);
  }
  project.updated_at = now;

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && milestoneId.length > 30) {
    try {
      await supabase.from('milestones').update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? now : null,
      }).eq('id', milestoneId);

      if (projectId.length > 30) {
        await supabase.from('projects').update({
          progress_percentage: project.progress_percentage,
          updated_at: now,
        }).eq('id', projectId);
      }
    } catch (e) {
      console.warn('Error updating milestone in Supabase:', e);
    }
  }

  return project;
}

export async function editMilestone(
  projectId: string,
  milestoneId: string,
  updates: { title?: string; description?: string; status?: 'pending' | 'in_progress' | 'completed' }
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  project.milestones = (project.milestones || []).map(m => {
    if (m.id === milestoneId) {
      return {
        ...m,
        ...updates,
        completed_at: updates.status === 'completed' ? now : updates.status ? undefined : m.completed_at,
        updated_at: now,
      };
    }
    return m;
  });

  const total = project.milestones.length;
  const completed = project.milestones.filter(m => m.status === 'completed').length;
  if (total > 0) {
    project.progress_percentage = Math.round((completed / total) * 100);
  }
  project.updated_at = now;

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && milestoneId.length > 30) {
    try {
      await supabase.from('milestones').update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.status !== undefined ? {
          status: updates.status,
          completed_at: updates.status === 'completed' ? now : null
        } : {}),
      }).eq('id', milestoneId);

      if (projectId.length > 30) {
        await supabase.from('projects').update({
          progress_percentage: project.progress_percentage,
          updated_at: now,
        }).eq('id', projectId);
      }
    } catch (e) {
      console.warn('Error updating milestone in Supabase:', e);
    }
  }

  return project;
}

export async function deleteMilestone(
  projectId: string,
  milestoneId: string
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  project.milestones = (project.milestones || []).filter(m => m.id !== milestoneId);

  const total = project.milestones.length;
  const completed = project.milestones.filter(m => m.status === 'completed').length;
  project.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  project.updated_at = new Date().toISOString();

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && milestoneId.length > 30) {
    try {
      await supabase.from('milestones').delete().eq('id', milestoneId);
      if (projectId.length > 30) {
        await supabase.from('projects').update({
          progress_percentage: project.progress_percentage,
          updated_at: project.updated_at,
        }).eq('id', projectId);
      }
    } catch (e) {
      console.warn('Error deleting milestone in Supabase:', e);
    }
  }

  return project;
}

export async function addMilestone(projectId: string, title: string, description?: string): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const newMilestone: MilestoneModel = {
    id: `ms-${Date.now()}`,
    project_id: projectId,
    title,
    description,
    status: 'pending',
    order_index: (project.milestones?.length || 0) + 1,
    created_at: now,
    updated_at: now,
  };

  project.milestones = [...(project.milestones || []), newMilestone];
  project.updated_at = now;
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && projectId.length > 30) {
    try {
      await supabase.from('milestones').insert({
        project_id: projectId,
        title,
        description,
        status: 'pending',
        order_index: newMilestone.order_index,
      });
    } catch (e) {
      console.warn('Error inserting milestone in Supabase:', e);
    }
  }

  return project;
}

export async function addTask(
  projectId: string,
  title: string,
  assignedTo?: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  description?: string
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const newTask: TaskModel = {
    id: `tsk-${Date.now()}`,
    project_id: projectId,
    title,
    description,
    assigned_to: assignedTo,
    status: 'todo',
    priority,
    created_at: new Date().toISOString(),
  };

  project.tasks = [...(project.tasks || []), newTask];
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && projectId.length > 30) {
    try {
      await supabase.from('tasks').insert({
        project_id: projectId,
        title,
        description,
        status: 'todo',
        priority,
      });
    } catch (e) {
      console.warn('Error inserting task in Supabase:', e);
    }
  }

  return project;
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: 'todo' | 'in_progress' | 'review' | 'done'
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  project.tasks = (project.tasks || []).map(t => {
    if (t.id === taskId) {
      return { ...t, status, updated_at: new Date().toISOString() };
    }
    return t;
  });

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && taskId.length > 30) {
    try {
      await supabase.from('tasks').update({ status }).eq('id', taskId);
    } catch (e) {
      console.warn('Error updating task in Supabase:', e);
    }
  }

  return project;
}

export async function addProjectUpdate(
  projectId: string,
  title: string,
  message: string,
  authorName: string = 'Team Lead',
  authorRole: string = 'Project Manager',
  progressPercent?: number
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const update: ProjectUpdateModel = {
    id: `upd-${Date.now()}`,
    project_id: projectId,
    author_name: authorName,
    author_role: authorRole,
    title,
    message,
    progress_percent: progressPercent ?? project.progress_percentage,
    is_visible_to_client: true,
    created_at: new Date().toISOString(),
  };

  project.updates = [update, ...(project.updates || [])];
  if (typeof progressPercent === 'number') {
    project.progress_percentage = progressPercent;
  }

  // Also send notification to client
  await addNotification({
    client_id: project.client_id,
    project_id: projectId,
    title: `New Update: ${title}`,
    message: `${project.project_name} - ${message}`,
    link: `/client`,
    is_read: false,
  });

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && projectId.length > 30) {
    try {
      await supabase.from('project_updates').insert({
        project_id: projectId,
        author_name: authorName,
        author_role: authorRole,
        title,
        message,
        progress_percent: progressPercent ?? project.progress_percentage,
        is_visible_to_client: true,
      });
    } catch (e) {
      console.warn('Error inserting project update in Supabase:', e);
    }
  }

  return project;
}

export async function updateProjectUpdate(
  projectId: string,
  updateId: string,
  updates: Partial<ProjectUpdateModel>
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  project.updates = (project.updates || []).map((u) => {
    if (u.id === updateId) {
      return {
        ...u,
        ...updates,
        updated_at: new Date().toISOString(),
      };
    }
    return u;
  });

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && updateId.length > 30) {
    try {
      await supabase
        .from('project_updates')
        .update({
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.message !== undefined ? { message: updates.message } : {}),
          ...(updates.progress_percent !== undefined ? { progress_percent: updates.progress_percent } : {}),
          ...(updates.is_visible_to_client !== undefined ? { is_visible_to_client: updates.is_visible_to_client } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', updateId);
    } catch (e) {
      console.warn('Error updating project update in Supabase:', e);
    }
  }

  return project;
}

export async function deleteProjectUpdate(
  projectId: string,
  updateId: string
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  project.updates = (project.updates || []).filter((u) => u.id !== updateId);

  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && updateId.length > 30) {
    try {
      await supabase.from('project_updates').delete().eq('id', updateId);
    } catch (e) {
      console.warn('Error deleting project update in Supabase:', e);
    }
  }

  return project;
}

export async function getAllInvoices(): Promise<InvoiceDocumentModel[]> {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);
  const allInvoices: InvoiceDocumentModel[] = [];

  for (const proj of projects) {
    if (proj.invoices && Array.isArray(proj.invoices)) {
      const client = clients.find((c) => c.id === proj.client_id);
      for (const inv of proj.invoices) {
        allInvoices.push({
          ...inv,
          project_id: proj.id,
          project_name: proj.project_name,
          client_id: proj.client_id,
          client_name: client?.name || inv.client_name,
          client_email: client?.email || inv.client_email,
          client_company: client?.company_name || inv.client_company,
        });
      }
    }
  }

  // Sort by created_at or issue_date descending
  return allInvoices.sort((a, b) => {
    const dateA = new Date(a.issue_date || a.created_at || '').getTime();
    const dateB = new Date(b.issue_date || b.created_at || '').getTime();
    return dateB - dateA;
  });
}

export async function addProjectInvoice(
  projectId: string,
  invoice: Omit<InvoiceDocumentModel, 'id' | 'created_at'>
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const newDoc: InvoiceDocumentModel = {
    ...invoice,
    id: `inv-${Date.now()}`,
    project_id: projectId,
    created_at: new Date().toISOString(),
  };

  project.invoices = [...(project.invoices || []), newDoc];
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && projectId.length > 30 && invoice.client_id.length > 30) {
    try {
      await supabase.from('invoices_documents').insert({
        project_id: projectId,
        client_id: invoice.client_id,
        type: invoice.type || 'invoice',
        title: invoice.title,
        reference_number: invoice.reference_number,
        amount: invoice.amount,
        status: invoice.status || 'sent',
        notes: invoice.notes,
      });
    } catch (e) {
      console.warn('Error inserting invoice in Supabase:', e);
    }
  }

  return project;
}

export async function updateProjectInvoice(
  projectId: string,
  invoiceId: string,
  updates: Partial<InvoiceDocumentModel>
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  project.invoices = (project.invoices || []).map((inv) =>
    inv.id === invoiceId
      ? { ...inv, ...updates, updated_at: new Date().toISOString() }
      : inv
  );
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && invoiceId.length > 30) {
    try {
      await supabase.from('invoices_documents').update({
        title: updates.title,
        amount: updates.amount,
        status: updates.status,
        notes: updates.notes,
        due_date: updates.due_date,
      }).eq('id', invoiceId);
    } catch (e) {
      console.warn('Error updating invoice in Supabase:', e);
    }
  }

  return project;
}

export async function deleteProjectInvoice(
  projectId: string,
  invoiceId: string
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  project.invoices = (project.invoices || []).filter((inv) => inv.id !== invoiceId);
  setLocalItem(STORAGE_KEYS.PROJECTS, projects);

  const supabase = getSupabaseClient();
  if (supabase && invoiceId.length > 30) {
    try {
      await supabase.from('invoices_documents').delete().eq('id', invoiceId);
    } catch (e) {
      console.warn('Error deleting invoice from Supabase:', e);
    }
  }

  return project;
}


// ==============================================================================
// NOTIFICATIONS
// ==============================================================================
export async function getNotifications(clientId?: string): Promise<NotificationModel[]> {
  const all = getLocalItem<NotificationModel[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  if (clientId) {
    return all.filter(n => n.client_id === clientId || !n.client_id);
  }
  return all;
}

export async function addNotification(notification: Omit<NotificationModel, 'id' | 'created_at'>): Promise<NotificationModel> {
  const current = getLocalItem<NotificationModel[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const newNotif: NotificationModel = {
    ...notification,
    id: `notif-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  current.unshift(newNotif);
  setLocalItem(STORAGE_KEYS.NOTIFICATIONS, current);
  return newNotif;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const current = getLocalItem<NotificationModel[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const updated = current.map(n => n.id === id ? { ...n, is_read: true } : n);
  setLocalItem(STORAGE_KEYS.NOTIFICATIONS, updated);
}

export async function markAllNotificationsAsRead(clientId?: string): Promise<void> {
  const current = getLocalItem<NotificationModel[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const updated = current.map(n => {
    if (!clientId || n.client_id === clientId) {
      return { ...n, is_read: true };
    }
    return n;
  });
  setLocalItem(STORAGE_KEYS.NOTIFICATIONS, updated);
}

// ==============================================================================
// TESTIMONIALS & FAQS CRUD
// ==============================================================================
export async function getTestimonials(): Promise<TestimonialModel[]> {
  return fetchWithSWR<TestimonialModel[]>(
    STORAGE_KEYS.TESTIMONIALS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase.from('testimonials').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as TestimonialModel[];
      return null;
    },
    initialTestimonials
  );
}

export async function saveTestimonial(test: Partial<TestimonialModel> & { quote: string; name: string; org: string }): Promise<TestimonialModel> {
  const current = await getTestimonials();
  const existingIdx = current.findIndex(t => t.id === test.id);
  let saved: TestimonialModel;

  if (existingIdx >= 0) {
    saved = { ...current[existingIdx], ...test };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: test.id || `test-${Date.now()}`,
      quote: test.quote,
      name: test.name,
      org: test.org,
      rating: test.rating || 5,
      avatar_url: test.avatar_url,
      status: test.status || 'published',
      display_order: test.display_order ?? (current.length + 1),
      created_at: new Date().toISOString(),
    };
    current.push(saved);
  }

  setLocalItem(STORAGE_KEYS.TESTIMONIALS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = saved.id && saved.id.includes('-') && saved.id.length > 30;
      const { data: upserted, error } = await supabase.from('testimonials').upsert({
        id: isUUID ? saved.id : undefined,
        quote: saved.quote,
        name: saved.name,
        org: saved.org,
        rating: saved.rating,
        avatar_url: saved.avatar_url,
        status: saved.status,
        display_order: saved.display_order,
      }).select().single();

      if (!error && upserted) {
        saved.id = upserted.id;
        const updatedList = current.map(t => t.id === saved.id ? (upserted as TestimonialModel) : t);
        setLocalItem(STORAGE_KEYS.TESTIMONIALS, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing testimonial to Supabase:', e);
    }
  }

  return saved;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const current = await getTestimonials();
  setLocalItem(STORAGE_KEYS.TESTIMONIALS, current.filter(t => t.id !== id));

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('testimonials').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting testimonial from Supabase:', e);
    }
  }
}

export async function getFaqs(): Promise<FaqModel[]> {
  return fetchWithSWR<FaqModel[]>(
    STORAGE_KEYS.FAQS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as FaqModel[];
      return null;
    },
    initialFaqs
  );
}

export async function saveFaq(faq: Partial<FaqModel> & { question: string; answer: string }): Promise<FaqModel> {
  const current = await getFaqs();
  const existingIdx = current.findIndex(f => f.id === faq.id);
  let saved: FaqModel;

  if (existingIdx >= 0) {
    saved = { ...current[existingIdx], ...faq };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: faq.id || `faq-${Date.now()}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      status: faq.status || 'published',
      display_order: faq.display_order ?? (current.length + 1),
      created_at: new Date().toISOString(),
    };
    current.push(saved);
  }

  setLocalItem(STORAGE_KEYS.FAQS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = saved.id && saved.id.includes('-') && saved.id.length > 30;
      const { data: upserted, error } = await supabase.from('faqs').upsert({
        id: isUUID ? saved.id : undefined,
        question: saved.question,
        answer: saved.answer,
        category: saved.category,
        status: saved.status,
        display_order: saved.display_order,
      }).select().single();

      if (!error && upserted) {
        saved.id = upserted.id;
        const updatedList = current.map(f => f.id === saved.id ? (upserted as FaqModel) : f);
        setLocalItem(STORAGE_KEYS.FAQS, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing FAQ to Supabase:', e);
    }
  }

  return saved;
}

export async function deleteFaq(id: string): Promise<void> {
  const current = await getFaqs();
  setLocalItem(STORAGE_KEYS.FAQS, current.filter(f => f.id !== id));

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('faqs').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting FAQ from Supabase:', e);
    }
  }
}

// ==============================================================================
// FREE RESOURCES CRUD & SUPABASE PERSISTENCE
// ==============================================================================
export async function getResources(options?: { includeDrafts?: boolean }): Promise<ResourceItem[]> {
  const items = await fetchWithSWR<ResourceItem[]>(
    STORAGE_KEYS.RESOURCES,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            category: item.category,
            type: item.type,
            fileFormat: item.file_format || item.fileFormat || 'PDF Document',
            fileSize: item.file_size || item.fileSize || 'Instant',
            thumbnail_url: item.thumbnail_url || item.thumbnailUrl,
            thumbnailUrl: item.thumbnail_url || item.thumbnailUrl,
            downloadUrl: item.download_url || item.downloadUrl,
            linkUrl: item.link_url || item.linkUrl,
            promptContent: item.prompt_content || item.promptContent,
            dateAdded: item.date_added || item.dateAdded || (item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Aug 12, 2026'),
            downloadCount: item.download_count ?? item.downloadCount ?? 0,
            featured: !!item.featured,
            gradient: item.gradient || 'from-purple-600 via-pink-600 to-rose-600',
            tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
            status: (item.status as 'published' | 'draft') || 'published',
            display_order: item.display_order ?? 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })) as ResourceItem[];
        }
      } catch (e) {
        console.warn('Could not query resources from Supabase:', e);
      }
      return null;
    },
    initialResources
  );

  const safeList = Array.isArray(items) && items.length > 0 ? items : initialResources;
  if (options?.includeDrafts) {
    return safeList;
  }
  return safeList.filter((r) => r && r.status !== 'draft');
}

export async function saveResource(res: Partial<ResourceItem> & { title: string; category: string; type: ResourceType }): Promise<ResourceItem> {
  const current = await getResources({ includeDrafts: true });
  const existingIdx = current.findIndex((r) => r.id === res.id);
  let saved: ResourceItem;

  let thumbnail = res.thumbnail_url || res.thumbnailUrl;
  if (thumbnail && thumbnail.startsWith('data:image/')) {
    thumbnail = await compressDataUrl(thumbnail, 600, 400, 0.85);
  }

  if (existingIdx >= 0) {
    saved = {
      ...current[existingIdx],
      ...res,
      thumbnail_url: thumbnail,
      thumbnailUrl: thumbnail,
      tags: Array.isArray(res.tags) ? res.tags : [],
      updated_at: new Date().toISOString(),
    };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: res.id || `res-${Date.now()}`,
      title: res.title,
      description: res.description || '',
      category: res.category,
      type: res.type,
      fileFormat:
        res.fileFormat ||
        (res.type === 'prompt'
          ? 'AI Prompt Pack'
          : res.type === 'canva'
          ? 'Canva Template'
          : res.type === 'tool'
          ? 'Interactive Tool'
          : res.type === 'checklist'
          ? 'PDF Checklist'
          : 'PDF Document'),
      fileSize: res.fileSize || (res.type === 'prompt' ? 'Instant Copy' : 'Instant'),
      thumbnail_url: thumbnail,
      thumbnailUrl: thumbnail,
      downloadUrl: res.downloadUrl,
      linkUrl: res.linkUrl,
      promptContent: res.promptContent,
      dateAdded: res.dateAdded || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      downloadCount: res.downloadCount ?? 0,
      featured: res.featured ?? false,
      gradient: res.gradient || 'from-purple-600 via-pink-600 to-rose-600',
      tags: Array.isArray(res.tags) ? res.tags : [],
      status: res.status || 'published',
      display_order: res.display_order ?? (current.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.unshift(saved);
  }

  setLocalItem(STORAGE_KEYS.RESOURCES, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = saved.id && saved.id.includes('-') && saved.id.length > 30;
      const { data: upserted, error } = await supabase.from('resources').upsert({
        id: isUUID ? saved.id : undefined,
        title: saved.title,
        description: saved.description,
        category: saved.category,
        type: saved.type,
        file_format: saved.fileFormat,
        file_size: saved.fileSize,
        thumbnail_url: saved.thumbnail_url || saved.thumbnailUrl,
        download_url: saved.downloadUrl,
        link_url: saved.linkUrl,
        prompt_content: saved.promptContent,
        gradient: saved.gradient,
        tags: saved.tags,
        featured: saved.featured,
        status: saved.status || 'published',
        download_count: saved.downloadCount,
        display_order: saved.display_order,
      }).select().single();

      if (!error && upserted) {
        saved.id = upserted.id;
        const updatedList = current.map((r) =>
          r.id === saved.id ? { ...saved, id: upserted.id } : r
        );
        setLocalItem(STORAGE_KEYS.RESOURCES, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing resource to Supabase:', e);
    }
  }

  return saved;
}

export async function deleteResource(id: string): Promise<void> {
  const current = await getResources({ includeDrafts: true });
  setLocalItem(STORAGE_KEYS.RESOURCES, current.filter((r) => r.id !== id));

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('resources').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting resource from Supabase:', e);
    }
  }
}

export async function incrementResourceDownloads(id: string): Promise<void> {
  const current = await getResources({ includeDrafts: true });
  const item = current.find((r) => r.id === id);
  if (!item) return;

  item.downloadCount = (item.downloadCount || 0) + 1;
  setLocalItem(STORAGE_KEYS.RESOURCES, current);

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('resources').update({ download_count: item.downloadCount }).eq('id', id);
    } catch (e) {
      console.warn('Error updating download count in Supabase:', e);
    }
  }
}


// ==============================================================================
// ROLES & PERMISSIONS CRUD
// ==============================================================================
export async function getRoles(): Promise<CustomRoleModel[]> {
  return fetchWithSWR<CustomRoleModel[]>(
    STORAGE_KEYS.ROLES,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase.from('custom_roles').select('*');
      if (!error && data && data.length > 0) return data as CustomRoleModel[];
      return null;
    },
    initialRoles
  );
}

export async function saveRole(role: Partial<CustomRoleModel> & { name: string; permissions: any }): Promise<CustomRoleModel> {
  const current = await getRoles();
  const key = role.key || role.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  const existingIdx = current.findIndex(r => r.id === role.id || r.key === key);
  let savedRole: CustomRoleModel;

  if (existingIdx >= 0) {
    savedRole = {
      ...current[existingIdx],
      ...role,
      key,
      updated_at: new Date().toISOString(),
    } as CustomRoleModel;
    current[existingIdx] = savedRole;
  } else {
    savedRole = {
      id: role.id || `role-${Date.now()}`,
      name: role.name,
      key,
      description: role.description || `Custom role with configured permissions`,
      is_system: false,
      permissions: role.permissions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.push(savedRole);
  }

  setLocalItem(STORAGE_KEYS.ROLES, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('custom_roles').upsert({
        id: savedRole.id,
        name: savedRole.name,
        key: savedRole.key,
        description: savedRole.description,
        is_system: savedRole.is_system,
        permissions: savedRole.permissions,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
    } catch (e) {
      console.warn('Error syncing role to Supabase:', e);
    }
  }

  return savedRole;
}

export async function deleteRole(id: string): Promise<boolean> {
  const current = await getRoles();
  const roleToDelete = current.find(r => r.id === id || r.key === id);
  if (roleToDelete?.is_system) {
    // Cannot delete system roles like Super Admin or Client
    return false;
  }
  const filtered = current.filter(r => r.id !== id && r.key !== id);
  setLocalItem(STORAGE_KEYS.ROLES, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('custom_roles').delete().eq('id', id);
    } catch (e) {
      console.warn('Error deleting role from Supabase:', e);
    }
  }
  return true;
}

// ==========================================
// TRUSTED LOGOS / PARTNERS CMS CRUD
// ==========================================

export async function getTrustedLogos(): Promise<TrustedLogoModel[]> {
  const logos = await fetchWithSWR<TrustedLogoModel[]>(
    STORAGE_KEYS.TRUSTED_LOGOS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('trusted_logos')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const seen = new Set<string>();
        const deduped: TrustedLogoModel[] = [];
        for (const item of data as TrustedLogoModel[]) {
          if (!item || !item.name) continue;
          const k = item.name.trim().toLowerCase();
          if (!seen.has(k)) {
            seen.add(k);
            deduped.push(item);
          }
        }
        return deduped;
      }
      return null;
    },
    initialTrustedLogos
  );

  // Strict deduplication by normalized brand name
  const seen = new Set<string>();
  const deduplicated: TrustedLogoModel[] = [];
  let hadDuplicates = false;

  for (const item of logos || []) {
    if (!item || !item.name) continue;
    const norm = item.name.trim().toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      deduplicated.push(item);
    } else {
      hadDuplicates = true;
    }
  }

  // Stable deterministic sorting:
  // Primary: display_order ascending
  // Secondary tie-breaker: created_at ascending (first created shows first, then second)
  // Tertiary: name alphabetical
  // Ensures ALL items are shown sequentially even if two items share the same display_order number
  deduplicated.sort((a, b) => {
    const orderA = typeof a.display_order === 'number' ? a.display_order : 9999;
    const orderB = typeof b.display_order === 'number' ? b.display_order : 9999;
    if (orderA !== orderB) return orderA - orderB;
    if (a.created_at && b.created_at) return a.created_at.localeCompare(b.created_at);
    return (a.name || '').localeCompare(b.name || '');
  });

  if (hadDuplicates && typeof window !== 'undefined') {
    setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, deduplicated);
  }

  return deduplicated;
}

export async function saveTrustedLogo(
  logo: Partial<TrustedLogoModel> & { name: string }
): Promise<TrustedLogoModel> {
  const current = await getTrustedLogos();
  const trimmedName = logo.name.trim();
  const normalizedName = trimmedName.toLowerCase();

  // Compress data URL if uploaded directly to keep payload tiny (< 30KB)
  let optimizedLogoUrl = logo.logo_url;
  if (optimizedLogoUrl && optimizedLogoUrl.startsWith('data:image/')) {
    try {
      optimizedLogoUrl = await compressDataUrl(optimizedLogoUrl, 400, 200, 0.85);
    } catch (_) {}
  }

  // 1. If creating a new logo (no ID provided), reject if name already exists
  if (!logo.id) {
    const duplicate = current.find(
      (l) => l.name.trim().toLowerCase() === normalizedName
    );
    if (duplicate) {
      console.warn(`saveTrustedLogo: Duplicate brand name rejected: "${trimmedName}"`);
      return duplicate;
    }
  } else {
    // 2. If editing existing logo with ID, reject if renamed to another existing brand
    const duplicateOther = current.find(
      (l) => l.id !== logo.id && l.name.trim().toLowerCase() === normalizedName
    );
    if (duplicateOther) {
      console.warn(`saveTrustedLogo: Cannot rename logo to already existing brand: "${trimmedName}"`);
      return duplicateOther;
    }
  }

  // Find exact item to update ONLY by matching ID
  const existingIdx = logo.id ? current.findIndex((l) => l.id === logo.id) : -1;

  let saved: TrustedLogoModel;

  if (existingIdx >= 0) {
    saved = {
      ...current[existingIdx],
      ...logo,
      name: trimmedName,
      logo_url: optimizedLogoUrl,
      updated_at: new Date().toISOString(),
    };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: logo.id || `brand-${Date.now()}`,
      name: trimmedName,
      note: logo.note || '',
      logo_url: optimizedLogoUrl || '',
      icon: logo.icon || 'Building2',
      website_url: logo.website_url || '',
      status: logo.status || 'published',
      display_order: logo.display_order ?? (current.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.push(saved);
  }

  // Deduplicate array before saving
  const seen = new Set<string>();
  const cleanList: TrustedLogoModel[] = [];
  for (const l of current) {
    const key = l.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cleanList.push(l);
    }
  }

  setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, cleanList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let targetId = saved.id;
      const isUUID = targetId && targetId.includes('-') && targetId.length > 30;

      // If we don't have a UUID id, check if a row with this name already exists in Supabase to reuse its ID
      if (!isUUID) {
        const { data: existingRows } = await supabase
          .from('trusted_logos')
          .select('id')
          .ilike('name', trimmedName)
          .limit(1);
        if (existingRows && existingRows.length > 0) {
          targetId = existingRows[0].id;
          saved.id = targetId;
        }
      }

      const { data: upserted, error } = await supabase
        .from('trusted_logos')
        .upsert({
          id: (targetId && targetId.length > 30) ? targetId : undefined,
          name: saved.name,
          note: saved.note,
          logo_url: saved.logo_url,
          icon: saved.icon,
          website_url: saved.website_url,
          status: saved.status,
          display_order: saved.display_order,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && upserted) {
        saved.id = upserted.id;
        // Purge any other duplicate rows with this name in Supabase
        await supabase
          .from('trusted_logos')
          .delete()
          .ilike('name', trimmedName)
          .neq('id', upserted.id);

        const updatedList = cleanList.map((l) =>
          l.name.trim().toLowerCase() === normalizedName ? (upserted as TrustedLogoModel) : l
        );
        setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, updatedList);
      }
    } catch (e) {
      console.warn('Error syncing trusted logo to Supabase:', e);
    }
  }

  return saved;
}

export async function deleteTrustedLogo(id: string): Promise<void> {
  const current = await getTrustedLogos();
  const target = current.find((l) => l.id === id);
  const targetName = target?.name?.trim().toLowerCase();

  // Filter out by ID AND matching brand name
  const filtered = current.filter((l) => {
    if (l.id === id) return false;
    if (targetName && l.name?.trim().toLowerCase() === targetName) return false;
    return true;
  });

  setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // 1. Delete by ID
      await supabase.from('trusted_logos').delete().eq('id', id);

      // 2. Also delete by name to clear any duplicate ghost rows in Supabase
      if (target?.name) {
        await supabase.from('trusted_logos').delete().ilike('name', target.name.trim());
      }
    } catch (e) {
      console.warn('Error deleting trusted logo from Supabase:', e);
    }
  }
}

export async function getTrustedSectionTitle(): Promise<string> {
  const fallback = 'Trusted by growing businesses across India & USA';
  if (typeof window === 'undefined') return fallback;
  return getLocalItem<string>(STORAGE_KEYS.TRUSTED_SECTION_TITLE, fallback);
}

export async function saveTrustedSectionTitle(title: string): Promise<string> {
  const cleanTitle = title.trim() || 'Trusted by growing businesses across India & USA';
  setLocalItem(STORAGE_KEYS.TRUSTED_SECTION_TITLE, cleanTitle);
  return cleanTitle;
}

// -------------------------------------------------------------
// USER MANAGEMENT, CREDENTIALS & RBAC ACCESS
// -------------------------------------------------------------

export function generateSecurePassword(length: number = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%^&*';

  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  const allChars = upper + lower + numbers + special;
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return password.sort(() => Math.random() - 0.5).join('');
}

export interface UserCredentialInfo {
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

export async function saveUserCredential(
  email: string,
  password?: string,
  createdByAdmin: boolean = true,
  metadata?: Partial<UserCredentialInfo>
): Promise<void> {
  const clean = email.trim().toLowerCase();
  const map = getLocalItem<Record<string, UserCredentialInfo>>(STORAGE_KEYS.USER_CREDENTIALS, {});
  const existing = map[clean] || {};
  const updated: UserCredentialInfo = {
    ...existing,
    email: clean,
    temporaryPassword: password || existing.temporaryPassword,
    name: metadata?.name || existing.name,
    role: metadata?.role || existing.role || 'client',
    phone: metadata?.phone || existing.phone,
    company_name: metadata?.company_name || existing.company_name,
    department: metadata?.department || existing.department,
    address: metadata?.address || existing.address,
    status: metadata?.status || existing.status || 'active',
    selected_plan: metadata?.selected_plan || existing.selected_plan,
    updatedAt: new Date().toISOString(),
    createdByAdmin,
  };
  map[clean] = updated;
  setLocalItem(STORAGE_KEYS.USER_CREDENTIALS, map);

  // 1. Sync to server API (Wait for response so server is instantly up to date)
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          password: updated.temporaryPassword,
        }),
      });
    } catch (err) {
      console.warn('Error syncing credentials to API:', err);
    }
  }

  // 2. Sync to Supabase database
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('custom_roles').upsert({
        id: 'role-sys-credentials',
        name: 'System Auth Credentials Store',
        key: '_sys_auth_credentials',
        description: 'Internal credential synchronization cache',
        is_system: true,
        permissions: { credentials: map } as any,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error syncing credentials to Supabase:', e);
    }
  }
}

export function getUserCredential(email: string): UserCredentialInfo | null {
  const clean = email.trim().toLowerCase();
  const map = getLocalItem<Record<string, UserCredentialInfo>>(STORAGE_KEYS.USER_CREDENTIALS, {});
  return map[clean] || null;
}

let lastCredentialsFetchTime = 0;

export async function fetchUserCredential(email: string): Promise<UserCredentialInfo | null> {
  const clean = email.trim().toLowerCase();
  let map = getLocalItem<Record<string, UserCredentialInfo>>(STORAGE_KEYS.USER_CREDENTIALS, {});

  // 1. Check local cache first (0ms)
  if (map[clean]?.temporaryPassword) {
    return map[clean];
  }

  // 2. Query the server credentials API if not found in local cache (handles Incognito / other browser windows)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/auth/credentials?email=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.credential && (data.credential.temporaryPassword || data.credential.email)) {
          map[clean] = data.credential;
          setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
          return data.credential;
        }
      }
    } catch (e) {
      // ignore network errors and try local/supabase
    }
  }

  // 3. Try fetching directly from Supabase custom_roles
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('key', '_sys_auth_credentials')
        .maybeSingle();

      if (!error && data?.permissions?.credentials) {
        const remoteMap = data.permissions.credentials as Record<string, UserCredentialInfo>;
        map = { ...remoteMap, ...map };
        setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
        if (map[clean]?.temporaryPassword) {
          return map[clean];
        }
      }
    } catch (e) {
      console.warn('Error fetching Supabase credentials:', e);
    }
  }

  // 4. Built-in defaults for seed administrative accounts & clients
  if (clean === 'bajakprashant1998@gmail.com') {
    const defaultCred: UserCredentialInfo = { email: clean, name: 'Prashant Bajak', role: 'admin', temporaryPassword: 'password123', updatedAt: new Date().toISOString(), createdByAdmin: false, status: 'active' };
    map[clean] = defaultCred;
    setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
    return defaultCred;
  }
  if (clean === 'admin@xgro.in' || clean === 'bhautik@xgro.in') {
    const defaultCred: UserCredentialInfo = { email: clean, name: clean.split('@')[0], role: 'admin', temporaryPassword: 'adminpassword', updatedAt: new Date().toISOString(), createdByAdmin: false, status: 'active' };
    map[clean] = defaultCred;
    setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
    return defaultCred;
  }
  if (clean === 'samridhiarora79@gmail.com') {
    const defaultCred: UserCredentialInfo = { email: clean, name: 'Samridhi Arora', role: 'client', company_name: 'Arora Growth Studio', temporaryPassword: 'ieg55k*%K$nY', updatedAt: new Date().toISOString(), createdByAdmin: true, status: 'active' };
    map[clean] = defaultCred;
    setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
    return defaultCred;
  }
  if (clean === 'rockhappy1798@gmail.com') {
    const defaultCred: UserCredentialInfo = { email: clean, name: 'Rock Happy', role: 'client', temporaryPassword: 'password123', updatedAt: new Date().toISOString(), createdByAdmin: false, status: 'active' };
    map[clean] = defaultCred;
    setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, map);
    return defaultCred;
  }

  return null;
}

export async function resetUserPassword(
  email: string,
  customPassword?: string
): Promise<{ success: boolean; password: string; message: string }> {
  const clean = email.trim().toLowerCase();
  const newPass =
    customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : generateSecurePassword(12);

  await saveUserCredential(clean, newPass, true);

  return {
    success: true,
    password: newPass,
    message: `Password successfully updated for ${clean}.`,
  };
}

export interface UnifiedUserModel {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'client' | 'team';
  role: string;
  roleDisplayName: string;
  department?: string;
  company_name?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending_approval';
  selected_plan?: string;
  notes?: string;
  assignedProjectsCount: number;
  created_at?: string;
  createdByAdmin: boolean;
  hasTemporaryPassword: boolean;
  temporaryPassword?: string;
  avatar_url?: string;
}

export async function getAllUsers(): Promise<UnifiedUserModel[]> {
  const [clients, team, projects, roles] = await Promise.all([
    getClients(),
    getTeamMembers(),
    getProjects(),
    getRoles(),
  ]);

  let credsMap = getLocalItem<Record<string, UserCredentialInfo>>(STORAGE_KEYS.USER_CREDENTIALS, {});
  
  // Sync latest credentials from server API with a 30-second TTL to avoid redundant requests
  const now = Date.now();
  if (typeof window !== 'undefined' && now - lastCredentialsFetchTime > 30000) {
    lastCredentialsFetchTime = now;
    try {
      const res = await fetch('/api/auth/credentials');
      if (res.ok) {
        const data = await res.json();
        if (data.credentials) {
          credsMap = { ...credsMap, ...data.credentials };
          setLocalItemSilent(STORAGE_KEYS.USER_CREDENTIALS, credsMap);
        }
      }
    } catch (e) {}
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('key', '_sys_auth_credentials')
        .maybeSingle();
      if (data?.permissions?.credentials) {
        credsMap = { ...data.permissions.credentials, ...credsMap };
        setLocalItem(STORAGE_KEYS.USER_CREDENTIALS, credsMap);
      }
    } catch (e) {}
  }

  // Build client lookup map by email & id
  const clientMapByEmail: Record<string, ClientModel> = {};
  const clientMapById: Record<string, ClientModel> = {};
  clients.forEach((c) => {
    if (c.email) {
      clientMapByEmail[c.email.trim().toLowerCase()] = c;
    }
    if (c.id) {
      clientMapById[c.id] = c;
    }
  });

  const teamEmails = new Set<string>();

  // 1. Process Team Members (Staff / Admins)
  const teamUsers: UnifiedUserModel[] = team.map((t) => {
    const cleanEmail = t.email.trim().toLowerCase();
    teamEmails.add(cleanEmail);
    const userCred = credsMap[cleanEmail];
    const isSuperAdmin = cleanEmail === 'bajakprashant1998@gmail.com';
    const roleObj = roles.find((r) => r.key === t.role || r.id === t.role);
    const roleName = isSuperAdmin
      ? 'Super Admin (Owner)'
      : roleObj?.name || t.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const clientRecord = clientMapByEmail[cleanEmail] || clientMapById[t.id];
    const assignedCount = projects.filter((p) => {
      if (clientRecord && p.client_id === clientRecord.id) return true;
      if (p.client_id === t.id) return true;
      if (p.client?.email?.toLowerCase() === cleanEmail) return true;
      if (p.client_id?.toLowerCase() === cleanEmail) return true;
      return false;
    }).length;

    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone || clientRecord?.phone,
      userType: 'team',
      role: t.role,
      roleDisplayName: roleName,
      department: t.department,
      company_name: clientRecord?.company_name,
      address: clientRecord?.address,
      status: t.status || 'active',
      assignedProjectsCount: assignedCount,
      created_at: t.created_at || clientRecord?.created_at,
      createdByAdmin: userCred?.createdByAdmin ?? true,
      hasTemporaryPassword: !!userCred?.temporaryPassword,
      temporaryPassword: userCred?.temporaryPassword,
      avatar_url: t.avatar_url,
    };
  });

  // 2. Process Client Accounts (who are not currently in teamUsers)
  const clientUsers: UnifiedUserModel[] = clients
    .filter((c) => !teamEmails.has(c.email.trim().toLowerCase()))
    .map((c) => {
      const cleanEmail = c.email.trim().toLowerCase();
      const userCred = credsMap[cleanEmail];
      const assignedCount = projects.filter((p) => {
        if (p.client_id === c.id) return true;
        if (p.client?.email?.toLowerCase() === cleanEmail) return true;
        if (p.client_id?.toLowerCase() === cleanEmail) return true;
        return false;
      }).length;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        userType: 'client',
        role: 'client',
        roleDisplayName: 'Client (Portal User)',
        company_name: c.company_name,
        address: c.address,
        status: c.status || 'active',
        selected_plan: c.selected_plan,
        notes: c.notes,
        assignedProjectsCount: assignedCount,
        created_at: c.created_at,
        createdByAdmin: userCred?.createdByAdmin ?? false,
        hasTemporaryPassword: !!userCred?.temporaryPassword,
        temporaryPassword: userCred?.temporaryPassword,
        avatar_url: c.avatar_url,
      };
    });

  return [...teamUsers, ...clientUsers].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

export async function toggleUserStatus(
  id: string,
  userType: 'client' | 'team',
  newStatus: 'active' | 'inactive'
): Promise<{ success: boolean; user: ClientModel | TeamMemberModel }> {
  if (userType === 'client') {
    const clients = await getClients();
    const client = clients.find((c) => c.id === id);
    if (!client) throw new Error('Client account not found');
    client.status = newStatus;
    setLocalItem(STORAGE_KEYS.CLIENTS, clients);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('clients').update({ status: newStatus }).eq('id', id);
      } catch (e) {
        console.warn('Error syncing client status to Supabase:', e);
      }
    }
    return { success: true, user: client };
  } else {
    const team = await getTeamMembers();
    const member = team.find((t) => t.id === id);
    if (!member) throw new Error('Team member not found');
    if (member.email.toLowerCase() === 'bajakprashant1998@gmail.com') {
      throw new Error('Cannot deactivate the primary Super Admin account.');
    }
    member.status = newStatus;
    setLocalItem(STORAGE_KEYS.TEAM, team);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('team_members').update({ status: newStatus }).eq('id', id);
      } catch (e) {
        console.warn('Error syncing team member status to Supabase:', e);
      }
    }
    return { success: true, user: member };
  }
}

export async function updateUserRoleAndProfile(data: {
  id: string;
  email: string;
  name: string;
  phone?: string;
  newRole: string;
  department?: string;
  company_name?: string;
  status?: 'active' | 'inactive' | 'pending_approval';
}): Promise<{ success: boolean; message: string }> {
  const cleanEmail = data.email.trim().toLowerCase();

  // Primary Super Admin Protection: Owner must always remain Super Admin
  if (cleanEmail === 'bajakprashant1998@gmail.com' && data.newRole !== 'admin' && data.newRole !== 'super_admin') {
    throw new Error('The primary Super Admin account (bajakprashant1998@gmail.com) is permanently protected and must always remain Super Admin to safeguard platform ownership.');
  }

  // Check if demoting an admin would leave zero active admins in the platform
  const team = await getTeamMembers();
  const currentMember = team.find((t) => t.email.toLowerCase() === cleanEmail || t.id === data.id);
  const isCurrentAdmin = currentMember && (currentMember.role === 'admin' || currentMember.role === 'super_admin');
  const willBeAdmin = data.newRole === 'admin' || data.newRole === 'super_admin';

  if (isCurrentAdmin && !willBeAdmin) {
    const otherActiveAdmins = team.filter(
      (t) =>
        (t.role === 'admin' || t.role === 'super_admin') &&
        t.status !== 'inactive' &&
        t.email.toLowerCase() !== cleanEmail &&
        t.id !== data.id
    );
    if (otherActiveAdmins.length === 0) {
      throw new Error('Cannot change role: There must always be at least one active Super Admin to manage the platform.');
    }
  }

  // Retrieve current clients and projects
  const clients = await getClients();
  const existingClient = clients.find((c) => c.email.toLowerCase() === cleanEmail || c.id === data.id);
  const stableClientId = existingClient?.id || (data.id.startsWith('cli-') || (data.id.includes('-') && data.id.length > 30) ? data.id : `cli-${Date.now()}`);

  if (data.newRole === 'client') {
    // 1. Save/Update in clients with permanent stable client ID
    const saved = await saveClient({
      id: stableClientId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone || existingClient?.phone || '',
      company_name: data.company_name || existingClient?.company_name || `${data.name.trim()}'s Business`,
      status: data.status || 'active',
    });

    // 2. Ensure all projects associated with this email or client ID are preserved and linked to saved.id
    const currentProjects = await getProjects();
    let hasProjectUpdates = false;
    const reconnectedProjects = currentProjects.map((p) => {
      const isUserProject =
        p.client_id === saved.id ||
        p.client_id === data.id ||
        p.client_id?.toLowerCase() === cleanEmail ||
        p.client?.email?.toLowerCase() === cleanEmail;
      if (isUserProject && p.client_id !== saved.id) {
        hasProjectUpdates = true;
        return { ...p, client_id: saved.id, client: saved, updated_at: new Date().toISOString() };
      }
      return p;
    });

    if (hasProjectUpdates) {
      setLocalItem(STORAGE_KEYS.PROJECTS, reconnectedProjects);
      const supabase = getSupabaseClient();
      if (supabase && saved.id.length > 30) {
        for (const p of reconnectedProjects) {
          if (p.client_id === saved.id && p.id.length > 30) {
            try {
              await supabase.from('projects').update({ client_id: saved.id }).eq('id', p.id);
            } catch (e) {
              console.warn('Error reconnecting project in Supabase on role change to client:', e);
            }
          }
        }
      }
    }

    // 3. Remove from team_members (they are now solely a Client)
    const existingTeam = await getTeamMembers();
    const filteredTeam = existingTeam.filter((t) => t.email.toLowerCase() !== cleanEmail && t.id !== data.id);
    setLocalItem(STORAGE_KEYS.TEAM, filteredTeam);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('team_members').delete().eq('email', cleanEmail);
      } catch (e) {
        console.warn('Error removing team member in Supabase on role transition:', e);
      }
    }
  } else {
    // 1. Check if an existing team record exists with this email or id
    const teamMembers = await getTeamMembers();
    const existingTeam = teamMembers.find((t) => t.email.toLowerCase() === cleanEmail || t.id === data.id);

    // Save/Update in team_members
    await saveTeamMember({
      id: existingTeam?.id || (data.id.startsWith('team-') || data.id.length > 30 ? data.id : `team-${Date.now()}`),
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone || existingClient?.phone || '',
      role: data.newRole,
      department: data.department || (data.newRole === 'admin' ? 'Executive Leadership' : 'Agency Operations'),
      status: data.status === 'inactive' ? 'inactive' : 'active',
    });

    // 2. CRITICAL: NEVER delete the client record or unlink projects when changing to a team role!
    // Preserve the client record in the background with its stable ID and projects intact.
    if (!existingClient) {
      await saveClient({
        id: stableClientId,
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone || '',
        company_name: data.company_name || `${data.name.trim()}'s Business`,
        status: 'active',
      });
    }
  }

  return { success: true, message: `Successfully updated ${data.name}'s role to ${data.newRole}.` };
}

// ==========================================
// HERO & FESTIVAL BANNERS CMS CRUD
// ==========================================

export async function getHeroBanners(): Promise<HeroBannerModel[]> {
  const localBanners = getLocalItem<HeroBannerModel[]>(STORAGE_KEYS.HERO_BANNERS, initialHeroBanners) || initialHeroBanners;
  let activeId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_HERO_ID) : null;
  const deletedIds = getLocalItem<string[]>('xgro_deleted_hero_ids', []);

  return fetchWithSWR<HeroBannerModel[]>(
    STORAGE_KEYS.HERO_BANNERS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteList = data as HeroBannerModel[];
          const map = new Map<string, HeroBannerModel>();

          // 1. Add current local items first so newly added local banners are never lost
          for (const item of localBanners) {
            if (item && item.id && !deletedIds.includes(item.id)) {
              map.set(item.id, item);
            }
          }

          // 2. Merge remote items from Supabase
          for (const item of remoteList) {
            if (item && item.id && !deletedIds.includes(item.id)) {
              map.set(item.id, {
                ...(map.get(item.id) || {}),
                ...item,
              });
            }
          }

          // 3. Ensure default hero banner is always present
          if (!map.has('hero-default')) {
            map.set('hero-default', initialHeroBanners[0]);
          }

          return Array.from(map.values());
        }
      } catch (e) {
        console.warn('Supabase getHeroBanners notice:', e);
      }
      return null;
    },
    localBanners
  ).then((list) => {
    const items = list && list.length > 0 ? list : initialHeroBanners;
    const hasDefault = items.some(b => b.is_default || b.id === 'hero-default');
    const finalItems = hasDefault ? items : [initialHeroBanners[0], ...items];

    if (!activeId) {
      activeId = finalItems.find(b => b.is_active)?.id || 'hero-default';
    }
    return finalItems.map(b => ({
      ...b,
      is_active: b.id === activeId,
    }));
  });
}

export async function getActiveHeroBanner(): Promise<HeroBannerModel> {
  const all = await getHeroBanners();
  const active = all.find((b) => b.is_active);
  return active || all.find((b) => b.is_default) || initialHeroBanners[0];
}

export async function saveHeroBanner(
  banner: Partial<HeroBannerModel> & { title: string; image_url: string }
): Promise<HeroBannerModel> {
  const current = await getHeroBanners();
  const trimmedTitle = banner.title.trim();

  let optimizedImageUrl = banner.image_url;
  if (optimizedImageUrl && optimizedImageUrl.startsWith('data:image/')) {
    try {
      optimizedImageUrl = await compressDataUrl(optimizedImageUrl, 1600, 900, 0.82);
    } catch (_) {}
  }

  const existingIdx = banner.id ? current.findIndex((b) => b.id === banner.id) : -1;
  const isDefault = banner.is_default || (existingIdx >= 0 && current[existingIdx].is_default) || banner.id === 'hero-default';

  let saved: HeroBannerModel;
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    saved = {
      ...current[existingIdx],
      ...banner,
      title: trimmedTitle,
      subtitle: banner.subtitle !== undefined ? banner.subtitle.trim() : current[existingIdx].subtitle,
      badge_text: banner.badge_text !== undefined ? banner.badge_text.trim() : current[existingIdx].badge_text,
      image_url: isDefault ? (banner.image_url || current[existingIdx].image_url) : (optimizedImageUrl || current[existingIdx].image_url),
      link_url: banner.link_url !== undefined ? banner.link_url.trim() : current[existingIdx].link_url,
      button_text: banner.button_text !== undefined ? banner.button_text.trim() : current[existingIdx].button_text,
      aspect_ratio: banner.aspect_ratio || current[existingIdx].aspect_ratio || 'auto',
      is_active: banner.is_active !== undefined ? banner.is_active : current[existingIdx].is_active,
      is_default: isDefault,
      updated_at: now,
    };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: banner.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      subtitle: (banner.subtitle || '').trim(),
      badge_text: (banner.badge_text || '').trim(),
      image_url: optimizedImageUrl,
      link_url: (banner.link_url || '').trim(),
      button_text: (banner.button_text || 'Claim Offer').trim(),
      aspect_ratio: banner.aspect_ratio || 'auto',
      is_active: banner.is_active ?? true,
      is_default: false,
      display_order: banner.display_order ?? current.length,
      created_at: now,
      updated_at: now,
    };
    current.push(saved);
  }

  // Remove from deleted list if re-saving
  const deletedIds = getLocalItem<string[]>('xgro_deleted_hero_ids', []);
  if (deletedIds.includes(saved.id)) {
    setLocalItem('xgro_deleted_hero_ids', deletedIds.filter(id => id !== saved.id));
  }

  if (saved.is_active) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_HERO_ID, saved.id);
    }
    for (let i = 0; i < current.length; i++) {
      current[i].is_active = current[i].id === saved.id;
    }
  }

  setLocalItem(STORAGE_KEYS.HERO_BANNERS, current);
  notifyDataChanged();

  // 1. Direct Supabase sync (Works on live production Vercel)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (saved.is_active) {
        await supabase.from('hero_banners').update({ is_active: false }).neq('id', saved.id);
      }
      const { error } = await supabase.from('hero_banners').upsert({
        id: saved.id,
        title: saved.title,
        subtitle: saved.subtitle,
        badge_text: saved.badge_text,
        image_url: saved.image_url,
        link_url: saved.link_url,
        button_text: saved.button_text,
        aspect_ratio: saved.aspect_ratio,
        is_active: saved.is_active,
        is_default: saved.is_default,
        display_order: saved.display_order,
        updated_at: now,
      });
      if (error) {
        console.warn('Supabase hero_banners upsert notice:', error.message);
      }
    } catch (e) {
      console.warn('Supabase hero_banners upsert notice:', e);
    }
  }

  // 2. Server route sync (best effort)
  if (typeof window !== 'undefined') {
    fetch('/api/hero-banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', banner: saved }),
    }).catch(() => {});
  }

  return saved;
}

export async function setActiveHeroBanner(bannerId: string): Promise<HeroBannerModel | null> {
  const current = await getHeroBanners();
  const target = current.find((b) => b.id === bannerId);
  if (!target) return null;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_HERO_ID, bannerId);
  }

  const now = new Date().toISOString();
  const updatedList = current.map((b) => ({
    ...b,
    is_active: b.id === bannerId,
    updated_at: b.id === bannerId ? now : b.updated_at,
  }));

  setLocalItem(STORAGE_KEYS.HERO_BANNERS, updatedList);
  notifyDataChanged();

  // 1. Direct Supabase sync
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('hero_banners').update({ is_active: false }).neq('id', bannerId);
      await supabase.from('hero_banners').update({ is_active: true, updated_at: now }).eq('id', bannerId);
    } catch (e) {
      console.warn('Supabase setActiveHeroBanner notice:', e);
    }
  }

  // 2. Server API route sync
  if (typeof window !== 'undefined') {
    fetch('/api/hero-banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_active', bannerId }),
    }).catch(() => {});
  }

  return target;
}

export async function deleteHeroBanner(bannerId: string): Promise<boolean> {
  if (bannerId === 'hero-default') {
    console.warn('Cannot delete the default hero banner.');
    return false;
  }

  const current = await getHeroBanners();
  const target = current.find((b) => b.id === bannerId);
  if (target?.is_default) {
    console.warn('Cannot delete default hero banner.');
    return false;
  }

  // Track deletion to prevent revival by background queries
  const deletedIds = getLocalItem<string[]>('xgro_deleted_hero_ids', []);
  if (!deletedIds.includes(bannerId)) {
    setLocalItem('xgro_deleted_hero_ids', [...deletedIds, bannerId]);
  }

  const wasActive = target?.is_active;
  let filtered = current.filter((b) => b.id !== bannerId);

  if (wasActive) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_HERO_ID, 'hero-default');
    }
    filtered = filtered.map((b) =>
      b.is_default || b.id === 'hero-default' ? { ...b, is_active: true } : b
    );
  }

  setLocalItem(STORAGE_KEYS.HERO_BANNERS, filtered);
  notifyDataChanged();

  // 1. Direct Supabase delete (Works on live production Vercel)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('hero_banners').delete().eq('id', bannerId);
      if (wasActive) {
        await supabase.from('hero_banners').update({ is_active: true }).eq('id', 'hero-default');
      }
    } catch (e) {
      console.warn('Supabase deleteHeroBanner notice:', e);
    }
  }

  // 2. Server API route delete (best effort)
  if (typeof window !== 'undefined') {
    fetch(`/api/hero-banners?id=${encodeURIComponent(bannerId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return true;
}

export async function uploadHeroBannerImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const cleanFileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `banners/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('hero_banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('hero_banners')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload notice, using compressed data URL:', err);
    }
  }

  // Fallback: compress to optimized WebP (< 80KB)
  return await compressImageFile(file, 1600, 900, 0.82);
}



