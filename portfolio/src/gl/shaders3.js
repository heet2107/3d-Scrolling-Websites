// Act III — a journey through time.
//
// Three programs: the room (which owns the fitted arc, the seven nodes, the
// reflective floor and the ring mechanism turning on it), the clock (a shaded
// ball with a beam hand hanging from it), and the motes drifting between them.
//
// Everything is evaluated in ONE space — screen coordinates divided by the
// frame height, y up, origin at the centre — because that space is a uniform
// scaling of pixels, so the circle JS fitted in layout3.js is still exactly a
// circle here. That is what lets the shader draw the rail as a distance to a
// real circle instead of a baked-in list of points, and it is why the amber
// flood lands on a node rather than near it.

import { YEARS } from '../data/content.js';

const N = YEARS.length;

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

export const FULL_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vS;
void main() {
  vS = aPos;
  gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
}`;

// --------------------------------------------------------------------------
// The room. Warm black, a horizon at the foot of the timeline, a wet floor
// below it with a ring mechanism turning in the dark, and the timeline itself
// drawn from the fitted circle.

export const ROOM_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uIn;            // the room resolving out of black
uniform float uDrift;         // -1..1, the scroll's pull on the room
uniform vec2  uPar;           // pointer parallax, -1..1
uniform vec3  uArc;           // the fitted circle: centre.xy, radius
uniform vec2  uSweep;         // its angular extent, in TRAVEL order
uniform float uRail;          // 0..1, how much of the rail has drawn
uniform vec2  uNode[${N}];
uniform float uHeat[${N}];    // per-year highlight
uniform float uLit;           // how many years have lit, fractional
uniform vec2  uLand;          // where the beam is landing, on the arc
uniform float uLandA;         // and its angle on the circle
uniform float uHorizon;       // the floor line, in vS.y
uniform float uSpread;        // how wide the light pools are allowed to run
${LIB}

/** The angle of a point about the arc's centre; zero hangs straight down. */
float arcAngle(vec2 p) {
  vec2 d = p - uArc.xy;
  return atan(d.x, -d.y);
}

/**
 * Everything the timeline itself emits at \`p\` — the rail, the seven year
 * nodes, and the pool of light the clock is currently throwing. Written as a
 * function because the floor has to evaluate it a second time at the mirrored
 * point; a reflection faked with noise reads as texture, not as a reflection.
 *
 * \`soft\` is 0..1 and only ever BLURS: it must not be allowed to widen the
 * rail, because a hairline smeared to a fifth of the frame stops being a
 * reflection of a timeline and becomes a fog bank across the floor.
 */
vec3 timeline(vec2 p, float soft) {
  vec3 col = vec3(0.0);
  float d = abs(length(p - uArc.xy) - uArc.z);
  // Every radius here is in units of the frame's HEIGHT, which is right for a
  // landscape frame and far too generous for a tall one: on a phone the same
  // flood is a fifth of the screen wide and swallows three years at once. One
  // scalar pulls the pools in for the standing composition.
  float k = 1.0 / (uSpread * uSpread);

  // Every term below falls off as a Gaussian around the circle, so past this
  // radius the whole block contributes less than a thousandth of a level. The
  // room is mostly empty space and this function is evaluated twice per pixel;
  // without the bound the floor's reflection alone costs more than the rest of
  // the act put together.
  if (d < 0.17) {
    float a = arcAngle(p);

    // the rail draws itself from the first year outward, so the reveal has a
    // direction even when the arc runs right to left
    float front = mix(uSweep.x, uSweep.y, uRail);
    float dir = sign(uSweep.y - uSweep.x);
    float drawn = smoothstep(0.008, -0.002, (a - front) * dir);
    float lo = min(uSweep.x, uSweep.y);
    float hi = max(uSweep.x, uSweep.y);
    float band = smoothstep(lo - 0.028, lo - 0.004, a)
               * smoothstep(hi + 0.028, hi + 0.004, a) * drawn;

    // the rail: a hairline with a narrow, dim bed under it
    col += AMBER * smoothstep(0.0026 + soft * 0.0055, 0.0, d) * band * 0.62;
    col += EMBER * exp(-d * d * k * (1400.0 / (1.0 + soft * 2.4))) * band * 0.13;

    // the light spilling ALONG the rail either side of where the beam lands
    float da = a - uLandA;
    col += AMBER * exp(-da * da * 260.0) * exp(-d * d * 2600.0) * 0.50;

    // the years. They sit ON the circle, so a point this far off it is at
    // least this far from every one of them.
    if (d < 0.11) {
      for (int i = 0; i < ${N}; i++) {
        float lit = clamp(uLit - float(i), 0.0, 1.0);
        if (lit <= 0.0) continue;
        vec2 v = p - uNode[i];
        float r2 = dot(v, v);
        float heat = uHeat[i];
        col += HOT * exp(-r2 * (26000.0 / (1.0 + soft * 5.0)))
                   * (0.55 + 1.6 * heat) * lit;
        col += AMBER * exp(-r2 * k * 1400.0) * (0.09 + 0.50 * heat) * lit;
      }
    }
  }

  // the flood: the clock does not point at a year, it lights one
  vec2 lv = p - uLand;
  float lr2 = dot(lv, lv);
  if (lr2 < 0.12) {
    col += AMBER * exp(-lr2 * k * 700.0) * 0.60;
    col += HOT * exp(-lr2 * k * 4200.0) * 0.75;
    col += EMBER * exp(-lr2 * k * 90.0) * 0.18;
  }
  return col;
}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 par = uPar * vec2(0.016, 0.010) + vec2(0.0, uDrift * 0.006);
  vec2 q = (s - 0.5) * vec2(aspect, 1.0) - par;

  float below = uHorizon - s.y;                 // > 0 on the floor
  // the horizon is a soft edge: a hard one reads as a seam between two
  // different pictures rather than as the far end of a room
  float floorMask = smoothstep(-0.020, 0.052, below);

  vec3 col = vec3(0.0105, 0.0082, 0.0072);

  // ---- the far wall ------------------------------------------------------
  // the two halves of the room are exclusive, so each one's noise is only
  // walked where it can actually be seen
  if (below < 0.055) {
    float wall = fbm3(q * 2.2 + vec2(uTime * 0.016, 0.0));
    col += vec3(0.030, 0.020, 0.013) * wall * (1.0 - floorMask) * 0.85;
    // a single cold shaft down the left, so the room has a source it is not
    // getting all its light from
    col += vec3(0.020, 0.021, 0.026) * exp(-abs(q.x + aspect * 0.42) * 3.4)
         * (1.0 - floorMask) * 0.5;
  }

  // ---- the floor ---------------------------------------------------------
  if (below > -0.022) {
    // a plane in perspective: depth is 1/(distance below the horizon), which
    // is what makes the ring's concentric circles come back as ellipses that
    // compress correctly toward the horizon
    float depth = 0.26 / max(below, 0.0035);
    vec2 fw = vec2(q.x * depth, depth);

    float grain = fbm3(fw * vec2(1.6, 0.9) + vec2(0.0, uTime * 0.05));
    col += vec3(0.016, 0.011, 0.008) * grain * floorMask * exp(-below * 3.4);

    // the mechanism: three rings and a ring of teeth, turning once every ~70s
    vec2 rp = fw - vec2(0.0, 1.55);
    float rr = length(rp);
    float ra = atan(rp.y, rp.x) + uTime * 0.088 + uDrift * 0.10;
    float ring = 0.0;
    for (int i = 0; i < 3; i++) {
      float R = 0.46 + float(i) * 0.30;
      ring += smoothstep(0.020, 0.0, abs(rr - R)) * (0.9 - float(i) * 0.18);
    }
    float teeth = smoothstep(0.45, 0.92, sin(ra * 54.0))
                * smoothstep(0.045, 0.0, abs(rr - 1.13));
    float spoke = smoothstep(0.80, 0.995, abs(sin(ra * 3.0)))
                * smoothstep(1.10, 0.0, rr) * step(0.20, rr);
    float mech = (ring * 0.55 + teeth * 0.85 + spoke * 0.30)
               * floorMask * exp(-below * 3.1);
    col += mix(EMBER, AMBER, 0.35) * mech * 0.34;

    // the mirror is compressed toward the horizon and rippled, so the floor
    // reads as wet rather than as a second, upside-down room
    vec2 mir = vec2(s.x, uHorizon + below * 0.78);
    vec2 qm = (mir - 0.5) * vec2(aspect, 1.0) - par;
    qm.x += (fbm3(vec2(qm.x * 7.0, uTime * 0.30 + below * 26.0)) - 0.5)
          * below * 0.085;
    col += timeline(qm, clamp(below * 5.0, 0.0, 1.0))
         * floorMask * exp(-below * 7.0) * 0.40;
  }

  // ---- the timeline itself -----------------------------------------------
  col += timeline(q, 0.0);

  // ---- finish ------------------------------------------------------------
  vec2 dv = (s - 0.5) * vec2(1.04, 1.0);
  col *= 1.0 - 0.82 * smoothstep(0.18, 0.88, dot(dv, dv) * 2.0);
  col += (hash21(s * 1024.0 + fract(uTime) * 77.0) - 0.5) * 0.026;

  oCol = vec4(max(col, 0.0) * uIn, 1.0);
}`;

