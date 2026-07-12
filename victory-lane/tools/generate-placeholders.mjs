// Generates placeholder frame sequences (gold wireframe "hologram" style) so the
// scroll-scrub site is fully testable before the real Google Flow footage arrives.
// Output: ../frames/<seq>/<seq>_0001.jpg ... + manifest.json per sequence.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1280, H = 720;
const GOLD = '#d4af37', GOLD_DIM = '#8a6f1f';

// ---------- tiny deterministic rng ----------
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- 3d helpers ----------
const rotY = ([x, y, z], a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c * x + s * z, y, -s * x + c * z];
};
const rotX = ([x, y, z], a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, c * y - s * z, s * y + c * z];
};
function project([x, y, z], { f = 640, D = 8.5, cx = W / 2, cy = 430, lift = 0.72 } = {}) {
  const zz = z + D;
  return [cx + (f * x) / zz, cy - (f * (y - lift)) / zz, zz];
}
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- car model (low-poly GT coupe wireframe) ----------
function buildCar() {
  const HW = 0.88, GW = 0.6;
  const seg = (a, b) => [a, b];
  const polyEdges = pts => pts.slice(1).map((p, i) => seg(pts[i], p));
  const at = (pts2, z) => pts2.map(([x, y]) => [x, y, z]);

  const upper = [
    [2.32, 0.52], [1.55, 0.68], [0.75, 0.8], [-1.45, 0.92],
    [-2.2, 0.88], [-2.33, 0.7], [-2.28, 0.38],
  ];
  const arch = cx => {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = Math.PI - (Math.PI * k) / 8;
      pts.push([cx + 0.45 * Math.cos(t), 0.3 + 0.45 * Math.sin(t)]);
    }
    return pts;
  };
  const sillParts = [
    [[-2.28, 0.38], [-1.87, 0.3]],
    arch(-1.42),
    [[-0.97, 0.3], [0.97, 0.3]],
    arch(1.42),
    [[1.87, 0.3], [2.3, 0.3]],
    [[2.3, 0.3], [2.32, 0.52]],
  ];
  const greenhouse = [[0.7, 0.82], [0.1, 1.16], [-0.7, 1.18], [-1.4, 0.94]];

  const groups = {};
  const sideEdges = z => {
    const e = [...polyEdges(at(upper, z))];
    for (const part of sillParts) e.push(...polyEdges(at(part, z)));
    return e;
  };
  groups.bodyL = sideEdges(-HW);
  groups.bodyR = sideEdges(HW);
  groups.greenhouse = [
    ...polyEdges(at(greenhouse, -GW)), ...polyEdges(at(greenhouse, GW)),
    seg([0.75, 0.8, -HW], [0.7, 0.82, -GW]), seg([0.75, 0.8, HW], [0.7, 0.82, GW]),
    seg([-1.45, 0.92, -HW], [-1.4, 0.94, -GW]), seg([-1.45, 0.92, HW], [-1.4, 0.94, GW]),
    seg([0.1, 1.16, -GW], [0.1, 1.16, GW]), seg([-0.7, 1.18, -GW], [-0.7, 1.18, GW]),
  ];
  groups.laterals = [
    [2.32, 0.52], [1.55, 0.68], [0.75, 0.8], [-1.45, 0.92],
    [-2.2, 0.88], [-2.33, 0.7], [-2.28, 0.38], [2.3, 0.3],
  ].map(([x, y]) => seg([x, y, -HW], [x, y, HW]));

  const wheel = (cx, z, phase) => {
    const e = [], n = 18, r = 0.3, hub = 0.075, cy = 0.33;
    const rim = [];
    for (let k = 0; k <= n; k++) {
      const t = phase + (2 * Math.PI * k) / n;
      rim.push([cx + r * Math.cos(t), cy + r * Math.sin(t), z]);
    }
    e.push(...polyEdges(rim));
    for (let k = 0; k < 5; k++) {
      const t = phase + (2 * Math.PI * k) / 5;
      e.push(seg(
        [cx + hub * Math.cos(t), cy + hub * Math.sin(t), z],
        [cx + (r - 0.02) * Math.cos(t), cy + (r - 0.02) * Math.sin(t), z]
      ));
    }
    return e;
  };
  groups.wheelFL = wheel(1.42, -HW, 0.2);
  groups.wheelFR = wheel(1.42, HW, 0.9);
  groups.wheelRL = wheel(-1.42, -HW, 1.7);
  groups.wheelRR = wheel(-1.42, HW, 2.5);
  return groups;
}
const CAR = buildCar();

