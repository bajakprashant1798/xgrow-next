export const site = {
  name: "XGRO",
  tagline: "Your Digital Growth Partner",
  positioning: "Premium Digital Growth Agency",
  promise: "We don't just build websites — we build businesses.",
  description:
    "XGRO is a modern digital agency helping businesses grow through AI-powered solutions, websites, branding, digital marketing, automation, and creative design.",
  phone: "6395319725",
  phoneDisplay: "+91 63953 19725",
  email: "xgro.services@gmail.com",
  address: "MDA, Moradabad, Uttar Pradesh, India",
  hours: "Monday – Saturday, 10 AM – 7 PM",
  countries: "India & USA",
  whatsapp: "https://wa.me/916395319725?text=Hi%20XGRO%2C%20I%27d%20like%20to%20grow%20my%20business%20online.",
} as const;

export type Stat = { value: number; suffix: string; label: string };

export const stats: Stat[] = [
  { value: 1000, suffix: "+", label: "Projects Completed" },
  { value: 500, suffix: "+", label: "Happy Clients" },
  { value: 25, suffix: "+", label: "Industries Served" },
  { value: 5, suffix: "+", label: "Years Experience" },
];

export type Service = {
  slug: string;
  title: string;
  category: string;
  blurb: string;
  items: string[];
};

export const services: Service[] = [
  {
    slug: "website-development",
    title: "Website Development",
    category: "Web",
    blurb: "Fast, conversion-first websites that turn visitors into enquiries — not just pretty pages.",
    items: ["Business Websites", "Ecommerce", "Landing Pages", "Mobile Apps"],
  },
  {
    slug: "graphic-design",
    title: "Graphic Design",
    category: "Creative",
    blurb: "Scroll-stopping creatives and print work that make a small brand look established.",
    items: [
      "Social Media Creatives",
      "Posters",
      "Logos",
      "Brand Identity",
      "Packaging",
      "Notes & Question Papers for Schools and Coaching Centers",
    ],
  },
  {
    slug: "content-marketing",
    title: "Content Marketing",
    category: "Marketing",
    blurb: "Content that ranks, gets shared, and quietly sells while you run your business.",
    items: ["Blogs", "SEO Content", "Copywriting", "Social Media Content", "Email Marketing"],
  },
  {
    slug: "seo",
    title: "SEO",
    category: "Marketing",
    blurb: "Get found by the people already searching for what you sell, in your city and beyond.",
    items: ["Local SEO", "Technical SEO", "Keyword Research", "Content SEO"],
  },
  {
    slug: "ai-automation",
    title: "AI Automation",
    category: "AI",
    blurb: "Let AI answer, qualify and follow up — so no enquiry is ever left on read.",
    items: ["Chatbots", "CRM Automation", "Lead Automation", "WhatsApp Automation"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    category: "Marketing",
    blurb: "Paid campaigns built around cost per lead, not vanity impressions.",
    items: ["Google Ads", "Meta Ads", "Instagram Marketing", "Lead Generation", "Remarketing"],
  },
  {
    slug: "branding",
    title: "Branding",
    category: "Creative",
    blurb: "A identity system that lets you charge what you're actually worth.",
    items: ["Logo", "Brand Guidelines", "Visual Identity", "Packaging", "Mobile Apps"],
  },
];

export const serviceCategories = ["All", "Web", "Creative", "Marketing", "AI"] as const;

export const clients = [
  { name: "Central Boutique Hotel", note: "Hospitality · Moradabad", icon: "Hotel" },
  { name: "Minds Eye", note: "Education & Learning", icon: "GraduationCap" },
  { name: "Ramanujan Classes", note: "Coaching & EdTech", icon: "BookOpen" },
  { name: "Maths Mind", note: "Competitive Exams", icon: "Brain" },
  { name: "Highway Yatra", note: "Travel & Tours", icon: "Compass" },
  { name: "Bio90", note: "Wellness & Health", icon: "Activity" },
  { name: "SP Jewellers", note: "Luxury Retail", icon: "Gem" },
  { name: "Moradabad Handicrafts", note: "Global Export", icon: "Globe" },
  { name: "Apex Diagnostics", note: "Healthcare", icon: "Building2" },
  { name: "SilverOak Legal", note: "Corporate Law", icon: "ShieldCheck" },
];

export type CaseStudy = {
  slug: string;
  client: string;
  category: string;
  problem: string;
  solution: string;
  result: string;
  metric: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "central-boutique-hotel",
    client: "Central Boutique Hotel",
    category: "Website Projects",
    problem: "Bookings came only through OTAs, eating 18–22% commission on every room night.",
    solution: "A direct-booking website with local SEO for “hotel in Moradabad” and WhatsApp enquiry routing.",
    result: "Direct bookings became a third of monthly rooms within two seasons.",
    metric: "3.1x direct bookings",
  },
  {
    slug: "ramanujan-classes",
    client: "Ramanujan Classes",
    category: "Marketing Campaigns",
    problem: "Admission enquiries dropped off between poster season and the batch start date.",
    solution: "Meta lead ads plus a WhatsApp automation that answered fee and batch questions instantly.",
    result: "Cost per admission enquiry fell while the counsellor team stopped chasing cold numbers.",
    metric: "-62% cost per lead",
  },
  {
    slug: "sp-jewellers",
    client: "SP Jewellers",
    category: "Branding",
    problem: "A trusted local store looked twenty years older than its competitors online.",
    solution: "Full identity refresh, product photography direction and a festive campaign system.",
    result: "Walk-ins referencing Instagram became a regular part of daily footfall.",
    metric: "4.6x social reach",
  },
];

