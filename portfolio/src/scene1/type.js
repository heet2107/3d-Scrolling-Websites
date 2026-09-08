// Renders the wordmark into a single coverage texture and reports the ink
// rectangle of every individual letter.
//
// Why a texture and not DOM text: the signal field that lives inside the
// wordmark has to be clipped by the real letterforms. Sharing one atlas means
// the clip mask and the visible letter are the same pixels, so they can never
// drift apart by a subpixel, at any size or device pixel ratio.
//
// Anton is a compressed heavy grotesque and is set here with a touch of
// negative tracking. One uniform horizontal scale is applied to reach the
// requested width : cap-height ratio — per-letter fitting would distort the I
// into a slab while squeezing the E, which is what makes lettering look
// counterfeit.

const FACE = 'Anton, "Arial Narrow", Impact, sans-serif';

function ctx2d(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c.getContext('2d', { willReadFrequently: false });
}

function metricsFor(ctx, ch) {
  const m = ctx.measureText(ch);
  return {
    advance: m.width,
    left: m.actualBoundingBoxLeft,
    right: m.actualBoundingBoxRight,
    ascent: m.actualBoundingBoxAscent,
    descent: m.actualBoundingBoxDescent,
  };
}

/**
 * Natural ink width : cap height of a line, so the caller can decide how to
 * fit it before committing to a texture size.
 */
export function measureRatio(line) {
  const probe = 400;
  const c = ctx2d(8, 8);
  c.font = `${probe}px ${FACE}`;
  c.textBaseline = 'alphabetic';
  const capAt = metricsFor(c, 'H').ascent || probe * 0.72;
  const tracking = -0.012 * capAt;

  let pen = 0;
  let natL = Infinity;
  let natR = -Infinity;
  for (const ch of line) {
    const m = metricsFor(c, ch);
    if (ch !== ' ') {
      natL = Math.min(natL, pen - m.left);
      natR = Math.max(natR, pen + m.right);
    }
    pen += m.advance + tracking;
  }
  return (natR - natL) / capAt;
}

/**
 * @param {number}   capHeightPx desired cap height, device pixels
 * @param {number}   maxTexture  gl.MAX_TEXTURE_SIZE
 * @param {string[]} lines       one entry per line of the wordmark
 * @param {number}   ratio       target ink width : cap height for the widest line
 */
export function buildWord(capHeightPx, maxTexture, lines, ratio) {
  const probe = 400;
  const p = ctx2d(8, 8);
  p.font = `${probe}px ${FACE}`;
  p.textBaseline = 'alphabetic';

  const capAt = metricsFor(p, 'H').ascent || probe * 0.72;
  let size = (capHeightPx / capAt) * probe;

  p.font = `${size}px ${FACE}`;
  const tracking = -0.012 * capHeightPx;
  const leading = capHeightPx * 1.16;          // line advance, cap to cap

  // Walk the pen across each line and take the real painted extremes. Ink
  // extent is NOT the sum of advances: side bearings and overhangs mean the
  // painted edges sit inside or outside the advance box.
  const walked = lines.map((line) => {
    let pen = 0;
    let natL = Infinity;
    let natR = -Infinity;
    const glyphs = [];
    for (const ch of line) {
      const m = metricsFor(p, ch);
      if (ch !== ' ') {
        natL = Math.min(natL, pen - m.left);
        natR = Math.max(natR, pen + m.right);
        glyphs.push({ char: ch, pen, m });
      }
      pen += m.advance + tracking;
    }
    return { glyphs, natL, natR, natW: natR - natL };
  });

  // One scale for the whole wordmark, driven by the widest line, so every line
  // shares the same letterform proportions.
  const widest = Math.max(...walked.map((w) => w.natW));
  const scaleX = (ratio * capHeightPx) / widest;

  const pad = Math.ceil(capHeightPx * 0.07);
  const descent = Math.max(0, ...walked.flatMap(
    (w) => w.glyphs.map((g) => g.m.descent)));

  let W = Math.ceil(widest * scaleX) + pad * 2;
  let H = Math.ceil(leading * (lines.length - 1) + capHeightPx + descent)
        + pad * 2;

  // stay inside the GPU limit; the whole composition scales down together
  let fit = 1;
  if (W > maxTexture) fit = maxTexture / W;
  if (H * fit > maxTexture) fit = Math.min(fit, maxTexture / H);
  if (fit < 1) {
    size *= fit;
    W = Math.floor(W * fit);
    H = Math.floor(H * fit);
  }

  const g = ctx2d(W, H);
  g.font = `${size}px ${FACE}`;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';

  const letters = [];
  walked.forEach((line, li) => {
    // each line is centred on the widest one
    const lineW = line.natW * scaleX;
    const originX = (W - pad * 2 - lineW) * 0.5 + pad - line.natL * scaleX * fit;
    const baseY = pad + capHeightPx * fit + leading * li * fit;

    g.setTransform(scaleX * fit, 0, 0, fit, originX, baseY);
    for (const gl of line.glyphs) {
      g.fillText(gl.char, gl.pen, 0);
      const x = originX + (gl.pen - gl.m.left) * scaleX * fit;
      const w = (gl.m.left + gl.m.right) * scaleX * fit;
      letters.push({
        char: gl.char,
        line: li,
        x,
        y: baseY - gl.m.ascent * fit,
        w,
        h: gl.m.ascent * fit,
      });
    }
  });
  g.setTransform(1, 0, 0, 1, 0, 0);

  return {
    canvas: g.canvas,
    width: W,
    height: H,
    pad,
    lines: lines.length,
    // ink box of the whole wordmark inside the canvas
    ink: {
      x: pad,
      y: pad,
      w: widest * scaleX * fit,
      h: (leading * (lines.length - 1) + capHeightPx) * fit,
    },
    letters: letters.map((l) => ({
      ...l,
      u0: l.x / W,
      v0: l.y / H,
      u1: (l.x + l.w) / W,
      v1: (l.y + l.h) / H,
    })),
  };
}

export async function fontsReady() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('400 200px Anton'),
      document.fonts.load('700 40px Oswald'),
      document.fonts.load('500 40px Oswald'),
      document.fonts.load('400 40px Oswald'),
      document.fonts.load('300 40px Oswald'),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to the stack in the font shorthand */ }
}
