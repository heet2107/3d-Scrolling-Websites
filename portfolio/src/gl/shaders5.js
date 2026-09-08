// Act V — the record.
//
// The other acts light their own subject; this one lights a PAGE. Everything
// here is written to lose an argument with the body copy in front of it: the
// grid is pulled out of the middle of the frame where the bullets sit, the
// warm source is parked off the bottom-left corner, and nothing in the plate
// is allowed past roughly a tenth of full brightness. Two programs — the plate
// itself, and the embers drifting over it.

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
// The plate: drafting paper, seen in a dark room.

export const PLATE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vS;
void main() {
  vS = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

export const PLATE_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;   // 0 as the act enters the frame, 1 as it leaves it
uniform float uCol;      // reading column width, as a fraction of the viewport
${LIB}

/**
 * A line grid whose strokes stay about \`w\` DEVICE PIXELS wide however the
 * plate is scaled. Measuring the line in pixels rather than in world units is
 * the whole trick: a fixed-width grid either disappears on a phone or turns
 * into fat bars on a 4K display, and both read as a mistake rather than as
 * paper.
 */
float grid(vec2 p, float cell, float w) {
  vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
  vec2 d = g / max(fwidth(p), vec2(1e-6));
  return 1.0 - smoothstep(0.0, w, min(d.x, d.y));
}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 q = (s - 0.5) * vec2(aspect, 1.0);

  vec3 col = vec3(0.0080, 0.0065, 0.0058);

  // the plate breathes on a very long period, so a reader who stops scrolling
  // to actually read is not sitting in front of a still image
  float wash = fbm3(q * 1.6 + vec2(uTime * 0.013, uScroll * 0.55));
  col += vec3(0.030, 0.019, 0.012) * wash;

  // The grid is pulled OUT of the middle of the frame, because that is exactly
  // where the bullets are: a hairline crossing a 15px line of Oswald costs
  // more legibility than the texture is worth. It survives in the margins,
  // which is where paper shows anyway.
  float open = smoothstep(uCol * 0.62, uCol * 1.02, abs(s.x - 0.5) * 2.0);
  vec2 gp = q + vec2(0.0, uScroll * 0.85 + uTime * 0.006);
  float minor = grid(gp, 0.048, 1.15);
  float major = grid(gp, 0.192, 1.35);
  col += vec3(0.052, 0.044, 0.036) * minor * (0.10 + 0.90 * open);
  col += AMBER * 0.026 * major * (0.16 + 0.84 * open);

  // one warm source, off the bottom-left corner and drifting — the act is lit
  // rather than painted, and it is lit from where the film has been lighting
  // everything since the opening
  vec2 lp = vec2(-aspect * 0.46 + sin(uTime * 0.055) * 0.10,
                 -0.44 + cos(uTime * 0.041) * 0.07);
  float ld = length(q - lp);
  col += EMBER * exp(-ld * ld * 2.4) * 0.085;
  col += AMBER * exp(-ld * ld * 7.0) * 0.030;

  vec2 d = (s - 0.5) * vec2(1.04, 1.0);
  col *= 1.0 - 0.62 * smoothstep(0.18, 0.90, dot(d, d) * 2.0);
  col += (hash21(s * 1024.0 + fract(uTime) * 71.0) - 0.5) * 0.022;

  oCol = vec4(max(col, 0.0), 1.0);
}`;

// --------------------------------------------------------------------------
// Embers. The same convection as act two, at a fraction of the density and a
// third of the brightness: this is a room the record is being read in, not a
// fire it is being read by.

export const EMBER_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aSeed;   // xy: home in 0..1 screen, z: seed, w: px
uniform float uTime;
uniform float uScroll;
uniform float uDpr;
out float vGlow;
void main() {
  float s = aSeed.z;
  vec2 p = aSeed.xy;

  // embers rise and wrap, so the field is endless rather than a loop that runs
  // out; the scroll term gives the plate a little counter-drift so it reads as
  // attached to the page moving over it
  p.y = fract(p.y + uTime * (0.0085 + s * 0.011) - uScroll * 0.07);
  p.x += sin(uTime * (0.09 + s * 0.14) + s * 37.0) * 0.020;

  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = max(1.0, aSeed.w * uDpr);

  float twinkle = 0.34 + 0.66 * pow(0.5 + 0.5 * sin(uTime * (0.7 + s * 1.6)
                                                    + s * 29.0), 2.0);
  // fade across the wrap, or every ember blinks out at the top of the frame
  // and back in at the bottom on the same frame
  vGlow = twinkle * smoothstep(0.0, 0.11, p.y) * smoothstep(1.0, 0.89, p.y);
}`;

export const EMBER_FRAG = `#version 300 es
precision highp float;
in float vGlow;
out vec4 oCol;
${LIB}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 4.0 * 3.2);
  vec3 col = mix(EMBER, AMBER, clamp(vGlow * 0.7, 0.0, 1.0));
  float a = f * vGlow * 0.30;
  oCol = vec4(col * a, a);
}`;
