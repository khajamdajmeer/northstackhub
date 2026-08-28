import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Flattens a rendered React subtree back to plain text. */
function toText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement(node)) {
    const { children } = node.props as { children?: ReactNode };
    return toText(children);
  }
  return "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) && !href.includes(siteConfig.domain);
}

const components: Components = {
  h2({ children }) {
    return (
      <h2
        id={slugify(toText(children))}
        className="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-balance first:mt-0"
      >
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mt-10 scroll-mt-24 text-lg font-semibold tracking-tight text-balance">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    return (
      <h4 className="mt-8 scroll-mt-24 text-base font-semibold tracking-tight">{children}</h4>
    );
  },
  p({ children }) {
    return <p className="mt-5 leading-relaxed text-muted text-pretty">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mt-5 space-y-2.5 pl-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mt-5 list-decimal space-y-2.5 pl-5 marker:text-brand">{children}</ol>;
  },
  li({ children, className }) {
    // Task-list items already carry their own checkbox marker from remark-gfm.
    const isTask = typeof className === "string" && className.includes("task-list-item");
    return (
      <li
        className={cn(
          "leading-relaxed text-muted",
          isTask
            ? "flex items-start gap-2.5 list-none"
            : "relative pl-5 before:absolute before:left-0 before:top-[0.6em] before:size-1.5 before:rounded-full before:bg-brand [ol_&]:pl-0 [ol_&]:before:hidden",
        )}
      >
        {children}
      </li>
    );
  },
  a({ children, href }) {
    const target = href ?? "#";
    const external = isExternal(target);
    return (
      <a
        href={target}
        className="font-medium text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:text-brand-strong hover:decoration-brand"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="mt-6 rounded-card border border-border border-l-2 border-l-brand bg-surface px-5 py-1 text-pretty">
        {children}
      </blockquote>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  hr() {
    return <hr className="my-12 border-t border-border" />;
  },
  img({ alt }) {
    // Images are not used in this content set; render the alt text rather than a broken box.
    return alt ? <span className="text-sm text-muted">{alt}</span> : null;
  },
  table({ children }) {
    return (
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-surface-2">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody>{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="border-b border-border last:border-b-0">{children}</tr>;
  },
  th({ children }) {
    return (
      <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase text-foreground">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="px-4 py-3 align-top text-muted">{children}</td>;
  },
  pre({ children }) {
    // react-markdown v10 renders the fenced code as a nested `code` element; flatten it so
    // block code never picks up the inline treatment, whether or not a language was set.
    const first = Children.toArray(children)[0];
    const language =
      isValidElement(first) &&
      typeof (first.props as { className?: string }).className === "string"
        ? /language-([\w-]+)/.exec((first.props as { className?: string }).className ?? "")?.[1]
        : undefined;

    return (
      <div className="relative mt-6">
        {language ? (
          <span className="absolute right-3 top-3 font-mono text-[0.6875rem] tracking-wide uppercase text-muted">
            {language}
          </span>
        ) : null}
        <pre className="overflow-x-auto rounded-card border border-border bg-surface-2 p-4 text-sm font-mono">
          <code className="font-mono text-foreground">{toText(children)}</code>
        </pre>
      </div>
    );
  },
  code({ children, className }) {
    const isBlock = typeof className === "string" && className.startsWith("language-");
    if (isBlock) {
      // Kept plain — `pre` above owns the block presentation.
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em] text-foreground">
        {children}
      </code>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
