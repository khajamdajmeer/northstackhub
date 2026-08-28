"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  MathUtils,
  Matrix4,
  type BufferAttribute,
  type Group,
  type InstancedMesh,
  type Points,
  type Texture,
} from "three";
import { SceneCanvas } from "./scene-canvas";

/*
  A stack of tiers, wired together.

  Nodes sit on a lightly jittered grid on four tiers; each node hands off to the
  tier above it — usually straight up, sometimes sideways — so the structure
  reads as a routed system rather than a box of lines. Amber signals travel the
  hand-off edges and briefly light the node they arrive at. Everything is one
  draw call per layer, additively blended, and fades out toward the rim so the
  lattice dissolves into the page instead of ending at a hard edge.
*/

// Literal values rather than CSS tokens: these are GPU colours, not DOM colours.
const AMBER = "#f5a524";
const DEEP_AMBER = "#c77b12";
const BONE = "#f2f3f5";
const LINE = "#1e2127";

const TIERS = 4;
const GRID = 5;
const NODE_COUNT = TIERS * GRID * GRID;
// Plates are deliberately wider than the stack is tall: at a 1:1 ratio the whole
// thing reads as a wireframe cube instead of a system with layers.
const CELL = 0.95;
const TIER_GAP = 0.85;
const TIER_TWIST = 0.11;
const JITTER = 0.12;
const NODE_RADIUS = 0.026;

const FADE_INNER = 0.95;
const FADE_OUTER = 2.65;
/*
  Everything is additively blended, so alpha is a light budget rather than an
  opacity: a single plate edge lands around #454545 over the canvas, and the
  crowded middle of the lattice climbs from there without clipping to white.
  Risers sit under the plates so the layers stay the dominant reading.
*/
const PLATE_ALPHA = 0.24;
const RISER_ALPHA = 0.13;
const CONDUIT_ALPHA = 0.5;

const PULSE_COUNT = 12;
const PULSE_STRIDE = 7;
const SPIN_SPEED = 0.058;
const BASE_TILT = 0.05;
const POINTER_DAMPING = 2.2;

export const HERO_CAMERA = { position: [0, 0.85, 6.2] as [number, number, number], fov: 36, near: 0.1, far: 24 };

/** mulberry32 — deterministic so the lattice is identical on every render. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

type Lattice = {
  nodes: Float32Array;
  /** 0..1 rim falloff per node — the thing that makes the lattice dissolve. */
  falloff: Float32Array;
  nodeColors: Float32Array;
  nodeScales: Float32Array;
  linePositions: Float32Array;
  lineColors: Float32Array;
  pulseFrom: Uint16Array;
  pulseTo: Uint16Array;
  pulsePhase: Float32Array;
  pulseSpeed: Float32Array;
};

