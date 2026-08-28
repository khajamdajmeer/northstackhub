"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { changeStatus, saveNotes } from "@/app/aka/actions";
import { emptyActionState } from "@/lib/admin/action-state";
import { STATUS_META, SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/admin/status";

const fieldClasses =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function Feedback({ error, ok, okLabel }: { error: string | null; ok: boolean; okLabel: string }) {
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-xs text-rose-400">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="flex items-center gap-2 text-xs text-emerald-400">
        <Check className="size-3.5 shrink-0" aria-hidden />
        {okLabel}
      </p>
    );
  }
  return null;
}

export function StatusControl({
  id,
  status,
}: {
  id: string;
  status: SubmissionStatus;
}) {
  const [state, formAction] = useActionState(changeStatus, emptyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-xs font-medium uppercase tracking-wide text-muted">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className={fieldClasses}
        >
          {SUBMISSION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_META[value].label} — {STATUS_META[value].hint}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-xs font-medium uppercase tracking-wide text-muted">
          Note <span className="normal-case text-muted">(optional, added to the trail)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="Called, quoted 3 weeks"
          className={fieldClasses}
        />
      </div>

      <div className="flex items-center gap-3">
        <Submit label="Update status" pendingLabel="Saving…" />
        <Feedback error={state.error} ok={state.ok} okLabel="Status updated" />
      </div>
    </form>
  );
}

export function NotesControl({ id, notes }: { id: string; notes: string | null }) {
  const [state, formAction] = useActionState(saveNotes, emptyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-muted">
        Internal notes
      </label>
      <textarea
        id="notes"
        name="notes"
        rows={5}
        defaultValue={notes ?? ""}
        placeholder="What was quoted, what they pushed back on, what to chase next."
        className={fieldClasses}
      />
      <div className="flex items-center gap-3">
        <Submit label="Save notes" pendingLabel="Saving…" />
        <Feedback error={state.error} ok={state.ok} okLabel="Notes saved" />
      </div>
    </form>
  );
}
