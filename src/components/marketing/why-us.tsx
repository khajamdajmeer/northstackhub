import { differentiators } from "@/content/company";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function WhyUs() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Why teams stay"
          title="Agency work without the agency problems"
          description="Most of our clients arrived after a bad experience elsewhere. These four commitments are what we changed."
        />

        <div className="mt-14 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2">
          {differentiators.map((item, index) => (
            <div key={item.title} className="flex flex-col gap-3 bg-surface p-8">
              <span className="font-mono text-xs text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
