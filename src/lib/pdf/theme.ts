import path from "node:path";
import { Font, StyleSheet } from "@react-pdf/renderer";

/**
 * Shared look for every generated document.
 *
 * Mirrors the site's Ink & Amber palette, but on paper: white ground and near
 * black text, with amber reserved for the rules and the one figure that
 * matters. A document is printed and photocopied, so nothing relies on colour
 * to be legible.
 */

export const pdfColors = {
  ink: "#101010",
  body: "#3a3a3a",
  muted: "#6b7280",
  hairline: "#e4e0d9",
  panel: "#faf8f5",
  brand: "#b06a00",
  brandDeep: "#8a5200",
  // Only for the diagonal watermark. Any darker and it fights the body text.
  watermark: "#f0ece5",
  positive: "#116b3a",
} as const;

/**
 * Noto Sans is bundled rather than using a built-in PDF font because the
 * standard 14 fonts use WinAnsi encoding, which has no ₹ (U+20B9) — a payslip
 * in Helvetica prints the rupee sign as a blank box.
 *
 * Registered from the filesystem, not a URL: a document must render without a
 * network call, and Vercel keeps `public/` readable at runtime.
 */
let fontsRegistered = false;

export function registerPdfFonts() {
  if (fontsRegistered) return;

  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: path.join(dir, "NotoSans-Regular.ttf"), fontWeight: 400 },
      { src: path.join(dir, "NotoSans-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // react-pdf hyphenates aggressively by default, which looks wrong in a formal
  // letter. Returning the whole word disables it.
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

export const base = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 10,
    lineHeight: 1.55,
    color: pdfColors.body,
    paddingTop: 46,
    paddingBottom: 64,
    paddingHorizontal: 52,
    backgroundColor: "#ffffff",
  },
  h1: {
    fontSize: 20,
    fontWeight: 700,
    color: pdfColors.ink,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 12,
    fontWeight: 700,
    color: pdfColors.ink,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: pdfColors.muted,
    fontWeight: 700,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  small: {
    fontSize: 8.5,
    color: pdfColors.muted,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.hairline,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});

/** 12 March 2026 — unambiguous for an international reader. */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "March 2026", for a payslip's pay period. */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Rupees in words, as Indian payslips conventionally carry beneath the net pay.
 * Uses the Indian numbering system — crore, lakh, thousand.
 */
export function amountInWords(amount: number): string {
  const value = Math.round(Math.abs(amount));
  if (value === 0) return "Zero rupees only";

  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  ];

  const underHundred = (n: number): string =>
    n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;

  const underThousand = (n: number): string => {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return [
      hundreds ? `${ones[hundreds]} hundred` : "",
      rest ? underHundred(rest) : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const parts: string[] = [];
  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1000);
  const remainder = value % 1000;

  if (crore) parts.push(`${underThousand(crore)} crore`);
  if (lakh) parts.push(`${underThousand(lakh)} lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} thousand`);
  if (remainder) parts.push(underThousand(remainder));

  const words = parts.join(" ").replace(/\s+/g, " ").trim();
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} rupees only`;
}
