import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock,
  FileText,
  MessageSquare,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { processSteps } from "@/content/company";
import { projects } from "@/content/projects";
import { packages, type ServicePackage } from "@/content/pricing";
import { getService, services, type Service } from "@/content/services";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { ServiceIcon } from "@/components/site/service-icon";

type ProcessStep = (typeof processSteps)[number];
type Project = (typeof projects)[number];

/** Three across 1088px of container with 24px gutters — 346px per card at the top end. */
const CARD_SIZES = "(min-width: 1152px) 346px, (min-width: 1024px) 33vw, 100vw";

/** Case studies tag their services with the catalogue's own titles, so compare exactly. */
function relatedProjects(service: Service): Project[] {
  const matched = projects.filter((project) =>
    project.services.some((tag) => tag === service.title),
  );

  if (matched.length >= 2) return matched.slice(0, 3);

  const fallback = [...projects]
    .sort((a, b) => b.year - a.year)
    .filter((project) => !matched.includes(project));

  return [...matched, ...fallback].slice(0, 3);
}

/** Every pkg that delivers against this service — a service can sit inside more than one. */
function packagesForService(service: Service): ServicePackage[] {
  return packages.filter((pkg) => pkg.services.includes(service.slug));
}

function fromPriceUsd(pkg: ServicePackage) {
  return Math.min(...pkg.tiers.map((tier) => tier.priceUsd));
}

function deliveryRange(pkg: ServicePackage) {
  const days = pkg.tiers.map((tier) => tier.deliveryDays);
  const min = Math.min(...days);
  const max = Math.max(...days);
  return min === max ? `${min} days` : `${min}–${max} days`;
}

/** Retainers skip the fixed-scope build arc; project work runs the full sequence. */
function timelineSteps(service: Service): ProcessStep[] {
  if (service.timeline === "Ongoing") {
    return [processSteps[0], processSteps[1], processSteps[3], processSteps[5]];
  }
  return processSteps.slice(0, 6);
}

