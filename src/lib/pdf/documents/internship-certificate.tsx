import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  certificateSignatory,
  companyDetails,
  signatory,
} from "@/lib/admin/hr/config";
import type { InternshipCertificateData } from "@/lib/admin/hr/schemas";
import { LogoMark } from "../elements";
import { formatDate, pdfColors, registerPdfFonts } from "../theme";

/**
 * Internship certificate — the only document meant to be framed rather than
 * filed, so it is the only one that abandons the letterhead layout.
 *
 * Structure follows the classic award certificate: a full-bleed coloured ground
 * with a diagonal wedge and a wireframe mesh, a white card floating on top, a
 * centred title, the recipient's name under a rule, and the sign-off along the
 * bottom. Rendered in Ink & Amber rather than the usual navy and gold.
 *
 * No diagonal watermark: the ground already carries the brand, and a faint mark
 * behind the recipient's own name is where a certificate starts looking cheap.
 * Provenance comes from the reference and the verification line instead.
 */

/**
 * The frame's palette.
 *
 * Light by default: a certificate is printed, framed and photocopied, and a
 * near-black ground bleeding to the paper edge is both a poor photocopy and a
 * lot of toner. These are the site's light-theme tokens warmed slightly, so the
 * amber still reads as the brand rather than as beige.
 */
const frame = {
  ground: "#f7f3ec",
  wedge: "#f7d9a1",
  wedgeEdge: "#eec27a",
  mesh: "#d9a441",
} as const;

// A4 landscape, in points.
const PAGE_W = 841.89;
const PAGE_H = 595.28;

// The white card, inset from the page edge.
const CARD_X = 58;
const CARD_Y = 54;
const CARD_W = PAGE_W - CARD_X * 2;
const CARD_H = PAGE_H - CARD_Y * 2;

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 11,
    color: pdfColors.body,
    backgroundColor: frame.ground,
    padding: 0,
  },

  card: {
    // Painted after the backdrop Views purely by tree order.
    position: "absolute",
    top: CARD_Y,
    left: CARD_X,
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#ffffff",
    // A hairline, because white on warm off-white is not enough of a step to
    // read as a card on its own.
    borderWidth: 0.75,
    borderColor: pdfColors.hairline,
    paddingTop: 44,
    paddingBottom: 30,
    paddingHorizontal: 54,
  },

  // Rotated rather than drawn as a polygon, since the backdrop cannot use Svg.
  // Oversized and pushed off-page so the rotation never exposes a corner.
  wedge: {
    position: "absolute",
    top: -140,
    left: -190,
    width: 420,
    height: PAGE_H + 280,
    backgroundColor: frame.wedge,
    transform: "rotate(-10deg)",
  },
  wedgeEdge: {
    position: "absolute",
    top: -140,
    left: 230,
    width: 26,
    height: PAGE_H + 280,
    backgroundColor: frame.wedgeEdge,
    transform: "rotate(-10deg)",
  },
  mesh: { position: "absolute", height: 0.7 },
  meshWarm: { backgroundColor: frame.mesh, opacity: 0.55 },
  meshCool: { backgroundColor: frame.mesh, opacity: 0.4 },

  // Over the card's top-right corner, where the template puts its medal.
  badge: {
    position: "absolute",
    top: CARD_Y - 22,
    right: CARD_X - 4,
  },

  eyebrow: {
    textAlign: "center",
    fontSize: 8,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: pdfColors.brand,
    fontWeight: 700,
  },
  title: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 29,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: 0.6,
  },
  titleRule: {
    alignSelf: "center",
    marginTop: 12,
    width: 74,
    height: 3,
    backgroundColor: pdfColors.brand,
  },

  awardedTo: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 10.5,
    color: pdfColors.muted,
  },
  name: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 36,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: -0.6,
  },
  nameRule: {
    alignSelf: "center",
    marginTop: 10,
    width: 380,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.hairline,
  },

  citation: {
    marginTop: 16,
    marginHorizontal: 42,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 1.62,
    color: pdfColors.body,
  },
  strong: { color: pdfColors.ink, fontWeight: 700 },

  facts: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 34,
  },
  fact: { alignItems: "center" },
  factLabel: {
    fontSize: 7,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: pdfColors.muted,
    fontWeight: 700,
  },
  factValue: { marginTop: 3, fontSize: 9.5, fontWeight: 700, color: pdfColors.ink },

  // A flex spacer above this holds it to the bottom of the card, so the
  // sign-off keeps the same baseline whatever the citation length.
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signBlock: { width: 210 },
  signRule: {
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink,
    marginBottom: 5,
    height: 26,
  },
  signName: { fontSize: 10.5, fontWeight: 700, color: pdfColors.ink },
  signRole: { fontSize: 8.5, color: pdfColors.muted },

  verify: { width: 250, alignItems: "flex-end" },
  verifyLabel: {
    fontSize: 7,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: pdfColors.muted,
    fontWeight: 700,
  },
  verifyRef: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: 0.3,
  },
  verifyText: {
    marginTop: 5,
    fontSize: 7,
    lineHeight: 1.5,
    color: pdfColors.muted,
    textAlign: "right",
  },
});

