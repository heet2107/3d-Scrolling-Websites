// Act IV — the project screens, drawn rather than photographed.
//
// There is no screenshot of any of this work, so every plate is BUILT: each
// one is a small piece of interface assembled from the shapes that particular
// piece of software would actually put on a screen. `art` in content.js picks
// which interface, `tint` picks its colour, and every word that names anything
// comes from the project's own entry. The only literal strings written here
// are instrument labels — a record light, a timecode, a relevance score — the
// furniture any such screen carries regardless of whose product it is.
//
// All seven land in ONE atlas, exactly as act two's card plates do: a single
// upload and a single bind, so the deck and its floor reflection can both be
// drawn without the driver switching texture state between plates.

import { PROJECTS } from '../data/content.js';

const TILE_W = 960;
const TILE_H = 600;
const COLS = 3;

const PAPER = '#f2f0ee';
const TAU = Math.PI * 2;

/**
 * A plate has to look identical on every reload. A Math.random() anywhere in
 * a draw call would re-roll all seven every visit, so nothing here would ever
 * be composed — it would just be different. Every irregular length, height and
 * amplitude below comes out of this, seeded by the plate's index.
 */
function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rgba = (t, a) =>
  `rgba(${Math.round(t[0] * 255)},${Math.round(t[1] * 255)},${Math.round(t[2] * 255)},${a})`;
const ink = (a) => `rgba(242,240,238,${a})`;

const OSW = (w, px) => `${w} ${px}px Oswald, 'Arial Narrow', sans-serif`;
const ANT = (px) => `400 ${px}px Anton, Impact, sans-serif`;
// the only face on the site that is neither Anton nor Oswald: the law plate is
// a document, and a document set in the same condensed sans as an analytics
// dashboard is just a differently coloured dashboard
const SERIF = (w, px) => `${w} ${px}px Georgia, 'Times New Roman', serif`;

// --------------------------------------------------------------------------
// Primitives

function rr(g, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k);
  g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k);
  g.arcTo(x, y, x + w, y, k);
  g.closePath();
}

function fill(g, x, y, w, h, col, r = 0) {
  g.fillStyle = col;
  if (r) { rr(g, x, y, w, h, r); g.fill(); } else g.fillRect(x, y, w, h);
}

function stroke(g, x, y, w, h, col, r = 0, lw = 1) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  if (r) { rr(g, x, y, w, h, r); g.stroke(); }
  else g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function seg(g, x1, y1, x2, y2, col, lw = 1) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function disc(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}

/** A run of word-shaped bars across `w`. This is what body text looks like at
 *  the size these plates are actually seen from — setting real sentences here
 *  would be a paragraph of unreadable grey mush pretending to be information. */
function words(g, x, y, w, h, r, col, gap = 7, min = 16) {
  g.fillStyle = col;
  let cx = x;
  while (cx < x + w - min) {
    const wd = Math.min(min + r() * (w * 0.28), x + w - cx);
    g.fillRect(cx, y, wd, h);
    cx += wd + gap;
  }
}

function para(g, x, y, w, rows, lh, r, col, h = 7) {
  for (let i = 0; i < rows; i++) {
    const last = i === rows - 1;
    words(g, x, y + i * lh, last ? w * (0.38 + r() * 0.24) : w, h, r, col);
  }
}

/** Auto-shrink so a long project name never runs out of its own plate. */
function fitFont(g, text, maxW, size, font, floor = 10) {
  let s = size;
  g.font = font(s);
  while (g.measureText(text).width > maxW && s > floor) {
    s -= 1;
    g.font = font(s);
  }
  return s;
}

function tracked(g, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    g.fillText(ch, cx, y);
    cx += g.measureText(ch).width + spacing;
  }
  return cx - spacing - x;
}

// --------------------------------------------------------------------------
// Glyphs. Everything an interface leans on that is not a word.

function tick(g, x, y, s, col, lw = 2) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x, y + s * 0.52);
  g.lineTo(x + s * 0.36, y + s * 0.86);
  g.lineTo(x + s, y + s * 0.12);
  g.stroke();
  g.lineCap = 'butt';
}

function lock(g, x, y, s, col) {
  g.strokeStyle = col;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(x + s * 0.5, y + s * 0.42, s * 0.26, Math.PI, TAU);
  g.stroke();
  fill(g, x + s * 0.14, y + s * 0.42, s * 0.72, s * 0.52, col, 2);
}

function shield(g, x, y, s, col, lw = 2) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x + s * 0.5, y);
  g.lineTo(x + s, y + s * 0.22);
  g.lineTo(x + s, y + s * 0.58);
  g.quadraticCurveTo(x + s, y + s * 0.9, x + s * 0.5, y + s);
  g.quadraticCurveTo(x, y + s * 0.9, x, y + s * 0.58);
  g.lineTo(x, y + s * 0.22);
  g.closePath();
  g.stroke();
}

function page(g, x, y, w, h, col) {
  const c = Math.min(w, h) * 0.32;
  g.strokeStyle = col;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w - c, y);
  g.lineTo(x + w, y + c);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  g.stroke();
  seg(g, x + w - c, y, x + w - c, y + c, col, 1.3);
  seg(g, x + w - c, y + c, x + w, y + c, col, 1.3);
}

function magnifier(g, x, y, s, col) {
  g.strokeStyle = col;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(x + s * 0.42, y + s * 0.42, s * 0.34, 0, TAU);
  g.moveTo(x + s * 0.68, y + s * 0.68);
  g.lineTo(x + s * 0.95, y + s * 0.95);
  g.stroke();
}

function caret(g, x, y, w, h, col) {
  fill(g, x, y, w, h, col);
}

// --------------------------------------------------------------------------
// Chrome. Two kinds — a browser window and an application shell — because a
// marketing site and a console are not the same object, and seven plates in
// identical frames would read as one product with seven skins.

