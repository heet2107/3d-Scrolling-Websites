// Act IV — the deck of screens, and the wet floor under it.
//
// Five programs, drawn in this order every frame: the room, the plates'
// reflections, the haze that sits them into the floor, the plates themselves,
// the dust in the air, and a final grain-and-vignette pass over everything.
// The order is the whole trick — the depth test is off, so what is drawn last
// is what is in front, and the reflections have to be laid down BEFORE the
// haze or they read as decals stuck on top of the ground rather than as light
// coming back out of it.

const LIB = `
const vec3 EMBER = vec3(0.910, 0.333, 0.000);
const vec3 AMBER = vec3(0.969, 0.576, 0.118);
const vec3 HOT   = vec3(1.000, 0.886, 0.720);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
             mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}
`;

// --------------------------------------------------------------------------
// Full-screen passes share one vertex shader.

export const SCREEN_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vS;
void main() {
  vS = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

// --------------------------------------------------------------------------
// The room. A dark volume with a hard floor, lit from above and in front by
// whichever plate currently holds the frame.

export const ROOM_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uMat;
uniform vec3  uPool;      // active plate's foot in screen space, + its energy
uniform vec3  uTint;      // the active plate's own colour, so the room agrees
uniform float uHorizon;   // where the floor plane vanishes, in 0..1 screen y
${LIB}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0);

  // the floor is a real plane in the deck's world, so the room's idea of where
  // it starts is handed in rather than guessed — otherwise the reflections
  // begin somewhere the painted ground does not
  float ground = smoothstep(uHorizon + 0.015, uHorizon - 0.025, s.y);

  vec3 col = vec3(0.010, 0.008, 0.007);

  // the far wall: a slow breathing haze, brightest behind the deck
  float wall = fbm3(q * 1.9 + vec2(uTime * 0.017, uTime * 0.008));
  col += vec3(0.030, 0.020, 0.014) * wall * (1.0 - ground);
  col += uTint * 0.020 * exp(-abs(q.x - (uPool.x - 0.5) * aspect) * 1.6)
       * (1.0 - ground) * smoothstep(-0.1, 0.55, s.y - uHorizon);

  // the light overhead that the deck travels under
  float cone = exp(-pow((q.x - (uPool.x - 0.5) * aspect) / 0.62, 2.0))
             * smoothstep(1.05, 0.30, s.y);
  col += uTint * cone * 0.030 * (1.0 - ground);

  // the ground itself: dark, polished, and darker the further back it goes
  float depth = smoothstep(uHorizon, uHorizon - 0.42, s.y);
  col += vec3(0.016, 0.011, 0.008) * ground * (0.25 + 0.75 * depth);
  // long vertical smears: a wet floor carries the room down into itself
  float smear = fbm3(vec2(q.x * 5.5, (uHorizon - s.y) * 1.4 + uTime * 0.05));
  col += uTint * 0.030 * ground * depth * smear;

  // the pool of light the active plate throws on the ground beneath it
  vec2 pd = (s - uPool.xy) * vec2(aspect, 1.0);
  float pool = exp(-pd.x * pd.x * 2.2) * exp(-abs(pd.y) * 4.6);
  col += uTint * pool * uPool.z * 0.22 * ground;
  col += AMBER * exp(-dot(pd, pd) * 4.0) * uPool.z * 0.075;

  oCol = vec4(max(col, 0.0) * uMat, 1.0);
}`;

// --------------------------------------------------------------------------
// The haze. Drawn between the reflections and the plates so the bottom of a
// reflection dissolves into the floor instead of ending on a hard edge.

export const HAZE_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uMat;
uniform vec3  uPool;
uniform vec3  uTint;
uniform float uHorizon;
${LIB}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0);

  float ground = smoothstep(uHorizon + 0.02, uHorizon - 0.03, s.y);

  // mist lying on the floor, thickest right at the waterline
  float band = exp(-pow((s.y - uHorizon + 0.055) / 0.085, 2.0));
  float roll = fbm3(vec2(q.x * 2.6 - uTime * 0.05, s.y * 7.0 + uTime * 0.09));
  vec3 col = mix(vec3(0.030, 0.020, 0.014), uTint * 0.055, 0.5)
           * band * (0.45 + 0.85 * roll);

  // ripples travelling across the reflection, so it never sits still
  float rip = sin((uHorizon - s.y) * 90.0 - uTime * 1.7 + q.x * 5.0) * 0.5 + 0.5;
  col += uTint * 0.016 * ground * rip
       * smoothstep(uHorizon, uHorizon - 0.30, s.y);

  vec2 pd = (s - uPool.xy) * vec2(aspect, 1.0);
  col += uTint * exp(-pd.x * pd.x * 1.4) * exp(-abs(pd.y) * 3.2)
       * uPool.z * 0.10 * ground;

  float a = clamp(band * 0.55 + ground * 0.10, 0.0, 1.0) * uMat;
  oCol = vec4(col * uMat, a * 0.30);
}`;

