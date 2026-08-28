import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
      <Container className="relative py-20 sm:py-28">
        <Reveal stagger={0.08} className="flex max-w-3xl flex-col items-start gap-5">
          {eyebrow ? <Badge>{eyebrow}</Badge> : null}
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-lg leading-relaxed text-muted text-pretty">
              {description}
            </p>
          ) : null}
          {children ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">{children}</div>
          ) : null}
        </Reveal>
      </Container>
    </section>
  );
}
