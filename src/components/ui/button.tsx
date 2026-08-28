import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  // text-on-brand flips with the theme: near-black on amber in dark, white on
  // deep amber in light. Hardcoding white would fail contrast on the dark theme.
  primary:
    "bg-brand text-on-brand shadow-lg shadow-brand/20 hover:bg-brand-strong hover:shadow-brand/30 hover:-translate-y-0.5",
  secondary:
    "bg-surface-2 text-foreground border border-border hover:border-brand/50 hover:-translate-y-0.5",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface hover:border-brand/50",
  ghost: "text-muted hover:text-foreground hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  external,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant, size, className })}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
