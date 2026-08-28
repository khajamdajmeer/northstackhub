import { ArrowRight } from "lucide-react";
import { processSteps } from "@/content/company";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";

export function ProcessPreview() {
  return (
    <section className="border-y border-border bg-surface/40 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How we work"
          title="Six steps, no surprises on the invoice"
          description="You approve a scope and a number before anything is built, and you see working software every week after that."
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((step) => (
            <li
              key={step.step}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-2xl font-semibold text-brand/50">{step.step}</span>
                <span className="text-xs text-muted">{step.duration}</span>
              </div>
              <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              <p className="mt-auto border-t border-border pt-3 text-xs text-muted">
                <span className="text-foreground">You get:</span> {step.deliverable}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/process" variant="secondary" size="lg">
            Read the full process
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
