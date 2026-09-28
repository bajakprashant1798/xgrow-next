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
  CustomRoleModel,
  TrustedLogoModel,
} from './supabase/types';

export const initialRoles: CustomRoleModel[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    key: 'admin',
    description: 'Full agency system access with permission to configure all modules and manage roles.',
    is_system: true,
    permissions: {
      services: { view: true, create_edit: true, delete: true, publish: true },
      pricing: { view: true, create_edit: true, delete: true },
      projects: { view: true, create_edit: true, delete: true, update_progress: true },
      tasks: { view: true, assign: true, update_status: true },
      clients: { view: true, create_edit: true, delete: true },
      team_roles: { view: true, create_edit: true, delete: true, manage_permissions: true },
      invoices: { view: true, create_edit: true, delete: true },
      cms_content: { view: true, create_edit: true, delete: true },
      settings: { view: true, edit: true },
    },
  },
  {
    id: 'role-client',
    name: 'Client',
    key: 'client',
    description: 'Client portal access limited to assigned projects, milestones, progress updates, and invoices.',
    is_system: true,
    permissions: {
      services: { view: true, create_edit: false, delete: false, publish: false },
      pricing: { view: true, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: false, assign: false, update_status: false },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: false, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: true, create_edit: false, delete: false },
      cms_content: { view: true, create_edit: false, delete: false },
      settings: { view: false, edit: false },
    },
  },
  {
    id: 'role-pm',
    name: 'Project Manager',
    key: 'manager',
    description: 'Manages project pipelines, assigns tasks, updates milestone progress, and communicates with clients.',
    is_system: false,
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
    id: 'role-dev',
    name: 'Developer / Engineer',
    key: 'developer',
    description: 'Views assigned project deliverables and marks development tasks complete.',
    is_system: false,
    permissions: {
      services: { view: true, create_edit: false, delete: false, publish: false },
      pricing: { view: false, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: true, assign: false, update_status: true },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: true, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: false, create_edit: false, delete: false },
      settings: { view: false, edit: false },
    },
  },
  {
    id: 'role-designer',
    name: 'UI/UX Designer',
    key: 'designer',
    description: 'Designs branding, UI mockups, and completes visual creative tasks.',
    is_system: false,
    permissions: {
      services: { view: true, create_edit: false, delete: false, publish: false },
      pricing: { view: false, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: true, assign: false, update_status: true },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: true, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: false, create_edit: false, delete: false },
      settings: { view: false, edit: false },
    },
  },
  {
    id: 'role-marketing',
    name: 'Marketing & SEO Specialist',
    key: 'marketer',
    description: 'Manages website CMS content, blog articles, SEO metadata, and campaigns.',
    is_system: false,
    permissions: {
      services: { view: true, create_edit: true, delete: false, publish: true },
      pricing: { view: true, create_edit: false, delete: false },
      projects: { view: true, create_edit: false, delete: false, update_progress: false },
      tasks: { view: true, assign: false, update_status: true },
      clients: { view: false, create_edit: false, delete: false },
      team_roles: { view: false, create_edit: false, delete: false, manage_permissions: false },
      invoices: { view: false, create_edit: false, delete: false },
      cms_content: { view: true, create_edit: true, delete: true },
      settings: { view: false, edit: false },
    },
  },
];

