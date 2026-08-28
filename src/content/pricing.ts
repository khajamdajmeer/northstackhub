/**
 * Real pricing for the fixed-scope packages.
 *
 * The INR figure is the listed price; the USD figure is the same package
 * converted at ₹83.44 = $1, so treat USD as indicative and INR as
 * authoritative.
 *
 * Every number here is one that was actually quoted. If a package changes,
 * change it here in the same sitting — a client comparing a quote to this page
 * should never find a difference.
 */

export type PackageTier = {
  name: string;
  priceUsd: number;
  priceInr: number;
  deliveryDays: number;
  revisions: number;
  description: string;
  includes: string[];
  highlight?: boolean;
};

export type ServicePackage = {
  slug: string;
  title: string;
  /** Full descriptive title, used as the card heading. */
  longTitle: string;
  category: string;
  summary: string;
  /** Service slugs in src/content/services.ts that this package delivers against. */
  services: string[];
  tiers: PackageTier[];
};

export const currencyNote =
  "Prices shown in USD, converted from the listed INR pricing at ₹83.44 = $1. You will be invoiced in your own currency.";

export const packages: ServicePackage[] = [
  {
    slug: "rag-chatbot",
    title: "RAG chatbot on your documents",
    longTitle: "A RAG AI chatbot trained on your documents and knowledge base",
    category: "AI Development · AI Websites & Software",
    summary:
      "An assistant that answers from your own documents and cites the passage it used, instead of a general-purpose model guessing at your business.",
    services: ["rag-systems", "backend-apis"],
    tiers: [
      {
        name: "RAG Starter",
        priceUsd: 108,
        priceInr: 9012,
        deliveryDays: 3,
        revisions: 2,
        description:
          "RAG chatbot on up to 50 pages of your docs. Source-cited answers, hosted API, full source code.",
        includes: ["Chatbot integration", "Source code"],
      },
      {
        name: "RAG Pro",
        priceUsd: 300,
        priceInr: 25033,
        deliveryDays: 7,
        revisions: 2,
        description:
          "Multi-source RAG (PDFs, site, Notion) plus an embeddable web widget and admin re-index. Code you own.",
        includes: [
          "Functional web app",
          "AI model integration",
          "Chatbot integration",
          "Source code",
        ],
        highlight: true,
      },
      {
        name: "RAG Platform",
        priceUsd: 540,
        priceInr: 45059,
        deliveryDays: 14,
        revisions: 3,
        description:
          "Full RAG platform: multi-tenant, chat history, analytics dashboard, deployed to your cloud.",
        includes: [
          "Functional web app",
          "AI model integration",
          "Model fine-tuning",
          "Chatbot integration",
          "Source code",
        ],
      },
    ],
  },
  {
    slug: "fullstack-web-app",
    title: "Full-stack web application",
    longTitle: "A high-performance web application with a FastAPI backend",
    category: "AI Development · AI Websites & Software",
    summary:
      "React on the front, FastAPI and a database behind it, deployed to your own cloud account with the source in your repository.",
    services: ["web-applications", "backend-apis", "databases-caching"],
    tiers: [
      {
        name: "Frontend App",
        priceUsd: 96,
        priceInr: 8010,
        deliveryDays: 3,
        revisions: 2,
        description:
          "Responsive React frontend, up to around four pages or screens, connected to an API.",
        includes: ["Responsive frontend", "API integration", "Source code"],
      },
      {
        name: "Full-Stack + Deploy",
        priceUsd: 114,
        priceInr: 9512,
        deliveryDays: 7,
        revisions: 2,
        description:
          "Full-stack app: React plus a FastAPI backend and database, deployed to your cloud account.",
        includes: [
          "React frontend",
          "FastAPI backend",
          "Database",
          "Deployed to your cloud",
          "Source code",
        ],
        highlight: true,
      },
      {
        name: "Production-Ready",
        priceUsd: 240,
        priceInr: 20026,
        deliveryDays: 14,
        revisions: 3,
        description:
          "Complete production system: full-stack app, deployed, with CI/CD, environment config, monitoring and docs.",
        includes: [
          "Everything in Full-Stack + Deploy",
          "CI/CD pipeline",
          "Environment configuration",
          "Monitoring",
          "Documentation",
        ],
      },
    ],
  },
  {
    slug: "deployment",
    title: "Deployment & CI/CD",
    longTitle: "Deployment of your web app to AWS, Render, Railway or Vercel",
    category: "DevOps Engineering · CI/CD",
    summary:
      "For an app that already works locally and needs to be live, on your infrastructure, with a deploy path your team can repeat.",
    services: ["cloud-devops"],
    tiers: [
      {
        name: "Go Live",
        priceUsd: 30,
        priceInr: 2503,
        deliveryDays: 1,
        revisions: 2,
        description: "Your app deployed live to Render, Railway or Vercel with a working public URL.",
        includes: [
          "Functional environment",
          "Installation",
          "Configuration",
          "Source code",
          "Documentation",
        ],
      },
      {
        name: "Production",
        priceUsd: 66,
        priceInr: 5507,
        deliveryDays: 3,
        revisions: 3,
        description:
          "AWS or GCP deployment with Docker, environment config, HTTPS and your custom domain.",
        includes: [
          "Docker setup",
          "Environment configuration",
          "HTTPS and custom domain",
          "Source code",
          "Documentation",
        ],
        highlight: true,
      },
      {
        name: "Full Setup",
        priceUsd: 96,
        priceInr: 8010,
        deliveryDays: 5,
        revisions: 5,
        description:
          "Full setup: CI/CD from GitHub, staging plus production, monitoring, logs and a runbook.",
        includes: [
          "CI/CD from GitHub",
          "Staging and production",
          "Monitoring and logs",
          "Runbook",
          "Documentation",
        ],
      },
    ],
  },
];

