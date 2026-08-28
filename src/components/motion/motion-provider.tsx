"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Plugins register at module scope so any component that mounts before this
 * provider's effects run still finds them available. `registerPlugin` is
 * idempotent, and GSAP no-ops it during SSR where there is no window.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

if (typeof window !== "undefined") {
  ScrollTrigger.config({
    // Batch callbacks into the same tick — fewer style reads under fast scroll.
    limitCallbacks: true,
    // Mobile browsers resize when the URL bar collapses; refreshing there
    // re-measures pinned sections mid-scroll and makes them jump.
    ignoreMobileResize: true,
  });
}

/**
 * Wraps the app once, in the root layout. Renders children untouched — its only
 * job is keeping ScrollTrigger's measurements honest. Pinned sections measure
 * at creation time, so anything that changes layout afterwards (webfonts
 * swapping in, a new route's DOM) has to trigger a refresh or the pin will be
 * off by however much the layout moved.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // `document.fonts.ready` resolves after the swap, which is when line counts
    // and therefore section heights are final.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Two frames: one for React to commit the new route, one for the browser to
    // lay it out. Refreshing any earlier measures the outgoing page.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pathname]);

  return <>{children}</>;
}
