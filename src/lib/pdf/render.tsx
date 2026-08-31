import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import type { Employee, HrDocumentWithEmployee } from "@/lib/admin/hr/data";
import { schemaFor } from "@/lib/admin/hr/schemas";
import type {
  IncrementLetterData,
  InternshipCertificateData,
  OfferLetterData,
  PayslipData,
} from "@/lib/admin/hr/schemas";
import { IncrementLetter } from "./documents/increment-letter";
import { InternshipCertificate } from "./documents/internship-certificate";
import { OfferLetter } from "./documents/offer-letter";
import { Payslip } from "./documents/payslip";

/**
 * Turns a stored document row into PDF bytes.
 *
 * The `data` jsonb is re-validated here rather than trusted. It was validated
 * on the way in, but the row may have been written by an older version of the
 * form, and rendering a half-populated template produces a document that looks
 * finished and is not.
 */
export async function renderDocument(doc: HrDocumentWithEmployee): Promise<Buffer> {
  const parsed = schemaFor(doc.type).safeParse(doc.data);
  if (!parsed.success) {
    throw new Error(
      `Stored data for ${doc.reference} does not match the ${doc.type} schema: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }

  const employee: Employee | null = doc.employee ?? null;
  const shared = { employeeName: doc.employee_name, reference: doc.reference };

  switch (doc.type) {
    case "internship_certificate":
      return renderToBuffer(
        <InternshipCertificate
          {...shared}
          data={parsed.data as InternshipCertificateData}
        />,
      );
    case "payslip":
      return renderToBuffer(
        <Payslip {...shared} employee={employee} data={parsed.data as PayslipData} />,
      );
    case "offer_letter":
      return renderToBuffer(
        <OfferLetter {...shared} employee={employee} data={parsed.data as OfferLetterData} />,
      );
    case "increment_letter":
      return renderToBuffer(
        <IncrementLetter {...shared} data={parsed.data as IncrementLetterData} />,
      );
  }
}

/** `NSH-CERT-2026-0007-priya-sharma.pdf` — sorts by reference, reads as a name. */
export function pdfFilename(doc: HrDocumentWithEmployee): string {
  const slug = doc.employee_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${doc.reference.replace(/\//g, "-")}-${slug}.pdf`;
}
