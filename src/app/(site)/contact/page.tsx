import type { Metadata } from "next";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { siteConfig } from "@/config/site";
import { faqs } from "@/content/company";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell us what you are building and get a considered reply within four business hours — a written scope summary and a fixed quote follow the discovery call, with no obligation.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact | ${siteConfig.name}`,
    description:
      "Start a project with NorthStackHub. Replies within four business hours, a free 30-minute discovery call, and a written scope and quote within 24 hours of it.",
    url: `${siteConfig.url}/contact`,
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: `Contact ${siteConfig.name}`,
  url: `${siteConfig.url}/contact`,
  description:
    "Start a project with NorthStackHub — full-stack web application development, scoped and quoted in writing before any work begins.",
  mainEntity: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: siteConfig.email,
        telephone: siteConfig.phone,
        availableLanguage: ["English"],
        areaServed: "Worldwide",
      },
    ],
  },
};

const nextSteps = [
  {
    title: "We read it and reply",
    body: "Within four business hours you get a real answer from an engineer — not an auto-responder, and not a sales rep reading a script.",
  },
  {
    title: "A 30-minute discovery call",
    body: "We dig into what you are building, what it has to do on day one, and what it must not break. Free, and you are under no obligation afterwards.",
  },
  {
    title: "Written scope and quote in 24 hours",
    body: "You get the scope, the price, the milestones and the assumptions in writing — a document you can take to another agency if you would rather.",
  },
];

const checklist = [
  "What the product does, and who it is for.",
  "Anything that already exists — a repo, a Figma file, a live site, a spreadsheet you have outgrown.",
  "The one outcome that would make this project a success.",
  "Hard dates: a launch, a demo, an investor meeting, a contract renewal.",
  "Integrations you already depend on — payment provider, CRM, ERP, auth, analytics.",
  "Who will own the code and the cloud accounts after launch.",
];

export default function ContactPage() {
  const shortlist = faqs.slice(0, 4);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us what you are building.{" "}
            <span className="text-gradient">We will tell you what it takes.</span>
          </>
        }
        description="The fastest way in is a 30-minute call with the engineer who would build it. You get a straight answer about scope, cost and timeline — including when the honest answer is that we are not the right fit."
      >
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4 text-brand" aria-hidden />
          {siteConfig.responseTime}
        </span>
      </PageHero>

      {/* The call is the primary path on this page; the form below is the
          fallback for people who would rather write than talk. */}
      <Section className="pt-0">
        <Container>
          <div className="relative overflow-hidden rounded-card border border-brand/30 bg-brand-soft p-8 sm:p-10">
            <div className="glow pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand-strong">
                  <CalendarDays className="size-3.5" aria-hidden />
                  Free · 30 minutes · No obligation
                </span>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Book a discovery call
                </h2>
                <p className="mt-4 text-base leading-relaxed text-pretty text-brand-strong/90">
                  Pick a slot that suits you and bring whatever you have — a document, a sketch,
                  or a one-line idea. You leave with a rough scope, a rough number and an honest
                  read on whether we are the right team, and a written scope summary follows
                  within 24 hours.
                </p>

                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-strong/90">
                  {[
                    "Straight to an engineer, not a sales rep",
                    "Written scope within 24 hours",
                    "Yours to take elsewhere",
                  ].map((point) => (
                    <li key={point} className="inline-flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-brand-strong" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex shrink-0 flex-col gap-3">
                <ButtonLink href={siteConfig.links.calendar} external size="lg">
                  <CalendarDays className="size-4" aria-hidden />
                  See available times
                  <ExternalLink className="size-3.5" aria-hidden />
                </ButtonLink>
                <a
                  href="#write"
                  className="text-center text-sm text-brand-strong/80 underline-offset-4 hover:underline"
                >
                  or send a message instead
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="write" className="scroll-mt-20 border-t border-border pt-14">
        <Container>
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <Card className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold tracking-tight">
                  Rather write than talk?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Send the details instead and you get a considered reply within four business
                  hours. Fields marked <span className="text-warning">*</span> are required;
                  everything else helps, but nothing here is a qualification test.
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </Card>
            </div>

            <aside className="lg:col-span-2">
              <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                <Card>
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                    Reach us directly
                  </h2>
                  <ul className="mt-5 flex flex-col gap-4 text-sm">
                    <li className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <p className="font-medium">{siteConfig.responseTime}</p>
                        <p className="mt-1 text-muted">{siteConfig.hours}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <a
                          href={`mailto:${siteConfig.email}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {siteConfig.email}
                        </a>
                        <p className="mt-1 text-muted">
                          New projects, quotes and everything else
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <a
                          href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {siteConfig.phone}
                        </a>
                        <p className="mt-1 text-muted">Inside working hours</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <p className="font-medium">{siteConfig.location}</p>
                        <p className="mt-1 text-muted">
                          Daily written updates whatever your time zone.
                        </p>
                      </div>
                    </li>
                  </ul>
                </Card>

                <Card>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <div>
                      <h2 className="text-sm font-semibold">First time working with us?</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        Start with a fixed-price package rather than a build. Defined deliverable,
                        defined price, invoiced on delivery — and a 30-day warranty on everything
                        that ships.
                      </p>
                      <ButtonLink href="/pricing" variant="secondary" size="sm" className="mt-4">
                        See the packages
                      </ButtonLink>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                    What happens next
                  </h2>
                  <ol className="mt-5 flex flex-col gap-5">
                    {nextSteps.map((step, index) => (
                      <li key={step.title} className="flex gap-4">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong"
                          aria-hidden
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{step.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Before you write"
                title="What to include in your message"
                description="None of this is mandatory. It is simply what turns a two-line reply into a genuinely useful one."
              />
              <ul className="mt-8 flex flex-col gap-4">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span className="text-sm leading-relaxed text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <SectionHeading
                align="left"
                eyebrow="Common questions"
                title="Answered before you ask"
                description="The four we field most often. There are more on the pricing and process pages."
              />
              <dl className="mt-8 flex flex-col gap-6">
                {shortlist.map((faq) => (
                  <div key={faq.q} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <dt className="text-base font-medium">{faq.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
    </>
  );
}