export const initialServices: ServiceModel[] = [
  {
    id: 'srv-1',
    slug: 'website-development',
    title: 'Website Development',
    category: 'Web',
    short_description: 'Fast, conversion-first websites that turn visitors into enquiries — not just pretty pages.',
    full_description: 'We construct high-speed Next.js and full-stack web applications tailored for lead acquisition, instant mobile responsiveness, and high conversion performance.',
    price: '₹14,999',
    discount_price: '₹24,999',
    features: [
      'Custom Responsive Next.js / React Architecture',
      'Mobile-First Touch Friendly Interface',
      'Integrated WhatsApp Lead Qualification & Booking',
      'Google Core Web Vitals & 95+ Speed Score Guarantee',
      'Free Domain & SSL Setup for Year 1',
      'Basic On-Page SEO & Meta Tags Configuration',
      'Content Management & Admin Controls'
    ],
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
    icon: 'Laptop',
    status: 'published',
    display_order: 1,
    meta_title: 'Custom Website Development Services | XGRO',
    meta_description: 'Build fast, conversion-driven websites with XGRO. Modern web solutions engineered for maximum ROI.'
  },
  {
    id: 'srv-2',
    slug: 'graphic-design',
    title: 'Graphic Design & Creatives',
    category: 'Creative',
    short_description: 'Scroll-stopping creatives and print work that make a small brand look established.',
    full_description: 'Visual storytelling across social media feeds, corporate collateral, billboard packaging, and promotional materials.',
    price: '₹7,999',
    discount_price: '₹12,999',
    features: [
      'Social Media Ad Creatives & Carousel Sets',
      'Corporate Brochure & Catalog Design',
      'Vector Logo & Brand Iconography',
      'Print-Ready Packaging & Merchandise Assets',
      'Notes & Question Papers for Institutes & Schools'
    ],
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
    icon: 'Palette',
    status: 'published',
    display_order: 2,
    meta_title: 'Professional Graphic Design Services | XGRO',
    meta_description: 'Captivating graphics and visual identity designs that make your brand stand out.'
  },
  {
    id: 'srv-3',
    slug: 'content-marketing',
    title: 'Content Marketing & Copywriting',
    category: 'Marketing',
    short_description: 'Content that ranks, gets shared, and quietly sells while you run your business.',
    full_description: 'Strategic articles, email campaigns, and persuasive copy engineered to capture customer trust.',
    price: '₹9,999',
    discount_price: '₹15,999',
    features: [
      'High-Intent SEO Blog Posts & Pillar Articles',
      'High-Conversion Landing Page Copywriting',
      'Automated Email Drip Sequences',
      'Social Media Captions & Hook Formulas',
      'Press Releases & Company Announcements'
    ],
    image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    icon: 'TrendingUp',
    status: 'published',
    display_order: 3,
    meta_title: 'Content Marketing & SEO Copywriting | XGRO',
    meta_description: 'Strategic content writing that drives organic search rankings and qualified inbound inquiries.'
  },
  {
    id: 'srv-4',
    slug: 'seo',
    title: 'Search Engine Optimization (SEO)',
    category: 'Marketing',
    short_description: 'Get found by the people already searching for what you sell, in your city and beyond.',
    full_description: 'Comprehensive Local SEO, Technical Crawl Audits, Schema Markups, and high-authority link acquisition.',
    price: '₹12,499',
    discount_price: '₹18,999',
    features: [
      'Google Business Profile Optimization & Local Maps Pack',
      'In-Depth Competitor & Keyword Gap Analysis',
      'Technical Crawl Audits & Schema Markup',
      'Monthly Ranking & Traffic Reporting Dashboard',
      'High-Authority Niche Backlink Acquisition'
    ],
    image_url: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?q=80&w=800&auto=format&fit=crop',
    icon: 'TrendingUp',
    status: 'published',
    display_order: 4,
    meta_title: 'Search Engine Optimization (SEO) Agency | XGRO',
    meta_description: 'Dominate Google search results with XGRO’s proven technical and local SEO strategies.'
  },
  {
    id: 'srv-5',
    slug: 'ai-automation',
    title: 'AI Automation & Chatbots',
    category: 'AI',
    short_description: 'Let AI answer, qualify and follow up — so no enquiry is ever left on read.',
    full_description: 'Custom AI conversational agents for WhatsApp, automated CRM workflows, and intelligent auto-responders.',
    price: '₹19,999',
    discount_price: '₹29,999',
    features: [
      '24/7 AI WhatsApp Chatbot with Natural Language',
      'Automated Lead Qualification & Tagging in CRM',
      'Instant Appointment & Consultation Booking',
      'Automated Review Generation & Follow-Up Workflows',
      'Integration with Google Sheets, Slack & Webhooks'
    ],
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
    icon: 'Cpu',
    status: 'published',
    display_order: 5,
    meta_title: 'AI Automation & WhatsApp Chatbots | XGRO',
    meta_description: 'Automate lead qualification, appointment booking, and customer queries with custom AI agents.'
  },
  {
    id: 'srv-6',
    slug: 'digital-marketing',
    title: 'Performance Digital Marketing',
    category: 'Marketing',
    short_description: 'Paid campaigns built around cost per lead, not vanity impressions.',
    full_description: 'Data-driven Meta and Google Search Ads campaigns focused on minimizing cost per qualified customer.',
    price: '₹14,999',
    discount_price: '₹22,999',
    features: [
      'Google Search & High-Intent Display Campaigns',
      'Meta (Instagram & Facebook) Retargeting Funnels',
      'Custom Conversion Tracking & Pixel Setup',
      'A/B Creative & Headline Split-Testing',
      'Weekly Ad Spend ROI & Lead Quality Reports'
    ],
    image_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=800&auto=format&fit=crop',
    icon: 'TrendingUp',
    status: 'published',
    display_order: 6,
    meta_title: 'Performance Paid Ads & Lead Gen | XGRO',
    meta_description: 'Turn ad spend into measurable revenue with XGRO performance marketing.'
  },
  {
    id: 'srv-7',
    slug: 'branding',
    title: 'Branding & Identity System',
    category: 'Creative',
    short_description: 'A identity system that lets you charge what you are actually worth.',
    full_description: 'Complete brand guidelines, mood boards, logo packages, typography suites, and tone-of-voice playbooks.',
    price: '₹18,999',
    discount_price: '₹28,999',
    features: [
      'Comprehensive Brand Guidelines & Stylebook',
      'Primary, Secondary & Submark Logo Vectors',
      'Tailored Color Palettes & Typography Hierarchy',
      'Social Media Brand Assets & Profile Kits',
      'Stationery, Business Cards & Letterhead Templates'
    ],
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop',
    icon: 'Palette',
    status: 'published',
    display_order: 7,
    meta_title: 'Strategic Brand Identity & Design | XGRO',
    meta_description: 'Create an unmistakable corporate identity that commands authority in your industry.'
  }
];

