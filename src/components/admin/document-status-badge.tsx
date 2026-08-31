import { cn } from "@/lib/utils";
import type { HrDocumentStatus } from "@/lib/admin/hr/schemas";

const meta: Record<HrDocumentStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-foreground/5 text-muted ring-1 ring-inset ring-border",
  },
  issued: {
    label: "Issued",
    className: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
  },
  revoked: {
    label: "Revoked",
    className: "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/25",
  },
};

export function DocumentStatusBadge({
  status,
  className,
}: {
  status: HrDocumentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        meta[status].className,
        className,
      )}
    >
      {meta[status].label}
    </span>
  );
}
