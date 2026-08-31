import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { companyDetails, signatory } from "@/lib/admin/hr/config";
import type { InternshipCertificateData } from "@/lib/admin/hr/schemas";
import { LogoMark, SignatureBlock } from "../elements";
import { base, formatDate, pdfColors, registerPdfFonts } from "../theme";

/**
 * Internship certificate — landscape, and the only document designed to be
 * framed rather than filed.
 *
 * No diagonal watermark here: the mark is already the largest thing on the
 * sheet, and laying a second faint copy behind the recipient's own name is
 * exactly where a certificate starts looking cheap. Authenticity comes from the
 * reference number and the verification line in the footer instead.
 */

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 11,
    color: pdfColors.body,
    backgroundColor: "#ffffff",
    padding: 0,
  },
  // Amber spine down the left edge — the one strong colour, carrying the eye
  // down to the signature.
  spine: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 14,
    backgroundColor: pdfColors.brand,
  },
  frame: {
    position: "absolute",
    top: 22,
    left: 36,
    right: 22,
    bottom: 22,
    borderWidth: 0.75,
    borderColor: pdfColors.hairline,
  },
  body: { paddingTop: 44, paddingBottom: 40, paddingLeft: 68, paddingRight: 54 },

  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { fontSize: 16, fontWeight: 700, color: pdfColors.ink, letterSpacing: -0.2 },
  reference: { fontSize: 8, color: pdfColors.muted, letterSpacing: 0.6 },

  eyebrow: {
    marginTop: 34,
    fontSize: 9,
    letterSpacing: 3.4,
    textTransform: "uppercase",
    color: pdfColors.brand,
    fontWeight: 700,
  },
  title: {
    marginTop: 8,
    fontSize: 31,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: -0.9,
  },
  presented: { marginTop: 24, fontSize: 10, color: pdfColors.muted },
  name: {
    marginTop: 7,
    fontSize: 34,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: -0.9,
  },
  nameRule: {
    marginTop: 12,
    width: 190,
    borderBottomWidth: 2.5,
    borderBottomColor: pdfColors.brand,
  },

  citation: { marginTop: 20, fontSize: 11, lineHeight: 1.65, maxWidth: 470 },
  strong: { color: pdfColors.ink, fontWeight: 700 },

  facts: { flexDirection: "row", gap: 40, marginTop: 26 },
  factLabel: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: pdfColors.muted,
    fontWeight: 700,
  },
  factValue: { marginTop: 3, fontSize: 11, fontWeight: 700, color: pdfColors.ink },

  foot: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  verify: { fontSize: 7.5, color: pdfColors.muted, maxWidth: 250 },
});

export function InternshipCertificate({
  data,
  employeeName,
  reference,
}: {
  data: InternshipCertificateData;
  employeeName: string;
  reference: string;
}) {
  registerPdfFonts();

  return (
    <Document
      title={`Internship Certificate — ${employeeName}`}
      author={companyDetails.legalName}
      subject={reference}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.spine} fixed />
        <View style={styles.frame} fixed />

        <View style={styles.body}>
          <View style={styles.head}>
            <View style={styles.brandRow}>
              <LogoMark size={34} />
              <View>
                <Text style={styles.brandName}>{companyDetails.legalName}</Text>
                <Text style={[base.small, { fontSize: 7.5 }]}>
                  {companyDetails.website}
                </Text>
              </View>
            </View>
            <Text style={styles.reference}>{reference}</Text>
          </View>

          <Text style={styles.eyebrow}>Certificate of Internship</Text>
          <Text style={styles.title}>This is to certify that</Text>

          <Text style={styles.presented}>Presented to</Text>
          <Text style={styles.name}>{employeeName}</Text>
          <View style={styles.nameRule} />

          <Text style={styles.citation}>
            has successfully completed an internship as a{" "}
            <Text style={styles.strong}>{data.role}</Text> at{" "}
            <Text style={styles.strong}>{companyDetails.legalName}</Text> from{" "}
            <Text style={styles.strong}>{formatDate(data.startDate)}</Text> to{" "}
            <Text style={styles.strong}>{formatDate(data.endDate)}</Text>.
            {data.focusArea ? ` ${data.focusArea}` : ""}
            {data.performanceNote ? ` ${data.performanceNote}` : ""}
          </Text>

          <View style={styles.facts}>
            <View>
              <Text style={styles.factLabel}>Role</Text>
              <Text style={styles.factValue}>{data.role}</Text>
            </View>
            <View>
              <Text style={styles.factLabel}>Duration</Text>
              <Text style={styles.factValue}>
                {formatDate(data.startDate)} — {formatDate(data.endDate)}
              </Text>
            </View>
            <View>
              <Text style={styles.factLabel}>Issued</Text>
              <Text style={styles.factValue}>{formatDate(data.issuedOn)}</Text>
            </View>
          </View>

          <View style={styles.foot}>
            <Text style={styles.verify}>
              Issued at {signatory.place}. This certificate carries the reference{" "}
              {reference}; its authenticity can be confirmed with{" "}
              {companyDetails.legalName} at {companyDetails.email}.
            </Text>
            <SignatureBlock label={`For ${companyDetails.legalName}`} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