export const initialPricingPlans: PricingPlanModel[] = [
  {
    id: 'plan-1',
    name: 'Starter',
    slug: 'starter',
    price: '₹14,999',
    discount_price: '₹24,999',
    tag: 'Students & new businesses',
    highlighted: false,
    features: [
      '5-page responsive modern website',
      'Mobile-first responsive design',
      'Basic on-page SEO & meta tags',
      'WhatsApp enquiry button & quick forms',
      'Fast 7-10 day delivery',
      'Free 1 month dedicated support'
    ],
    status: 'published',
    display_order: 1,
    cta_label: 'Get started',
    cta_link: '/contact'
  },
  {
    id: 'plan-2',
    name: 'Growth',
    slug: 'growth',
    price: '₹39,999',
    discount_price: '₹59,999',
    tag: 'Most popular for growing brands',
    highlighted: true,
    features: [
      'Up to 12 pages + dynamic CMS blog',
      'Custom UI design & brand polish',
      'Local SEO setup + Google Business Profile',
      'AI WhatsApp chatbot & lead capture integration',
      'Client management dashboard access',
      'Analytics & conversion tracking dashboard',
      '3 months dedicated priority support'
    ],
    status: 'published',
    display_order: 2,
    cta_label: 'Start Growth Plan',
    cta_link: '/contact'
  },
  {
    id: 'plan-3',
    name: 'Scale',
    slug: 'scale',
    price: 'Custom',
    discount_price: undefined,
    tag: 'Ecommerce & multi-location brands',
    highlighted: false,
    features: [
      'Ecommerce or custom web application platform',
      'Full brand identity system & guidelines',
      'Ongoing SEO + managed paid ad campaigns',
      'Full CRM & automated WhatsApp pipeline',
      'Monthly growth strategy & consulting calls',
      'Dedicated account manager & 99.9% uptime SLA'
    ],
    status: 'published',
    display_order: 3,
    cta_label: 'Request Custom Quote',
    cta_link: '/contact'
  }
];

