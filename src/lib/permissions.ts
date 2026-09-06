import { PermissionMatrix, CustomRoleModel } from './supabase/types';
import { initialRoles } from './seed-data';

export const DEFAULT_EMPTY_PERMISSIONS: PermissionMatrix = {
  services: { view: false, create_edit: false, delete: false, publish: false },
  pricing: { view: false, create_edit: false, delete: false },
  projects: { view: false, create_edit: false, delete: false, update_progress: false },
  tasks: { view: false, assign: false, update_status: false },
  clients: { view: false, create_edit: false, delete: false },
  team_roles: { view: false, create_edit: false, delete: false, manage_permissions: false },
  invoices: { view: false, create_edit: false, delete: false },
  cms_content: { view: false, create_edit: false, delete: false },
  settings: { view: false, edit: false },
};

export const DEFAULT_FULL_PERMISSIONS: PermissionMatrix = {
  services: { view: true, create_edit: true, delete: true, publish: true },
  pricing: { view: true, create_edit: true, delete: true },
  projects: { view: true, create_edit: true, delete: true, update_progress: true },
  tasks: { view: true, assign: true, update_status: true },
  clients: { view: true, create_edit: true, delete: true },
  team_roles: { view: true, create_edit: true, delete: true, manage_permissions: true },
  invoices: { view: true, create_edit: true, delete: true },
  cms_content: { view: true, create_edit: true, delete: true },
  settings: { view: true, edit: true },
};

