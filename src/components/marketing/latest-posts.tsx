import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { posts } from "@/content/posts";
import { formatDate, readingTime } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";

export function LatestPosts({ limit = 3 }: { limit?: number }) {
  const latest = [...posts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);

  if (latest.length === 0) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Engineering notes"
            title="How we make the calls we make"
            description="Architecture decisions, payment edge cases and performance work, written up the way we would explain them on a call."
          />
          <ButtonLink href="/blog" variant="secondary" className="shrink-0">
            Read the blog
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {latest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1">
                  {post.category}
                </span>
                <span>{readingTime(post.body)} min read</span>
              </div>
              <h3 className="text-base font-semibold leading-snug tracking-tight">{post.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{post.description}</p>
              <span className="mt-auto border-t border-border pt-3 text-xs text-muted">
                {formatDate(post.date)} · {post.author.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
