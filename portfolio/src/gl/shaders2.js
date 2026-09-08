// Act II — the stack, as a room.
//
// Four programs: the room itself, the cards, the signal ribbon that weaves
// through them, and the embers. The cards are drawn with a real projection
// matrix rather than by dividing coordinates in JS, so a card tilted away from
// camera has correctly foreshortened artwork instead of a texture that shears
// across the quad.

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
// The room: a dark volume with a floor, a far wall, and whatever light the
// ribbon head is currently throwing.

export const ROOM_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vS;
void main() {
  vS = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

export const ROOM_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uMat;      // the materialisation scalar, shared by everything
uniform vec3  uHead;     // ribbon head in screen space + its brightness
uniform vec2  uPar;
${LIB}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0);
  q -= uPar * vec2(0.030, 0.020);

  // the ground: a horizon low in the frame, with the floor catching light
  float horizon = 0.30;
  float floorMask = smoothstep(horizon + 0.02, horizon - 0.10, s.y);

  vec3 col = vec3(0.018, 0.013, 0.011);
  // the far wall breathes very slightly so the room is never a flat plate
  float wall = fbm3(q * 2.4 + vec2(uTime * 0.02, 0.0));
  col += vec3(0.052, 0.034, 0.023) * wall * (1.0 - floorMask) * 0.9;

  // the floor is wet: it reflects the room above it, compressed and dimmed
  vec2 refl = vec2(q.x, (horizon - s.y) * 1.9 + horizon);
  float fr = fbm3(refl * 3.1 + vec2(-uTime * 0.03, uTime * 0.05));
  col += vec3(0.082, 0.046, 0.024) * fr * floorMask;

  // the ribbon head lights the room it passes through
  vec2 h = (uHead.xy - s) * vec2(aspect, 1.0);
  float hd = length(h);
  col += EMBER * exp(-hd * hd * 26.0) * uHead.z * 0.55;
  col += AMBER * exp(-hd * hd * 90.0) * uHead.z * 0.40;
  // and streaks on the wet floor beneath it
  float streak = exp(-abs(h.x) * 7.0) * exp(-abs(s.y - horizon * 0.55) * 5.0);
  col += EMBER * streak * uHead.z * 0.30 * floorMask;

  // a slow vertical light bar, so the room reads as lit rather than painted
  col += AMBER * 0.030 * exp(-abs(q.x + 0.32) * 4.2) * uMat;

  vec2 d = (s - 0.5) * vec2(1.05, 1.0);
  col *= 1.0 - 0.80 * smoothstep(0.20, 0.86, dot(d, d) * 2.0);
  col += (hash21(s * 1024.0 + fract(uTime) * 91.0) - 0.5) * 0.030;

  oCol = vec4(max(col, 0.0) * uMat, 1.0);
}`;

// --------------------------------------------------------------------------
// One card.

export const CARD_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
uniform mat4 uMVP;
uniform mat4 uModel;
uniform vec2 uUV0;
uniform vec2 uUV1;
out vec2 vUV;
out vec2 vLocal;
out float vDepth;
void main() {
  vec2 p = aPos - 0.5;
  vec4 world = uModel * vec4(p, 0.0, 1.0);
  vUV = uUV0 + vec2(aPos.x, 1.0 - aPos.y) * uUV1;
  vLocal = aPos;
  vDepth = -world.z;
  gl_Position = uMVP * vec4(p, 0.0, 1.0);
}`;

export const CARD_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vLocal;
in float vDepth;
out vec4 oCol;
uniform sampler2D uArt;
uniform vec3  uTint;
uniform float uMat;      // 0..1, shared by every card: one event, not a queue
uniform float uHot;      // this card's own highlight (pointer / active)
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
uniform float uSeed;
${LIB}