function browserFrame(g, p, tint) {
  const bar = 46;
  fill(g, 0, 0, TILE_W, TILE_H, '#070605');

  const top = g.createLinearGradient(0, 0, 0, bar);
  top.addColorStop(0, '#191412');
  top.addColorStop(1, '#0d0a09');
  g.fillStyle = top;
  g.fillRect(0, 0, TILE_W, bar);

  for (let i = 0; i < 3; i++) {
    disc(g, 26 + i * 19, bar * 0.5, 5, i === 0 ? rgba(tint, 0.8) : ink(0.14));
  }

  // the tab carries the project's own name — nothing on these plates invents
  // what the product is called
  const tabW = 250;
  const tabX = 104;
  g.fillStyle = '#070605';
  rr(g, tabX, 10, tabW, bar - 10, 7);
  g.fill();
  fill(g, tabX + 16, bar * 0.5 - 5.5, 11, 11, rgba(tint, 0.85), 2);
  g.fillStyle = ink(0.78);
  g.font = OSW(500, 15);
  g.textBaseline = 'middle';
  const nameW = Math.min(g.measureText(p.name).width, tabW - 64);
  g.save();
  g.beginPath();
  g.rect(tabX + 34, 0, tabW - 52, bar);
  g.clip();
  g.fillText(p.name, tabX + 34, bar * 0.5 + 1);
  g.restore();
  seg(g, tabX + 34 + nameW + 18, bar * 0.5 - 4, tabX + 34 + nameW + 26,
      bar * 0.5 + 4, ink(0.22), 1.4);
  seg(g, tabX + 34 + nameW + 26, bar * 0.5 - 4, tabX + 34 + nameW + 18,
      bar * 0.5 + 4, ink(0.22), 1.4);

  // the address strip: a padlock and the project's own classification
  const urlX = tabX + tabW + 26;
  fill(g, urlX, 11, 430, 24, 'rgba(255,255,255,0.045)', 12);
  lock(g, urlX + 13, 16, 13, ink(0.34));
  g.fillStyle = ink(0.42);
  g.font = OSW(400, 12);
  tracked(g, p.kind.toUpperCase(), urlX + 36, 24, 1.6);

  for (let i = 0; i < 3; i++) fill(g, TILE_W - 92 + i * 22, 21, 12, 2, ink(0.20));
  fill(g, 0, bar - 1, TILE_W, 1, 'rgba(255,255,255,0.055)');
  g.textBaseline = 'alphabetic';
  return { x: 0, y: bar, w: TILE_W, h: TILE_H - bar };
}

function appFrame(g, p, tint) {
  const rail = 82;
  const bar = 50;
  fill(g, 0, 0, TILE_W, TILE_H, '#070605');
  fill(g, 0, 0, rail, TILE_H, '#0c0907');
  fill(g, rail, 0, TILE_W - rail, bar, '#0a0807');

  // the mark, then the navigation the console would carry
  fill(g, 24, 26, 34, 34, rgba(tint, 0.9), 8);
  g.fillStyle = '#120903';
  g.font = ANT(19);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(p.name[0], 41, 44);
  g.textAlign = 'left';

  for (let i = 0; i < 5; i++) {
    const y = 108 + i * 54;
    const on = i === 1;
    if (on) {
      fill(g, 0, y - 8, 3, 40, rgba(tint, 0.95));
      fill(g, 18, y - 6, 46, 36, rgba(tint, 0.10), 8);
    }
    stroke(g, 26, y, 30, 24, on ? rgba(tint, 0.75) : ink(0.18), 5, 1.4);
    fill(g, 32, y + 7, 18, 2, on ? rgba(tint, 0.75) : ink(0.18));
    fill(g, 32, y + 13, 12, 2, on ? rgba(tint, 0.45) : ink(0.12));
  }
  disc(g, 41, TILE_H - 46, 15, ink(0.10));

  fill(g, rail, bar - 1, TILE_W - rail, 1, 'rgba(255,255,255,0.055)');
  fill(g, rail, 0, 1, TILE_H, 'rgba(255,255,255,0.05)');

  g.fillStyle = PAPER;
  g.font = OSW(500, 17);
  g.textBaseline = 'middle';
  g.fillText(p.name, rail + 26, bar * 0.5 + 1);
  g.fillStyle = ink(0.34);
  g.font = OSW(300, 12);
  g.fillText(p.sub, rail + 26 + g.measureText(p.name).width + 46, bar * 0.5 + 1);

  fill(g, TILE_W - 190, 14, 120, 22, 'rgba(255,255,255,0.04)', 11);
  magnifier(g, TILE_W - 180, 19, 13, ink(0.30));
  fill(g, TILE_W - 160, 24, 58, 2, ink(0.16));
  disc(g, TILE_W - 44, 25, 13, rgba(tint, 0.22));
  g.textBaseline = 'alphabetic';
  return { x: rail, y: bar, w: TILE_W - rail, h: TILE_H - bar };
}

/** A section heading inside a plate: a tint tick, a title, a hairline. */
function heading(g, x, y, w, text, tint, size = 13) {
  fill(g, x, y - 9, 3, 12, rgba(tint, 0.9));
  g.fillStyle = ink(0.62);
  g.font = OSW(600, size);
  const used = tracked(g, text.toUpperCase(), x + 12, y, 1.9);
  fill(g, x + 22 + used, y - 4, Math.max(0, w - used - 26), 1, ink(0.09));
}

// --------------------------------------------------------------------------
// waveform — a live transcription view.

