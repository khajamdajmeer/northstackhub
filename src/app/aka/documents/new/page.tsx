import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, BadgeIndianRupee, FileSignature, TrendingUp } from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { DocumentForm } from "@/components/admin/document-form";
import { requireSession } from "@/lib/admin/dal";
import {
  DOCUMENT_META,
  HR_DOCUMENT_TYPES,
  isHrDocumentType,
  type HrDocumentType,
} from "@/lib/admin/hr/schemas";

export const metadata: Metadata = { title: "New document" };
export const dynamic = "force-dynamic";

const icons: Record<HrDocumentType, typeof Award> = {
  internship_certificate: Award,
  payslip: BadgeIndianRupee,
  offer_letter: FileSignature,
  increment_letter: TrendingUp,
};

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireSession();
  const { type: rawType } = await searchParams;
  const type = isHrDocumentType(rawType) ? rawType : null;

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
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {type ? `New ${DOCUMENT_META[type].label.toLowerCase()}` : "New document"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {type
              ? DOCUMENT_META[type].description
              : "Pick what you are generating. Everything is stored and can be re-downloaded later."}
          </p>
        </div>

        {type ? (
          <DocumentForm type={type} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {HR_DOCUMENT_TYPES.map((value) => {
              const Icon = icons[value];
              return (
                <Link
                  key={value}
                  href={`/aka/documents/new?type=${value}`}
                  className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-6 transition-colors hover:border-brand/50"
                >
                  <Icon className="size-5 text-brand" aria-hidden />
                  <h2 className="text-base font-semibold tracking-tight">
                    {DOCUMENT_META[value].label}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted text-pretty">
                    {DOCUMENT_META[value].description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