// --------------------------------------------------------------------------
// One plate. The same program draws its reflection: the model matrix is
// pre-multiplied by a mirror about the floor plane, which flips the geometry
// and therefore the artwork for free, and uMirror then only has to say how the
// water treats it.

export const PLATE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
uniform mat4 uMVP;
uniform mat4 uModel;
uniform vec2 uUV0;
uniform vec2 uUV1;
out vec2 vUV;
out vec2 vLocal;
out vec3 vWorld;
out float vDepth;
void main() {
  vec2 p = aPos - 0.5;
  vec4 world = uModel * vec4(p, 0.0, 1.0);
  vUV = uUV0 + vec2(aPos.x, 1.0 - aPos.y) * uUV1;
  vLocal = aPos;
  vWorld = world.xyz;
  vDepth = -world.z;
  gl_Position = uMVP * vec4(p, 0.0, 1.0);
}`;

export const PLATE_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vLocal;
in vec3 vWorld;
in float vDepth;
out vec4 oCol;
uniform sampler2D uArt;
uniform vec2  uUV0;
uniform vec2  uUV1;
uniform vec2  uTexel;
uniform vec3  uTint;
uniform float uFocus;     // 1 on the plate the visitor is looking at
uniform float uBlur;      // defocus radius, in texels
uniform float uMirror;    // 1 while drawing this plate's reflection
uniform float uAlpha;
uniform float uMat;
uniform float uTime;
uniform float uSeed;
uniform float uFogNear;
uniform float uFogFar;
${LIB}

vec4 tapArt(vec2 uv) {
  // the plates share one atlas, so a blur tap that wanders off this tile lands
  // in the neighbouring project — every tap is clamped to its own rectangle
  vec2 lo = uUV0 + uTexel;
  vec2 hi = uUV0 + uUV1 - uTexel;
  return texture(uArt, clamp(uv, lo, hi));
}

vec4 sampleArt(vec2 uv, float rad) {
  vec4 s = tapArt(uv);
  // the defocus is also the deck's antialiasing: the far plates are minified
  // four or five to one, and an atlas cannot carry mipmaps without bleeding
  // one project's pixels into the next, so the blur is what stops them
  // shimmering as the deck travels
  if (rad < 0.4) return s;
  // taps on a golden-angle spiral: a fixed cross or box kernel leaves a
  // directional smear that reads as motion blur rather than as depth of field
  float w = 1.0;
  for (int i = 0; i < 10; i++) {
    float f = float(i);
    float a = f * 2.39996 + uSeed;
    float rr = rad * sqrt((f + 0.5) / 10.0);
    s += tapArt(uv + vec2(cos(a), sin(a)) * uTexel * rr);
    w += 1.0;
  }
  return s / w;
}

void main() {
  vec2 uv = vUV;
  float mir = uMirror;

  // the reflection is not a copy: the water it lies in is moving
  float below = vLocal.y;                 // 0 at the waterline, 1 furthest in
  if (mir > 0.5) {
    float rip = sin(below * 26.0 - uTime * 1.5 + vWorld.x * 3.0) * 0.0055
              + sin(below * 61.0 + uTime * 0.85 + vWorld.x * 7.0) * 0.0026;
    uv.x += rip * (0.30 + below * 1.9) * uUV1.x;
    uv.y += rip * 0.4 * uUV1.y;
  }

  vec4 art = sampleArt(uv, uBlur + mir * 2.2);
  vec3 col = art.rgb;

  // the panel's own edge, catching the room
  vec2 e = min(vLocal, 1.0 - vLocal);
  float edge = min(e.x, e.y);
  float rim = 1.0 - smoothstep(0.0, 0.009, edge);
  col += uTint * rim * (0.22 + 0.62 * uFocus) * (1.0 - mir * 0.85);

  // a sheen across the glass, brightest where the overhead light would fall
  col += HOT * 0.030 * uFocus
       * smoothstep(0.35, 1.0, vLocal.y + vLocal.x * 0.4);

  // the deck falls away in brightness as well as in focus — a defocused plate
  // that stayed at full brightness competes with the one in front of it
  col *= mix(0.38, 1.0, uFocus);

  float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  col *= mix(0.30, 1.0, fog);

  float a = art.a * uAlpha * uMat * mix(0.16, 1.0, fog);
  if (mir > 0.5) {
    // the floor keeps very little, and keeps less the further down it goes.
    // The plates are nearly black, so a straight dimmed copy reflects almost
    // nothing — what a wet floor actually returns is the BRIGHT parts, so the
    // image is lifted and washed with the plate's own colour before it is cut.
    float fade = pow(clamp(1.0 - below, 0.0, 1.0), 2.6);
    float broken = 0.62 + 0.38 * fbm3(vec2(vWorld.x * 3.0, below * 9.0 - uTime * 0.4));
    float lum = dot(col, vec3(0.34, 0.5, 0.16));
    col = col * 0.85 + uTint * (0.02 + lum * 0.30);
    a *= fade * broken * 0.40;
  }

  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// Dust. Not embers this time — this room is colder, and what hangs in it is
// lit by the deck rather than burning on its own.

export const DUST_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aMeta;   // x: seed, y: size
uniform mat4 uMVP;
uniform float uTime;
uniform float uPx;
uniform float uSpan;                  // how deep the room currently is
out float vGlow;
void main() {
  float s = aMeta.x;
  vec3 p = aPos;
  p.x += sin(uTime * (0.11 + s * 0.17) + s * 37.0) * 0.22;
  p.y += cos(uTime * (0.09 + s * 0.13) + s * 19.0) * 0.16;
  // the field is authored in a unit box and stretched to whatever depth the
  // current viewport needs, so a phone is not looking at a wall of dust
  p.x *= uSpan; p.y *= uSpan * 0.6; p.z *= uSpan;

  vec4 clip = uMVP * vec4(p, 1.0);
  gl_Position = clip;
  gl_PointSize = max(1.0, aMeta.y * uPx / max(clip.w, 0.05));
  vGlow = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.8 + s * 1.6) + s * 23.0), 2.0);
}`;

export const DUST_FRAG = `#version 300 es
precision highp float;
in float vGlow;
out vec4 oCol;
uniform float uMat;
uniform vec3 uTint;
${LIB}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 4.0 * 3.6);
  vec3 col = mix(uTint, HOT, vGlow * 0.4);
  float a = f * vGlow * 0.20 * uMat;
  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// Grain and vignette, in one pass over the finished frame.
//
// With premultiplied blending, colour 0 and alpha a multiplies what is already
// there by (1-a) — so a single output can darken the corners AND add grain,
// which is why this is one pass and not two.

export const GRAIN_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uMat;
${LIB}

void main() {
  vec2 s = vS;
  vec2 d = (s - 0.5) * vec2(1.06, 1.0);
  float vig = 0.72 * smoothstep(0.16, 0.92, dot(d, d) * 2.0);
  float g = (hash21(s * uRes * 0.5 + fract(uTime) * 137.0) - 0.5) * 0.045;
  oCol = vec4(vec3(max(g, 0.0)), clamp(vig * uMat - min(g, 0.0), 0.0, 1.0));
}`;
