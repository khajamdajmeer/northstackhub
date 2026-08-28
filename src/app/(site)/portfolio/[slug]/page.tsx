import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  Handshake,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { getProject, projects, type Project } from "@/content/projects";
import { services } from "@/content/services";
import { CtaSection } from "@/components/site/cta-section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Screenshots are 1568×713 — roughly 2.2:1 — and every one is a full-page capture. */
const IMAGE_WIDTH = 1568;
const IMAGE_HEIGHT = 713;

/** Container content maxes out at 1088px; a related-work card at half of that. */
const HERO_SIZES = "(min-width: 1152px) 1088px, 100vw";
const RELATED_SIZES = "(min-width: 1152px) 532px, (min-width: 640px) 50vw, 100vw";

/** Project service labels are the canonical service titles, so an exact match resolves. */
function findService(label: string) {
  return services.find((service) => service.title === label);
}

function relatedProjects(current: Project) {
  return projects
    .filter((project) => project.slug !== current.slug)
    .sort((a, b) => {
      const aSameCategory = a.category === current.category ? 0 : 1;
      const bSameCategory = b.category === current.category ? 0 : 1;
      if (aSameCategory !== bSameCategory) return aSameCategory - bSameCategory;
      return b.year - a.year;
    })
    .slice(0, 2);
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {
      title: "Project not found",
      description: "This project write-up is no longer available.",
      robots: { index: false, follow: true },
    };
  }

  const title = `${project.name} — ${project.category}`;
  const image = {
    url: project.image,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    alt: project.imageAlt,
  };

  return {
    title,
    description: project.summary,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      type: "article",
      title: `${title} | ${siteConfig.name}`,
      description: project.summary,
      url: `${siteConfig.url}/portfolio/${project.slug}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.summary,
      images: [image],
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const index = projects.findIndex((item) => item.slug === project.slug);
  const previous = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;
  const related = relatedProjects(project);

  const meta = [
    { icon: Layers, label: "Category", value: project.category },
    { icon: CalendarClock, label: "Delivered", value: String(project.year) },
    { icon: Handshake, label: "Engagement", value: project.duration },
    ...(project.client
      ? [{ icon: Building2, label: "Client", value: project.client }]
      : []),
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />

        <Container className="relative py-14 sm:py-20">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All work
          </Link>

          <div className="mt-8 flex max-w-3xl flex-col items-start gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{project.category}</Badge>
              <Badge tone="neutral">{project.year}</Badge>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {project.name}
            </h1>

            <p className="text-lg leading-relaxed text-muted text-pretty">{project.summary}</p>
          </div>

          {/*
            `project.accent` is a literal Tailwind gradient class pair written out in full inside
            src/content/projects.ts. Tailwind v4 scans that source file, so these utilities are
            generated without a separate safelist — the strings there must stay complete,
            unconcatenated class names for this to hold. The wash frames the capture; the hairline
            border stops a light screenshot reading as a hole in a near-black page.
          */}
          <figure className="relative mt-12 flex flex-col gap-3">
            <div
              className={cn(
                "rounded-card border border-border bg-gradient-to-br p-2 sm:p-3",
                project.accent,
              )}
            >
              <div className="relative aspect-[1568/713] overflow-hidden rounded-lg border border-border bg-surface-2">
                <Image
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  sizes={HERO_SIZES}
                  priority
                  className="object-cover object-top"
                />
              </div>
            </div>
            <figcaption className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {project.name} · shipped {project.year}
            </figcaption>
          </figure>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-8 sm:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label} className="flex flex-col-reverse gap-1">
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium">
                  <item.icon className="size-3.5 shrink-0 text-brand" aria-hidden />
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <div className="flex flex-col gap-14">
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">The challenge</h2>
                <p className="text-base leading-relaxed text-muted text-pretty sm:text-lg">
                  {project.challenge}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What we did</h2>
                <ol className="flex flex-col gap-5">
                  {project.approach.map((step, stepIndex) => (
                    <li key={step} className="flex gap-4">
                      <span
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-soft font-mono text-xs font-medium text-brand-strong"
                        aria-hidden
                      >
                        {String(stepIndex + 1).padStart(2, "0")}
                      </span>
                      <p className="pt-1 text-base leading-relaxed text-muted text-pretty">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/*
                Scope, not results. This lists what was built and handed over — it is deliberately
                not a claim about what the build went on to achieve.
              */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    What was delivered
                  </h2>
                  <p className="text-sm leading-relaxed text-muted">
                    The scope that shipped — what exists in the build, not a claim about what it
                    went on to do.
                  </p>
                </div>

                <ul className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
                  {project.scope.map((item) => (
                    <li key={item} className="flex items-start gap-3 bg-surface p-5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      <span className="text-sm leading-relaxed text-foreground text-pretty">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Project facts
                </h2>

                <dl className="flex flex-col gap-4 text-sm">
                  {project.client ? (
                    <div className="flex flex-col gap-1">
                      <dt className="flex items-center gap-1.5 text-xs text-muted">
                        <Building2 className="size-3.5" aria-hidden />
                        Client
                      </dt>
                      <dd className="font-medium">{project.client}</dd>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <CalendarClock className="size-3.5" aria-hidden />
                      Delivered
                    </dt>
                    <dd className="font-medium">{project.year}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <Handshake className="size-3.5" aria-hidden />
                      Engagement
                    </dt>
                    <dd className="font-medium">{project.duration}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <Layers className="size-3.5" aria-hidden />
                      Category
                    </dt>
                    <dd className="font-medium">{project.category}</dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-3 border-t border-border pt-5">
                  <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    Stack
                  </h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {project.stack.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-5">
                  <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    Services used
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {project.services.map((label) => {
                      const service = findService(label);

                      return (
                        <li key={label}>
                          {service ? (
                            <Link
                              href={`/services/${service.slug}`}
                              className="group flex items-center justify-between gap-2 text-sm font-medium transition-colors hover:text-brand"
                            >
                              {label}
                              <ArrowUpRight
                                className="size-3.5 shrink-0 text-muted transition-colors group-hover:text-brand"
                                aria-hidden
                              />
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-muted">{label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-5">
                  <p className="text-sm leading-relaxed text-muted">
                    Similar scope on your side? We will tell you what this would cost and how long
                    it would take before you commit to anything.
                  </p>
                  <ButtonLink href="/contact" className="w-full">
                    Discuss your project
                    <ArrowRight className="size-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border py-14 sm:py-16">
        <Container>
          <h2 className="sr-only">Other projects</h2>
          <nav aria-label="Project navigation" className="grid gap-4 sm:grid-cols-2">
            {previous ? (
              <Link
                href={`/portfolio/${previous.slug}`}
                className="group flex flex-col gap-2 rounded-card border border-border bg-surface p-6 transition-colors hover:border-brand/40"
              >
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Previous
                </span>
                <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-brand">
                  {previous.name}
                </span>
                <span className="text-sm text-muted">{previous.category}</span>
              </Link>
            ) : null}

            {next ? (
              <Link
                href={`/portfolio/${next.slug}`}
                className="group flex flex-col items-end gap-2 rounded-card border border-border bg-surface p-6 text-right transition-colors hover:border-brand/40 sm:col-start-2"
              >
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                  Next
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
                <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-brand">
                  {next.name}
                </span>
                <span className="text-sm text-muted">{next.category}</span>
              </Link>
            ) : null}
          </nav>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Related work</h2>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              All work
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((item) => (
              <article
                key={item.slug}
                className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
              >
                {/* Gradient class pair comes from the literal `accent` string in src/content/projects.ts. */}
                <div
                  className={cn(
                    "border-b border-border bg-gradient-to-br p-2 sm:p-3",
                    item.accent,
                  )}
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface-2">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes={RELATED_SIZES}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-brand">
                      {item.category}
                    </span>
                    <span>{item.year}</span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    <Link
                      href={`/portfolio/${item.slug}`}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {item.name}
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">{item.summary}</p>
                  {item.client ? (
                    <span className="mt-auto pt-2 text-xs text-muted">Built for {item.client}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <CtaSection
        title={`Building something like ${project.name}?`}
        description="Tell us where you are — a running product, a stalled build or an empty repo — and you get a written scope and a realistic number within 24 hours."
      />
    </>
  );
}
