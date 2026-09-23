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
} from './seed-data';

import { getSupabaseClient } from './supabase/client';

const STORAGE_KEYS = {
  SERVICES: 'xgro_cms_services',
  PRICING: 'xgro_cms_pricing',
  CLIENTS: 'xgro_clients',
  TEAM: 'xgro_team_members',
  PROJECTS: 'xgro_projects',
  NOTIFICATIONS: 'xgro_notifications',
  TESTIMONIALS: 'xgro_testimonials',
  FAQS: 'xgro_faqs',
  ROLES: 'xgro_custom_roles',
  TRUSTED_LOGOS: 'xgro_trusted_logos',
  TRUSTED_SECTION_TITLE: 'xgro_trusted_section_title',
};

// Clear stale legacy dummy data from browser localStorage on init
const STORAGE_CLEAN_VERSION = 'xgro_v4_clean_db';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('xgro_cache_ver') !== STORAGE_CLEAN_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.TEAM);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
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
        console.error('Error executing store subscriber callback', err);
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
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return fallback;
  }
}

// Helper to write to localStorage & memory cache
function setLocalItem<T>(key: string, value: T): void {
  memoryCache[key] = { data: value, timestamp: Date.now() };
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChanged();
  } catch (e) {
    console.error(`Error writing ${key} to storage`, e);
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
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  // 2. If memory cache exists but is stale, or localStorage has data:
  // Return the cached data instantly AND trigger non-blocking background refresh
  let immediateData: T | null = cached ? (cached.data as T) : null;
  if (!immediateData && typeof window !== 'undefined') {
    const local = getLocalItem<T>(key, null as any);
    if (local) {
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
  return fetchWithSWR<ClientModel[]>(
    STORAGE_KEYS.CLIENTS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as ClientModel[];
      }
      return null;
    },
    initialClients
  );
}

