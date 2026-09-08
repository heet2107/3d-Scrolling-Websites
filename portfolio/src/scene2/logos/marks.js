// The brand marks, drawn as vector paths at runtime.
//
// Every mark is authored inside the SAME 100x100 box and is drawn by the atlas
// at the same size with the same padding, so the deck reads as one set rather
// than as a scrapbook of pasted artwork. Nothing here is an image: the whole
// file is Path2D geometry, which is why the act still ships with no binary
// assets beyond the two logos that genuinely could not be drawn (see cards.js).
//
// Where a tool has no honest mark to draw — MCP and LangGraph are protocols and
// libraries, not products with an icon — it gets a typographic tile instead of
// an invented logo. A wrong logo is worse than no logo.

const TAU = Math.PI * 2;

/** Rounded rectangle as a sub-path on `g` (or on a Path2D). */
export function rr(g, x, y, w, h, r) {
  const k = Math.min(r, w * 0.5, h * 0.5);
  g.moveTo(x + k, y);
  g.lineTo(x + w - k, y);
  g.arcTo(x + w, y, x + w, y + k, k);
  g.lineTo(x + w, y + h - k);
  g.arcTo(x + w, y + h, x + w - k, y + h, k);
  g.lineTo(x + k, y + h);
  g.arcTo(x, y + h, x, y + h - k, k);
  g.lineTo(x, y + k);
  g.arcTo(x, y, x + k, y, k);
  g.closePath();
}

function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

function dot(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = fill;
  g.fill();
}

/** A grotesque stack for the two marks that are genuinely lettering. */
const GROTESQUE = '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", '
                + 'system-ui, sans-serif';

/**
 * Draw `text` centred on (cx, cy) and squeezed to fit `maxW` — canvas has no
 * letter-spacing, so tracked text is set glyph by glyph.
 */
function tracked(g, text, cx, cy, size, font, spacing, maxW) {
  g.font = `${font} ${size}px ${GROTESQUE}`;
  const widths = [...text].map((ch) => g.measureText(ch).width);
  let total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let sx = 1;
  if (maxW && total > maxW) { sx = maxW / total; total = maxW; }
  g.save();
  g.translate(cx - total * 0.5, cy);
  g.scale(sx, 1);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    g.fillText(text[i], x, 0);
    x += widths[i] + spacing;
  }
  g.restore();
}

// --------------------------------------------------------------------------
// The marks.
// --------------------------------------------------------------------------

