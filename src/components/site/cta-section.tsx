import { ArrowRight, CalendarDays } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export function CtaSection({
  title = "Have a project in mind?",
  description = "Tell us what you are building. You get a written scope summary and a realistic number within 24 hours — free, and yours to take anywhere.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="glow relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:px-14">
          <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {title}
            </h2>
            <p className="text-base leading-relaxed text-muted text-pretty sm:text-lg">
              {description}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <ButtonLink href="/contact" size="lg">
                Start a project
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink
                href={siteConfig.links.calendar}
                variant="secondary"
                size="lg"
                external
              >
                <CalendarDays className="size-4" aria-hidden />
                Book a 30-min call
              </ButtonLink>
            </div>
            <p className="text-xs text-muted">
              {siteConfig.responseTime} · No obligation · You keep the scope document
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
