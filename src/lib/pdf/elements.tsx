import {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import { companyDetails, signatory } from "@/lib/admin/hr/config";
import { base, pdfColors } from "./theme";

/**
 * Shared furniture: the mark, the letterhead, the diagonal watermark and the
 * signature block. Drawn as vectors rather than embedded images so the
 * documents stay small and print sharp at any size.
 */

/**
 * The NorthStackHub mark — the same amber tile and north star as
 * `src/components/site/logo.tsx`, redrawn with react-pdf primitives.
 *
 * `flat` drops the gradient for the watermark, where a gradient at 4% opacity
 * only muddies the shape.
 */
export function LogoMark({ size = 28, flat }: { size?: number; flat?: string }) {
  const radius = size * 0.25;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {!flat && (
        <Defs>
          <LinearGradient id="nshMark" x1="0" y1="0" x2="32" y2="32">
            <Stop offset="0" stopColor="#f5a524" />
            <Stop offset="1" stopColor="#c77b12" />
          </LinearGradient>
        </Defs>
      )}
      <Rect
        x="0"
        y="0"
        width="32"
        height="32"
        rx={(radius / size) * 32}
        fill={flat ?? "url(#nshMark)"}
      />
      <Path
        d="M16 6.5l2.4 5.4 5.6 1-4 4.1.9 5.9-4.9-2.8-4.9 2.8.9-5.9-4-4.1 5.6-1L16 6.5z"
        fill={flat ? "#ffffff" : "#08090b"}
      />
    </Svg>
  );
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
        <LogoMark size={210} flat={pdfColors.watermark} />
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
