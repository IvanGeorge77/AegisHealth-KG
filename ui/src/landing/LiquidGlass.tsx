import { useEffect, useRef, useState } from "react";

import { createGlassRuntime } from "./glass-runtime";

/* ============================================================================
   LiquidGlass
   ----------------------------------------------------------------------------
   Mounts the WebGL runtime and exposes two pieces of state to the page:

     supported — false when WebGL is unavailable. The page swaps in a static
                 CSS gradient so the hero still looks composed rather than
                 broken. This is a real fallback, not a blank canvas.
     engaged   — true once the visitor has moved a pointer or touched the
                 surface. Drives the interaction hint, which fades out after
                 first contact rather than lingering over the art.

   Layering note: the canvas sits at z-0 and the page content at z-10. It must
   NOT be pushed to a negative z-index — a negative child paints behind its
   parent's own background, which silently hides the entire effect.

   `presence` lets the page fade the sculpture back as the reader scrolls into
   the content sections, where a full-strength form behind body copy would
   fight the text.

   The canvas is aria-hidden and pointer-events-none: the hero copy and the
   CTAs sit above it and must remain clickable and reachable by keyboard.
   ========================================================================= */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isLowPower(): boolean {
  if (typeof window === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse && cores <= 4;
}

export function LiquidGlass({ presence = 1 }: { presence?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtime = createGlassRuntime({
      canvas,
      reducedMotion: prefersReducedMotion(),
      lowPower: isLowPower(),
    });

    runtime.onEngage = () => setEngaged(true);
    setSupported(runtime.supported);

    return () => runtime.dispose();
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ease-[cubic-bezier(0.2,0,0,1)]"
      style={{ opacity: presence }}
      aria-hidden="true"
      data-testid="liquid-glass-root"
    >
      {supported ? (
        <canvas ref={canvasRef} className="block h-full w-full" />
      ) : (
        // WebGL unavailable: a composed still, so the hero degrades gracefully.
        <div className="h-full w-full bg-[radial-gradient(120%_90%_at_28%_18%,#16222b_0%,#0a0f14_45%,#05070a_100%)]" />
      )}

      {/* Scrim: keeps the headline legible wherever the glass deforms. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_48%,rgba(5,7,10,0.35)_0%,rgba(5,7,10,0.72)_100%)]" />
      {/* On narrow viewports the form sits directly behind the copy, so it
          needs a heavier scrim than the offset desktop composition does. */}
      <div className="pointer-events-none absolute inset-0 bg-[#05070a]/45 sm:hidden" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070a] to-transparent" />

      {engaged ? <span className="sr-only">Interactive surface engaged.</span> : null}
    </div>
  );
}