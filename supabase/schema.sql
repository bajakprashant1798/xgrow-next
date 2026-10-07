-- ==============================================================================
-- XGRO AGENCY MANAGEMENT PLATFORM & CMS DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SERVICES TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Web',
    short_description TEXT NOT NULL,
    full_description TEXT,
    price TEXT,
    discount_price TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    icon TEXT DEFAULT 'Laptop',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRICING PLANS TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    price TEXT NOT NULL,
    discount_price TEXT,
    tag TEXT,
    highlighted BOOLEAN DEFAULT false,
    features JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER DEFAULT 0,
    cta_label TEXT DEFAULT 'Get started',
    cta_link TEXT DEFAULT '/contact',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TESTIMONIALS TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote TEXT NOT NULL,
    name TEXT NOT NULL,
    org TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. FAQS TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4b. TRUSTED LOGOS / PARTNERS TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.trusted_logos (
    id TEXT PRIMARY KEY DEFAULT ('brand-' || gen_random_uuid()),
    name TEXT NOT NULL,
    note TEXT,
    logo_url TEXT,
    icon TEXT DEFAULT 'Building2',
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4c. HERO & FESTIVAL BANNERS TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id TEXT PRIMARY KEY DEFAULT ('hero-' || gen_random_uuid()),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT DEFAULT 'Claim Offer',
    aspect_ratio TEXT DEFAULT 'auto',
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company_name TEXT,
    avatar_url TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CUSTOM ROLES & RBAC PERMISSION MATRIX TABLE
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TEAM MEMBERS / EMPLOYEES TABLE (Supports dynamic custom roles)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'developer',
    department TEXT NOT NULL DEFAULT 'Engineering',
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    project_value NUMERIC DEFAULT 0,
    assigned_manager_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    assigned_employee_ids JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'requirement' CHECK (status IN (
        'not_started',
        'requirement',
        'planning',
        'design',
        'development',
        'testing',
        'revision',
        'completed',
        'delivered',
        'on_hold'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TASKS TABLE (EMPLOYEE ASSIGNMENTS)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. PROJECT UPDATES TABLE (TIMELINE LOGS)
CREATE TABLE IF NOT EXISTS public.project_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    progress_percent INTEGER,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_visible_to_client BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. INVOICES, QUOTATIONS & DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.invoices_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quotation', 'invoice', 'document', 'contract')),
    title TEXT NOT NULL,
    reference_number TEXT,
    file_url TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'accepted', 'rejected')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. FREE RESOURCES TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.resources (
    id TEXT PRIMARY KEY DEFAULT ('res-' || gen_random_uuid()),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prompt', 'canva', 'pdf', 'tool', 'link', 'checklist')),
    file_format TEXT NOT NULL DEFAULT 'PDF Document',
    file_size TEXT DEFAULT 'Instant',
    thumbnail_url TEXT,
    download_url TEXT,
    link_url TEXT,
    prompt_content TEXT,
    gradient TEXT DEFAULT 'from-purple-600 via-pink-600 to-rose-600',
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    download_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. RESOURCE LEADS TABLE (VISITOR CRM)
CREATE TABLE IF NOT EXISTS public.resource_leads (
    id TEXT PRIMARY KEY DEFAULT ('lead-' || gen_random_uuid()),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT,
    country TEXT,
    notes TEXT,
    resource_id TEXT,
    resource_title TEXT NOT NULL,
    resource_type TEXT DEFAULT 'resource',
    coupon_code TEXT DEFAULT 'XGROW-SAVE15',
    calc_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view published services" ON public.services FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published pricing" ON public.pricing_plans FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published testimonials" ON public.testimonials FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published faqs" ON public.faqs FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view published trusted logos" ON public.trusted_logos FOR SELECT USING (status = 'published');
CREATE POLICY "Allow all hero_banners" ON public.hero_banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all resources" ON public.resources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all resource_leads" ON public.resource_leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read custom_roles" ON public.custom_roles FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access services" ON public.services FOR ALL USING (true);
CREATE POLICY "Service role full access pricing" ON public.pricing_plans FOR ALL USING (true);
CREATE POLICY "Service role full access testimonials" ON public.testimonials FOR ALL USING (true);
CREATE POLICY "Service role full access faqs" ON public.faqs FOR ALL USING (true);
CREATE POLICY "Service role full access trusted logos" ON public.trusted_logos FOR ALL USING (true);
CREATE POLICY "Service role full access clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Service role full access custom_roles" ON public.custom_roles FOR ALL USING (true);
CREATE POLICY "Service role full access team_members" ON public.team_members FOR ALL USING (true);
CREATE POLICY "Service role full access projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Service role full access milestones" ON public.milestones FOR ALL USING (true);
CREATE POLICY "Service role full access tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Service role full access updates" ON public.project_updates FOR ALL USING (true);
CREATE POLICY "Service role full access invoices" ON public.invoices_documents FOR ALL USING (true);
CREATE POLICY "Service role full access notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Service role full access resources" ON public.resources FOR ALL USING (true);
CREATE POLICY "Service role full access resource_leads" ON public.resource_leads FOR ALL USING (true);

-- Clients read own data
CREATE POLICY "Clients read own data" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients read own projects" ON public.projects FOR SELECT USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Clients read own milestones" ON public.milestones FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));
CREATE POLICY "Clients read own updates" ON public.project_updates FOR SELECT USING (is_visible_to_client = true AND project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));
CREATE POLICY "Clients read own invoices" ON public.invoices_documents FOR SELECT USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Clients read own notifications" ON public.notifications FOR SELECT USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed Custom Roles & Permissions (System & Presets)
INSERT INTO public.custom_roles (id, name, key, description, is_system, permissions)
VALUES
('role-super-admin', 'Super Admin', 'admin', 'Full agency system access with permission to configure all modules and manage roles.', true, '{"services": {"view": true, "delete": true, "publish": true, "create_edit": true}, "pricing": {"view": true, "delete": true, "create_edit": true}, "projects": {"view": true, "delete": true, "create_edit": true, "update_progress": true}, "tasks": {"view": true, "assign": true, "update_status": true}, "clients": {"view": true, "delete": true, "create_edit": true}, "team_roles": {"view": true, "delete": true, "create_edit": true, "manage_permissions": true}, "invoices": {"view": true, "delete": true, "create_edit": true}, "cms_content": {"view": true, "delete": true, "create_edit": true}, "settings": {"view": true, "edit": true}}'::jsonb),
('role-client', 'Client', 'client', 'Client portal access limited to assigned projects, milestones, progress updates, and invoices.', true, '{"services": {"view": true, "delete": false, "publish": false, "create_edit": false}, "pricing": {"view": true, "delete": false, "create_edit": false}, "projects": {"view": true, "delete": false, "create_edit": false, "update_progress": false}, "tasks": {"view": false, "assign": false, "update_status": false}, "clients": {"view": false, "delete": false, "create_edit": false}, "team_roles": {"view": false, "delete": false, "create_edit": false, "manage_permissions": false}, "invoices": {"view": true, "delete": false, "create_edit": false}, "cms_content": {"view": true, "delete": false, "create_edit": false}, "settings": {"view": false, "edit": false}}'::jsonb),
('role-pm', 'Project Manager', 'manager', 'Manages project pipelines, assigns tasks, updates milestone progress, and communicates with clients.', false, '{"services": {"view": true, "delete": false, "publish": false, "create_edit": false}, "pricing": {"view": true, "delete": false, "create_edit": false}, "projects": {"view": true, "delete": false, "create_edit": true, "update_progress": true}, "tasks": {"view": true, "assign": true, "update_status": true}, "clients": {"view": true, "delete": false, "create_edit": true}, "team_roles": {"view": true, "delete": false, "create_edit": false, "manage_permissions": false}, "invoices": {"view": true, "delete": false, "create_edit": true}, "cms_content": {"view": true, "delete": false, "create_edit": false}, "settings": {"view": false, "edit": false}}'::jsonb),
('role-dev', 'Developer / Engineer', 'developer', 'Views assigned project deliverables and marks development tasks complete.', false, '{"services": {"view": true, "delete": false, "publish": false, "create_edit": false}, "pricing": {"view": false, "delete": false, "create_edit": false}, "projects": {"view": true, "delete": false, "create_edit": false, "update_progress": false}, "tasks": {"view": true, "assign": false, "update_status": true}, "clients": {"view": false, "delete": false, "create_edit": false}, "team_roles": {"view": true, "delete": false, "create_edit": false, "manage_permissions": false}, "invoices": {"view": false, "delete": false, "create_edit": false}, "cms_content": {"view": false, "delete": false, "create_edit": false}, "settings": {"view": false, "edit": false}}'::jsonb),
('role-designer', 'UI/UX Designer', 'designer', 'Designs branding, UI mockups, and completes visual creative tasks.', false, '{"services": {"view": true, "delete": false, "publish": false, "create_edit": false}, "pricing": {"view": false, "delete": false, "create_edit": false}, "projects": {"view": true, "delete": false, "create_edit": false, "update_progress": false}, "tasks": {"view": true, "assign": false, "update_status": true}, "clients": {"view": false, "delete": false, "create_edit": false}, "team_roles": {"view": true, "delete": false, "create_edit": false, "manage_permissions": false}, "invoices": {"view": false, "delete": false, "create_edit": false}, "cms_content": {"view": true, "delete": false, "create_edit": true}, "settings": {"view": false, "edit": false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed Services
INSERT INTO public.services (slug, title, category, short_description, price, discount_price, features, icon, status, display_order, meta_title, meta_description)
VALUES
('website-development', 'Website Development', 'Web', 'Fast, conversion-first websites that turn visitors into enquiries — not just pretty pages.', '₹14,999', '₹24,999', '["Business Websites", "Ecommerce Platforms", "High-Converting Landing Pages", "Mobile Apps", "Custom Web Portals", "Speed & Core Web Vitals Optimization"]'::jsonb, 'Laptop', 'published', 1, 'Custom Website Development Services | XGRO', 'High-performance web development and web apps built for growth.'),
('graphic-design', 'Graphic Design', 'Creative', 'Scroll-stopping creatives and print work that make a small brand look established.', '₹7,999', '₹12,999', '["Social Media Creatives", "Posters & Banners", "Logos & Visual Identity", "Packaging Design", "Notes & Question Papers for Schools"]'::jsonb, 'Palette', 'published', 2, 'Creative Graphic Design Services | XGRO', 'Stunning brand identity and visual designs that captivate.'),
('content-marketing', 'Content Marketing', 'Marketing', 'Content that ranks, gets shared, and quietly sells while you run your business.', '₹9,999', '₹15,999', '["Blogs & Articles", "SEO Content Writing", "Sales Copywriting", "Social Media Copy", "Email Marketing Sequences"]'::jsonb, 'TrendingUp', 'published', 3, 'Content Marketing & Copywriting | XGRO', 'Drive organic traffic and qualified leads with compelling content.'),
('seo', 'SEO Optimization', 'Marketing', 'Get found by the people already searching for what you sell, in your city and beyond.', '₹12,499', '₹18,999', '["Local SEO & Google Maps", "Technical SEO Audits", "Keyword Research & Strategy", "On-Page Optimization", "Authority Link Building"]'::jsonb, 'TrendingUp', 'published', 4, 'Search Engine Optimization (SEO) | XGRO', 'Rank #1 on Google for high-intent searches in your market.'),
('ai-automation', 'AI Automation', 'AI', 'Let AI answer, qualify and follow up — so no enquiry is ever left on read.', '₹19,999', '₹29,999', '["24/7 AI WhatsApp Chatbots", "CRM & Lead Pipeline Automation", "Instant Lead Qualification", "Custom AI Voice & Text Agents"]'::jsonb, 'Cpu', 'published', 5, 'AI Automation & Chatbots for Business | XGRO', 'Automate customer support and sales follow-ups with cutting-edge AI.'),
('digital-marketing', 'Digital Marketing', 'Marketing', 'Paid campaigns built around cost per lead, not vanity impressions.', '₹14,999', '₹22,999', '["Google Search & Display Ads", "Meta (Facebook & Instagram) Ads", "High-ROI Lead Generation", "Laser Retargeting"]'::jsonb, 'TrendingUp', 'published', 6, 'Performance Digital Marketing | XGRO', 'Scalable paid advertising campaigns engineered for measurable ROI.'),
('branding', 'Branding & Identity', 'Creative', 'An identity system that lets you charge what you are actually worth.', '₹18,999', '₹28,999', '["Complete Logo System", "Brand Style Guidelines", "Typography & Color Palette", "Stationery & Packaging Design"]'::jsonb, 'Palette', 'published', 7, 'Brand Identity & Strategy | XGRO', 'Elevate your business perception with world-class branding.')
ON CONFLICT (slug) DO NOTHING;

-- Seed Pricing Plans
INSERT INTO public.pricing_plans (name, slug, price, discount_price, tag, highlighted, features, status, display_order)
VALUES
('Starter', 'starter', '₹14,999', '₹24,999', 'Students & new businesses', false, '["5-page responsive website", "Mobile-first design", "Basic on-page SEO", "WhatsApp enquiry button", "Free 1 month support", "Fast 7-10 day delivery"]'::jsonb, 'published', 1),
('Growth', 'growth', '₹39,999', '₹59,999', 'Most popular for local businesses', true, '["Up to 12 pages + dynamic blog", "Custom design & brand polish", "Local SEO setup + Google Business", "AI chatbot & WhatsApp lead capture", "Client management dashboard", "3 months dedicated support"]'::jsonb, 'published', 2),
('Scale', 'scale', 'Custom', NULL, 'Ecommerce & multi-location brands', false, '["Full custom web app or ecommerce", "Complete brand identity system", "Ongoing SEO + paid ad management", "Full CRM & AI workflow automation", "Monthly growth strategy calls", "Dedicated account manager & SLA"]'::jsonb, 'published', 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed Hero Banners (Only Indestructible Default Showcase)
INSERT INTO public.hero_banners (id, title, subtitle, badge_text, image_url, link_url, button_text, aspect_ratio, is_active, is_default, display_order)
VALUES
('hero-default', 'Default Agency Showcase', 'XGRO AI Platform & Agency Growth Suite Mockup', '⚡ Core Showcase', '/home/hero.png', '/contact', 'Get Started', 'mockup', true, true, 0)
ON CONFLICT (id) DO NOTHING;

-- Storage Buckets Configuration (hero_banners & resources)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero_banners', 'hero_banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access hero_banners" ON storage.objects;
CREATE POLICY "Public Access hero_banners"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'hero_banners')
WITH CHECK (bucket_id = 'hero_banners');

INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access resources" ON storage.objects;
CREATE POLICY "Public Access resources"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'resources')
WITH CHECK (bucket_id = 'resources');

-- Seed Team Members (Super Admin Prashant Bajak)
INSERT INTO public.team_members (name, email, phone, role, department, status)
VALUES
('Prashant Bajak', 'bajakprashant1998@gmail.com', '+91 63953 19725', 'admin', 'Super Admin & Agency Director', 'active'),
('Bhautik Chauhan', 'bhautik@xgro.in', '+91 63953 19725', 'admin', 'Executive Leadership', 'active')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Seed Initial Clients (Rock Happy - rockhappy1798@gmail.com)
INSERT INTO public.clients (name, email, phone, company_name, address, status)
VALUES
('Rock Happy', 'rockhappy1798@gmail.com', '+91 98765 01798', 'Rock Global Ventures', 'Cyber City, Gurugram, HR', 'active')
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- AUTOMATED AUTH TRIGGER (SUPABASE USER PROVISIONING)
-- ==============================================================================

-- Function to handle new Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Grant admin to bajakprashant1998@gmail.com automatically
  IF NEW.email = 'bajakprashant1998@gmail.com' THEN
    INSERT INTO public.team_members (user_id, name, email, role, department, status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Prashant Bajak'), NEW.email, 'admin', 'Super Admin & Agency Director', 'active')
    ON CONFLICT (email) DO UPDATE SET user_id = NEW.id, role = 'admin';
  ELSIF NEW.email = 'rockhappy1798@gmail.com' THEN
    -- Grant verified active client to rockhappy1798@gmail.com
    INSERT INTO public.clients (user_id, name, email, company_name, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Rock Happy'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Rock Global Ventures'),
      'active'
    )
    ON CONFLICT (email) DO UPDATE SET user_id = NEW.id, status = 'active';
  ELSIF (NEW.raw_user_meta_data->>'role') IS NOT NULL AND (NEW.raw_user_meta_data->>'role') != 'client' THEN
    INSERT INTO public.team_members (user_id, name, email, role, department, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'developer'),
      COALESCE(NEW.raw_user_meta_data->>'department', 'Engineering'),
      'active'
    )
    ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
  ELSE
    -- Default to client account
    INSERT INTO public.clients (user_id, name, email, company_name, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Client Organization'),
      'active'
    )
    ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
