import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Camera, ListChecks, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { processSteps } from "@/content/company";
import { projects } from "@/content/projects";
import { ProjectGrid } from "@/components/marketing/project-grid";
import { PageHero } from "@/components/site/page-hero";
import { CtaSection } from "@/components/site/cta-section";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Screenshots of what NorthStackHub has actually shipped — portfolios, business sites, a storefront and a booking application — with the problem behind each build and the scope that was delivered.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: `Work | ${siteConfig.name}`,
    description:
      "Real builds, captured from the shipped interface: what the problem was, how it was approached, and what was delivered.",
    url: `${siteConfig.url}/portfolio`,
  },
};

const highlightedProcess = processSteps.slice(0, 4);

/**
 * There are no client reviews to publish yet, and inventing them is the one
 * shortcut that cannot be walked back. This band replaces the testimonial
 * section with what a reader can actually verify, and points at the one place
 * where feedback does exist on the record.
 */
const readingNotes = [
  {
    icon: Camera,
    title: "Screenshots, not mockups",
    body: "Every image on this page is a capture of the interface as it shipped. No concept renders, no template dressed up as a client project.",
  },
  {
    icon: ListChecks,
    title: "Scope, not outcomes",
    body: "Each write-up lists what was built and the decisions behind it. Where an outcome was never measured, we say what shipped instead of inventing a percentage.",
  },
  {
    icon: Star,
    title: "No testimonials",
    body: "We carry none on this site, because we have none we can attribute. If you want to hear from a client directly, ask on the discovery call and we will put you in touch.",
  },
];

export default function PortfolioPage() {
  const categoriesShipped = new Set(projects.map((project) => project.category)).size;

  return (
    <>
      <PageHero
        eyebrow="Selected work"
        title={<>Work we can show you, screen by screen</>}
        description="Every project below is captured from the running interface. Each one covers the problem the build had to solve, the decisions made along the way, and exactly what was delivered."
      >
        <ButtonLink href="/contact" size="lg">
          Start a project
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href={siteConfig.links.calendar} variant="secondary" size="lg" external>
          <CalendarDays className="size-4" aria-hidden />
          Book a 30-min call
        </ButtonLink>
      </PageHero>

      <section className="border-b border-border bg-surface">
        <Container>
          <dl className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
            {siteConfig.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1 px-2 py-8 sm:px-6">
                <dt className="text-sm text-muted">{stat.label}</dt>
                <dd className="text-3xl font-semibold tracking-tight text-gradient">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading
            align="left"
            eyebrow={`${projects.length} projects · ${categoriesShipped} categories`}
            title="The work"
            description="Filter by the kind of build you are planning. Each card opens the full write-up — the constraint, the approach, and the scope that was delivered."
          />
          <ProjectGrid />
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface">
        <Container className="flex flex-col gap-12">
          <SectionHeading
            align="left"
            eyebrow="How to read this page"
            title="What you are looking at"
            description="A portfolio is only worth anything if you can check it. Here is what is on this page, and what is deliberately missing from it."
          />

          <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
            {readingNotes.map((note) => (
              <div key={note.title} className="flex flex-col gap-3 bg-background p-6 sm:p-8">
                <note.icon className="size-5 text-brand" aria-hidden />
                <h3 className="text-base font-semibold tracking-tight">{note.title}</h3>
                <p className="text-sm leading-relaxed text-muted text-pretty">{note.body}</p>
              </div>
            ))}
          </div>

          <div>
            <ButtonLink href="/contact" variant="secondary">
              Ask for a reference
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-12">
          <SectionHeading
            align="left"
            eyebrow="Method"
            title="How we run projects"
            description="The same sequence on every engagement above, from a single marketing site to a booking platform with accounts behind it."
          />

          <ol className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {highlightedProcess.map((step) => (
              <li key={step.step} className="flex flex-col gap-2 bg-surface p-6">
                <span className="font-mono text-xs tracking-[0.18em] text-brand">{step.step}</span>
                <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                <p className="text-xs text-muted">{step.duration}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
                  {step.deliverable}
                </p>
              </li>
            ))}
          </ol>

          <div>
            <ButtonLink href="/process" variant="secondary">
              Read the full process
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaSection />
    </>
  );
}
