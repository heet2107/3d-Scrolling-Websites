// Composition geometry for Act III — the arc, the seven nodes, the cards, the
// clock, the floor line.
//
// The timeline is a REAL CIRCLE. Everything downstream depends on that: the
// canvas draws the rail as `abs(length(p - centre) - radius)`, the nodes sit at
// equal ANGULAR steps (which on a circle is equal arc length), the hand's
// landing point is the arc point at a fractional angle, and the DOM cards are
// hung off the same node positions. A spline through seven eyeballed points
// would give none of that: the shader would need the points baked in, the
// spacing would drift as the viewport changed, and the hand could only ever
// approximate where a year sits.
//
// The fit is closed form, not solved by eye. Two endpoints and a sagitta (the
// perpendicular drop from the chord's midpoint to the arc) define exactly one
// circle:
//
//     R = (c²/4 + s²) / 2s      c = chord length, s = sagitta
//
// so the composition is authored with the three numbers a designer actually
// cares about — where the first year sits, where the last one sits, how much
// the timeline bows — and the centre and radius fall out of them.

import { clamp, lerp } from '../lib/ease.js';
import { YEARS } from '../data/content.js';

export const N = YEARS.length;

/**
 * The circle through `p0` and `p1` whose midpoint is `sag` away from the
 * chord, measured along the chord's left normal (in screen coordinates, with y
 * pointing down, that normal points DOWNWARD — so a positive sagitta bows the
 * arc toward the bottom of the frame).
 *
 * `sag` may be negative, which bows it the other way; the radius comes back
 * signed from the formula and is only made positive at the end, because the
 * centre has to be computed from the signed value or it lands on the wrong
 * side of the chord.
 */
function arcThrough(p0, p1, sag) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const c = Math.hypot(dx, dy);
  const half = c * 0.5;
  const r = (half * half + sag * sag) / (2 * sag);
  const nx = -dy / c;
  const ny = dx / c;
  const mx = (p0.x + p1.x) * 0.5;
  const my = (p0.y + p1.y) * 0.5;
  return {
    cx: mx + nx * (sag - r),
    cy: my + ny * (sag - r),
    r: Math.abs(r),
  };
}

/**
 * Angle of a point on the arc, measured from the direction the centre "hangs"
 * toward — zero straight down from the centre, positive to the right. The
 * shader recomputes this with `atan(d.x, -d.y)` in its own y-up space; the two
 * agree, which is what lets the canvas and the DOM share one geometry.
 */
const angleOf = (arc, x, y) => Math.atan2(x - arc.cx, y - arc.cy);

const pointAt = (arc, a) => ({
  x: arc.cx + Math.sin(a) * arc.r,
  y: arc.cy + Math.cos(a) * arc.r,
});

const px = (v, lo, hi) => Math.round(clamp(v, lo, hi));

// --------------------------------------------------------------------------

/**
 * Landscape: the timeline lies across the lower half of the frame and
 * DESCENDS as it runs right, so the years are not evenly spaced in x. The
 * cards stand on it; the expanded panel floats in the empty band above them,
 * with its bottom edge on one shared line so the composition does not jump
 * vertically as the hand sweeps.
 */
