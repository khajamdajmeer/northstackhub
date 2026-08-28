"use client";

import { useEffect, useState } from "react";

export type WebGLSupport = {
  /** A WebGL2/WebGL context could actually be created. */
  supported: boolean;
  /** Detection has run — before this, assume nothing and render the fallback. */
  ready: boolean;
  /** Supported, but the device or the user has asked us not to spend the frames. */
  degraded: boolean;
};

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type CapabilityNavigator = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);
const INITIAL: WebGLSupport = { supported: false, ready: false, degraded: false };

/**
 * Browsers cap the number of live WebGL contexts, and the answer cannot change
 * within a document, so the probe result is cached for the page.
 */
let cachedSupport: boolean | null = null;

function probeWebGL(): boolean {
  if (cachedSupport !== null) return cachedSupport;

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cachedSupport = context !== null;
    // Give the probe context straight back rather than waiting for GC.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cachedSupport = false;
  }

  return cachedSupport;
}

/**
 * Coarse signals only. The aim is to catch the low-end phone and the user who
 * asked for less motion, not to build a device database.
 */
function detectDegraded(): boolean {
  if (window.matchMedia(REDUCED_MOTION).matches) return true;

  const nav = navigator as CapabilityNavigator;

  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;

  const connection = nav.connection;
  if (connection?.saveData === true) return true;
  if (connection?.effectiveType && SLOW_CONNECTIONS.has(connection.effectiveType)) return true;

  return false;
}

export function useWebGLSupport(): WebGLSupport {
  const [support, setSupport] = useState<WebGLSupport>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    // Detection is deferred by a frame so it can never land in front of the
    // first paint, and so no state is written synchronously from the effect.
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      setSupport({ supported: probeWebGL(), ready: true, degraded: detectDegraded() });
    });

    const motion = window.matchMedia(REDUCED_MOTION);
    const onMotionChange = () => {
      setSupport((previous) =>
        previous.ready ? { ...previous, degraded: detectDegraded() } : previous,
      );
    };
    motion.addEventListener("change", onMotionChange);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return support;
}
