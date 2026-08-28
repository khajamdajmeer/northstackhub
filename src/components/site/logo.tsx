import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="url(#nsh-gradient)" />
      <path
        d="M16 6.5l2.4 5.4 5.6 1-4 4.1.9 5.9-4.9-2.8-4.9 2.8.9-5.9-4-4.1 5.6-1L16 6.5z"
        fill="#08090b"
        fillOpacity="0.92"
      />
      <defs>
        <linearGradient id="nsh-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#f5a524" />
          <stop offset="1" stopColor="#c77b12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}
    >
      <LogoMark />
      <span className="text-lg">
        North<span className="text-brand">Stack</span>Hub
      </span>
      <span className="sr-only">{siteConfig.name} home</span>
    </Link>
  );
}
