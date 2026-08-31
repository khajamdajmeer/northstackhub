import { z } from "zod";

/**
 * One zod schema per document type, validating the `data` jsonb before it is
 * stored and again before a PDF is rendered from it.
 *
 * Shared by the form (field errors) and the server action (the actual gate) —
 * the client-side check is convenience, this is the boundary.
 */

export const HR_DOCUMENT_TYPES = [
  "internship_certificate",
  "payslip",
  "offer_letter",
  "increment_letter",
] as const;

export type HrDocumentType = (typeof HR_DOCUMENT_TYPES)[number];

export const HR_DOCUMENT_STATUSES = ["draft", "issued", "revoked"] as const;
export type HrDocumentStatus = (typeof HR_DOCUMENT_STATUSES)[number];

export const DOCUMENT_META: Record<
  HrDocumentType,
  { label: string; short: string; description: string }
> = {
  internship_certificate: {
    label: "Internship certificate",
    short: "Certificate",
    description: "Confirms an internship was completed, with dates and focus area.",
  },
  payslip: {
    label: "Payslip",
    short: "Payslip",
    description: "Monthly salary statement with earnings, deductions and net pay.",
  },
  offer_letter: {
    label: "Offer letter",
    short: "Offer",
    description: "Formal offer of employment with the full annual CTC breakdown.",
  },
  increment_letter: {
    label: "Increment letter",
    short: "Increment",
    description: "Confirms a salary revision, with the old and new CTC.",
  },
};

// ---------------------------------------------------------------------------
// Shared field builders
// ---------------------------------------------------------------------------

const requiredText = (field: string, max = 200) =>
  z.string().trim().min(1, `${field} is required.`).max(max);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

/** HTML date inputs submit YYYY-MM-DD. */
const isoDate = (field: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a valid date.`);

const money = (field: string) =>
  z.coerce
    .number({ message: `${field} must be a number.` })
    .int(`${field} must be a whole rupee amount.`)
    .min(1, `${field} must be greater than zero.`)
    .max(100_000_000, `${field} looks too large — check the figure.`);

/** The person the document is about. Common to all four types. */
export const employeeSchema = z.object({
  fullName: requiredText("Full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: optionalText(40),
  designation: optionalText(120),
  department: optionalText(120),
  address: optionalText(400),
  employeeCode: optionalText(40),
});

export type EmployeeInput = z.output<typeof employeeSchema>;

// ---------------------------------------------------------------------------
// Per-document schemas
// ---------------------------------------------------------------------------

export const internshipCertificateSchema = z
  .object({
    role: requiredText("Internship role"),
    startDate: isoDate("Start date"),
    endDate: isoDate("End date"),
    /** Free text listing what they worked on. Rendered as the body paragraph. */
    focusArea: optionalText(600),
    performanceNote: optionalText(400),
    issuedOn: isoDate("Issue date"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date cannot be before the start date.",
    path: ["endDate"],
  });

export const payslipSchema = z.object({
  /** YYYY-MM from a month input. */
  payPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pay period must be a valid month."),
  monthlyGross: money("Monthly gross"),
  paidDays: z.coerce.number().min(0).max(31),
  lopDays: z.coerce.number().min(0).max(31),
  bankAccount: optionalText(40),
  pan: optionalText(20),
  /** Anything the calculator cannot derive — advances, TDS. */
  otherDeductionLabel: optionalText(80),
  otherDeductionAmount: z.coerce.number().min(0).max(100_000_000).optional(),
  issuedOn: isoDate("Issue date"),
});

export const offerLetterSchema = z.object({
  role: requiredText("Role"),
  annualCtc: money("Annual CTC"),
  joiningDate: isoDate("Joining date"),
  location: requiredText("Work location"),
  reportingTo: optionalText(120),
  probationMonths: z.coerce.number().int().min(0).max(24),
  noticePeriodDays: z.coerce.number().int().min(0).max(180),
  offerValidUntil: isoDate("Offer valid until"),
  issuedOn: isoDate("Issue date"),
});

export const incrementLetterSchema = z
  .object({
    role: requiredText("Role"),
    previousCtc: money("Previous CTC"),
    revisedCtc: money("Revised CTC"),
    effectiveFrom: isoDate("Effective from"),
    reason: optionalText(500),
    issuedOn: isoDate("Issue date"),
  })
  .refine((data) => data.revisedCtc !== data.previousCtc, {
    message: "The revised CTC is the same as the previous one.",
    path: ["revisedCtc"],
  });

export type InternshipCertificateData = z.output<typeof internshipCertificateSchema>;
export type PayslipData = z.output<typeof payslipSchema>;
export type OfferLetterData = z.output<typeof offerLetterSchema>;
export type IncrementLetterData = z.output<typeof incrementLetterSchema>;

export type HrDocumentData =
  | InternshipCertificateData
  | PayslipData
  | OfferLetterData
  | IncrementLetterData;

/** Picks the right schema for a type, so callers can stay generic. */
export function schemaFor(type: HrDocumentType) {
  switch (type) {
    case "internship_certificate":
      return internshipCertificateSchema;
    case "payslip":
      return payslipSchema;
    case "offer_letter":
      return offerLetterSchema;
    case "increment_letter":
      return incrementLetterSchema;
  }
}

export function isHrDocumentType(value: unknown): value is HrDocumentType {
  return typeof value === "string" && (HR_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function isHrDocumentStatus(value: unknown): value is HrDocumentStatus {
  return (
    typeof value === "string" && (HR_DOCUMENT_STATUSES as readonly string[]).includes(value)
  );
}