export const initialClients: ClientModel[] = [
  {
    id: 'cli-rock',
    name: 'Rock Happy',
    email: 'rockhappy1798@gmail.com',
    phone: '+91 98765 01798',
    company_name: 'Rock Global Ventures',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: 'Cyber City, Gurugram, HR',
    status: 'active',
    selected_plan: 'Scale Growth Plan (Active Workspace)',
    services: ['website', 'ai_automation', 'seo', 'google_business'],
    billing_cycle: 'monthly',
    subscription_tier: 'Growth',
    retainer_amount: 39999,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'cli-vasu',
    name: 'Mr. Vasu Arora',
    email: 'vasu@softedit.in',
    phone: '+91 98112 34567',
    company_name: 'Soft Edit Cosmetics',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: 'Connaught Place, New Delhi, DL',
    status: 'active',
    selected_plan: 'Yearly Brand Retainer & E-Commerce Platform',
    services: ['website', 'graphic_design', 'video_editing', 'google_business', 'seo'],
    billing_cycle: 'yearly',
    subscription_tier: 'Premium Enterprise',
    retainer_amount: 14000,
    created_at: '2026-01-15T09:00:00Z',
  },
];

export const initialTeamMembers: TeamMemberModel[] = [
  {
    id: 'team-admin-1',
    name: 'Prashant Bajak',
    email: 'bajakprashant1998@gmail.com',
    phone: '+91 63953 19725',
    role: 'admin',
    department: 'Super Admin & Agency Director',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'team-1',
    name: 'Bhautik Chauhan',
    email: 'bhautik@xgro.in',
    phone: '+91 63953 19725',
    role: 'admin',
    department: 'Executive Leadership',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'team-pooran',
    name: 'Pooran Kushwah',
    email: 'pooran@xgro.in',
    phone: '+91 98765 43210',
    role: 'developer',
    department: 'WordPress Development',
    avatar_url: '/team/pooran_kushwah.jpeg',
    status: 'active'
  },
  {
    id: 'team-neha',
    name: 'Neha Singh',
    email: 'neha@xgro.in',
    phone: '+91 98765 43211',
    role: 'marketer',
    department: 'Content & Copywriting',
    avatar_url: '/team/neha_singh.jpg',
    status: 'active'
  },
  {
    id: 'team-sachin',
    name: 'Sachin Yadav',
    email: 'sachin@xgro.in',
    phone: '+91 98765 43212',
    role: 'marketer',
    department: 'SEO & Digital Marketing',
    avatar_url: '/team/sachin_yadav.jpg',
    status: 'active'
  }
];

