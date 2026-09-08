// The closing frame's renderer.
//
// Four passes: the plate, the ember field, the wordmark stencil, grain. The
// order is the whole design — the mark is drawn AFTER the embers so the ones
// that have collected behind it are knocked out by the letterforms, which is
// what turns a name over a glow into a name standing in one.
//
// The composition is solved here rather than in the timeline because it
// depends only on the viewport: where the mark sits decides where the bed
// burns and where the embers gather, and those three have to agree at every
// aspect ratio or the light stops belonging to the type.

import { createGL, program, unitQuad, texture, upload, bind }
  from '../gl/renderer.js';
import { VERT, PLATE_FRAG, EMBER_VERT, EMBER_FRAG, MARK_FRAG, GRAIN_FRAG }
  from '../gl/shaders6.js';
import { buildWord, measureRatio } from '../scene1/type.js';

const EMBERS = 900;

// Fraction of the viewport the mark's ink spans. Portrait runs it edge to edge
// and a hair past: a 5.5:1 wordmark set to fit inside a phone's margins is a
// caption, and cropping it harder than this costs the H and the T, which reads
// as a layout bug rather than as a closing title.
const MARK_W = { landscape: 0.92, portrait: 1.02 };
// where the letters sit their baseline, as a fraction of viewport height. It
// is lower in portrait because the stacked copy leaves only a thin band above
// the bar for the mark to stand in.
const MARK_FOOT = { landscape: 0.815, portrait: 0.885 };

let RATIO_ONE = 0;              // ink width : cap height of 'HEET BAROT'

function ratio() {
  if (!RATIO_ONE) RATIO_ONE = measureRatio('HEET BAROT');
  return RATIO_ONE;
}

export class Finale {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.quad = unitQuad(gl);
    this.plate = program(gl, VERT, PLATE_FRAG, 'plate');
    this.mark = program(gl, VERT, MARK_FRAG, 'mark');
    this.ember = program(gl, EMBER_VERT, EMBER_FRAG, 'ember');
    this.grain = program(gl, VERT, GRAIN_FRAG, 'grain');

    this.wordTex = texture(gl);
    this.word = null;
    this.wordKey = '';
    this.w = 0;
    this.h = 0;
    this.dpr = 1;