function buildLattice(): Lattice {
  const random = createRandom(0x4e5348);
  const nodes = new Float32Array(NODE_COUNT * 3);
  const falloff = new Float32Array(NODE_COUNT);
  const nodeScales = new Float32Array(NODE_COUNT);
  const isHub = new Uint8Array(NODE_COUNT);

  const indexOf = (tier: number, row: number, col: number) => (tier * GRID + row) * GRID + col;
  const centre = (GRID - 1) / 2;
  const midTier = (TIERS - 1) / 2;

  for (let tier = 0; tier < TIERS; tier += 1) {
    const angle = (tier - midTier) * TIER_TWIST;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tierScale = 1 - Math.abs(tier - midTier) * 0.05;

    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        const i = indexOf(tier, row, col);
        const gx = (col - centre) * CELL * tierScale + (random() - 0.5) * JITTER;
        const gz = (row - centre) * CELL * tierScale + (random() - 0.5) * JITTER;

        const x = gx * cos - gz * sin;
        const z = gx * sin + gz * cos;
        const y = (tier - midTier) * TIER_GAP + (random() - 0.5) * JITTER * 0.6;

        nodes[i * 3] = x;
        nodes[i * 3 + 1] = y;
        nodes[i * 3 + 2] = z;

        // Fades outward and, more gently, toward the top and bottom plates, so
        // the stack dissolves into the page rather than stopping at an edge.
        const rim = 1 - smoothstep(FADE_INNER, FADE_OUTER, Math.hypot(x, z));
        falloff[i] = rim * (1 - 0.7 * smoothstep(0.4, 1.5, Math.abs(y)));
        isHub[i] = random() < 0.12 ? 1 : 0;
        nodeScales[i] = isHub[i] ? 1.5 : 1;
      }
    }
  }

  // Edges: the grid within a tier, plus one hand-off per node to the tier above.
  const edges: number[] = [];
  const links: number[] = [];
  const risers = new Set<number>();

  for (let tier = 0; tier < TIERS; tier += 1) {
    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        const i = indexOf(tier, row, col);

        if (col + 1 < GRID) edges.push(i, indexOf(tier, row, col + 1));
        if (row + 1 < GRID) edges.push(i, indexOf(tier, row + 1, col));

        if (tier + 1 < TIERS) {
          const dr = random() < 0.34 ? (random() < 0.5 ? -1 : 1) : 0;
          const dc = random() < 0.34 ? (random() < 0.5 ? -1 : 1) : 0;
          const target = indexOf(
            tier + 1,
            MathUtils.clamp(row + dr, 0, GRID - 1),
            MathUtils.clamp(col + dc, 0, GRID - 1),
          );
          risers.add(edges.length / 2);
          links.push(edges.length / 2, i, target);
          edges.push(i, target);
        }
      }
    }
  }

  // Signals ride a spread of hand-off edges; the stride keeps them off one column.
  const linkCount = links.length / 3;
  const pulseFrom = new Uint16Array(PULSE_COUNT);
  const pulseTo = new Uint16Array(PULSE_COUNT);
  const pulsePhase = new Float32Array(PULSE_COUNT);
  const pulseSpeed = new Float32Array(PULSE_COUNT);
  const conduits = new Set<number>();

  for (let p = 0; p < PULSE_COUNT; p += 1) {
    const link = ((p * PULSE_STRIDE + 3) % linkCount) * 3;
    conduits.add(links[link]);
    pulseFrom[p] = links[link + 1];
    pulseTo[p] = links[link + 2];
    pulsePhase[p] = random();
    pulseSpeed[p] = 0.15 + random() * 0.11;
  }

  const edgeCount = edges.length / 2;
  const linePositions = new Float32Array(edgeCount * 6);
  const lineColors = new Float32Array(edgeCount * 8);

  const structural = new Color(LINE).lerp(new Color(BONE), 0.3);
  const conduit = new Color(DEEP_AMBER);

  for (let e = 0; e < edgeCount; e += 1) {
    const isConduit = conduits.has(e);
    const colour = isConduit ? conduit : structural;
    const alpha = isConduit ? CONDUIT_ALPHA : risers.has(e) ? RISER_ALPHA : PLATE_ALPHA;

    for (let end = 0; end < 2; end += 1) {
      const node = edges[e * 2 + end];
      const vertex = e * 2 + end;

      linePositions[vertex * 3] = nodes[node * 3];
      linePositions[vertex * 3 + 1] = nodes[node * 3 + 1];
      linePositions[vertex * 3 + 2] = nodes[node * 3 + 2];

      lineColors[vertex * 4] = colour.r;
      lineColors[vertex * 4 + 1] = colour.g;
      lineColors[vertex * 4 + 2] = colour.b;
      lineColors[vertex * 4 + 3] = alpha * falloff[node];
    }
  }

  const nodeColors = new Float32Array(NODE_COUNT * 3);
  const quiet = new Color(BONE).multiplyScalar(0.32);
  const hub = new Color(AMBER).multiplyScalar(0.62);

  for (let i = 0; i < NODE_COUNT; i += 1) {
    const colour = isHub[i] ? hub : quiet;
    nodeColors[i * 3] = colour.r * falloff[i];
    nodeColors[i * 3 + 1] = colour.g * falloff[i];
    nodeColors[i * 3 + 2] = colour.b * falloff[i];
  }

  return {
    nodes,
    falloff,
    nodeColors,
    nodeScales,
    linePositions,
    lineColors,
    pulseFrom,
    pulseTo,
    pulsePhase,
    pulseSpeed,
  };
}

// Built once at module scope: the geometry is identical for every mount, and the
// per-frame buffers below are the only things that need to be per-instance.
const LATTICE = buildLattice();
const FLARE = new Color(AMBER).multiplyScalar(1.15);

/**
 * One 64px sprite shared by the whole document. Disposing it on unmount would
 * only force the next mount to rebuild it, so it is cached deliberately.
 */
let pulseSprite: Texture | null = null;

function getPulseSprite(): Texture | null {
  if (pulseSprite) return pulseSprite;
  if (typeof document === "undefined") return null;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  pulseSprite = new CanvasTexture(canvas);
  return pulseSprite;
}

function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

/** Lift one instance colour toward the flare colour, in place. */
function flareNode(colors: Float32Array, node: number, amount: number) {
  const strength = Math.min(amount, 1) * LATTICE.falloff[node];
  const offset = node * 3;
  colors[offset] += (FLARE.r - colors[offset]) * strength;
  colors[offset + 1] += (FLARE.g - colors[offset + 1]) * strength;
  colors[offset + 2] += (FLARE.b - colors[offset + 2]) * strength;
}

