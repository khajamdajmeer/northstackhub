import type { Metadata } from "next";
import Link from "next/link";
import { Database, Inbox, Search } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireSession } from "@/lib/admin/dal";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getSubmissionStats, listSubmissions } from "@/lib/admin/data";
import { STATUS_META, SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/admin/status";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SetupNotice() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-brand/30 bg-brand-soft p-6">
      <Database className="size-5 text-brand-strong" aria-hidden />
      <h2 className="text-base font-semibold text-brand-strong">Database not connected</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-brand-strong">
        Set <code className="font-mono text-xs">SUPABASE_URL</code> and{" "}
        <code className="font-mono text-xs">SUPABASE_SECRET_KEY</code>, then apply{" "}
        <code className="font-mono text-xs">supabase/schema.sql</code>. Until then enquiries are
        delivered by email only and nothing is recorded here.
      </p>
    </div>
  );
}

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminShell email={session.email} current="/aka">
        <SetupNotice />
      </AdminShell>
    );
  }

  const status = (
    SUBMISSION_STATUSES as readonly string[]
  ).includes(params.status ?? "")
    ? (params.status as SubmissionStatus)
    : "all";
  const query = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const [stats, { rows, total }] = await Promise.all([
    getSubmissionStats(),
    listSubmissions({ status, query, page, perPage: PER_PAGE }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  // Preserves the current filters when only one of them changes.
  const linkWith = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status: status === "all" ? undefined : status, q: query || undefined, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/aka?${qs}` : "/aka";
  };

  return (
    <AdminShell email={session.email} current="/aka">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted">
            Every message submitted through the contact form.
          </p>
        </div>

        <dl className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Needs action", value: stats.open },
            { label: "Last 7 days", value: stats.last7Days },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-surface p-5">
              <dt className="text-xs uppercase tracking-wide text-muted">{stat.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-4">
          <form method="get" className="flex gap-2">
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
                placeholder="Search name, email, company or message"
                aria-label="Search enquiries"
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

          <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
            <Link
              href={linkWith({ status: undefined, page: undefined })}
              className={
                status === "all"
                  ? "rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                  : "rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
              }
            >
              All {stats.total > 0 && <span className="tabular-nums">({stats.total})</span>}
            </Link>
            {SUBMISSION_STATUSES.map((value) => (
              <Link
                key={value}
                href={linkWith({ status: value, page: undefined })}
                className={
                  status === value
                    ? "rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
                    : "rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
                }
              >
                {STATUS_META[value].label}{" "}
                <span className="tabular-nums">({stats.byStatus[value]})</span>
              </Link>
            ))}
          </nav>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-12 text-center">
            <Inbox className="size-6 text-muted" aria-hidden />
            <p className="text-sm font-medium">
              {query || status !== "all" ? "Nothing matches that filter." : "No enquiries yet."}
            </p>
            {(query || status !== "all") && (
              <Link href="/aka" className="text-sm text-brand underline-offset-4 hover:underline">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Received</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">From</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Project</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Budget</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-muted">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/aka/submissions/${row.id}`}
                        className="font-medium underline-offset-4 hover:text-brand hover:underline"
                      >
                        {row.name}
                      </Link>
                      <span className="block text-xs text-muted">{row.email}</span>
                      {row.company && (
                        <span className="block text-xs text-muted">{row.company}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-muted">{row.project_type ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-muted">
                      {row.budget ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={row.status} />
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
              Page {page} of {pageCount} · {total} enquiries
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