    this.buildEmbers();
  }

  /**
   * Homes are generated once, over a square that overhangs the viewport on
   * every side, so the scattered state runs off the edges instead of stopping
   * politely inside them. The gathered radius is squared toward zero, which
   * packs the field into a dense head with a thin outer drift rather than an
   * evenly filled disc.
   */
  buildEmbers() {
    const gl = this.gl;
    this.emberVAO = gl.createVertexArray();
    gl.bindVertexArray(this.emberVAO);

    const data = new Float32Array(EMBERS * 6);
    for (let i = 0; i < EMBERS; i++) {
      const s = Math.random();
      const o = i * 6;
      data[o + 0] = (Math.random() * 2 - 1) * 1.30;
      data[o + 1] = (Math.random() * 2 - 1) * 1.24;
      data[o + 2] = s;
      data[o + 3] = 0.0024 + 0.0125 * s * s;
      // every ember swings the same way as it falls in — mixed directions read
      // as turbulence, one direction reads as a fire drawing air
      data[o + 4] = 0.55 + 1.95 * Math.random();
      data[o + 5] = 0.045 + 0.62 * Math.random() ** 1.8;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
    gl.bindVertexArray(null);
  }

  resize(w, h, dpr) {
    const gl = this.gl;
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    gl.viewport(0, 0, cw, ch);
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.compose();
  }

  /** Where the name sits, and therefore where the light is. */
  compose() {
    const w = this.w;
    const h = this.h;
    const portrait = h / w > 1.02;
    const r = ratio();

    // width leads and height only clamps: the mark's job is to span the frame,
    // and letting height drive it on a tall viewport shrinks the closing title
    // to a caption
    let markW = w * (portrait ? MARK_W.portrait : MARK_W.landscape);
    let capH = markW / r;
    const maxCap = h * (portrait ? 0.150 : 0.270);
    if (capH > maxCap) { capH = maxCap; markW = capH * r; }

    const foot = h * (portrait ? MARK_FOOT.portrait : MARK_FOOT.landscape);
    this.markRect = { x: (w - markW) * 0.5, y: foot - capH, w: markW, h: capH };
    this.capH = capH;

    // the core sits inside the mark's own band, so the embers pour into the
    // name rather than hovering above it
    this.core = {
      x: portrait ? 0.50 : 0.575,
      y: 1 - (this.markRect.y + capH * 0.44) / h,
    };
    // the bed is centred on the mark and just wide enough to reach past its
    // cap line and its baseline; tighter and the letters float in a stripe
    this.band = {
      y: 1 - (this.markRect.y + capH * 0.5) / h,
      k: h / (capH * (portrait ? 1.05 : 0.72)),
    };

    this.fitWord();
  }

  /**
   * The atlas is rebuilt only when the cap height it was drawn at actually
   * changes. A resize that leaves the mark the same size — a mobile browser
   * bar sliding away, say — must not re-rasterise several megapixels of type.
   */
  fitWord() {
    if (!this.ok || !this.capH) return;
    const capPx = Math.round(this.capH * this.dpr);
    const key = String(capPx);
    if (this.wordKey === key) return;

    const word = buildWord(capPx, this.maxTexture, ['HEET BAROT'], ratio());
    this.word = word;
    this.wordKey = key;
    upload(this.gl, this.wordTex, word.canvas);
  }

  /** CSS-pixel rect -> clip space, y flipped. */
  rect(x, y, w, h) {
    return [
      (x / this.w) * 2 - 1,
      1 - ((y + h) / this.h) * 2,
      (w / this.w) * 2,
      (h / this.h) * 2,
    ];
  }

  render(state) {
    if (!this.ok || !this.w || !this.word) return;
    const gl = this.gl;
    const res = [this.canvas.width, this.canvas.height];
    const full = [-1, -1, 2, 2];

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.quad);

    // ---- the plate ------------------------------------------------------
    gl.useProgram(this.plate.p);
    let u = this.plate.u;
    gl.uniform4fv(u.uRect, full);
    gl.uniform2f(u.uUV0, 0, 0);
    gl.uniform2f(u.uUV1, 1, 1);
    gl.uniform2fv(u.uRes, res);
    gl.uniform1f(u.uTime, state.t);
    gl.uniform2f(u.uCore, this.core.x, this.core.y);
    gl.uniform2f(u.uBand, this.band.y, this.band.k);
    gl.uniform1f(u.uGather, state.gather);
    gl.uniform1f(u.uGrain, state.grain * 0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---- the field, collecting -------------------------------------------
    gl.useProgram(this.ember.p);
    u = this.ember.u;
    gl.uniform2fv(u.uRes, res);
    gl.uniform2f(u.uCore, this.core.x, this.core.y);
    gl.uniform1f(u.uTime, state.t);
    gl.uniform1f(u.uGather, state.gather);
    gl.uniform1f(u.uPx, this.canvas.height * 0.5);
    gl.bindVertexArray(this.emberVAO);
    gl.drawArrays(gl.POINTS, 0, EMBERS);

    // ---- the name, knocked out of it -------------------------------------
    const W = this.word;
    const m = this.markRect;
    // the atlas is placed by its INK box, then drawn whole: the padding around
    // the ink is where the halo taps have room to land, and cropping to the
    // ink box would cut the spill off square at the letters' own edges
    const sx = m.w / W.ink.w;
    const sy = m.h / W.ink.h;
    const ox = m.x - W.ink.x * sx;
    const oy = m.y - W.ink.y * sy;

    gl.bindVertexArray(this.quad);
    gl.useProgram(this.mark.p);
    u = this.mark.u;
    gl.uniform4fv(u.uRect, this.rect(ox, oy, W.width * sx, W.height * sy));
    gl.uniform2f(u.uUV0, 0, 0);
    gl.uniform2f(u.uUV1, 1, 1);
    gl.uniform1i(u.uWord, bind(gl, this.wordTex, 0));
    gl.uniform2f(u.uTexel, 1 / W.width, 1 / W.height);
    // the ring is set in atlas texels but has to read in device pixels, so it
    // tracks how far the atlas has been stretched to reach the frame
    gl.uniform1f(u.uRing, Math.max(1.6, 4.2 / (sx * this.dpr)));
    gl.uniform1f(u.uOpacity, 0.94);
    gl.uniform1f(u.uLit, state.lit);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---- grain ------------------------------------------------------------
    gl.useProgram(this.grain.p);
    u = this.grain.u;
    gl.uniform4fv(u.uRect, full);
    gl.uniform2f(u.uUV0, 0, 0);
    gl.uniform2f(u.uUV1, 1, 1);
    gl.uniform1f(u.uTime, state.t);
    gl.uniform1f(u.uGrain, state.grain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);
  }
}
