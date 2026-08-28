import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "brand",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "brand" | "neutral" | "accent";
}) {
  const tones = {
    brand: "border-brand/30 bg-brand-soft text-brand-strong",
    accent: "border-accent/30 bg-accent-soft text-accent",
    neutral: "border-border bg-surface text-muted",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
