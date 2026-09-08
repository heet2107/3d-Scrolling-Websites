// The card plates, drawn once into a single atlas.
//
// One atlas rather than fourteen textures: it is a single upload, a single
// bind, and it means the whole deck can be drawn without the driver switching
// texture state between cards.
//
// The plates are ICON FORWARD. A card is a dark rounded panel with the tool's
// real mark centred on it and the name beneath, because that is what the deck
// is for: a visitor should recognise the room at a glance, before reading a
// single word. Text-only cards made the act a list of nouns floating in space.
//
// Three kinds of face end up on the deck, and the difference is deliberate:
//
//   vector   drawn from geometry in ./logos/marks.js, on a 100x100 grid
//   raster   a real supplied mark, currently only Claude
//   monogram a tool with no honest logo, set in the deck's own typeface
//
// The monogram matters. MCP, RAG and LangGraph are techniques and protocols,
// not products with marks. Inventing a logo for them would put a false thing
// on the page; setting them as type says "a tool without a logo", which is
// what they are.

import { TOOLS, KIND_TINT } from '../data/content.js';
import { MARKS, monogram } from './logos/marks.js';

const COLS = 4;
const TILE = 448;                       // square, like the marks themselves
const PAD = 30;
const MARK_BOX = 186;                   // the 100-grid is scaled into this
const MARK_TOP = 96;

const KIND_LABEL = {
  llm: 'Models', web: 'Interface', lang: 'Language',
  data: 'Data', infra: 'Infrastructure',
};

/** Tool label to the mark that draws it. Anything absent gets a monogram. */
const MARK_FOR = {
  'React': 'react',
  'Next.js': 'next',
  'TypeScript': 'typescript',
  'Node.js': 'node',
  'Python': 'python',
  'PostgreSQL': 'postgres',
  'Supabase': 'supabase',
  'AWS': 'aws',
  'Docker': 'docker',
  'Terraform': 'terraform',
};

/** Tools whose mark is a supplied image rather than geometry. */
const RASTER_FOR = {
  'Claude API': 'public/tools/claude.png',
};

/** What a monogram tile says, when the tool has no mark of its own. */
const MONOGRAM_FOR = {
  'MCP Servers': ['MCP'],
  'RAG': ['RAG'],
  'LangGraph': ['LANG', 'GRAPH'],
};

function rgba(t, a) {
  return `rgba(${Math.round(t[0] * 255)},${Math.round(t[1] * 255)},`
       + `${Math.round(t[2] * 255)},${a})`;
}

/**
 * A dark base with the family tint mixed IN, returned opaque.
 *
 * The obvious way to warm the foot of a plate is a gradient ending at
 * `rgba(tint, 0.16)` — but that stop is 84% transparent, so the bottom of every
 * card became a window rather than a warm panel. On the old landscape plates
 * the band was thin enough to pass for a glow; square plates made a third of
 * each card see-through. Mixing to an opaque colour gives the same warmth and
 * keeps the card solid.
 */