function landscape(w, h) {
  // below roughly 760px of height there is no longer room for a title band, a
  // panel band, the timeline and a floor, so the furniture tightens rather
  // than the composition rearranging
  const tight = h < 760;

  const edge = px(0.019 * w, 18, 30);
  const headW = px(0.088 * w, 104, 140);
  const headH = tight ? 52 : 62;
  // the head's foot stands clear of its node, so the flood the clock throws
  // pools UNDER the card instead of behind its tag line
  const gap = tight ? 24 : 30;

  const arc = arcThrough(
    { x: 0.105 * w, y: 0.585 * h },         // 2020 — left, high on the bow
    { x: 0.925 * w, y: 0.735 * h },         // 2026 — right, low
    0.055 * h,
  );

  const a0 = angleOf(arc, 0.105 * w, 0.585 * h);
  const a1 = angleOf(arc, 0.925 * w, 0.735 * h);
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const a = lerp(a0, a1, i / (N - 1));
    const p = pointAt(arc, a);
    nodes.push({ a, x: p.x, y: p.y });
  }

  // the panel hangs on one line for every year. That line is set by the
  // HIGHEST card on the arc — anything lower and the first year's panel would
  // land on top of its own head.
  const highestHead = Math.min(...nodes.map((n) => n.y)) - gap - headH;
  const panelBottom = highestHead - (tight ? 10 : 16);
  const panelW = px(0.235 * w, 264, 344);

  const cards = nodes.map((n) => {
    // near the frame edges the panel is pulled back in; it stays centred on
    // its card everywhere it can be, which is what makes it read as attached
    const wanted = n.x - panelW * 0.5;
    const left = clamp(wanted, edge, w - edge - panelW);
    const headLeft = n.x - headW * 0.5;
    const headTop = n.y - gap - headH;
    return {
      x: n.x,
      y: n.y - gap,                          // the head's foot
      // the panel lives inside the <button>, so its offset is measured from
      // the button's own top-left corner rather than from the deck
      bx: Math.round(left - headLeft),
      by: Math.round(panelBottom - headTop),  // panel BOTTOM, grows upward
      bw: panelW,
      stem: Math.round(headTop - panelBottom),
      hit: { x: n.x, y: headTop + headH * 0.5 },
    };
  });

  return {
    mode: 'wide', edge, headW, headH, arc, a0, a1, nodes, cards,
    // the clock hangs above the middle-right of the timeline, so the sweep
    // from 2020 to 2026 is a wide, readable arc of the hand rather than a
    // twitch
    pivot: { x: 0.545 * w, y: 0.145 * h, r: px(0.032 * h, 26, 48) },
    horizon: Math.max(...nodes.map((n) => n.y)) + 0.030 * h,
    spread: 1.0,
  };
}

/**
 * Portrait is a different composition, not the same one squeezed. Mapped
 * straight onto a 9:19.5 screen the arc collapses into a 40px band with all
 * seven cards stacked on each other, so on a phone the timeline STANDS UP: the
 * years become a vertical rail of tap targets down the left and one card at a
 * time holds the stage beside it. Same circle fit, same projection, same
 * shader — only the three numbers that define the arc change.
 */
function portraitLayout(w, h) {
  const edge = px(0.045 * w, 16, 26);
  // wide enough for the longest tag ('Shipping AI products') to sit under the
  // year without being clipped; a rail of years ending in ellipses reads as a
  // layout that ran out of room rather than as an index
  const headW = px(0.255 * w, 94, 124);
  const headH = px(0.056 * h, 46, 58);

  const top = { x: 0.185 * w, y: 0.300 * h };
  const bot = { x: 0.135 * w, y: 0.800 * h };
  // Negative sagitta: the rail bows toward the stage in its middle, so it
  // reads as the edge of a dial rather than a ruler. The bow is capped in
  // absolute pixels because on a wide portrait screen (a tablet held upright)
  // a proportional bow gets deep enough that a tap well out to the side of the
  // LAST chip is genuinely nearer the second-to-last segment, and the
  // projection — correctly — hands back the wrong year.
  const arc = arcThrough(top, bot, -clamp(0.050 * w, 14, 26));

  const a0 = angleOf(arc, top.x, top.y);
  const a1 = angleOf(arc, bot.x, bot.y);
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const a = lerp(a0, a1, i / (N - 1));
    const p = pointAt(arc, a);
    nodes.push({ a, x: p.x, y: p.y });
  }

  // the stage: everything right of the widest point of the rail
  const railRight = Math.max(...nodes.map((n) => n.x)) + headW * 0.5;
  const stageLeft = Math.round(railRight + px(0.040 * w, 14, 24));
  const stageW = w - edge - stageLeft;
  // A tablet held upright hands the stage 550px of width, and body copy set to
  // that measure runs ninety characters to the line and collapses to two lines
  // with a hole under it. The panel takes a readable measure and sits in the
  // middle of the stage instead of being stretched across it.
  const panelW = Math.round(Math.min(stageW, px(0.62 * w, 240, 430)));
  const panelLeft = Math.round(stageLeft + (stageW - panelW) * 0.5);
  // anchored by its CENTRE, so a short card and a long one both sit balanced
  // in the stage rather than hanging from a line at the top of it
  const panelMid = Math.round(0.545 * h);

  const cards = nodes.map((n) => ({
    x: n.x,
    y: n.y + headH * 0.5,                   // the chip is centred on its node
    bx: Math.round(panelLeft - (n.x - headW * 0.5)),
    by: Math.round(panelMid - (n.y - headH * 0.5)),
    bw: panelW,
    stem: 0,                                 // the stage is beside, not above
    hit: { x: n.x, y: n.y },
  }));

  return {
    mode: 'tall', edge, headW, headH, arc, a0, a1, nodes, cards,
    pivot: { x: 0.780 * w, y: 0.185 * h, r: px(0.030 * w, 22, 34) },
    horizon: Math.max(...nodes.map((n) => n.y)) + 0.045 * h,
    // a tall frame has far more height than width, so light measured in
    // frame-heights has to be pulled in or one flood covers three years
    spread: 0.55,
  };
}

