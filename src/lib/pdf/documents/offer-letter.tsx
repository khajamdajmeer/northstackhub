import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { companyDetails, formatAmount, signatory } from "@/lib/admin/hr/config";
import { calculateCtc } from "@/lib/admin/hr/payroll";
import type { OfferLetterData } from "@/lib/admin/hr/schemas";
import type { Employee } from "@/lib/admin/hr/data";
import {
  DocumentFooter,
  Letterhead,
  MetaRow,
  SignatureBlock,
  Watermark,
} from "../elements";
import { base, formatDate, pdfColors, registerPdfFonts } from "../theme";

/**
 * Offer of employment, with the full annual CTC breakdown the request called a
 * "drafting offer letter breakdown".
 *
 * Carries the diagonal watermark. The breakdown separates what reaches the
 * bank from employer-side cost (employer PF, gratuity) that sits inside CTC but
 * never appears in take-home — the single most common source of a candidate
 * feeling misled by an Indian offer letter.
 */

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 700, color: pdfColors.ink, marginBottom: 3 },
  meta: { marginTop: 14, marginBottom: 18 },
  salutation: { marginBottom: 10, fontSize: 10.5, color: pdfColors.ink },

  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: pdfColors.ink,
    paddingBottom: 5,
    marginBottom: 4,
  },
  th: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: pdfColors.ink,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 4.5,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.hairline,
  },
  // No `flex: 1`: this sits above the basis line inside a column, and
  // flexing it to fill the column makes the two overlap.
  cellLabel: { fontSize: 9.5 },
  cellBasis: { fontSize: 7, color: pdfColors.muted },
  cellAmount: { width: 95, fontSize: 9.5, textAlign: "right", color: pdfColors.ink },
  totalRow: {
    flexDirection: "row",
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: pdfColors.ink,
  },
  totalText: { fontSize: 10.5, fontWeight: 700, color: pdfColors.ink },

  takeHome: {
    marginTop: 12,
    padding: 10,
    backgroundColor: pdfColors.panel,
    borderLeftWidth: 3,
    borderLeftColor: pdfColors.brand,
  },

  sectionTitle: { marginTop: 20, marginBottom: 7, fontSize: 11, fontWeight: 700, color: pdfColors.ink },
  bullet: { flexDirection: "row", marginBottom: 4 },
  dot: { width: 12, fontSize: 10, color: pdfColors.brand },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
});

export function OfferLetter({
  data,
  employee,
  employeeName,
  reference,
}: {
  data: OfferLetterData;
  employee: Employee | null;
  employeeName: string;
  reference: string;
}) {
  registerPdfFonts();
  const ctc = calculateCtc(data.annualCtc);

  const terms = [
    `Your employment begins on ${formatDate(data.joiningDate)} and is based at ${data.location}.`,
    data.reportingTo ? `You will report to ${data.reportingTo}.` : null,
    data.probationMonths > 0
      ? `The first ${data.probationMonths} months are a probationary period, during which either party may end the engagement with two weeks' written notice.`
      : null,
    `After probation, either party may end the engagement with ${data.noticePeriodDays} days' written notice.`,
    "You confirm that you are free of any obligation that would prevent you taking up this role, and that work produced in the course of your employment belongs to the company.",
    `This offer is open until ${formatDate(data.offerValidUntil)}. Please sign and return a copy to accept it.`,
  ].filter(Boolean) as string[];

  return (
    <Document
      title={`Offer Letter — ${employeeName}`}
      author={companyDetails.legalName}
      subject={reference}
    >
      <Page size="A4" style={base.page}>
        <Watermark />
        <Letterhead />

        <View style={base.spread}>
          <View>
            <Text style={styles.title}>Letter of Offer</Text>
            <Text style={base.small}>Private and confidential</Text>
          </View>
          <Text style={base.small}>{reference}</Text>
        </View>

        <View style={styles.meta}>
          <MetaRow label="Date" value={formatDate(data.issuedOn)} />
          <MetaRow label="Candidate" value={employeeName} />
          {employee?.address ? <MetaRow label="Address" value={employee.address} /> : null}
          <MetaRow label="Role" value={data.role} />
        </View>

        <Text style={styles.salutation}>Dear {employeeName.split(" ")[0]},</Text>

        <Text style={base.paragraph}>
          We are pleased to offer you the position of{" "}
          <Text style={{ fontWeight: 700, color: pdfColors.ink }}>{data.role}</Text> at{" "}
          {companyDetails.legalName}. We were impressed by your work, and we think you will
          do well here. The terms of the offer are set out below.
        </Text>

        <Text style={styles.sectionTitle}>Compensation</Text>
        <Text style={[base.paragraph, { marginBottom: 12 }]}>
          Your annual cost to company will be{" "}
          <Text style={{ fontWeight: 700, color: pdfColors.ink }}>
            {formatAmount(ctc.annualCtc)}
          </Text>
          , made up as follows.
        </Text>

        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Component</Text>
          <Text style={[styles.th, { width: 95, textAlign: "right" }]}>Annual</Text>
        </View>

        {ctc.components.map((row) => (
          <View key={row.label} style={styles.tr}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cellLabel}>{row.label}</Text>
              {row.basis ? <Text style={styles.cellBasis}>{row.basis}</Text> : null}
            </View>
            <Text style={styles.cellAmount}>{formatAmount(row.amount)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={[styles.totalText, { flex: 1 }]}>Total cost to company</Text>
          <Text style={[styles.totalText, { width: 95, textAlign: "right" }]}>
            {formatAmount(ctc.annualCtc)}
          </Text>
        </View>

        <View style={styles.takeHome}>
          <Text style={{ fontSize: 9.5, lineHeight: 1.5 }}>
            Your monthly gross will be{" "}
            <Text style={{ fontWeight: 700, color: pdfColors.ink }}>
              {formatAmount(ctc.monthlyGross)}
            </Text>
            , and your monthly take-home approximately{" "}
            <Text style={{ fontWeight: 700, color: pdfColors.ink }}>
              {formatAmount(ctc.monthlyNet)}
            </Text>{" "}
            after provident fund and professional tax. Employer provident fund and gratuity
            are part of your cost to company but are not paid to you monthly. Income tax is
            deducted at source based on your declarations and is not included here.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Terms</Text>
        {terms.map((term) => (
          <View key={term} style={styles.bullet}>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.bulletText}>{term}</Text>
          </View>
        ))}

        <Text style={[base.paragraph, { marginTop: 16 }]}>
          We are glad to have you join us. If anything above is unclear, reply to this
          letter and we will talk it through before you sign.
        </Text>

        <View style={base.spread}>
          <SignatureBlock />
          <View style={{ width: 210, marginTop: 34 }}>
            <Text style={[base.small, { marginBottom: 2 }]}>Accepted by {employeeName}</Text>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: pdfColors.ink,
                marginBottom: 6,
                height: 34,
              }}
            />
            <Text style={base.small}>Signature and date</Text>
          </View>
        </View>

        <Text style={[base.small, { marginTop: 14 }]}>
          Issued at {signatory.place} on {formatDate(data.issuedOn)}.
        </Text>

        <DocumentFooter reference={reference} />
      </Page>
    </Document>
  );
}