/**
 * The coloured ground: an ink field with an amber wedge down the left and a few
 * mesh lines in the corners the card does not cover.
 *
 * Built from rotated Views rather than an Svg. react-pdf paints an Svg after
 * its siblings whatever the tree order, so an Svg backdrop covers the card
 * completely and no amount of ordering or zIndex rescues it. Views respect tree
 * order, which is also how the letter watermark sits behind its body text.
 */
function Backdrop() {
  return (
    <>
      <View style={styles.wedge} />
      <View style={styles.wedgeEdge} />

      {/* Mesh over the amber, top-left. */}
      <View style={[styles.mesh, styles.meshWarm, { top: 84, left: -40, width: 250, transform: "rotate(-52deg)" }]} />
      <View style={[styles.mesh, styles.meshWarm, { top: 150, left: -70, width: 320, transform: "rotate(-41deg)" }]} />
      <View style={[styles.mesh, styles.meshWarm, { top: 96, left: -30, width: 240, transform: "rotate(54deg)" }]} />
      <View style={[styles.mesh, styles.meshWarm, { top: 212, left: -10, width: 170, transform: "rotate(0deg)" }]} />

      {/* And over the ink, bottom-right. */}
      <View style={[styles.mesh, styles.meshCool, { top: 470, left: 640, width: 250, transform: "rotate(-38deg)" }]} />
      <View style={[styles.mesh, styles.meshCool, { top: 430, left: 560, width: 360, transform: "rotate(-30deg)" }]} />
      <View style={[styles.mesh, styles.meshCool, { top: 520, left: 600, width: 300, transform: "rotate(-46deg)" }]} />
    </>
  );
}

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
        <Backdrop />

        <View style={styles.card}>
          <Text style={styles.eyebrow}>{companyDetails.legalName}</Text>
          <Text style={styles.title}>CERTIFICATE OF INTERNSHIP</Text>
          <View style={styles.titleRule} />

          <Text style={styles.awardedTo}>
            This internship certificate is proudly awarded to
          </Text>
          <Text style={styles.name}>{employeeName}</Text>
          <View style={styles.nameRule} />

          <Text style={styles.citation}>
            for the successful completion of an internship as a{" "}
            <Text style={styles.strong}>{data.role}</Text> at{" "}
            <Text style={styles.strong}>{companyDetails.legalName}</Text>, from{" "}
            <Text style={styles.strong}>{formatDate(data.startDate)}</Text> to{" "}
            <Text style={styles.strong}>{formatDate(data.endDate)}</Text>.
            {data.focusArea ? ` ${data.focusArea}` : ""}
            {data.performanceNote ? ` ${data.performanceNote}` : ""}
          </Text>

          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Role</Text>
              <Text style={styles.factValue}>{data.role}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Duration</Text>
              <Text style={styles.factValue}>
                {formatDate(data.startDate)} — {formatDate(data.endDate)}
              </Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>Issued</Text>
              <Text style={styles.factValue}>{formatDate(data.issuedOn)}</Text>
            </View>
          </View>

          <View style={{ flexGrow: 1 }} />

          <View style={styles.footer}>
            <View style={styles.signBlock}>
              <View style={styles.signRule} />
              <Text style={styles.signName}>{certificateSignatory.name}</Text>
              <Text style={styles.signRole}>{certificateSignatory.designation}</Text>
            </View>

            <View style={styles.verify}>
              <Text style={styles.verifyLabel}>Certificate reference</Text>
              <Text style={styles.verifyRef}>{reference}</Text>
              <Text style={styles.verifyText}>
                Issued at {signatory.place} on {formatDate(data.issuedOn)}. Verify this
                certificate by quoting the reference above to{" "}
                {companyDetails.email}.
              </Text>
            </View>
          </View>
        </View>

        {/* Over the card's corner, where the template puts its medal. */}
        <View style={styles.badge}>
          <LogoMark size={52} />
        </View>
      </Page>
    </Document>
  );
}