function artWaveform(g, R, p, tint, r) {
  const x0 = R.x + 26;
  const W = R.w - 52;

  // the recording state: a hot dot, a running timecode, the live language pair
  fill(g, x0, R.y + 20, 96, 28, 'rgba(232,85,0,0.14)', 14);
  stroke(g, x0, R.y + 20, 96, 28, rgba(tint, 0.55), 14, 1.2);
  disc(g, x0 + 18, R.y + 34, 5.5, '#ff5a1a');
  disc(g, x0 + 18, R.y + 34, 10, 'rgba(255,90,26,0.16)');
  g.fillStyle = rgba(tint, 0.95);
  g.font = OSW(600, 13);
  tracked(g, 'REC', x0 + 32, R.y + 39, 1.6);

  g.fillStyle = ink(0.66);
  g.font = OSW(400, 17);
  g.fillText('00:14:07', x0 + 116, R.y + 39);

  for (let i = 0; i < 2; i++) {
    const cx = x0 + W - 176 + i * 92;
    fill(g, cx, R.y + 22, 80, 24, 'rgba(255,255,255,0.045)', 12);
    fill(g, cx + 14, R.y + 33, 52, 2, ink(0.26));
    if (i === 0) disc(g, cx - 10, R.y + 34, 3, rgba(tint, 0.7));
  }

  // ---- the trace ---------------------------------------------------------
  const tx = x0;
  const ty = R.y + 68;
  const tw = W - 306;
  const th = 196;
  fill(g, tx, ty, tw, th, 'rgba(255,255,255,0.022)', 4);
  stroke(g, tx, ty, tw, th, 'rgba(255,255,255,0.06)', 4);
  for (let i = 1; i < 6; i++) {
    seg(g, tx + (tw / 6) * i, ty + 8, tx + (tw / 6) * i, ty + th - 8,
        'rgba(255,255,255,0.035)');
  }
  const mid = ty + th * 0.5;
  seg(g, tx + 6, mid, tx + tw - 6, mid, rgba(tint, 0.18));

  // four fixed partials with seeded phases: an audio trace is an envelope with
  // structure inside it, and pure per-bar noise reads as a barcode instead
  const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU];
  const head = 0.78;
  const pitch = 4;
  const n = Math.floor((tw - 20) / pitch);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const env = 0.30 + 0.70 * Math.abs(
      Math.sin(u * 9.1 + ph[0]) * 0.5 + Math.sin(u * 23.7 + ph[1]) * 0.3
      + Math.sin(u * 51.3 + ph[2]) * 0.2);
    const grain = 0.55 + 0.45 * Math.sin(u * 141.0 + ph[3]);
    const live = u < head;
    const a = live ? env * grain * (th * 0.42) : 1.5;
    const x = tx + 10 + i * pitch;
    const near = 1 - Math.min(1, (head - u) / 0.22);
    g.fillStyle = live
      ? rgba(tint, 0.34 + 0.62 * Math.max(0, near))
      : ink(0.055);
    g.fillRect(x, mid - a, 2, a * 2);
  }
  // the head itself, where sound is arriving now
  const hx = tx + 10 + n * pitch * head;
  const glow = g.createLinearGradient(hx - 46, 0, hx + 8, 0);
  glow.addColorStop(0, rgba(tint, 0));
  glow.addColorStop(1, rgba(tint, 0.22));
  g.fillStyle = glow;
  g.fillRect(hx - 46, ty + 4, 54, th - 8);
  seg(g, hx, ty + 4, hx, ty + th - 4, 'rgba(255,226,184,0.92)', 2);
  disc(g, hx, ty + 10, 4, '#ffe2b8');

  // ---- what the model pulled out of it -----------------------------------
  const px = tx + tw + 24;
  const pw = R.x + R.w - 26 - px;
  fill(g, px, ty, pw, th, 'rgba(255,255,255,0.018)', 4);
  stroke(g, px, ty, pw, th, 'rgba(255,255,255,0.055)', 4);
  heading(g, px + 18, ty + 30, pw - 36, 'extracted', tint, 12);
  for (let i = 0; i < 4; i++) {
    const y = ty + 56 + i * 34;
    tick(g, px + 18, y, 12, rgba(tint, i === 3 ? 0.35 : 0.85), 1.8);
    words(g, px + 40, y + 4, pw - 76, 6, r, ink(i === 3 ? 0.16 : 0.34), 6, 14);
  }
  const bh = ty + th - 34;
  for (let i = 0; i < 3; i++) {
    fill(g, px + 18 + i * 58, bh, 48, 16, rgba(tint, 0.10), 8);
    fill(g, px + 26 + i * 58, bh + 7, 32, 2, rgba(tint, 0.5));
  }

  // ---- the transcript ----------------------------------------------------
  const cy = ty + th + 34;
  heading(g, x0, cy, W, 'transcript', tint, 12);
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const y = cy + 26 + i * 42;
    const live = i === rows - 1;
    const a = live ? 0.80 : 0.20 + i * 0.045;
    g.fillStyle = rgba(tint, live ? 0.95 : 0.34);
    g.font = OSW(500, 13);
    g.fillText(`00:${String(1 + i * 3).padStart(2, '0')}`, x0, y + 9);
    disc(g, x0 + 62, y + 5, 4.5, i % 2 ? ink(0.20) : rgba(tint, 0.55));
    fill(g, x0 + 74, y - 1, 2, 12, ink(0.10));
    const wide = W - 108 - (live ? 0 : r() * 150);
    words(g, x0 + 88, y, wide, 9, r, ink(a), 8, 22);
    if (live) fill(g, x0 + 88 + wide + 8, y - 2, 8, 13, rgba(tint, 0.9));
  }
}

// --------------------------------------------------------------------------
// shield — a security console.

