export type ResourceCategory =
  | "All"
  | "AI Prompts"
  | "Canva Templates"
  | "PDF Guides"
  | "Free Tools"
  | "Useful Links"
  | "Checklists"
  | "Marketing Resources"
  | "Website Resources";

export type ResourceType = "prompt" | "canva" | "pdf" | "tool" | "link" | "checklist";

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: Exclude<ResourceCategory, "All">;
  type: ResourceType;
  fileFormat: string;
  fileSize?: string;
  downloadUrl?: string;
  linkUrl?: string;
  promptContent?: string;
  dateAdded: string;
  downloadCount: number;
  featured?: boolean;
  gradient: string;
  tags: string[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "All",
  "AI Prompts",
  "Canva Templates",
  "PDF Guides",
  "Free Tools",
  "Useful Links",
  "Checklists",
  "Marketing Resources",
  "Website Resources",
];

export const initialResources: ResourceItem[] = [
  {
    id: "prompt-meta-ads-headline",
    title: "50+ High-Converting Meta & Google Ads Headline Prompts",
    description:
      "A curated collection of ChatGPT prompts to write irresistible ad headlines, hooks, and call-to-actions for any product or local business.",
    category: "AI Prompts",
    type: "prompt",
    fileFormat: "AI Prompt Pack",
    fileSize: "Instant Copy",
    promptContent: `Act as a senior performance direct-response copywriter. I am selling [PRODUCT/SERVICE NAME] targeting [TARGET AUDIENCE]. Generate 15 attention-grabbing ad headlines using the following proven formulas: 1) Curious Hook, 2) Direct Pain Point, 3) Social Proof / Result, 4) Urgent Offer. Include emojis and 3 character variations for Meta Ads.`,
    dateAdded: "Aug 12, 2026",
    downloadCount: 2480,
    featured: true,
    gradient: "from-purple-600 via-pink-600 to-rose-600",
    tags: ["ChatGPT", "Meta Ads", "Copywriting", "Prompts"],
  },
  {
    id: "canva-instagram-post-kit",
    title: "Local Business Instagram Post & Story Canva Template Kit",
    description:
      "25 customizable Canva templates designed for shops, doctors, cafes, and institutes. Easily edit colors, photos, and text in Canva free version.",
    category: "Canva Templates",
    type: "canva",
    fileFormat: "Canva Template",
    fileSize: "25 Designs",
    linkUrl: "https://www.canva.com",
    dateAdded: "Aug 10, 2026",
    downloadCount: 1890,
    featured: true,
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    tags: ["Canva", "Instagram", "Social Media", "Templates"],
  },
  {
    id: "pdf-official-rate-card",
    title: "Official XGRO 2026 Agency Price List & Service Rate Card",
    description:
      "Complete itemized package rates, hourly costs, and retainer tiers for Website Development, SEO, Google & Meta Ads, and AI Automation.",
    category: "PDF Guides",
    type: "pdf",
    fileFormat: "PDF Document",
    fileSize: "1.4 MB",
    downloadUrl: "/resources",
    dateAdded: "Aug 12, 2026",
    downloadCount: 3120,
    featured: true,
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    tags: ["Price List", "Quotation", "Agency", "Rates"],
  },
  {
    id: "tool-cost-calculator",
    title: "AI Website & App Cost Estimator & Quote Generator",
    description:
      "Interactive estimation tool to calculate website development budget in 30 seconds with downloadable PDF quote & discount code.",
    category: "Free Tools",
    type: "tool",
    fileFormat: "Interactive Web Tool",
    fileSize: "Instant",
    linkUrl: "/pricing",
    dateAdded: "Aug 11, 2026",
    downloadCount: 4210,
    featured: true,
    gradient: "from-amber-500 via-orange-600 to-red-600",
    tags: ["Calculator", "Tool", "Estimator", "Pricing"],
  },
  {
    id: "checklist-website-redesign-35",
    title: "35-Point Website Redesign & Conversion Audit Checklist",
    description:
      "Complete audit framework to evaluate mobile page speed, local SEO meta tags, lead capture triggers, and accessibility compliance.",
    category: "Checklists",
    type: "checklist",
    fileFormat: "PDF Checklist",
    fileSize: "950 KB",
    downloadUrl: "/resources",
    dateAdded: "Aug 08, 2026",
    downloadCount: 1540,
    gradient: "from-blue-600 via-indigo-600 to-violet-700",
    tags: ["Checklist", "SEO", "Web Design", "Audit"],
  },
  {
    id: "prompt-midjourney-photography",
    title: "Midjourney AI Product Photography & Background Prompts",
    description:
      "Copy-paste prompts for generating studio-quality product backgrounds, luxury lighting, and e-commerce model photography using AI.",
    category: "AI Prompts",
    type: "prompt",
    fileFormat: "Midjourney Prompts",
    fileSize: "Instant Copy",
    promptContent: `Commercial studio product photograph of [PRODUCT ITEM] placed on a smooth white marble pedestal, soft natural morning window light, subtle reflection, 8k resolution, photorealistic, shot on 85mm lens, f/2.8 aperture --ar 4:5 --v 6.0`,
    dateAdded: "Aug 07, 2026",
    downloadCount: 1980,
    gradient: "from-fuchsia-600 via-purple-600 to-blue-600",
    tags: ["Midjourney", "AI Images", "Product Photo", "Prompts"],
  },
  {
    id: "marketing-meta-persona",
    title: "Meta Ads Target Audience Persona & Strategy Sheet",
    description:
      "Fill-in-the-blank customer persona template to map out customer demographics, pain points, objections, and creative angles.",
    category: "Marketing Resources",
    type: "pdf",
    fileFormat: "PDF & Sheet",
    fileSize: "1.1 MB",
    downloadUrl: "/resources",
    dateAdded: "Aug 05, 2026",
    downloadCount: 1120,
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    tags: ["Marketing", "Meta Ads", "Audience", "Strategy"],
  },
  {
    id: "pdf-whatsapp-lead-playbook",
    title: "AI WhatsApp Automation & 24/7 Lead Capture Playbook",
    description:
      "Step-by-step blueprint on setting up automated WhatsApp bots that answer FAQs, capture lead numbers, and book appointments 24/7.",
    category: "PDF Guides",
    type: "pdf",
    fileFormat: "PDF Playbook",
    fileSize: "2.8 MB",
    downloadUrl: "/resources",
    dateAdded: "Aug 04, 2026",
    downloadCount: 2890,
    featured: true,
    gradient: "from-emerald-600 via-teal-700 to-slate-900",
    tags: ["WhatsApp", "Automation", "AI Bot", "Leads"],
  },
  {
    id: "web-sub-2-sec-optimization",
    title: "Next.js & Web Performance Sub-2 Second Load Guide",
    description:
      "Technical blueprint covering Next.js image optimization, font preloading, CDN caching, and Core Web Vitals score maxing.",
    category: "Website Resources",
    type: "pdf",
    fileFormat: "PDF Guide",
    fileSize: "1.6 MB",
    downloadUrl: "/resources",
    dateAdded: "Aug 02, 2026",
    downloadCount: 940,
    gradient: "from-slate-700 via-slate-800 to-slate-950",
    tags: ["Next.js", "Performance", "Web Speed", "SEO"],
  },
  {
    id: "link-top-10-free-ai-tools",
    title: "Top 10 Free AI Marketing & Content Tools Directory 2026",
    description:
      "Curated list of the best free AI platforms for voiceovers, background removal, copywriting, video editing, and logo creation.",
    category: "Useful Links",
    type: "link",
    fileFormat: "Web Links",
    fileSize: "Direct Access",
    linkUrl: "https://xgro.in/blog",
    dateAdded: "Jul 30, 2026",
    downloadCount: 3410,
    gradient: "from-violet-600 via-purple-700 to-pink-600",
    tags: ["AI Tools", "Free Links", "Marketing", "Directory"],
  },
  {
    id: "canva-agency-proposal-deck",
    title: "Agency Client Proposal & Pitch Deck Canva Presentation",
    description:
      "15-slide high-impact agency presentation deck for pitching websites, branding, and digital marketing services to clients.",
    category: "Canva Templates",
    type: "canva",
    fileFormat: "Canva Deck",
    fileSize: "15 Slides",
    linkUrl: "https://www.canva.com",
    dateAdded: "Jul 28, 2026",
    downloadCount: 1670,
    gradient: "from-rose-500 via-pink-600 to-purple-700",
    tags: ["Canva", "Proposal", "Pitch Deck", "Agency"],
  },
  {
    id: "checklist-google-maps-seo",
    title: "Google Business Profile & Maps 10-Step Ranking Checklist",
    description:
      "Actionable checklist to optimize your Google Maps listing, align NAP consistency, and rank #1 for local searches in your city.",
    category: "Checklists",
    type: "checklist",
    fileFormat: "PDF Checklist",
    fileSize: "800 KB",
    downloadUrl: "/resources",
    dateAdded: "Jul 25, 2026",
    downloadCount: 2210,
    gradient: "from-amber-600 via-orange-600 to-red-700",
    tags: ["Local SEO", "Google Maps", "Checklist"],
  },
];