export function getPackage(slug: string) {
  return packages.find((pkg) => pkg.slug === slug);
}

/** Lowest tier price across every package — the honest "from" number. */
export const lowestPackagePriceUsd = Math.min(
  ...packages.flatMap((pkg) => pkg.tiers.map((tier) => tier.priceUsd)),
);

/**
 * Work that does not fit a fixed package. No numbers here on purpose: these are
 * quoted after a call, and publishing an invented range would be a guess.
 */
export const customEngagements = [
  {
    title: "Larger builds",
    description:
      "Multi-month products, mobile apps, e-commerce platforms and learning systems. Scoped in writing first, then quoted as fixed-price milestones.",
    signal: "Quoted after a scoping call",
  },
  {
    title: "Agentic and autonomous systems",
    description:
      "Agents that carry out real operational work, with tool scoping, approval gates and run tracing. Priced against the process being replaced, not a page count.",
    signal: "Quoted after a scoping call",
  },
  {
    title: "Ongoing maintenance",
    description:
      "Monitoring, dependency and security updates, fixes and a monthly block of improvement hours, once something we built is live.",
    signal: "Monthly, agreed after launch",
  },
];

export const engagementNotes = [
  {
    title: "Fixed scope, fixed price",
    description:
      "Every package above is a defined deliverable at a defined price. You approve the scope before work starts, and the number does not move unless the scope does.",
  },
  {
    title: "Starting small",
    description:
      "Smaller, well-defined work runs as a single fixed-price package, invoiced on delivery. Most first-time clients start here before committing to a larger build.",
  },
  {
    title: "Larger engagements",
    description:
      "Bigger builds run as a direct contract with milestone invoicing — a deposit to start, then a payment per approved milestone. Same engineering, same process.",
  },
  {
    title: "Change requests",
    description:
      "Scope changes are normal. Anything outside the agreed package is quoted separately, cost and delivery impact in writing, and only built once you approve it.",
  },
];
