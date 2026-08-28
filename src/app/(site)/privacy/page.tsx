import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHero } from "@/components/site/page-hero";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "What NorthStackHub collects through this website, why we collect it, how long we keep it, who processes it on our behalf, and how to ask us to delete it.",
  alternates: { canonical: "/privacy" },
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

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy notice"
        description="A plain-English account of the personal data this website handles. No dark patterns, no data broking, and nothing collected that we do not actually need."
      />

      <Section className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-sm text-muted">
            Last updated: <time dateTime="2026-08-14">{LAST_UPDATED}</time>
          </p>

          <div className="mt-10 flex flex-col gap-12">
            <LegalSection id="who-we-are" heading="Who we are">
              <p>
                {siteConfig.name} is a software development agency that builds and maintains web
                applications for clients worldwide. We operate remotely and take work directly and
                through freelance marketplaces.
              </p>
              <p>
                For anything you send us through this website, {siteConfig.name} is the data
                controller. You can reach us at{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-brand underline underline-offset-4"
                >
                  {siteConfig.email}
                </a>
                .
              </p>
            </LegalSection>

            <LegalSection id="what-we-collect" heading="What the contact form collects">
              <p>When you submit the contact form we receive:</p>
              <Bullets
                items={[
                  "Your name, so we know who we are writing to.",
                  "Your email address, which is the only way we can reply.",
                  "Your company name, if you choose to give it — this field is optional.",
                  "The project type, budget range and timeline you select.",
                  "The message you write, including anything you choose to put in it.",
                  "The date and time of the submission.",
                ]}
              />
              <p>
                Our server also sees the IP address attached to the request. We use it only to
                apply a short-lived rate limit that stops automated spam; it is held in memory for
                a matter of minutes and is never written to our database or included in the
                notification email.
              </p>
              <p>
                Please do not send us passwords, API keys, card numbers or other secrets through
                this form. If we need credentials during a project we will set up a proper secret
                sharing channel with you.
              </p>
            </LegalSection>

            <LegalSection id="why" heading="Why we collect it">
              <p>
                We use what you send for exactly one purpose: to reply to your enquiry and, if it
                goes further, to scope and quote the work. We do not add you to a mailing list, we
                do not build a marketing profile from your message, and we never sell or rent your
                details to anyone.
              </p>
              <p>
                The lawful basis is your consent, given by ticking the box on the form, and our
                legitimate interest in responding to people who ask us about our services. Where a
                project starts, the basis becomes the performance of our contract with you.
              </p>
            </LegalSection>

            <LegalSection id="retention" heading="How long we keep it">
              <Bullets
                items={[
                  "Enquiries that do not become projects: kept for 12 months, then deleted, so we have context if you come back to us.",
                  "Enquiries that become projects: kept for the life of the engagement and for 6 years afterwards, because tax and contract records require it.",
                  "Rate-limiting records: held in server memory only and discarded within 10 minutes.",
                ]}
              />
              <p>
                You can ask us to delete your enquiry sooner than any of these, and unless we are
                legally required to keep a record we will do it.
              </p>
            </LegalSection>

            <LegalSection id="processors" heading="Who else processes your data">
              <p>
                We keep the list of third parties short and we choose providers that publish their
                own data protection terms. Currently:
              </p>
              <Bullets
                items={[
                  "Hosting and content delivery — our host runs this website and its serverless functions, and keeps standard access logs containing IP addresses for a limited period.",
                  "Transactional email — our email provider delivers contact form notifications to our inbox and stores the message content as part of that delivery.",
                  "Business email — our mail provider holds the resulting conversation in our inbox, the same way any email exchange works.",
                  "Scheduling — if you book a discovery call, our calendar provider processes the name, email and any notes you enter on their booking page under their own privacy policy.",
                  "Analytics — if enabled, we use privacy-respecting, aggregate analytics that count page views without cookies and without attempting to identify individual visitors.",
                  "Marketplaces — if you contact us through a freelance platform such as Upwork, that conversation happens on their platform and is governed by their privacy policies, not this one.",
                ]}
              />
              <p>
                Some of these providers operate servers outside your country, so your data may be
                transferred internationally. Where that happens we rely on the provider&rsquo;s
                standard contractual clauses or an equivalent safeguard.
              </p>
            </LegalSection>

            <LegalSection id="cookies" heading="Cookies and local storage">
              <p>
                This website sets no marketing cookies, no advertising pixels and no cross-site
                trackers. There is no cookie banner because there is nothing to consent to.
              </p>
              <p>
                Your light or dark theme preference is saved in your browser&rsquo;s local storage
                so the site does not flash the wrong theme on your next visit. That value never
                leaves your device and is never sent to our servers. Clearing your browser storage
                removes it.
              </p>
            </LegalSection>

            <LegalSection id="client-data" heading="Data inside client projects">
              <p>
                During an engagement we often work with systems that hold your customers&rsquo;
                personal data. In that context you are the controller and we act as your processor,
                under the terms of our contract or a separate data processing agreement.
              </p>
              <p>
                Our working rules are simple: we prefer your cloud accounts and your repositories
                over ours, we use anonymised or synthetic data in development wherever it is
                practical, we access production data only when a task genuinely requires it, and we
                hand back or delete every credential at the end of the engagement.
              </p>
            </LegalSection>

            <LegalSection id="security" heading="How we protect it">
              <p>
                Enquiries reach us over HTTPS and stay inside password-protected accounts with
                two-factor authentication enabled. Access is limited to the people who need it to
                answer you. No system is perfect, but if a breach ever affected your data we would
                tell you and the relevant regulator without unnecessary delay.
              </p>
            </LegalSection>

            <LegalSection id="your-rights" heading="Your rights">
              <p>Depending on where you live, you can ask us to:</p>
              <Bullets
                items={[
                  "Tell you what personal data we hold about you and give you a copy.",
                  "Correct anything that is wrong or incomplete.",
                  "Delete your data where we have no ongoing legal or contractual reason to keep it.",
                  "Restrict or object to how we use it.",
                  "Withdraw consent at any time, which does not affect anything we did before you withdrew it.",
                  "Receive your data in a portable, machine-readable format.",
                ]}
              />
              <p>
                Email{" "}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-brand underline underline-offset-4"
                >
                  {siteConfig.email}
                </a>{" "}
                with the subject line &ldquo;Data request&rdquo; and we will respond within 30 days.
                We do not charge for this. If you are unhappy with our response you can complain to
                your local data protection authority.
              </p>
            </LegalSection>

            <LegalSection id="children" heading="Children">
              <p>
                Our services are sold to businesses and professionals. This website is not directed
                at children and we do not knowingly collect data from anyone under 16. If you
                believe a child has sent us information, tell us and we will delete it.
              </p>
            </LegalSection>

            <LegalSection id="changes" heading="Changes to this notice">
              <p>
                When we change how we handle data we update this page and move the date at the top.
                Material changes affecting people who have already contacted us are communicated by
                email.
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
                    This notice is a well-drafted template, not legal advice. Data protection law
                    varies by jurisdiction — GDPR, UK GDPR, CCPA and others each carry their own
                    requirements around disclosures, transfers and response times.
                  </p>
                  <p className="text-muted">
                    Before you launch, have a qualified lawyer in your jurisdiction review this
                    page against the processors you actually use and the countries you actually
                    serve, and amend it accordingly.
                  </p>
                </div>
              </div>
            </div>

            <LegalSection id="contact" heading="Contact">
              <p>
                Questions about this notice, about anything we hold on you, or about
                project and contract matters all go to{" "}
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
