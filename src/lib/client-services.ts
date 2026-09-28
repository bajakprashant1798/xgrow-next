export interface AgencyServiceDefinition {
  id: string;
  name: string;
  category: string;
  shortName: string;
  description: string;
  badgeClass: string;
  bgGradient: string;
  iconName: string;
  popularRetainer?: boolean;
}

export const AVAILABLE_AGENCY_SERVICES: AgencyServiceDefinition[] = [
  {
    id: 'website',
    name: 'Website Development',
    shortName: 'Website & Web App',
    category: 'Engineering & UI',
    description: 'High-speed Next.js / WordPress platforms, custom web apps, landing pages & ecommerce.',
    badgeClass: 'border-cyan/40 text-cyan bg-cyan/10',
    bgGradient: 'from-cyan/15 to-blue-500/10 border-cyan/30',
    iconName: 'Globe',
    popularRetainer: true,
  },
  {
    id: 'graphic_design',
    name: 'Graphic Design & Branding',
    shortName: 'Graphic Design',
    category: 'Brand Identity',
    description: 'Logo design, brand book, social creatives, UI/UX mockups, pitch decks & print media.',
    badgeClass: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    bgGradient: 'from-purple-500/15 to-pink-500/10 border-purple-500/30',
    iconName: 'Palette',
    popularRetainer: true,
  },
  {
    id: 'ai_automation',
    name: 'AI Automation & Agents',
    shortName: 'AI Automation',
    category: 'AI & Workflows',
    description: 'Custom AI chatbots, lead qualification workflows, automated CRM sync & voice agents.',
    badgeClass: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    bgGradient: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30',
    iconName: 'Bot',
    popularRetainer: true,
  },
  {
    id: 'google_business',
    name: 'Google Business Profile (GBP)',
    shortName: 'Google Business / GBP',
    category: 'Local Search',
    description: 'GMB optimization, Google 3-Pack ranking, review management & local buyer visibility.',
    badgeClass: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    bgGradient: 'from-amber-500/15 to-yellow-500/10 border-amber-500/30',
    iconName: 'MapPin',
    popularRetainer: true,
  },
  {
    id: 'seo',
    name: 'SEO & Organic Growth',
    shortName: 'SEO & Rankings',
    category: 'Search Marketing',
    description: 'High-intent keyword rankings, technical SEO audits, backlink outreach & organic traffic.',
    badgeClass: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    bgGradient: 'from-blue-500/15 to-indigo-500/10 border-blue-500/30',
    iconName: 'TrendingUp',
    popularRetainer: true,
  },
  {
    id: 'video_editing',
    name: 'Video Editing & Reels',
    shortName: 'Video & Reels',
    category: 'Creative Production',
    description: 'Viral Instagram Reels, YouTube Shorts, podcast clips, promo commercials & video ads.',
    badgeClass: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    bgGradient: 'from-rose-500/15 to-red-500/10 border-rose-500/30',
    iconName: 'Video',
    popularRetainer: true,
  },
  {
    id: 'social_media',
    name: 'Social Media Marketing',
    shortName: 'Social Media',
    category: 'Social Growth',
    description: 'Full-funnel organic social management, content calendars, carousel posts & engagement.',
    badgeClass: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
    bgGradient: 'from-pink-500/15 to-rose-500/10 border-pink-500/30',
    iconName: 'Share2',
    popularRetainer: true,
  },
  {
    id: 'paid_ads',
    name: 'Performance Paid Ads',
    shortName: 'Paid Ads (Meta/Google)',
    category: 'Paid Acquisition',
    description: 'High-ROI Meta (FB/IG) & Google Search Ads campaigns optimized for lead generation.',
    badgeClass: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    bgGradient: 'from-indigo-500/15 to-violet-500/10 border-indigo-500/30',
    iconName: 'Target',
    popularRetainer: false,
  },
];

export const BILLING_CYCLES = [
  {
    id: 'monthly',
    label: 'Monthly Retainer',
    badge: 'Monthly Retainer',
    tagClass: 'bg-cyan/15 text-cyan border-cyan/30',
    desc: 'Billed recurring each month with continuous monthly deliverables & priority support.',
  },
  {
    id: 'yearly',
    label: 'Yearly Plan (Annual Premium)',
    badge: 'Yearly Premium Partner',
    tagClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'Annual retained commitment with dedicated team allocation and 20% cost advantage.',
  },
  {
    id: 'one_time',
    label: 'One-Time Project Contract',
    badge: 'Fixed Scope Project',
    tagClass: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
    desc: 'Milestone-based one-time deliverable agreement.',
  },
  {
    id: 'quarterly',
    label: 'Quarterly Retainer (3 Months)',
    badge: 'Quarterly Retainer',
    tagClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    desc: '3-month cyclical retainer for campaigns and agile roadmaps.',
  },
];

