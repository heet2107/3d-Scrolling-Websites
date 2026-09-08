// The card plates, drawn once into a single atlas.
//
// One atlas rather than fourteen textures: it is a single upload, a single
// bind, and it means the whole deck can be drawn without the driver switching
// texture state between cards.

import { TOOLS, KIND_TINT } from '../data/content.js';

const COLS = 4;
const TILE_W = 512;
const TILE_H = 320;

const KIND_LABEL = {
  llm: 'Models', web: 'Interface', lang: 'Language',
  data: 'Data', infra: 'Infrastructure',
};

function rgba(t, a) {
  return `rgba(${Math.round(t[0] * 255)},${Math.round(t[1] * 255)},`
       + `${Math.round(t[2] * 255)},${a})`;
}

/** Draws the plate for one tool into the tile at (0,0)-(TILE_W,TILE_H). */
function plate(g, tool, i) {
  const tint = KIND_TINT[tool.kind] || KIND_TINT.llm;
  const pad = 34;

  // the plate itself — a dark panel, warmer toward the bottom where the room's
  // floor light would reach it
  const bg = g.createLinearGradient(0, 0, 0, TILE_H);
  bg.addColorStop(0, '#0b0907');
  bg.addColorStop(0.62, '#100c09');
  bg.addColorStop(1, rgba(tint, 0.13));
  g.fillStyle = bg;
  g.fillRect(0, 0, TILE_W, TILE_H);

  // a faint technical grid, so the plate reads as an instrument face
  g.strokeStyle = 'rgba(255,255,255,0.030)';
  g.lineWidth = 1;
  for (let x = pad; x < TILE_W - pad; x += 34) {
    g.beginPath(); g.moveTo(x + 0.5, pad); g.lineTo(x + 0.5, TILE_H - pad); g.stroke();
  }
  for (let y = pad; y < TILE_H - pad; y += 34) {
    g.beginPath(); g.moveTo(pad, y + 0.5); g.lineTo(TILE_W - pad, y + 0.5); g.stroke();
  }

  // index
  g.fillStyle = rgba(tint, 0.85);
  g.font = '600 22px Oswald, sans-serif';
  g.textBaseline = 'top';
  g.fillText(String(i + 1).padStart(2, '0'), pad, pad);

  // family
  g.fillStyle = 'rgba(255,255,255,0.42)';
  g.font = '400 17px Oswald, sans-serif';
  const fam = (KIND_LABEL[tool.kind] || '').toUpperCase();
  g.save();
  g.translate(TILE_W - pad, pad);
  g.textAlign = 'right';
  let tracked = '';
  for (const ch of fam) tracked += `${ch} `;
  g.fillText(tracked.trim(), 0, 0);
  g.restore();

  // the label — the reason the card exists
  g.textAlign = 'left';
  g.fillStyle = '#f4f1ee';
  let size = 62;
  g.font = `400 ${size}px Anton, sans-serif`;
  while (g.measureText(tool.label).width > TILE_W - pad * 2 && size > 26) {
    size -= 2;
    g.font = `400 ${size}px Anton, sans-serif`;
  }
  g.textBaseline = 'alphabetic';
  g.fillText(tool.label, pad, TILE_H - pad - 46);

  // rule under the label, in the family tint
  g.fillStyle = rgba(tint, 0.75);
  g.fillRect(pad, TILE_H - pad - 30, TILE_W - pad * 2, 2);

  // corner ticks
  g.strokeStyle = rgba(tint, 0.55);
  g.lineWidth = 2;
  const t = 16;
  for (const [cx, cy, dx, dy] of [
    [pad - 12, pad - 12, 1, 1], [TILE_W - pad + 12, pad - 12, -1, 1],
    [pad - 12, TILE_H - pad + 12, 1, -1],
    [TILE_W - pad + 12, TILE_H - pad + 12, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(cx + dx * t, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * t);
    g.stroke();
  }
}

/** @returns {{canvas, cols, rows, tiles: Array<{u0,v0,u1,v1}>}} */
export function buildAtlas() {
  const rows = Math.ceil(TOOLS.length / COLS);
  const c = document.createElement('canvas');
  c.width = COLS * TILE_W;
  c.height = rows * TILE_H;
  const g = c.getContext('2d');

  const tiles = TOOLS.map((tool, i) => {
    const cx = (i % COLS) * TILE_W;
    const cy = Math.floor(i / COLS) * TILE_H;
    g.save();
    g.translate(cx, cy);
    g.beginPath();
    g.rect(0, 0, TILE_W, TILE_H);
    g.clip();
    plate(g, tool, i);
    g.restore();
    return {
      u0: cx / c.width,
      v0: cy / c.height,
      u1: TILE_W / c.width,
      v1: TILE_H / c.height,
    };
  });

  return { canvas: c, tiles, aspect: TILE_W / TILE_H };
}
