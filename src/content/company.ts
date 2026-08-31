export const processSteps = [
  {
    step: "01",
    title: "Discovery call",
    duration: "30 minutes, free",
    description:
      "We walk through what you are building, who it is for, and what has to be true for the project to count as a success. You leave with a rough scope, a rough number and an honest read on whether we are the right team.",
    deliverable: "Written scope summary within 24 hours",
  },
  {
    step: "02",
    title: "Proposal & fixed scope",
    duration: "2–3 days",
    description:
      "A written proposal: milestones, deliverables, timeline, price and explicit exclusions. No hourly surprises — you approve a scope, and changes to it are quoted before any work starts.",
    deliverable: "Proposal, contract and milestone schedule",
  },
  {
    step: "03",
    title: "Architecture & design",
    duration: "Week 1",
    description:
      "Data model, API contracts and infrastructure plan on paper before code. UI work starts in Figma so you approve screens rather than reviewing half-built pages.",
    deliverable: "Architecture doc, ER diagram, approved designs",
  },
  {
    step: "04",
    title: "Build in weekly sprints",
    duration: "Bulk of the project",
    description:
      "Working software every week on a staging URL you can click through. A short written update each Friday: what shipped, what is next, anything blocking. You are never guessing where the project stands.",
    deliverable: "Staging environment, weekly demo and written update",
  },
  {
    step: "05",
    title: "Test, harden & launch",
    duration: "Final 1–2 weeks",
    description:
      "Automated tests in CI, load and failure-path testing, security review, performance budgets, then a rehearsed deploy with a rollback plan. Launch day is uneventful by design.",
    deliverable: "Test suite, CI pipeline, production deployment",
  },
  {
    step: "06",
    title: "Handover & support",
    duration: "Ongoing",
    description:
      "Documentation, a recorded walkthrough and a 30-day warranty on everything we shipped. If you want us to keep operating it, a maintenance retainer picks up from there.",
    deliverable: "Docs, walkthrough video, 30-day warranty",
  },
] as const;

export const values = [
  {
    title: "Written before built",
    description:
      "Scope, architecture and trade-offs go in writing first. It is cheaper to argue about a diagram than a database migration.",
  },
  {
    title: "One team, whole stack",
    description:
      "The people writing the React also design the schema and own the deploy. No handoff gaps, no finger-pointing between vendors.",
  },
  {
    title: "You own everything",
    description:
      "Your repository, your cloud accounts, your data — from day one. We build so that firing us would be inconvenient, not catastrophic.",
  },
  {
    title: "Honest estimates",
    description:
      "We would rather lose a bid than win it on a number we do not believe. If a request is a bad idea, we say so before invoicing for it.",
  },
] as const;

export const differentiators = [
  {
    title: "Fixed scope, one number",
    description:
      "You approve a written scope and a number before work starts. Change requests are agreed separately, so the invoice at the end matches the one at the start.",
  },
  {
    title: "Weekly working software",
    description:
      "A staging URL from week one and a demo every Friday. Progress you can click, not a status percentage in a spreadsheet.",
  },
  {
    title: "Production, not prototypes",
    description:
      "Tests, CI, monitoring, backups and a rollback path ship with the build. A demo that cannot survive real traffic is not finished.",
  },
  {
    title: "Handover by default",
    description:
      "Documentation and a walkthrough at the end of every project, whether or not you retain us. Lock-in is not our business model.",
  },
] as const;

export const techStack = [
  {
    group: "Frontend",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "shadcn/ui", "Zustand"],
  },
  {
    group: "Mobile",
    items: ["React Native", "Expo", "Swift", "Kotlin", "Firebase", "App Store / Play"],
  },
  {
    group: "Backend",
    items: ["FastAPI", "Python", "Node.js", "NestJS", "GraphQL", "Celery"],
  },
  {
    group: "AI systems",
    items: ["LangGraph", "LangChain", "pgvector", "OpenAI", "Anthropic", "Ollama"],
  },
  {
    group: "Data",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "SQLAlchemy"],
  },
  {
    group: "Payments",
    items: ["Stripe", "PayPal", "Razorpay", "Paddle", "Stripe Connect", "Lemon Squeezy"],
  },
  {
    group: "Cloud & DevOps",
    items: ["AWS", "Azure", "Vercel", "Docker", "Terraform", "GitHub Actions"],
  },
  {
    group: "Motion & 3D",
    items: ["GSAP", "ScrollTrigger", "three.js", "React Three Fiber", "drei", "Blender"],
  },
  {
    group: "Quality",
    items: ["Playwright", "Pytest", "Vitest", "Sentry", "Grafana", "OpenTelemetry"],
  },
] as const;

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  source: string;
};