// ---------- svg builders ----------
function svgOpen(extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="bg" cx="50%" cy="46%" r="75%">
    <stop offset="0%" stop-color="#16130e"/><stop offset="55%" stop-color="#0b0a08"/><stop offset="100%" stop-color="#050404"/>
  </radialGradient>
  <radialGradient id="pool" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#d4af37" stop-opacity="0.14"/><stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vin" cx="50%" cy="48%" r="72%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/><stop offset="78%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.75"/>
  </radialGradient>
  ${extraDefs}
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}
const svgClose = () => `<rect width="${W}" height="${H}" fill="url(#vin)"/></svg>`;

function drawEdges(edges, transform, proj, { reflect = true, boost = 1 } = {}) {
  let out = '', refl = '';
  for (const [a, b] of edges) {
    const A = transform(a), B = transform(b);
    const [ax, ay, az] = project(A, proj), [bx, by, bz] = project(B, proj);
    const zr = (A[2] + B[2]) / 2;
    const op = Math.max(0.12, Math.min(0.95, 0.62 - zr * 0.22)) * boost;
    const wpx = ((proj.f ?? 640) / ((az + bz) / 2)) * 0.014;
    out += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${GOLD}" stroke-opacity="${op.toFixed(2)}" stroke-width="${wpx.toFixed(2)}" stroke-linecap="round"/>`;
    const [rax, ray] = project([A[0], -A[1] + 0.06, A[2]], proj);
    const [rbx, rby] = project([B[0], -B[1] + 0.06, B[2]], proj);
    if (reflect) refl += `<line x1="${rax.toFixed(1)}" y1="${ray.toFixed(1)}" x2="${rbx.toFixed(1)}" y2="${rby.toFixed(1)}" stroke="${GOLD_DIM}" stroke-opacity="${(op * 0.16).toFixed(3)}" stroke-width="${wpx.toFixed(2)}"/>`;
  }
  return refl + out;
}

function dust(rng, i, n = 36, loopN = null) {
  let out = '';
  for (let k = 0; k < n; k++) {
    const x0 = rng() * W, y0 = rng() * H, sp = 0.15 + rng() * 0.35, ph = rng() * 6.28, r = 0.7 + rng() * 1.5;
    let y;
    if (loopN) y = y0 + 14 * Math.sin((2 * Math.PI * i) / loopN + ph);
    else y = ((y0 - i * sp) % (H + 40) + (H + 40)) % (H + 40) - 20;
    const op = 0.08 + 0.4 * Math.abs(Math.sin(i * 0.045 + ph));
    out += `<circle cx="${(x0 + 6 * Math.sin(i * 0.02 + ph)).toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${GOLD}" fill-opacity="${op.toFixed(2)}"/>`;
  }
  return out;
}

// ---------- sequences ----------
function heroFrame(i, N) {
  const th = (2 * Math.PI * i) / N + 0.6;
  const tilt = -0.16;
  const tf = p => rotX(rotY(p, th), tilt);
  let s = svgOpen();
  s += `<ellipse cx="${W / 2}" cy="560" rx="520" ry="70" fill="url(#pool)"/>`;
  s += dust(lcg(7), i);
  for (const g of Object.values(CAR)) s += drawEdges(g, tf, { f: 1050, D: 8.5, cy: 400, lift: 0.62 });
  return s + svgClose();
}

