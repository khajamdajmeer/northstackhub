/**
 * Everything about HR documents that is a business decision rather than code.
 *
 * Salary percentages, statutory thresholds and the signatory block all live
 * here so they can be corrected without touching the calculator or the PDF
 * templates. Nothing in this file is secret — it is printed on the documents.
 */

import { siteConfig } from "@/config/site";

/**
 * Legal identity printed at the head of every document.
 *
 * PLACEHOLDER — `registeredAddress` and `cin` need the real registered details
 * before anything is issued to a real employee. An offer letter carrying a
 * wrong registered address is a document you do not want in circulation.
 */
export const companyDetails = {
  legalName: "NorthStackHub",
  registeredAddress: "Hyderabad, Telangana, India",
  /** Company Identification Number. Leave empty to omit the line entirely. */
  cin: "",
  email: siteConfig.email,
  phone: siteConfig.phone,
  website: siteConfig.domain,
} as const;

/**
 * Who signs the letters — offer and increment.
 * PLACEHOLDER — confirm the name and designation before issuing.
 */
export const signatory = {
  name: "Ajmeer Khaja",
  designation: "Founder",
  place: "Hyderabad",
} as const;

/**
 * Who signs the internship certificate.
 *
 * Separate from `signatory` on purpose: a certificate is issued by the company
 * rather than by a named individual, so it is signed off by the team. Change
 * this to a person's name if you would rather they signed personally.
 */
export const certificateSignatory = {
  name: "HR Team",
  designation: companyDetails.legalName,
} as const;

/**
 * Payroll model — Telangana (Hyderabad).
 *
 * Earnings are derived top-down from monthly gross so the components always sum
 * back to exactly what was entered, with special allowance absorbing the
 * rounding. Deductions are then computed off those components.
 *
 * These are conventional Indian private-sector splits, not statutory
 * requirements — the only true statutory figures here are the PF rate and the
 * professional tax slab. Adjust freely.
 */
export const payrollConfig = {
  /** Share of monthly gross paid as basic. Convention is 40–50%. */
  basicPercentOfGross: 50,

  /**
   * HRA as a share of basic. 40% for non-metro, 50% for metro. Hyderabad is
   * non-metro for HRA purposes — only Delhi, Mumbai, Kolkata and Chennai count
   * as metros under the Income Tax Act.
   */
  hraPercentOfBasic: 40,

  /** Employee provident fund contribution, as a share of basic. */
  pfPercentOfBasic: 12,

  /**
   * Basic is capped at this figure before PF is computed.
   *
   * `null` means contribute on the whole basic, which is what this is set to —
   * on a ₹25,000 basic that is ₹3,000 rather than ₹1,800. Set it to 15000 to
   * apply the statutory EPF wage ceiling instead, which is the legal minimum
   * and what an employer contributing the bare minimum would use.
   *
   * This single value changes the net pay printed on every payslip, so change
   * it deliberately and re-run `npm run test:payroll`.
   */
  pfWageCeiling: null as number | null,

  /**
   * Telangana professional tax. Monthly amount by gross salary slab, applied to
   * the highest slab the gross clears.
   */
  professionalTaxSlabs: [
    { monthlyGrossAbove: 20000, tax: 200 },
    { monthlyGrossAbove: 15000, tax: 150 },
    { monthlyGrossAbove: 0, tax: 0 },
  ],

  /** Employer-side cost, shown in CTC breakdowns on offer letters only. */
  gratuityPercentOfBasic: 4.81,
} as const;

export const currency = {
  code: "INR",
  symbol: "₹",
} as const;

/** Indian digit grouping — 12,34,567 rather than 1,234,567. */
const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatAmount(value: number): string {
  return `${currency.symbol}${inrFormatter.format(Math.round(value))}`;
}

/** Without the symbol, for table columns that carry their own header. */
export function formatNumber(value: number): string {
  return inrFormatter.format(Math.round(value));
}