export const testimonials = [
  {
    quote:
      "We had a website before. It just sat there. XGRO rebuilt it around enquiries and now our front desk actually gets calls from Google.",
    name: "Owner",
    org: "Central Boutique Hotel, Moradabad",
  },
  {
    quote:
      "The WhatsApp automation answers parents at 11 PM. That alone paid for the project in the first admission cycle.",
    name: "Director",
    org: "Ramanujan Classes",
  },
  {
    quote:
      "Clear pricing, no jargon, and they picked up the phone every single time. That is rare with agencies.",
    name: "Founder",
    org: "Bio90",
  },
  {
    quote:
      "Our brand finally looks like the quality we sell. Customers notice it before we say a word.",
    name: "Partner",
    org: "SP Jewellers",
  },
];

export const processSteps = [
  {
    title: "Discovery call",
    body: "A free 30-minute conversation about your business, your customers and what growth actually means for you.",
  },
  {
    title: "Strategy & quote",
    body: "A written plan with scope, timeline and a fixed price. No hourly surprises, no hidden line items.",
  },
  {
    title: "Design & build",
    body: "You see work in progress every week. Feedback is welcome at every stage, not just at the end.",
  },
  {
    title: "Launch & automate",
    body: "We ship fast, connect analytics, WhatsApp and AI follow-up, and hand over full ownership.",
  },
  {
    title: "Grow & support",
    body: "Monthly reporting, SEO and campaign work — and a team that still answers when you call next year.",
  },
];

export const whyChoose = [
  {
    title: "AI built in, not bolted on",
    body: "Chatbots, lead scoring and WhatsApp follow-up are part of the build — so leads get answered in seconds.",
  },
  {
    title: "Agency quality, honest pricing",
    body: "Metro-level craft without metro-level invoices. You see the full cost before we start.",
  },
  {
    title: "Speed you can measure",
    body: "Sites that load under two seconds on mobile data, because that is where your customers are.",
  },
  {
    title: "Built for leads, not applause",
    body: "Every page has one job: move a visitor to a call, a form or a WhatsApp chat.",
  },
  {
    title: "Support that answers",
    body: "Mon–Sat, 10 AM to 7 PM, on phone and WhatsApp. Real people from Moradabad, serving India and the USA.",
  },
  {
    title: "One team, every skill",
    body: "Design, development, SEO, ads and AI under one roof. No coordinating four vendors.",
  },
];

