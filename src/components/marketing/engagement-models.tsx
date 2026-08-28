import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { packages, lowestPackagePriceUsd, type ServicePackage } from "@/content/pricing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

function fromPriceUsd(pkg: ServicePackage) {
  return Math.min(...pkg.tiers.map((tier) => tier.priceUsd));
}

function deliveryRange(pkg: ServicePackage) {
  const days = pkg.tiers.map((tier) => tier.deliveryDays);
  const min = Math.min(...days);
  const max = Math.max(...days);
  return min === max ? `${min} days` : `${min}–${max} days`;
}

/**
 * Home-page summary of the three live packages. Deliberately thin — the numbers that
 * matter are here, the full package breakdown lives on /pricing.
 */
export function EngagementModels() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Packages"
          title="Three packages you can buy outright"
          description={`Fixed scope, fixed price, from $${lowestPackagePriceUsd}. Anything larger — a multi-month product, an agentic system, ongoing maintenance — is scoped in writing and quoted against it.`}
        />

        <Reveal stagger={0.06} className="mt-14 grid gap-5 md:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.slug}
              href={`/pricing#${pkg.slug}`}
              className="group flex flex-col gap-4 rounded-card border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-brand-strong">
                  {pkg.title}
                </h3>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </div>

              <p className="text-sm leading-relaxed text-muted text-pretty">{pkg.summary}</p>

              <p className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-4">
                <span className="text-2xl font-semibold tracking-tight">
                  from ${fromPriceUsd(pkg)}
                </span>
                <span className="font-mono text-xs text-muted">{deliveryRange(pkg)}</span>
              </p>
            </Link>
          ))}
        </Reveal>

        <div className="mt-10 flex flex-col items-center gap-4">
          <ButtonLink href="/pricing" variant="secondary" size="lg">
            See every package
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <p className="text-sm text-muted">
            {packages.reduce((total, pkg) => total + pkg.tiers.length, 0)} packages in total, with the
            delivery time and revision count on each.
          </p>
        </div>
      </Container>
    </section>
  );
}
