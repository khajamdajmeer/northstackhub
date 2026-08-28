/**
 * The motion system.
 *
 * Single source of truth for every animation on this site. Nothing in
 * src/components/motion invents its own timing — if a value is needed twice it
 * lives here, and if it lives here it is used everywhere. That is what makes a
 * page of independent components feel like one piece of software.
 *
 * The character we are after: precise and deliberate. Everything decelerates
 * into place (`out` easings), nothing overshoots, nothing bounces.
 */

/** Seconds. Anything longer than `slow` is a scrubbed scroll animation, not a tween. */
export const durations = {
  /** Cursor tracking, hover states — fast enough to feel attached to the input. */
  instant: 0.18,
  /** Small elements, buttons, badges, single lines. */
  fast: 0.4,
  /** The default. Section reveals, cards, most of the site. */
  base: 0.7,
  /** Headlines and hero type, where the extra weight reads as confidence. */
  slow: 1.1,
  /** Route changes. Long enough to register, short enough to never be in the way. */
  page: 0.4,
  /** Counters run longer than a reveal so the digits are legible while moving. */
  count: 1.6,
} as const;

/**
 * Easing curves. `out` is the house curve — a fast start that settles.
 * `expo` is reserved for type entering from behind a mask, where the long tail
 * is what makes the movement read as intentional rather than mechanical.
 * `inOut` is only for scrubbed, two-sided transitions.
 */
export const easings = {
  out: "power3.out",
  expo: "expo.out",
  inOut: "power2.inOut",
  in: "power2.in",
  /** Scrubbed timelines are driven by the scrollbar; the user supplies the easing. */
  none: "none",
} as const;

/** Seconds between siblings in a sequence. */
export const stagger = {
  /** Characters and other dense sets. */
  tight: 0.02,
  /** Words, list items, ticks. */
  base: 0.06,
  /** Cards and full rows, where each item deserves its own beat. */
  loose: 0.09,
} as const;

/** Travel distances in px. Transform only — never top/left/margin. */
export const distances = {
  sm: 12,
  base: 24,
  lg: 48,
} as const;

/** ScrollTrigger defaults, so reveals across the site fire on the same line. */
export const scrollTrigger = {
  /** Element top at 85% of the viewport: visible, but before it is fully read. */
  start: "top 85%",
  /** Scrub smoothing, in seconds of catch-up. Enough to feel weighted, not laggy. */
  scrub: 0.6,
} as const;

/** Magnetic pointer field: px of pull radius beyond the element's own bounds. */
export const magnetism = {
  radius: 90,
  strength: 0.35,
} as const;

/** Media queries used by `gsap.matchMedia()`. Kept together so they stay consistent. */
export const mediaQueries = {
  /** Motion is opt-in: we animate only when the user has expressed no objection. */
  motionOk: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** Pointer-driven effects require a real pointer — never touch, never stylus. */
  finePointer: "(pointer: fine)",
  /** The common case for cursor and magnetic effects. */
  pointerMotionOk: "(pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

/**
 * True when motion should be suppressed. Server-side and pre-hydration this
 * returns `true` on purpose: if we cannot ask the user, we do not animate.
 * Component code should prefer `gsap.matchMedia()` (it re-evaluates when the
 * preference changes); this helper is for the non-GSAP cases.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia(mediaQueries.reduce).matches;
}
