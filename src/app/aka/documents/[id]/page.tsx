import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Mail, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { DocumentStatusBadge } from "@/components/admin/document-status-badge";
import { requireSession } from "@/lib/admin/dal";
import {
  getDocument,
  listDocumentsForEmployee,
} from "@/lib/admin/hr/data";
import {
  DOCUMENT_META,
  HR_DOCUMENT_STATUSES,
  type HrDocumentStatus,
} from "@/lib/admin/hr/schemas";
import { changeDocumentStatus, removeDocument } from "../actions";

export const metadata: Metadata = { title: "Document" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** camelCase key → "Camel case", for rendering the stored jsonb generically. */
function humanise(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const doc = await getDocument(id);
  if (!doc) notFound();

  const history = await listDocumentsForEmployee(doc.employee_id);
  const meta = DOCUMENT_META[doc.type];

  return (
    <AdminShell email={session.email} current="/aka/documents">
      <div className="flex flex-col gap-8">
        <div>
          <Link
            href="/aka/documents"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All documents
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted">{doc.reference}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {meta.label} — {doc.employee_name}
              </h1>
              <p className="mt-1 text-sm text-muted">
                Issued {formatDate(doc.issued_on)} by {doc.created_by}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DocumentStatusBadge status={doc.status} />
              <a
                href={`/aka/documents/${doc.id}/pdf`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-strong"
              >
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                Document details
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {Object.entries(doc.data).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs uppercase tracking-wide text-muted">
                      {humanise(key)}
                    </dt>
                    <dd className="mt-1 text-sm break-words">
                      {value === null || value === undefined || value === ""
                        ? "—"
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                Employee
              </h2>
              <div className="mt-4 flex flex-col gap-1">
                <p className="font-medium">{doc.employee?.full_name ?? doc.employee_name}</p>
                {doc.employee?.email ? (
                  <a
                    href={`mailto:${doc.employee.email}`}
                    className="inline-flex items-center gap-2 text-sm text-brand underline-offset-4 hover:underline"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    {doc.employee.email}
                  </a>
                ) : null}
                <p className="text-sm text-muted">
                  {[doc.employee?.designation, doc.employee?.department]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>

              {history.length > 1 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Their other documents
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {history
                      .filter((row) => row.id !== doc.id)
                      .map((row) => (
                        <li key={row.id} className="flex items-center justify-between text-sm">
                          <Link
                            href={`/aka/documents/${row.id}`}
                            className="underline-offset-4 hover:text-brand hover:underline"
                          >
                            {DOCUMENT_META[row.type].label}
                          </Link>
                          <span className="font-mono text-xs text-muted">
                            {row.reference}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-card border border-border bg-surface p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">
                Status
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {HR_DOCUMENT_STATUSES.map((status: HrDocumentStatus) => (
                  <form key={status} action={changeDocumentStatus}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={doc.status === status}
                      className={
                        doc.status === status
                          ? "w-full rounded-xl border border-brand/40 bg-brand-soft px-4 py-2.5 text-left text-sm font-medium text-brand-strong"
                          : "w-full rounded-xl border border-border px-4 py-2.5 text-left text-sm transition-colors hover:border-brand/50"
                      }
                    >
                      {status === "draft" && "Draft — not yet handed over"}
                      {status === "issued" && "Issued — sent to the employee"}
                      {status === "revoked" && "Revoked — no longer valid"}
                    </button>
                  </form>
                ))}
              </div>
            </section>

            <section className="rounded-card border border-rose-500/25 bg-rose-500/5 p-6">
              <h2 className="text-sm font-semibold">Delete permanently</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Removes the record for good. If the document was handed over, mark it
                Revoked instead so the reference stays traceable.
              </p>
              <form action={removeDocument} className="mt-4">
                <input type="hidden" name="id" value={doc.id} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-500/40 px-4 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete document
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