export function computeChrono(w, h) {
  const portrait = h / w > 1.06;
  const L = portrait ? portraitLayout(w, h) : landscape(w, h);
  L.w = w;
  L.h = h;
  L.portrait = portrait;
  // the polyline the cursor is projected onto: the CARD centres, in order
  L.path = L.cards.map((c) => [c.hit.x, c.hit.y]);
  return L;
}

// --------------------------------------------------------------------------

/**
 * Where the pointer sits along the timeline, as a continuous 0..N-1.
 *
 * Raw cursor-x cannot do this job. The seven years sit at equal ARC LENGTH on
 * a bowed circle, so their horizontal spacing is not uniform: mapping x
 * linearly across the deck reads 2.971 with the pointer dead on the 2023 card,
 * and the flood then lands beside that year's node rather than on it — which
 * is the one thing the act promises. And because the timeline descends, x says
 * nothing at all about how far off the rail the pointer is, so a rule built
 * from it either ignores the vertical or has to guess a band.
 *
 * Projecting onto the polyline through the card centres answers both. Within
 * segment i the parameter is i plus the fraction along THAT segment, not
 * global arc length, which is what makes the halfway point between two cards
 * read exactly i.5 even though the segments have different lengths. And a
 * pointer 160px ABOVE the rail still picks the right year, because the foot of
 * the perpendicular stays inside the segment that year belongs to.
 */
export function projectToPath(path, x, y) {
  let bestT = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    const vx = bx - ax;
    const vy = by - ay;
    const len2 = vx * vx + vy * vy;
    // clamped, so a pointer past either end of the timeline pins to the first
    // or last year instead of running off into negative years
    const u = len2 > 0 ? clamp(((x - ax) * vx + (y - ay) * vy) / len2) : 0;
    const dx = x - (ax + vx * u);
    const dy = y - (ay + vy * u);
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; bestT = i + u; }
  }
  return bestT;
}

/** The point on the fitted circle a fractional year lands on. */
export function arcPointAt(L, t) {
  const c = clamp(t, 0, N - 1);
  const i = Math.min(N - 2, Math.floor(c));
  const a = lerp(L.nodes[i].a, L.nodes[i + 1].a, c - i);
  return { a, ...pointAt(L.arc, a) };
}

/** Screen pixels (y down) into the shader's aspect-corrected space (y up). */
export const toQ = (L, x, y) => [(x - L.w * 0.5) / L.h, (L.h * 0.5 - y) / L.h];
