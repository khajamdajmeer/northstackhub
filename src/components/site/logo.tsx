import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * The NorthStackHub mark: a tile carrying a diamond "N" with circuit traces
 * radiating from it.
 *
 * Two supplied cuts, one per theme — `mark-light.svg` has an off-white tile and
 * darkened traces, `mark-dark.svg` a near-black tile with lighter ones. In each
 * case the tile matches the page it sits on, so the mark reads as artwork
 * rather than as a badge stuck on the background.
 *
 * Both are rendered and one is hidden by a `dark:` variant rather than picking
 * a src with `useTheme()`. JavaScript cannot know the theme until hydration, so
 * that approach paints the wrong mark first and flashes on every load; this way
 * the right one is in the first HTML the browser receives.
 */
export function LogoMark({ className }: { className?: string }) {
  // Plain <img> rather than next/image: these are SVGs served straight from
  // /public, so there is no raster to resize or reformat and the optimiser
  // would only add a hop.
  const shared = cn("size-8 shrink-0", className);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-light.svg" alt="" aria-hidden className={cn(shared, "dark:hidden")} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mark-dark.svg"
        alt=""
        aria-hidden
        className={cn(shared, "hidden dark:block")}
      />
    </>
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
