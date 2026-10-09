import {
  ServiceModel,
  PricingPlanModel,
  TestimonialModel,
  FaqModel,
  ProjectModel,
  ClientModel,
  TeamMemberModel,
  TrustedLogoModel,
  HeroBannerModel,
} from './supabase/types';

import {
  initialServices,
  initialPricingPlans,
  initialTestimonials,
  initialFaqs,
  initialProjects,
  initialClients,
  initialTeamMembers,
  initialTrustedLogos,
  initialHeroBanners,
} from './seed-data';

import {
  getServices,
  getPricingPlans,
  getTestimonials,
  getFaqs,
  getProjects,
  getClients,
  getTeamMembers,
  getTrustedLogos,
  getHeroBanners,
  getActiveHeroBanner,
} from './db';

// Safely fetch published services for SSR and Client pages
export async function getPublishedServices(): Promise<ServiceModel[]> {
  if (typeof window === 'undefined') {
    return initialServices.filter((s) => s.status === 'published');
  }
  const all = await getServices();
  return all.filter((s) => s.status === 'published');
}

// Safely fetch published pricing plans for SSR and Client pages
export async function getPublishedPricingPlans(): Promise<PricingPlanModel[]> {
  if (typeof window === 'undefined') {
    return initialPricingPlans.filter((p) => p.status === 'published');
  }
  const all = await getPricingPlans();
  return all.filter((p) => p.status === 'published');
}

// Safely fetch testimonials
export async function getPublishedTestimonials(): Promise<TestimonialModel[]> {
  if (typeof window === 'undefined') {
    return initialTestimonials.filter((t) => t.status === 'published');
  }
  const all = await getTestimonials();
  return all.filter((t) => t.status === 'published');
}

// Safely fetch FAQs
export async function getPublishedFaqs(): Promise<FaqModel[]> {
  if (typeof window === 'undefined') {
    return initialFaqs.filter((f) => f.status === 'published');
  }
  const all = await getFaqs();
  return all.filter((f) => f.status === 'published');
}

// Safely fetch Projects
export async function getAllProjects(): Promise<ProjectModel[]> {
  if (typeof window === 'undefined') {
    return initialProjects;
  }
  return await getProjects();
}

// Safely fetch Clients
export async function getAllClients(): Promise<ClientModel[]> {
  if (typeof window === 'undefined') {
    return initialClients;
  }
  return await getClients();
}

// Safely fetch Team Members
export async function getAllTeamMembers(): Promise<TeamMemberModel[]> {
  if (typeof window === 'undefined') {
    return initialTeamMembers;
  }
  return await getTeamMembers();
}

// Safely fetch published Trusted Logos
export async function getPublishedTrustedLogos(): Promise<TrustedLogoModel[]> {
  if (typeof window === 'undefined') {
    return initialTrustedLogos.filter((l) => l.status === 'published');
  }
  const all = await getTrustedLogos();
  return all.filter((l) => l.status === 'published');
}

// Safely fetch Active Hero Banner
export async function getActiveHeroBannerForSite(): Promise<HeroBannerModel> {
  if (typeof window === 'undefined') {
    const { getServerActiveHeroBanner } = await import('@/lib/server-hero-banners');
    return await getServerActiveHeroBanner();
  }
  return await getActiveHeroBanner();
}

// Safely fetch all Hero Banners
export async function getAllHeroBannersForSite(): Promise<HeroBannerModel[]> {
  if (typeof window === 'undefined') {
    return initialHeroBanners;
  }
  return await getHeroBanners();
}


