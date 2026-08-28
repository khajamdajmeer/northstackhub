/**
 * Facts here are real unless a comment says otherwise. The `stats` below are
 * drawn from the studio's own portfolio. The cal.com URL is confirmed; the
 * Upwork, GitHub and LinkedIn handles are still placeholders that may not exist
 * yet — confirm each one before launch.
 */
export const siteConfig = {
  name: "NorthStackHub",
  domain: "northstackhub.com",
  url: "https://northstackhub.com",
  tagline: "Focus. Discipline. Consistency.",
  description:
    "NorthStackHub builds software end to end — web and mobile applications, RAG and agentic AI systems, e-commerce, payments, role-based platforms and learning products. Next.js and React on the front, FastAPI and Node behind it, deployed on AWS or Azure and maintained afterwards.",
  email: "info@northstackhub.com",
  phone: "+91 63002 07822",
  location: "Hyderabad, India · Working remotely with clients worldwide",
  hours: "Mon–Sat · 9:00–19:00 IST (GMT+5:30) · Async updates daily",
  responseTime: "Replies within 4 business hours",
  founded: 2023,
  links: {
    // PLACEHOLDER — these handles still need confirming before launch.
    upwork: "https://www.upwork.com/freelancers/northstackhub",
    github: "https://github.com/northstackhub",
    linkedin: "https://www.linkedin.com/company/northstackhub",
    x: "https://x.com/northstackhub",
    calendar: "https://cal.com/northstackhub/30min",
  },
  stats: [
    { label: "Projects shipped", value: "8+" },
    { label: "Years building", value: "3+" },
    { label: "Stack covered", value: "End to end" },
    { label: "Based in", value: "Hyderabad" },
  ],
} as const;

/**
 * The three words the studio runs on. They are not decoration — every section of
 * this site is expected to answer to one of them, and the home page states them
 * outright rather than implying them through adjectives.
 */
export const principles = [
  {
    word: "Focus",
    index: "01",
    headline: "One project has our attention at a time.",
    description:
      "We take on a small number of builds so each one gets a whole brain rather than a slice of one. That is why estimates hold, why the person answering your message is the person writing the code, and why we turn down work that would spread us thin.",
    proof: "A named engineer on your project from scoping to handover",
  },
  {
    word: "Discipline",
    index: "02",
    headline: "The unglamorous parts get built too.",
    description:
      "Tests, migrations, error handling, access control, backups, the rollback path. The work that never shows up in a demo is the work that decides whether the product survives its first real month. We do not quietly skip it to hit a date.",
    proof: "Tests, CI, monitoring and a rollback plan ship with every build",
  },
  {
    word: "Consistency",
    index: "03",
    headline: "Same standard on week one and week twelve.",
    description:
      "A written update every Friday. A staging URL you can click from the first week. Code that looks like it was written by one person because the conventions were decided before the first commit. No sprint where quality quietly drops because the deadline moved.",
    proof: "Weekly demos and a written update, every week, without being chased",
  },
] as const;

export type SiteConfig = typeof siteConfig;

export const mainNav = [
  { title: "Services", href: "/services" },
  { title: "Work", href: "/portfolio" },
  { title: "Process", href: "/process" },
  { title: "Pricing", href: "/pricing" },
  { title: "Blog", href: "/blog" },
  { title: "About", href: "/about" },
] as const;

export const footerNav = [
  {
    title: "Build",
    links: [
      { title: "Web applications", href: "/services/web-applications" },
      { title: "Android & iOS apps", href: "/services/mobile-applications" },
      { title: "E-commerce", href: "/services/ecommerce" },
      { title: "Learning platforms", href: "/services/learning-platforms" },
      { title: "Portfolios & blogs", href: "/services/portfolio-and-marketing-sites" },
      { title: "Interactive 3D & motion", href: "/services/interactive-3d" },
    ],
  },
  {
    title: "Systems",
    links: [
      { title: "RAG & knowledge assistants", href: "/services/rag-systems" },
      { title: "Agentic AI modules", href: "/services/agentic-ai" },
      { title: "Role-based access", href: "/services/access-control" },
      { title: "Backend & APIs", href: "/services/backend-apis" },
      { title: "Databases & caching", href: "/services/databases-caching" },
      { title: "Cloud & DevOps", href: "/services/cloud-devops" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About us", href: "/about" },
      { title: "How we work", href: "/process" },
      { title: "Case studies", href: "/portfolio" },
      { title: "Pricing & packages", href: "/pricing" },
      { title: "Engineering blog", href: "/blog" },
      { title: "Start a project", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy policy", href: "/privacy" },
      { title: "Terms of service", href: "/terms" },
    ],
  },
] as const;
