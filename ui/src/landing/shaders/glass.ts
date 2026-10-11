// ============================================================================
// Liquid glass — vertex shader
//
// Deformation is the sum of three fields, evaluated in object space so the
// motion stays coherent when the camera drifts:
//
//   1. Slow domain-warped noise  — the autonomous "living" morph
//   2. Pointer push              — a local bulge that follows the cursor
//   3. Ripple impulses           — travelling waves left behind by fast motion
//
// Displacement is applied along the surface normal, then the position is
// projected so the silhouette stays roughly spherical. Normals are re-derived
// in the fragment shader from screen-space derivatives, which is both cheaper
// and more accurate on a deforming mesh.
// ============================================================================

import { NOISE, HASH } from "./common";

export const glassVert = /* glsl */ `
${NOISE}

uniform float uTime;
uniform float uMorph;        // global amplitude of the idle morph
uniform float uDetail;       // amplitude of the high-frequency molten detail
uniform vec3  uPointer;      // pointer direction on the unit sphere
uniform float uPush;         // 0..1 local bulge under the cursor
uniform float uRipple[8];    // per-impulse strength
uniform float uRippleAt[8];  // per-impulse birth time
uniform vec2  uRippleDir[8]; // per-impulse direction on the unit sphere

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;    // smooth, computed per-vertex and interpolated
varying float vHeight;

// Travelling wave from a single impulse origin.
float ripple(vec3 dir, vec2 origin, float age){
  if (age <= 0.0 || age > 4.5) return 0.0;
  float d = distance(dir.xy, origin);
  float speed = 0.55;
  float front = age * speed;
  // Gaussian envelope travelling outward from the origin.
  float env = exp(-pow((d - front) * 3.2, 2.0));
  float decay = exp(-age * 1.05);
  return sin((d - front) * 9.0) * env * decay;
}

// ── Displacement fields ─────────────────────────────────────────────────
// Split so the normal estimate below can sample the cheap, high-frequency part
// at full quality while approximating the expensive low-frequency morph. A
// gradient is dominated by its higher frequencies, so the approximation is
// visually free and keeps the vertex shader affordable.

float morphAt(vec3 dir, float t){
  vec3 wp = dir * 1.35 + vec3(0.0, 0.0, t * 0.085);
  vec3 warp = vec3(
    fbm(wp + vec3(11.3, 0.0, 0.0), 3, 2.0, 0.5),
    fbm(wp + vec3(0.0, 7.7, 0.0), 3, 2.0, 0.5),
    fbm(wp + vec3(0.0, 0.0, 3.1), 3, 2.0, 0.5)
  );
  float n1 = fbm(wp + warp * 0.85, 4, 2.0, 0.5);
  float n2 = fbm(dir * 3.1 - vec3(t * 0.12), 3, 2.0, 0.5);
  return n1 * 0.62 + n2 * 0.22;
}

// Mid band that flows, not a fine band that crinkles. Frequency and amplitude
// here are amplified into lighting, so pushing them too far turns liquid glass
// into faceted mineral.
float detailAt(vec3 dir, float t){
  float detail = fbm(dir * 3.4 + vec3(0.0, 0.0, t * 0.26), 3, 2.1, 0.55);
  float micro  = fbm(dir * 7.2 - vec3(t * 0.34), 2, 2.0, 0.5);
  return detail * 0.34 + micro * 0.08;
}

float pointerPush(vec3 dir){
  float pd = distance(dir, normalize(uPointer));
  return exp(-pd * pd * 9.0);
}

float rippleAt(vec3 dir, float t){
  float field = 0.0;
  for (int i = 0; i < 8; i++) {
    float strength = uRipple[i];
    // Skip empty slots: normalising a zero vector is undefined.
    if (strength <= 0.0) continue;

    float age = t - uRippleAt[i];
    float r = ripple(dir, uRippleDir[i], age);

    // The impulse is stored as a 2D direction on the z = 0 plane; lift it back
    // into 3D so it can be tested against the surface direction.
    vec3 rippleNormal = normalize(vec3(uRippleDir[i], 0.0));

    // Restrict each impulse to its own hemisphere so waves do not bleed
    // through the back of the sphere.
    float facing = smoothstep(-0.35, 0.55, dot(dir, rippleNormal));
    field += r * strength * facing;
  }
  return field;
}

// Total displacement along the surface normal.
float displacementAt(vec3 dir, float t, float morphQuality){
  float morph = morphQuality > 0.5 ? morphAt(dir, t) : fbm(dir * 1.35 + vec3(0.0, 0.0, t * 0.085), 2, 2.0, 0.5);
  return morph * uMorph + detailAt(dir, t) * uDetail + pointerPush(dir) * uPush * 0.34 + rippleAt(dir, t) * 0.19;
}

// Builds the surface point for a direction at a given displacement.
vec3 surfacePoint(vec3 dir, float disp){
  vec3 p = normalize(dir + dir * disp);
  return p * (1.0 + disp);
}

void main(){
  vec3 dir = normalize(position);
  float t = uTime;

  float disp = displacementAt(dir, t, 1.0);

  vHeight = morphAt(dir, t);

  // ── Smooth normal ──────────────────────────────────────────────────────
  // Estimated here by finite differences and interpolated across each
  // triangle. Deriving it in the fragment shader from dFdx/dFdy instead gives
  // one flat normal per triangle, which renders the whole form as visible
  // facets. Two extra cheap samples buy a genuinely smooth surface.
  const float eps = 0.055;

  // Tangent basis around the surface direction.
  vec3 helper = abs(dir.y) < 0.94 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent  = normalize(cross(helper, dir));
  vec3 bitan = normalize(cross(dir, tangent));

  vec3 dirA = normalize(dir + tangent * eps);
  vec3 dirB = normalize(dir + bitan * eps);

  vec3 pO = surfacePoint(dir, disp);
  vec3 pA = surfacePoint(dirA, displacementAt(dirA, t, 0.0));
  vec3 pB = surfacePoint(dirB, displacementAt(dirB, t, 0.0));

  vNormal = normalize(cross(pA - pO, pB - pO));
  // Degenerate when the offsets cancel; fall back to the sphere normal.
  if (any(isnan(vNormal)) || dot(vNormal, dir) < 0.0) vNormal = dir;

  // Partial re-projection onto the sphere. A full projection would erase the
  // silhouette entirely and leave a perfect ball; this tames spikes while
  // keeping the form recognisably a body of liquid rather than a shell.
  vec3 displaced = position + normal * disp;
  vec3 reprojected = mix(displaced, normalize(displaced) * length(position), 0.42);

  vec4 worldPos = modelMatrix * vec4(reprojected, 1.0);
  vec4 viewPos  = viewMatrix * worldPos;

  vObjPos  = displaced;
  vWorldPos = worldPos.xyz;
  vViewPos = viewPos.xyz;

  gl_Position = projectionMatrix * viewPos;
}
`;

