// ============================================================================
// Atmosphere — fullscreen background shader
//
// Deep charcoal with slow volumetric cloud structure, a cool key wash and a
// faint field of dust. Drawn as a single fullscreen triangle behind the glass.
// ============================================================================

import { NOISE, HASH } from "./common";

export const atmosphereVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

export const atmosphereFrag = /* glsl */ `
${NOISE}
${HASH}

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uPointer;   // normalised 0..1, for a gentle parallax wash
uniform float uIntensity;

varying vec2 vUv;

void main(){
  vec2 uv = vUv;
  vec2 p = (uv - 0.5);
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  float t = uTime * 0.028;

  // ── Base ───────────────────────────────────────────────────────────────
  // Near-black with a slight blue lift toward the top of the frame.
  vec3 col = mix(
    vec3(0.006, 0.008, 0.011),
    vec3(0.018, 0.023, 0.032),
    pow(clamp(uv.y, 0.0, 1.0), 1.8)
  );

  // ── Volumetric structure ───────────────────────────────────────────────
  // Domain-warped fbm reads as drifting cloud rather than flat noise.
  vec3 q = vec3(p * 1.15, t);
  vec3 warp = vec3(
    fbm(q + vec3(0.0, t * 1.6, 0.0), 3, 2.0, 0.5),
    fbm(q + vec3(5.2, 1.3, 0.0), 3, 2.0, 0.5),
    fbm(q + vec3(0.0, 0.0, 8.7), 2, 2.0, 0.5)
  );

  float clouds = fbm(q + warp * 1.25, 4, 2.05, 0.52);
  clouds = smoothstep(-0.35, 0.85, clouds);

  // Cool light wash, offset toward the upper left.
  vec2 washPos = vec2(-0.22, 0.30) + (uPointer - 0.5) * 0.10;
  float wash = exp(-dot(p - washPos, p - washPos) * 1.55);

  // Muted teal counter-wash, lower right.
  vec2 counterPos = vec2(0.38, -0.30);
  float counter = exp(-dot(p - counterPos, p - counterPos) * 2.6);

  col += vec3(0.030, 0.048, 0.072) * clouds * (0.16 + wash * 0.40);
  col += vec3(0.038, 0.058, 0.085) * wash * 0.28;
  col += vec3(0.012, 0.036, 0.034) * counter * 0.22;

  // ── Dust ───────────────────────────────────────────────────────────────
  // Very sparse, very dim, and round. A hashed grid with no falloff renders
  // as hard little squares rather than motes.
  vec2 grid = uv * uResolution / 3.0;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float present = step(0.9965, hash21(cell));
  float mote = present * exp(-dot(local, local) * 16.0);
  col += vec3(0.55, 0.68, 0.85) * mote * 0.30;

  // Vignette to hold the eye on the centre.
  float vig = 1.0 - smoothstep(0.35, 1.25, length(p));
  col *= mix(0.45, 1.0, vig);

  col *= uIntensity;

  gl_FragColor = vec4(col, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;