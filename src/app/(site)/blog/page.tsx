import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, PenLine, Rss } from "lucide-react";

import { posts, postCategories } from "@/content/posts";
import type { Post } from "@/content/types";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Engineering blog",
  description:
    "Field notes from production builds — architecture decisions, payment integrations, database and caching trade-offs, performance budgets and the delivery process behind them. Written by the engineers who shipped the work, not a marketing team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Engineering blog",
    description:
      "Architecture, payments, performance and delivery notes from the engineers building NorthStackHub client products.",
    url: "/blog",
  },
};

function byNewest(a: Post, b: Post) {
  return b.date.localeCompare(a.date);
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const requested = Array.isArray(category) ? category[0] : category;
  const categories: readonly string[] = postCategories;
  const activeCategory = requested && categories.includes(requested) ? requested : "All";
  const isFiltered = activeCategory !== "All";

  const sorted = [...posts].sort(byNewest);
  const featured = sorted.filter((post) => post.featured);
  const heroPosts = (featured.length > 0 ? featured : sorted).slice(0, 2);

  const visible = isFiltered
    ? sorted.filter((post) => post.category === activeCategory)
    : sorted.filter((post) => !heroPosts.includes(post));

  const topics = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <>
      <PageHero
        eyebrow="Engineering blog"
        title={
          <>
            Notes from the <span className="text-gradient">production floor</span>
          </>
        }
        description="Every article here comes out of a real client build — the decision we had to make, what we picked, and what it cost us later. No listicles, no framework hype, no reposted release notes."
      >
        <span className="inline-flex items-center gap-2 text-sm text-muted">
          <PenLine className="size-4 text-brand" aria-hidden />
          {posts.length} articles by the delivery team
        </span>
      </PageHero>

      {!isFiltered && heroPosts.length > 0 ? (
        <Section className="pb-0 sm:pb-0">
          <Container>
            <SectionHeading
              align="left"
              eyebrow="Start here"
              title="The ones worth reading first"
              description="Longer pieces that cover a whole decision rather than a single trick — the closest thing we have to a written account of how we build."
            />

            <div className="mt-10 grid gap-5">
              {heroPosts.map((post, index) => (
                <div
                  key={post.slug}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <PostCard post={post} featured />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container>
          <div className="flex flex-col gap-6">
            <SectionHeading
              align="left"
              eyebrow="All articles"
              title={isFiltered ? `${activeCategory} articles` : "Browse the archive"}
              description={
                isFiltered
                  ? `Everything we have published under ${activeCategory}. Clear the filter to see the rest.`
                  : "Filter by the part of the stack you care about. Each article names the stack, the constraint and the outcome up front."
              }
            />

            <nav aria-label="Filter articles by category">
              <ul className="flex flex-wrap gap-2">
                {categories.map((name) => {
                  const isActive = name === activeCategory;
                  return (
                    <li key={name}>
                      <Link
                        href={
                          name === "All" ? "/blog" : `/blog?category=${encodeURIComponent(name)}`
                        }
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                          isActive
                            ? "border-brand/40 bg-brand-soft text-brand-strong"
                            : "border-border bg-surface text-muted hover:border-brand/40 hover:text-foreground",
                        )}
                      >
                        {name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {visible.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((post, index) => (
                <div
                  key={post.slug}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-card border border-border bg-surface p-8 text-center">
              <p className="text-base font-medium">Nothing published under {activeCategory} yet.</p>
              <p className="mt-2 text-sm text-muted">
                It is on the list. In the meantime the archive covers the rest of the stack.
              </p>
              <div className="mt-5 flex justify-center">
                <ButtonLink href="/blog" variant="secondary">
                  View all articles
                </ButtonLink>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {topics.length > 0 ? (
        <Section className="border-y border-border bg-surface py-14 sm:py-16">
          <Container>
            <div className="flex flex-col gap-5">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                Topics we keep coming back to
              </h2>
              <ul className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <li key={topic}>
                    <Badge tone="neutral">{topic}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-card border border-border bg-surface p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-2 text-xs font-medium tracking-wide uppercase text-brand">
                <Rss className="size-4" aria-hidden />
                Roughly one article a month
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                Want the next one sent over?
              </h2>
              <p className="text-sm leading-relaxed text-muted text-pretty">
                We do not run a mailing list. Tell us the stack you are working on and we will send
                the relevant write-up when it goes out — plus anything from the archive that saves
                you a week.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <ButtonLink href="/contact" size="lg">
                <Mail className="size-4" aria-hidden />
                Get in touch
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <span className="text-xs text-muted">No newsletter software, no tracking pixels.</span>
            </div>
          </div>
        </Container>
      </Section>

      <CtaSection
        title="Read something you want built?"
        description="Most of these articles started as a client problem. If one of them describes yours, send us the details and we will tell you how we would approach it."
      />
    </>
  );
}
