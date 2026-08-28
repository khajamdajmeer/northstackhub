import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";

import type { Post } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, readingTime } from "@/lib/utils";

export function AuthorAvatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-xs font-semibold tracking-wide text-brand-strong",
        className,
      )}
    >
      {initials}
    </span>
  );
}

function MetaRow({ post, className }: { post: Post; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted", className)}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-3.5" aria-hidden />
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" aria-hidden />
        {readingTime(post.body)} min read
      </span>
    </div>
  );
}

function AuthorRow({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-3">
      <AuthorAvatar initials={post.author.initials} />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{post.author.name}</span>
        <span className="text-xs text-muted">{post.author.role}</span>
      </div>
    </div>
  );
}

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-card focus-visible:outline-none"
      >
        <article className="grid h-full overflow-hidden rounded-card border border-border bg-surface transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-xl group-hover:shadow-brand/5 md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex min-h-44 flex-col justify-between gap-8 overflow-hidden bg-linear-to-br from-brand-soft via-surface-2 to-accent-soft p-6">
            <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
            <span className="relative inline-flex w-fit items-center rounded-full border border-brand/30 bg-background/70 px-3 py-1 text-xs font-medium tracking-wide text-brand-strong">
              {post.category}
            </span>
            <div className="relative flex items-end justify-between gap-4">
              <span
                aria-hidden
                className="font-mono text-4xl font-semibold tracking-tight text-brand/70 sm:text-5xl"
              >
                {post.author.initials}
              </span>
              <span className="text-xs font-medium text-muted">Featured</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <MetaRow post={post} />
            <h3 className="text-xl font-semibold tracking-tight text-balance transition-colors group-hover:text-brand-strong sm:text-2xl">
              {post.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted text-pretty">{post.description}</p>

            <ul className="flex flex-wrap gap-2" aria-label={`${post.title} topics`}>
              {post.tags.slice(0, 4).map((tag) => (
                <li key={tag}>
                  <Badge tone="neutral">{tag}</Badge>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <AuthorRow post={post} />
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                Read article
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-card focus-visible:outline-none">
      <article className="flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand/40 group-hover:shadow-xl group-hover:shadow-brand/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge>{post.category}</Badge>
          <MetaRow post={post} />
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-balance transition-colors group-hover:text-brand-strong">
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted text-pretty">{post.description}</p>

        <ul className="flex flex-wrap gap-2" aria-label={`${post.title} topics`}>
          {post.tags.slice(0, 3).map((tag) => (
            <li key={tag}>
              <Badge tone="neutral">{tag}</Badge>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <AuthorRow post={post} />
          <ArrowUpRight
            className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </div>
      </article>
    </Link>
  );
}