/** React — three crossed ellipses around a filled nucleus. */
function react(g) {
  const C = '#61DAFB';
  g.strokeStyle = C;
  g.lineWidth = 5.4;
  for (let i = 0; i < 3; i++) {
    g.save();
    g.translate(50, 50);
    g.rotate((i * 60) * Math.PI / 180);
    g.beginPath();
    g.ellipse(0, 0, 46, 17.6, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  dot(g, 50, 50, 9.6, C);
}

/**
 * Next.js — the disc with the "N" whose diagonal runs past the stem. Set as
 * the dark-surface lockup (ringed disc, light letter): a solid black disc
 * would simply vanish into this room.
 */
function next(g) {
  g.beginPath();
  g.arc(50, 50, 46, 0, TAU);
  g.fillStyle = '#08080b';
  g.fill();
  g.lineWidth = 3.2;
  g.strokeStyle = 'rgba(244,244,246,0.94)';
  g.stroke();

  g.save();
  g.beginPath();
  g.arc(50, 50, 44.4, 0, TAU);
  g.clip();
  g.fillStyle = '#f4f4f6';
  // left stem
  g.fillRect(29.5, 28, 7.4, 44);
  // right stem: only the upper run, as in the mark
  g.fillRect(63.2, 28, 7.4, 19);
  // the diagonal, which keeps going until the disc cuts it off
  poly(g, [[36.9, 28], [80, 92], [70.4, 92], [29.5, 30.6]]);
  g.fill();
  g.restore();
}

/** TypeScript — the blue rounded square with white "TS" set bottom-right. */
function typescript(g) {
  g.beginPath();
  rr(g, 2, 2, 96, 96, 12);
  g.fillStyle = '#3178C6';
  g.fill();

  g.fillStyle = '#ffffff';
  g.font = `700 47px ${GROTESQUE}`;
  g.textAlign = 'right';
  g.textBaseline = 'alphabetic';
  const w = g.measureText('TS').width;
  g.save();
  // the real mark sets TS wider than a default grotesque; stretch to match
  g.translate(89, 86);
  g.scale(Math.min(1.16, 62 / w), 1);
  g.fillText('TS', 0, 0);
  g.restore();
}

/** Node.js — the green hexagon, points top and bottom. */
function node(g) {
  const R = 47;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    pts.push([50 + R * Math.cos(a), 50 + R * Math.sin(a)]);
  }
  poly(g, pts);
  const grad = g.createLinearGradient(0, 3, 0, 97);
  grad.addColorStop(0, '#7DC463');
  grad.addColorStop(0.55, '#5FA04E');
  grad.addColorStop(1, '#3F7C34');
  g.fillStyle = grad;
  g.fill();
}

/**
 * Python — two interlocking bodies, each a wide bar plus a leg that runs past
 * the other's bar. Drawn with a real gap between them rather than an overlap,
 * which is what makes the two halves read as separate snakes.
 */
function python(g) {
  const blue = new Path2D();
  rr(blue, 11, 4, 78, 44, 17);     // upper bar
  rr(blue, 11, 28, 37, 46, 17);    // left leg, descending
  const yellow = new Path2D();
  rr(yellow, 11, 52, 78, 44, 17);  // lower bar
  rr(yellow, 52, 26, 37, 46, 17);  // right leg, ascending

  g.fillStyle = '#FFD43B';
  g.fill(yellow);
  // punch a uniform channel so the halves never touch
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.lineWidth = 7;
  g.lineJoin = 'round';
  g.stroke(blue);
  g.fill(blue);
  g.restore();

  g.fillStyle = '#3776AB';
  g.fill(blue);

  dot(g, 27, 19.5, 5.0, '#ffffff');
  dot(g, 73, 80.5, 5.0, '#ffffff');
}

/**
 * PostgreSQL — the elephant head, simplified to a silhouette. This is an
 * honest reduction of a fussy mark, not a trace of it: dome, ear, trunk, tusk
 * and eye, at the weight the rest of the deck is drawn at.
 */
function postgres(g) {
  const grad = g.createLinearGradient(0, 6, 0, 96);
  grad.addColorStop(0, '#6C9CC8');
  grad.addColorStop(1, '#2F5F87');
  g.fillStyle = grad;

  // skull and trunk as one silhouette
  g.beginPath();
  g.moveTo(50, 8);
  g.bezierCurveTo(73, 8, 87, 23, 86, 43);      // right of the skull
  g.bezierCurveTo(85, 57, 77, 65, 69, 69);     // cheek
  g.bezierCurveTo(64, 71, 61, 76, 61, 82);     // shoulder into the trunk
  g.bezierCurveTo(61, 90, 56, 96, 48, 95);     // trunk descending
  g.bezierCurveTo(41, 94, 38, 87, 41, 81);     // curling forward at the tip
  g.bezierCurveTo(44, 76, 51, 78, 50, 84);
  g.bezierCurveTo(53, 82, 55, 76, 54, 71);
  g.bezierCurveTo(52, 63, 47, 61, 41, 60);
  g.bezierCurveTo(28, 57, 19, 48, 17, 37);     // left of the skull
  g.bezierCurveTo(15, 21, 30, 8, 50, 8);
  g.closePath();
  g.fill();

  // the ear, a shade back from the skull
  g.beginPath();
  g.moveTo(69, 17);
  g.bezierCurveTo(83, 13, 93, 22, 91, 34);
  g.bezierCurveTo(89, 45, 79, 50, 71, 45);
  g.bezierCurveTo(67, 42, 66, 34, 68, 26);
  g.closePath();
  g.fillStyle = 'rgba(24,66,100,0.85)';
  g.fill();

  // tusk
  g.beginPath();
  g.moveTo(58, 64);
  g.bezierCurveTo(67, 66, 71, 72, 69, 79);
  g.bezierCurveTo(67, 73, 63, 69, 56, 68);
  g.closePath();
  g.fillStyle = '#EAF2F8';
  g.fill();

  dot(g, 39, 32, 5.4, '#F2F7FB');
  dot(g, 40.4, 32.8, 2.5, '#16334A');
}

/**
 * Supabase — the two wedges of the bolt. The lower wedge is the solid one and
 * the upper is the lighter pass, exactly as the mark is built; the second
 * wedge is the first rotated a half turn about the mark's centre.
 */
function supabase(g) {
  // authored in the mark's own 109 x 113 box, then fitted to 100 x 100
  const S = 100 / 113;
  g.save();
  g.translate(50 - 54.5 * S, 50 - 56.45 * S);
  g.scale(S, S);

  const wedge = () => {
    g.beginPath();
    g.moveTo(54.5, 72.8);
    g.lineTo(54.5, 8.0);
    g.quadraticCurveTo(54.3, 1.4, 49.2, 1.9);
    g.quadraticCurveTo(46.6, 2.2, 45.0, 4.2);
    g.lineTo(3.6, 58.0);
    g.quadraticCurveTo(-1.6, 65.6, 3.9, 70.7);
    g.quadraticCurveTo(6.2, 72.8, 9.8, 72.8);
    g.closePath();
  };

  // lower wedge — solid
  g.save();
  g.translate(54.5, 56.45);
  g.rotate(Math.PI);
  g.translate(-54.5, -56.45);
  wedge();
  const grad = g.createLinearGradient(50, 40, 105, 112);
  grad.addColorStop(0, '#249361');
  grad.addColorStop(1, '#3ECF8E');
  g.fillStyle = grad;
  g.fill();
  g.restore();

  // upper wedge — the lighter pass
  wedge();
  g.fillStyle = 'rgba(62, 207, 142, 0.80)';
  g.fill();
  g.restore();
}

/** AWS — the wordmark over the smile arrow. */
function aws(g) {
  g.fillStyle = '#f2f2f2';
  tracked(g, 'aws', 50, 48, 42, '700', -0.5, 74);

  g.fillStyle = '#FF9900';
  // the smile: a crescent that thickens to the right and lifts into a head
  g.beginPath();
  g.moveTo(9, 63);
  g.bezierCurveTo(28, 83, 62, 86, 83, 70);
  g.lineTo(88, 66.5);
  g.lineTo(95, 79);
  g.lineTo(80.5, 79);
  g.lineTo(84, 74.6);
  g.bezierCurveTo(62, 89, 27, 86, 9, 66.5);
  g.closePath();
  g.fill();
}

/** Docker — the containers stacked on the whale. */
function docker(g) {
  const C = '#2496ED';
  g.fillStyle = C;

  // containers: four across the deck, three above, one on top
  const w = 14.4;
  const h = 12.4;
  const gap = 1.6;
  const x0 = 16;
  const y0 = 46;
  const box = (col, row) => {
    g.beginPath();
    rr(g, x0 + col * (w + gap), y0 - row * (h + gap), w, h, 1.6);
    g.fill();
  };
  for (let c = 0; c < 4; c++) box(c, 0);
  for (let c = 1; c < 4; c++) box(c, 1);
  box(2, 2);

  // the whale beneath them
  g.beginPath();
  g.moveTo(6, 60);
  g.lineTo(78, 60);
  g.bezierCurveTo(88, 60, 94, 65, 96, 71);   // snout
  g.bezierCurveTo(92, 74, 86, 74, 82, 71);   // the lip under the snout
  g.bezierCurveTo(78, 80, 68, 85, 54, 85);
  g.lineTo(26, 85);
  g.bezierCurveTo(14, 85, 6, 76, 6, 66);
  g.closePath();
  g.fill();

  // tail fluke, left
  g.beginPath();
  g.moveTo(10, 61);
  g.bezierCurveTo(2, 56, 0, 46, 3, 40);
  g.bezierCurveTo(9, 45, 15, 52, 17, 60);
  g.closePath();
  g.fill();

  // spout
  g.beginPath();
  g.moveTo(84, 57);
  g.bezierCurveTo(84, 48, 92, 46, 93, 39);
  g.strokeStyle = C;
  g.lineWidth = 3.4;
  g.lineCap = 'round';
  g.stroke();

  dot(g, 88, 68, 2.4, '#08131c');
}

/** Terraform — the three parallelograms. */
function terraform(g) {
  const w = 30.3;
  const h = 34.1;
  const k = 12.3;
  const gap = 3.3;
  const ax = 18;
  const ay = 26.6;
  const cell = (x, y) => poly(g, [
    [x, y], [x + w, y - k], [x + w, y - k + h], [x, y + h],
  ]);
  g.fillStyle = '#7B42BC';
  cell(ax, ay);                       // upper left
  g.fill();
  cell(ax + w + gap, ay - k);         // upper right
  g.fill();
  cell(ax, ay + h + gap);             // lower left
  g.fill();
}

/** Claude and OpenAI arrive as raster mattes; see cards.js. */

// --------------------------------------------------------------------------

export const MARKS = {
  react, next, typescript, node, python, postgres, supabase, aws, docker,
  terraform,
};

/**
 * A tool with no honest mark gets a monogram tile: the same rounded square the
 * icon marks sit in, set in the deck's own typeface. It reads as "a tool
 * without a logo", which is true, instead of as an invented one.
 */
export function monogram(g, lines, tint) {
  const rows = Array.isArray(lines) ? lines : [lines];
  const c = `rgba(${tint.map((v) => Math.round(v * 255)).join(',')}`;

  g.beginPath();
  rr(g, 3, 3, 94, 94, 12);
  const bg = g.createLinearGradient(0, 3, 0, 97);
  bg.addColorStop(0, '#232025');
  bg.addColorStop(1, '#15120f');
  g.fillStyle = bg;
  g.fill();
  g.lineWidth = 2.2;
  g.strokeStyle = `${c},0.34)`;
  g.stroke();

  const size = rows.length > 1 ? 25 : 34;
  g.font = `500 ${size}px Oswald, ${GROTESQUE}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#e6ddd5';
  const y0 = 50 - (rows.length - 1) * size * 0.52;
  rows.forEach((row, i) => {
    const text = [...row].join('\u2009');
    const wide = g.measureText(text).width;
    g.save();
    g.translate(50, y0 + i * size * 1.04);
    if (wide > 68) g.scale(68 / wide, 1);
    g.fillText(text, 0, 0);
    g.restore();
  });

  // a hairline under the letters, the same rule every icon-less tile carries
  g.fillStyle = `${c},0.55)`;
  g.fillRect(34, 78, 32, 1.8);
}
