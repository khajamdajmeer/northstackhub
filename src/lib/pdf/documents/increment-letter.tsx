import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { companyDetails, formatAmount, signatory } from "@/lib/admin/hr/config";
import { calculateCtc, incrementPercent } from "@/lib/admin/hr/payroll";
import type { IncrementLetterData } from "@/lib/admin/hr/schemas";
import {
  DocumentFooter,
  Letterhead,
  MetaRow,
  SignatureBlock,
  Watermark,
} from "../elements";
import { base, formatDate, pdfColors, registerPdfFonts } from "../theme";

/**
 * Salary revision letter. Carries the diagonal watermark, like the offer.
 *
 * Leads with the before/after comparison rather than burying the new figure in
 * a paragraph — the revised number and the percentage are the only two things
 * anyone reads this letter for.
 */

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 700, color: pdfColors.ink, marginBottom: 3 },
  meta: { marginTop: 14, marginBottom: 18 },
  salutation: { marginBottom: 10, fontSize: 10.5, color: pdfColors.ink },

  compare: { flexDirection: "row", gap: 12, marginTop: 6, marginBottom: 16 },
  card: {
    flex: 1,
    padding: 12,
    borderWidth: 0.75,
    borderColor: pdfColors.hairline,
    backgroundColor: pdfColors.panel,
  },
  cardActive: {
    flex: 1,
    padding: 12,
    borderWidth: 1.5,
    borderColor: pdfColors.brand,
    backgroundColor: "#fdf8f0",
  },
  cardLabel: {
    fontSize: 7.5,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontWeight: 700,
    color: pdfColors.muted,
  },
  cardValue: { marginTop: 5, fontSize: 17, fontWeight: 700, color: pdfColors.ink },
  cardNote: { marginTop: 3, fontSize: 8, color: pdfColors.muted },
  riseLabel: { color: pdfColors.brandDeep },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 11,
    fontWeight: 700,
    color: pdfColors.ink,
  },
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
});

export function IncrementLetter({
  data,
  employeeName,
  reference,
}: {
  data: IncrementLetterData;
  employeeName: string;
  reference: string;
}) {
  registerPdfFonts();

  const percent = incrementPercent(data.previousCtc, data.revisedCtc);
  const revised = calculateCtc(data.revisedCtc);
  const isRise = data.revisedCtc > data.previousCtc;

  return (
    <Document
      title={`Increment Letter — ${employeeName}`}
      author={companyDetails.legalName}
      subject={reference}
    >
      <Page size="A4" style={base.page}>
        <Watermark />
        <Letterhead />

        <View style={base.spread}>
          <View>
            <Text style={styles.title}>Salary Revision</Text>
            <Text style={base.small}>Private and confidential</Text>
          </View>
          <Text style={base.small}>{reference}</Text>
        </View>

        <View style={styles.meta}>
          <MetaRow label="Date" value={formatDate(data.issuedOn)} />
          <MetaRow label="Employee" value={employeeName} />
          <MetaRow label="Role" value={data.role} />
          <MetaRow label="Effective from" value={formatDate(data.effectiveFrom)} />
        </View>

        <Text style={styles.salutation}>Dear {employeeName.split(" ")[0]},</Text>

        <Text style={base.paragraph}>
          Following our review, your compensation has been revised with effect from{" "}
          <Text style={{ fontWeight: 700, color: pdfColors.ink }}>
            {formatDate(data.effectiveFrom)}
          </Text>
          .{data.reason ? ` ${data.reason}` : ""}
        </Text>

        <View style={styles.compare}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Previous CTC</Text>
            <Text style={styles.cardValue}>{formatAmount(data.previousCtc)}</Text>
            <Text style={styles.cardNote}>per annum</Text>
          </View>
          <View style={styles.cardActive}>
            <Text style={[styles.cardLabel, styles.riseLabel]}>Revised CTC</Text>
            <Text style={styles.cardValue}>{formatAmount(data.revisedCtc)}</Text>
            <Text style={styles.cardNote}>per annum</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{isRise ? "Increase" : "Change"}</Text>
            <Text style={styles.cardValue}>
              {isRise ? "+" : ""}
              {percent}%
            </Text>
            <Text style={styles.cardNote}>
              {isRise ? "+" : ""}
              {formatAmount(data.revisedCtc - data.previousCtc)} per annum
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Revised breakdown</Text>

        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Component</Text>
          <Text style={[styles.th, { width: 95, textAlign: "right" }]}>Annual</Text>
        </View>

        {revised.components.map((row) => (
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
            {formatAmount(revised.annualCtc)}
          </Text>
        </View>

        <Text style={[base.paragraph, { marginTop: 14 }]}>
          Your revised monthly gross is {formatAmount(revised.monthlyGross)}, with an
          approximate take-home of {formatAmount(revised.monthlyNet)} after provident fund
          and professional tax. All other terms of your employment remain unchanged.
        </Text>

        <Text style={base.paragraph}>
          Thank you for the work you have put in. We are glad to have you with us.
        </Text>

        <SignatureBlock />

        <Text style={[base.small, { marginTop: 14 }]}>
          Issued at {signatory.place} on {formatDate(data.issuedOn)}.
        </Text>

        <DocumentFooter reference={reference} />
      </Page>
    </Document>
  );
}
