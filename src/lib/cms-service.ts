import {
  ServiceModel,
  PricingPlanModel,
  TestimonialModel,
  FaqModel,
  ProjectModel,
  ClientModel,
  TeamMemberModel,
  TrustedLogoModel,
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

