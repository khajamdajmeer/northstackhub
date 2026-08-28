import "server-only";

import { getSupabase, requireSupabase } from "@/lib/supabase";
import {
  OPEN_STATUSES,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "./status";

/**
 * Every read and write against the enquiry tables.
 *
 * Kept in one module so the console's authorization story is auditable: these
 * functions are only ever called from server components and server actions that
 * have already been through `requireSession()`.
 */

export type Submission = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  budget: string | null;
  timeline: string | null;
  message: string;
  status: SubmissionStatus;
  notes: string | null;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmissionEvent = {
  id: string;
  submission_id: string;
  from_status: SubmissionStatus | null;
  to_status: SubmissionStatus | null;
  note: string | null;
  actor: string;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Writes from the public site
// ---------------------------------------------------------------------------

export type NewSubmission = {
  name: string;
  email: string;
  company?: string | null;
  projectType?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
};

/**
 * Records an enquiry and opens its activity trail.
 *
 * Returns null instead of throwing when Supabase is unconfigured, so a missing
 * database never costs the visitor their message — the contact route still
 * emails it. The caller decides how loudly to complain.
 */
export async function recordSubmission(
  input: NewSubmission,
): Promise<Submission | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("contact_submissions")
    .insert({
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      project_type: input.projectType ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      message: input.message,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      referer: input.referer ?? null,
    })
    .select()
    .single<Submission>();

  if (error) throw new Error(`Failed to record submission: ${error.message}`);

  await supabase.from("submission_events").insert({
    submission_id: data.id,
    from_status: null,
    to_status: "new",
    note: "Enquiry received from the website contact form.",
    actor: "system",
  });

  return data;
}

// ---------------------------------------------------------------------------
// Console reads
// ---------------------------------------------------------------------------

export type SubmissionFilters = {
  status?: SubmissionStatus | "all";
  /** Matched against name, email, company and message. */
  query?: string;
  page?: number;
  perPage?: number;
};

export async function listSubmissions({
  status = "all",
  query = "",
  page = 1,
  perPage = 25,
}: SubmissionFilters = {}): Promise<{ rows: Submission[]; total: number }> {
  const supabase = requireSupabase();

  let request = supabase
    .from("contact_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") request = request.eq("status", status);

  const term = query.trim();
  if (term) {
    // Commas and parentheses would otherwise terminate the PostgREST `or`
    // expression and let a search box alter the filter it is embedded in.
    const safe = term.replace(/[,()*]/g, " ").trim();
    if (safe) {
      request = request.or(
        [
          `name.ilike.%${safe}%`,
          `email.ilike.%${safe}%`,
          `company.ilike.%${safe}%`,
          `message.ilike.%${safe}%`,
        ].join(","),
      );
    }
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await request.range(from, from + perPage - 1);

  if (error) throw new Error(`Failed to list submissions: ${error.message}`);
  return { rows: (data ?? []) as Submission[], total: count ?? 0 };
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle<Submission>();

  if (error) throw new Error(`Failed to load submission: ${error.message}`);
  return data;
}

export async function getSubmissionEvents(id: string): Promise<SubmissionEvent[]> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("submission_events")
    .select("*")
    .eq("submission_id", id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load activity: ${error.message}`);
  return (data ?? []) as SubmissionEvent[];
}

/** Counts per status, plus totals the dashboard header reads. */
export async function getSubmissionStats(): Promise<{
  total: number;
  open: number;
  last7Days: number;
  byStatus: Record<SubmissionStatus, number>;
}> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("status, created_at");

  if (error) throw new Error(`Failed to load stats: ${error.message}`);

  const byStatus = Object.fromEntries(
    SUBMISSION_STATUSES.map((status) => [status, 0]),
  ) as Record<SubmissionStatus, number>;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let last7Days = 0;

  for (const row of (data ?? []) as { status: SubmissionStatus; created_at: string }[]) {
    if (row.status in byStatus) byStatus[row.status] += 1;
    if (new Date(row.created_at).getTime() >= weekAgo) last7Days += 1;
  }

  const open = OPEN_STATUSES.reduce((sum, status) => sum + byStatus[status], 0);

  return { total: data?.length ?? 0, open, last7Days, byStatus };
}

// ---------------------------------------------------------------------------
// Console writes
// ---------------------------------------------------------------------------

export async function updateSubmissionStatus(
  id: string,
  next: SubmissionStatus,
  actor: string,
  note?: string,
): Promise<void> {
  const supabase = requireSupabase();

  const current = await getSubmission(id);
  if (!current) throw new Error("That enquiry no longer exists.");
  if (current.status === next && !note) return;

  const { error } = await supabase
    .from("contact_submissions")
    .update({ status: next })
    .eq("id", id);

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  await supabase.from("submission_events").insert({
    submission_id: id,
    from_status: current.status,
    to_status: next,
    note: note ?? null,
    actor,
  });
}

export async function updateSubmissionNotes(
  id: string,
  notes: string,
  actor: string,
): Promise<void> {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from("contact_submissions")
    .update({ notes: notes.trim() || null })
    .eq("id", id);

  if (error) throw new Error(`Failed to save notes: ${error.message}`);

  await supabase.from("submission_events").insert({
    submission_id: id,
    note: "Notes updated.",
    actor,
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete enquiry: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditInput = {
  actor: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Never throws. An audit write failing must not take down the action it is
 * recording — a failed sign-in that also 500s would be worse than a gap in the
 * log, and the failure is surfaced on the server console either way.
 */
export async function recordAudit(entry: AuditInput): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("admin_audit_log").insert({
    actor: entry.actor,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
  });

  if (error) console.error("[audit] failed to record entry", entry.action, error.message);
}

export async function listAuditLog({
  page = 1,
  perPage = 50,
  action = "all",
}: { page?: number; perPage?: number; action?: string } = {}): Promise<{
  rows: AuditEntry[];
  total: number;
}> {
  const supabase = requireSupabase();

  let request = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action !== "all") request = request.eq("action", action);

  const from = (page - 1) * perPage;
  const { data, error, count } = await request.range(from, from + perPage - 1);

  if (error) throw new Error(`Failed to load audit log: ${error.message}`);
  return { rows: (data ?? []) as AuditEntry[], total: count ?? 0 };
}
