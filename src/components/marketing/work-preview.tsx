import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects } from "@/content/projects";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Three across 1088px of container with 24px gutters — 346px per card at the top end. */
const CARD_SIZES = "(min-width: 1152px) 346px, (min-width: 1024px) 33vw, 100vw";

export function WorkPreview() {
  const featured = projects.slice(0, 3);

  return (
    <section className="border-y border-border bg-surface/40 py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Selected work"
            title="Recent builds, as they shipped"
            description="Every screenshot below is a capture of the running interface. Open any one for the constraint behind it and the scope that was delivered."
          />
          <ButtonLink href="/portfolio" variant="secondary" className="shrink-0">
            All work
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {featured.map((project) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
            >
              {/*
                `project.accent` is a literal Tailwind gradient class pair written out in full
                inside src/content/projects.ts, so Tailwind v4 generates these utilities from
                that source file without a safelist. The wash frames the capture rather than
                replacing it, and the hairline border keeps a white screenshot off the canvas.
              */}
              <div
                className={cn(
                  "border-b border-border bg-gradient-to-br p-2 sm:p-3",
                  project.accent,
                )}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface-2">
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes={CARD_SIZES}
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-brand">
                    {project.category}
                  </span>
                  <span>{project.year}</span>
                </div>

                <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-brand">
                  {project.name}
                </h3>

                <p className="text-sm leading-relaxed text-muted text-pretty">{project.summary}</p>

                <ul className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-4">
                  {project.stack.slice(0, 4).map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {item}
                    </li>
                  ))}
                  {project.stack.length > 4 ? (
                    <li className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
                      +{project.stack.length - 4}
                    </li>
                  ) : null}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
