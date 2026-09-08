// Act I — the opening.
//
// Two programs share one noise library so the field is CONTINUOUS: the letters
// are windows onto a single field that fills the frame, not ten independent
// patches that happen to sit next to each other. Everything is evaluated in
// screen space for exactly that reason.

export const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;      // unit quad, 0..1
uniform vec4 uRect;                     // x, y, w, h in clip space
uniform vec2 uUV0;                      // atlas sub-rect origin
uniform vec2 uUV1;                      // atlas sub-rect extent
out vec2 vUV;                           // atlas uv
out vec2 vScreen;                       // 0..1 across the viewport
void main() {
  vec2 p = uRect.xy + aPos * uRect.zw;
  // v=0 is the TOP of the atlas but aPos.y=0 is the BOTTOM of the rect in
  // clip space, so v is flipped here; without it every glyph renders upside
  // down (T as an inverted tee, A as a vee) while the symmetric ones hide it
  vUV = uUV0 + vec2(aPos.x, 1.0 - aPos.y) * uUV1;
  vScreen = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// --------------------------------------------------------------------------
// The shared library: noise, the signal field, grain, vignette.
//
// The field is three layers that read as one thing — streams running left to
// right, filaments threading through them, and nodes lighting where filaments
// cross. Together they read as a model thinking rather than as animated noise.

const LIB = `
const vec3 EMBER = vec3(0.910, 0.333, 0.000);   // #e85500
const vec3 AMBER = vec3(0.969, 0.576, 0.118);   // #f7931e
const vec3 HOT   = vec3(1.000, 0.880, 0.700);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

float fbm4(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

/**
 * The field. \`q\` is aspect-corrected screen space centred on the composition,
 * \`flow\` ramps the streaming speed, \`lit\` is overall energy.
 * Returns premultiplied-ish linear colour; the caller decides opacity.
 */
vec3 signalField(vec2 q, float t, float flow, float lit) {
  float drift = t * (0.05 + 0.30 * flow);

  // domain warp — this is what stops the layers reading as parallel stripes
  vec2 w = vec2(fbm3(q * 1.5 + vec2(drift, 0.0)),
                fbm3(q * 1.5 + vec2(4.7, -drift * 0.75)));
  vec2 p = q + (w - 0.5) * 0.34;

  // 1. streams — tokens running left to right through the frame
  float band = fbm4(vec2(p.x * 0.62 - drift * 2.6, p.y * 7.2));
  float stream = smoothstep(0.52, 0.74, band);
  stream *= 0.42 + 0.58 * pow(0.5 + 0.5 * sin(p.y * 44.0 + drift * 6.0), 2.0);
  stream = max(stream, 0.0);

  // 2. filaments — thin ridges threading the warped field
  float r = fbm4(p * 5.2 + vec2(-drift * 1.6, drift * 0.55));
  float fil = 1.0 - smoothstep(0.0, 0.026, abs(r - 0.5));
  float r2 = fbm3(p * 9.4 + vec2(drift * 1.0, -drift * 1.2));
  fil += 0.48 * (1.0 - smoothstep(0.0, 0.014, abs(r2 - 0.5)));

  // 3. nodes — where filaments cross, a head lights up and breathes
  vec2 cell = p * 6.2;
  vec2 ci = floor(cell);
  float node = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = ci + vec2(float(x), float(y));
      float h = hash21(g);
      vec2 c = g + 0.25 + 0.5 * vec2(h, hash21(g + 7.3));
      float d = length(cell - c);
      float pulse = 0.35 + 0.65 * pow(
        0.5 + 0.5 * sin(t * (1.1 + 2.4 * h) + h * 31.0), 3.0);
      node += pulse * exp(-d * d * 30.0) * step(0.46, h);
    }
  }

  float energy = stream * 0.42 + fil * 0.50 + node * 1.15;
  energy *= lit;

  // ramp: deep ember in the body, amber through the mids, white at the heads
  vec3 col = EMBER * energy * 0.85;
  col += AMBER * pow(max(energy, 0.0), 1.6) * 0.95;
  col += HOT * pow(max(energy, 0.0), 4.5) * 0.80;
  return col;
}

float vignette(vec2 s, float amount) {
  vec2 d = (s - 0.5) * vec2(1.06, 1.0);
  return 1.0 - amount * smoothstep(0.24, 0.86, dot(d, d) * 2.0);
}

float grain(vec2 s, float t) {
  return hash21(s * 1024.0 + fract(t) * 173.0) - 0.5;
}
`;

// --------------------------------------------------------------------------
// Background: the room the wordmark sits in.

export const BG_FRAG = `#version 300 es
precision highp float;
in vec2 vScreen;
out vec4 oCol;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uEmber;      // ember centre, 0..1 screen
uniform float uEmberAmt;
uniform float uFlow;
uniform float uFieldIn;    // the field condensing out of black
uniform float uGrain;
uniform float uFlash;
uniform vec2  uPar;        // pointer parallax
${LIB}

void main() {
  vec2 s = vScreen;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0) * 2.0;
  q -= uPar * vec2(0.055, 0.035);

  // the ghost of the field outside the letters — enough that the frame is a
  // room with something in it, never enough to compete with the wordmark
  vec3 col = signalField(q * 0.70, uTime, uFlow, 0.42 * uFieldIn) * 0.075;

  // the ember behind the wordmark, lighting it from within
  vec2 e = (s - uEmber) * vec2(aspect, 1.0);
  float d = length(e);
  float bloom = exp(-d * d * 8.5) * 0.55 + exp(-d * 3.4) * 0.12;
  col += EMBER * bloom * uEmberAmt * 0.26;
  col += AMBER * exp(-d * d * 22.0) * uEmberAmt * 0.07;

  col += vec3(1.0, 0.80, 0.55) * uFlash;
  col *= vignette(s, 0.80);
  col += grain(s, uTime) * uGrain;

  oCol = vec4(max(col, 0.0), 1.0);
}`;

// --------------------------------------------------------------------------
// One letter of the wordmark: a window onto the field.

export const LETTER_FRAG = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vScreen;
out vec4 oCol;

uniform sampler2D uWord;   // coverage atlas, alpha in .a (and .r)
uniform vec2  uRes;
uniform vec2  uTexel;      // 1 / atlas size
uniform float uTime;
uniform float uReveal;     // 0..1 dissolve
uniform float uOpacity;
uniform float uSoften;     // out-of-focus at the start of the reveal
uniform float uEdge;       // rim light as the letter resolves
uniform float uFlow;
uniform float uLit;
uniform vec2  uPar;
${LIB}

/** Coverage with an optional blur, so a letter can resolve out of softness. */
float coverage(vec2 uv, float soften) {
  float c = texture(uWord, uv).a;
  if (soften > 0.001) {
    vec2 r = uTexel * (1.0 + soften * 26.0);
    float b = 0.0;
    b += texture(uWord, uv + vec2( r.x, 0.0)).a;
    b += texture(uWord, uv + vec2(-r.x, 0.0)).a;
    b += texture(uWord, uv + vec2(0.0,  r.y)).a;
    b += texture(uWord, uv + vec2(0.0, -r.y)).a;
    b += texture(uWord, uv + r * 0.7).a;
    b += texture(uWord, uv - r * 0.7).a;
    b += texture(uWord, uv + vec2(r.x, -r.y) * 0.7).a;
    b += texture(uWord, uv + vec2(-r.x, r.y) * 0.7).a;
    c = mix(c, b * 0.125, soften);
  }
  return c;
}

void main() {
  float cov = coverage(vUV, uSoften);
  if (cov <= 0.002) discard;

  vec2 s = vScreen;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0) * 2.0;
  q -= uPar * vec2(0.075, 0.048);

  // the dissolve: the letter materialises out of static rather than fading,
  // so it reads as resolving rather than as an opacity ramp
  float n = fbm3(vUV * vec2(uTexel.y / uTexel.x, 1.0) * 9.0 + 3.1);
  float diss = clamp((uReveal * 1.30 - n * 0.95) / 0.26, 0.0, 1.0);

  // the field, seen through this letter-shaped window
  vec3 field = signalField(q, uTime, uFlow, uLit);

  // a warm graphite body under the field, so hairline strokes still read as
  // letterforms when the field happens to be dark there
  vec3 body = vec3(0.043, 0.030, 0.023) + EMBER * 0.040;
  vec3 col = body + field * 1.30;

  // rim: the letter edge catches the ember while it resolves
  float rim = smoothstep(0.30, 0.52, cov) * (1.0 - smoothstep(0.52, 0.80, cov));
  col += mix(AMBER, HOT, 0.35) * rim * (0.30 + 0.85 * uEdge);

  float a = cov * uOpacity * diss;
  oCol = vec4(col * a, a);
}`;

// --------------------------------------------------------------------------
// Grain and flash, over everything, so the frame never becomes a still image.

export const GRAIN_FRAG = `#version 300 es
precision highp float;
in vec2 vScreen;
out vec4 oCol;
uniform vec2 uRes;
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
