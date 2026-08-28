"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { distances, durations, easings, mediaQueries } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

export type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Route change: an amber hairline sweeps the top of the viewport while the new
 * page lifts into place. Roughly 0.4s — enough to acknowledge the navigation,
 * short enough that it never stands between the reader and the content.
 *
 * Two deliberate guarantees:
 * 1. The first paint is never animated. There is no entrance delay on load, so
 *    the initial render (and any crawler) sees finished content immediately.
 * 2. Content cannot get stuck invisible. The tween clears its own props on
 *    completion and the cleanup forces the element back to full opacity, so an
 *    interrupted transition — a second navigation mid-flight, an unmount — can
 *    never leave `opacity: 0` behind.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  /** Last route we animated into. Also makes a StrictMode remount a no-op. */
  const animatedPath = useRef<string | null>(null);

  useGSAP(
    () => {
      const content = contentRef.current;
      const sweep = sweepRef.current;
      if (!content || !sweep) return;

      // The first route we ever see is the one the server already rendered.
      if (animatedPath.current === null || animatedPath.current === pathname) {
        animatedPath.current = pathname;
        return;
      }
      animatedPath.current = pathname;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.motionOk, () => {
        const tl = gsap.timeline();

        tl.fromTo(
          content,
          { opacity: 0, y: distances.sm },
          {
            opacity: 1,
            y: 0,
            duration: durations.page,
            ease: easings.out,
            clearProps: "opacity,transform",
          },
          0,
        )
          .fromTo(
            sweep,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: durations.page * 0.6, ease: easings.out },
            0,
          )
          .to(
            sweep,
            {
              scaleX: 0,
              transformOrigin: "right center",
              duration: durations.page * 0.6,
              ease: easings.in,
            },
            durations.page * 0.6,
          );

        return () => {
          tl.kill();
          gsap.set(content, { opacity: 1, y: 0, clearProps: "opacity,transform" });
          gsap.set(sweep, { scaleX: 0 });
        };
      });
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <>
      <div
        ref={sweepRef}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-brand"
      />
      <div ref={contentRef} className={cn(className)}>
        {children}
      </div>
    </>
  );
}
