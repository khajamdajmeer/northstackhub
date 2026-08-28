import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Info,
  RefreshCcw,
  X,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import {
  currencyNote,
  customEngagements,
  engagementNotes,
  packages,
  lowestPackagePriceUsd,
  type ServicePackage,
} from "@/content/pricing";
import { faqs } from "@/content/company";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { CtaSection } from "@/components/site/cta-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const packageCount = packages.reduce((total, pkg) => total + pkg.tiers.length, 0);

function fromPriceUsd(pkg: ServicePackage) {
  return Math.min(...pkg.tiers.map((tier) => tier.priceUsd));
}

function deliveryRange(pkg: ServicePackage) {
  const days = pkg.tiers.map((tier) => tier.deliveryDays);
  const min = Math.min(...days);
  const max = Math.max(...days);
  return min === max ? `${min} days` : `${min}–${max} days`;
}

export const metadata: Metadata = {
  title: "Pricing & packages",
  description: `Real fixed-price packages from $${lowestPackagePriceUsd} — RAG chatbots, full-stack web applications and deployment with CI/CD. Every price, delivery time and revision count is the one you will be quoted.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: `Pricing & packages | ${siteConfig.name}`,
    description: `Real fixed-price packages from $${lowestPackagePriceUsd}. Larger builds are scoped and quoted after a call.`,
    url: `${siteConfig.url}/pricing`,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

/**
 * One Product per package, one Offer per tier. Prices and delivery times come
 * straight from the package data, so the markup cannot drift away from what the
 * page renders. Each offer points at its own anchor on this page.
 */
const productSchema = {
  "@context": "https://schema.org",
  "@graph": packages.map((pkg) => ({
    "@type": "Product",
    name: pkg.title,
    description: pkg.summary,
    category: pkg.category,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: pkg.tiers.map((tier) => ({
      "@type": "Offer",
      name: `${pkg.title} — ${tier.name}`,
      description: tier.description,
      price: tier.priceUsd,
      priceCurrency: "USD",
      url: `${siteConfig.url}/pricing#${pkg.slug}`,
      availability: "https://schema.org/InStock",
      deliveryLeadTime: {
        "@type": "QuantitativeValue",
        value: tier.deliveryDays,
        unitCode: "DAY",
      },
    })),
  })),
};