// --------------------------------------------------------------------------
// The clock. A shaded ball on a bracket with a beam hand hanging from it. The
// hand is drawn as a solid, unlit rod so it silhouettes against the room, and
// the light it throws is a separate additive cone — the point of the act is
// that the clock PROJECTS into the timeline rather than pointing at it.

export const CLOCK_FRAG = `#version 300 es
precision highp float;
in vec2 vS;
out vec4 oCol;
uniform vec2  uRes;
uniform float uTime;
uniform float uIn;
uniform vec2  uPar;
uniform vec2  uPivot;         // ball centre
uniform float uBallR;
uniform vec2  uLand;          // where the hot core sits, on the arc
uniform float uCore;          // 0..1, how hot the core is running
uniform float uHand;          // 0..1, the hand dropping out of the ball
uniform float uSpread;        // matches the room's, so the two agree
uniform vec3  uDial;          // the dial circle: centre.xy, radius
uniform float uFace;          // 0..1, how much of the dial has drawn in
${LIB}

void main() {
  vec2 s = vS;
  float aspect = uRes.x / uRes.y;
  vec2 par = uPar * vec2(0.016, 0.010);
  vec2 p = (s - 0.5) * vec2(aspect, 1.0) - par;

  vec3 light = vec3(0.0);        // additive: what the clock throws
  vec3 body = vec3(0.0);         // solid: what the clock occludes
  float bodyA = 0.0;

  vec2 axis = uLand - uPivot;
  float L = max(length(axis), 1e-4);
  vec2 dir = axis / L;
  vec2 nrm = vec2(-dir.y, dir.x);

  vec2 rel = p - uPivot;
  float along = dot(rel, dir);
  float across = dot(rel, nrm);
  float run = clamp(along / L, 0.0, 1.0);

  // the bracket the clock hangs from: two hairlines running up out of frame.
  // It is the one part of this pass that lives outside the beam's wedge, so it
  // is measured before the wedge is used to reject anything.
  float rung = abs(abs(p.x - uPivot.x) - uBallR * 0.42);
  bool onMount = rung < 0.004 && p.y > uPivot.y;

  // The dial lies outside the beam's wedge too, and across the whole width of
  // the frame, so like the mount it is measured before the wedge rejects
  // anything. Its band is thin: everything below it is still rejected.
  vec2  dRel = p - uDial.xy;
  float dRad = length(dRel);
  float out0 = dRad - uDial.z;          // >0 outside the circle, i.e. on screen
  float BAND = uDial.z * 0.045;         // how far the ticks reach in from it
  bool  onDial = out0 > -BAND * 0.35 && out0 < BAND;

  // The clock otherwise occupies one narrow wedge of the frame — ball, hand,
  // cone and landing core all lie inside it. Everywhere else this pass is a
  // full-screen quad computing a dozen exponentials in order to output zero,
  // which on a software renderer costs more than the room it is drawn over.
  if (!onMount && !onDial
      && (abs(across) > uBallR * 5.0 || along < -uBallR * 2.4 || along > L * 1.5)) {
    oCol = vec4(0.0);
    return;
  }

  // ---- the dial ----------------------------------------------------------
  // A rim line with a graticule of ticks stepping down from it: fine ones all
  // the way round, a longer one every fifth. Ticks run OUTWARD, away from the
  // centre — the centre is above the frame, so ticks drawn inward would be
  // drawn where nobody can see them.
  if (onDial && uFace > 0.001) {
    float ang = atan(dRel.y, dRel.x);
    // 520 around the whole circle. Only a shallow sweep is ever on screen, so
    // this reads as a fine graticule rather than the fence a coarser count
    // gives; the ticks are short for the same reason.
    float k = ang * 520.0 / 6.28318530718;
    float cell = abs(fract(k) - 0.5) * 2.0;
    float major = step(fract(floor(k) / 5.0), 0.001);
    float reach = BAND * mix(0.20, 0.52, major);
    float mark = smoothstep(0.74, 0.96, cell)
               * step(0.0, out0) * smoothstep(reach, reach * 0.45, out0);
    // the rim, plus a second hairline standing off it, so the ticks sit in a
    // measured band rather than hanging off a single line
    float rim = smoothstep(0.0026, 0.0, abs(out0))
              + smoothstep(0.0018, 0.0, abs(out0 - BAND * 0.52)) * 0.30;
    // the rim is brightest where the hand is pointing, so the dial reads as
    // belonging to the clock rather than as decoration behind it
    float landAng = atan(uLand.y - uDial.y, uLand.x - uDial.x);
    float near = exp(-pow((ang - landAng) * 1.7, 2.0));
    float f = uFace * (0.30 + 0.70 * near);
    light += AMBER * rim * 0.52 * f;
    light += AMBER * mark * mix(0.20, 0.46, major) * f;
  }

  // ---- the bracket -------------------------------------------------------
  float mount = smoothstep(0.0016, 0.0, rung)
              * smoothstep(0.0, 0.02, p.y - uPivot.y);
  body += vec3(0.10, 0.085, 0.075) * mount;
  bodyA = max(bodyA, mount * 0.85);

  // ---- the hand ----------------------------------------------------------
  // it tapers to a point at the landing distance, so the eye is carried down
  // the rod to the year rather than stopping at a blunt end
  float reach = mix(uBallR * 1.4, L, uHand);
  float halfW = mix(uBallR * 0.30, uBallR * 0.115, run);
  float ends = smoothstep(uBallR * 0.30, uBallR * 0.62, along)
             * smoothstep(reach + 0.008, reach - 0.006, along);
  float rod = smoothstep(halfW, halfW * 0.70, abs(across)) * ends;
  float edge = smoothstep(halfW * 1.10, halfW * 0.88, abs(across))
             - smoothstep(halfW * 0.86, halfW * 0.64, abs(across));

  body += vec3(0.048, 0.038, 0.032) * rod;
  bodyA = max(bodyA, rod * 0.96);
  light += AMBER * edge * ends * (0.34 + 0.62 * run) * uHand;
  // the core the hand carries: cool near the pivot, white hot at the tip
  light += mix(EMBER, HOT, run * run)
         * exp(-pow(across / (halfW * 0.40), 2.0)) * ends
         * (0.30 + 1.30 * run) * uHand * uCore;

  // ---- the cone it projects ---------------------------------------------
  // wide enough to read as a volume of light: without it the hand is a wire
  // pointing at a year rather than a lamp lighting one
  float coneW = mix(uBallR * 0.24, uBallR * 1.75, run * run);
  float cone = exp(-pow(across / coneW, 2.0) * 1.35)
             * smoothstep(uBallR * 0.5, uBallR * 2.0, along)
             * (1.0 - smoothstep(L * 0.84, L * 1.26, along));
  light += mix(EMBER, AMBER, 0.6) * cone * 0.26 * uHand * uCore;
  // a tighter inner cone, so the volume has a bright spine down its middle
  light += AMBER * exp(-pow(across / (coneW * 0.34), 2.0))
         * smoothstep(uBallR * 0.5, uBallR * 2.0, along)
         * (1.0 - smoothstep(L * 0.92, L * 1.14, along)) * 0.20 * uHand * uCore;

  // ---- the ball ----------------------------------------------------------
  vec2 bv = p - uPivot;
  float br = length(bv) / uBallR;
  float disc = smoothstep(1.0, 0.985, br);
  // a real hemisphere normal, so the sphere is shaded rather than a soft dot
  float z = sqrt(max(0.0, 1.0 - min(br * br, 1.0)));
  vec3 n = normalize(vec3(bv / uBallR, z + 0.001));
  float key = max(0.0, dot(n, normalize(vec3(-0.45, 0.62, 0.64))));
  // the beam lights the ball from underneath, which is what ties the two
  // together: the pivot is warmest on the side the hand is hanging toward
  float fill = max(0.0, dot(n, vec3(dir, -0.25)));

  body += (vec3(0.055, 0.048, 0.043) * pow(key, 1.5)
        + vec3(0.014, 0.011, 0.009)) * disc;
  bodyA = max(bodyA, disc);
  light += HOT * pow(key, 26.0) * disc * 0.85;
  light += mix(EMBER, AMBER, 0.5) * pow(fill, 2.2) * disc * 0.55 * uCore;
  // the collar
  light += AMBER * smoothstep(0.030, 0.0, abs(br - 1.0)) * 0.30;
  light += EMBER * exp(-pow((br - 1.0) * 1.7, 2.0)) * 0.10 * uCore;

  // ---- the core landing on the year -------------------------------------
  vec2 lv = p - uLand;
  float k = 1.0 / (uSpread * uSpread);
  float lr2 = dot(lv, lv);
  light += HOT * exp(-lr2 * k * 5200.0) * 1.15 * uCore * uHand;
  light += AMBER * exp(-lr2 * k * 620.0) * 0.42 * uCore * uHand;
  // Four short spikes, so the landing reads as a hot point and not a blob.
  // They are kept SHORT deliberately: the vertical one runs straight up into
  // the card standing over the node, and a longer one washes out the very tag
  // the beam is meant to be drawing attention to.
  float sp = max(exp(-lv.x * lv.x * 9000.0 - lv.y * lv.y * k * 130.0),
                 exp(-lv.y * lv.y * 9000.0 - lv.x * lv.x * k * 90.0));
  light += HOT * sp * 0.16 * uCore * uHand;

  float a = clamp(bodyA, 0.0, 1.0) * uIn;
  oCol = vec4((light * uIn) + body * a, a);
}`;