export interface ModuleDefinition {
  key: keyof PermissionMatrix;
  name: string;
  description: string;
  actions: {
    key: string;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_MODULES: ModuleDefinition[] = [
  {
    key: 'services',
    name: 'Services CMS',
    description: 'Manage agency service catalog, features, pricing, and SEO meta tags.',
    actions: [
      { key: 'view', label: 'View Services', description: 'Browse and inspect service listings' },
      { key: 'create_edit', label: 'Create & Edit', description: 'Add new services or edit existing descriptions & pricing' },
      { key: 'publish', label: 'Publish / Unpublish', description: 'Toggle live status on public website' },
      { key: 'delete', label: 'Delete Services', description: 'Permanently remove services from catalog' },
    ],
  },
  {
    key: 'pricing',
    name: 'Pricing Plans',
    description: 'Manage pricing tiers, featured badges, discount prices, and plan features.',
    actions: [
      { key: 'view', label: 'View Pricing', description: 'Inspect agency pricing packages' },
      { key: 'create_edit', label: 'Create & Edit', description: 'Add new tiers or update rates and features' },
      { key: 'delete', label: 'Delete Plans', description: 'Remove pricing tiers' },
    ],
  },
  {
    key: 'projects',
    name: 'Projects & Milestones',
    description: 'Manage client deliverables, milestones, progress gauge, and live client updates.',
    actions: [
      { key: 'view', label: 'View Projects', description: 'Access project workspaces and timelines' },
      { key: 'create_edit', label: 'Create & Edit Projects', description: 'Initialize new projects or change metadata' },
      { key: 'update_progress', label: 'Update Progress & Milestones', description: 'Adjust progress %, complete milestones, publish live feeds' },
      { key: 'delete', label: 'Delete Projects', description: 'Permanently archive or delete client projects' },
    ],
  },
  {
    key: 'tasks',
    name: 'Tasks & Assignment',
    description: 'Assign tasks to team members and update execution status.',
    actions: [
      { key: 'view', label: 'View Tasks', description: 'Inspect team task boards' },
      { key: 'assign', label: 'Assign Tasks', description: 'Delegate tasks to team members and set priority' },
      { key: 'update_status', label: 'Update Status', description: 'Mark tasks in-progress or completed' },
    ],
  },
  {
    key: 'clients',
    name: 'Client Accounts',
    description: 'Manage client company profiles, assigned project links, and direct communication.',
    actions: [
      { key: 'view', label: 'View Clients', description: 'See client contact directory and accounts' },
      { key: 'create_edit', label: 'Create & Edit', description: 'Onboard new clients or update details' },
      { key: 'delete', label: 'Delete Clients', description: 'Remove client accounts' },
    ],
  },
  {
    key: 'team_roles',
    name: 'Team & Role Access Control',
    description: 'Manage agency staff, invite employees, define custom roles, and grant permissions.',
    actions: [
      { key: 'view', label: 'View Team & Roles', description: 'See employee directory and role list' },
      { key: 'create_edit', label: 'Add & Edit Staff', description: 'Add employees and assign them to roles' },
      { key: 'manage_permissions', label: 'Manage Roles & RBAC (Super Admin)', description: 'Create custom roles and configure permission matrices' },
      { key: 'delete', label: 'Delete Staff / Roles', description: 'Remove team members or custom roles' },
    ],
  },
  {
    key: 'invoices',
    name: 'Invoices & Quotations',
    description: 'Generate commercial quotations, issue client invoices, and track payment receipts.',
    actions: [
      { key: 'view', label: 'View Invoices', description: 'Inspect financial quotes and bills' },
      { key: 'create_edit', label: 'Create & Edit Invoices', description: 'Issue new invoices or edit line items' },
      { key: 'delete', label: 'Delete Invoices', description: 'Void or remove invoice records' },
    ],
  },
  {
    key: 'cms_content',
    name: 'Website Content & FAQs',
    description: 'Manage client testimonials, FAQ accordions, and marketing copy.',
    actions: [
      { key: 'view', label: 'View CMS Content', description: 'Preview testimonials and FAQs' },
      { key: 'create_edit', label: 'Create & Edit', description: 'Add/edit testimonials and FAQ questions' },
      { key: 'delete', label: 'Delete Content', description: 'Remove testimonials or FAQs' },
    ],
  },
  {
    key: 'settings',
    name: 'Settings & Supabase Sync',
    description: 'Database connection configuration, API keys, and data export.',
    actions: [
      { key: 'view', label: 'View Settings', description: 'Inspect system connectivity and status' },
      { key: 'edit', label: 'Configure System', description: 'Update environment configuration and run backups' },
    ],
  },
];

export const ROLE_PRESET_TEMPLATES: {
  name: string;
  description: string;
  permissions: PermissionMatrix;
}[] = [
  {
    name: 'Project Manager',
    description: 'Oversee project lifecycles, assign tasks, update milestones, and communicate with clients.',
    permissions: {
      services: { view: true, create_edit: false, delete: false, publish: false },
      pricing: { view: true, create_edit: false, delete: false },
      projects: { view: true, create_edit: true, delete: false, update_progress: true },
      tasks: { view: true, assign: true, update_status: true },
      clients: { view: true, create_edit: true, delete: false },
      team_roles: { view: true, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: true, create_edit: true, delete: false },
      cms_content: { view: true, create_edit: false, delete: false },
      settings: { view: false, edit: false },
    },
  },
  {
    name: 'Lead Developer',
    description: 'Technical lead with project visibility, task execution, and service technical specs.',
    permissions: {
      services: { view: true, create_edit: true, delete: false, publish: false },
      pricing: { view: true, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: true },
      tasks: { view: true, assign: true, update_status: true },
      clients: { view: true, create_edit: false, delete: false },
      team_roles: { view: true, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: false, create_edit: false, delete: false },
      settings: { view: true, edit: false },
    },
  },
  {
    name: 'UI/UX & Creative Lead',
    description: 'Visual designer handling design deliverables, website testimonials, and creative assets.',
    permissions: {
      services: { view: true, create_edit: true, delete: false, publish: false },
      pricing: { view: false, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: true, assign: false, update_status: true },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: true, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: true, create_edit: true, delete: false },
      settings: { view: false, edit: false },
    },
  },
  {
    name: 'Marketing & SEO Specialist',
    description: 'Manages marketing services, SEO metadata, CMS content, and FAQs.',
    permissions: {
      services: { view: true, create_edit: true, delete: false, publish: true },
      pricing: { view: true, create_edit: true, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: true, assign: false, update_status: true },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: false, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: true, create_edit: true, delete: true },
      settings: { view: false, edit: false },
    },
  },
  {
    name: 'Finance & Billing Coordinator',
    description: 'Issues client invoices, tracks payments, views pricing plans and client contacts.',
    permissions: {
      services: { view: true, create_edit: false, delete: false, publish: false },
      pricing: { view: true, create_edit: true, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: false, assign: false, update_status: false },
      clients: { view: true, create_edit: true, delete: false },
      team_roles: { view: false, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: true, create_edit: true, delete: true },
      cms_content: { view: false, create_edit: false, delete: false },
      settings: { view: false, edit: false },
    },
  },
];

/**
 * Check whether a user's role grants permission for a specific module & action.
 * Super Admin (or email 'bajakprashant1998@gmail.com') ALWAYS returns true.
 */
export function hasPermission(
  userRoleKey: string | undefined | null,
  module: keyof PermissionMatrix,
  action: string,
  rolesList?: CustomRoleModel[]
): boolean {
  if (!userRoleKey) return false;
  if (userRoleKey === 'admin' || userRoleKey === 'super_admin' || userRoleKey === 'role-super-admin') {
    return true;
  }

  const list = rolesList || initialRoles;
  const roleObj = list.find(
    (r) => r.key === userRoleKey || r.id === userRoleKey || r.name.toLowerCase() === userRoleKey.toLowerCase()
  );

  if (!roleObj) return false;
  if (roleObj.is_system && roleObj.key === 'admin') return true;

  const modulePerms = roleObj.permissions?.[module] as Record<string, boolean> | undefined;
  if (!modulePerms) return false;

  return !!modulePerms[action];
}
