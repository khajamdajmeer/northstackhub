import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock } from "lucide-react";

import { posts, getPost, relatedPosts } from "@/content/posts";
import type { Post } from "@/content/types";
import { services } from "@/content/services";
import { siteConfig } from "@/config/site";
import { AuthorAvatar, PostCard } from "@/components/blog/post-card";
import { Markdown } from "@/components/blog/markdown";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { CtaSection } from "@/components/site/cta-section";
import { formatDate, readingTime } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

/** Which of our services a reader of each category is most likely to need. */
const serviceRoutes: Record<Post["category"], string[]> = {
  Engineering: ["web-applications", "backend-apis", "maintenance-support"],
  Architecture: ["web-applications", "backend-apis", "databases-caching"],
  Payments: ["payments", "ecommerce", "backend-apis"],
  Performance: ["web-applications", "databases-caching", "cloud-devops"],
  Business: ["portfolio-and-marketing-sites", "maintenance-support", "web-applications"],
  DevOps: ["cloud-devops", "databases-caching", "maintenance-support"],
};

function orderedPosts() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return { title: "Article not found" };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      siteName: siteConfig.name,
      publishedTime: post.date,
      authors: [post.author.name],
      tags: [...post.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const minutes = readingTime(post.body);
  const ordered = orderedPosts();
  const index = ordered.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? ordered[index - 1] : undefined;
  const older = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;
  const related = relatedPosts(post.slug, 3);

  const suggestedServices = serviceRoutes[post.category]
    .map((serviceSlug) => services.find((service) => service.slug === serviceSlug))
    .filter((service): service is (typeof services)[number] => Boolean(service))
    .slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en",
    keywords: post.tags.join(", "),
    articleSection: post.category,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
      worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <header className="relative overflow-hidden border-b border-border">
        <div className="glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <Container className="relative py-14 sm:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All articles
          </Link>

          <div className="mt-8 flex max-w-3xl flex-col items-start gap-5">
            <Badge>{post.category}</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {post.title}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted text-pretty">
              {post.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <AuthorAvatar initials={post.author.initials} className="size-10" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{post.author.name}</span>
                  <span className="text-xs text-muted">{post.author.role}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="size-4" aria-hidden />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <Clock className="size-4" aria-hidden />
                {minutes} min read
              </span>
            </div>
          </div>
        </Container>
      </header>

      <Section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <article className="max-w-[68ch] text-base">
              <Markdown>{post.body}</Markdown>
            </article>

            <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-card border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                  Related services
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {suggestedServices.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        className="group flex flex-col gap-1 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand/40"
                      >
                        <span className="flex items-center justify-between gap-2 text-sm font-medium">
                          {service.title}
                          <ArrowUpRight
                            className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            aria-hidden
                          />
                        </span>
                        <span className="text-xs leading-relaxed text-muted">{service.short}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-card border border-border bg-brand-soft p-6">
                <h2 className="text-base font-semibold tracking-tight">Work with us</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                  Same team, same approach as the one described here. Send the problem and you get a
                  written scope and a fixed number back within a day.
                </p>
                <div className="mt-4">
                  <ButtonLink href="/contact" size="sm">
                    Start a project
                    <ArrowRight className="size-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface p-6">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                  Filed under
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Badge tone="neutral">{tag}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-surface py-14 sm:py-16">
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <AuthorAvatar initials={post.author.initials} className="size-14 text-base" />
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {post.author.name} · {post.author.role}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted text-pretty">
                Part of the {siteConfig.name} delivery team. Writes here when a client build turns
                up a decision worth documenting — usually after the second time we have had to
                explain it on a call.
              </p>
              <Link
                href="/about"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-strong"
              >
                Meet the team
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {newer || older ? (
        <Section className="py-12 sm:py-14">
          <Container>
            <nav aria-label="Article navigation" className="grid gap-4 sm:grid-cols-2">
              {older ? (
                <Link
                  href={`/blog/${older.slug}`}
                  className="group flex flex-col gap-2 rounded-card border border-border bg-surface p-5 transition-colors hover:border-brand/40"
                >
                  <span className="inline-flex items-center gap-2 text-xs tracking-wide uppercase text-muted">
                    <ArrowLeft className="size-3.5" aria-hidden />
                    Previous article
                  </span>
                  <span className="text-base font-medium text-balance transition-colors group-hover:text-brand-strong">
                    {older.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden />
              )}

              {newer ? (
                <Link
                  href={`/blog/${newer.slug}`}
                  className="group flex flex-col gap-2 rounded-card border border-border bg-surface p-5 text-right transition-colors hover:border-brand/40 sm:items-end"
                >
                  <span className="inline-flex items-center gap-2 text-xs tracking-wide uppercase text-muted">
                    Next article
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-base font-medium text-balance transition-colors group-hover:text-brand-strong">
                    {newer.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          </Container>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section className="pt-0 pb-16 sm:pt-0 sm:pb-20">
          <Container>
            <h2 className="text-2xl font-semibold tracking-tight">Keep reading</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
              Articles that touch the same part of the stack.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.slug} post={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <CtaSection
        title="Facing the same problem?"
        description="We scope this kind of work every week. Describe what you are building and we will send back an approach, a timeline and a number — no charge for the thinking."
      />
    </>
  );
}
