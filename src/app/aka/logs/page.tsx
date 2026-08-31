import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { requireSession } from "@/lib/admin/dal";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listAuditLog } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Activity log" };
export const dynamic = "force-dynamic";

const PER_PAGE = 50;

/** Human labels for the action slugs written by the server actions. */
const ACTION_LABELS: Record<string, string> = {
  "auth.sign_in": "Signed in",
  "auth.sign_in_failed": "Failed sign-in",
  "auth.sign_out": "Signed out",
  "submission.status_changed": "Status changed",
  "submission.notes_updated": "Notes updated",
  "submission.deleted": "Enquiry deleted",
  "hr_document.created": "Document generated",
  "hr_document.status_changed": "Document status changed",
  "hr_document.deleted": "Document deleted",
};

/** Where a logged action's target lives, or null if it is not linkable. */
function targetHref(targetType: string | null, targetId: string | null): string | null {
  if (!targetId) return null;
  if (targetType === "contact_submission") return `/aka/submissions/${targetId}`;
  if (targetType === "hr_document") return `/aka/documents/${targetId}`;
  return null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireSession();
  const { page: pageParam } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminShell email={session.email} current="/aka/logs">
        <p className="rounded-card border border-border bg-surface p-6 text-sm text-muted">
          Connect Supabase to record and read the activity log.
        </p>
      </AdminShell>
    );
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const { rows, total } = await listAuditLog({ page, perPage: PER_PAGE });
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <AdminShell email={session.email} current="/aka/logs">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
          <p className="mt-1 text-sm text-muted">
            Sign-ins, failed attempts and every change made in this console.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-12 text-center">
            <ScrollText className="size-6 text-muted" aria-hidden />
            <p className="text-sm font-medium">Nothing recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th scope="col" className="px-4 py-3 font-medium text-muted">When</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Action</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Actor</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">Target</th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-muted">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={
                          row.action === "auth.sign_in_failed"
                            ? "font-medium text-rose-400"
                            : "font-medium"
                        }
                      >
                        {ACTION_LABELS[row.action] ?? row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-muted">{row.actor}</td>
                    <td className="px-4 py-3 align-top">
                      {targetHref(row.target_type, row.target_id) ? (
                        <Link
                          href={targetHref(row.target_type, row.target_id)!}
                          className="font-mono text-xs text-brand underline-offset-4 hover:underline"
                        >
                          {row.target_id!.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs text-muted">
                      {row.ip_address ?? "—"}
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
              Page {page} of {pageCount} · {total} entries
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/aka/logs?page=${page - 1}`}
                  className="rounded-full border border-border px-4 py-1.5 transition-colors hover:border-brand/50"
                >
                  Previous
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={`/aka/logs?page=${page + 1}`}
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
