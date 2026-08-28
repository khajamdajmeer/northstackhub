import { techStack } from "@/content/company";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const allTech = techStack.flatMap((group) => group.items);

export function TechMarquee() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="The stack"
          title="Boring technology, chosen on purpose"
          description="We pick tools with long support horizons and hiring pools, so your team can maintain what we hand over."
        />
      </Container>

      <div className="mask-fade-x relative mt-14 flex overflow-hidden py-2">
        <ul className="flex shrink-0 animate-marquee items-center gap-3 pr-3" aria-hidden>
          {[...allTech, ...allTech].map((tech, index) => (
            <li
              key={`${tech}-${index}`}
              className="whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 font-mono text-sm text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>

      <Container className="mt-14">
        <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((group) => (
            <div key={group.group} className="flex flex-col gap-3 bg-surface p-6">
              <h3 className="text-sm font-semibold tracking-tight">{group.group}</h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