export function HeroObject() {
  const groupRef = useRef<Group>(null);
  const nodesRef = useRef<InstancedMesh>(null);
  const pulsesRef = useRef<Points>(null);

  const width = useThree((state) => state.size.width);
  const scale = useMemo(() => MathUtils.clamp(width / 1280, 0.6, 1), [width]);
  const sprite = useMemo(() => getPulseSprite(), []);

  // Per-instance buffers for the signals; everything static lives in LATTICE.
  // They are handed to the geometry below and only ever written through it.
  const pulseBuffers = useMemo(
    () => ({
      positions: new Float32Array(PULSE_COUNT * 3),
      colors: new Float32Array(PULSE_COUNT * 4),
    }),
    [],
  );

  const motion = useRef({ spin: 0, elapsed: 0, x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });

  // The canvas is pointer-events:none so it never sees pointer events itself.
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onPointerOut = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerOut);
    window.addEventListener("blur", onPointerOut);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerOut);
      window.removeEventListener("blur", onPointerOut);
    };
  }, []);

  useEffect(() => {
    const mesh = nodesRef.current;
    if (!mesh) return;

    const matrix = new Matrix4();
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const size = NODE_RADIUS * LATTICE.nodeScales[i];
      matrix.makeScale(size, size, size);
      matrix.setPosition(
        LATTICE.nodes[i * 3],
        LATTICE.nodes[i * 3 + 1],
        LATTICE.nodes[i * 3 + 2],
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    if (!mesh.instanceColor) {
      const colours = new InstancedBufferAttribute(new Float32Array(NODE_COUNT * 3), 3);
      colours.setUsage(DynamicDrawUsage);
      mesh.instanceColor = colours;
    }
    mesh.instanceColor.array.set(LATTICE.nodeColors);
    mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const mesh = nodesRef.current;
    const pulses = pulsesRef.current;
    if (!group || !mesh || !pulses) return;

    // Resuming after a pause hands us one enormous delta; clamp it.
    const delta = Math.min(rawDelta, 0.05);
    const state = motion.current;
    state.elapsed += delta;
    state.spin += delta * SPIN_SPEED;
    state.x = damp(state.x, pointer.current.x, POINTER_DAMPING, delta);
    state.y = damp(state.y, pointer.current.y, POINTER_DAMPING, delta);

    group.rotation.y = state.spin + state.x * 0.22;
    group.rotation.x = BASE_TILT + state.y * 0.12;
    group.position.y = Math.sin(state.spin * 0.8) * 0.05;

    const positionAttribute = pulses.geometry.getAttribute("position") as BufferAttribute;
    const colorAttribute = pulses.geometry.getAttribute("color") as BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Float32Array;
    const nodeColors = mesh.instanceColor;

    // Reset to the resting palette, then let arriving signals write over it.
    if (nodeColors) nodeColors.array.set(LATTICE.nodeColors);

    for (let p = 0; p < PULSE_COUNT; p += 1) {
      const from = LATTICE.pulseFrom[p];
      const to = LATTICE.pulseTo[p];
      const t = (state.elapsed * LATTICE.pulseSpeed[p] + LATTICE.pulsePhase[p]) % 1;
      const eased = t * t * (3 - 2 * t);

      positions[p * 3] =
        LATTICE.nodes[from * 3] + (LATTICE.nodes[to * 3] - LATTICE.nodes[from * 3]) * eased;
      positions[p * 3 + 1] =
        LATTICE.nodes[from * 3 + 1] +
        (LATTICE.nodes[to * 3 + 1] - LATTICE.nodes[from * 3 + 1]) * eased;
      positions[p * 3 + 2] =
        LATTICE.nodes[from * 3 + 2] +
        (LATTICE.nodes[to * 3 + 2] - LATTICE.nodes[from * 3 + 2]) * eased;

      const envelope = Math.sin(Math.PI * t);
      const rim = LATTICE.falloff[from] + (LATTICE.falloff[to] - LATTICE.falloff[from]) * eased;

      colors[p * 4] = FLARE.r;
      colors[p * 4 + 1] = FLARE.g;
      colors[p * 4 + 2] = FLARE.b;
      colors[p * 4 + 3] = envelope * rim;

      // The endpoints light as a signal leaves and again as it lands.
      if (nodeColors) {
        if (t < 0.16) flareNode(nodeColors.array as Float32Array, from, (0.16 - t) / 0.16);
        if (t > 0.84) flareNode(nodeColors.array as Float32Array, to, (t - 0.84) / 0.16);
      }
    }

    if (nodeColors) nodeColors.needsUpdate = true;
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[LATTICE.linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[LATTICE.lineColors, 4]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </lineSegments>

      <instancedMesh ref={nodesRef} args={[undefined, undefined, NODE_COUNT]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </instancedMesh>

      <points ref={pulsesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pulseBuffers.positions, 3]}
            usage={DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[pulseBuffers.colors, 4]}
            usage={DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={AdditiveBlending}
          map={sprite}
        />
      </points>
    </group>
  );
}

/**
 * Lazy entry point for the hero. Kept in this module so the dynamic import pulls
 * three, the canvas wrapper and the scene down as one chunk instead of a waterfall.
 */
export function HeroObjectCanvas({ fallback }: { fallback: ReactNode }) {
  return (
    <SceneCanvas fallback={fallback} camera={HERO_CAMERA} frameloop="always">
      <HeroObject />
    </SceneCanvas>
  );
}
