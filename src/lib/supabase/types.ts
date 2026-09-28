export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ServiceStatus = 'published' | 'draft';
export type PricingStatus = 'published' | 'draft';

export type ProjectStatus =
  | 'not_started'
  | 'requirement'
  | 'planning'
  | 'design'
  | 'development'
  | 'testing'
  | 'revision'
  | 'completed'
  | 'delivered'
  | 'on_hold';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = string;
export type DocumentType = 'quotation' | 'invoice' | 'document' | 'contract';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'accepted' | 'rejected';

export interface PermissionMatrix {
  services: { view: boolean; create_edit: boolean; delete: boolean; publish: boolean };
  pricing: { view: boolean; create_edit: boolean; delete: boolean };
  projects: { view: boolean; create_edit: boolean; delete: boolean; update_progress: boolean };
  tasks: { view: boolean; assign: boolean; update_status: boolean };
  clients: { view: boolean; create_edit: boolean; delete: boolean };
  team_roles: { view: boolean; create_edit: boolean; delete: boolean; manage_permissions: boolean };
  invoices: { view: boolean; create_edit: boolean; delete: boolean };
  cms_content: { view: boolean; create_edit: boolean; delete: boolean };
  settings: { view: boolean; edit: boolean };
}

export interface CustomRoleModel {
  id: string;
  name: string;
  key: string;
  description: string;
  is_system: boolean; // true for super_admin and client (immutable)
  permissions: PermissionMatrix;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceModel {
  id: string;
  slug: string;
  title: string;
  category: string;
  short_description: string;
  full_description?: string;
  price?: string;
  discount_price?: string;
  features: string[];
  image_url?: string;
  icon?: string;
  status: ServiceStatus;
  display_order: number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingPlanModel {
  id: string;
  name: string;
  slug?: string;
  price: string;
  discount_price?: string;
  tag?: string;
  highlighted: boolean;
  features: string[];
  status: PricingStatus;
  display_order: number;
  cta_label?: string;
  cta_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientModel {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  avatar_url?: string;
  address?: string;
  status: 'active' | 'pending_approval' | 'inactive';
  selected_plan?: string;
  notes?: string;
  created_at?: string;
}

export interface TeamMemberModel {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface MilestoneModel {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: MilestoneStatus;
  order_index: number;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskModel {
  id: string;
  project_id: string;
  milestone_id?: string;
  title: string;
  description?: string;
  assigned_to?: string; // team_member id
  assigned_member?: TeamMemberModel;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectUpdateModel {
  id: string;
  project_id: string;
  author_id?: string;
  author_name: string;
  author_role?: string;
  title: string;
  message: string;
  progress_percent?: number;
  attachments?: { name: string; url: string }[];
  is_visible_to_client: boolean;
  created_at: string;
}

export interface InvoiceDocumentModel {
  id: string;
  project_id?: string;
  client_id: string;
  type: DocumentType;
  title: string;
  reference_number?: string;
  file_url?: string;
  amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  notes?: string;
  created_at?: string;
}

export interface NotificationModel {
  id: string;
  user_id?: string;
  client_id?: string;
  project_id?: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ProjectModel {
  id: string;
  project_name: string;
  client_id: string;
  client?: ClientModel;
  service_id?: string;
  service_name: string;
  start_date: string;
  expected_completion_date?: string;
  project_value: number;
  assigned_manager_id?: string;
  assigned_manager?: TeamMemberModel;
  assigned_employee_ids: string[];
  assigned_employees?: TeamMemberModel[];
  status: ProjectStatus;
  progress_percentage: number;
  description?: string;
  milestones?: MilestoneModel[];
  tasks?: TaskModel[];
  updates?: ProjectUpdateModel[];
  invoices?: InvoiceDocumentModel[];
  created_at?: string;
  updated_at?: string;
}

export interface TestimonialModel {
  id: string;
  quote: string;
  name: string;
  org: string;
  rating?: number;
  avatar_url?: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at?: string;
}

export interface FaqModel {
  id: string;
  question: string;
  answer: string;
  category?: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at?: string;
}

export interface TrustedLogoModel {
  id: string;
  name: string;
  note?: string;
  logo_url?: string;
  icon?: string;
  website_url?: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceItemModel {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'prompt' | 'canva' | 'pdf' | 'tool' | 'link' | 'checklist';
  fileFormat: string;
  fileSize?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  linkUrl?: string;
  promptContent?: string;
  dateAdded?: string;
  downloadCount?: number;
  featured?: boolean;
  gradient?: string;
  tags: string[];
  status?: 'published' | 'draft';
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