// ============================================================================
// Liquid glass — fragment shader
//
// No textures and no ray tracing. The environment is evaluated procedurally
// from the reflection vector, which is what gives the surface its "studio"
// look: a large soft key light, a cool fill, and a warm rim.
//
// Layers, in order of visual weight:
//   fresnel rim  →  procedural env reflection  →  specular  →  thin-film
//   iridescence  →  internal absorption tint
// ============================================================================

export const glassFrag = /* glsl */ `
${NOISE}
${HASH}

uniform float uTime;
uniform vec3  uCameraPos;
uniform vec3  uPointer;
uniform float uPush;
uniform vec3  uKeyDir;      // key light direction
uniform float uIridescence;
uniform float uOpacity;

varying vec3 vObjPos;
varying vec3 vWorldPos;
varying vec3 vViewPos;
varying vec3 vNormal;
varying float vHeight;

// ── Procedural environment ───────────────────────────────────────────────
// Radiance for a reflection vector. Built from a few directional lobes of
// differing tightness rather than a smooth gradient — a studio is mostly
// small hard sources against darkness, and that contrast is what makes a
// surface read as reflective rather than as fog.
vec3 environment(vec3 rd){
  float up = rd.y * 0.5 + 0.5;

  // Base: cool charcoal, darker toward the floor.
  vec3 col = mix(vec3(0.008, 0.011, 0.016), vec3(0.040, 0.055, 0.078), pow(up, 1.5));

  // Key light: a broad softbox plus a tight core inside it. The two-lobe
  // structure gives a highlight with an edge, which is what sells glass.
  float k = max(dot(rd, uKeyDir), 0.0);
  col += vec3(0.72, 0.80, 0.92) * pow(k, 3.0) * 0.42;
  col += vec3(1.00, 0.99, 0.97) * pow(k, 56.0) * 1.35;

  // Cool rim from behind right — separates the silhouette from the background.
  float rim = max(dot(rd, vec3(-0.80, 0.12, -0.60)), 0.0);
  col += vec3(0.34, 0.64, 1.00) * pow(rim, 16.0) * 0.85;

  // A second, dimmer cool source keeps the far side from going dead.
  float fill = max(dot(rd, vec3(0.25, 0.85, -0.45)), 0.0);
  col += vec3(0.28, 0.52, 0.80) * pow(fill, 22.0) * 0.45;

  // Muted teal bounce from below — stops the palette going monochrome.
  float bounce = max(dot(rd, vec3(0.50, -0.62, 0.40)), 0.0);
  col += vec3(0.06, 0.30, 0.28) * pow(bounce, 6.0) * 0.55;

  // Faint horizon strip.
  col += vec3(0.26, 0.36, 0.48) * exp(-pow((rd.y - 0.05) * 9.0, 2.0)) * 0.09;

  return col;
}

// Thin-film interference approximation. Shifts hue with the optical path
// length implied by fresnel, which gives the edges their violet-cyan
// iridescence without a texture.
vec3 iridescence(float fres){
  float phase = fres * 7.0 + uTime * 0.08 + vHeight * 0.6;
  return 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
}

void main(){
  // Smooth normal, estimated per-vertex and interpolated across the triangle.
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);

  // The mesh is single-sided; guard against the normal inverting as the form
  // folds through itself.
  if (dot(N, V) < 0.0) N = -N;

  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 5.0);

  vec3 R = reflect(-V, N);
  vec3 env = environment(R);

  // ── Reflection ─────────────────────────────────────────────────────────
  // Fresnel-weighted: glancing angles mirror the environment, the face-on
  // centre stays open so the headline remains readable through it.
  vec3 reflection = env * (0.16 + 0.95 * fres);

  // ── Iridescence ────────────────────────────────────────────────────────
  float iridMask = smoothstep(0.10, 0.85, fres) * uIridescence;
  reflection += iridescence(fres) * iridMask * 0.22;

  // ── Specular ───────────────────────────────────────────────────────────
  // Kept restrained. Hot, narrow speculars on every ripple turn liquid into
  // chrome; glass is mostly reflection with a few glints, not the reverse.
  vec3 H = normalize(uKeyDir + V);
  float ndh = max(dot(N, H), 0.0);
  vec3 specular = vec3(1.0) * pow(ndh, 32.0) * 0.62
                + vec3(0.72, 0.86, 1.0) * pow(ndh, 8.0) * 0.16;

  // ── Body ───────────────────────────────────────────────────────────────
  // A little internal scatter so the form has volume instead of being a shell.
  float thickness = 0.5 + 0.5 * vHeight;
  vec3 body = mix(vec3(0.016, 0.028, 0.040), vec3(0.05, 0.11, 0.15), thickness);

  // ── Fresnel edge ───────────────────────────────────────────────────────
  // The wet rim that reads as glass — present, but not a hard white outline.
  vec3 edge = mix(vec3(0.38, 0.56, 0.80), vec3(1.0), fres) * pow(fres, 0.65) * 0.52;

  vec3 col = reflection + body + edge + specular;

  // ── Alpha ──────────────────────────────────────────────────────────────
  // Edges nearly solid, centre genuinely open — the form should read as
  // translucent, letting the atmosphere show through its middle.
  float alpha = mix(0.16, 0.86, pow(fres, 0.55));
  alpha = min(1.0, alpha + uPush * 0.10);
  alpha *= uOpacity;

  gl_FragColor = vec4(col, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;