function artShield(g, R, p, tint, r) {
  const x0 = R.x + 26;
  const W = R.w - 52;

  shield(g, x0, R.y + 18, 26, rgba(tint, 0.9), 2);
  tick(g, x0 + 7, R.y + 26, 12, rgba(tint, 0.9), 1.8);
  heading(g, x0 + 40, R.y + 40, 250, 'posture', tint, 13);

  const COLS_N = 4;
  const ROWS_N = 4;
  const passes = COLS_N * ROWS_N - 1;
  const pill = `${passes}/${COLS_N * ROWS_N - 1}`;
  const pw = 86;
  fill(g, R.x + R.w - 26 - pw, R.y + 20, pw, 28, rgba(tint, 0.14), 14);
  stroke(g, R.x + R.w - 26 - pw, R.y + 20, pw, 28, rgba(tint, 0.5), 14, 1.2);
  tick(g, R.x + R.w - 26 - pw + 14, R.y + 27, 13, rgba(tint, 0.95), 2);
  g.fillStyle = rgba(tint, 0.95);
  g.font = OSW(600, 14);
  g.fillText(pill, R.x + R.w - 26 - pw + 36, R.y + 39);

  // ---- the matrix of checks ---------------------------------------------
  const mw = 428;
  const cw = (mw - 3 * 10) / COLS_N;
  const ch = 62;
  const my = R.y + 66;
  for (let i = 0; i < COLS_N * ROWS_N; i++) {
    const cx = x0 + (i % COLS_N) * (cw + 10);
    const cyy = my + Math.floor(i / COLS_N) * (ch + 10);
    const pending = i === COLS_N * ROWS_N - 1;
    fill(g, cx, cyy, cw, ch, pending ? 'rgba(255,255,255,0.02)' : rgba(tint, 0.055), 5);
    stroke(g, cx, cyy, cw, ch, pending ? ink(0.10) : rgba(tint, 0.26), 5, 1.1);
    if (pending) {
      // one check still running, so the board reads as live rather than a
      // finished certificate
      g.strokeStyle = rgba(tint, 0.55);
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx + 18, cyy + 22, 7, -1.2, 1.9);
      g.stroke();
    } else {
      tick(g, cx + 11, cyy + 14, 14, rgba(tint, 0.9), 2);
    }
    fill(g, cx + 11, cyy + 40, cw - 22 - r() * 18, 5, ink(pending ? 0.12 : 0.30));
  }

  // ---- the org boundary --------------------------------------------------
  const by = my + ROWS_N * (ch + 10) + 12;
  const bh = R.y + R.h - 30 - by;
  g.save();
  g.setLineDash([7, 6]);
  stroke(g, x0, by, mw * 0.62, bh, rgba(tint, 0.45), 8, 1.3);
  g.restore();
  fill(g, x0 + 18, by - 9, 74, 18, '#070605');
  lock(g, x0 + 22, by - 8, 15, rgba(tint, 0.8));
  fill(g, x0 + 42, by - 2, 44, 3, rgba(tint, 0.55));

  const inner = [[62, 0.34], [124, 0.62], [96, 0.24], [172, 0.48], [138, 0.78]];
  for (let i = 0; i < inner.length; i++) {
    const nx = x0 + 34 + inner[i][0];
    const ny = by + 24 + inner[i][1] * (bh - 52);
    if (i) {
      seg(g, x0 + 34 + inner[i - 1][0], by + 24 + inner[i - 1][1] * (bh - 52),
          nx, ny, rgba(tint, 0.30), 1.2);
    }
    disc(g, nx, ny, 6, rgba(tint, 0.85));
    disc(g, nx, ny, 11, rgba(tint, 0.16));
  }
  // and the request from outside it that never lands
  const ox = x0 + mw * 0.62 + 68;
  const oy = by + bh * 0.5;
  disc(g, ox, oy - 22, 6, ink(0.22));
  disc(g, ox, oy + 24, 6, ink(0.22));
  seg(g, ox, oy - 22, ox, oy + 24, ink(0.14), 1.2);
  g.save();
  g.setLineDash([5, 5]);
  seg(g, ox - 8, oy, x0 + mw * 0.62 + 8, oy, 'rgba(232,85,0,0.55)', 1.4);
  g.restore();
  const bx = (ox - 8 + x0 + mw * 0.62 + 8) * 0.5;
  seg(g, bx - 7, oy - 7, bx + 7, oy + 7, '#e85500', 2);
  seg(g, bx + 7, oy - 7, bx - 7, oy + 7, '#e85500', 2);

  // ---- the document rail -------------------------------------------------
  const rx = x0 + mw + 40;
  const rw = x0 + W - rx;
  heading(g, rx, R.y + 40, rw, 'documents', tint, 12);
  for (let i = 0; i < 3; i++) {
    const y = R.y + 58 + i * 40;
    fill(g, rx, y, rw, 32, 'rgba(255,255,255,0.025)', 4);
    page(g, rx + 12, y + 7, 15, 18, rgba(tint, 0.7));
    fill(g, rx + 38, y + 11, rw * (0.36 + r() * 0.3), 5, ink(0.34));
    fill(g, rx + 38, y + 20, rw * 0.22, 4, ink(0.16));
    tick(g, rx + rw - 26, y + 10, 11, rgba(tint, 0.6), 1.6);
  }

  let cy = R.y + 190;
  const bubble = (side, h, lines) => {
    const w = rw * 0.86;
    const x = side ? rx + rw - w : rx;
    fill(g, x, cy, w, h, side ? rgba(tint, 0.13) : 'rgba(255,255,255,0.035)',
         10);
    if (side) stroke(g, x, cy, w, h, rgba(tint, 0.4), 10, 1);
    para(g, x + 14, cy + 14, w - 28, lines, 14, r,
         side ? rgba(tint, 0.75) : ink(0.34), 6);
    cy += h + 12;
  };
  bubble(false, 74, 4);
  bubble(true, 46, 2);
  bubble(false, 88, 5);
  // the citation the answer came back with
  fill(g, rx + 14, cy - 26, 96, 18, rgba(tint, 0.16), 9);
  page(g, rx + 22, cy - 22, 9, 11, rgba(tint, 0.8));
  fill(g, rx + 36, cy - 18, 62, 3, rgba(tint, 0.6));

  const iy = R.y + R.h - 56;
  fill(g, rx, iy, rw, 40, 'rgba(255,255,255,0.03)', 20);
  stroke(g, rx, iy, rw, 40, ink(0.10), 20, 1);
  fill(g, rx + 20, iy + 13, 2, 14, rgba(tint, 0.9));
  fill(g, rx + 30, iy + 18, rw * 0.4, 4, ink(0.16));
  disc(g, rx + rw - 24, iy + 20, 13, rgba(tint, 0.85));
}

// --------------------------------------------------------------------------
// graph — a reasoning graph with the retrieval that feeds it.

