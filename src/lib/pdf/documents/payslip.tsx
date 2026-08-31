import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { companyDetails, formatAmount } from "@/lib/admin/hr/config";
import { calculateSalary } from "@/lib/admin/hr/payroll";
import type { PayslipData } from "@/lib/admin/hr/schemas";
import type { Employee } from "@/lib/admin/hr/data";
import { DocumentFooter, Letterhead } from "../elements";
import {
  amountInWords,
  base,
  formatDate,
  formatMonth,
  pdfColors,
  registerPdfFonts,
} from "../theme";

/**
 * Monthly payslip.
 *
 * Carries the logo in the letterhead and nothing else — no diagonal watermark.
 * A payslip is read for its numbers, and a mark behind a column of figures only
 * makes them harder to read, on screen and worse on a photocopy.
 *
 * The breakdown is recomputed here from the stored gross rather than read from
 * saved component values, so the document can never disagree with the
 * calculator that produced it.
 */

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 700, color: pdfColors.ink },
  periodBar: {
    marginTop: 14,
    marginBottom: 16,
    padding: 10,
    backgroundColor: pdfColors.panel,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  identity: { flexDirection: "row", gap: 28, marginBottom: 18 },
  identityCol: { flex: 1 },
  idLabel: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: pdfColors.muted,
    fontWeight: 700,
    marginBottom: 2,
  },
  idValue: { fontSize: 10, color: pdfColors.ink },

  columns: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },
  columnHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: pdfColors.ink,
    paddingBottom: 5,
    marginBottom: 6,
  },
  columnTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: pdfColors.ink,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.hairline,
  },
  // No `flex: 1` here: this Text is stacked above the basis line inside a
  // column, and flexing it to fill the column makes the two overlap.
  lineLabel: { fontSize: 9.5, color: pdfColors.body, paddingRight: 8 },
  lineBasis: { fontSize: 7, color: pdfColors.muted },
  lineAmount: { fontSize: 9.5, color: pdfColors.ink, textAlign: "right" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 7,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: pdfColors.ink,
  },
  totalLabel: { fontSize: 9.5, fontWeight: 700, color: pdfColors.ink },

  net: {
    marginTop: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: pdfColors.brand,
    backgroundColor: "#fdf8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    fontSize: 8.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: 700,
    color: pdfColors.brandDeep,
  },
  netValue: { fontSize: 22, fontWeight: 700, color: pdfColors.ink },
  // No italic: only the regular and bold faces of Noto Sans are bundled, and
  // react-pdf throws rather than falling back when a style has no face. The
  // smaller muted type already separates this from the figure above it.
  words: { marginTop: 8, fontSize: 8.5, color: pdfColors.muted },

  note: { marginTop: 20, fontSize: 7.5, color: pdfColors.muted, lineHeight: 1.5 },
});

function Line({
  label,
  basis,
  amount,
}: {
  label: string;
  basis?: string;
  amount: number;
}) {
  return (
    <View style={styles.line}>
      <View style={{ flex: 1 }}>
        <Text style={styles.lineLabel}>{label}</Text>
        {basis ? <Text style={styles.lineBasis}>{basis}</Text> : null}
      </View>
      <Text style={styles.lineAmount}>{formatAmount(amount)}</Text>
    </View>
  );
}

export function Payslip({
  data,
  employee,
  employeeName,
  reference,
}: {
  data: PayslipData;
  employee: Employee | null;
  employeeName: string;
  reference: string;
}) {
  registerPdfFonts();

  const extras =
    data.otherDeductionAmount && data.otherDeductionAmount > 0
      ? [
          {
            label: data.otherDeductionLabel || "Other deduction",
            amount: data.otherDeductionAmount,
          },
        ]
      : [];

  const breakdown = calculateSalary(data.monthlyGross, extras);

  return (
    <Document
      title={`Payslip ${formatMonth(data.payPeriod)} — ${employeeName}`}
      author={companyDetails.legalName}
      subject={reference}
    >
      <Page size="A4" style={base.page}>
        <Letterhead />

        <View style={base.spread}>
          <Text style={styles.title}>Payslip</Text>
          <Text style={base.small}>{reference}</Text>
        </View>

        <View style={styles.periodBar}>
          <View>
            <Text style={styles.idLabel}>Pay period</Text>
            <Text style={[styles.idValue, { fontWeight: 700 }]}>
              {formatMonth(data.payPeriod)}
            </Text>
          </View>
          <View>
            <Text style={styles.idLabel}>Paid days</Text>
            <Text style={styles.idValue}>{data.paidDays}</Text>
          </View>
          <View>
            <Text style={styles.idLabel}>Loss of pay</Text>
            <Text style={styles.idValue}>{data.lopDays}</Text>
          </View>
          <View>
            <Text style={styles.idLabel}>Issued</Text>
            <Text style={styles.idValue}>{formatDate(data.issuedOn)}</Text>
          </View>
        </View>

        <View style={styles.identity}>
          <View style={styles.identityCol}>
            <Text style={styles.idLabel}>Employee</Text>
            <Text style={[styles.idValue, { fontWeight: 700 }]}>{employeeName}</Text>
            {employee?.designation ? (
              <Text style={base.small}>{employee.designation}</Text>
            ) : null}
            {employee?.department ? (
              <Text style={base.small}>{employee.department}</Text>
            ) : null}
          </View>
          <View style={styles.identityCol}>
            <Text style={styles.idLabel}>Employee code</Text>
            <Text style={styles.idValue}>{employee?.employee_code || "—"}</Text>
          </View>
          <View style={styles.identityCol}>
            <Text style={styles.idLabel}>Bank account</Text>
            <Text style={styles.idValue}>{data.bankAccount || "—"}</Text>
          </View>
          <View style={styles.identityCol}>
            <Text style={styles.idLabel}>PAN</Text>
            <Text style={styles.idValue}>{data.pan || "—"}</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <View style={styles.columnHead}>
              <Text style={styles.columnTitle}>Earnings</Text>
              <Text style={styles.columnTitle}>Amount</Text>
            </View>
            {breakdown.earnings.map((row) => (
              <Line key={row.label} label={row.label} basis={row.basis} amount={row.amount} />
            ))}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Gross earnings</Text>
              <Text style={styles.totalLabel}>{formatAmount(breakdown.totalEarnings)}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.columnHead}>
              <Text style={styles.columnTitle}>Deductions</Text>
              <Text style={styles.columnTitle}>Amount</Text>
            </View>
            {breakdown.deductions.length > 0 ? (
              breakdown.deductions.map((row) => (
                <Line
                  key={row.label}
                  label={row.label}
                  basis={row.basis}
                  amount={row.amount}
                />
              ))
            ) : (
              <Text style={[base.small, { paddingVertical: 6 }]}>No deductions.</Text>
            )}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total deductions</Text>
              <Text style={styles.totalLabel}>
                {formatAmount(breakdown.totalDeductions)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.net}>
          <View>
            <Text style={styles.netLabel}>Net pay</Text>
            <Text style={styles.words}>{amountInWords(breakdown.netPay)}</Text>
          </View>
          <Text style={styles.netValue}>{formatAmount(breakdown.netPay)}</Text>
        </View>

        <Text style={styles.note}>
          This is a computer-generated payslip and is valid without a signature. Provident
          fund and professional tax are deducted as required under the applicable rules of
          Telangana. Figures are in Indian rupees and rounded to the nearest rupee.
        </Text>

        <DocumentFooter reference={reference} />
      </Page>
    </Document>
  );
}
