export type ServiceCategory =
  | "Product engineering"
  | "AI systems"
  | "Platform & data"
  | "Experience";

export type Service = {
  slug: string;
  title: string;
  short: string;
  category: ServiceCategory;
  icon:
    | "layers"
    | "smartphone"
    | "brain"
    | "bot"
    | "shopping"
    | "credit-card"
    | "server"
    | "database"
    | "cloud"
    | "shield"
    | "graduation"
    | "orbit"
    | "pen"
    | "wrench";
  summary: string;
  outcomes: string[];
  deliverables: string[];
  stack: string[];
  timeline: string;
  /**
   * Only set where a fixed-price package covers this service — the figure is
   * that package's lowest tier. Everything else is quoted after scoping, so the
   * field is absent rather than carrying a guess.
   */
  startingAt?: string;
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "web-applications",
    title: "End-to-end web applications",
    short: "Full product builds — from empty repo to live, monitored deployment.",
    category: "Product engineering",
    icon: "layers",
    summary:
      "We take a product from a rough brief to a running application: information architecture, UI, API design, database modelling, auth, background jobs, and a deployment pipeline your team can actually operate. One team owns the whole stack, so nothing gets lost between frontend and backend.",
    outcomes: [
      "A working product in production, not a prototype that stalls at 80%",
      "Type-safe contracts shared between the Next.js frontend and the API",
      "Documented architecture your in-house team can pick up without us",
      "Performance budgets enforced in CI — Core Web Vitals in the green",
    ],
    deliverables: [
      "Architecture document and data model",
      "Next.js App Router frontend with design system",
      "FastAPI or Node backend with OpenAPI schema",
      "Authentication, roles and permissions",
      "Automated tests and CI pipeline",
      "Production deployment plus staging environment",
    ],
    stack: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    timeline: "4–12 weeks",
    startingAt: "$96",
    faqs: [
      {
        q: "Can you take over an existing codebase?",
        a: "Yes. We start with a paid audit week — we map the code, the data model and the deploy path, then give you a written risk list and a plan before writing a line of feature code.",
      },
      {
        q: "Who owns the code?",
        a: "You do, from the first commit. We work in your repository, or hand over a repo with full history at the end of the engagement.",
      },
    ],
  },
  {
    slug: "mobile-applications",
    title: "Android & iOS applications",
    short: "Cross-platform mobile apps that ship to both stores from one codebase.",
    category: "Product engineering",
    icon: "smartphone",
    summary:
      "React Native and Expo for the 90% of apps that do not need bare-metal native, with native modules written where the product genuinely requires them. Offline-first data, push notifications, in-app purchases, biometric auth, and the store submission work that trips most first-time publishers.",
    outcomes: [
      "One codebase shipping to both the App Store and Google Play",
      "Offline-first behaviour — the app works on a bad train connection",
      "Over-the-air updates for fixes that do not need a store review",
      "Store listings that pass review the first time",
    ],
    deliverables: [
      "React Native / Expo application for iOS and Android",
      "Shared API layer with the web product where one exists",
      "Push notifications and deep linking",
      "Offline cache and background sync",
      "In-app purchases or subscription entitlements",
      "Store submission, signing and release pipeline",
    ],
    stack: ["React Native", "Expo", "TypeScript", "FastAPI", "SQLite", "Firebase"],
    timeline: "6–16 weeks",
    faqs: [
      {
        q: "React Native or fully native?",
        a: "React Native unless the product is built on something the bridge handles badly — heavy real-time graphics, deep camera or sensor work, or background processing the OS restricts. We tell you which case you are in before you commit, and we write native modules when the answer is 'mostly cross-platform, with one hard part'.",
      },
      {
        q: "Do you handle the App Store submission?",
        a: "Yes — signing, provisioning, screenshots, privacy declarations and the review back-and-forth. Rejections on a first submission are usually about privacy labels or account deletion, and we handle both up front.",
      },
    ],
  },
  {
    slug: "rag-systems",
    title: "RAG systems & knowledge assistants",
    short: "Retrieval pipelines that answer from your data, with citations.",
    category: "AI systems",
    icon: "brain",
    summary:
      "Most RAG demos fall over on real documents. We build the unglamorous parts properly: ingestion and chunking tuned to your content, hybrid retrieval instead of naive vector search, reranking, citation of the source passage, and an evaluation set so you can prove an answer got better rather than just different.",
    outcomes: [
      "Answers grounded in your documents, with the source passage cited",
      "A measured retrieval quality baseline — not vibes",
      "Hallucination handled explicitly: the system says when it does not know",
      "Per-query cost and latency you can see and control",
    ],
    deliverables: [
      "Ingestion pipeline with chunking and metadata strategy",
      "Hybrid search: vector plus keyword, with reranking",
      "Evaluation set and retrieval quality scoring",
      "Answer synthesis with inline citations",
      "Access control so users only retrieve what they may read",
      "Cost, latency and token dashboards",
    ],
    stack: ["Python", "FastAPI", "pgvector", "LangChain", "OpenAI", "Redis"],
    timeline: "3–10 weeks",
    startingAt: "$108",
    faqs: [
      {
        q: "Do we need to fine-tune a model?",
        a: "Almost never at the start. Retrieval quality, chunking and prompt structure account for most of the gap between a bad assistant and a good one, and they are far cheaper to iterate on. We revisit fine-tuning only once retrieval is measured and still short.",
      },
      {
        q: "Can it run on our own infrastructure?",
        a: "Yes. Open-weight models on your own GPUs, or a hosted API — the retrieval layer is the same either way, so the decision is about compliance and cost, not architecture.",
      },
    ],
  },
  {
    slug: "agentic-ai",
    title: "Agentic AI & autonomous modules",
    short: "Agents that do work, with limits, logging and a human in the loop.",
    category: "AI systems",
    icon: "bot",
    summary:
      "Autonomous modules that carry out real tasks — triaging tickets, reconciling records, drafting and filing documents, monitoring and reacting. Built with explicit tool boundaries, retry and timeout policy, a full trace of every decision, and an approval gate wherever an action is expensive or irreversible.",
    outcomes: [
      "A repetitive process that runs without a person driving it",
      "Every run traceable: inputs, tool calls, decisions, output",
      "Hard limits on spend, scope and blast radius",
      "Human approval required before anything irreversible",
    ],
    deliverables: [
      "Agent architecture with defined tools and permissions",
      "Task queue, retries, timeouts and dead-letter handling",
      "Full run tracing and replay for debugging",
      "Approval workflow for high-impact actions",
      "Evaluation harness for agent success rate",
      "Cost controls and per-run budgets",
    ],
    stack: ["Python", "FastAPI", "LangGraph", "Celery", "PostgreSQL", "OpenTelemetry"],
    timeline: "4–12 weeks",
    faqs: [
      {
        q: "How do you stop an agent doing something stupid?",
        a: "By not giving it the ability to. Tools are scoped narrowly, destructive actions sit behind an approval gate, every run has a spend and step budget, and the whole trace is recorded so a bad decision is diagnosable rather than mysterious.",
      },
      {
        q: "Is an agent actually the right answer?",
        a: "Often it is not. If the process is deterministic, a queue and a few rules will be cheaper, faster and easier to maintain. We will say so — agents earn their cost when the input is genuinely unstructured and the path varies per case.",
      },
    ],
  },
  {
    slug: "access-control",
    title: "Role-based access & auth systems",
    short: "Permissions that hold up to an audit, not just to the happy path.",
    category: "Platform & data",
    icon: "shield",
    summary:
      "Authentication and authorisation designed as a system rather than a pile of if-statements: roles, permissions, resource ownership and tenant isolation modelled once and enforced at the data layer, so a missing UI check cannot become a data leak. Includes SSO, MFA, session policy and an audit trail.",
    outcomes: [
      "Permissions enforced server-side, not just hidden in the UI",
      "Multi-tenant isolation that survives a mistyped query",
      "An audit log that answers 'who saw this, and when'",
      "SSO and MFA without a bespoke login flow per client",
    ],
    deliverables: [
      "Role, permission and resource-ownership model",
      "Server-side enforcement at the query layer",
      "SSO (OAuth2 / OIDC / SAML) and MFA",
      "Session, token and refresh policy",
      "Admin UI for roles and user management",
      "Audit logging and access reports",
    ],
    stack: ["FastAPI", "Next.js", "PostgreSQL", "Auth0", "Clerk", "OpenFGA"],
    timeline: "2–6 weeks",
    faqs: [
      {
        q: "Build auth or buy it?",
        a: "Buy the identity provider, build the authorisation. Password resets, MFA and SSO are solved problems not worth your money; the rules about who may see which record are specific to your product and belong in your codebase.",
      },
      {
        q: "Can you retrofit this onto a live product?",
        a: "Yes, and it is common. We map the current checks, model the intended permissions, then migrate route by route behind a flag so nothing breaks for existing users mid-flight.",
      },
    ],
  },
  {
    slug: "ecommerce",
    title: "E-commerce builds",
    short: "Storefronts, carts, checkout and admin — tuned for conversion.",
    category: "Product engineering",
    icon: "shopping",
    summary:
      "Headless commerce done properly: catalogue and inventory modelling, cart and checkout flows that survive real traffic, tax and shipping logic, order management, and an admin your operations team can live in. We build on Shopify, Medusa or a custom stack depending on where you actually need control.",
    outcomes: [
      "Checkout flows measured and optimised against drop-off",
      "Inventory, orders and fulfilment in one operational dashboard",
      "Multi-currency and regional tax handling from day one",
      "Sub-second product pages via ISR and edge caching",
    ],
    deliverables: [
      "Product catalogue, variants and inventory model",
      "Cart, checkout and order lifecycle",
      "Payment and shipping provider integration",
      "Admin dashboard with roles",
      "Abandoned cart and transactional email flows",
      "Analytics events for the full funnel",
    ],
    stack: ["Next.js", "Medusa", "Shopify", "Stripe", "PostgreSQL", "Redis"],
    timeline: "5–14 weeks",
    faqs: [
      {
        q: "Shopify or custom?",
        a: "If your catalogue and checkout are conventional, Shopify with a headless frontend is faster and cheaper to run. Custom pays off when you have unusual pricing, subscriptions, marketplaces or B2B rules — we give you a written recommendation before you commit.",
      },
      {
        q: "Can you migrate an existing store?",
        a: "Yes, including products, customers, orders and URL redirects so you keep your search rankings.",
      },
    ],
  },
  {
    slug: "payments",
    title: "Payment integration",
    short: "Stripe, PayPal, Razorpay and subscriptions — built to reconcile.",
    category: "Platform & data",
    icon: "credit-card",
    summary:
      "Payments fail in boring, expensive ways: duplicated charges, missed webhooks, subscriptions that drift out of sync with entitlements. We build the integration with idempotency, webhook verification, retry handling and a reconciliation path, so finance and engineering see the same numbers.",
    outcomes: [
      "Idempotent charge handling — no double billing under retries",
      "Verified, replay-safe webhooks with a dead-letter queue",
      "Subscription state that matches product entitlements",
      "PCI-conscious design: card data never touches your servers",
    ],
    deliverables: [
      "Checkout / payment element integration",
      "Subscription plans, trials, proration and dunning",
      "Webhook handlers with signature verification and retries",
      "Invoices, receipts and refund flows",
      "Reconciliation reports and admin tooling",
      "Sandbox test suite covering failure paths",
    ],
    stack: ["Stripe", "PayPal", "Razorpay", "FastAPI", "PostgreSQL", "Webhooks"],
    timeline: "1–4 weeks",
    faqs: [
      {
        q: "Which providers do you work with?",
        a: "Stripe most often, plus PayPal, Razorpay, Paddle and Lemon Squeezy. For regional processors we work from their API docs and sandbox.",
      },
      {
        q: "Do you handle PCI compliance?",
        a: "We design so card data never reaches your infrastructure — hosted fields and provider-side checkout — which keeps you in the lightest SAQ tier. We are not a compliance auditor and will tell you when you need one.",
      },
    ],
  },
  {
    slug: "backend-apis",
    title: "Backend & API engineering",
    short: "FastAPI and Node services with real auth, jobs and observability.",
    category: "Platform & data",
    icon: "server",
    summary:
      "APIs designed to be consumed, not reverse-engineered. We build FastAPI and Node services with typed schemas, OpenAPI documentation, authentication and rate limiting, background workers for the slow work, and structured logs and traces so production problems are diagnosable.",
    outcomes: [
      "OpenAPI docs generated from the code, always current",
      "Auth, roles and rate limiting handled at the edge of the service",
      "Long-running work moved to queues, not held in request handlers",
      "Traces and structured logs that shorten incident response",
    ],
    deliverables: [
      "REST or GraphQL API with versioning strategy",
      "JWT / OAuth2 authentication and RBAC",
      "Background jobs and scheduled tasks",
      "Third-party integrations and webhook endpoints",
      "Integration test suite and CI gate",
      "Observability: logs, metrics, traces, alerts",
    ],
    stack: ["FastAPI", "Python", "Node.js", "NestJS", "OpenAPI", "OpenTelemetry"],
    timeline: "3–10 weeks",
    startingAt: "$114",
    faqs: [
      {
        q: "FastAPI or Node?",
        a: "FastAPI when there is data, ML or Python tooling in the picture, and for teams that already write Python. Node when the team is TypeScript-first and you want one language across the stack. We recommend, you decide.",
      },
      {
        q: "Can you document an API we already have?",
        a: "Yes — we add schema definitions, generate OpenAPI output and produce a consumer-facing reference with examples.",
      },
    ],
  },
  {
    slug: "databases-caching",
    title: "Databases & caching",
    short: "SQL, NoSQL, indexes, migrations and a cache layer that stays correct.",
    category: "Platform & data",
    icon: "database",
    summary:
      "Data modelling that survives growth: normalised relational schemas where consistency matters, document stores where the shape is genuinely fluid, and a Redis layer with explicit invalidation rules. We tune the slow queries you already have and put migrations under version control.",
    outcomes: [
      "Slow queries identified and fixed with measured before/after numbers",
      "A cache layer with defined TTLs and invalidation — not guesswork",
      "Reversible, reviewed migrations that run in CI",
      "Backup and restore actually tested, not just configured",
    ],
    deliverables: [
      "Schema design and ER documentation",
      "Index strategy and query optimisation report",
      "Redis caching layer with invalidation rules",
      "Migration tooling and seed data",
      "Read replicas / connection pooling where needed",
      "Backup, restore and retention policy",
    ],
    stack: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "SQLAlchemy"],
    timeline: "1–5 weeks",
    faqs: [
      {
        q: "SQL or NoSQL?",
        a: "Start relational unless you have a specific reason not to. We reach for MongoDB or DynamoDB for genuinely schemaless documents, event streams or very high write fan-out — and often the answer is both, for different parts of the system.",
      },
      {
        q: "Can you fix a database that is already slow?",
        a: "That is a common first engagement. We profile real queries, add the missing indexes, restructure the worst offenders and hand you the measurements.",
      },
    ],
  },
  {
    slug: "cloud-devops",
    title: "Cloud, DevOps & deployment",
    short: "CI/CD, containers and infrastructure as code on AWS, Azure or Vercel.",
    category: "Platform & data",
    icon: "cloud",
    summary:
      "Getting to production should be boring. We containerise the app, write the pipeline, define infrastructure as code, and set up staging and preview environments — so deploys are a merge, rollbacks are one command, and nobody is SSH-ing into a server at midnight.",
    outcomes: [
      "Deploys on merge, with preview environments per pull request",
      "Infrastructure described in code and reviewable in a PR",
      "One-command rollback with a tested recovery path",
      "Cost visibility — you know what each environment costs",
    ],
    deliverables: [
      "Dockerised services and local dev parity",
      "CI/CD pipeline (GitHub Actions or Azure Pipelines)",
      "Terraform / infrastructure as code",
      "Staging, preview and production environments",
      "Secrets management and environment strategy",
      "Monitoring, alerting and uptime checks",
    ],
    stack: ["Docker", "AWS", "Azure", "Terraform", "GitHub Actions", "Vercel"],
    timeline: "1–6 weeks",
    startingAt: "$30",
    faqs: [
      {
        q: "AWS or Azure?",
        a: "Azure if your organisation already lives in Microsoft identity and tooling; AWS for most everything else, and Vercel for the Next.js frontend regardless. If you are small, we will usually argue against Kubernetes until your team is big enough to operate it.",
      },
      {
        q: "Do you help reduce cloud bills?",
        a: "Yes — right-sizing, caching, storage lifecycle rules and killing idle environments. We report the saving in dollars, monthly.",
      },
    ],
  },
  {
    slug: "learning-platforms",
    title: "Education & learning platforms",
    short: "Courses, cohorts, assessments and progress that actually tracks.",
    category: "Product engineering",
    icon: "graduation",
    summary:
      "Learning products where the hard parts are the ones nobody demos: progress that survives a dropped connection, assessments that cannot be gamed from the console, video delivery that does not bankrupt you, and instructor tooling good enough that your educators stop emailing spreadsheets.",
    outcomes: [
      "Progress and completion tracked reliably across devices",
      "Assessment logic enforced server-side, not in the browser",
      "Video delivered at a cost per learner you can predict",
      "Instructors self-serve instead of filing tickets",
    ],
    deliverables: [
      "Course, lesson, cohort and enrolment model",
      "Progress tracking with offline tolerance",
      "Quizzes, assignments and grading workflows",
      "Video pipeline with adaptive streaming and DRM options",
      "Instructor and admin dashboards",
      "Certificates, reporting and learner analytics",
    ],
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Mux", "Redis", "Stripe"],
    timeline: "6–16 weeks",
    faqs: [
      {
        q: "Should we use an off-the-shelf LMS?",
        a: "If your content fits a standard course-and-quiz shape, yes — Teachable or Thinkific will beat a custom build on cost. Custom is worth it when the learning model is the product: adaptive paths, cohort mechanics, simulations, or assessment you need to defend.",
      },
      {
        q: "How do you keep video costs down?",
        a: "Adaptive bitrate, aggressive CDN caching, and encoding tiers matched to what learners actually watch on. We model the monthly cost at your expected learner count before building.",
      },
    ],
  },
  {
    slug: "interactive-3d",
    title: "Interactive 3D & motion",
    short: "GSAP choreography and three.js scenes that stay fast on a phone.",
    category: "Experience",
    icon: "orbit",
    summary:
      "Sites that move with intent. Scroll-driven storytelling with GSAP and ScrollTrigger, WebGL product and hero scenes with three.js, and page transitions that make a site feel like an application. Built with budgets: assets compressed, scenes lazy-loaded, and a full static fallback for reduced-motion and low-power devices.",
    outcomes: [
      "Motion that carries the story rather than decorating it",
      "3D that loads progressively and never blocks first paint",
      "A complete, dignified experience under prefers-reduced-motion",
      "Frame budgets held on mid-range Android, not just a MacBook",
    ],
    deliverables: [
      "Motion direction and a documented timing system",
      "GSAP ScrollTrigger choreography",
      "three.js / React Three Fiber scenes",
      "Model optimisation: Draco, KTX2, LOD",
      "Reduced-motion and no-WebGL fallbacks",
      "Performance profiling on real devices",
    ],
    stack: ["GSAP", "three.js", "React Three Fiber", "drei", "Next.js", "Blender"],
    timeline: "2–8 weeks",
    faqs: [
      {
        q: "Will 3D hurt our SEO?",
        a: "Not the way we build it. Content is server-rendered and complete without JavaScript; the WebGL scene mounts after, lazily, and never holds up the largest contentful paint. Crawlers read a normal page.",
      },
      {
        q: "What about users who get motion sick?",
        a: "Every animation checks prefers-reduced-motion and falls back to a static composition — not a broken layout. That fallback is designed, not an afterthought.",
      },
    ],
  },
  {
    slug: "portfolio-and-marketing-sites",
    title: "Portfolios, blogs & marketing sites",
    short: "Fast, accessible, SEO-ready sites that convert visitors into leads.",
    category: "Experience",
    icon: "pen",
    summary:
      "Personal portfolios, blog and publishing sites, landing pages and company websites built on Next.js with a headless CMS so your team can edit content without a developer. Every build ships with structured data, sitemaps, OG images and analytics wired in.",
    outcomes: [
      "Lighthouse 95+ across performance, accessibility and SEO",
      "Content editable by non-developers through a CMS",
      "Ready-to-rank pages with schema.org markup and sitemaps",
      "Design that matches your brand rather than a recycled template",
    ],
    deliverables: [
      "Custom design in Figma, then built pixel-accurate",
      "Next.js static/ISR site with image optimisation",
      "Headless CMS integration (Sanity, Contentful or MDX)",
      "Contact forms with spam protection and email routing",
      "Analytics, search console and OG image generation",
    ],
    stack: ["Next.js", "Tailwind CSS", "Sanity", "GSAP", "Vercel", "Resend"],
    timeline: "1–3 weeks",
    faqs: [
      {
        q: "Do you write the copy?",
        a: "We write structural copy and can polish yours. For full brand copywriting we bring in a specialist writer and quote it separately.",
      },
      {
        q: "Can I edit the site myself afterwards?",
        a: "Yes — content lives in a CMS with a preview environment, and we record a short walkthrough for your team.",
      },
    ],
  },
  {
    slug: "maintenance-support",
    title: "Maintenance & support",
    short: "Retainers for updates, monitoring, fixes and steady improvement.",
    category: "Platform & data",
    icon: "wrench",
    summary:
      "Software rots without attention. A retainer covers dependency and security updates, uptime monitoring with a human on the other end, bug fixes inside an agreed response window, and a monthly block of hours for the improvements that never make it onto a project plan.",
    outcomes: [
      "Security patches applied before they become incidents",
      "A named engineer who already knows your codebase",
      "Monthly report: uptime, performance, what changed, what is next",
      "Predictable cost instead of emergency contractor rates",
    ],
    deliverables: [
      "Uptime and error monitoring with alerting",
      "Dependency and security patching",
      "Bug fixes within agreed SLA",
      "Monthly feature/improvement hours",
      "Performance and cost review",
      "Quarterly architecture check-in",
    ],
    stack: ["Sentry", "Grafana", "Dependabot", "GitHub Actions", "Slack"],
    timeline: "Ongoing",
    faqs: [
      {
        q: "Do you maintain apps you did not build?",
        a: "Yes, after a short onboarding audit so we understand the risks before we take responsibility for uptime.",
      },
      {
        q: "What is the response time?",
        a: "Critical production issues: 4 business hours on Standard, 1 hour on Priority. Everything else is triaged into the weekly cycle.",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export const serviceCategories: ServiceCategory[] = [
  "Product engineering",
  "AI systems",
  "Platform & data",
  "Experience",
];

export function servicesByCategory(category: ServiceCategory) {
  return services.filter((service) => service.category === category);
}
