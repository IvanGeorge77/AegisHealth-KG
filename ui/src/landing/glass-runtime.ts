import {
  FrontSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import { atmosphereFrag, atmosphereVert } from "./shaders/atmosphere";
import { glassFrag, glassVert } from "./shaders/glass";

/* ============================================================================
   Liquid glass runtime
   ----------------------------------------------------------------------------
   Owns the renderer, the scene, and the frame loop. The React component above
   it only supplies a canvas element and receives back a "supported" flag.

   Design decisions worth knowing:

   • Geometry is modest (a subdivided icosahedron, ~2.5k triangles). Deformation
     is almost entirely per-vertex arithmetic in the shader, so extra segments
     cost little but buy little too. Quality comes from the fragment shader.
   • Normals are recomputed in the fragment shader from derivatives, so the
     lighting stays correct through the deformation without a second pass.
   • No render targets, no post-processing, no textures. Everything is
     procedural, which keeps the whole effect inside two draw calls.
   • The loop parks itself when the tab or canvas is not visible, and clamps
     device pixel ratio, so it costs nothing in the background.
   ========================================================================= */

const MAX_RIPPLES = 8;

/** Frames below this rate get skipped when the page is not focused. */
const IDLE_FRAME_MS = 1000 / 30;

export interface GlassRuntimeOptions {
  canvas: HTMLCanvasElement;
  /** Disable all autonomous motion; the surface still responds to input. */
  reducedMotion: boolean;
  /** Coarser geometry and pixel ratio, for small or low-power devices. */
  lowPower: boolean;
}

export interface GlassRuntime {
  supported: boolean;
  /** 0 = no interaction yet, 1 = fully engaged. Drives the UI hint. */
  setEngaged: (engaged: boolean) => void;
  onEngage?: () => void;
  dispose: () => void;
}

export function createGlassRuntime({
  canvas,
  reducedMotion,
  lowPower,
}: GlassRuntimeOptions): GlassRuntime {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: !lowPower,
      alpha: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
      // Keeps the drawing buffer readable after presentation, so the canvas
      // can be captured (browser screenshots, "save image as", thumbnails).
      // Without it the buffer is cleared on composite and any attempt to read
      // it back returns empty.
      preserveDrawingBuffer: true,
    });
  } catch {
    return { supported: false, setEngaged: () => {}, dispose: () => {} };
  }

  if (!renderer.getContext()) {
    return { supported: false, setEngaged: () => {}, dispose: () => {} };
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();

  // ── Camera ─────────────────────────────────────────────────────────────
  // Starts pushed back so the form bleeds past the frame edges.
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  // ── Atmosphere ─────────────────────────────────────────────────────────
  const atmosphereUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(0.5, 0.5) },
    uIntensity: { value: 1 },
  };

  const atmosphereGeometry = new PlaneGeometry(2, 2);
  const atmosphere = new Mesh(
    atmosphereGeometry,
    new ShaderMaterial({
      vertexShader: atmosphereVert,
      fragmentShader: atmosphereFrag,
      uniforms: atmosphereUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  );
  atmosphere.frustumCulled = false;
  scene.add(atmosphere);

  // ── Glass ──────────────────────────────────────────────────────────────
  const rippleStrength = new Float32Array(MAX_RIPPLES);
  const rippleBirth = new Float32Array(MAX_RIPPLES);
// Seed with a non-zero direction so an untouched slot can never produce a
  // zero-length vector if it is ever evaluated.
  const rippleDir = new Float32Array(MAX_RIPPLES * 2);
  for (let i = 0; i < MAX_RIPPLES; i++) rippleDir[i * 2 + 1] = 1;

  const glassUniforms = {
    uTime: { value: 0 },
    uMorph: { value: reducedMotion ? 0.14 : 0.34 },
    uDetail: { value: reducedMotion ? 0.04 : 0.09 },
    uPointer: { value: new Vector3(0, 0, 1) },
    uPush: { value: 0 },
    uRipple: { value: rippleStrength },
    uRippleAt: { value: rippleBirth },
    uRippleDir: { value: rippleDir },
    uCameraPos: { value: new Vector3() },
    uKeyDir: { value: new Vector3(-0.48, 0.66, 0.58).normalize() },
    uIridescence: { value: 0.9 },
    uOpacity: { value: 1 },
  };

  const glassGeometry = lowPower
    ? new SphereGeometry(1, 128, 96)
    : new SphereGeometry(1, 208, 156);

  const glass = new Mesh(
    glassGeometry,
    new ShaderMaterial({
      vertexShader: glassVert,
      fragmentShader: glassFrag,
      uniforms: glassUniforms,
      // Normal blending, not additive. Additive ignores alpha and lifts the
      // whole silhouette uniformly, which reads as milky fog rather than
      // glass — exactly the failure mode to avoid here.
      transparent: true,
      depthWrite: false,
      side: FrontSide,
    }),
  );
  glass.frustumCulled = false;
  scene.add(glass);

  // ── Sizing ─────────────────────────────────────────────────────────────
  // Framing: the form sits off-centre and oversized on wide viewports so it
  // bleeds past the right edge rather than sitting behind the headline like a
  // badge. On portrait it recentres and grows, because there is no side space
  // to bleed into.
  const layout = { offsetX: 0, offsetY: 0, scale: 1 };

  function applyLayout(width: number, height: number) {
    const aspect = width / Math.max(height, 1);
    const portrait = height > width;

    if (portrait) {
      layout.offsetX = 0;
      layout.offsetY = 0.15;
      layout.scale = 1.55;
    } else if (aspect < 1.4) {
      layout.offsetX = 0.75;
      layout.offsetY = 0.10;
      layout.scale = 2.05;
    } else {
      layout.offsetX = 1.70;
      layout.offsetY = 0.14;
      layout.scale = 2.30;
    }
  }

  function resize() {
    const parent = canvas.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);

    const portrait = height > width;
    camera.fov = portrait ? 54 : 40;
    camera.position.z = portrait ? 8.2 : 7.2;

    applyLayout(width, height);
    glass.position.set(layout.offsetX, layout.offsetY, 0);
    glass.scale.setScalar(layout.scale);

    camera.updateProjectionMatrix();
    atmosphereUniforms.uResolution.value.set(width, height);
  }

  glassGeometry.computeBoundingSphere();
  resize();
  window.addEventListener("resize", resize);

  // ── Interaction ────────────────────────────────────────────────────────
  //
  // The pointer is projected onto a plane through the origin facing the
  // camera, then normalised to the unit sphere. Vertices near that direction
  // respond most.
  const pointerTarget = new Vector3(0, 0, 1);
  const pointerSmooth = new Vector3(0, 0, 1);
  const pointerPrev = new Vector3(0, 0, 1);
  const pointerNdc = new Vector2(0, 0);
  const pointerUv = new Vector2(0.5, 0.5);

  let push = 0;
  let pushTarget = 0;
  let pointerActive = false;
  let engaged = false;
  let engageReported = false;

  let rippleCursor = 0;
  let lastRippleAt = -1;
  /** Animation clock, advanced by the frame loop. */
  let elapsed = 0;

  /** Sphere direction for a point on the z = 0 plane, in the glass's local frame. */
  const planeHit = new Vector3();
  function directionFromNdc(ndcX: number, ndcY: number, out: Vector3): Vector3 {
    // Convert NDC to a world point on the plane through the origin.
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const halfWidth = halfHeight * camera.aspect;
    planeHit.set(ndcX * halfWidth, ndcY * halfHeight, 0);
    // The form is offset for composition, so work relative to its own origin —
    // otherwise the cursor would pull the wrong side of the surface.
    out.copy(planeHit).sub(glass.position).normalize();
    return out;
  }

  function emitRipple(dir: Vector3, strength: number) {
    rippleStrength[rippleCursor] = strength;
    rippleBirth[rippleCursor] = elapsed;
    rippleDir[rippleCursor * 2] = dir.x;
    rippleDir[rippleCursor * 2 + 1] = dir.y;
    rippleCursor = (rippleCursor + 1) % MAX_RIPPLES;
    lastRippleAt = elapsed;
  }

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;

    pointerUv.set(nx, 1 - ny);
    pointerNdc.set(nx * 2 - 1, ny * 2 - 1);

    directionFromNdc(pointerNdc.x, pointerNdc.y, pointerTarget);
    pointerActive = true;
    pushTarget = 1;

    if (!engaged) {
      engaged = true;
      if (!engageReported) {
        engageReported = true;
        runtime.onEngage?.();
      }
    }
  }

  function onPointerLeave() {
    pointerActive = false;
    pushTarget = 0;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("blur", onPointerLeave);

  // ── Frame loop ─────────────────────────────────────────────────────────
  const clock = { last: performance.now() };
  let frame = 0;
  let running = true;
  let visible = !document.hidden;

  /** Advance the simulation by `dt` seconds and draw the result. */
  function simulate(dt: number) {
    elapsed += dt;

    // ── Pointer easing ───────────────────────────────────────────────────
    // Critically-damped-ish approach; fast enough to feel connected, slow
    // enough to avoid jitter when the hand is unsteady.
    const follow = reducedMotion ? 0.18 : 0.10;
    pointerSmooth.lerp(pointerTarget, 1 - Math.pow(1 - follow, dt * 60));

    const speed = pointerSmooth.distanceTo(pointerPrev) / Math.max(dt, 0.001);
    pointerPrev.copy(pointerSmooth);

    push += (pushTarget - push) * (1 - Math.pow(0.88, dt * 60));

    // ── Ripple emission ──────────────────────────────────────────────────
    // Speed-gated so a resting cursor does not machine-gun impulses, and rate
    // limited so a fast sweep lays down a readable wake rather than noise.
    const canRipple = !reducedMotion && pointerActive;
    if (canRipple && speed > 0.9 && elapsed - lastRippleAt > 0.075) {
      emitRipple(pointerSmooth, Math.min(1, speed * 0.22));
    }

    // ── Feed uniforms ────────────────────────────────────────────────────
    glassUniforms.uTime.value = elapsed;
    glassUniforms.uPointer.value.copy(pointerSmooth);
    glassUniforms.uPush.value = reducedMotion ? 0 : push;
    glassUniforms.uCameraPos.value.copy(camera.position);

    atmosphereUniforms.uTime.value = elapsed;
    atmosphereUniforms.uPointer.value.copy(pointerUv);

    // ── Camera drift ─────────────────────────────────────────────────────
    // Very small, very slow parallax. Enough to keep the frame alive without
    // the viewer feeling they are on a turntable.
    if (!reducedMotion) {
      const driftX = pointerSmooth.x * 0.10 + Math.sin(elapsed * 0.11) * 0.07;
      const driftY = pointerSmooth.y * 0.07 + Math.cos(elapsed * 0.083) * 0.05;
      camera.position.x += (driftX - camera.position.x) * (1 - Math.pow(0.97, dt * 60));
      camera.position.y += (driftY - camera.position.y) * (1 - Math.pow(0.97, dt * 60));
      camera.lookAt(0, 0, 0);

      // A barely-there breathing scale, combined with the compositional scale
      // rather than replacing it.
      const breathe = 1 + Math.sin(elapsed * 0.23) * 0.016;
      glass.scale.setScalar(layout.scale * breathe);
      glass.rotation.y = elapsed * 0.014;
      glass.rotation.x = Math.sin(elapsed * 0.07) * 0.06;
    }

    renderer.render(scene, camera);
  }

  function tick(now: number) {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    const deltaMs = now - clock.last;
    // Large delta after a tab switch: skip rather than fast-forward the waves.
    if (deltaMs > 400) {
      clock.last = now;
      return;
    }
    clock.last = now;

    if (!visible) return;
    if (document.hidden) return;

    // An unfocused but visible window (another app in front, an embedded
    // webview, an automated session) still has to animate. Drop the frame
    // rate rather than stopping the loop — gating on focus alone would freeze
    // the sculpture outright, which is both wrong and easy to miss.
    const unfocused = !document.hasFocus();
    if (unfocused && deltaMs < IDLE_FRAME_MS) return;

    simulate(Math.min(deltaMs, 64) / 1000);
  }

  // Render one frame immediately, before the loop starts.
  //
  // The loop deliberately stops while the page is hidden, which is correct for
  // power — but it means a visitor who lands with a hidden tab (a backgrounded
  // tab, an embedded webview, an automated session) would see an empty canvas
  // until the tab is first revealed. One frame costs nothing and removes that
  // failure mode.
  glassUniforms.uCameraPos.value.copy(camera.position);
  renderer.render(scene, camera);

  frame = requestAnimationFrame(tick);

  // ── Visibility ─────────────────────────────────────────────────────────
  function onVisibility() {
    visible = !document.hidden;
    if (!visible) {
      cancelAnimationFrame(frame);
    } else {
      clock.last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  // ── Cleanup ────────────────────────────────────────────────────────────
  function dispose() {
    running = false;
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("blur", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    glassGeometry.dispose();
    (glass.material as ShaderMaterial).dispose();
    atmosphereGeometry.dispose();
    (atmosphere.material as ShaderMaterial).dispose();
    renderer.dispose();
  }

  // Development-only diagnostic surface. Stripped from production builds, and
// the reason the interaction chain (pointer → uniforms → deformation) can be
// verified without a visible window.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__aegisGlass = {
    get push() {
      return push;
    },
    get engaged() {
      return engaged;
    },
    get pointer() {
      return pointerSmooth.toArray();
    },
    get ripples() {
      return Array.from(rippleStrength);
    },
    get time() {
      return elapsed;
    },
    get layout() {
      return { ...layout };
    },
    get canvasSize() {
      return { width: canvas.clientWidth, height: canvas.clientHeight };
    },
    /** Force one frame, so state can be captured while the page is hidden. */
    render() {
      glassUniforms.uCameraPos.value.copy(camera.position);
      renderer.render(scene, camera);
    },
    /** Advance the simulation by a fixed step, then draw. */
    step(seconds = 1 / 60) {
      simulate(seconds);
    },
  };
}

const runtime: GlassRuntime = {
    supported: true,
    setEngaged(value: boolean) {
      engaged = value;
    },
    dispose,
  };
  return runtime;
}