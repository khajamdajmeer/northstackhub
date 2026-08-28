import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/**
 * Brand marks are hand-rolled: lucide-react removed its brand icon set in v1,
 * and pulling a second icon package in for three glyphs is not worth the bytes.
 */

export function GithubIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.06A4.17 4.17 0 0 1 17.6 8.7c4 0 4.74 2.5 4.74 5.75V21h-4v-5.72c0-1.36-.03-3.12-1.94-3.12-1.94 0-2.24 1.49-2.24 3.02V21h-3.96V9Z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden
      focusable="false"
    >
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.98l-4.7-6.14L5.7 21H2.68l7.06-8.07L2.25 3h6.13l4.25 5.62L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.81L16.47 19.2Z" />
    </svg>
  );
}