export function getServiceDefinition(serviceId: string): AgencyServiceDefinition {
  const found = AVAILABLE_AGENCY_SERVICES.find(
    (s) => s.id.toLowerCase() === serviceId.toLowerCase() || serviceId.toLowerCase().includes(s.id.toLowerCase())
  );
  if (found) return found;

  return {
    id: serviceId,
    name: serviceId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    shortName: serviceId.replace(/_/g, ' '),
    category: 'Agency Service',
    description: 'Custom tailored digital growth service deliverables.',
    badgeClass: 'border-cyan/40 text-cyan bg-cyan/10',
    bgGradient: 'from-cyan/10 to-transparent border-cyan/20',
    iconName: 'Globe',
  };
}

export function getBillingCycleDefinition(cycleId?: string) {
  return (
    BILLING_CYCLES.find((b) => b.id === cycleId) || {
      id: cycleId || 'monthly',
      label: cycleId === 'yearly' ? 'Yearly Plan' : cycleId === 'one_time' ? 'One-Time Project' : 'Monthly Retainer',
      badge: cycleId === 'yearly' ? 'Yearly Partner' : cycleId === 'one_time' ? 'One-Time Deliverable' : 'Monthly Retainer',
      tagClass: 'bg-cyan/15 text-cyan border-cyan/30',
      desc: 'Active agency service agreement.',
    }
  );
}

export const PLAN_SERVICE_PRESETS: Record<
  string,
  {
    name: string;
    services: string[];
    billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'quarterly';
    tier: 'Standard' | 'Growth' | 'Premium Enterprise';
    defaultAmount: number;
    description: string;
  }
> = {
  starter: {
    name: 'Starter Launch Package (₹14,999)',
    services: ['website', 'seo'],
    billing_cycle: 'one_time',
    tier: 'Standard',
    defaultAmount: 14999,
    description: '5-page responsive website with basic on-page SEO setup.',
  },
  growth: {
    name: 'Growth Engine Retainer (₹39,999/mo)',
    services: ['website', 'seo', 'graphic_design', 'google_business', 'ai_automation'],
    billing_cycle: 'monthly',
    tier: 'Growth',
    defaultAmount: 39999,
    description: 'Full CMS web platform, UI branding, local Google Business ranking & AI lead capture.',
  },
  scale: {
    name: 'Scale Enterprise Retainer (₹79,999/mo)',
    services: ['website', 'graphic_design', 'ai_automation', 'seo', 'video_editing', 'social_media', 'paid_ads'],
    billing_cycle: 'monthly',
    tier: 'Premium Enterprise',
    defaultAmount: 79999,
    description: 'End-to-end full stack digital agency deliverables with paid acquisition and video reels.',
  },
  annual_brand: {
    name: 'Annual Brand Partner (Yearly Contract)',
    services: ['website', 'graphic_design', 'video_editing', 'google_business', 'seo', 'ai_automation'],
    billing_cycle: 'yearly',
    tier: 'Premium Enterprise',
    defaultAmount: 140000,
    description: 'Yearly committed partner retainers with dedicated staff allocation and priority turnaround.',
  },
};

export function getServicesForPlan(planName?: string): string[] {
  if (!planName) return PLAN_SERVICE_PRESETS.growth.services;
  const lower = planName.toLowerCase();
  if (lower.includes('starter') || lower.includes('basic') || lower.includes('14,999')) {
    return PLAN_SERVICE_PRESETS.starter.services;
  }
  if (lower.includes('annual') || lower.includes('yearly') || lower.includes('brand partner')) {
    return PLAN_SERVICE_PRESETS.annual_brand.services;
  }
  if (lower.includes('scale') || lower.includes('enterprise') || lower.includes('79,999')) {
    return PLAN_SERVICE_PRESETS.scale.services;
  }
  if (lower.includes('growth') || lower.includes('39,999') || lower.includes('cosmetics') || lower.includes('platform')) {
    return PLAN_SERVICE_PRESETS.growth.services;
  }
  return PLAN_SERVICE_PRESETS.growth.services;
}