export async function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const url = `${siteConfig.url}/services/${service.slug}`;

  return {
    title: service.title,
    description: service.short,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: `${service.title} · ${siteConfig.name}`,
      description: service.short,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) notFound();

  const steps = timelineSteps(service);
  const related = relatedProjects(service);
  const relatedPackages = packagesForService(service);
  const otherServices = services.filter((item) => item.slug !== service.slug).slice(0, 3);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `${service.title} — frequently asked questions`,
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHero
        eyebrow="Service"
        title={
          <span className="flex flex-col gap-5">
            <ServiceIcon name={service.icon} className="size-14 rounded-2xl" />
            {service.title}
          </span>
        }
        description={service.summary}
      >
        <ButtonLink href="/contact" size="lg">
          Scope this project
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href={siteConfig.links.calendar} variant="secondary" size="lg" external>
          <CalendarDays className="size-4" aria-hidden />
          Book a 30-min call
        </ButtonLink>
        <span className="flex flex-wrap gap-2">
          <Badge tone="neutral">
            <Clock className="size-3.5" aria-hidden />
            {service.timeline}
          </Badge>
          <Badge>
            <CircleDollarSign className="size-3.5" aria-hidden />
            {service.startingAt ? `Packages from ${service.startingAt}` : "Quoted per project"}
          </Badge>
        </span>
      </PageHero>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
            <div className="flex flex-col gap-14">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What you get</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted text-pretty">
                  The outcomes we hold ourselves to on this work. If we cannot commit to them for
                  your project, we say so during scoping rather than after the invoice.
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {service.outcomes.map((outcome) => (
                    <li
                      key={outcome}
                      className="flex items-start gap-3 rounded-card border border-border bg-surface p-4"
                    >
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Deliverables</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted text-pretty">
                  Everything on this list is handed over and documented. Anything outside it is
                  quoted before it is built.
                </p>
                <ul className="mt-7 divide-y divide-border rounded-card border border-border bg-surface">
                  {service.deliverables.map((deliverable) => (
                    <li key={deliverable} className="flex items-start gap-3 px-5 py-4">
                      <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      <span className="text-sm leading-relaxed text-pretty">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Typical timeline
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted text-pretty">
                  {service.timeline === "Ongoing"
                    ? "Retainers start with the same discovery and written agreement as a project, then settle into a monthly cycle."
                    : `Most engagements of this type run ${service.timeline} end to end. Step four absorbs the difference between the short and long end of that range.`}
                </p>
                <ol className="mt-7 flex flex-col gap-4 border-l border-border pl-6">
                  {steps.map((step) => (
                    <li key={step.step} className="relative">
                      <span
                        className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full border-2 border-brand bg-background"
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                        <span className="text-xs text-muted">{step.duration}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                        {step.description}
                      </p>
                      <p className="mt-2 text-xs text-brand-strong">You receive: {step.deliverable}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Questions we get asked
                </h2>
                <dl className="mt-7 flex flex-col gap-6">
                  {service.faqs.map((faq) => (
                    <div
                      key={faq.q}
                      className="rounded-card border border-border bg-surface p-6"
                    >
                      <dt className="text-base font-semibold tracking-tight text-pretty">
                        {faq.q}
                      </dt>
                      <dd className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                        {faq.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="flex flex-col gap-6">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                    Stack we use here
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {service.stack.map((item) => (
                      <li key={item}>
                        <Badge tone="neutral">{item}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <dl className="grid gap-4 border-t border-border pt-6 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="inline-flex items-center gap-2 text-muted">
                      <CircleDollarSign className="size-4" aria-hidden />
                      Price
                    </dt>
                    <dd className="font-semibold">
                      {service.startingAt ? `From ${service.startingAt}` : "Scoped on a call"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="inline-flex items-center gap-2 text-muted">
                      <Clock className="size-4" aria-hidden />
                      Timeline
                    </dt>
                    <dd className="font-semibold">{service.timeline}</dd>
                  </div>
                </dl>

                {relatedPackages.length > 0 ? (
                  <div className="flex flex-col gap-3 border-t border-border pt-6">
                    <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                      {relatedPackages.length === 1 ? "Fixed-price package" : "Fixed-price packages"}
                    </h2>
                    {relatedPackages.map((pkg) => (
                      <div
                        key={pkg.slug}
                        className="flex flex-col gap-2 rounded-card border border-border bg-surface-2 p-4"
                      >
                        <p className="text-sm font-semibold tracking-tight">{pkg.title}</p>
                        <p className="font-mono text-xs text-muted">
                          from ${fromPriceUsd(pkg)} · {deliveryRange(pkg)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <Link
                            href={`/pricing#${pkg.slug}`}
                            className="font-medium text-brand underline-offset-4 hover:underline"
                          >
                            See what is included
                          </Link>
                          <Link
                            href="/pricing"
                            className="text-muted underline-offset-4 hover:text-foreground hover:underline"
                          >
                            All packages
                          </Link>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="border-t border-border pt-6 text-sm leading-relaxed text-muted">
                    This one is not sold as a fixed package. Describe the scope and you get a written
                    summary and a fixed-price proposal against it.
                  </p>
                )}

                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  <ButtonLink href={siteConfig.links.calendar} external className="w-full">
                    <CalendarDays className="size-4" aria-hidden />
                    Book a call
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="secondary" className="w-full">
                    <MessageSquare className="size-4" aria-hidden />
                    Send us the details
                  </ButtonLink>
                  <p className="text-xs leading-relaxed text-muted">
                    {siteConfig.responseTime}. Prefer email? {siteConfig.email}
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Related work"
            title="Where this has shipped"
            description="Case studies with the numbers we measured, including the ones that did not move."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {related.map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="group flex flex-col overflow-hidden rounded-card border border-border bg-background transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
              >
                {/*
                  Same treatment as the home page work preview: `project.accent` is a
                  literal Tailwind gradient pair written out in src/content/projects.ts,
                  the wash frames the capture, and the hairline border keeps a light
                  screenshot off the canvas.
                */}
                <div className={cn("border-b border-border bg-gradient-to-br p-2 sm:p-3", project.accent)}>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface-2">
                    <Image
                      src={project.image}
                      alt={project.imageAlt}
                      fill
                      sizes={CARD_SIZES}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone="neutral">{project.category}</Badge>
                    <span className="text-xs text-muted">{project.year}</span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-brand-strong">
                    {project.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">
                    {project.summary}
                  </p>
                  <p className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                    <span className="text-muted">{project.duration}</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-brand">
                      Read case study
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <ButtonLink href="/portfolio" variant="outline">
              All case studies
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Other services"
            title="Usually paired with this"
            description="Most projects combine two or three of these. We scope them as one engagement rather than separate invoices."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {otherServices.map((other) => (
              <Link key={other.slug} href={`/services/${other.slug}`} className="group rounded-card">
                <Card hover className="flex h-full flex-col gap-4">
                  <ServiceIcon name={other.icon} />
                  <h3 className="text-base font-semibold tracking-tight transition-colors group-hover:text-brand-strong">
                    {other.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">{other.short}</p>
                  <p className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                    <span className="text-muted">{other.timeline}</span>
                    <span className="font-medium">
                      {other.startingAt ? `From ${other.startingAt}` : "Quoted per project"}
                    </span>
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <ButtonLink href="/services" variant="ghost">
              <ArrowLeft className="size-4" aria-hidden />
              Back to all services
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaSection
        title={`Need ${service.title.toLowerCase()}?`}
        description={
          service.startingAt
            ? `Tell us what you are working with — existing code, a blank repo, or a deadline you are worried about. Packages for this start at ${service.startingAt}, and anything outside them gets a written scope and a number within 24 hours.`
            : "Tell us what you are working with — existing code, a blank repo, or a deadline you are worried about. This one is quoted per project: you get a written scope and a fixed number within 24 hours."
        }
      />
    </>
  );
}
