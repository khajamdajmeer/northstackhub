import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * The NorthStackHub mark: a dark tile carrying a diamond "N" with circuit
 * traces radiating from it.
 *
 * Inlined as SVG rather than loaded from `/public/brand/mark.svg` so it paints
 * with the first byte of HTML — the header logo is above the fold on every
 * page, and a separate request for it shows as a flash of empty space.
 *
 * This is the simplified cut of the mark (four trace nodes rather than forty).
 * The full drawing exists at `/public/brand/mark.svg` and is used where it is
 * rendered large — the OG image and the PDF documents. At the 28px the header
 * uses, the full version's traces collapse into noise.
 *
 * Light and dark are the two supplied cuts of the artwork:
 *  - light: the tiled mark, whose dark tile gives the off-white "N" something
 *    to sit on
 *  - dark: the untiled ("plain") mark, sitting straight on the page
 *
 * Switched with a CSS variant rather than `useTheme()`, so the correct mark is
 * in the first HTML the browser receives — reading the theme in JavaScript
 * means rendering the wrong one until hydration and flashing on every load.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8", className)}
      role="img"
      aria-hidden
      focusable="false"
    >
      {/* The tile is what makes the mark legible on a light page. On a dark
          one it would be a black square on a near-black ground, so it is
          dropped and the drawing sits directly on the background — which is
          exactly the supplied "plain" variant. */}
      <rect width="64" height="64" rx="16" fill="#0C0D0E" className="dark:hidden" />
      <path
        d="M32 11 L53 32 L32 53 L11 32 Z"
        fill="none"
        stroke="#EA9E22"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="5.5" r="3.2" fill="#F5B44A" />
      <circle cx="58.5" cy="32" r="3.2" fill="#EA9E22" />
      <circle cx="32" cy="58.5" r="3.2" fill="#F5B44A" />
      <circle cx="5.5" cy="32" r="3.2" fill="#EA9E22" />
      <g fill="#F0F1F3">
        <path
          d="M995 0 381 1085Q399 927 399 831V0H137V1409H474L1097 315Q1079 466 1079 590V1409H1341V0Z"
          transform="translate(21.17 43.32) scale(0.01465 -0.01465)"
        />
      </g>
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
      {/* Matches the wordmark in the supplied lockups: Stack in amber, the
          rest in the foreground colour. */}
      <span className="text-lg">
        North<span className="text-brand">Stack</span>Hub
      </span>
      <span className="sr-only">{siteConfig.name} home</span>
    </Link>
  );
}
