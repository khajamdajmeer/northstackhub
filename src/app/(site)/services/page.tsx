import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  Repeat,
  SquareStack,
  Users,
} from "lucide-react";

import { processSteps, techStack } from "@/content/company";
import { services, type Service } from "@/content/services";
import { packages, lowestPackagePriceUsd } from "@/content/pricing";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { ServiceIcon } from "@/components/site/service-icon";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Engineering services covering the whole product lifecycle — Next.js frontends, FastAPI and Node backends, RAG and agentic AI, data layers, payments, cloud deployment and ongoing maintenance. Four of them are available as fixed-price packages; the rest are quoted after scoping.",
};

/**
 * The pkg that sells this service as a fixed-price package, if one does. Where a
 * service appears in more than one pkg, prefer the pkg that actually contains the
 * package priced at the service's published starting price.
 */
function packageForService(service: Service) {
  const matches = packages.filter((pkg) => pkg.services.includes(service.slug));
  return (
    matches.find((pkg) => pkg.tiers.some((tier) => `$${tier.priceUsd}` === service.startingAt)) ??
    matches[0]
  );
}

const engagementModels = [
  {
    title: "Fixed-scope project",
    icon: SquareStack,
    description:
      "A written scope, a milestone schedule and one number you approve before work starts. Change requests are quoted separately, so the final invoice matches the first one.",
    bestFor: "Best for a defined build with a launch date",
  },
  {
    title: "Monthly retainer",
    icon: Repeat,
    description:
      "A recurring block of engineering hours with an agreed response window for production issues. Unused scope rolls into improvements rather than disappearing.",
    bestFor: "Best for live products that need steady attention",
  },
  {
    title: "Embedded squad",
    icon: Users,
    description:
      "One to three engineers inside your Slack and your sprint process, reporting the way your team already works. You direct the backlog, we bring the delivery process.",
    bestFor: "Best for in-house teams that need capacity now",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            Engineering that covers the <span className="text-gradient">whole stack</span>, not a
            slice of it
          </>
        }
        description="The same team designs the schema, writes the API, builds the interface and owns the deploy. That is the point: nothing gets dropped in the handoff between vendors, because there is no handoff."
      >
        <ButtonLink href="/contact" size="lg">
          Start a project
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/pricing" variant="secondary" size="lg">
          See pricing
        </ButtonLink>
      </PageHero>

      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="What we build"
            title={`${services.length} services, one delivery team`}
            description="Most engagements combine two or three of these. Pick the closest starting point — we scope the rest on the discovery call."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {services.map((service, index) => {
              const pkg = packageForService(service);

              return (
                /*
                  The card is not itself a link: the title carries the navigation and
                  stretches over the card, which leaves the package link below it
                  clickable instead of nested inside another anchor.
                */
                <div
                  key={service.slug}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <Card hover className="group relative flex h-full flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <ServiceIcon name={service.icon} className="shrink-0" />
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-lg font-semibold tracking-tight">
                          <Link
                            href={`/services/${service.slug}`}
                            className="transition-colors after:absolute after:inset-0 after:rounded-card group-hover:text-brand-strong"
                          >
                            {service.title}
                          </Link>
                        </h3>
                        <p className="text-sm leading-relaxed text-muted text-pretty">
                          {service.short}
                        </p>
                      </div>
                    </div>

                    <ul className="flex flex-wrap gap-2" aria-label={`${service.title} core stack`}>
                      {service.stack.slice(0, 3).map((item) => (
                        <li key={item}>
                          <Badge tone="neutral">{item}</Badge>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                      <span className="inline-flex items-center gap-2 text-muted">
                        <Clock className="size-4" aria-hidden />
                        {service.timeline}
                      </span>
                      {pkg ? (
                        <Link
                          href={`/pricing#${pkg.slug}`}
                          className="relative z-10 inline-flex items-center gap-2 font-medium text-brand underline-offset-4 hover:underline"
                        >
                          {service.startingAt
                            ? `Package from ${service.startingAt}`
                            : "Part of a fixed package"}
                          <ArrowUpRight className="size-4" aria-hidden />
                        </Link>
                      ) : (
                        <span className="text-muted">Quoted per project</span>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="How we work"
            title="Six steps from first call to handover"
            description="The same sequence on a three-week site and a fourteen-week platform. Only the length of step four changes."
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processSteps.map((step) => (
              <li
                key={step.step}
                className="rounded-card border border-border bg-background p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-brand">{step.step}</span>
                  <span className="text-xs text-muted">{step.duration}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                  {step.deliverable}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <ButtonLink href="/process" variant="outline">
              Read the full process
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Tooling"
            title="What we reach for, and why"
            description="Boring, well-supported tools with large hiring pools. We would rather you can replace us than be locked into something clever."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((group) => (
              <div key={group.group} className="rounded-card border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-muted">
                  {group.group}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Engagement models"
            title="Three ways to work with us"
            description="The engineering is identical in all three. What changes is how the work is scoped, billed and prioritised."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {engagementModels.map((model) => {
              const Icon = model.icon;
              return (
                <Card key={model.title} className="flex h-full flex-col gap-4 bg-background">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl border border-accent/30 bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{model.title}</h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">
                    {model.description}
                  </p>
                  <p className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
                    <CircleDollarSign className="size-4 shrink-0 text-brand" aria-hidden />
                    {model.bestFor}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/pricing">
              See the fixed-price packages
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <span className="text-sm text-muted">
              Packages start at ${lowestPackagePriceUsd}. Every model includes a 30-day warranty on what
              we ship.
            </span>
          </div>
        </Container>
      </Section>

      <CtaSection
        title="Not sure which service you need?"
        description="Describe the problem rather than the solution. We will tell you which of these it actually is — and if it is smaller than you think, we will say that too."
      />
    </>
  );
}