function assemblyFrame(i, N) {
  const p = easeInOutCubic(i / (N - 1));
  const th = lerp(-0.55, 0.45, i / (N - 1)) + 0.5;
  const f = lerp(880, 1000, p);
  const tf = off => pt => rotX(rotY([pt[0] + off[0] * (1 - p), pt[1] + off[1] * (1 - p), pt[2] + off[2] * (1 - p)], th), -0.14);
  const offs = {
    bodyL: [0, 0.1, -2.1], bodyR: [0, 0.1, 2.1], greenhouse: [0, 1.7, 0],
    laterals: [0, -0.9, 0], wheelFL: [1.3, 0.7, -2.9], wheelFR: [1.3, 0.7, 2.9],
    wheelRL: [-1.3, 0.7, -2.9], wheelRR: [-1.3, 0.7, 2.9],
  };
  let s = svgOpen();
  s += `<ellipse cx="${W / 2}" cy="505" rx="${(300 + 140 * p).toFixed(0)}" ry="55" fill="url(#pool)" opacity="${p.toFixed(2)}"/>`;
  s += dust(lcg(21), i);
  for (const [name, g] of Object.entries(CAR)) s += drawEdges(g, tf(offs[name]), { f, D: 8.5 }, { reflect: p > 0.85 });
  return s + svgClose();
}

