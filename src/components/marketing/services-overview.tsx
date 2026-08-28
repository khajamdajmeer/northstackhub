import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { serviceCategories, services, servicesByCategory } from "@/content/services";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceIcon } from "@/components/site/service-icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

const categoryBlurbs: Record<string, string> = {
  "Product engineering": "The whole product, from empty repo to store listing.",
  "AI systems": "Retrieval and agents built with limits, tracing and evaluation.",
  "Platform & data": "The layer underneath — APIs, data, permissions, infrastructure.",
  Experience: "How it looks, moves and ranks.",
};

const pricedServiceCount = services.filter((service) => service.startingAt).length;

export function ServicesOverview() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          align="left"
          eyebrow="What we do"
          title="Fourteen services, one team, one standard"
          description="Take a single piece or hand over the whole build. Most clients start with one service and keep us on a retainer once the product is live."
        />

        <div className="mt-16 flex flex-col gap-16">
          {serviceCategories.map((category) => (
            <div key={category} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-xl font-semibold tracking-tight">{category}</h3>
                <p className="text-sm text-muted">{categoryBlurbs[category]}</p>
              </div>

              <Reveal stagger={0.06} className="grid gap-px overflow-hidden rounded-card border border-border bg-border md:grid-cols-2">
                {servicesByCategory(category).map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group flex flex-col gap-4 bg-surface p-6 transition-colors duration-300 hover:bg-surface-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <ServiceIcon name={service.icon} />
                      <ArrowUpRight
                        className="size-4 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                        aria-hidden
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <h4 className="text-base font-semibold tracking-tight">{service.title}</h4>
                      <p className="text-sm leading-relaxed text-muted">{service.short}</p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 font-mono text-xs text-muted">
                      <span>{service.timeline}</span>
                      {service.startingAt ? (
                        <span className="text-brand">from {service.startingAt}</span>
                      ) : (
                        <span>quoted per project</span>
                      )}
                    </div>
                  </Link>
                ))}
              </Reveal>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ButtonLink href="/services" variant="secondary" size="lg">
            Compare every service
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <p className="text-sm leading-relaxed text-muted">
            {pricedServiceCount} of these ship as fixed-price packages you can order outright —{" "}
            <Link href="/pricing" className="text-brand underline-offset-4 hover:underline">
              see the packages
            </Link>
            . The rest are quoted after a scoping call.
          </p>
        </div>
      </Container>
    </section>
  );
}