/**
 * Empty by design. This site carries no testimonials until real client reviews
 * exist to quote — inventing them is the one shortcut that can never be walked
 * back. Add entries here and every section that consumes them renders again.
 */
export const testimonials: Testimonial[] = [];

/**
 * Companies whose work we have delivered on.
 *
 * Every entry must be a real engagement. Naming a company here is a public claim
 * about them — a prospect can ring them to check it, and they can act on it if
 * it is wrong. Same rule as `testimonials` above: an empty array renders
 * nothing rather than tempting anyone to pad it.
 *
 * `logo` is optional. Where one is set it points at a file in /public/clients;
 * where it is absent the strip sets the name as a wordmark instead, which reads
 * better than a 32px favicon scaled up.
 */
export type Client = {
  name: string;
  /** Linked from the card, so the claim is checkable. */
  url: string;
  logo?: string;
};

export const clients: Client[] = [
  { name: "Leverage Edu", url: "https://leverageedu.com", logo: "/clients/leverage-edu.png" },
  { name: "GetYourGuide", url: "https://www.getyourguide.com" },
  { name: "Viator", url: "https://www.viator.com" },
  { name: "eWings", url: "https://ewings.co.in", logo: "/clients/ewings.png" },
  { name: "WrittenlyHub", url: "https://www.writtenlyhub.com", logo: "/clients/writtenlyhub.png" },
  { name: "GT Holidays", url: "https://www.gtholidays.in", logo: "/clients/gt-holidays.png" },
  { name: "e-PGPathshala", url: "https://epgp.inflibnet.ac.in" },
  { name: "Techcanvass", url: "https://techcanvass.com" },
  { name: "Small Batch", url: "https://smallbatch.co.in" },
  { name: "Shikhar", url: "https://www.shikhar.com" },
];

export const faqs = [
  {
    q: "How do we start working together?",
    a: "Book a 30-minute discovery call. We will ask what you are building, what has to be true for it to succeed, and what your budget range is. Within 24 hours you get a written scope summary — free, no obligation, yours to take elsewhere.",
  },
  {
    q: "How do engagements usually start?",
    a: "Most start small — a defined package with a set deliverable, so you can see how we work before committing to a build. Larger engagements run as a direct contract with milestone invoicing. The engineering is identical either way.",
  },
  {
    q: "How is the cost agreed?",
    a: "A fixed number against a fixed scope for defined projects, a monthly retainer for ongoing work, and a day rate only for open-ended discovery or audits. Nothing is published — you get a written scope and a number after a call, and you approve it before anything is built.",
  },
  {
    q: "What if the scope changes mid-project?",
    a: "It usually does. We quote the change as a separate line item — cost and schedule impact — and you approve it before we build it. Nothing gets added to your invoice that you have not signed off.",
  },
  {
    q: "Who owns the code and the accounts?",
    a: "You do. We work in your repository and your cloud accounts wherever possible, and everything transfers to you at the end regardless. There is no proprietary framework holding your project hostage.",
  },
  {
    q: "What happens after launch?",
    a: "Every project includes a 30-day warranty covering defects in what we shipped. After that you can take a maintenance retainer, or take the documentation and run it yourself — both are normal and we support both.",
  },
  {
    q: "Which time zones do you cover?",
    a: "We work from New Jersey and Hyderabad, so the day is covered across US Eastern and Indian hours with a wide live overlap for European clients too. Written updates land every day regardless, and urgent production issues are covered outside those hours on Priority support.",
  },
  {
    q: "Can you join an existing team?",
    a: "Yes. We work as an embedded squad inside your Slack and your sprint process, or as a self-contained team reporting to one stakeholder — whichever fits how you already operate.",
  },
] as const;
