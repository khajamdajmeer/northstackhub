"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  distances,
  durations,
  easings,
  mediaQueries,
  scrollTrigger as scrollDefaults,
  stagger as staggerScale,
} from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Polymorphic tags are typed through this cast rather than `React.ElementType`:
 * @react-three/fiber augments `JSX.IntrinsicElements` project-wide, which
 * collapses the shared props of an intrinsic-element union to `never`.
 */
export type PolymorphicTag = React.FC<{
  ref: React.Ref<HTMLElement>;
  className?: string;
  children?: React.ReactNode;
}>;

export type RevealProps = {
  children: React.ReactNode;
  /** Element to render. Reveal is presentational — pick the tag the content needs. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Travel distance in px. Transform only. */
  y?: number;
  delay?: number;
  duration?: number;
  /**
   * When set, the element's *direct children* are revealed in sequence with this
   * many seconds between them. When omitted, the element itself is revealed.
   */
  stagger?: number;
  /** `false` re-plays the reveal each time the element re-enters the viewport. */
  once?: boolean;
  /** ScrollTrigger start string. */
  start?: string;
  className?: string;
};

/**
 * The site's default entrance. Server-renders its children as ordinary, visible
 * markup; GSAP only sets the hidden starting state once it has taken ownership
 * on the client, and only when motion is welcome. No JS, or reduced motion, and
 * the content simply sits there — which is the correct outcome, not a fallback.
 */
export function Reveal({
  children,
  as = "div",
  y = distances.base,
  delay = 0,
  duration = durations.base,
  stagger,
  once = true,
  start = scrollDefaults.start,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.motionOk, () => {
        // Staggered mode animates the element's own children so the wrapper can
        // stay a plain grid/flex container with no extra DOM per item.
        const targets: Element[] =
          stagger === undefined ? [el] : Array.from(el.children);
        if (targets.length === 0) return;

        gsap.set(targets, { opacity: 0, y, willChange: "transform, opacity" });

        const tween = gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: easings.out,
          stagger: stagger ?? 0,
          clearProps: "willChange",
          scrollTrigger: {
            trigger: el,
            start,
            once,
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });
    },
    {
      scope: ref,
      dependencies: [y, delay, duration, stagger, once, start],
      // Prop changes rebuild the tween; revert first so no ScrollTrigger is orphaned.
      revertOnUpdate: true,
    },
  );

  const Tag = as as unknown as PolymorphicTag;

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}

/** Convenience alias for the common "reveal a list of cards" case. */
export function RevealGroup({
  stagger = staggerScale.loose,
  ...props
}: RevealProps) {
  return <Reveal stagger={stagger} {...props} />;
}