export const initialProjects: ProjectModel[] = [
  {
    id: 'proj-rock',
    project_name: 'Rock Global — Next.js Growth Platform & AI Suite',
    client_id: 'cli-rock',
    service_id: 'srv-1',
    service_name: 'Website Development & AI Automation',
    start_date: '2026-02-15',
    expected_completion_date: '2026-03-30',
    project_value: 65000,
    assigned_manager_id: 'team-admin-1',
    assigned_employee_ids: ['team-1'],
    status: 'development',
    progress_percentage: 75,
    description: 'High-performance Next.js web application with dynamic CMS, AI WhatsApp support automation, local SEO package, and client analytics dashboard.',
    created_at: '2026-02-15T09:00:00Z',
    milestones: [
      {
        id: 'ms-r1',
        project_id: 'proj-rock',
        title: 'Requirement Blueprint & Technical Architecture',
        description: 'Approved brand asset kit, UX wireframes, and database schema specification.',
        status: 'completed',
        order_index: 1,
        completed_at: '2026-02-18T15:00:00Z'
      },
      {
        id: 'ms-r2',
        project_id: 'proj-rock',
        title: 'High-Fidelity UI/UX & Responsive Prototype',
        description: 'Custom Figma designs with dark mode, glassmorphic accents, and conversion layout.',
        status: 'completed',
        order_index: 2,
        completed_at: '2026-02-26T17:30:00Z'
      },
      {
        id: 'ms-r3',
        project_id: 'proj-rock',
        title: 'Next.js Frontend & 24/7 AI WhatsApp Agent',
        description: 'Dynamic services catalog, appointment booking, and WhatsApp AI bot integration.',
        status: 'in_progress',
        order_index: 3
      },
      {
        id: 'ms-r4',
        project_id: 'proj-rock',
        title: 'Performance Audits, SEO & Live Production Launch',
        description: '100% Core Web Vitals score, Google Analytics 4 tracking, and custom domain setup.',
        status: 'pending',
        order_index: 4
      }
    ],
    tasks: [
      {
        id: 'task-r1',
        project_id: 'proj-rock',
        title: 'Finalize WhatsApp AI Auto-Responder Prompts',
        assigned_to: 'team-1',
        status: 'in_progress',
        priority: 'high',
        due_date: '2026-03-12'
      },
      {
        id: 'task-r2',
        project_id: 'proj-rock',
        title: 'Configure Google Maps & Local Schema Markups',
        assigned_to: 'team-admin-1',
        status: 'todo',
        priority: 'medium',
        due_date: '2026-03-16'
      }
    ],
    updates: [
      {
        id: 'upd-r1',
        project_id: 'proj-rock',
        author_name: 'Prashant Bajak',
        author_role: 'Super Admin & Lead Engineer',
        title: 'Milestone 2 Completed: High-Fidelity UI Approved',
        message: 'Figma interactive prototype approved by Rock Global. Core Next.js development and AI WhatsApp bot integration have commenced.',
        progress_percent: 75,
        is_visible_to_client: true,
        created_at: '2026-02-28T14:00:00Z'
      }
    ],
    invoices: [
      {
        id: 'inv-r1',
        project_id: 'proj-rock',
        client_id: 'cli-rock',
        type: 'invoice',
        title: 'Milestone Phase 1 & 2 Invoice',
        amount: 32500,
        status: 'paid',
        issue_date: '2026-02-20',
        due_date: '2026-03-05',
        notes: '50% initial kickoff and prototype delivery advance — received with thanks.'
      }
    ]
  }
];

export const initialNotifications: NotificationModel[] = [
  {
    id: 'notif-r1',
    client_id: 'cli-rock',
    project_id: 'proj-rock',
    title: 'Milestone 2 Completed: High-Fidelity UI Approved',
    message: 'Figma interactive prototype approved by Rock Global. Core Next.js development and AI WhatsApp bot integration have commenced.',
    link: '/client',
    is_read: false,
    created_at: '2026-02-28T14:00:00Z'
  }
];

export const initialTestimonials: TestimonialModel[] = [
  {
    id: 'test-1',
    quote: 'We had a website before. It just sat there. XGRO rebuilt it around enquiries and now our front desk actually gets calls from Google every day.',
    name: 'Dr. Alok Verma',
    org: 'ABC Super Speciality Hospital, Moradabad',
    rating: 5,
    status: 'published',
    display_order: 1
  },
  {
    id: 'test-2',
    quote: 'The WhatsApp automation answers prospective clients even at 11 PM. That alone paid for the project in the first month itself.',
    name: 'Vikram Singhania',
    org: 'Bio90 Wellness',
    rating: 5,
    status: 'published',
    display_order: 2
  },
  {
    id: 'test-3',
    quote: 'Clear pricing, zero jargon, and they picked up the phone every single time. That is extraordinarily rare with digital agencies.',
    name: 'Neha Kapoor',
    org: 'Metrocity Salon & Spa',
    rating: 5,
    status: 'published',
    display_order: 3
  },
  {
    id: 'test-4',
    quote: 'Our brand finally looks like the quality we sell. Customers notice it before we say a single word.',
    name: 'Suresh Agarwal',
    org: 'SP Jewellers',
    rating: 5,
    status: 'published',
    display_order: 4
  }
];

