"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { durations, easings, mediaQueries } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

/** Anything the cursor should react to. Opt extra elements in with data-cursor="hover". */
const HOVER_SELECTOR = 'a, button, [role="button"], [data-cursor="hover"]';

/** The ring sits back from full strength so the dot stays the precise element. */
const RING_IDLE_OPACITY = 0.6;

/**
 * Subscribes to a media query without touching state inside an effect —
 * `useSyncExternalStore` gives us a hydration-safe `false` on the server and a
 * live value on the client, and re-renders if the user changes the preference
 * mid-session (plugging in a mouse, toggling reduced motion).
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Custom cursor: a precise amber dot, and a ring that trails it.
 *
 * Renders nothing at all on coarse pointers, under reduced motion, or before
 * hydration — and the native cursor is only hidden once a real pointer has
 * actually moved, so a keyboard user on a touchscreen laptop never loses it.
 */
export function Cursor() {
  const finePointer = useMediaQuery(mediaQueries.finePointer);
  const motionOk = useMediaQuery(mediaQueries.motionOk);

  if (!finePointer || !motionOk) return null;

  return <CursorLayer />;
}

function CursorLayer() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    // The dot is written directly for exact tracking; the ring is eased so it
    // trails by a few frames — that lag is the whole effect.
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickTo(ring, "x", { duration: durations.fast, ease: easings.out });
    const ringY = gsap.quickTo(ring, "y", { duration: durations.fast, ease: easings.out });

    // Element-level `cursor: pointer` rules would win over an inline style on
    // <html>, so the native cursor is suppressed with a stylesheet we own and
    // remove on unmount.
    const hideNative = document.createElement("style");
    // Text fields keep their I-beam — losing the caret affordance in a form is a
    // worse trade than showing two cursors for the moment you are typing.
    hideNative.textContent =
      "*, *::before, *::after { cursor: none !important; }" +
      'input, textarea, select, [contenteditable="true"] { cursor: auto !important; }';

    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      document.head.appendChild(hideNative);
      gsap.to(dot, { opacity: 1, duration: durations.fast, ease: easings.out });
      gsap.to(ring, {
        opacity: RING_IDLE_OPACITY,
        duration: durations.fast,
        ease: easings.out,
      });
    };

    const onMove = (event: PointerEvent) => {
      // Touch and pen events reach the same listener; only a mouse takes over.
      if (event.pointerType !== "mouse") return;
      activate();
      setDotX(event.clientX);
      setDotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    let hovering = false;
    const setHover = (next: boolean) => {
      if (next === hovering) return;
      hovering = next;
      gsap.to(ring, {
        scale: next ? 1.8 : 1,
        opacity: next ? 1 : RING_IDLE_OPACITY,
        duration: durations.fast,
        ease: easings.out,
      });
      gsap.to(dot, {
        scale: next ? 0.4 : 1,
        duration: durations.fast,
        ease: easings.out,
      });
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target;
      setHover(target instanceof Element && target.closest(HOVER_SELECTOR) !== null);
    };

    const onLeaveWindow = () => {
      gsap.to([dot, ring], { opacity: 0, duration: durations.instant, ease: easings.out });
    };
    const onEnterWindow = () => {
      if (!activated) return;
      gsap.to(dot, { opacity: 1, duration: durations.instant, ease: easings.out });
      gsap.to(ring, {
        opacity: hovering ? 1 : RING_IDLE_OPACITY,
        duration: durations.instant,
        ease: easings.out,
      });
    };

    const root = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    root.addEventListener("pointerleave", onLeaveWindow);
    root.addEventListener("pointerenter", onEnterWindow);
    window.addEventListener("blur", onLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeaveWindow);
      root.removeEventListener("pointerenter", onEnterWindow);
      window.removeEventListener("blur", onLeaveWindow);
      hideNative.remove();
    };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 size-9 rounded-full border border-brand will-change-transform"
      />
      <div ref={dotRef} className="absolute left-0 top-0 size-1.5 rounded-full bg-brand will-change-transform" />
    </div>
  );
}
