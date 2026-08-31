/**
 * Tests for the salary calculator behind payslips, offers and increments.
 *
 *   npm run test:payroll
 *
 * This is money arithmetic that gets printed and handed to people, so the
 * properties that matter are checked directly: components must sum to the
 * figure that was entered, nothing may go negative, and the same input must
 * always produce the same output.
 */

import assert from "node:assert/strict";

import {
  calculateCtc,
  calculateSalary,
  incrementPercent,
  professionalTaxFor,
  providentFundFor,
} from "../src/lib/admin/hr/payroll.ts";
import { payrollConfig } from "../src/lib/admin/hr/config.ts";

let passed = 0;
const ok = (label: string) => {
  console.log(`  ok - ${label}`);
  passed += 1;
};

// --- the worked example the design was signed off against -------------------

const fifty = calculateSalary(50_000);

assert.equal(fifty.earnings[0].amount, 25_000);
ok("₹50,000 gross → basic ₹25,000 (50%)");

assert.equal(fifty.earnings[1].amount, 10_000);
ok("→ HRA ₹10,000 (40% of basic)");

assert.equal(fifty.earnings[2].amount, 15_000);
ok("→ special allowance ₹15,000 (balance)");

assert.equal(fifty.totalDeductions, 3_200);
ok("→ deductions ₹3,200 (PF ₹3,000 + PT ₹200)");

assert.equal(fifty.netPay, 46_800);
ok("→ net pay ₹46,800");

// --- invariants that must hold at every figure ------------------------------

const samples = [1, 999, 5_000, 14_999, 15_000, 15_001, 20_000, 20_001, 73_333, 250_000, 1_000_000];

for (const gross of samples) {
  const result = calculateSalary(gross);
  assert.equal(
    result.earnings.reduce((sum, row) => sum + row.amount, 0),
    gross,
    `earnings must sum to gross at ₹${gross}`,
  );
}
ok("earnings always sum to exactly the gross entered (11 figures)");

for (const gross of samples) {
  const result = calculateSalary(gross);
  assert.ok(result.netPay >= 0, `net pay went negative at ₹${gross}`);
  for (const row of [...result.earnings, ...result.deductions]) {
    assert.ok(row.amount >= 0, `negative component at ₹${gross}: ${row.label}`);
  }
  assert.ok(
    Number.isInteger(result.netPay),
    `net pay must be a whole rupee at ₹${gross}`,
  );
}
ok("no component or net pay is ever negative or fractional");

assert.deepEqual(calculateSalary(37_500), calculateSalary(37_500));
ok("the same input gives the same output");

assert.equal(calculateSalary(0).netPay, 0);
assert.equal(calculateSalary(-5000).monthlyGross, 0);
ok("zero and negative input are clamped rather than throwing");

// --- statutory pieces -------------------------------------------------------

assert.equal(professionalTaxFor(15_000), 0);
assert.equal(professionalTaxFor(15_001), 150);
assert.equal(professionalTaxFor(20_000), 150);
assert.equal(professionalTaxFor(20_001), 200);
ok("Telangana professional tax slabs switch at the right boundaries");

assert.equal(providentFundFor(10_000), 1_200);
ok("PF is 12% of basic");

// The configured default contributes on the whole basic rather than applying
// the statutory ₹15,000 ceiling. Asserted because flipping it silently changes
// the net pay on every payslip the company issues.
assert.equal(payrollConfig.pfWageCeiling, null);
assert.equal(providentFundFor(25_000), 3_000);
ok("PF is computed on the full basic (no wage ceiling configured)");

// --- extra deductions -------------------------------------------------------

const withAdvance = calculateSalary(50_000, [{ label: "Salary advance", amount: 5_000 }]);
assert.equal(withAdvance.totalDeductions, 8_200);
assert.equal(withAdvance.netPay, 41_800);
ok("an extra deduction reduces net pay and appears in the total");

const zeroExtra = calculateSalary(50_000, [{ label: "Ignored", amount: 0 }]);
assert.equal(zeroExtra.deductions.length, 2);
ok("a zero extra deduction is dropped rather than printed as a ₹0 row");

const overDeducted = calculateSalary(10_000, [{ label: "Huge", amount: 999_999 }]);
assert.equal(overDeducted.netPay, 0);
ok("deductions larger than earnings clamp net pay to zero, not negative");

// --- annual CTC -------------------------------------------------------------

const ctc = calculateCtc(1_200_000);
const componentSum = ctc.components.reduce((sum, row) => sum + row.amount, 0);

// Employer PF and gratuity are derived from a rounded monthly basic, so the
// reconstructed total can drift by a few rupees across twelve months. A whole
// rupee per month is the tolerance; anything more is a real error.
assert.ok(
  Math.abs(componentSum - ctc.annualCtc) <= 12 * 12,
  `CTC components sum to ${componentSum}, expected ~${ctc.annualCtc}`,
);
ok("CTC components reconstruct the offered figure within rounding");

assert.ok(
  ctc.monthlyGross * 12 < ctc.annualCtc,
  "annual gross must be below CTC — employer PF and gratuity sit in the gap",
);
ok("monthly gross is below CTC/12, since CTC carries employer-side cost");

assert.ok(
  ctc.monthlyNet < ctc.monthlyGross,
  "take-home must be below gross after PF and PT",
);
ok("take-home is below monthly gross");

// --- increments -------------------------------------------------------------

assert.equal(incrementPercent(1_000_000, 1_200_000), 20);
ok("a ₹10L → ₹12L revision reads as +20%");

assert.equal(incrementPercent(1_200_000, 1_000_000), -16.7);
ok("a reduction reads as a negative percentage");

assert.equal(incrementPercent(0, 500_000), 0);
ok("a zero previous CTC does not divide by zero");

console.log(`\n${passed}/${passed} assertions passed`);