void main() {
  vec4 art = texture(uArt, vUV);

  // the border: a hairline that catches the room's light
  vec2 e = min(vLocal, 1.0 - vLocal);
  float edge = min(e.x, e.y);
  float rim = 1.0 - smoothstep(0.0, 0.012, edge);
  float inner = smoothstep(0.010, 0.030, edge);

  vec3 col = art.rgb;
  col += uTint * rim * (0.55 + 1.30 * uHot);
  // a faint wash of the family tint across the plate
  col += uTint * 0.10 * inner * (0.35 + 0.85 * uHot);

  // the materialisation: each card resolves out of static, and only the noise
  // seed differs between them, so the deck arrives as one event
  float n = fbm3(vLocal * 7.0 + uSeed);
  float m = clamp((uMat * 1.34 - n * 0.92) / 0.24, 0.0, 1.0);
  // a bright leading edge rides the dissolve
  col += HOT * 0.85 * exp(-pow((uMat * 1.34 - n * 0.92) / 0.24 - 0.5, 2.0) * 9.0)
             * step(0.02, uMat) * step(uMat, 0.99);

  // depth fog: the back of the room recedes rather than staying crisp
  float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  float a = art.a * m * mix(0.18, 1.0, fog);
  col *= mix(0.45, 1.0, fog);

  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// The signal ribbon. A parametric head travels the room and the strip is
// rebuilt every frame from the last few seconds of where it has been, so the
// trail is a light-painting rather than a shape.

export const RIBBON_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aMeta;   // x: age 0..1 (0 = head), y: side -1..1
uniform mat4 uMVP;
out float vAge;
out float vSide;
void main() {
  vAge = aMeta.x;
  vSide = aMeta.y;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

export const RIBBON_FRAG = `#version 300 es
precision highp float;
in float vAge;
in float vSide;
out vec4 oCol;
uniform float uMat;
${LIB}

void main() {
  // the strip is brightest along its spine and cools as it ages:
  // white at the head, amber through the body, deep ember at the tail
  float core = 1.0 - abs(vSide);
  float body = pow(core, 1.7);
  float spine = pow(core, 9.0);

  float life = 1.0 - vAge;
  vec3 col = EMBER * body * 0.55;
  col += AMBER * body * pow(life, 1.3) * 0.95;
  col += HOT * spine * pow(life, 2.8) * 1.60;

  float a = body * pow(life, 1.15) * 1.00 * uMat;
  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// Embers.

export const EMBER_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aMeta;   // x: seed, y: size
uniform mat4 uMVP;
uniform float uTime;
uniform float uPx;                    // device pixels per unit at z = 1
uniform vec3 uHead;                   // head in world space, for the flare
out float vGlow;
out float vSeed;
void main() {
  float s = aMeta.x;
  vec3 p = aPos;
  // a slow convection drift, different per ember
  p.x += sin(uTime * (0.16 + s * 0.24) + s * 41.0) * 0.13;
  p.y += cos(uTime * (0.12 + s * 0.19) + s * 17.0) * 0.10
       + fract(uTime * 0.014 + s) * 0.55 - 0.27;

  vec4 clip = uMVP * vec4(p, 1.0);
  gl_Position = clip;
  gl_PointSize = max(1.0, aMeta.y * uPx / max(clip.w, 0.05));

  // embers near the ribbon head flare
  float d = length(p - uHead);
  vGlow = (0.30 + 0.70 * pow(0.5 + 0.5 * sin(uTime * (1.4 + s * 2.2) + s * 29.0), 2.0))
        * (1.0 + 2.4 * exp(-d * d * 1.6));
  vSeed = s;
}`;

export const EMBER_FRAG = `#version 300 es
precision highp float;
in float vGlow;
in float vSeed;
out vec4 oCol;
uniform float uMat;
${LIB}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d) * 4.0;
  float f = exp(-r * 3.4);
  vec3 col = mix(EMBER, HOT, clamp(vGlow * 0.45, 0.0, 1.0));
  float a = f * clamp(vGlow, 0.0, 2.0) * 0.42 * uMat;
  oCol = vec4(col * a, a);
}`;