function macroFrame(i, N) {
  const t = i / (N - 1);
  const camX = t * 1920, bobY = 12 * Math.sin(i * 0.05);
  const defs = `<linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="50%" stop-color="#f5e3ae" stop-opacity="0.10"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>
  </linearGradient><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>`;
  let s = svgOpen(defs);
  const rng = lcg(99);
  // brushed metal streaks (parallax 0.5)
  let g = `<g transform="translate(${(-camX * 0.5).toFixed(1)},0)">`;
  for (let k = 0; k < 90; k++) {
    const y = rng() * H, x = rng() * 3600, len = 150 + rng() * 500;
    g += `<rect x="${x.toFixed(0)}" y="${(y + bobY * 0.4).toFixed(1)}" width="${len.toFixed(0)}" height="1" fill="#cbb87a" opacity="${(0.02 + rng() * 0.07).toFixed(3)}"/>`;
  }
  s += g + '</g>';
  // main layer
  s += `<g transform="translate(${(-camX).toFixed(1)},${bobY.toFixed(1)})">`;
  // zone A: honeycomb grille
  const hr = 44;
  for (let row = 0; row < 7; row++) for (let col = 0; col < 12; col++) {
    const hx = 60 + col * hr * 1.62 + (row % 2) * hr * 0.81, hy = 90 + row * hr * 1.42;
    const pts = Array.from({ length: 6 }, (_, k) => {
      const a = Math.PI / 6 + (k * Math.PI) / 3;
      return `${(hx + hr * Math.cos(a)).toFixed(1)},${(hy + hr * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${GOLD}" stroke-opacity="${(0.1 + 0.25 * Math.abs(Math.sin(col * 0.9 + row))).toFixed(2)}" stroke-width="1.4"/>`;
  }
  // zone B: turbo impeller
  const icx = 1720, icy = 370, rot = i * 0.022;
  s += `<circle cx="${icx}" cy="${icy}" r="262" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="2.5"/>`;
  s += `<circle cx="${icx}" cy="${icy}" r="286" fill="none" stroke="${GOLD_DIM}" stroke-opacity="0.3" stroke-width="1.2"/>`;
  s += `<circle cx="${icx}" cy="${icy}" r="44" fill="none" stroke="${GOLD}" stroke-opacity="0.7" stroke-width="2.5"/>`;
  for (let k = 0; k < 12; k++) {
    const a = rot + (2 * Math.PI * k) / 12;
    const x1 = icx + 46 * Math.cos(a), y1 = icy + 46 * Math.sin(a);
    const xm = icx + 160 * Math.cos(a + 0.45), ym = icy + 160 * Math.sin(a + 0.45);
    const x2 = icx + 254 * Math.cos(a + 0.75), y2 = icy + 254 * Math.sin(a + 0.75);
    s += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${xm.toFixed(1)} ${ym.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="2.4"/>`;
  }
  // zone C: brake disc + caliper
  const bcx = 2850, bcy = 380;
  s += `<circle cx="${bcx}" cy="${bcy}" r="280" fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="3"/>`;
  s += `<circle cx="${bcx}" cy="${bcy}" r="172" fill="none" stroke="${GOLD_DIM}" stroke-opacity="0.4" stroke-width="1.5"/>`;
  for (let k = 0; k < 28; k++) {
    const a = i * 0.012 + (2 * Math.PI * k) / 28;
    s += `<line x1="${(bcx + 178 * Math.cos(a)).toFixed(1)}" y1="${(bcy + 178 * Math.sin(a)).toFixed(1)}" x2="${(bcx + 268 * Math.cos(a + 0.09)).toFixed(1)}" y2="${(bcy + 268 * Math.sin(a + 0.09)).toFixed(1)}" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1.6"/>`;
  }
  for (let k = 0; k < 5; k++) {
    const a = i * 0.012 + (2 * Math.PI * k) / 5;
    s += `<circle cx="${(bcx + 96 * Math.cos(a)).toFixed(1)}" cy="${(bcy + 96 * Math.sin(a)).toFixed(1)}" r="13" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="2"/>`;
  }
  s += `<path d="M ${bcx - 320} ${bcy - 150} A 340 340 0 0 1 ${bcx - 40} ${bcy - 338}" fill="none" stroke="${GOLD}" stroke-opacity="0.75" stroke-width="26" stroke-linecap="round" filter="url(#soft)"/>`;
  s += '</g>';
  // travelling light beam
  s += `<rect x="${(-500 + t * 2100).toFixed(0)}" y="0" width="560" height="${H}" fill="url(#beam)" transform="skewX(-18)"/>`;
  s += dust(lcg(55), i, 26);
  return s + svgClose();
}

function atmosphereFrame(i, N) {
  const th = 0.52, tf = p => rotX(rotY(p, th), -0.1);
  const defs = `<linearGradient id="spot" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#f7ecc8" stop-opacity="0.22"/><stop offset="70%" stop-color="#d4af37" stop-opacity="0.05"/><stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
  </linearGradient><filter id="smk" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>`;
  let s = svgOpen(defs);
  s += `<polygon points="${W / 2 - 130},-10 ${W / 2 + 130},-10 ${W / 2 + 400},${H} ${W / 2 - 400},${H}" fill="url(#spot)"/>`;
  s += `<ellipse cx="${W / 2}" cy="560" rx="480" ry="62" fill="url(#pool)"/>`;
  for (const g of Object.values(CAR)) s += drawEdges(g, tf, { f: 900, D: 8.8, cy: 415, lift: 0.62 });
  const rng = lcg(133);
  for (let k = 0; k < 9; k++) {
    const x0 = 200 + rng() * 880, y0 = 150 + rng() * 380, ph = rng() * 6.28;
    const rx = 110 + rng() * 150, ry = 26 + rng() * 40;
    const x = x0 + 70 * Math.sin((2 * Math.PI * i) / N + ph);
    const y = y0 + 16 * Math.cos((2 * Math.PI * i) / N + ph * 1.7);
    const op = 0.035 + 0.03 * Math.sin((2 * Math.PI * i) / N + ph * 2.3) ** 2;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="#e8dcb8" fill-opacity="${op.toFixed(3)}" filter="url(#smk)"/>`;
  }
  s += dust(lcg(77), i, 30, N);
  return s + svgClose();
}

// ---------- render loop ----------
const SEQS = [
  { name: 'hero', count: 192, fn: heroFrame },
  { name: 'macro', count: 160, fn: macroFrame },
  { name: 'assembly', count: 192, fn: assemblyFrame },
  { name: 'atmosphere', count: 120, fn: atmosphereFrame },
];

const pool = async (jobs, limit = 8) => {
  const queue = [...jobs];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await queue.shift()();
  }));
};

for (const { name, count, fn } of SEQS) {
  const dir = join(ROOT, 'frames', name);
  mkdirSync(dir, { recursive: true });
  const jobs = Array.from({ length: count }, (_, i) => async () => {
    const svg = fn(i, count);
    await sharp(Buffer.from(svg)).jpeg({ quality: 72, mozjpeg: true })
      .toFile(join(dir, `${name}_${String(i + 1).padStart(4, '0')}.jpg`));
  });
  const t0 = Date.now();
  await pool(jobs);
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ count, pattern: `${name}_%04d.jpg`, placeholder: true }));
  console.log(`${name}: ${count} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
console.log('done');
