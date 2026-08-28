import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status-badge";
import { NotesControl, StatusControl } from "@/components/admin/submission-controls";
import { requireSession } from "@/lib/admin/dal";
import { getSubmission, getSubmissionEvents } from "@/lib/admin/data";
import { STATUS_META } from "@/lib/admin/status";
import { removeSubmission } from "@/app/aka/actions";

export const metadata: Metadata = { title: "Enquiry" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const submission = await getSubmission(id);
  if (!submission) notFound();

  const events = await getSubmissionEvents(id);

  const facts = [
    { label: "Company", value: submission.company },
    { label: "Project type", value: submission.project_type },
    { label: "Budget", value: submission.budget },
    { label: "Timeline", value: submission.timeline },
    { label: "Source", value: submission.source },
    { label: "Received", value: formatDate(submission.created_at) },
  ];

  return (
    <AdminShell email={session.email} current="/aka">
      <div className="flex flex-col gap-8">
        <div>
          <Link
            href="/aka"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All enquiries
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{submission.name}</h1>
              <a
                href={`mailto:${submission.email}`}
                className="mt-1 inline-flex items-center gap-2 text-sm text-brand underline-offset-4 hover:underline"
              >
                <Mail className="size-4" aria-hidden />
                {submission.email}
              </a>
            </div>
            <StatusBadge status={submission.status} className="mt-1" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">Message</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {submission.message}
              </p>
            </section>

            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">Details</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs uppercase tracking-wide text-muted">{fact.label}</dt>
                    <dd className="mt-1 text-sm">{fact.value || "—"}</dd>
                  </div>
                ))}
              </dl>

              {(submission.ip_address || submission.referer) && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="font-mono text-xs leading-relaxed text-muted">
                    {submission.ip_address && <>IP {submission.ip_address}</>}
                    {submission.referer && <> · from {submission.referer}</>}
                  </p>
                  {submission.user_agent && (
                    <p className="mt-1 truncate font-mono text-xs text-muted">
                      {submission.user_agent}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">Activity</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                      aria-hidden
                    />
                    <div className="flex flex-col gap-0.5">
                      <p>
                        {event.from_status && event.to_status ? (
                          <>
                            {STATUS_META[event.from_status].label} →{" "}
                            <span className="font-medium">
                              {STATUS_META[event.to_status].label}
                            </span>
                          </>
                        ) : event.to_status ? (
                          <span className="font-medium">{STATUS_META[event.to_status].label}</span>
                        ) : (
                          "Updated"
                        )}
                      </p>
                      {event.note && (
                        <p className="text-muted text-pretty">{event.note}</p>
                      )}
                      <p className="font-mono text-xs text-muted">
                        {formatDate(event.created_at)} · {event.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-card border border-border bg-surface p-6">
              <StatusControl id={submission.id} status={submission.status} />
            </section>

            <section className="rounded-card border border-border bg-surface p-6">
              <NotesControl id={submission.id} notes={submission.notes} />
            </section>

            <section className="rounded-card border border-rose-500/25 bg-rose-500/5 p-6">
              <h2 className="text-sm font-semibold">Delete permanently</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Removes the enquiry and its activity trail for good. For anything you might want
                back, set the status to Archived instead.
              </p>
              <form action={removeSubmission} className="mt-4">
                <input type="hidden" name="id" value={submission.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-500/40 px-4 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete enquiry
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
