// Act VI — the closing frame.
//
// The bookend to the opening, and deliberately its negative. Act I builds the
// wordmark OUT of the light: the signal field runs inside the letterforms and
// the room around them stays black. Here the light is behind the name — an
// ember bed that gathers as the visitor reaches the bottom of the page — and
// the letters are the shape it is knocked out of. Same material, same amber on
// black, the opposite relationship between type and fire.
//
// Four programs: the plate (haze, bed, core, rake), the ember field that
// collects into it, the wordmark stencil, and grain over the lot.

export const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;      // unit quad, 0..1
uniform vec4 uRect;                     // x, y, w, h in clip space
uniform vec2 uUV0;
uniform vec2 uUV1;
out vec2 vUV;
out vec2 vScreen;                       // 0..1 across the viewport, y up
void main() {
  vec2 p = uRect.xy + aPos * uRect.zw;
  // v=0 is the TOP of the atlas but aPos.y=0 is the BOTTOM of the rect in clip
  // space, so v is flipped here — without it the mark renders upside down and
  // only the symmetric letters hide it
  vUV = uUV0 + vec2(aPos.x, 1.0 - aPos.y) * uUV1;
  vScreen = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// --------------------------------------------------------------------------
// The shared library.
//
// Same palette and the same noise as the opening, because the two frames have
// to be recognisably the same film. What differs is `calm`: Act I's field
// STREAMS — bands of tokens running left to right with node heads firing on
// top of them. This one only drifts. It is the same material after the work is
// finished, and a frame that still ran would read as another act starting.

const LIB = `
const vec3 EMBER = vec3(0.910, 0.333, 0.000);   // #e85500
const vec3 AMBER = vec3(0.969, 0.576, 0.118);   // #f7931e
const vec3 HOT   = vec3(1.000, 0.886, 0.720);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
             u.y);
}

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

/** The field at rest: warped, slow, and with nothing travelling through it. */
float calm(vec2 q, float t) {
  vec2 w = vec2(fbm3(q * 1.05 + vec2(t * 0.030, 0.0)),
                fbm3(q * 1.05 + vec2(5.9, -t * 0.023)));
  vec2 p = q + (w - 0.5) * 0.62;
  float base = fbm3(p * 1.85 - vec2(0.0, t * 0.018));
  return smoothstep(0.40, 0.88, base);
}

float vignette(vec2 s, float amount) {
  vec2 d = (s - 0.5) * vec2(1.06, 1.0);
  return 1.0 - amount * smoothstep(0.22, 0.88, dot(d, d) * 2.0);
}

float grain(vec2 s, float t) {
  return hash21(s * 1024.0 + fract(t) * 173.0) - 0.5;
}
`;

// --------------------------------------------------------------------------
// The plate: the room the last frame is lit in.

export const PLATE_FRAG = `#version 300 es
precision highp float;
in vec2 vScreen;
out vec4 oCol;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uCore;     // where the field collects, 0..1 screen, y up
uniform vec2  uBand;     // the backlight behind the mark: centre y, falloff
uniform float uGather;
uniform float uGrain;
${LIB}

void main() {
  vec2 s = vScreen;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0) * 2.0;

  // the room is never fully out: five acts of work are still smouldering in it
  float haze = calm(q * 0.80, uTime);
  vec3 col = EMBER * haze * (0.013 + 0.020 * uGather);

  // never let the bed go completely dark — a visitor who stops half way up
  // the section should still see a frame, not a black rectangle with copy
  float lift = 0.17 + 0.83 * uGather;

  // the bed the wordmark stands in: a wide warm band lying along the mark's
  // own line, brightest under the core and still burning where the letters
  // run out of frame, so the whole name has something to be a silhouette in
  float band = exp(-pow((s.y - uBand.x) * uBand.y, 2.0));
  float across = 0.12 + 0.88 * exp(-pow((s.x - 0.5) * 1.85, 2.0));
  float bed = band * across * lift;
  col += EMBER * bed * 0.21;
  col += AMBER * bed * bed * 0.11;
  col += HOT * pow(bed, 3.2) * 0.06;

  // the core the embers fall into
  vec2 e = (s - uCore) * vec2(aspect, 1.0);
  float d2 = dot(e, e);
  col += EMBER * exp(-d2 * 17.0)  * lift * 0.14;
  col += AMBER * exp(-d2 * 62.0)  * lift * 0.10;
  col += HOT   * exp(-d2 * 260.0) * lift * 0.09;

  // the anamorphic rake: wide in x, tight in y. It is the one flourish that
  // says PROJECTOR rather than web page, and it is tied to the gather alone so
  // that reaching the bottom of the page is what brings the last light up
  float rake = exp(-abs(e.x) * 1.75) * exp(-abs(e.y) * 54.0);
  col += mix(AMBER, HOT, 0.45) * rake * uGather * 0.15;

  col *= vignette(s, 0.92);
  col += grain(s, uTime) * uGrain;

  oCol = vec4(max(col, 0.0), 1.0);
}`;

// --------------------------------------------------------------------------
// The ember field.
//
// Positions are static attributes and the gather happens entirely in the
// vertex shader, so the whole collapse costs one uniform per frame instead of
// nine hundred JS-side integrations.

export const EMBER_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aHome;   // scattered rest position, -1..1 square
layout(location = 1) in vec4 aMeta;   // seed, size, swirl, gathered radius
uniform vec2  uRes;
uniform vec2  uCore;                  // 0..1 screen, y up
uniform float uTime;
uniform float uGather;
uniform float uPx;                    // device pixels per unit of aspect space
out float vGlow;

void main() {
  float aspect = uRes.x / uRes.y;
  float s = aMeta.x;

  // aspect space: y spans -1..1 and x is stretched to the viewport, so the
  // same scatter fills a phone and an ultrawide without regenerating it
  vec2 core = (uCore - 0.5) * 2.0 * vec2(aspect, 1.0);
  vec2 home = aHome * vec2(aspect, 1.0);
  home += vec2(sin(uTime * (0.10 + s * 0.17) + s * 37.0) * 0.10,
               cos(uTime * (0.08 + s * 0.13) + s * 11.0) * 0.08);

  // POLAR interpolation toward the core, not linear. Sparks fall into a fire
  // on a curve; a straight lerp to a point reads as a mesh being collapsed by
  // a machine, which is the one thing this frame must not look like.
  vec2 rel = home - core;
  float r0 = length(rel);
  float a0 = atan(rel.y, rel.x);
  float g = uGather;
  float r1 = aMeta.w * (1.0 + 0.10 * sin(uTime * (0.45 + s * 0.9) + s * 23.0));
  float r = mix(r0, r1, g);
  float an = a0 + aMeta.z * g;
  vec2 p = core + vec2(cos(an), sin(an)) * r;

  gl_Position = vec4(p / vec2(aspect, 1.0), 0.0, 1.0);
  gl_PointSize = max(1.0, aMeta.y * uPx * (0.62 + 0.78 * g));

  // an ember brightens as it arrives: the field is dim while it is adrift and
  // hot once it has collected, which is the whole point of the movement
  float beat = 0.5 + 0.5 * sin(uTime * (0.7 + s * 1.9) + s * 29.0);
  vGlow = (0.30 + 0.70 * beat * beat) * (0.26 + 1.10 * g);
}`;

export const EMBER_FRAG = `#version 300 es
precision highp float;
in float vGlow;
out vec4 oCol;
${LIB}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 4.0 * 3.2);
  vec3 col = mix(EMBER, HOT, clamp(vGlow * 0.42, 0.0, 1.0));
  float a = f * clamp(vGlow, 0.0, 1.6) * 0.50;
  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// The wordmark, as a stencil.