function artGraph(g, R, p, tint, r) {
  const x0 = R.x + 26;
  const W = R.w - 52;
  const pw = 300;
  const gw = W - pw - 34;

  heading(g, x0, R.y + 40, gw, 'reasoning', tint, 13);

  const top = R.y + 62;
  const hgt = R.h - 92;
  const cy = top + hgt * 0.5;

  // dotted ground, so the branches sit in a space rather than on a black page
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = x0 + 8; x < x0 + gw; x += 26) {
    for (let y = top + 8; y < top + hgt; y += 26) g.fillRect(x, y, 1.4, 1.4);
  }

  const L1 = [-0.34, 0, 0.34];
  const L2 = [-0.44, -0.19, 0.04, 0.22, 0.46];
  const nx1 = x0 + gw * 0.26;
  const nx2 = x0 + gw * 0.56;
  const nx3 = x0 + gw * 0.84;
  const rootX = x0 + 26;
  const chosen = { l1: 1, l2: 2 };

  const edge = (ax, ay, bx, by, hot) => {
    g.strokeStyle = hot ? rgba(tint, 0.9) : rgba(tint, 0.17);
    g.lineWidth = hot ? 2.4 : 1.2;
    g.beginPath();
    g.moveTo(ax, ay);
    g.bezierCurveTo((ax + bx) * 0.5, ay, (ax + bx) * 0.5, by, bx, by);
    g.stroke();
  };
  const node = (x, y, w, h, hot, dim) => {
    fill(g, x, y - h * 0.5, w, h, hot ? rgba(tint, 0.20) : 'rgba(255,255,255,0.035)', 6);
    stroke(g, x, y - h * 0.5, w, h, hot ? rgba(tint, 0.95) : ink(0.14), 6, hot ? 1.6 : 1);
    fill(g, x + 10, y - 5, 4, 10, hot ? rgba(tint, 0.95) : rgba(tint, 0.35));
    fill(g, x + 20, y - 4, w * (dim ? 0.36 : 0.52), 4, ink(hot ? 0.62 : 0.22));
    fill(g, x + 20, y + 3, w * 0.30, 3, ink(hot ? 0.30 : 0.12));
  };

  for (let i = 0; i < L1.length; i++) {
    const y = cy + L1[i] * hgt;
    edge(rootX + 18, cy, nx1, y, i === chosen.l1);
  }
  for (let i = 0; i < L2.length; i++) {
    const parent = Math.min(L1.length - 1, Math.floor(i * L1.length / L2.length));
    const py = cy + L1[parent] * hgt;
    const y = cy + L2[i] * hgt;
    edge(nx1 + 104, py, nx2, y, i === chosen.l2 && parent === chosen.l1);
  }
  for (let i = 0; i < 3; i++) {
    const src = [0, chosen.l2, 4][i];
    const y = cy + L2[src] * hgt;
    edge(nx2 + 96, y, nx3, cy + (i - 1) * hgt * 0.30, i === 1);
  }

  disc(g, rootX + 2, cy, 15, rgba(tint, 0.95));
  disc(g, rootX + 2, cy, 24, rgba(tint, 0.13));
  fill(g, rootX - 4, cy - 3, 12, 6, '#0a0705', 3);

  for (let i = 0; i < L1.length; i++) node(nx1, cy + L1[i] * hgt, 104, 34, i === chosen.l1);
  for (let i = 0; i < L2.length; i++) node(nx2, cy + L2[i] * hgt, 96, 30, i === chosen.l2);
  for (let i = 0; i < 3; i++) {
    const y = cy + (i - 1) * hgt * 0.30;
    fill(g, nx3, y - 13, 66, 26, i === 1 ? rgba(tint, 0.85) : 'rgba(255,255,255,0.05)', 13);
    fill(g, nx3 + 14, y - 2, 38, 4, i === 1 ? '#160b02' : ink(0.24));
  }

  // ---- retrieval ---------------------------------------------------------
  const px = x0 + gw + 34;
  heading(g, px, R.y + 40, pw, 'retrieval', tint, 12);
  fill(g, px, R.y + 56, pw, 38, 'rgba(255,255,255,0.035)', 19);
  stroke(g, px, R.y + 56, pw, 38, ink(0.12), 19, 1);
  magnifier(g, px + 15, R.y + 68, 15, rgba(tint, 0.7));
  fill(g, px + 40, R.y + 73, pw * 0.44, 4, ink(0.28));
  fill(g, px + 40 + pw * 0.44 + 6, R.y + 68, 2, 14, rgba(tint, 0.85));

  const scores = [0.94, 0.91, 0.86, 0.78, 0.71];
  for (let i = 0; i < scores.length; i++) {
    const y = R.y + 118 + i * 66;
    g.fillStyle = ink(0.28);
    g.font = OSW(500, 12);
    g.fillText(String(i + 1).padStart(2, '0'), px, y + 4);
    fill(g, px + 26, y - 2, pw * (0.5 + r() * 0.28), 5, ink(0.36));
    fill(g, px + 26, y + 10, pw * 0.42, 4, ink(0.14));
    fill(g, px + 26, y + 24, pw - 78, 3, 'rgba(255,255,255,0.07)');
    fill(g, px + 26, y + 24, (pw - 78) * scores[i], 3, rgba(tint, 0.85));
    g.fillStyle = rgba(tint, 0.8);
    g.font = OSW(400, 12);
    g.fillText(scores[i].toFixed(2), px + pw - 34, y + 28);
  }
  for (let i = 0; i < 3; i++) {
    fill(g, px + i * 64, R.y + R.h - 56, 56, 20, rgba(tint, 0.10), 10);
    fill(g, px + 12 + i * 64, R.y + R.h - 47, 32, 3, rgba(tint, 0.5));
  }
}

// --------------------------------------------------------------------------
// bars — an analytics dashboard.

