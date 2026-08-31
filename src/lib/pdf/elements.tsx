import path from "node:path";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { companyDetails, signatory } from "@/lib/admin/hr/config";
import { base, pdfColors } from "./theme";

/**
 * Shared furniture: the mark, the letterhead, the diagonal watermark and the
 * signature block.
 */

/**
 * The real NorthStackHub artwork, from `public/brand`.
 *
 * A raster rather than the source SVG: react-pdf's Svg support covers only a
 * subset of the spec, and the mark is several hundred stroked paths with a
 * radial-gradient glow. The 1024px source is far above anything printed here —
 * the largest use is the certificate badge at 52pt — so it stays sharp.
 *
 * Read from the filesystem so a document never depends on a network fetch.
 */
const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const MARK = path.join(BRAND_DIR, "mark@1024.png");
/** The same artwork without its dark tile, for use over a light page. */
const MARK_PLAIN = path.join(BRAND_DIR, "mark-plain@1024.png");

export function LogoMark({
  size = 28,
  opacity,
  plain,
}: {
  size?: number;
  opacity?: number;
  plain?: boolean;
}) {
  // react-pdf's Image is not an HTML img and takes no alt prop — PDF alt text
  // is set on the Document, not per element — so the a11y rule cannot apply.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={plain ? MARK_PLAIN : MARK} style={{ width: size, height: size, opacity }} />;
}

const styles = StyleSheet.create({
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: pdfColors.ink,
    marginBottom: 22,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandName: { fontSize: 15, fontWeight: 700, color: pdfColors.ink, letterSpacing: -0.2 },
  contact: { alignItems: "flex-end" },
  contactLine: { fontSize: 8, color: pdfColors.muted, textAlign: "right" },

  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkInner: {
    alignItems: "center",
    // The "cross" watermark: one large mark laid diagonally across the sheet.
    transform: "rotate(-38deg)",
  },
  watermarkWord: {
    marginTop: 16,
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: 5,
    color: pdfColors.watermark,
  },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: pdfColors.hairline,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: pdfColors.muted },

  signature: { marginTop: 34, width: 210 },
  signatureRule: {
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink,
    marginBottom: 6,
    height: 34,
  },
  signatureName: { fontSize: 10, fontWeight: 700, color: pdfColors.ink },
});

export function Letterhead() {
  return (
    <View style={styles.letterhead}>
      <View style={styles.brandRow}>
        <LogoMark size={26} />
        <View>
          <Text style={styles.brandName}>{companyDetails.legalName}</Text>
          <Text style={[base.small, { fontSize: 7.5 }]}>{companyDetails.website}</Text>
        </View>
      </View>
      <View style={styles.contact}>
        <Text style={styles.contactLine}>{companyDetails.registeredAddress}</Text>
        <Text style={styles.contactLine}>{companyDetails.email}</Text>
        <Text style={styles.contactLine}>{companyDetails.phone}</Text>
        {companyDetails.cin ? (
          <Text style={styles.contactLine}>CIN {companyDetails.cin}</Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Diagonal mark across the sheet, for letters that should be visibly hard to
 * pass off as someone else's. Rendered first in the page so body text sits on
 * top of it.
 *
 * Deliberately not used on payslips — a watermark behind a table of figures
 * makes the figures harder to read, and a payslip is a working document.
 */
export function Watermark() {
  return (
    <View style={styles.watermarkLayer} fixed>
      <View style={styles.watermarkInner}>
        <LogoMark size={210} opacity={0.07} plain />
        <Text style={styles.watermarkWord}>NORTHSTACKHUB</Text>
      </View>
    </View>
  );
}

export function SignatureBlock({ label = "For " + companyDetails.legalName }) {
  return (
    <View style={styles.signature}>
      <Text style={[base.small, { marginBottom: 2 }]}>{label}</Text>
      <View style={styles.signatureRule} />
      <Text style={styles.signatureName}>{signatory.name}</Text>
      <Text style={base.small}>{signatory.designation}</Text>
    </View>
  );
}

/**
 * Fixed footer carrying the reference. `fixed` repeats it on every page, so a
 * letter that runs to two sheets identifies itself on both.
 */
export function DocumentFooter({ reference }: { reference: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {companyDetails.legalName} · {companyDetails.website}
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `${reference} · Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

/** Label/value pair used across the letter headers. */
export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={[base.small, { width: 92 }]}>{label}</Text>
      <Text style={[base.small, { color: pdfColors.ink, fontWeight: 700 }]}>{value}</Text>
    </View>
  );
}