export const pricingTiers = [
  {
    name: "Starter",
    price: "₹14,999",
    tag: "Students & new businesses",
    features: ["5-page responsive website", "Mobile-first design", "Basic on-page SEO", "WhatsApp enquiry button", "Free 1 month support"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹39,999",
    tag: "Most popular for local businesses",
    features: [
      "Up to 12 pages + blog",
      "Custom design & brand polish",
      "Local SEO setup + Google Business",
      "AI chatbot & lead capture",
      "Analytics dashboard",
      "3 months support",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    tag: "Ecommerce & multi-location brands",
    features: [
      "Ecommerce or custom platform",
      "Full brand identity system",
      "Ongoing SEO + paid campaigns",
      "CRM & WhatsApp automation",
      "Monthly growth reporting",
      "Dedicated account manager",
    ],
    highlighted: false,
  },
];

export const faqs = [
  {
    q: "How much does a website from XGRO cost?",
    a: "Most business websites land between ₹14,999 and ₹39,999 depending on pages, design depth and integrations. Ecommerce and custom platforms are quoted after a discovery call. You always get a fixed written price before work starts.",
  },
  {
    q: "How long does a project take?",
    a: "A starter website usually goes live in 7–10 working days. A full growth build with branding, SEO and automation typically takes 3–4 weeks.",
  },
  {
    q: "Do you work with businesses outside Moradabad?",
    a: "Yes. Our office is in MDA, Moradabad, and we work with clients across Uttar Pradesh, Delhi NCR, Rajasthan, Uttarakhand and the USA. Everything can be handled over call, WhatsApp and video.",
  },
  {
    q: "What if I already have a website?",
    a: "We audit it first. Sometimes a redesign is the right call; sometimes speed, SEO and lead flow fixes get you further for less. We will tell you honestly which one you need.",
  },
  {
    q: "Will I own everything after the project?",
    a: "Completely. Domain, hosting, code, design files and all accounts are handed to you. No lock-in and no hostage situations.",
  },
  {
    q: "Do you handle ongoing marketing too?",
    a: "Yes — SEO, Google and Meta ads, social content and AI automation can run as a monthly engagement after launch.",
  },
];

export const teamGroups = [
  {
    role: "Founder",
    people: ["Founder, XGRO"],
    body: "Sets strategy, sits in every discovery call, and personally signs off on scope and pricing.",
  },
  {
    role: "Designers",
    people: ["Brand Designer", "UI Designer", "Creative Designer"],
    body: "Identity, interface and campaign creative — the people who make a local business look national.",
  },
  {
    role: "Developers",
    people: ["Frontend Developer", "Full-stack Developer", "Ecommerce Developer"],
    body: "Ship fast, accessible builds that hold up on a 4G phone in a market street.",
  },
  {
    role: "SEO Experts",
    people: ["Technical SEO Lead", "Local SEO Specialist"],
    body: "Make sure the right people find you before they find your competitor.",
  },
  {
    role: "Marketing Team",
    people: ["Performance Marketer", "Content Strategist", "Social Media Manager"],
    body: "Run the campaigns and the calendar, measured on leads rather than likes.",
  },
  {
    role: "AI Specialists",
    people: ["Automation Engineer", "AI Solutions Lead"],
    body: "Build the chatbots, CRM flows and WhatsApp automations that follow up while you sleep.",
  },
];

export const values = ["Transparency", "Innovation", "Quality", "Speed", "Creativity", "Customer Success"];

export type PricingFeatureGroup = {
  groupName: string;
  features: {
    name: string;
    starter: boolean | string;
    growth: boolean | string;
    scale: boolean | string;
  }[];
};

export const pricingComparison: PricingFeatureGroup[] = [
  {
    groupName: "Design & Content",
    features: [
      { name: "Pages Included", starter: "Up to 5", growth: "Up to 12", scale: "Custom / Unlimited" },
      { name: "Responsive Layout", starter: true, growth: true, scale: true },
      { name: "Custom UI Design", starter: "Template Polish", growth: "Custom Design", scale: "Premium Bespoke" },
      { name: "Copywriting & Brand Voice", starter: "Provided by Client", growth: "XGRO Assisted", scale: "Full Professional" },
      { name: "Stock Media Curation", starter: true, growth: true, scale: true },
    ],
  },
  {
    groupName: "SEO & Growth",
    features: [
      { name: "On-Page SEO Setup", starter: "Basic", growth: "Advanced", scale: "Comprehensive" },
      { name: "Google Business Profile", starter: false, growth: true, scale: true },
      { name: "Local SEO Targeting", starter: false, growth: true, scale: true },
      { name: "Keywords Tracked", starter: "None", growth: "10 keywords", scale: "Unlimited keywords" },
      { name: "Monthly SEO Audit", starter: false, growth: false, scale: true },
    ],
  },
  {
    groupName: "AI & Automations",
    features: [
      { name: "WhatsApp Enquiry Route", starter: true, growth: true, scale: true },
      { name: "Scripted AI Chatbot", starter: false, growth: true, scale: true },
      { name: "CRM Lead Automation", starter: false, growth: "Basic (Email)", scale: "Full CRM Sync" },
      { name: "WhatsApp Automation Flow", starter: false, growth: false, scale: true },
      { name: "Custom AI Integrations", starter: false, growth: false, scale: true },
    ],
  },
  {
    groupName: "Support & Maintenance",
    features: [
      { name: "Free Support Period", starter: "1 Month", growth: "3 Months", scale: "Ongoing" },
      { name: "Monthly Reporting", starter: false, growth: true, scale: true },
      { name: "Speed & Performance Sweep", starter: true, growth: true, scale: true },
      { name: "Domain & Hosting Transfer", starter: true, growth: true, scale: true },
      { name: "Dedicated Account Manager", starter: false, growth: false, scale: true },
    ],
  },
];

export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
};

export const jobs: Job[] = [
  {
    id: "frontend-dev",
    title: "Frontend Developer (Next.js / React)",
    department: "Development",
    location: "Moradabad, UP (On-site / Hybrid)",
    type: "Full-Time",
    description: "Looking for a frontend developer skilled in building highly performance-optimized, clean Next.js/React applications with smooth micro-animations using Tailwind CSS.",
  },
  {
    id: "ui-ux-designer",
    title: "UI/UX & Brand Designer",
    department: "Design",
    location: "Moradabad, UP (On-site / Hybrid)",
    type: "Full-Time",
    description: "Create pixel-perfect, stunning visual identities, social media creatives, and mobile-first website interfaces that capture our clients' brand values.",
  },
  {
    id: "seo-analyst",
    title: "SEO & Content Marketer",
    department: "Marketing",
    location: "Remote / Hybrid",
    type: "Full-Time",
    description: "Drive traffic and rankings for local and national businesses. Manage keyword research, technical audits, content strategies, and Local SEO optimizations.",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  tags: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "integrate-whatsapp-automation-local-business",
    title: "How to Integrate WhatsApp Automation to Convert Leads 24/7",
    category: "AI",
    excerpt: "Learn how local shops, doctors, and institutes are using automated WhatsApp messages to follow up with inquiries instantly and secure bookings.",
    content: `<p>In today's fast-paced digital world, speed is everything. When a potential customer reaches out to a business, they expect a response almost instantly. If they don't get one, they move on to the next competitor. This is where WhatsApp automation changes the game, especially for local businesses like clinics, coaching centers, and retail shops.</p>
<h3>Why WhatsApp Automation?</h3>
<p>Unlike emails that sit unread or phone calls that get missed during busy hours, WhatsApp has an open rate of over 98%. Automating your replies means your business is 'always open' to answer basic questions, share pricing catalogs, and qualify leads.</p>
<blockquote>"The team that replies first is usually the team that wins the project."</blockquote>
<h3>Step-by-Step Automation Implementation</h3>
<ol>
  <li><strong>Connect WhatsApp Business API:</strong> Get access to official API numbers to send broadcasts and set up automation platforms.</li>
  <li><strong>Define Common User Paths:</strong> Map out typical questions (e.g., fee structures, store hours, location, booking requests).</li>
  <li><strong>Create Interactive Menus:</strong> Allow users to press button menus to navigate options rather than forcing them to type long sentences.</li>
  <li><strong>Sync with a CRM:</strong> Capture the name, phone number, and query automatically into a spreadsheet or sales funnel.</li>
</ol>
<p>By automating these repetitive front-line questions, you free up your team to focus on closing deals and delivering great service, while ensuring no enquiry is ever left on read.</p>`,
    publishedAt: "Aug 02, 2026",
    readTime: "4 min read",
    author: { name: "AI Specialist", role: "AI Solutions Lead" },
    tags: ["Automation", "WhatsApp", "AI", "Business Growth"],
  },
  {
    slug: "local-seo-checklist-moradabad-businesses",
    title: "The Ultimate Local SEO Checklist for Businesses in Moradabad & UP",
    category: "SEO",
    excerpt: "A step-by-step guide to ranking on the first page of Google Maps for local search terms like 'Best hotel in Moradabad' or 'Coaching center near me'.",
    content: `<p>If you run a local storefront, clinic, hotel, or academy, your customers aren't just searching the web generally — they are searching for local services in their immediate vicinity. Ranking on Google Maps and Local Search is the most cost-effective way to get high-quality walk-ins and phone calls.</p>
<h3>1. Claim and Optimize Your Google Business Profile</h3>
<p>Your profile is your digital storefront. Fill out every field: accurate business name (no keyword stuffing!), address, phone number, website link, and exact hours of operation.</p>
<h3>2. Keep Details Consistent (NAP Alignment)</h3>
<p>Ensure that your Name, Address, and Phone number (NAP) are written exactly the same way across your website, Facebook page, local business directories, and Google Maps. Any inconsistency confuses Google's crawlers.</p>
<h3>3. Gather Reviews Constantly</h3>
<p>Don't wait for reviews to happen. Prompt your happy clients immediately. A steady flow of 5-star reviews with keywords (e.g., "best service in Moradabad") directly boosts your Maps ranking.</p>
<h3>4. Local Keyword Optimization</h3>
<p>Add geo-targeted phrases to your website’s titles, headings, and body copy (e.g., 'Hotel in Pilikothi Moradabad' or 'Jewellery store in UP').</p>
<p>By executing this checklist, you position your business right where customers are looking, capturing high-intent leads before they even see your competitors.</p>`,
    publishedAt: "Jul 28, 2026",
    readTime: "5 min read",
    author: { name: "SEO Lead", role: "Technical SEO Specialist" },
    tags: ["SEO", "Local Business", "Google Maps", "Marketing"],
  },
  {
    slug: "why-we-built-xgrow-with-ai-at-core",
    title: "Why We Built XGRO with AI at the Core",
    category: "Business Growth",
    excerpt: "Traditional digital agencies build static websites and walk away. Here is why we believe every business website must be an active, AI-powered system.",
    content: `<p>A website that just sits there like a digital brochure is no longer enough. Modern businesses need active growth engines. When we founded XGRO, we decided not to be another traditional design agency. We built XGRO around AI-driven growth.</p>
<h3>The Shift from Static to Active</h3>
<p>Traditional websites lose up to 90% of their traffic because they require users to fill out complex forms and wait hours for a reply. An AI-powered site greets the customer immediately, answers their questions on the spot, and schedules consultations automatically.</p>
<h3>How We Implement AI in Our Builds</h3>
<ul>
  <li><strong>Instant Chatbots:</strong> Natural, context-aware assistants that answer FAQs and capture lead contact info in seconds.</li>
  <li><strong>Automated Lead Routing:</strong> Feeding leads directly into Google Sheets, CRM, or WhatsApp immediately.</li>
  <li><strong>Content SEO Generation:</strong> Accelerating marketing drafts and keywords research using curated AI tools.</li>
</ul>
<p>By blending metro-level design with deep AI and automation systems, we ensure our clients' websites do one job exceptionally well: build their business day and night.</p>`,
    publishedAt: "Jul 15, 2026",
    readTime: "3 min read",
    author: { name: "Founder", role: "Founder, XGRO" },
    tags: ["AI", "Branding", "Agency", "Development"],
  },
];

