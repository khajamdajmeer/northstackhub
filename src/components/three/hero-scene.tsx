"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/*
  Public entry point for the hero's 3D layer.

  The page renders its own text and CTAs on the server; this component sits
  behind them, ships nothing 3D in the initial bundle, and only reaches for the
  GPU once the browser is idle. Until then — and forever, on devices that should
  not be spending frames on decoration — it draws the same lattice as a static
  isometric composition.
*/

const HeroObjectCanvas = dynamic(() => import("./hero-object").then((mod) => mod.HeroObjectCanvas), {
  ssr: false,
  loading: () => <HeroFallback />,
});

const TIER_COUNT = 4;
const GRID_SIZE = 5;
const ISO_X = 62;
const ISO_Y = 22;
const TIER_STEP = 106;
const CENTRE = (GRID_SIZE - 1) / 2;

type Point = readonly [number, number];

function project(col: number, row: number, tier: number): Point {
  return [
    400 + (col - CENTRE) * ISO_X - (row - CENTRE) * ISO_X,
    300 +
      (col - CENTRE) * ISO_Y +
      (row - CENTRE) * ISO_Y -
      (tier - (TIER_COUNT - 1) / 2) * TIER_STEP,
  ];
}

const round = (value: number) => Math.round(value * 10) / 10;
const segment = (from: Point, to: Point) =>
  `M${round(from[0])} ${round(from[1])}L${round(to[0])} ${round(to[1])}`;

/** One path per tier: the five rows and five columns of that plate. */
const TIER_PATHS = Array.from({ length: TIER_COUNT }, (_, tier) => {
  const parts: string[] = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    parts.push(segment(project(0, i, tier), project(GRID_SIZE - 1, i, tier)));
    parts.push(segment(project(i, 0, tier), project(i, GRID_SIZE - 1, tier)));
  }
  return parts.join("");
});

/** Risers tying the plates together, thinned out so the stack stays readable. */
const RISER_PATH = (() => {
  const parts: string[] = [];
  for (let tier = 0; tier < TIER_COUNT - 1; tier += 1) {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if ((row + col) % 2 !== 0) continue;
        parts.push(segment(project(col, row, tier), project(col, row, tier + 1)));
      }
    }
  }
  return parts.join("");
})();

/** Two routes climbing the stack and meeting at a hub — the amber in the frame. */
const ROUTES: readonly (readonly Point[])[] = [
  [project(1, 3, 0), project(2, 3, 1), project(2, 2, 2), project(3, 2, 3)],
  [project(3, 1, 0), project(3, 1, 1), project(2, 2, 2), project(1, 2, 3)],
];

const ROUTE_PATHS = ROUTES.map((route) =>
  route
    .map((point, index) =>
      index === 0
        ? `M${round(point[0])} ${round(point[1])}`
        : `L${round(point[0])} ${round(point[1])}`,
    )
    .join(""),
);

const ROUTE_NODES: Point[] = ROUTES.flatMap((route) => [...route]).filter(
  (point, index, all) =>
    all.findIndex((other) => other[0] === point[0] && other[1] === point[1]) === index,
);

const STRUCTURAL_NODES: Point[] = (() => {
  const points: Point[] = [];
  for (let tier = 0; tier < TIER_COUNT; tier += 1) {
    for (const row of [0, 2, 4]) {
      for (const col of [0, 2, 4]) {
        points.push(project(col, row, tier));
      }
    }
  }
  return points;
})();

const EDGE_FADE = "radial-gradient(ellipse 62% 62% at 50% 50%, #000 30%, transparent 100%)";

/**
 * The designed fallback: same lattice, same restraint, no GPU. Server-rendered,
 * so a phone that never runs the canvas still gets a finished-looking hero.
 */
function HeroFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand opacity-[0.07] blur-3xl" />
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 size-full"
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
        role="presentation"
        focusable="false"
      >
        <g className="text-muted" stroke="currentColor" fill="none" strokeLinecap="round">
          <path d={RISER_PATH} strokeWidth={1} strokeOpacity={0.22} />
          {TIER_PATHS.map((path, index) => (
            <path
              key={index}
              d={path}
              strokeWidth={1}
              strokeOpacity={index === 1 || index === 2 ? 0.4 : 0.24}
            />
          ))}
        </g>

        <g className="text-brand" stroke="currentColor" fill="none" strokeLinecap="round">
          {ROUTE_PATHS.map((path, index) => (
            <path key={index} d={path} strokeWidth={1.4} strokeOpacity={0.6} />
          ))}
        </g>

        <g className="text-muted" fill="currentColor">
          {STRUCTURAL_NODES.map((point, index) => (
            <circle key={index} cx={point[0]} cy={point[1]} r={1.8} fillOpacity={0.6} />
          ))}
        </g>

        <g className="text-brand" fill="currentColor">
          {ROUTE_NODES.map((point, index) => (
            <circle key={index} cx={point[0]} cy={point[1]} r={2.6} fillOpacity={0.85} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function HeroScene({ className }: { className?: string }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let cancel: (() => void) | undefined;

    // One frame for the hero's real content to paint, then wait for idle before
    // asking for a GL context. The timeout keeps it from never arriving.
    const frame = requestAnimationFrame(() => {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(() => setArmed(true), { timeout: 1200 });
        cancel = () => window.cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(() => setArmed(true), 200);
        cancel = () => window.clearTimeout(id);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      cancel?.();
    };
  }, []);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {armed ? (
        <div className="animate-fade-up size-full">
          <HeroObjectCanvas fallback={<HeroFallback />} />
        </div>
      ) : (
        <HeroFallback />
      )}
    </div>
  );
}
