"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";
import type { PolymorphicTag } from "./reveal";
import {
  durations,
  easings,
  mediaQueries,
  scrollTrigger as scrollDefaults,
  stagger as staggerScale,
} from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, GSAPSplitText);

type SplitType = "lines" | "words" | "chars";

export type SplitTextProps = {
  /** Plain text only — it is rendered as-is on the server before any splitting. */
  children: string;
  /**
   * `span` is available for splitting a fragment inside a larger headline; it is
   * rendered `inline-block` so the line masks still have a box to clip against.
   */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  type?: SplitType;
  className?: string;
  delay?: number;
};

/** Denser sets need to move faster or the sentence takes too long to assemble. */
const staggerFor: Record<SplitType, number> = {
  lines: staggerScale.loose,
  words: staggerScale.base,
  chars: staggerScale.tight,
};

/**
 * Headline type rising out of a clipped mask.
 *
 * Server output is a single text node inside the requested tag — crawlers and
 * JS-disabled visitors get the sentence, full stop. On the client the plugin
 * splits it, wraps each piece in an `overflow: hidden` mask (`mask` option,
 * SplitText 3.13+) and lifts the pieces into view. `autoSplit` re-splits on
 * font load and on resize, where line boxes change; the split is reverted on
 * unmount so the original text node — and its accessibility — is restored.
 */
export function SplitText({
  children,
  as: Tag = "h2",
  type = "lines",
  className,
  delay = 0,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.motionOk, () => {
        const split = GSAPSplitText.create(el, {
          type,
          mask: type,
          autoSplit: true,
          // Keeps the original sentence exposed to assistive tech while the
          // visual pieces are marked presentational.
          aria: "auto",
          onSplit: (self) =>
            gsap.from(self[type], {
              yPercent: 110,
              opacity: 0,
              duration: durations.slow,
              ease: easings.expo,
              stagger: staggerFor[type],
              delay,
              scrollTrigger: {
                trigger: el,
                start: scrollDefaults.start,
                once: true,
              },
            }),
        });

        return () => split.revert();
      });
    },
    { scope: ref, dependencies: [children, type, delay], revertOnUpdate: true },
  );

  const Component = Tag as unknown as PolymorphicTag;

  return (
    <Component ref={ref} className={cn(Tag === "span" && "inline-block", className)}>
      {children}
    </Component>
  );
}
