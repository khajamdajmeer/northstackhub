"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  durations,
  easings,
  mediaQueries,
  scrollTrigger as scrollDefaults,
} from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Values arrive pre-formatted from content ("180+", "4.9/5", "72%", "26"), so
 * the number is found inside the string rather than passed separately — the
 * copy stays the source of truth and the prefix/suffix survive untouched.
 */
const VALUE_PATTERN = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

type ParsedValue = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  grouped: boolean;
  /** The numeric portion exactly as authored — what we render and restore. */
  literal: string;
};

function parseValue(value: string): ParsedValue | null {
  const match = VALUE_PATTERN.exec(value);
  if (!match) return null;

  const [, prefix, literal, suffix] = match;
  const target = Number(literal.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;

  return {
    prefix,
    suffix,
    target,
    decimals: literal.split(".")[1]?.length ?? 0,
    grouped: literal.includes(","),
    literal,
  };
}

export type CounterProps = {
  /** Any string with a leading number, e.g. "180+", "4.9/5", "72%", "26". */
  value: string;
  className?: string;
};

/**
 * Counts up to its value the first time it scrolls into view. The finished
 * value is what renders on the server, so without JS — or under reduced motion
 * — the reader gets the real figure immediately and nothing ever shows a zero.
 */
export function Counter({ value, className }: CounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const parsed = parseValue(value);

  useGSAP(
    () => {
      const el = numberRef.current;
      if (!el || !parsed) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQueries.motionOk, () => {
        const format = (n: number) =>
          parsed.grouped
            ? n.toLocaleString("en-US", {
                minimumFractionDigits: parsed.decimals,
                maximumFractionDigits: parsed.decimals,
              })
            : n.toFixed(parsed.decimals);

        const counter = { value: 0 };
        const tween = gsap.to(counter, {
          value: parsed.target,
          duration: durations.count,
          ease: easings.out,
          onUpdate: () => {
            el.textContent = format(counter.value);
          },
          scrollTrigger: {
            trigger: el,
            start: scrollDefaults.start,
            once: true,
            // Only zero the display once the count is actually about to run.
            onEnter: () => {
              el.textContent = format(0);
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          // GSAP reverts styles, not text — put the real figure back by hand.
          el.textContent = parsed.literal;
        };
      });
    },
    { scope: numberRef, dependencies: [value], revertOnUpdate: true },
  );

  if (!parsed) {
    return <span className={cn(className)}>{value}</span>;
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {parsed.prefix}
      <span ref={numberRef}>{parsed.literal}</span>
      {parsed.suffix}
    </span>
  );
}
