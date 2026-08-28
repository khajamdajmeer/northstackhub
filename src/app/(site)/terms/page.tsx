import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHero } from "@/components/site/page-hero";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "How NorthStackHub engagements work: scope and quotes, change requests, milestone payments, code ownership, the 30-day warranty, liability, confidentiality and termination.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "14 August 2026";

function LegalSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted sm:text-base">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-brand">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of service"
        description="The commercial ground rules for working with us — written to be read, not to hide anything. Where a signed contract exists, that contract wins."
      />

      <Section className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-sm text-muted">
            Last updated: <time dateTime="2026-08-14">{LAST_UPDATED}</time>
          </p>

          <div className="mt-10 flex flex-col gap-12">
            <LegalSection id="agreement" heading="Who these terms apply to">
              <p>
                These terms cover use of the {siteConfig.domain} website and any engagement with{" "}
                {siteConfig.name} that is not already governed by a signed agreement. When we sign a
                statement of work, a master services agreement or a marketplace order, that document
                takes precedence over anything here that conflicts with it.
              </p>
              <p>
                Work booked through a freelance marketplace such as Upwork is additionally subject
                to that platform&rsquo;s own terms, including how funds are held in escrow and how
                disputes are resolved.
              </p>
            </LegalSection>

            <LegalSection id="services" heading="Scope of services">
              <p>
                We design, build, deploy and maintain web applications: frontends, backends, APIs,
                databases and caching layers, payment integrations, cloud infrastructure and
                ongoing support. Exactly what we are doing for you is set out in the written scope
                we send before work begins.
              </p>
              <p>
                Anything not written into that scope is not included. That is not a technicality —
                it is what makes a fixed price possible, and it protects you as much as it protects
                us.
              </p>
              <p>
                We do not provide legal, tax, accounting, medical or financial advice, and nothing
                we build should be treated as a substitute for professional advice in those fields.
                Regulatory compliance for your product — accessibility standards, payment rules,
                data protection obligations, industry licensing — remains your responsibility,
                though we will build to any specific requirement you give us.
              </p>
            </LegalSection>

            <LegalSection id="quotes" heading="Quotes, fixed scope and change requests">
              <p>
                Fixed-price quotes are valid for 30 days and are calculated against a specific
                written scope and a specific set of assumptions. Both appear in the quote so you
                can see what we priced.
              </p>
              <p>
                Scope changes. When you ask for something outside the agreed scope — a new feature,
                a redesign of something already approved, an extra integration, a third round of
                revisions where two were agreed — we quote it as a separate change request with its
                own price and schedule impact. Nothing is built and nothing is invoiced until you
                approve that change request in writing. Email counts as writing.
              </p>
              <p>
                If an assumption in the quote turns out to be wrong — an API is not what its
                documentation claimed, a legacy database is in worse shape than described — we tell
                you as soon as we know, with options and costs, rather than absorbing it silently
                and cutting corners elsewhere.
              </p>
            </LegalSection>

            <LegalSection id="payment" heading="Payment and milestones">
              <Bullets
                items={[
                  "Fixed-price projects: 40% to book the slot and start, the balance across agreed milestones, with the final milestone due on delivery.",
                  "Retainers: invoiced monthly in advance; unused hours do not roll over unless the retainer says they do.",
                  "Audits and day-rate work: invoiced on completion, or monthly for anything running longer than a month.",
                  "Marketplace orders: paid through the platform's own escrow and milestone system.",
                ]}
              />
              <p>
                Invoices are due within 14 days unless we agree otherwise in writing. Prices are
                quoted in US dollars and exclude any taxes, duties or withholdings that apply where
                you are; bank and payment processor fees are yours.
              </p>
              <p>
                Deposits reserve capacity in our schedule and are non-refundable once work has
                started. If an invoice is more than 14 days overdue we may pause work and hold
                deliverables until it is settled, after giving you notice. We would much rather
                talk about a cash flow problem than stop a project over one.
              </p>
            </LegalSection>

            <LegalSection id="your-part" heading="What we need from you">
              <p>
                Projects stall for predictable reasons, and almost all of them are about access and
                answers. To keep to a timeline we need feedback and approvals within five business
                days, timely access to accounts, repositories, content and third-party systems, and
                one named person who can make decisions.
              </p>
              <p>
                Where delays on your side push the schedule, dates move accordingly and we will
                tell you at the time rather than at the end. You confirm that any content, data or
                assets you give us are yours to use.
              </p>
            </LegalSection>

            <LegalSection id="ip" heading="Intellectual property">
              <p>
                On receipt of final payment, all intellectual property rights in the deliverables we
                built specifically for you — source code, designs, documentation and configuration —
                transfer to you outright. You own them. There is no licence to renew and no
                proprietary framework holding your project hostage.
              </p>
              <p>
                Two things sit outside that transfer. First, our pre-existing tools, libraries,
                internal boilerplate and general know-how remain ours; where any of it is embedded
                in your deliverables you receive a perpetual, worldwide, royalty-free licence to
                use, modify and sublicense it as part of the project. Second, open-source components
                stay under their own licences, all of which we will have chosen to be compatible
                with commercial use.
              </p>
              <p>
                Until final payment clears, we retain ownership of the deliverables. We may describe
                the work publicly and show non-confidential screenshots in our portfolio unless you
                ask us not to — say the word and we will keep the engagement private.
              </p>
            </LegalSection>

            <LegalSection id="third-party" heading="Third-party services">
              <p>
                Most projects depend on services we do not control: cloud hosting, payment
                processors, email and SMS providers, authentication, mapping, analytics, and various
                APIs. You contract with those providers directly, you pay their fees, and you accept
                their terms.
              </p>
              <p>
                We will recommend sensible options, integrate them properly and document the setup,
                but we are not responsible for their outages, pricing changes, deprecations, account
                suspensions or breaking API changes. Where such a change requires rework after
                delivery, it is chargeable — quoted first, as always.
              </p>
            </LegalSection>

            <LegalSection id="warranty" heading="Warranty">
              <p>
                Every project carries a 30-day warranty from the date of delivery. If something we
                built does not work as specified in the agreed scope, we fix it at no charge, and we
                treat that as a priority rather than a favour.
              </p>
              <p>The warranty does not cover:</p>
              <Bullets
                items={[
                  "New features or changes of mind — those are change requests.",
                  "Faults caused by changes other people made to the code or infrastructure after handover.",
                  "Breakages caused by third-party services changing their behaviour, pricing or APIs.",
                  "Content, data or configuration errors introduced on your side.",
                  "Hosting, domain or subscription costs.",
                ]}
              />
              <p>
                Beyond that period, ongoing cover is available on a maintenance retainer. Otherwise
                the work is provided as is, without further warranties of any kind, express or
                implied, to the fullest extent the law allows.
              </p>
            </LegalSection>

            <LegalSection id="liability" heading="Limitation of liability">
              <p>
                To the maximum extent permitted by law, our total aggregate liability arising out of
                or connected to an engagement is limited to the total fees you paid us for that
                engagement in the 6 months before the claim arose.
              </p>
              <p>
                We are not liable for indirect or consequential losses, including lost profits, lost
                revenue, lost or corrupted data, business interruption, or loss of goodwill, even if
                we were told such losses were possible.
              </p>
              <p>
                Nothing in these terms limits liability for fraud, fraudulent misrepresentation,
                death or personal injury caused by negligence, or anything else that cannot lawfully
                be limited. If you are a consumer rather than a business, your statutory rights are
                unaffected.
              </p>
              <p>
                Backups are your responsibility unless a written agreement says we manage them. We
                will always help you set them up properly.
              </p>
            </LegalSection>

            <LegalSection id="confidentiality" heading="Confidentiality">
              <p>
                Anything you share with us that is marked confidential, or that a reasonable person
                would treat as confidential — business plans, roadmaps, customer lists, credentials,
                unreleased products, financials — stays confidential. We use it only to do your work
                and disclose it only to the people on your project, who are under the same
                obligation.
              </p>
              <p>
                This lasts for the engagement and for 3 years afterwards, and it runs both ways: we
                expect the same treatment of our proposals, estimates and internal methods. It does
                not apply to information that is already public, that you tell us is not
                confidential, or that we are legally compelled to disclose — and in that last case
                we will tell you first where we are allowed to.
              </p>
              <p>We are happy to sign your NDA before a discovery call. Just send it over.</p>
            </LegalSection>

            <LegalSection id="termination" heading="Termination">
              <p>
                Either of us can end an engagement with 14 days&rsquo; written notice. Retainers can
                be cancelled with 30 days&rsquo; notice, effective at the end of the current billing
                month.
              </p>
              <p>
                On termination you pay for all work completed and in progress up to the effective
                date, and once that is settled we hand over everything produced so far, transfer the
                relevant IP under the terms above, return or destroy your confidential material, and
                give you a written summary of where things stand so another team can pick it up.
              </p>
              <p>
                Either of us may terminate immediately if the other commits a material breach and
                fails to fix it within 14 days of being told about it. We reserve the right to
                decline or withdraw from work that is illegal, or that we consider unethical or
                abusive.
              </p>
            </LegalSection>

            <LegalSection id="general" heading="General">
              <p>
                Neither of us is liable for delays caused by events genuinely outside our control.
                If any clause here is held unenforceable, the rest continues to apply. A failure to
                enforce a term is not a waiver of it. Neither party may assign these terms without
                the other&rsquo;s written consent, except as part of a sale of the business.
              </p>
              <p>
                We may update these terms; the version published on the day your engagement starts
                is the one that governs it. Disputes are handled first by a conversation, then by
                mediation, and only then by the courts of the jurisdiction named in your signed
                agreement.
              </p>
            </LegalSection>

            <div className="rounded-card border border-border bg-surface-2 p-6">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
                <div className="flex flex-col gap-3 text-sm leading-relaxed">
                  <p className="text-base font-semibold text-foreground">
                    A note on this document
                  </p>
                  <p className="text-muted">
                    These terms are a carefully written template, not legal advice. Consumer law,
                    contract law and the enforceability of liability caps differ considerably
                    between jurisdictions, and this page names no governing law or forum on purpose.
                  </p>
                  <p className="text-muted">
                    Before you launch, have a qualified lawyer review this page against how you
                    actually invoice, contract and operate, and add the governing law, jurisdiction
                    and company registration details that apply to you.
                  </p>
                </div>
              </div>
            </div>

            <LegalSection id="contact" heading="Contact">
              <p>
                Questions about these terms, and anything to do with quotes, scopes and
                contracts, go to{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-brand underline underline-offset-4"
                >
                  {siteConfig.email}
                </a>
                . {siteConfig.location}.
              </p>
            </LegalSection>
          </div>
        </Container>
      </Section>
    </>
  );
}