function artBars(g, R, p, tint, r) {
  const x0 = R.x + 26;
  const W = R.w - 52;

  // ---- the tiles ---------------------------------------------------------
  // the figures are generated texture, not claims: the only numbers this site
  // asserts live in content.js and are set in DOM where they can be read
  const tw = (W - 32) / 3;
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (tw + 16);
    fill(g, x, R.y + 20, tw, 100, 'rgba(255,255,255,0.028)', 5);
    stroke(g, x, R.y + 20, tw, 100, 'rgba(255,255,255,0.06)', 5);
    fill(g, x + 18, R.y + 38, 72, 5, ink(0.24));
    g.fillStyle = i === 0 ? rgba(tint, 0.95) : ink(0.80);
    g.font = OSW(600, 36);
    g.fillText(['4.2×', '+38%', '1.9s'][i], x + 18, R.y + 92);
    // a delta caret and its own sparkline
    const dx = x + tw - 96;
    g.fillStyle = rgba(tint, 0.85);
    g.beginPath();
    g.moveTo(dx, R.y + 44);
    g.lineTo(dx + 9, R.y + 30);
    g.lineTo(dx + 18, R.y + 44);
    g.closePath();
    g.fill();
    g.strokeStyle = rgba(tint, 0.55);
    g.lineWidth = 1.6;
    g.beginPath();
    for (let k = 0; k <= 10; k++) {
      const sx = dx + (k / 10) * 74;
      const sy = R.y + 96 - (0.2 + 0.8 * (k / 10) * (0.6 + 0.4 * r())) * 40;
      k ? g.lineTo(sx, sy) : g.moveTo(sx, sy);
    }
    g.stroke();
  }

  // ---- ranked bars -------------------------------------------------------
  const bw = W * 0.58;
  heading(g, x0, R.y + 156, bw, 'channels', tint, 12);
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const y = R.y + 184 + i * 52;
    const label = p.tags[i];
    if (label) {
      g.fillStyle = ink(0.52);
      g.font = OSW(400, 13);
      g.fillText(label, x0, y + 12);
    } else {
      fill(g, x0, y + 6, 74, 5, ink(0.18));
    }
    const track = bw - 168;
    const v = [1, 0.82, 0.64, 0.46, 0.29][i] * (0.86 + r() * 0.14);
    fill(g, x0 + 150, y, track, 16, 'rgba(255,255,255,0.045)', 3);
    const grd = g.createLinearGradient(x0 + 150, 0, x0 + 150 + track * v, 0);
    grd.addColorStop(0, rgba(tint, 0.32));
    grd.addColorStop(1, rgba(tint, 0.95 - i * 0.11));
    g.fillStyle = grd;
    rr(g, x0 + 150, y, track * v, 16, 3);
    g.fill();
    g.fillStyle = ink(0.42);
    g.font = OSW(400, 12);
    g.fillText(`${Math.round(v * 100)}`, x0 + bw - 12, y + 13);
  }

  // ---- the trend ---------------------------------------------------------
  const cx = x0 + bw + 30;
  const cw = x0 + W - cx;
  heading(g, cx, R.y + 156, cw, 'trend', tint, 12);
  const gy = R.y + 180;
  const gh = 128;
  for (let i = 0; i <= 3; i++) {
    seg(g, cx, gy + (gh / 3) * i, cx + cw, gy + (gh / 3) * i, 'rgba(255,255,255,0.05)');
  }
  const pts = [];
  for (let i = 0; i <= 11; i++) {
    const u = i / 11;
    pts.push([cx + u * cw, gy + gh - (0.12 + u * 0.62 + r() * 0.22) * gh]);
  }
  const area = g.createLinearGradient(0, gy, 0, gy + gh);
  area.addColorStop(0, rgba(tint, 0.28));
  area.addColorStop(1, rgba(tint, 0));
  g.fillStyle = area;
  g.beginPath();
  g.moveTo(pts[0][0], gy + gh);
  for (const q of pts) g.lineTo(q[0], q[1]);
  g.lineTo(pts[pts.length - 1][0], gy + gh);
  g.closePath();
  g.fill();
  g.strokeStyle = rgba(tint, 0.95);
  g.lineWidth = 2;
  g.beginPath();
  pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
  g.stroke();
  const last = pts[pts.length - 1];
  disc(g, last[0], last[1], 8, rgba(tint, 0.22));
  disc(g, last[0], last[1], 3.5, '#ffe2b8');
  for (let i = 0; i < 6; i++) fill(g, cx + i * (cw / 6), gy + gh + 8, 14, 2, ink(0.12));

  // ---- engine share ------------------------------------------------------
  const dy = R.y + 348;
  heading(g, cx, dy, cw, 'engines', tint, 12);
  const dcx = cx + 66;
  const dcy = dy + 82;
  const shares = [0.46, 0.33, 0.21];
  let a0 = -Math.PI * 0.5;
  g.lineWidth = 22;
  for (let i = 0; i < shares.length; i++) {
    g.strokeStyle = rgba(tint, [0.95, 0.55, 0.26][i]);
    g.beginPath();
    g.arc(dcx, dcy, 50, a0 + 0.03, a0 + shares[i] * TAU - 0.03);
    g.stroke();
    a0 += shares[i] * TAU;
  }
  g.fillStyle = PAPER;
  g.font = OSW(600, 22);
  g.textAlign = 'center';
  g.fillText('3', dcx, dcy + 8);
  g.textAlign = 'left';
  for (let i = 0; i < shares.length; i++) {
    const ly = dy + 42 + i * 34;
    fill(g, dcx + 84, ly, 10, 10, rgba(tint, [0.95, 0.55, 0.26][i]), 2);
    fill(g, dcx + 102, ly + 3, 74, 4, ink(0.26));
    g.fillStyle = ink(0.42);
    g.font = OSW(400, 12);
    g.fillText(`${Math.round(shares[i] * 100)}%`, dcx + 190, ly + 10);
  }
}

// --------------------------------------------------------------------------
// sweep — a wide cinematic hero.

function artSweep(g, R, p, tint, r) {
  fill(g, R.x, R.y, R.w, R.h, '#050403');

  const cx = R.x + R.w * 0.52;
  const cy = R.y + R.h * 0.44;

  // the light is drawn additively: a sweep across a dark stage is light landing
  // on the room, not a pale shape sitting on top of it
  g.save();
  g.beginPath();
  g.rect(R.x, R.y, R.w, R.h);
  g.clip();
  g.globalCompositeOperation = 'lighter';

  const bloom = g.createRadialGradient(cx + 120, cy - 40, 0, cx + 120, cy - 40, 360);
  bloom.addColorStop(0, rgba(tint, 0.30));
  bloom.addColorStop(0.45, rgba(tint, 0.08));
  bloom.addColorStop(1, rgba(tint, 0));
  g.fillStyle = bloom;
  g.fillRect(R.x, R.y, R.w, R.h);

  g.translate(cx, cy);
  g.rotate(-0.30);
  for (const [half, a1, a2] of [[52, 0.20, 0.42], [17, 0.42, 0.95], [4.5, 0.9, 1]]) {
    const grd = g.createLinearGradient(-760, 0, 760, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.24, rgba(tint, a1 * 0.5));
    grd.addColorStop(0.56, `rgba(255,226,184,${a2 * 0.85})`);
    grd.addColorStop(0.78, rgba(tint, a1 * 0.4));
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(-760, -half, 1520, half * 2);
  }
  g.restore();

  // the same light again on the floor of the plate, squashed and dimmed
  g.save();
  g.beginPath();
  g.rect(R.x, R.y + R.h * 0.72, R.w, R.h * 0.28);
  g.clip();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.22;
  g.translate(cx, R.y + R.h * 1.44 - cy * 0.02);
  g.scale(1, -0.46);
  g.translate(-cx, -cy);
  g.translate(cx, cy);
  g.rotate(-0.30);
  const grd = g.createLinearGradient(-760, 0, 760, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.5, rgba(tint, 0.9));
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(-760, -46, 1520, 92);
  g.restore();

  // ---- the site on top of it --------------------------------------------
  const x0 = R.x + 42;
  const W = R.w - 84;
  g.fillStyle = PAPER;
  g.font = ANT(19);
  tracked(g, p.name.toUpperCase(), x0, R.y + 44, 3.2);
  for (let i = 0; i < 4; i++) {
    fill(g, x0 + W - 40 - i * 74, R.y + 36, 40 - r() * 10, 5, ink(i ? 0.28 : 0.72));
  }
  fill(g, x0, R.y + 66, W, 1, 'rgba(255,255,255,0.09)');

  const hy = R.y + R.h * 0.52;
  g.fillStyle = PAPER;
  const size = fitFont(g, p.sub, W * 0.56, 58, ANT, 26);
  g.fillText(p.sub, x0, hy);
  fill(g, x0, hy + 22, 118, 3, rgba(tint, 0.95));
  g.fillStyle = ink(0.46);
  g.font = OSW(400, 13);
  tracked(g, p.kind.toUpperCase(), x0, hy + 56, 2.6);

  const by = hy + 84;
  fill(g, x0, by, 186, 48, rgba(tint, 0.10), 24);
  stroke(g, x0, by, 186, 48, rgba(tint, 0.75), 24, 1.4);
  fill(g, x0 + 30, by + 22, 84, 4, rgba(tint, 0.9));
  g.strokeStyle = rgba(tint, 0.9);
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(x0 + 128, by + 18);
  g.lineTo(x0 + 138, by + 24);
  g.lineTo(x0 + 128, by + 30);
  g.stroke();

  fill(g, x0, R.y + R.h - 70, 1, 44,
       'rgba(255,255,255,0.28)');
  const cue = g.createLinearGradient(0, R.y + R.h - 70, 0, R.y + R.h - 26);
  cue.addColorStop(0, rgba(tint, 0.95));
  cue.addColorStop(1, rgba(tint, 0));
  g.fillStyle = cue;
  g.fillRect(x0, R.y + R.h - 70, 2, 44);
  g.fillStyle = ink(0.32);
  g.font = OSW(400, 11);
  tracked(g, '01', x0 + R.w - 126, R.y + R.h - 34, 2);
  fill(g, R.x + R.w - 92, R.y + R.h - 39, 44, 1, ink(0.20));
  g.fillStyle = ink(0.18);
  tracked(g, '04', R.x + R.w - 78, R.y + R.h - 34, 2);
}

