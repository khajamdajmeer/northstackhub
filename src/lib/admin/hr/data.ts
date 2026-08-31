import "server-only";

import { requireSupabase } from "@/lib/supabase";
import type {
  EmployeeInput,
  HrDocumentStatus,
  HrDocumentType,
} from "./schemas";

/**
 * Reads and writes for employees and their generated documents.
 *
 * Called only from server components and server actions that have already
 * passed `requireSession()`. These rows carry salary figures and home
 * addresses, so nothing here is reachable without a session.
 */

export type Employee = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  address: string | null;
  employee_code: string | null;
  created_at: string;
  updated_at: string;
};

export type HrDocument = {
  id: string;
  employee_id: string;
  type: HrDocumentType;
  status: HrDocumentStatus;
  reference: string;
  data: Record<string, unknown>;
  employee_name: string;
  issued_on: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type HrDocumentWithEmployee = HrDocument & { employee: Employee };

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

/**
 * Creates the person, or updates them if the email is already on file.
 *
 * Email is the natural key: generating a second document for someone should
 * attach to their existing record rather than forking a duplicate. Fields left
 * blank on this form do not wipe values captured on an earlier one.
 */
export async function upsertEmployee(input: EmployeeInput): Promise<Employee> {
  const supabase = requireSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("employees")
    .select("*")
    .eq("email", input.email)
    .maybeSingle<Employee>();

  if (lookupError) throw new Error(`Could not look up employee: ${lookupError.message}`);

  const patch = {
    full_name: input.fullName,
    email: input.email,
    phone: input.phone ?? existing?.phone ?? null,
    designation: input.designation ?? existing?.designation ?? null,
    department: input.department ?? existing?.department ?? null,
    address: input.address ?? existing?.address ?? null,
    employee_code: input.employeeCode ?? existing?.employee_code ?? null,
  };

  const query = existing
    ? supabase.from("employees").update(patch).eq("id", existing.id)
    : supabase.from("employees").insert(patch);

  const { data, error } = await query.select().single<Employee>();
  if (error) throw new Error(`Could not save employee: ${error.message}`);
  return data;
}

export async function listEmployees(): Promise<Employee[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw new Error(`Could not list employees: ${error.message}`);
  return (data ?? []) as Employee[];
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle<Employee>();

  if (error) throw new Error(`Could not load employee: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

/**
 * Asks Postgres for the next reference. Done server-side in a single statement
 * so two admins generating at once cannot collide on a number.
 */
async function nextReference(type: HrDocumentType, year: number): Promise<string> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("next_hr_reference", {
    doc_type: type,
    doc_year: year,
  });

  if (error) throw new Error(`Could not allocate a reference: ${error.message}`);
  return data as string;
}

export async function createDocument(input: {
  employee: EmployeeInput;
  type: HrDocumentType;
  data: Record<string, unknown>;
  issuedOn: string;
  createdBy: string;
}): Promise<HrDocument> {
  const supabase = requireSupabase();

  const employee = await upsertEmployee(input.employee);
  const reference = await nextReference(
    input.type,
    new Date(input.issuedOn).getFullYear(),
  );

  const { data, error } = await supabase
    .from("hr_documents")
    .insert({
      employee_id: employee.id,
      type: input.type,
      reference,
      data: input.data,
      // Snapshotted deliberately: correcting the employee record later must not
      // change the name a document was already handed out under.
      employee_name: employee.full_name,
      issued_on: input.issuedOn,
      created_by: input.createdBy,
    })
    .select()
    .single<HrDocument>();

  if (error) throw new Error(`Could not save the document: ${error.message}`);
  return data;
}

export type DocumentFilters = {
  type?: HrDocumentType | "all";
  status?: HrDocumentStatus | "all";
  query?: string;
  page?: number;
  perPage?: number;
};

export async function listDocuments({
  type = "all",
  status = "all",
  query = "",
  page = 1,
  perPage = 25,
}: DocumentFilters = {}): Promise<{ rows: HrDocument[]; total: number }> {
  const supabase = requireSupabase();

  let request = supabase
    .from("hr_documents")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (type !== "all") request = request.eq("type", type);
  if (status !== "all") request = request.eq("status", status);

  const term = query.trim();
  if (term) {
    // Same escaping as the enquiry search: these characters would otherwise
    // terminate the PostgREST `or` expression they are embedded in.
    const safe = term.replace(/[,()*]/g, " ").trim();
    if (safe) {
      request = request.or(`employee_name.ilike.%${safe}%,reference.ilike.%${safe}%`);
    }
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await request.range(from, from + perPage - 1);

  if (error) throw new Error(`Could not list documents: ${error.message}`);
  return { rows: (data ?? []) as HrDocument[], total: count ?? 0 };
}

export async function getDocument(id: string): Promise<HrDocumentWithEmployee | null> {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("hr_documents")
    .select("*, employee:employees(*)")
    .eq("id", id)
    .maybeSingle<HrDocumentWithEmployee>();

  if (error) throw new Error(`Could not load the document: ${error.message}`);
  return data;
}

export async function listDocumentsForEmployee(employeeId: string): Promise<HrDocument[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("hr_documents")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load their documents: ${error.message}`);
  return (data ?? []) as HrDocument[];
}

export async function updateDocumentStatus(
  id: string,
  status: HrDocumentStatus,
): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("hr_documents").update({ status }).eq("id", id);
  if (error) throw new Error(`Could not update the status: ${error.message}`);
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("hr_documents").delete().eq("id", id);
  if (error) throw new Error(`Could not delete the document: ${error.message}`);
}

/** Counts for the dashboard header. */
export async function getDocumentStats(): Promise<{
  total: number;
  byType: Record<HrDocumentType, number>;
  issued: number;
  employees: number;
}> {
  const supabase = requireSupabase();

  const [{ data, error }, { count: employeeCount, error: employeeError }] =
    await Promise.all([
      supabase.from("hr_documents").select("type, status"),
      supabase.from("employees").select("id", { count: "exact", head: true }),
    ]);

  if (error) throw new Error(`Could not load stats: ${error.message}`);
  if (employeeError) throw new Error(`Could not count employees: ${employeeError.message}`);

  const byType = {
    internship_certificate: 0,
    payslip: 0,
    offer_letter: 0,
    increment_letter: 0,
  } as Record<HrDocumentType, number>;

  let issued = 0;
  for (const row of (data ?? []) as { type: HrDocumentType; status: HrDocumentStatus }[]) {
    if (row.type in byType) byType[row.type] += 1;
    if (row.status === "issued") issued += 1;
  }

  return { total: data?.length ?? 0, byType, issued, employees: employeeCount ?? 0 };
}