const notIncluded = [
  {
    title: "Theme and page-builder edits",
    body: "Recolouring a WordPress, Wix or Shopify theme is real work, just not ours. We write applications; someone who lives in that platform will be faster and cheaper at it.",
  },
  {
    title: "Brand identity from scratch",
    body: "We design interfaces, and we build 3D and motion work on top of an existing identity. Logos, brand books and naming belong with a brand studio, and we are happy to work alongside one.",
  },
  {
    title: "Game engines and AR",
    body: "We build cross-platform mobile apps in React Native and WebGL scenes with three.js. Unity, Unreal, AR and anything built around low-level sensor work belongs with a specialist studio.",
  },
  {
    title: "Paid-ads management",
    body: "We ship the landing pages, the analytics and the conversion tracking. Running ad accounts month to month is a different discipline and we are not it.",
  },
  {
    title: "Rescue jobs with no access",
    body: "We can take over an existing codebase, but not without the repository, the cloud accounts and some way to reconstruct the previous developer's decisions.",
  },
  {
    title: "Fixed price on undefined scope",
    body: "If nobody can say what done looks like, a fixed number is a guess dressed up as a commitment. We propose a paid scoping phase instead, then quote against its output.",
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <PageHero
        eyebrow="Pricing"
        title={
          <>
            The packages we <span className="text-gradient">actually sell</span>
          </>
        }
        description={`${packages.length} services, ${packageCount} packages, starting at $${lowestPackagePriceUsd}. Each one has a defined deliverable, a delivery time and a revision count — the same numbers that go into your quote, because this page is built from them.`}
      >
        <ButtonLink href="#packages" size="lg">
          Browse the packages
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/contact" variant="secondary" size="lg">
          Quote something larger
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </PageHero>

      <Section id="packages" className="scroll-mt-20">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Fixed-price packages"
            title={`${packageCount} packages you can buy today`}
            description="Pick the package that matches your scope and the delivery clock starts the day it is agreed. If your project is bigger than the largest package, skip to the custom section further down."
          />

          <div className="mt-10 flex flex-col gap-3 rounded-card border border-brand/30 bg-brand-soft p-5 sm:flex-row sm:items-start">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden />
            <p className="text-sm leading-relaxed text-brand-strong">{currencyNote}</p>
          </div>

          <nav aria-label="Jump to a package" className="mt-8">
            <ul className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
              {packages.map((pkg) => (
                <li key={pkg.slug}>
                  <a
                    href={`#${pkg.slug}`}
                    className="flex h-full flex-col gap-1 bg-surface p-5 transition-colors hover:bg-surface-2"
                  >
                    <span className="text-sm font-semibold tracking-tight">{pkg.title}</span>
                    <span className="font-mono text-xs text-muted">
                      from ${fromPriceUsd(pkg)} · {deliveryRange(pkg)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>

      {packages.map((pkg, index) => {
        return (
          <Section
            key={pkg.slug}
            id={pkg.slug}
            className={cn(
              "scroll-mt-20 border-b border-border",
              index % 2 === 0 && "bg-surface",
            )}
          >
            <Container>
              <div className="grid items-start gap-8">
                <div className="flex max-w-3xl flex-col gap-5">
                  <Badge tone="accent" className="self-start">
                    {pkg.category}
                  </Badge>
                  <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {pkg.title}
                  </h2>
                  <p className="text-base leading-relaxed text-muted text-pretty">{pkg.summary}</p>

                  <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-border bg-border">
                    <div className="flex flex-col gap-1 bg-background p-4">
                      <dt className="text-xs uppercase tracking-wide text-muted">From</dt>
                      <dd className="text-base font-semibold sm:text-lg">${fromPriceUsd(pkg)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 bg-background p-4">
                      <dt className="text-xs uppercase tracking-wide text-muted">Delivery</dt>
                      <dd className="text-base font-semibold sm:text-lg">{deliveryRange(pkg)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 bg-background p-4">
                      <dt className="text-xs uppercase tracking-wide text-muted">Packages</dt>
                      <dd className="text-base font-semibold sm:text-lg">{pkg.tiers.length}</dd>
                    </div>
                  </dl>

                  <p className="text-sm leading-relaxed text-muted text-pretty">
                    Scoped and delivered as {pkg.longTitle.charAt(0).toLowerCase()}
                    {pkg.longTitle.slice(1)}.
                  </p>
                </div>
              </div>

              <Reveal stagger={0.06} className="mt-10 grid gap-5 lg:grid-cols-3">
                {pkg.tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={
                      tier.highlight
                        ? "relative flex flex-col rounded-card border border-brand/50 bg-background p-6 ring-1 ring-brand/30"
                        : "relative flex flex-col rounded-card border border-border bg-background p-6"
                    }
                  >
                    {tier.highlight ? (
                      <div className="absolute -top-3 left-6">
                        <Badge>Recommended</Badge>
                      </div>
                    ) : null}

                    <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>

                    <div className="mt-4 flex flex-col gap-0.5">
                      <span className="text-4xl font-semibold tracking-tight">
                        ${tier.priceUsd}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        ₹{inr.format(tier.priceInr)} on the pkg
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <dt className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <Clock className="size-3.5" aria-hidden />
                          Delivery
                        </dt>
                        <dd className="font-medium">
                          {tier.deliveryDays} {tier.deliveryDays === 1 ? "day" : "days"}
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <RefreshCcw className="size-3.5" aria-hidden />
                          Revisions
                        </dt>
                        <dd className="font-medium">{tier.revisions}</dd>
                      </div>
                    </dl>

                    <p className="mt-5 text-sm leading-relaxed text-muted text-pretty">
                      {tier.description}
                    </p>

                    <ul className="mt-5 flex flex-1 flex-col gap-3">
                      {tier.includes.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          <span className="text-pretty">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <ButtonLink
                      href={`/contact?package=${pkg.slug}&tier=${encodeURIComponent(tier.name)}`}
                      variant={tier.highlight ? "primary" : "secondary"}
                      className="mt-8 w-full"
                    >
                      Request {tier.name}
                      <ArrowRight className="size-4" aria-hidden />
                    </ButtonLink>
                  </div>
                ))}
              </Reveal>
            </Container>
          </Section>
        );
      })}

      <Section>
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Beyond the packages"
            title="Work that gets quoted, not listed"
            description="Some builds do not fit a package, and putting a number on them here would be a guess. These are scoped in writing first, then priced against that scope."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {customEngagements.map((engagement) => (
              <Card key={engagement.title} className="flex h-full flex-col gap-4">
                <h3 className="text-lg font-semibold tracking-tight">{engagement.title}</h3>
                <p className="text-sm leading-relaxed text-muted text-pretty">
                  {engagement.description}
                </p>
                <p className="mt-auto border-t border-border pt-4 text-sm font-medium text-brand-strong">
                  {engagement.signal}
                </p>
                <ButtonLink href="/contact" variant="outline" className="w-full">
                  Describe the project
                  <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="How buying works"
            title="Scope, payment and changes"
            description="Four things worth knowing before you order, whether you go through the marketplace or contract directly."
          />

          <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-border bg-border md:grid-cols-2">
            {engagementNotes.map((note) => (
              <div key={note.title} className="flex flex-col gap-3 bg-background p-6">
                <h3 className="text-base font-semibold tracking-tight">{note.title}</h3>
                <p className="text-sm leading-relaxed text-muted text-pretty">{note.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Honesty first"
            title="What we do not do"
            description="Turning down the wrong project is cheaper for everyone than discovering the mismatch in week three. Here is where we are the wrong call."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notIncluded.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted">
                  <X className="size-4" aria-hidden />
                </span>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted text-pretty">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted">
            If your project lands in one of these, say so on the call anyway. We keep a short list of
            people we trust for the work we do not take, and we will point you at them.
          </p>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <SectionHeading
            eyebrow="FAQ"
            title="Questions we get asked"
            description={`If yours is not here, email ${siteConfig.email} and we will answer it directly.`}
          />
          <div className="mx-auto mt-12 max-w-3xl">
            <FaqAccordion items={faqs} />
          </div>

          <p className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm text-muted">
            <CalendarDays className="size-4 shrink-0 text-brand" aria-hidden />
            Prefer to talk it through before ordering?
            <a
              href={siteConfig.links.calendar}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Book a 30-minute call
            </a>
          </p>
        </Container>
      </Section>

      <CtaSection
        title="Bigger than the biggest package?"
        description="Send the scope, or the rough shape of one. You get a written summary, a fixed-price proposal against it, and an honest read on whether we are the right team."
      />
    </>
  );
}
