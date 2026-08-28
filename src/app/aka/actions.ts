"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/admin/dal";
import {
  deleteSubmission,
  recordAudit,
  updateSubmissionNotes,
  updateSubmissionStatus,
} from "@/lib/admin/data";
import { isSubmissionStatus } from "@/lib/admin/status";
import type { ActionState } from "@/lib/admin/action-state";

/**
 * Mutations for the console.
 *
 * Server Actions are public HTTP endpoints, so every one of these re-checks the
 * session itself. Being reachable only from a protected page is not protection.
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

export async function changeStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { error: "Missing enquiry id.", ok: false };
  if (!isSubmissionStatus(status)) return { error: "Unknown status.", ok: false };

  try {
    await updateSubmissionStatus(id, status, session.email, note || undefined);
    await recordAudit({
      actor: session.email,
      action: "submission.status_changed",
      targetType: "contact_submission",
      targetId: id,
      metadata: { status, note: note || null },
      ...(await requestContext()),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update the status.",
      ok: false,
    };
  }

  revalidatePath("/aka");
  revalidatePath(`/aka/submissions/${id}`);
  return { error: null, ok: true };
}

export async function saveNotes(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!id) return { error: "Missing enquiry id.", ok: false };

  try {
    await updateSubmissionNotes(id, notes, session.email);
    await recordAudit({
      actor: session.email,
      action: "submission.notes_updated",
      targetType: "contact_submission",
      targetId: id,
      ...(await requestContext()),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save the notes.",
      ok: false,
    };
  }

  revalidatePath(`/aka/submissions/${id}`);
  return { error: null, ok: true };
}

/**
 * Hard delete, used for spam. Status `archived` is the reversible option and is
 * what the UI steers towards; this exists so genuinely junk rows can be removed
 * rather than accumulating forever.
 */
export async function removeSubmission(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteSubmission(id);
  await recordAudit({
    actor: session.email,
    action: "submission.deleted",
    targetType: "contact_submission",
    targetId: id,
    ...(await requestContext()),
  });

  revalidatePath("/aka");
  // The detail page for this row no longer resolves, so never return to it.
  redirect("/aka");
}
