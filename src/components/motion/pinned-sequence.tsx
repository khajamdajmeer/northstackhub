"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { principles } from "@/config/site";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import {
  durations,
  easings,
  mediaQueries,
  scrollTrigger as scrollDefaults,
} from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Timeline units, not seconds — the whole timeline is scrubbed, so only the
 * ratios matter. A long hold and a short swap is what keeps the section feeling
 * like three statements rather than a slideshow.
 */
const STEP_HOLD = 0.9;
const STEP_SWAP = 0.45;
/** How much of the swap the outgoing and incoming steps share. */
const SWAP_OVERLAP = 0.12;
/** Vertical travel of a step, as a percentage of its own height. */
const STEP_SHIFT = 6;

export type PinnedSequenceProps = {
  className?: string;
  id?: string;
};

/**
 * The three principles, one at a time.
 *
 * Enhanced: the section pins and the steps cross-dissolve as you scroll — a
 * plain scrubbed ScrollTrigger, so scrolling still does exactly what the user
 * asked it to and they can always leave.
 *
 * Static (no JS, or reduced motion): the same three principles stacked as an
 * editorial list. Nothing is hidden in CSS and nothing depends on a script —
 * the overlay is applied by GSAP only after it owns the elements.
 */
export function PinnedSequence({ className, id }: PinnedSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const pin = pinRef.current;
      const stack = stackRef.current;
      if (!root || !pin || !stack) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.motionOk, () => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]", stack);
        const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", ticksRef.current);
        if (steps.length < 2) return;

        // Collapse the stack into a single grid cell so the steps overlap. Done
        // here rather than in CSS: without JS they must stay in normal flow.
        gsap.set(stack, { display: "grid" });
        gsap.set(steps, { gridArea: "1 / 1", willChange: "transform, opacity" });
        gsap.set(steps.slice(1), { opacity: 0, yPercent: STEP_SHIFT });

        let active = -1;
        const setActive = (next: number) => {
          if (next === active) return;
          active = next;
          ticks.forEach((tick, index) => {
            const on = index === next;
            tick.classList.toggle("bg-brand", on);
            tick.classList.toggle("bg-border", !on);
            gsap.to(tick, {
              scaleX: on ? 1.6 : 1,
              duration: durations.fast,
              ease: easings.out,
            });
          });
        };

        const tl = gsap.timeline({
          defaults: { ease: easings.inOut, duration: STEP_SWAP },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            // One viewport of scroll per transition — enough room to read each
            // step, not so much that the section feels like a hostage situation.
            end: () => `+=${window.innerHeight * (steps.length - 1)}`,
            pin,
            anticipatePin: 1,
            scrub: scrollDefaults.scrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setActive(Math.round(self.progress * (steps.length - 1)));
            },
          },
        });

        steps.forEach((step, index) => {
          if (index === 0) return;
          const at = (index - 1) * (STEP_HOLD + STEP_SWAP) + STEP_HOLD;
          tl.to(steps[index - 1], { opacity: 0, yPercent: -STEP_SHIFT }, at).to(
            step,
            { opacity: 1, yPercent: 0 },
            at + STEP_SWAP - SWAP_OVERLAP,
          );
        });

        // Trailing hold so the last principle is fully readable before unpinning.
        tl.to({}, { duration: STEP_HOLD });

        setActive(0);

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
          // Class toggling is outside GSAP's revert, so undo it explicitly.
          ticks.forEach((tick) => {
            tick.classList.remove("bg-brand");
            tick.classList.add("bg-border");
          });
        };
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      id={id}
      ref={rootRef}
      className={cn("relative border-y border-border bg-background", className)}
    >
      <div ref={pinRef} className="flex min-h-svh flex-col justify-center py-24 sm:py-28">
        <Container>
          <div className="flex flex-col gap-10 sm:gap-14">
            <div className="flex flex-col gap-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                How we work
              </p>
              <div ref={ticksRef} aria-hidden className="flex items-center gap-2">
                {principles.map((principle) => (
                  <span
                    key={principle.index}
                    data-tick
                    className="h-0.5 w-10 origin-left rounded-full bg-border"
                  />
                ))}
              </div>
            </div>

            <div ref={stackRef} className="flex flex-col gap-16 sm:gap-24">
              {principles.map((principle) => (
                <article
                  key={principle.word}
                  data-step
                  className="grid gap-6 sm:grid-cols-[4rem_1fr] sm:gap-10"
                >
                  <p className="font-mono text-sm text-brand sm:pt-3">{principle.index}</p>

                  <div className="flex flex-col gap-6">
                    <h3 className="text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-7xl lg:text-8xl">
                      {principle.word}
                    </h3>

                    <p className="max-w-2xl text-xl font-medium leading-snug text-balance sm:text-2xl">
                      {principle.headline}
                    </p>

                    <p className="max-w-2xl text-base leading-relaxed text-muted text-pretty">
                      {principle.description}
                    </p>

                    <p className="max-w-2xl border-l-2 border-brand pl-4 text-sm leading-relaxed text-muted">
                      {principle.proof}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
