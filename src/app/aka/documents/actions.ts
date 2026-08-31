"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/admin/dal";
import { recordAudit } from "@/lib/admin/data";
import {
  createDocument,
  deleteDocument,
  updateDocumentStatus,
} from "@/lib/admin/hr/data";
import {
  employeeSchema,
  isHrDocumentStatus,
  isHrDocumentType,
  schemaFor,
} from "@/lib/admin/hr/schemas";
import type { DocumentFormState } from "@/lib/admin/hr/form-state";

/**
 * Mutations for HR documents.
 *
 * Server Actions are public endpoints, so every one re-checks the session
 * rather than trusting the page that rendered the form. These rows hold salary
 * figures — a missed check here is a payroll leak, not a defaced page.
 */

async function requestContext() {
  const headerList = await headers();
  return {
    ipAddress:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      null,
    userAgent: headerList.get("user-agent"),
  };
}

/**
 * Groups issues by field name.
 *
 * Hand-rolled rather than `z.flattenError`, whose overloads cannot resolve the
 * union of four different ZodError shapes that `schemaFor()` returns. Issues
 * with no path (a `.refine` on the object itself) are keyed under `_form`.
 */
function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    (grouped[key] ??= []).push(issue.message);
  }
  return grouped;
}

/** FormData → plain object, dropping empty strings so optionals stay undefined. */
function toObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function generateDocument(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const session = await requireSession();

  const type = formData.get("type");
  if (!isHrDocumentType(type)) {
    return { error: "Unknown document type.", fieldErrors: {} };
  }

  const raw = toObject(formData);

  const employee = employeeSchema.safeParse(raw);
  const document = schemaFor(type).safeParse(raw);

  if (!employee.success || !document.success) {
    // Both halves are validated before returning, so the form shows every
    // problem at once rather than one section at a time.
    return {
      error: "Some fields need attention.",
      fieldErrors: {
        ...(employee.success ? {} : fieldErrorsFrom(employee.error)),
        ...(document.success ? {} : fieldErrorsFrom(document.error)),
      },
    };
  }

  let id: string;
  let reference: string;

  try {
    const created = await createDocument({
      employee: employee.data,
      type,
      data: document.data,
      issuedOn: (document.data as { issuedOn: string }).issuedOn,
      createdBy: session.email,
    });
    id = created.id;
    reference = created.reference;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not generate the document.",
      fieldErrors: {},
    };
  }

  await recordAudit({
    actor: session.email,
    action: "hr_document.created",
    targetType: "hr_document",
    targetId: id,
    metadata: { type, reference, employee: employee.data.email },
    ...(await requestContext()),
  });

  revalidatePath("/aka/documents");
  // Straight to the new document so the PDF can be downloaded immediately.
  redirect(`/aka/documents/${id}`);
}

export async function changeDocumentStatus(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!id || !isHrDocumentStatus(status)) return;

  await updateDocumentStatus(id, status);
  await recordAudit({
    actor: session.email,
    action: "hr_document.status_changed",
    targetType: "hr_document",
    targetId: id,
    metadata: { status },
    ...(await requestContext()),
  });

  revalidatePath("/aka/documents");
  revalidatePath(`/aka/documents/${id}`);
}

export async function removeDocument(formData: FormData): Promise<void> {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteDocument(id);
  await recordAudit({
    actor: session.email,
    action: "hr_document.deleted",
    targetType: "hr_document",
    targetId: id,
    ...(await requestContext()),
  });

  revalidatePath("/aka/documents");
  redirect("/aka/documents");
}
