"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, type CameraProps, type Frameloop, type RootState } from "@react-three/fiber";
import { cn } from "@/lib/utils";
import { useWebGLSupport } from "./use-webgl-support";

type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
  /** Rendered instead of the canvas whenever WebGL is unavailable or unwelcome. */
  fallback: ReactNode;
  camera?: CameraProps;
  frameloop?: Frameloop;
};

/**
 * Shared wrapper for every WebGL scene on the site. It owns the parts that are
 * easy to get wrong once and then leak everywhere: capability gating, the frame
 * budget, and pausing the loop when nobody is looking.
 */
export function SceneCanvas({
  children,
  className,
  fallback,
  camera,
  frameloop = "demand",
}: SceneCanvasProps) {
  const { supported, ready, degraded } = useWebGLSupport();
  const hostRef = useRef<HTMLDivElement>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  // Optimistic: the scene is mounted deliberately, so assume it is on screen and
  // let the observer correct us a frame later rather than dropping the first frame.
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setOnScreen(entry.isIntersecting);
      },
      { rootMargin: "128px" },
    );
    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Detach the context-loss listener even though the canvas usually goes with it.
  useEffect(() => () => teardownRef.current?.(), []);

  const gl = useMemo(
    () => ({
      powerPreference: "high-performance" as const,
      alpha: true,
      // MSAA is only worth its cost where there is no pixel density to hide the
      // stair-stepping; retina screens get their anti-aliasing from the DPR clamp.
      antialias: typeof window !== "undefined" && window.devicePixelRatio < 1.5,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    }),
    [],
  );

  const onCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    const onContextLost = (event: Event) => {
      // Preventing the default keeps the browser from tearing the page down with
      // it; we swap to the static composition instead of showing a dead canvas.
      event.preventDefault();
      setContextLost(true);
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    teardownRef.current = () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, []);

  const showCanvas = ready && supported && !degraded && !contextLost;
  const running = onScreen && tabVisible;

  return (
    <div ref={hostRef} className={cn("relative h-full w-full", className)} aria-hidden>
      {showCanvas ? (
        <Canvas
          tabIndex={-1}
          style={{ pointerEvents: "none" }}
          camera={camera}
          frameloop={running ? frameloop : "never"}
          dpr={[1, 1.75]}
          gl={gl}
          flat
          resize={{ scroll: false, debounce: 120 }}
          onCreated={onCreated}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      ) : (
        fallback
      )}
    </div>
  );
}
