/**
 * Sample data and the render loop for `npm run docs:preview`.
 *
 * Everything happens inside this module — the templates, React and
 * @react-pdf/renderer all resolve through the same loader, which matters:
 * creating elements with one React instance and rendering them with another
 * leaves react-pdf reading `props` off null.
 *
 * Dev-only. Nothing in the application imports this.
 */

import path from "node:path";
import { mkdir } from "node:fs/promises";

import { renderToFile, type DocumentProps } from "@react-pdf/renderer";

import type { Employee } from "@/lib/admin/hr/data";
import { IncrementLetter } from "@/lib/pdf/documents/increment-letter";
import { InternshipCertificate } from "@/lib/pdf/documents/internship-certificate";
import { OfferLetter } from "@/lib/pdf/documents/offer-letter";
import { Payslip } from "@/lib/pdf/documents/payslip";

// Obviously fictional, so a stray preview file can never be mistaken for a real
// person's payslip.
const employeeName = "Priya Sharma";

const employee: Employee = {
  id: "preview",
  full_name: employeeName,
  email: "priya.sharma@example.com",
  phone: "+91 90000 00000",
  designation: "Software Engineer",
  department: "Engineering",
  address: "12 Jubilee Hills, Hyderabad 500033",
  employee_code: "NSH-014",
  created_at: "",
  updated_at: "",
};

export async function renderAll(outDir: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true });

  const written: string[] = [];

  const write = async (filename: string, element: React.ReactElement<DocumentProps>) => {
    const target = path.join(outDir, filename);
    await renderToFile(element, target);
    written.push(target);
  };

  await write(
    "internship-certificate.pdf",
      <InternshipCertificate
        employeeName={employeeName}
        reference="NSH/CERT/2026/0007"
        data={{
          role: "Full Stack Developer Intern",
          startDate: "2026-01-06",
          endDate: "2026-06-30",
          focusArea:
            "During the internship she contributed to the company's Next.js platform, building the booking flow and the API endpoints behind it.",
          performanceNote:
            "We found her diligent, quick to learn and a pleasure to work with.",
          issuedOn: "2026-07-02",
        }}
    />,
  );

  await write(
    "payslip.pdf",
      <Payslip
        employeeName={employeeName}
        employee={employee}
        reference="NSH/PAY/2026/0031"
        data={{
          payPeriod: "2026-08",
          monthlyGross: 50000,
          paidDays: 31,
          lopDays: 0,
          bankAccount: "XXXX XXXX 4417",
          pan: "ABCDE1234F",
          otherDeductionLabel: undefined,
          otherDeductionAmount: undefined,
          issuedOn: "2026-08-31",
        }}
    />,
  );

  await write(
    "offer-letter.pdf",
      <OfferLetter
        employeeName={employeeName}
        employee={employee}
        reference="NSH/OFR/2026/0004"
        data={{
          role: "Software Engineer",
          annualCtc: 1_200_000,
          joiningDate: "2026-09-15",
          location: "Hyderabad, India (remote)",
          reportingTo: "Ajmeer Khaja",
          probationMonths: 3,
          noticePeriodDays: 30,
          offerValidUntil: "2026-09-08",
          issuedOn: "2026-08-31",
        }}
    />,
  );

  await write(
    "increment-letter.pdf",
      <IncrementLetter
        employeeName={employeeName}
        reference="NSH/INC/2026/0002"
        data={{
          role: "Software Engineer",
          previousCtc: 1_000_000,
          revisedCtc: 1_200_000,
          effectiveFrom: "2026-09-01",
          reason:
            "This reflects your work on the payments platform and the responsibility you have taken on since.",
          issuedOn: "2026-08-31",
        }}
    />,
  );

  return written;
}