export const initialFaqs: FaqModel[] = [
  {
    id: 'faq-1',
    question: 'How much does a website from XGRO cost?',
    answer: 'Most business websites land between ₹14,999 and ₹39,999 depending on pages, design depth, and integrations. Ecommerce and custom platforms are quoted after a discovery call. You always get a fixed written price before work starts.',
    category: 'Pricing',
    status: 'published',
    display_order: 1
  },
  {
    id: 'faq-2',
    question: 'How long does a project take?',
    answer: 'A starter website usually goes live in 7–10 working days. A full growth build with branding, SEO, and automation typically takes 3–4 weeks.',
    category: 'Timeline',
    status: 'published',
    display_order: 2
  },
  {
    id: 'faq-3',
    question: 'Do you work with businesses outside Moradabad?',
    answer: 'Yes. Our office is in MDA, Moradabad, and we work with clients across Uttar Pradesh, Delhi NCR, Rajasthan, Uttarakhand, and the USA. Everything can be handled seamlessly over call, WhatsApp, and video.',
    category: 'General',
    status: 'published',
    display_order: 3
  },
  {
    id: 'faq-4',
    question: 'What if I already have a website?',
    answer: 'We audit it first. Sometimes a redesign is the right call; sometimes speed, SEO, and lead flow fixes get you further for less. We will tell you honestly which one you need.',
    category: 'Services',
    status: 'published',
    display_order: 4
  },
  {
    id: 'faq-5',
    question: 'Will I own everything after the project?',
    answer: 'Completely. Domain, hosting, code, design files, and all accounts are handed to you with full ownership. No lock-in and no hostage situations.',
    category: 'Ownership',
    status: 'published',
    display_order: 5
  },
  {
    id: 'faq-6',
    question: 'Do you handle ongoing marketing too?',
    answer: 'Yes — SEO, Google and Meta ads, social content, and AI automation can run as a monthly engagement after launch.',
    category: 'Marketing',
    status: 'published',
    display_order: 6
  }
];

export const initialTrustedLogos: TrustedLogoModel[] = [
  {
    id: 'brand-1',
    name: 'Minds Eye',
    note: 'Education & Learning',
    icon: 'GraduationCap',
    logo_url: '/trustedByLogos/Minds eye.png',
    status: 'published',
    display_order: 1,
  },
  {
    id: 'brand-2',
    name: 'Bio90',
    note: 'Wellness & Health',
    icon: 'Activity',
    logo_url: '/trustedByLogos/bio90_logo-removebg-preview.png',
    status: 'published',
    display_order: 2,
  },
  {
    id: 'brand-3',
    name: 'Metrocity Salon',
    note: 'Salon & Beauty',
    icon: 'Gem',
    logo_url: '/trustedByLogos/Metrocity Salon.png',
    status: 'published',
    display_order: 3,
  },
  {
    id: 'brand-4',
    name: 'Iconic',
    note: 'Lifestyle & Apparel',
    icon: 'Sparkles',
    logo_url: '/trustedByLogos/ICONIC LOGO.png',
    status: 'published',
    display_order: 4,
  },
  {
    id: 'brand-5',
    name: 'SP Jewellers',
    note: 'Luxury Retail',
    icon: 'Gem',
    logo_url: '/trustedByLogos/sp.png',
    status: 'published',
    display_order: 5,
  },
  {
    id: 'brand-6',
    name: 'Central Boutique Hotel',
    note: 'Hospitality · Moradabad',
    icon: 'Hotel',
    logo_url: '/trustedByLogos/IMG_4188 (1).PNG',
    status: 'published',
    display_order: 6,
  },
  {
    id: 'brand-7',
    name: 'Ramanujan Classes',
    note: 'Coaching & EdTech',
    icon: 'BookOpen',
    status: 'published',
    display_order: 7,
  },
  {
    id: 'brand-8',
    name: 'Maths Mind',
    note: 'Competitive Exams',
    icon: 'Brain',
    status: 'published',
    display_order: 8,
  },
  {
    id: 'brand-9',
    name: 'Highway Yatra',
    note: 'Travel & Tours',
    icon: 'Compass',
    status: 'published',
    display_order: 9,
  },
  {
    id: 'brand-10',
    name: 'Moradabad Handicrafts',
    note: 'Global Export',
    icon: 'Globe',
    status: 'published',
    display_order: 10,
  },
  {
    id: 'brand-11',
    name: 'Apex Diagnostics',
    note: 'Healthcare',
    icon: 'Building2',
    status: 'published',
    display_order: 11,
  },
  {
    id: 'brand-12',
    name: 'SilverOak Legal',
    note: 'Corporate Law',
    icon: 'ShieldCheck',
    status: 'published',
    display_order: 12,
  },
];

