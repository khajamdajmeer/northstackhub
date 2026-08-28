/**
 * The enquiry pipeline. Mirrors the `submission_status` enum in
 * `supabase/schema.sql` — changing one without the other will fail on write.
 *
 * No `server-only` here: the status labels and colours are rendered by client
 * components in the console too.
 */

export const SUBMISSION_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
  "archived",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

type StatusMeta = {
  label: string;
  /** What this status means, shown as help text on the status control. */
  hint: string;
  /** Tailwind classes for the badge. Amber is reserved for what needs action. */
  className: string;
};

export const STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  new: {
    label: "New",
    hint: "Not yet replied to.",
    className: "bg-brand/15 text-brand ring-1 ring-inset ring-brand/30",
  },
  contacted: {
    label: "Contacted",
    hint: "We have replied and are waiting on them.",
    className: "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/25",
  },
  qualified: {
    label: "Qualified",
    hint: "Real budget and a real project. Worth a proposal.",
    className: "bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/25",
  },
  proposal_sent: {
    label: "Proposal sent",
    hint: "Scope and price are with them.",
    className: "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/25",
  },
  won: {
    label: "Won",
    hint: "Signed.",
    className: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
  },
  lost: {
    label: "Lost",
    hint: "Went elsewhere, or went quiet for good.",
    className: "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/25",
  },
  archived: {
    label: "Archived",
    hint: "Spam, or not a real enquiry.",
    className: "bg-foreground/5 text-muted ring-1 ring-inset ring-border",
  },
};

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return (
    typeof value === "string" &&
    (SUBMISSION_STATUSES as readonly string[]).includes(value)
  );
}

/** Statuses that still need something from us — drives the dashboard counter. */
export const OPEN_STATUSES: SubmissionStatus[] = ["new", "contacted", "qualified"];
