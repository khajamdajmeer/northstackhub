import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock,
  FileCode,
  FlaskConical,
  GitPullRequest,
  Gauge,
  Handshake,
  Mail,
  MessageSquare,
  MonitorPlay,
  Package,
  Ruler,
  ShieldCheck,
  Undo2,
  Video,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { processSteps, differentiators } from "@/content/company";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { CtaSection } from "@/components/site/cta-section";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "The six stages of a NorthStackHub engagement: discovery, fixed scope, architecture, weekly sprints, hardening and handover. Plus how we communicate, estimate and gate quality.",
  alternates: { canonical: "/process" },
  openGraph: {
    title: `How we work | ${siteConfig.name}`,
    description:
      "Discovery, fixed scope, architecture, weekly sprints, hardening and handover — how a project actually runs with us.",
    url: `${siteConfig.url}/process`,
  },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: `How ${siteConfig.name} delivers a project`,
  description:
    "The six stages of a NorthStackHub engagement, from the first discovery call through to handover and ongoing support.",
  totalTime: "P8W",
  step: processSteps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.title,
    text: step.description,
    url: `${siteConfig.url}/process#step-${step.step}`,
  })),
};

const weeklyRhythm = [
  {
    icon: MonitorPlay,
    title: "A staging URL that is current",
    body: "Deployed from the main branch on every merge. You can open it any day of the week and see exactly where the build stands, on your phone or your laptop.",
  },
  {
    icon: Mail,
    title: "A written update every Friday",
    body: "What shipped, what is next week, what is blocked and anything that moved the estimate. Three minutes to read, archived so you can look back at any point.",
  },
  {
    icon: Video,
    title: "A demo or a recorded walkthrough",
    body: "A live call if the week's work needs discussion, a five-minute Loom if it does not. Either way you see the software running before you are asked to sign anything off.",
  },
];

const commsChannels = [
  {
    title: "Slack or your existing channel",
    body: "We join your workspace as guests, or set up a shared channel. If your team lives in Teams or Discord, we use that instead. We do not ask you to adopt a new tool for our convenience.",
  },
  {
    title: "Email for anything contractual",
    body: "Scope changes, approvals and invoices go to email so there is a searchable record outside a chat history that may get archived.",
  },
  {
    title: "Loom for anything visual",
    body: "Explaining a UI decision or a bug is faster in two minutes of screen recording than in twenty messages. You can watch it whenever your day allows.",
  },
];

const estimationSteps = [
  {
    title: "Break it into things that can be finished",
    body: "We decompose the scope into units small enough to complete in under two days. Anything bigger than that is not an estimate, it is a hope.",
  },
  {
    title: "Price the unknowns separately",
    body: "A third-party API nobody on the team has used, a legacy database with no documentation, an unclear compliance requirement. These get flagged and either time-boxed or moved into a paid spike.",
  },
  {
    title: "Add the work everyone forgets",
    body: "Empty states, error handling, admin screens, migrations, staging environments, code review and QA. In most projects this is 30 to 40 percent of the build and it is the usual reason quotes go wrong.",
  },
  {
    title: "Quote a range, then commit to a number",
    body: "You see the range and what would push the project to the top of it. Once the scope is signed, the number is fixed and the risk of being wrong is ours.",
  },
];

const qualityGates = [
  {
    icon: FlaskConical,
    title: "Tests run in CI",
    body: "Unit tests on business logic, integration tests on API endpoints, Playwright on the paths that make money. A red pipeline blocks the merge, no exceptions for deadlines.",
  },
  {
    icon: GitPullRequest,
    title: "Every change is reviewed",
    body: "Nothing reaches main without a second engineer reading it. Reviews cover correctness, naming and whether the next person will understand it in six months.",
  },
  {
    icon: Gauge,
    title: "Performance budgets",
    body: "Bundle size and Core Web Vitals thresholds are checked on each pull request. If a change makes the app measurably slower, we deal with it before it ships, not after launch.",
  },
  {
    icon: ShieldCheck,
    title: "Security review before launch",
    body: "Auth and permission paths, input validation, dependency audit, secret handling, rate limiting and the OWASP basics. Findings are written up and fixed, not just noted.",
  },
  {
    icon: Undo2,
    title: "A rollback plan that has been tested",
    body: "Reversible migrations, versioned deploys and a documented way back to the previous release. We practise the rollback on staging before the production deploy.",
  },
  {
    icon: FileCode,
    title: "Errors go somewhere a human looks",
    body: "Sentry or an equivalent wired up before launch day, with alerts routed to a channel your team can see. Silent failures are the ones that cost the most.",
  },
];