export const MARK_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vScreen;
out vec4 oCol;

uniform sampler2D uWord;   // coverage atlas, alpha in .a
uniform vec2  uTexel;      // 1 / atlas size
uniform float uRing;       // halo radius, in atlas texels
uniform float uOpacity;
uniform float uLit;
${LIB}

void main() {
  float cov = texture(uWord, vUV).a;

  // Eight taps on a ring, minus the glyph itself, is the band of light hugging
  // the outside of every stroke. It cannot come from fwidth: a coverage bitmap
  // goes 0 to 1 across a single texel, so a derivative-based outline is a
  // hairline at any size no matter what width it is asked for.
  vec2 r = uTexel * uRing;
  float b = texture(uWord, vUV + vec2( r.x, 0.0)).a
          + texture(uWord, vUV + vec2(-r.x, 0.0)).a
          + texture(uWord, vUV + vec2(0.0,  r.y)).a
          + texture(uWord, vUV + vec2(0.0, -r.y)).a
          + texture(uWord, vUV + r * 0.72).a
          + texture(uWord, vUV - r * 0.72).a
          + texture(uWord, vUV + vec2(r.x, -r.y) * 0.72).a
          + texture(uWord, vUV + vec2(-r.x, r.y) * 0.72).a;
  float halo = max(b * 0.125 - cov, 0.0);
  if (cov + halo < 0.004) discard;

  // The face is a warm graphite rather than pure black so the name is still
  // faintly there before the bed comes up; over the lit bed the same value
  // reads as a hard silhouette, which is the whole trick of this frame.
  vec3 face = vec3(0.030, 0.021, 0.015) + EMBER * 0.050 * uLit;
  float a = cov * uOpacity;

  // the spill around each stroke carries no alpha of its own, so it adds light
  // to whatever is behind instead of punching another hole in it
  vec3 col = face * a
           + mix(AMBER, HOT, 0.30) * halo * (0.22 + 1.00 * uLit) * 0.90;

  oCol = vec4(col, a);
}`;

// --------------------------------------------------------------------------
// Grain, over everything, so the last frame never becomes a still image.

export const GRAIN_FRAG = `#version 300 es
precision highp float;
in vec2 vScreen;
out vec4 oCol;
uniform float uTime;
uniform float uGrain;
${LIB}

void main() {
  float g = grain(vScreen, uTime) * uGrain;
  // grain is signed; carry it as premultiplied light with a matching alpha so
  // it darkens as well as lifts instead of only ever adding
  float a = abs(g) * 1.6;
  vec3 c = g > 0.0 ? vec3(1.0, 0.94, 0.86) * a : vec3(0.0);
  oCol = vec4(c, a);
}`;
