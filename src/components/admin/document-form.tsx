"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateDocument } from "@/app/aka/documents/actions";
import { emptyDocumentFormState } from "@/lib/admin/hr/form-state";
import { DOCUMENT_META, type HrDocumentType } from "@/lib/admin/hr/schemas";
import { formatAmount } from "@/lib/admin/hr/config";
import {
  calculateCtc,
  calculateSalary,
  incrementPercent,
} from "@/lib/admin/hr/payroll";

/**
 * The one form behind all four document types.
 *
 * The salary preview calls the same `calculateSalary` / `calculateCtc` the PDF
 * templates call — pure functions with no server dependency — so what is shown
 * while typing is exactly what gets printed. Recomputing it a second way in the
 * UI is how a preview drifts from the document.
 */

const field =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand/60 focus:ring-2 focus:ring-brand/20";
const area =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

function Field({
  label,
  name,
  errors,
  hint,
  children,
}: {
  label: string;
  name: string;
  errors: Record<string, string[] | undefined>;
  hint?: string;
  children: React.ReactNode;
}) {
  const error = errors[name]?.[0];
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Submit({ type }: { type: HrDocumentType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Generating…" : `Generate ${DOCUMENT_META[type].short.toLowerCase()}`}
      {!pending && <FileText className="size-4" aria-hidden />}
    </Button>
  );
}

/** Shared earnings/deductions preview table. */
function BreakdownTable({
  rows,
  total,
  totalLabel,
}: {
  rows: { label: string; amount: number; basis?: string }[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between border-b border-border py-2 text-sm"
        >
          <span>
            {row.label}
            {row.basis ? (
              <span className="block text-xs text-muted">{row.basis}</span>
            ) : null}
          </span>
          <span className="tabular-nums">{formatAmount(row.amount)}</span>
        </div>
      ))}
      <div className="flex justify-between pt-2.5 text-sm font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatAmount(total)}</span>
      </div>
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export function DocumentForm({ type }: { type: HrDocumentType }) {
  const [state, formAction] = useActionState(generateDocument, emptyDocumentFormState);
  const errors = state.fieldErrors;

  // Live preview inputs. Kept as strings so a half-typed number does not snap
  // back to 0 under the cursor.
  const [gross, setGross] = useState("");
  const [otherDeduction, setOtherDeduction] = useState("");
  const [ctc, setCtc] = useState("");
  const [previousCtc, setPreviousCtc] = useState("");
  const [revisedCtc, setRevisedCtc] = useState("");

  const grossValue = Number(gross) || 0;
  const salary = calculateSalary(
    grossValue,
    Number(otherDeduction) > 0
      ? [{ label: "Other deduction", amount: Number(otherDeduction) }]
      : [],
  );
  const ctcValue = Number(ctc) || 0;
  const ctcBreakdown = calculateCtc(ctcValue);
  const revisedValue = Number(revisedCtc) || 0;
  const revisedBreakdown = calculateCtc(revisedValue);
  const rise = incrementPercent(Number(previousCtc) || 0, revisedValue);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="type" value={type} />

      <Section title="Who it is for">
        <Field label="Full name *" name="fullName" errors={errors}>
          <input id="fullName" name="fullName" className={field} required />
        </Field>
        <Field
          label="Email *"
          name="email"
          errors={errors}
          hint="Used to match this person to their existing records."
        >
          <input id="email" name="email" type="email" className={field} required />
        </Field>
        <Field label="Designation" name="designation" errors={errors}>
          <input id="designation" name="designation" className={field} />
        </Field>
        <Field label="Department" name="department" errors={errors}>
          <input id="department" name="department" className={field} />
        </Field>
        <Field label="Phone" name="phone" errors={errors}>
          <input id="phone" name="phone" className={field} />
        </Field>
        <Field label="Employee code" name="employeeCode" errors={errors}>
          <input id="employeeCode" name="employeeCode" className={field} />
        </Field>
        {(type === "offer_letter" || type === "internship_certificate") && (
          <div className="sm:col-span-2">
            <Field label="Address" name="address" errors={errors}>
              <textarea id="address" name="address" rows={2} className={area} />
            </Field>
          </div>
        )}
      </Section>

      {type === "internship_certificate" && (
        <Section title="Internship">
          <Field label="Role *" name="role" errors={errors}>
            <input
              id="role"
              name="role"
              className={field}
              placeholder="Full Stack Developer Intern"
              required
            />
          </Field>
          <Field label="Issue date *" name="issuedOn" errors={errors}>
            <input
              id="issuedOn"
              name="issuedOn"
              type="date"
              defaultValue={today()}
              className={field}
              required
            />
          </Field>
          <Field label="Start date *" name="startDate" errors={errors}>
            <input id="startDate" name="startDate" type="date" className={field} required />
          </Field>
          <Field label="End date *" name="endDate" errors={errors}>
            <input id="endDate" name="endDate" type="date" className={field} required />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="What they worked on"
              name="focusArea"
              errors={errors}
              hint="One or two sentences. Appears in the citation on the certificate."
            >
              <textarea
                id="focusArea"
                name="focusArea"
                rows={3}
                className={area}
                placeholder="During the internship they contributed to the company's Next.js platform, building the booking flow and its API endpoints."
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Closing remark" name="performanceNote" errors={errors}>
              <textarea
                id="performanceNote"
                name="performanceNote"
                rows={2}
                className={area}
                placeholder="We found them diligent, quick to learn and a pleasure to work with."
              />
            </Field>
          </div>
        </Section>
      )}

      {type === "payslip" && (
        <>
          <Section title="Pay period">
            <Field label="Month *" name="payPeriod" errors={errors}>
              <input
                id="payPeriod"
                name="payPeriod"
                type="month"
                defaultValue={thisMonth()}
                className={field}
                required
              />
            </Field>
            <Field label="Issue date *" name="issuedOn" errors={errors}>
              <input
                id="issuedOn"
                name="issuedOn"
                type="date"
                defaultValue={today()}
                className={field}
                required
              />
            </Field>
            <Field
              label="Monthly gross (₹) *"
              name="monthlyGross"
              errors={errors}
              hint="Everything below is derived from this figure."
            >
              <input
                id="monthlyGross"
                name="monthlyGross"
                type="number"
                min={1}
                step={1}
                value={gross}
                onChange={(event) => setGross(event.target.value)}
                className={field}
                required
              />
            </Field>
            <Field label="Paid days *" name="paidDays" errors={errors}>
              <input
                id="paidDays"
                name="paidDays"
                type="number"
                min={0}
                max={31}
                defaultValue={30}
                className={field}
                required
              />
            </Field>
            <Field label="Loss of pay days" name="lopDays" errors={errors}>
              <input
                id="lopDays"
                name="lopDays"
                type="number"
                min={0}
                max={31}
                defaultValue={0}
                className={field}
              />
            </Field>
            <Field label="Bank account" name="bankAccount" errors={errors}>
              <input id="bankAccount" name="bankAccount" className={field} />
            </Field>
            <Field label="PAN" name="pan" errors={errors}>
              <input id="pan" name="pan" className={field} />
            </Field>
            <Field label="Other deduction label" name="otherDeductionLabel" errors={errors}>
              <input
                id="otherDeductionLabel"
                name="otherDeductionLabel"
                className={field}
                placeholder="Salary advance"
              />
            </Field>
            <Field label="Other deduction (₹)" name="otherDeductionAmount" errors={errors}>
              <input
                id="otherDeductionAmount"
                name="otherDeductionAmount"
                type="number"
                min={0}
                step={1}
                value={otherDeduction}
                onChange={(event) => setOtherDeduction(event.target.value)}
                className={field}
              />
            </Field>
          </Section>

          {grossValue > 0 && (
            <section className="rounded-card border border-brand/30 bg-brand-soft p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-brand-strong">
                Calculated breakdown
              </h2>
              <div className="mt-5 grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Earnings
                  </p>
                  <BreakdownTable
                    rows={salary.earnings}
                    total={salary.totalEarnings}
                    totalLabel="Gross earnings"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Deductions
                  </p>
                  <BreakdownTable
                    rows={salary.deductions}
                    total={salary.totalDeductions}
                    totalLabel="Total deductions"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-brand/30 pt-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-brand-strong">
                  Net pay
                </span>
                <span className="text-2xl font-semibold tabular-nums">
                  {formatAmount(salary.netPay)}
                </span>
              </div>
            </section>
          )}
        </>
      )}

      {type === "offer_letter" && (
        <>
          <Section title="The offer">
            <Field label="Role *" name="role" errors={errors}>
              <input id="role" name="role" className={field} required />
            </Field>
            <Field label="Annual CTC (₹) *" name="annualCtc" errors={errors}>
              <input
                id="annualCtc"
                name="annualCtc"
                type="number"
                min={1}
                step={1}
                value={ctc}
                onChange={(event) => setCtc(event.target.value)}
                className={field}
                required
              />
            </Field>
            <Field label="Joining date *" name="joiningDate" errors={errors}>
              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                className={field}
                required
              />
            </Field>
            <Field label="Work location *" name="location" errors={errors}>
              <input
                id="location"
                name="location"
                defaultValue="Hyderabad, India (remote)"
                className={field}
                required
              />
            </Field>
            <Field label="Reporting to" name="reportingTo" errors={errors}>
              <input id="reportingTo" name="reportingTo" className={field} />
            </Field>
            <Field label="Probation (months) *" name="probationMonths" errors={errors}>
              <input
                id="probationMonths"
                name="probationMonths"
                type="number"
                min={0}
                max={24}
                defaultValue={3}
                className={field}
                required
              />
            </Field>
            <Field label="Notice period (days) *" name="noticePeriodDays" errors={errors}>
              <input
                id="noticePeriodDays"
                name="noticePeriodDays"
                type="number"
                min={0}
                max={180}
                defaultValue={30}
                className={field}
                required
              />
            </Field>
            <Field label="Offer valid until *" name="offerValidUntil" errors={errors}>
              <input
                id="offerValidUntil"
                name="offerValidUntil"
                type="date"
                className={field}
                required
              />
            </Field>
            <Field label="Issue date *" name="issuedOn" errors={errors}>
              <input
                id="issuedOn"
                name="issuedOn"
                type="date"
                defaultValue={today()}
                className={field}
                required
              />
            </Field>
          </Section>

          {ctcValue > 0 && (
            <section className="rounded-card border border-brand/30 bg-brand-soft p-6">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-brand-strong">
                CTC breakdown (annual)
              </h2>
              <div className="mt-5">
                <BreakdownTable
                  rows={ctcBreakdown.components}
                  total={ctcBreakdown.annualCtc}
                  totalLabel="Total cost to company"
                />
              </div>
              <p className="mt-4 text-sm text-muted">
                Monthly gross{" "}
                <span className="font-medium text-foreground">
                  {formatAmount(ctcBreakdown.monthlyGross)}
                </span>{" "}
                · approximate take-home{" "}
                <span className="font-medium text-foreground">
                  {formatAmount(ctcBreakdown.monthlyNet)}
                </span>
              </p>
            </section>
          )}
        </>
      )}

      {type === "increment_letter" && (
        <>
          <Section title="The revision">
            <Field label="Role *" name="role" errors={errors}>
              <input id="role" name="role" className={field} required />
            </Field>
            <Field label="Effective from *" name="effectiveFrom" errors={errors}>
              <input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                className={field}
                required
              />
            </Field>
            <Field label="Previous CTC (₹) *" name="previousCtc" errors={errors}>
              <input
                id="previousCtc"
                name="previousCtc"
                type="number"
                min={1}
                step={1}
                value={previousCtc}
                onChange={(event) => setPreviousCtc(event.target.value)}
                className={field}
                required
              />
            </Field>
            <Field label="Revised CTC (₹) *" name="revisedCtc" errors={errors}>
              <input
                id="revisedCtc"
                name="revisedCtc"
                type="number"
                min={1}
                step={1}
                value={revisedCtc}
                onChange={(event) => setRevisedCtc(event.target.value)}
                className={field}
                required
              />
            </Field>
            <Field label="Issue date *" name="issuedOn" errors={errors}>
              <input
                id="issuedOn"
                name="issuedOn"
                type="date"
                defaultValue={today()}
                className={field}
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reason" name="reason" errors={errors}>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  className={area}
                  placeholder="This reflects your work on the payments platform and the responsibility you have taken on since."
                />
              </Field>
            </div>
          </Section>

          {revisedValue > 0 && (
            <section className="rounded-card border border-brand/30 bg-brand-soft p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-brand-strong">
                  Revised breakdown (annual)
                </h2>
                {Number(previousCtc) > 0 && (
                  <span className="text-sm">
                    <span className="text-2xl font-semibold tabular-nums">
                      {rise > 0 ? "+" : ""}
                      {rise}%
                    </span>{" "}
                    <span className="text-muted">
                      ({formatAmount(revisedValue - Number(previousCtc))} per annum)
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-5">
                <BreakdownTable
                  rows={revisedBreakdown.components}
                  total={revisedBreakdown.annualCtc}
                  totalLabel="Total cost to company"
                />
              </div>
            </section>
          )}
        </>
      )}

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div>
        <Submit type={type} />
      </div>
    </form>
  );
}
