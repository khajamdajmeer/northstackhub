import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Globe,
  MapPin,
  Star,
} from "lucide-react";
import { siteConfig, principles } from "@/config/site";
import {
  serviceCategories,
  servicesByCategory,
  type ServiceCategory,
} from "@/content/services";
import { values, techStack } from "@/content/company";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { CtaSection } from "@/components/site/cta-section";
import { ServiceIcon } from "@/components/site/service-icon";

const description =
  "NorthStackHub is a small, remote-first software studio running on three promises — one project at a time, built to last, and no chasing us for an update. We build web and mobile applications, RAG and agentic AI systems, role-based platforms, learning products and interactive 3D work for founders and product teams worldwide.";

export const metadata: Metadata = {
  title: "About us",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About us | ${siteConfig.name}`,
    description,
    url: `${siteConfig.url}/about`,
  },
};

const categoryNotes: Record<ServiceCategory, string> = {
  "Product engineering": "The whole product — web, mobile, commerce and learning.",
  "AI systems": "Retrieval and agents built to be measured, not demoed.",
  "Platform & data": "The layer underneath: APIs, data, access control, infrastructure.",
  Experience: "How it looks, how it moves, how fast it loads.",
};

const clientSources: {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
}[] = [
  {
    title: "Direct",
    body: "Where most first projects start. A written scope and fixed milestones before any money moves, so the first engagement is low risk for someone who has never worked with us.",
    href: "/contact",
    linkLabel: "Start a project",
  },
  {
    title: "Upwork",
    body: "For clients whose procurement already runs through it, or who prefer an hourly contract for discovery and audit work before committing to a build.",
    href: siteConfig.links.upwork,
    linkLabel: "See our Upwork agency",
  },
  {
    title: "Referrals",
    body: "A large share of our work is repeat business or someone passing our name to a founder they know. It is the reason we can be selective about which projects we take.",
  },
  {
    title: "Direct enquiries",
    body: "Larger builds and retainers usually run as direct contracts with milestone invoicing. Same team, same process, fewer platform fees in the middle.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            Three promises we <span className="text-gradient">actually run on</span>
          </>
        }
        description="These are commitments, not a strapline. They decide how many projects we take at once, what ships with every build, and what you hear from us on a Friday. This page explains what each one costs us and what it buys you."
      >
        <ButtonLink href="/contact" size="lg">
          Work with us
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/portfolio" variant="secondary" size="lg">
          See our work
        </ButtonLink>
      </PageHero>

      {/* The principles are the spine of the studio, so they get the space to
          read as a statement rather than as three cards in a row. */}
      <Section className="py-16 sm:py-24">
        <Container>
          <div className="flex flex-col gap-4">
            <Badge tone="neutral">What we run on</Badge>
            <p className="max-w-3xl text-lg leading-relaxed text-muted text-pretty">
              Every decision in a project comes back to one of these three. When we turn work down,
              when we push a date, when we argue about a schema — this is the reasoning underneath.
            </p>
          </div>

          <ol className="mt-16 flex flex-col">
            {principles.map((principle) => (
              <li
                key={principle.word}
                className="border-t border-border py-14 first:border-t-0 first:pt-0 sm:py-20"
              >
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
                  <div>
                    <span className="font-mono text-sm tracking-[0.2em] text-brand">
                      {principle.index}
                    </span>
                    <h2 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                      {principle.word}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-6 lg:pt-8">
                    <p className="text-2xl font-medium leading-snug tracking-tight text-balance sm:text-3xl">
                      {principle.headline}
                    </p>
                    <div className="rule-fade" aria-hidden />
                    <p className="text-base leading-relaxed text-muted text-pretty sm:text-lg">
                      {principle.description}
                    </p>
                    <p className="flex items-start gap-3 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      <span className="font-medium text-pretty">{principle.proof}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <SectionHeading align="left" eyebrow="Our story" title="How the studio works" />

              <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed text-muted text-pretty">
                <p>
                  NorthStackHub has been remote-first since {siteConfig.founded}. We are a small,
                  senior team — everyone here has shipped and then operated production software, and
                  the person on your call is the person writing the code. Staying small is
                  deliberate: it is the only way one team can hold the whole picture of what it is
                  building.
                </p>
                <p>
                  We work with founders and product teams worldwide, in one language across the
                  stack where we can. Most engagements start as a direct enquiry —
                  often something small, because people sensibly want to see how we work before
                  handing over a product — and a good number grow into retainers that run for years.
                </p>
                <p>
                  What we do has widened since we started. Alongside web applications we now build
                  Android and iOS apps, retrieval systems and knowledge assistants, agentic modules,
                  role-based access layers, learning platforms and interactive 3D work. The stack
                  changed; the way a project runs did not. Scope in writing first, a staging URL in
                  week one, tests and documentation shipped with the build rather than promised
                  after it.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="flex items-start gap-4 bg-background">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <h3 className="text-sm font-medium">Where we are</h3>
                  <p className="mt-1 text-sm text-muted">{siteConfig.location}</p>
                </div>
              </Card>
              <Card className="flex items-start gap-4 bg-background">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <h3 className="text-sm font-medium">Working hours</h3>
                  <p className="mt-1 text-sm text-muted">{siteConfig.hours}</p>
                </div>
              </Card>
              <Card className="flex items-start gap-4 bg-background">
                <Globe className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <h3 className="text-sm font-medium">How to reach us</h3>
                  <p className="mt-1 text-sm text-muted">
                    {siteConfig.email} · {siteConfig.responseTime}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Capability"
            title="What we build"
            description="Fourteen services in four groups. Most projects pull from more than one — a mobile app needs an API and an access model, an assistant needs somewhere for its documents to live."
          />

          <div className="mt-12 flex flex-col gap-14">
            {serviceCategories.map((category) => {
              const items = servicesByCategory(category);
              return (
                <div key={category}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                      {category}
                    </h3>
                    <p className="text-sm text-muted">{categoryNotes[category]}</p>
                  </div>
                  <div className="mt-3 rule-fade" aria-hidden />

                  <div className="mt-6 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
                    {items.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        className="group flex gap-4 bg-background p-6 transition-colors hover:bg-surface"
                      >
                        <ServiceIcon name={service.icon} className="size-10 shrink-0" />
                        <div>
                          <h4 className="flex items-center gap-1.5 text-base font-semibold">
                            {service.title}
                            <ArrowUpRight
                              className="size-4 text-muted transition-colors group-hover:text-brand"
                              aria-hidden
                            />
                          </h4>
                          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                            {service.short}
                          </p>
                          <p className="mt-3 text-sm text-brand-strong">
                            {service.startingAt ? `From ${service.startingAt}` : "Quoted per project"}{" "}
                            · {service.timeline}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12">
            <ButtonLink href="/services" variant="secondary">
              All services in detail
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface py-14 sm:py-16">
        <Container>
          <dl className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {siteConfig.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 bg-background px-6 py-8 text-center"
              >
                <dt className="order-2 text-sm text-muted">{stat.label}</dt>
                <dd className="order-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-center text-xs text-muted">
            Figures cover work delivered since {siteConfig.founded} across direct contracts and
            marketplace engagements.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Tooling"
            title="What we build with"
            description="We pick well-supported tools and go deep on them. Nothing here was chosen because it is new, and nothing gets added to the list until we have run it in production."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((group) => (
              <div key={group.group} className="rounded-card border border-border bg-surface p-6">
                <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                  {group.group}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted">
            If your team already runs on something else, we will work in your stack rather than
            insist on ours. Migrating a codebase to suit a vendor is rarely in the client&apos;s
            interest.
          </p>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            eyebrow="What we hold to"
            title="Four things we do not trade away"
            description="The principles say how we work. These are the specific commitments that follow from them, and they hold whether the project is a three-week site or a year-long product."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title} hover className="bg-background">
                <h3 className="text-lg font-semibold tracking-tight">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{value.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="In their words"
            title="References, not a wall of quotes"
            description="We do not reprint client quotes here. Anyone can typeset a testimonial, and a quote we chose and formatted ourselves proves very little. If you want to know what we are like to work with, we would rather put you on a call with someone who has."
          />

          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 text-center">
            <p className="text-sm leading-relaxed text-muted">
              If you want to hear from someone we have worked with directly, ask on the
              discovery call and we will put you in touch.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact" variant="secondary">
                <Star className="size-4" aria-hidden />
                Ask for a reference
              </ButtonLink>
              <ButtonLink href={siteConfig.links.calendar} variant="outline" external>
                Book a discovery call
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Channels"
            title="Where our clients come from"
            description="We do not run outbound sales. Work arrives through four routes, and the engineering is the same on all of them."
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {clientSources.map((source) => (
              <div
                key={source.title}
                className="flex flex-col rounded-card border border-border bg-background p-6"
              >
                <h3 className="text-base font-semibold">{source.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{source.body}</p>
                {source.href ? (
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-strong transition-colors hover:text-brand"
                  >
                    {source.linkLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
            Smaller projects run as a single fixed-price package, invoiced on delivery — enough to
            see how we work without committing to a build. Once there is a working relationship,
            most clients move to a direct contract with milestone invoicing. You can start on
            either side and move later.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contact">Start a project</ButtonLink>
            <ButtonLink href={siteConfig.links.calendar} variant="secondary" external>
              <CalendarDays className="size-4" aria-hidden />
              Book a call
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline">
              See the packages
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaSection
        title="Tell us what you are building"
        description="A short description is enough to start. You get a written scope summary and a realistic number within 24 hours, and it is yours whether or not we work together."
      />
    </>
  );
}
