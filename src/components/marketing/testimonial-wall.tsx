import { Quote } from "lucide-react";
import { testimonials } from "@/content/company";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function TestimonialWall({ limit = 6 }: { limit?: number }) {
  // Renders nothing until real reviews exist in src/content/company.ts. The
  // section reappears on its own the moment the first one is added.
  if (testimonials.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface/40 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Client feedback"
          title="What people say after the invoice is paid"
          description="From direct clients and referrals — the people who came back, and the ones who sent us the next project."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, limit).map((item) => (
            <figure
              key={item.author}
              className="flex h-full flex-col gap-5 rounded-card border border-border bg-surface p-6"
            >
              <Quote className="size-5 text-brand/60" aria-hidden />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                {item.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-brand/25 bg-brand-soft text-xs font-semibold text-brand-strong">
                  {item.author
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{item.author}</span>
                  <span className="text-xs text-muted">
                    {item.role}, {item.company} · {item.source}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