// --------------------------------------------------------------------------
// columns — a document.

function artColumns(g, R, p, tint, r) {
  const x0 = R.x + 44;
  const W = R.w - 88;
  fill(g, R.x, R.y, R.w, R.h, '#080706');

  g.fillStyle = rgba(tint, 0.9);
  g.font = OSW(600, 11);
  tracked(g, p.kind.toUpperCase(), x0, R.y + 48, 3);

  g.fillStyle = PAPER;
  fitFont(g, p.sub, W * 0.74, 48, (s) => SERIF(400, s), 22);
  g.fillText(p.sub, x0, R.y + 106);
  fill(g, x0, R.y + 132, W, 1, 'rgba(255,255,255,0.10)');

  // two columns of body and a booking card — a firm's page is a document with
  // one thing to actually do on it
  const cardW = 292;
  const colW = (W - cardW - 76) / 2;
  for (let i = 0; i < 2; i++) {
    const cx = x0 + i * (colW + 38);
    const label = p.tags[i];
    if (label) {
      g.fillStyle = rgba(tint, 0.85);
      g.font = OSW(600, 11);
      tracked(g, label.toUpperCase(), cx, R.y + 168, 2.2);
    }
    fill(g, cx, R.y + 180, 34, 2, rgba(tint, 0.6));
    para(g, cx, R.y + 204, colW, 12, 21, r, ink(0.26), 6);
    g.fillStyle = rgba(tint, 0.7);
    g.font = SERIF(400, 15);
    g.fillText('—', cx, R.y + 480);
  }

  const bx = x0 + W - cardW;
  const by = R.y + 156;
  const bh = R.h - 216;
  fill(g, bx, by, cardW, bh, 'rgba(255,255,255,0.032)', 6);
  stroke(g, bx, by, cardW, bh, rgba(tint, 0.28), 6, 1.2);
  g.fillStyle = ink(0.72);
  g.font = OSW(500, 14);
  g.fillText(p.tags[2] || p.kind, bx + 22, by + 34);
  fill(g, bx + 22, by + 48, cardW - 44, 1, 'rgba(255,255,255,0.08)');

  const cell = 30;
  const gapc = 6;
  const calX = bx + 22;
  const calY = by + 76;
  g.fillStyle = ink(0.22);
  g.font = OSW(400, 10);
  for (let i = 0; i < 7; i++) {
    g.fillText('MTWTFSS'[i], calX + i * (cell + gapc) + 10, calY - 8);
  }
  for (let i = 0; i < 28; i++) {
    const cxx = calX + (i % 7) * (cell + gapc);
    const cyy = calY + Math.floor(i / 7) * (cell + gapc);
    const on = i === 16;
    const off = i < 3 || i > 24;
    fill(g, cxx, cyy, cell, cell - 4, on ? rgba(tint, 0.9) : 'rgba(255,255,255,0.04)', 3);
    fill(g, cxx + 9, cyy + 11, 12, 3, on ? '#160b02' : ink(off ? 0.08 : 0.24));
  }

  const ty = calY + 4 * (cell + gapc) + 16;
  for (let i = 0; i < 2; i++) {
    const px = bx + 22 + i * ((cardW - 44) / 2 + 8);
    const pwid = (cardW - 52) / 2;
    fill(g, px, ty, pwid, 32, i ? rgba(tint, 0.14) : 'rgba(255,255,255,0.04)', 16);
    if (i) stroke(g, px, ty, pwid, 32, rgba(tint, 0.6), 16, 1.1);
    fill(g, px + 22, ty + 15, pwid - 44, 3, i ? rgba(tint, 0.85) : ink(0.24));
  }

  fill(g, bx + 22, by + bh - 60, cardW - 44, 40, rgba(tint, 0.9), 4);
  fill(g, bx + 22 + (cardW - 44) * 0.28, by + bh - 44, (cardW - 44) * 0.44, 6,
       'rgba(22,11,2,0.85)');

  fill(g, x0, R.y + R.h - 44, W, 1, 'rgba(255,255,255,0.07)');
  for (let i = 0; i < 3; i++) fill(g, x0 + i * 78, R.y + R.h - 28, 56, 4, ink(0.14));
}

// --------------------------------------------------------------------------
// rings — nutrition.