const handoverItems = [
  {
    icon: Package,
    title: "Documentation written for the next engineer",
    body: "Architecture overview, data model, environment variables, deployment steps and the decisions we made along with why. Kept in your repository, not in a wiki you lose access to.",
  },
  {
    icon: Video,
    title: "A recorded walkthrough",
    body: "A screen recording covering the codebase layout, how to run it locally, how to deploy and how to handle the routine operational tasks. Your team can rewatch it when someone new joins.",
  },
  {
    icon: ShieldCheck,
    title: "30-day warranty",
    body: "Defects in what we shipped get fixed at no cost for 30 days after launch. That covers bugs in our work, not new features or changes of mind.",
  },
  {
    icon: Handshake,
    title: "No lock-in, by design",
    body: "Your repository, your cloud accounts, your domain, standard open-source tooling throughout. If you want to move to an in-house team or another agency, everything you need is already yours.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <PageHero
        eyebrow="How we work"
        title={
          <>
            A process you can <span className="text-gradient">check on any day</span>
          </>
        }
        description="Six stages, each with a duration and something you receive at the end of it. No black box, no status percentages, no month of silence followed by a surprise."
      >
        <ButtonLink href="/contact" size="lg">
          Start with a discovery call
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/packages" variant="secondary" size="lg">
          See the packages
        </ButtonLink>
      </PageHero>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="The engagement"
            title="From first call to handover"
            description="Timings below are typical for a mid-sized product build. Smaller sites compress the middle stages; long retainers repeat stages three to five every sprint."
          />

          <ol className="relative mt-16 flex flex-col gap-10 sm:gap-12">
            <span
              className="pointer-events-none absolute bottom-14 left-6 top-6 hidden w-px bg-border sm:block"
              aria-hidden
            />

            {processSteps.map((step) => (
              <li
                key={step.step}
                id={`step-${step.step}`}
                className="relative flex scroll-mt-24 flex-col gap-5 sm:flex-row sm:gap-8"
              >
                <span className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-soft font-mono text-sm font-semibold text-brand-strong">
                  {step.step}
                </span>

                <div className="flex-1 rounded-card border border-border bg-surface p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <Clock className="size-4" aria-hidden />
                      {step.duration}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted text-pretty sm:text-base">
                    {step.description}
                  </p>

                  <p className="mt-5 flex items-start gap-2.5 border-t border-border pt-5 text-sm">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    <span>
                      <span className="text-muted">You receive: </span>
                      <span className="font-medium">{step.deliverable}</span>
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Weekly rhythm"
            title="What you get every week"
            description="The whole point is that you never have to ask how it is going. Three things land on a predictable schedule for as long as the project runs."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {weeklyRhythm.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="bg-background">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl border border-brand/25 bg-brand-soft text-brand-strong">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Communication"
                title="Async first, with a real overlap window"
                description="We are remote and so are most of our clients. That works when the defaults are written, searchable and time-zone tolerant."
              />

              <dl className="mt-8 flex flex-col gap-4 rounded-card border border-border bg-surface p-6">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <div>
                    <dt className="text-sm font-medium">Working hours</dt>
                    <dd className="mt-1 text-sm text-muted">{siteConfig.hours}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <div>
                    <dt className="text-sm font-medium">Response time</dt>
                    <dd className="mt-1 text-sm text-muted">{siteConfig.responseTime}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <div>
                    <dt className="text-sm font-medium">Overlap window</dt>
                    <dd className="mt-1 text-sm text-muted">
                      At least four hours with UK and European teams, and an early-morning block
                      with US East Coast. West Coast clients get a fixed call slot rather than
                      ad-hoc availability.
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-4">
              {commsChannels.map((channel) => (
                <div key={channel.title} className="rounded-card border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold">{channel.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{channel.body}</p>
                </div>
              ))}
              <p className="text-sm leading-relaxed text-muted">
                Decisions get written down wherever they are made. If something important is agreed
                on a call, it is in your inbox the same day.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            eyebrow="Estimation"
            title="How we arrive at a number"
            description="Estimates go wrong in predictable ways. This is the sequence we use to avoid the usual ones."
          />

          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {estimationSteps.map((item, index) => (
              <li key={item.title} className="flex gap-4 rounded-card border border-border bg-background p-6">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 font-mono text-sm text-muted">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col items-start gap-4 rounded-card border border-border bg-background p-6 sm:flex-row sm:items-center">
            <Ruler className="size-5 shrink-0 text-brand" aria-hidden />
            <p className="text-sm leading-relaxed text-muted">
              If we cannot estimate something responsibly, we say so and propose a short paid
              discovery instead of inventing a figure. That has cost us work. It has never cost a
              client a failed project.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Quality gates"
            title="What has to pass before anything ships"
            description="These run on every project regardless of size or budget. They are the difference between a demo and something that survives real traffic."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {qualityGates.map((gate) => {
              const Icon = gate.icon;
              return (
                <Card key={gate.title} hover className="flex flex-col">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl border border-accent/25 bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{gate.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{gate.body}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Why teams stay"
            title="What tends to be different here"
            description="Four commitments that shape everything above. They are also the things clients bring up when they refer us."
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-card border border-border bg-background p-6"
              >
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Handover"
            title="Leaving you able to run it without us"
            description="The end of a project should be a transfer, not a dependency. Everything below happens whether or not you take a retainer afterwards."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {handoverItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand-soft text-brand-strong">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <Badge tone="neutral">Retainers are optional</Badge>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              Plenty of clients take the documentation and run the product themselves. Others keep
              us on for monitoring and a monthly block of hours. Both are normal, and the build
              is scoped the same either way.
            </p>
            <ButtonLink href="/contact" variant="secondary">
              Ask about a retainer
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaSection
        title="Ready to see this run on your project?"
        description="The first stage costs nothing. Book a 30-minute call and you will have a written scope summary within a day, whether or not you work with us."
      />
    </>
  );
}
