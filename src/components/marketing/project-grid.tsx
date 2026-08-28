"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, SearchX } from "lucide-react";
import { projects, projectCategories, type Project } from "@/content/projects";
import { cn } from "@/lib/utils";

type Category = (typeof projectCategories)[number];

/**
 * The container is 1088px of content at its widest, with a 24px gutter, so a
 * full-width card tops out at 1088 and a half-width one at 532. Telling the
 * image pipeline that up front keeps a 1568px source off a 380px phone.
 */
const FEATURED_SIZES = "(min-width: 1152px) 1088px, 100vw";
const CARD_SIZES = "(min-width: 1152px) 532px, (min-width: 640px) 50vw, 100vw";

function StackList({ stack, limit = 4 }: { stack: string[]; limit?: number }) {
  const shown = stack.slice(0, limit);
  const overflow = stack.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted"
        >
          {item}
        </li>
      ))}
      {overflow > 0 ? (
        <li className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
          +{overflow}
        </li>
      ) : null}
    </ul>
  );
}

/**
 * `project.accent` is a literal Tailwind gradient class pair written out in full
 * inside src/content/projects.ts. Tailwind v4 scans that source file, so the
 * utilities are generated without a separate safelist — the strings there must
 * stay complete, unconcatenated class names for this to hold. The wash sits
 * *around* the screenshot; the hairline border keeps a light capture from
 * bleeding into the near-black canvas.
 */
function ProjectCover({
  project,
  featured,
  priority,
}: {
  project: Project;
  featured: boolean;
  priority: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-border bg-gradient-to-br p-2 sm:p-3",
        project.accent,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-surface-2",
          featured ? "aspect-[1568/713]" : "aspect-[16/9]",
        )}
      >
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes={featured ? FEATURED_SIZES : CARD_SIZES}
          priority={priority}
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  featured,
  priority,
}: {
  project: Project;
  featured: boolean;
  priority: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5",
        featured && "sm:col-span-2",
      )}
    >
      <ProjectCover project={project} featured={featured} priority={priority} />

      <div
        className={cn(
          "flex flex-1 flex-col gap-4 p-6",
          featured && "sm:gap-5 sm:p-8",
        )}
      >
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-brand">
            {project.category}
          </span>
          <span>{project.year}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-lg font-semibold tracking-tight",
              featured && "sm:text-2xl",
            )}
          >
            <Link
              href={`/portfolio/${project.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {project.name}
            </Link>
          </h3>
          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-muted transition-colors group-hover:text-brand"
            aria-hidden
          />
        </div>

        <p
          className={cn(
            "text-sm leading-relaxed text-muted text-pretty",
            featured && "sm:max-w-2xl sm:text-base",
          )}
        >
          {project.summary}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <StackList stack={project.stack} limit={featured ? 6 : 4} />
          {project.client ? (
            <span className="truncate text-xs text-muted">Built for {project.client}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProjectGrid() {
  const [category, setCategory] = useState<Category>("All");

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    map.set("All", projects.length);
    for (const project of projects) {
      map.set(project.category, (map.get(project.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const list =
      category === "All" ? projects : projects.filter((project) => project.category === category);
    return [...list].sort((a, b) => b.year - a.year);
  }, [category]);

  // Two columns, so an odd count would otherwise leave a hole in the last row.
  // Promoting the first card to full width both fills the grid and gives the
  // most recent screenshot the space a 2.2:1 capture deserves.
  const featureFirst = filtered.length % 2 === 1;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by category">
        {projectCategories.map((item) => {
          const active = item === category;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-brand/40 bg-brand-soft text-brand-strong"
                  : "border-border bg-surface text-muted hover:border-brand/30 hover:text-foreground",
              )}
            >
              {item}
              <span className={cn("text-xs", active ? "text-brand" : "text-muted")}>
                {counts.get(item) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              featured={featureFirst && index === 0}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
          <SearchX className="size-6 text-muted" aria-hidden />
          <p className="text-base font-medium">Nothing written up in {category} yet</p>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Ask us for examples in this area and we will send relevant work directly.
          </p>
          <button
            type="button"
            onClick={() => setCategory("All")}
            className="mt-2 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Show all projects
          </button>
        </div>
      )}

      <p className="text-sm text-muted" aria-live="polite">
        Showing {filtered.length} of {projects.length} projects
        {category === "All" ? "" : ` in ${category}`}.
      </p>
    </div>
  );
}