// --------------------------------------------------------------------------
// Motes. Dust in the beam — the cheapest way to make a volume of light read as
// a volume rather than as a gradient.

export const MOTE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;    // resting place, 0..1 across the frame
layout(location = 1) in vec2 aMeta;   // x: seed, y: size in device pixels
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPivot;
uniform vec2  uLand;
uniform float uDpr;
out float vGlow;
void main() {
  float sd = aMeta.x;
  vec2 s = aPos;
  s.x += sin(uTime * (0.10 + sd * 0.17) + sd * 37.0) * 0.020;
  s.y += fract(uTime * (0.008 + sd * 0.012) + sd) * 0.42 - 0.21;

  float aspect = uRes.x / uRes.y;
  vec2 p = (s - 0.5) * vec2(aspect, 1.0);

  // motes standing in the beam catch it; the rest only breathe
  vec2 ax = uLand - uPivot;
  float L = max(length(ax), 1e-4);
  vec2 d = ax / L;
  float along = clamp(dot(p - uPivot, d) / L, 0.0, 1.0);
  float across = abs(dot(p - uPivot, vec2(-d.y, d.x)));
  float inBeam = exp(-pow(across / mix(0.02, 0.10, along), 2.0));

  vGlow = (0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (0.9 + sd * 2.1) + sd * 23.0), 2.0))
        * (0.35 + 2.3 * inBeam);
  gl_Position = vec4(s * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = max(1.0, aMeta.y * uDpr);
}`;

export const MOTE_FRAG = `#version 300 es
precision highp float;
in float vGlow;
out vec4 oCol;
uniform float uIn;
${LIB}

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = exp(-dot(d, d) * 13.0);
  vec3 col = mix(EMBER, HOT, clamp(vGlow * 0.40, 0.0, 1.0));
  float a = f * clamp(vGlow, 0.0, 2.2) * 0.42 * uIn;
  oCol = vec4(col * a, a);
}`;
