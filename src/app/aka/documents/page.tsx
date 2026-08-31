import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileText, Plus, Search } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { requireSession } from "@/lib/admin/dal";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getDocumentStats, listDocuments } from "@/lib/admin/hr/data";
import {
  DOCUMENT_META,
  HR_DOCUMENT_TYPES,
  isHrDocumentStatus,
  isHrDocumentType,
  type HrDocumentType,
} from "@/lib/admin/hr/schemas";
import { DocumentStatusBadge } from "@/components/admin/document-status-badge";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminShell email={session.email} current="/aka/documents">
        <div className="flex flex-col items-start gap-3 rounded-card border border-brand/30 bg-brand-soft p-6">
          <Database className="size-5 text-brand-strong" aria-hidden />
          <h2 className="text-base font-semibold text-brand-strong">Database not connected</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-brand-strong">
            Set <code className="font-mono text-xs">SUPABASE_URL</code> and{" "}
            <code className="font-mono text-xs">SUPABASE_SECRET_KEY</code>, then apply{" "}
            <code className="font-mono text-xs">supabase/schema.sql</code>.
          </p>
        </div>
      </AdminShell>
    );
  }

  const type = isHrDocumentType(params.type) ? params.type : "all";
  const status = isHrDocumentStatus(params.status) ? params.status : "all";
  const query = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [stats, { rows, total }] = await Promise.all([
    getDocumentStats(),
    listDocuments({ type, status, query, page, perPage: PER_PAGE }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const linkWith = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = {
      type: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      q: query || undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/aka/documents?${qs}` : "/aka/documents";
  };

  return (
    <AdminShell email={session.email} current="/aka/documents">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="mt-1 text-sm text-muted">
              Certificates, payslips, offers and increments issued to your team.
            </p>
          </div>
          <Link
            href="/aka/documents/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong"
          >
            <Plus className="size-4" aria-hidden />
            New document
          </Link>
        </div>

        <dl className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
          {[
            { label: "Total documents", value: stats.total },
            { label: "Issued", value: stats.issued },
            { label: "People", value: stats.employees },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-surface p-5">
              <dt className="text-xs uppercase tracking-wide text-muted">{stat.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-4">
          <form method="get" className="flex gap-2">
            {type !== "all" && <input type="hidden" name="type" value={type} />}
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search by name or reference"
                aria-label="Search documents"
                className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand/60"
              />
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:border-brand/50"
            >
              Search
            </button>
          </form>

          <nav aria-label="Filter by type" className="flex flex-wrap gap-2">
            <Link
              href={linkWith({ type: undefined, page: undefined })}
              className={
                type === "all"
                  ? "rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                  : "rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
              }
            >
              All <span className="tabular-nums">({stats.total})</span>
            </Link>
            {HR_DOCUMENT_TYPES.map((value: HrDocumentType) => (
              <Link
                key={value}
                href={linkWith({ type: value, page: undefined })}
                className={
                  type === value
                    ? "rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                    : "rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
                }
              >
                {DOCUMENT_META[value].label}{" "}
                <span className="tabular-nums">({stats.byType[value]})</span>
              </Link>
            ))}
          </nav>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-12 text-center">
            <FileText className="size-6 text-muted" aria-hidden />
            <p className="text-sm font-medium">
              {query || type !== "all" ? "Nothing matches that filter." : "No documents yet."}
            </p>
            <Link
              href="/aka/documents/new"
              className="text-sm text-brand underline-offset-4 hover:underline"
            >
              Generate the first one
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Reference</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Employee</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Issued</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <Link
                        href={`/aka/documents/${row.id}`}
                        className="font-mono text-xs underline-offset-4 hover:text-brand hover:underline"
                      >
                        {row.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top font-medium">{row.employee_name}</td>
                    <td className="px-4 py-3 align-top text-muted">
                      {DOCUMENT_META[row.type].label}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-muted">
                      {formatDate(row.issued_on)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DocumentStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
            <span className="text-muted">
              Page {page} of {pageCount} · {total} documents
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={linkWith({ page: String(page - 1) })}
                  className="rounded-full border border-border px-4 py-1.5 transition-colors hover:border-brand/50"
                >
                  Previous
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={linkWith({ page: String(page + 1) })}
                  className="rounded-full border border-border px-4 py-1.5 transition-colors hover:border-brand/50"
                >
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </AdminShell>
  );
}
