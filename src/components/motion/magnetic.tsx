"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { durations, easings, magnetism, mediaQueries } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

export type MagneticProps = {
  children: React.ReactNode;
  /** Fraction of the cursor's offset the element travels. Above ~0.5 it reads as a toy. */
  strength?: number;
  className?: string;
};

/**
 * Pulls its child toward the pointer once the pointer is inside the element's
 * bounds plus a radius, and releases it on the way out. Fine pointers only —
 * on touch there is no hover state to respond to, and under reduced motion the
 * element never moves at all.
 */
export function Magnetic({
  children,
  strength = magnetism.strength,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.pointerMotionOk, () => {
        const xTo = gsap.quickTo(el, "x", {
          duration: durations.fast,
          ease: easings.out,
        });
        const yTo = gsap.quickTo(el, "y", {
          duration: durations.fast,
          ease: easings.out,
        });

        // Cached so the pointer handler never forces a layout read per frame.
        let bounds = el.getBoundingClientRect();
        const measure = () => {
          bounds = el.getBoundingClientRect();
        };

        let engaged = false;

        const onMove = (event: PointerEvent) => {
          const cx = bounds.left + bounds.width / 2;
          const cy = bounds.top + bounds.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;

          const withinX = Math.abs(dx) < bounds.width / 2 + magnetism.radius;
          const withinY = Math.abs(dy) < bounds.height / 2 + magnetism.radius;

          if (withinX && withinY) {
            engaged = true;
            xTo(dx * strength);
            yTo(dy * strength);
          } else if (engaged) {
            engaged = false;
            xTo(0);
            yTo(0);
          }
        };

        const release = () => {
          engaged = false;
          xTo(0);
          yTo(0);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        window.addEventListener("blur", release);

        return () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("scroll", measure);
          window.removeEventListener("resize", measure);
          window.removeEventListener("blur", release);
          gsap.set(el, { x: 0, y: 0 });
        };
      });
    },
    { scope: ref, dependencies: [strength], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