export async function saveClient(client: Partial<ClientModel> & { name: string; email: string }): Promise<ClientModel> {
  const current = await getClients();
  const existingIdx = current.findIndex(c => c.id === client.id || c.email.toLowerCase() === client.email.toLowerCase());
  let savedClient: ClientModel;

  if (existingIdx >= 0) {
    savedClient = { ...current[existingIdx], ...client };
    current[existingIdx] = savedClient;
  } else {
    savedClient = {
      id: client.id || `cli-${Date.now()}`,
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      company_name: client.company_name || client.name,
      avatar_url: client.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}`,
      address: client.address || '',
      status: client.status || 'active',
      created_at: new Date().toISOString(),
    };
    current.unshift(savedClient);
  }

  setLocalItem(STORAGE_KEYS.CLIENTS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
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
  }

  return savedClient;
}

export async function deleteClient(id: string): Promise<boolean> {
  const current = await getClients();
  const filtered = current.filter(c => c.id !== id);
  setLocalItem(STORAGE_KEYS.CLIENTS, filtered);

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('clients').delete().eq('id', id);
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
  const current = await getTeamMembers();
  const existingIdx = current.findIndex(t => t.id === member.id || t.email.toLowerCase() === member.email.toLowerCase());
  let saved: TeamMemberModel;

  if (existingIdx >= 0) {
    saved = { ...current[existingIdx], ...member };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: member.id || `team-${Date.now()}`,
      name: member.name,
      email: member.email,
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
  return fetchWithSWR<ProjectModel[]>(
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
}

export async function getProjectById(id: string): Promise<ProjectModel | null> {
  // 1. Instant check from local cache
  const cachedProjects = getLocalItem<ProjectModel[]>(STORAGE_KEYS.PROJECTS, []);
  const matched = cachedProjects.find(p => p.id === id);
  if (matched) {
    // Non-blocking single-item background sync
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*, client:clients(*), milestones(*), tasks(*), updates:project_updates(*), invoices:invoices_documents(*)')
            .eq('id', id)
            .single();
          if (!error && data) {
            const current = getLocalItem<ProjectModel[]>(STORAGE_KEYS.PROJECTS, []);
            const idx = current.findIndex(p => p.id === id);
            if (idx >= 0) {
              current[idx] = data as unknown as ProjectModel;
            } else {
              current.unshift(data as unknown as ProjectModel);
            }
            setLocalItem(STORAGE_KEYS.PROJECTS, current);
          }
        } catch (e) {}
      })();
    }
    return matched;
  }

  // 2. Direct single query from Supabase with quick timeout
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(*), milestones(*), tasks(*), updates:project_updates(*), invoices:invoices_documents(*)')
        .eq('id', id)
        .single();
      if (!error && data) {
        return data as unknown as ProjectModel;
      }
    } catch (e) {
      console.warn('Error fetching project by ID:', e);
    }
  }

  // 3. Fallback to all projects list
  const allProjects = await getProjects();
  return allProjects.find(p => p.id === id) || null;
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

export async function updateProjectProgress(
  projectId: string,
  progress: number,
  status?: ProjectStatus,
  updateMessage?: string,
  authorName: string = 'Admin Team'
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  project.progress_percentage = Math.max(0, Math.min(100, progress));
  if (status) project.status = status;
  project.updated_at = new Date().toISOString();

  // If an update message was provided, append to project updates feed
  if (updateMessage) {
    const newUpdate: ProjectUpdateModel = {
      id: `upd-${Date.now()}`,
      project_id: projectId,
      author_name: authorName,
      author_role: 'Project Lead',
      title: `Project Progress: ${progress}%`,
      message: updateMessage,
      progress_percent: progress,
      is_visible_to_client: true,
      created_at: new Date().toISOString(),
    };
    project.updates = [newUpdate, ...(project.updates || [])];

    // Create client notification
    await addNotification({
      client_id: project.client_id,
      project_id: projectId,
      title: `Project Progress Updated: ${progress}%`,
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
          title: `Project Progress: ${progress}%`,
          message: updateMessage,
          progress_percent: progress,
          is_visible_to_client: true,
        });
      } catch (e) {
        console.warn('Error inserting project update in Supabase:', e);
      }
    }
  }

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

export async function addProjectInvoice(
  projectId: string,
  invoice: Omit<InvoiceDocumentModel, 'id' | 'created_at'>
): Promise<ProjectModel | null> {
  const projects = await getProjects();
  const project = projects.find(p => p.id === projectId);
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
  return fetchWithSWR<TrustedLogoModel[]>(
    STORAGE_KEYS.TRUSTED_LOGOS,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('trusted_logos')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) return data as TrustedLogoModel[];
      return null;
    },
    initialTrustedLogos
  );
}

export async function saveTrustedLogo(
  logo: Partial<TrustedLogoModel> & { name: string }
): Promise<TrustedLogoModel> {
  const current = await getTrustedLogos();
  const existingIdx = current.findIndex(l => l.id === logo.id);
  let saved: TrustedLogoModel;

  if (existingIdx >= 0) {
    saved = { ...current[existingIdx], ...logo, updated_at: new Date().toISOString() };
    current[existingIdx] = saved;
  } else {
    saved = {
      id: logo.id || `brand-${Date.now()}`,
      name: logo.name,
      note: logo.note || '',
      logo_url: logo.logo_url || '',
      icon: logo.icon || 'Building2',
      website_url: logo.website_url || '',
      status: logo.status || 'published',
      display_order: logo.display_order ?? (current.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.push(saved);
  }

  setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, current);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const isUUID = saved.id && saved.id.includes('-') && saved.id.length > 30;
      const { data: upserted, error } = await supabase
        .from('trusted_logos')
        .upsert({
          id: isUUID ? saved.id : undefined,
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
        const updatedList = current.map(l => l.id === saved.id ? (upserted as TrustedLogoModel) : l);
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
  setLocalItem(STORAGE_KEYS.TRUSTED_LOGOS, current.filter(l => l.id !== id));

  const supabase = getSupabaseClient();
  if (supabase && id.length > 30) {
    try {
      await supabase.from('trusted_logos').delete().eq('id', id);
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