function artRings(g, R, p, tint, r) {
  const x0 = R.x + 30;

  const ccx = x0 + 130;
  const ccy = R.y + 200;
  const fr = [0.78, 0.58, 0.41];
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const rad = 104 - i * 30;
    g.lineWidth = 20;
    g.strokeStyle = 'rgba(255,255,255,0.055)';
    g.beginPath();
    g.arc(ccx, ccy, rad, 0, TAU);
    g.stroke();
    g.strokeStyle = rgba(tint, [0.95, 0.62, 0.34][i]);
    g.beginPath();
    g.arc(ccx, ccy, rad, -Math.PI * 0.5, -Math.PI * 0.5 + fr[i] * TAU);
    g.stroke();
  }
  g.lineCap = 'butt';
  g.textAlign = 'center';
  g.fillStyle = PAPER;
  g.font = OSW(600, 34);
  g.fillText('78', ccx, ccy + 6);
  g.fillStyle = ink(0.30);
  g.font = OSW(400, 11);
  tracked(g, 'OF GOAL', ccx - 26, ccy + 26, 1.6);
  g.textAlign = 'left';

  for (let i = 0; i < 3; i++) {
    const ly = R.y + 336 + i * 22;
    disc(g, x0 + 30, ly, 5, rgba(tint, [0.95, 0.62, 0.34][i]));
    fill(g, x0 + 44, ly - 2, 66 - i * 10, 4, ink(0.26));
    g.fillStyle = ink(0.40);
    g.font = OSW(400, 11);
    g.fillText(`${Math.round(fr[i] * 100)}%`, x0 + 190, ly + 4);
  }

  // ---- macros ------------------------------------------------------------
  const mx = x0 + 276;
  const mw = 214;
  heading(g, mx, R.y + 44, mw, 'macros', tint, 12);
  for (let i = 0; i < 3; i++) {
    const y = R.y + 78 + i * 74;
    fill(g, mx, y, 60 + r() * 26, 5, ink(0.26));
    g.fillStyle = ink(0.46);
    g.font = OSW(500, 15);
    g.fillText(`${Math.round(fr[i] * 180)}g`, mx + mw - 44, y + 8);
    fill(g, mx, y + 20, mw, 10, 'rgba(255,255,255,0.05)', 5);
    fill(g, mx, y + 20, mw * fr[i], 10, rgba(tint, 0.85 - i * 0.22), 5);
  }
  const sy = R.y + 316;
  let sx = mx;
  for (let i = 0; i < 3; i++) {
    const seg2 = mw * [0.44, 0.33, 0.23][i];
    fill(g, sx, sy, seg2 - 3, 16, rgba(tint, [0.9, 0.55, 0.28][i]), 3);
    sx += seg2;
  }
  para(g, mx, sy + 36, mw, 3, 16, r, ink(0.14), 5);

  // ---- the day -----------------------------------------------------------
  const dx = mx + mw + 44;
  const dw = R.x + R.w - 30 - dx;
  heading(g, dx, R.y + 44, dw, 'today', tint, 12);
  const times = ['08:30', '12:15', '16:00', '19:45'];
  for (let i = 0; i < 4; i++) {
    const y = R.y + 66 + i * 82;
    fill(g, dx, y, dw, 70, i === 1 ? rgba(tint, 0.07) : 'rgba(255,255,255,0.025)', 5);
    if (i === 1) stroke(g, dx, y, dw, 70, rgba(tint, 0.32), 5, 1.1);
    g.fillStyle = rgba(tint, i === 1 ? 0.95 : 0.55);
    g.font = OSW(500, 13);
    g.fillText(times[i], dx + 16, y + 26);
    fill(g, dx + 16, y + 38, dw * (0.42 + r() * 0.24), 6, ink(i === 1 ? 0.52 : 0.28));
    fill(g, dx + 16, y + 50, dw * 0.30, 4, ink(0.14));
    fill(g, dx + dw - 92, y + 14, 52, 20, rgba(tint, 0.13), 10);
    g.fillStyle = rgba(tint, 0.75);
    g.font = OSW(400, 11);
    g.fillText(`${420 + i * 90}`, dx + dw - 80, y + 28);
    if (i < 2) {
      disc(g, dx + dw - 30, y + 46, 11, rgba(tint, 0.85));
      tick(g, dx + dw - 36, y + 40, 12, '#160b02', 2);
    } else {
      g.strokeStyle = ink(0.16);
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(dx + dw - 30, y + 46, 11, 0, TAU);
      g.stroke();
    }
  }
  g.save();
  g.setLineDash([6, 5]);
  stroke(g, dx, R.y + 66 + 4 * 82, dw, 44, ink(0.14), 5, 1.2);
  g.restore();
  seg(g, dx + dw * 0.5 - 8, R.y + 66 + 4 * 82 + 22, dx + dw * 0.5 + 8,
      R.y + 66 + 4 * 82 + 22, ink(0.30), 1.6);
  seg(g, dx + dw * 0.5, R.y + 66 + 4 * 82 + 14, dx + dw * 0.5,
      R.y + 66 + 4 * 82 + 30, ink(0.30), 1.6);
}

// --------------------------------------------------------------------------

const ART = {
  waveform: { frame: browserFrame, draw: artWaveform },
  shield:   { frame: appFrame,     draw: artShield },
  graph:    { frame: appFrame,     draw: artGraph },
  bars:     { frame: browserFrame, draw: artBars },
  sweep:    { frame: browserFrame, draw: artSweep },
  columns:  { frame: browserFrame, draw: artColumns },
  rings:    { frame: appFrame,     draw: artRings },
};

/** Everything every plate gets: a screen is a lit surface, not a flat fill. */
function finish(g, tint) {
  const wash = g.createLinearGradient(0, 0, 0, TILE_H);
  wash.addColorStop(0, rgba(tint, 0.055));
  wash.addColorStop(0.55, 'rgba(0,0,0,0)');
  wash.addColorStop(1, rgba(tint, 0.030));
  g.fillStyle = wash;
  g.fillRect(0, 0, TILE_W, TILE_H);

  const vig = g.createRadialGradient(
    TILE_W * 0.5, TILE_H * 0.45, TILE_H * 0.30,
    TILE_W * 0.5, TILE_H * 0.45, TILE_W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vig;
  g.fillRect(0, 0, TILE_W, TILE_H);

  // the bezel, so the plate reads as a panel with an edge rather than a hole
  stroke(g, 0, 0, TILE_W, TILE_H, 'rgba(255,255,255,0.10)', 0, 2);
  stroke(g, 3, 3, TILE_W - 6, TILE_H - 6, rgba(tint, 0.14), 0, 2);
}

/** @returns {{canvas: HTMLCanvasElement, tiles: Array, aspect: number}} */
export function buildPlates() {
  const rows = Math.ceil(PROJECTS.length / COLS);
  const c = document.createElement('canvas');
  c.width = COLS * TILE_W;
  c.height = rows * TILE_H;
  const g = c.getContext('2d');

  const tiles = PROJECTS.map((p, i) => {
    const ox = (i % COLS) * TILE_W;
    const oy = Math.floor(i / COLS) * TILE_H;
    const spec = ART[p.art] || ART.bars;

    g.save();
    g.translate(ox, oy);
    g.beginPath();
    g.rect(0, 0, TILE_W, TILE_H);
    g.clip();
    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';

    const R = spec.frame(g, p, p.tint);
    spec.draw(g, R, p, p.tint, rng(i + 1));
    finish(g, p.tint);
    g.restore();

    return {
      u0: ox / c.width,
      v0: oy / c.height,
      u1: TILE_W / c.width,
      v1: TILE_H / c.height,
    };
  });

  return { canvas: c, tiles, aspect: TILE_W / TILE_H };
}