function warm(tint, amount) {
  const base = [0x0c, 0x0a, 0x08];
  const mix = base.map((b, i) => Math.round(b + (tint[i] * 255 - b) * amount));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

/** Draws the panel every plate shares, before its mark goes on. */
function panel(g, tint) {
  const bg = g.createLinearGradient(0, 0, 0, TILE);
  bg.addColorStop(0, '#0c0a08');
  bg.addColorStop(0.60, '#110d0a');
  bg.addColorStop(1, warm(tint, 0.17));
  g.fillStyle = bg;
  g.fillRect(0, 0, TILE, TILE);

  // the rim the room's light catches. The reference deck reads as physical
  // largely because of this one highlight along the upper edge.
  g.strokeStyle = 'rgba(255,255,255,0.085)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(PAD * 0.5, PAD * 0.5);
  g.lineTo(TILE - PAD * 0.5, PAD * 0.5);
  g.stroke();

  g.strokeStyle = rgba(tint, 0.30);
  g.lineWidth = 2;
  g.strokeRect(1, 1, TILE - 2, TILE - 2);
}

/** Scales a 100x100 mark into the plate's mark box and draws it. */
function drawMark(g, fn) {
  const s = MARK_BOX / 100;
  g.save();
  g.translate((TILE - MARK_BOX) * 0.5, MARK_TOP);
  g.scale(s, s);
  fn(g);
  g.restore();
}

/** The tool's name, shrunk to fit rather than clipped. */
function name(g, label) {
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#f1ede9';
  let size = 46;
  g.font = `400 ${size}px Anton, sans-serif`;
  while (g.measureText(label).width > TILE - PAD * 2 && size > 20) {
    size -= 2;
    g.font = `400 ${size}px Anton, sans-serif`;
  }
  g.fillText(label, TILE * 0.5, TILE - PAD - 44);
}

/** Draws the plate for one tool into the tile at (0,0)-(TILE,TILE). */
function plate(g, tool, i) {
  const tint = KIND_TINT[tool.kind] || KIND_TINT.llm;
  panel(g, tint);

  // index, top left
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.fillStyle = rgba(tint, 0.80);
  g.font = '600 20px Oswald, sans-serif';
  g.fillText(String(i + 1).padStart(2, '0'), PAD, PAD);

  // family, top right, tracked out
  g.textAlign = 'right';
  g.fillStyle = 'rgba(255,255,255,0.38)';
  g.font = '400 15px Oswald, sans-serif';
  const fam = (KIND_LABEL[tool.kind] || '').toUpperCase();
  g.fillText([...fam].join(' '), TILE - PAD, PAD + 2);

  const mark = MARK_FOR[tool.label];
  if (mark && MARKS[mark]) drawMark(g, MARKS[mark]);
  else if (!RASTER_FOR[tool.label]) {
    drawMark(g, (c) => monogram(c, MONOGRAM_FOR[tool.label] || tool.label, tint));
  }

  name(g, tool.label);

  // the rule under the name, in the family tint
  g.fillStyle = rgba(tint, 0.70);
  g.fillRect(PAD, TILE - PAD - 26, TILE - PAD * 2, 2);
}

/**
 * Fits a loaded image inside the mark box without distorting it, then draws
 * it. Supplied marks are not all the same shape, so contain rather than cover:
 * a cropped logo is a wrong logo.
 */
function drawRaster(g, img) {
  const s = Math.min(MARK_BOX / img.width, MARK_BOX / img.height);
  const w = img.width * s;
  const h = img.height * s;
  g.drawImage(img, (TILE - w) * 0.5, MARK_TOP + (MARK_BOX - h) * 0.5, w, h);
}

/**
 * @returns {{canvas, tiles, aspect, ready: Promise<boolean>}}
 *
 * The atlas is returned COMPLETE and synchronous: every vector mark and every
 * monogram is already on it, so the act can start on the frame it is asked to.
 * Supplied images arrive afterwards and repaint their own tile; `ready`
 * resolves once they have, and tells the caller whether anything actually
 * changed so it can skip a pointless re-upload. A raster that never loads
 * leaves a plate that still carries its name, index, family and panel — worse
 * than the mark, but never a hole.
 */
export function buildAtlas() {
  const rows = Math.ceil(TOOLS.length / COLS);
  const c = document.createElement('canvas');
  c.width = COLS * TILE;
  c.height = rows * TILE;
  const g = c.getContext('2d');

  const at = (i) => [(i % COLS) * TILE, Math.floor(i / COLS) * TILE];

  const tiles = TOOLS.map((tool, i) => {
    const [cx, cy] = at(i);
    g.save();
    g.translate(cx, cy);
    g.beginPath();
    g.rect(0, 0, TILE, TILE);
    g.clip();
    plate(g, tool, i);
    g.restore();
    return {
      u0: cx / c.width,
      v0: cy / c.height,
      u1: TILE / c.width,
      v1: TILE / c.height,
    };
  });

  const pending = TOOLS.map((tool, i) => {
    const src = RASTER_FOR[tool.label];
    if (!src) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const [cx, cy] = at(i);
        g.save();
        g.translate(cx, cy);
        g.beginPath();
        g.rect(0, 0, TILE, TILE);
        g.clip();
        drawRaster(g, img);
        g.restore();
        resolve(true);
      };
      // a missing file must not leave the promise hanging, or `ready` never
      // settles and the caller waits for an upload that will never be needed
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }).filter(Boolean);

  const ready = pending.length
    ? Promise.all(pending).then((r) => r.some(Boolean))
    : Promise.resolve(false);

  return { canvas: c, tiles, aspect: 1, ready };
}
