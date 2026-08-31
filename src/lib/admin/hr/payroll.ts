// Explicit .ts extension so Node's ESM resolver can load this module directly
// for `npm run test:payroll`, without a bundler or a test runner in between.
// Turbopack resolves it identically.
import { payrollConfig } from "./config.ts";

/**
 * Salary breakdown.
 *
 * Pure functions, no imports beyond the config, so the same code runs in the
 * browser (live preview as you type in the form) and on the server (when the
 * PDF is rendered). The document must never show a different number from the
 * form that produced it.
 *
 * Every figure is a whole rupee. Payslips do not carry paise, and rounding at
 * the end of a chain of percentages is how a breakdown stops summing to the
 * gross it came from — so each component is rounded as it is derived and the
 * special allowance absorbs whatever is left.
 */

export type SalaryComponent = {
  label: string;
  amount: number;
  /** Shown in small type under the label, e.g. "50% of gross". */
  basis?: string;
};

export type SalaryBreakdown = {
  monthlyGross: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
};

const round = (n: number) => Math.round(n);

/**
 * Telangana professional tax for a given monthly gross.
 * Slabs are read highest-first, so order in the config does not matter.
 */
export function professionalTaxFor(monthlyGross: number): number {
  const slabs = [...payrollConfig.professionalTaxSlabs].sort(
    (a, b) => b.monthlyGrossAbove - a.monthlyGrossAbove,
  );
  return slabs.find((slab) => monthlyGross > slab.monthlyGrossAbove)?.tax ?? 0;
}

/** Provident fund contribution, respecting the wage ceiling if one is set. */
export function providentFundFor(basic: number): number {
  const ceiling = payrollConfig.pfWageCeiling;
  const pensionable = ceiling === null ? basic : Math.min(basic, ceiling);
  return round((pensionable * payrollConfig.pfPercentOfBasic) / 100);
}

/**
 * Splits a monthly gross into earnings and statutory deductions.
 *
 * `extraDeductions` covers anything the calculator cannot know — a salary
 * advance, loss of pay, TDS. They are appended after the statutory rows.
 */
export function calculateSalary(
  monthlyGross: number,
  extraDeductions: SalaryComponent[] = [],
): SalaryBreakdown {
  const gross = Math.max(0, round(monthlyGross));

  const basic = round((gross * payrollConfig.basicPercentOfGross) / 100);
  const hra = round((basic * payrollConfig.hraPercentOfBasic) / 100);
  // Whatever is left, so the three earnings always sum to exactly the gross
  // that was entered. Never negative: at very low gross figures basic + HRA can
  // in principle exceed it.
  const special = Math.max(0, gross - basic - hra);

  const earnings: SalaryComponent[] = [
    {
      label: "Basic salary",
      amount: basic,
      basis: `${payrollConfig.basicPercentOfGross}% of gross`,
    },
    {
      label: "House rent allowance",
      amount: hra,
      basis: `${payrollConfig.hraPercentOfBasic}% of basic`,
    },
    { label: "Special allowance", amount: special, basis: "Balance of gross" },
  ];

  const pf = providentFundFor(basic);
  const professionalTax = professionalTaxFor(gross);

  const deductions: SalaryComponent[] = [];
  if (pf > 0) {
    deductions.push({
      label: "Provident fund (employee)",
      amount: pf,
      basis: `${payrollConfig.pfPercentOfBasic}% of basic`,
    });
  }
  if (professionalTax > 0) {
    deductions.push({
      label: "Professional tax",
      amount: professionalTax,
      basis: "Telangana",
    });
  }
  for (const extra of extraDeductions) {
    if (extra.amount > 0) deductions.push({ ...extra, amount: round(extra.amount) });
  }

  const totalEarnings = earnings.reduce((sum, row) => sum + row.amount, 0);
  const totalDeductions = deductions.reduce((sum, row) => sum + row.amount, 0);

  return {
    monthlyGross: gross,
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    // Clamped: deductions exceeding earnings would print a negative net pay,
    // which is never a real payslip.
    netPay: Math.max(0, totalEarnings - totalDeductions),
  };
}

// ---------------------------------------------------------------------------
// Annual CTC, for offer and increment letters
// ---------------------------------------------------------------------------

export type CtcBreakdown = {
  annualCtc: number;
  monthlyGross: number;
  components: SalaryComponent[];
  /** What actually reaches the bank each month. */
  monthlyNet: number;
};

/**
 * Derives an annual CTC breakdown from the offered figure.
 *
 * CTC includes employer-side costs the employee never sees in their account —
 * employer PF and gratuity — so monthly gross is the CTC minus those, divided
 * by twelve. Presenting it any other way is how offer letters end up promising
 * a take-home nobody receives.
 */
export function calculateCtc(annualCtc: number): CtcBreakdown {
  const ctc = Math.max(0, round(annualCtc));

  // Solve for the monthly gross whose employer-side additions bring the total
  // back to the CTC. Employer PF is a share of basic, and basic is a share of
  // gross, so both scale linearly with gross and the factor is a constant.
  const basicShare = payrollConfig.basicPercentOfGross / 100;
  const employerPfRate = (payrollConfig.pfPercentOfBasic / 100) * basicShare;
  const gratuityRate = (payrollConfig.gratuityPercentOfBasic / 100) * basicShare;
  const annualGross = ctc / (1 + employerPfRate + gratuityRate);

  const monthlyGross = round(annualGross / 12);
  const monthly = calculateSalary(monthlyGross);

  const annualBasic = round(monthlyGross * basicShare) * 12;
  const employerPf = providentFundFor(round(monthlyGross * basicShare)) * 12;
  const gratuity = round((annualBasic * payrollConfig.gratuityPercentOfBasic) / 100);

  const components: SalaryComponent[] = [
    ...monthly.earnings.map((row) => ({ ...row, amount: row.amount * 12 })),
    {
      label: "Provident fund (employer)",
      amount: employerPf,
      basis: `${payrollConfig.pfPercentOfBasic}% of basic`,
    },
    {
      label: "Gratuity",
      amount: gratuity,
      basis: `${payrollConfig.gratuityPercentOfBasic}% of basic`,
    },
  ];

  return {
    annualCtc: ctc,
    monthlyGross,
    components,
    monthlyNet: monthly.netPay,
  };
}

/** Percentage increase between two CTC figures, for increment letters. */
export function incrementPercent(previousCtc: number, revisedCtc: number): number {
  if (previousCtc <= 0) return 0;
  return Math.round(((revisedCtc - previousCtc) / previousCtc) * 1000) / 10;
}
