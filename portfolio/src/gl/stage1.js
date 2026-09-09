// The opening's renderer.
//
// Three passes per frame: the room, then one quad per letter, then grain over
// everything. The letters are drawn individually because each carries its own
// reveal, rise and softness — but they all sample the field in SCREEN space,
// so what shows through them is one continuous field, not ten patches.

import { createGL, program, unitQuad, texture, upload, bind } from './renderer.js';
import { VERT, BG_FRAG, LETTER_FRAG, GRAIN_FRAG } from './shaders1.js';

export class Stage1 {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.quad = unitQuad(gl);
    this.bg = program(gl, VERT, BG_FRAG, 'bg');
    this.letter = program(gl, VERT, LETTER_FRAG, 'letter');
    this.grain = program(gl, VERT, GRAIN_FRAG, 'grain');
    this.wordTex = texture(gl);
    this.word = null;
    this.layout = null;
    this.parallax = { x: 0, y: 0 };
  }

  resize(L) {
    const gl = this.gl;
    const w = Math.round(L.w * L.dpr);
    const h = Math.round(L.h * L.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    this.layout = L;
  }

  setWord(word) {
    this.word = word;
    upload(this.gl, this.wordTex, word.canvas);
  }

  /** CSS-pixel rect -> clip space, y flipped. */
  rect(x, y, w, h) {
    const L = this.layout;
    return [
      (x / L.w) * 2 - 1,
      1 - ((y + h) / L.h) * 2,
      (w / L.w) * 2,
      (h / L.h) * 2,
    ];
  }

  render(state, t) {
    if (!this.ok || !this.layout || !this.word) return;
    const gl = this.gl;
    const L = this.layout;
    const res = [this.canvas.width, this.canvas.height];

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.quad);

    const full = [-1, -1, 2, 2];

    // ---- the room -------------------------------------------------------
    gl.useProgram(this.bg.p);
    let u = this.bg.u;
    gl.uniform4fv(u.uRect, full);
    gl.uniform2f(u.uUV0, 0, 0);
    gl.uniform2f(u.uUV1, 1, 1);
    gl.uniform2fv(u.uRes, res);
    gl.uniform1f(u.uTime, t);
    gl.uniform2f(u.uEmber, L.ember.x, 1 - L.ember.y);
    gl.uniform1f(u.uEmberAmt, state.ember);
    gl.uniform1f(u.uFlow, state.field.flow);
    gl.uniform1f(u.uFieldIn, state.field.opacity);
    gl.uniform1f(u.uGrain, state.grain * 0.55);
    gl.uniform1f(u.uFlash, state.flash);
    gl.uniform2f(u.uPar, this.parallax.x, this.parallax.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---- the wordmark ---------------------------------------------------
    const W = this.word;
    const word = L.word;
    // the atlas is drawn at the ink box; map atlas pixels to CSS pixels
    const sx = word.w / W.ink.w;
    const sy = word.h / W.ink.h;
    const ox = word.x - W.ink.x * sx;
    const oy = word.y - W.ink.y * sy;

    gl.useProgram(this.letter.p);
    u = this.letter.u;
    gl.uniform1i(u.uWord, bind(gl, this.wordTex, 0));
    gl.uniform2fv(u.uRes, res);
    gl.uniform2f(u.uTexel, 1 / W.width, 1 / W.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uFlow, state.field.flow);
    gl.uniform1f(u.uLit, 0.55 + 0.75 * state.field.opacity);
    gl.uniform2f(u.uPar, this.parallax.x, this.parallax.y);

    for (let i = 0; i < W.letters.length; i++) {
      const l = W.letters[i];
      const s = state.letters[i];
      if (!s || s.opacity <= 0.001) continue;

      // bleed the quad past the glyph box so the softened taps have coverage
      // to read; without it a blurred letter is clipped square at its own edge
      const bleedPx = word.capH * 0.10 * (0.25 + s.soften);
      const bu = bleedPx / sx / W.width;
      const bv = bleedPx / sy / W.height;

      const x = ox + l.x * sx - bleedPx;
      const y = oy + l.y * sy - bleedPx + s.dy * word.capH;
      const w = l.w * sx + bleedPx * 2;
      const h = l.h * sy + bleedPx * 2;

      gl.uniform4fv(u.uRect, this.rect(x, y, w, h));
      gl.uniform2f(u.uUV0, l.u0 - bu, l.v0 - bv);
      gl.uniform2f(u.uUV1, (l.u1 - l.u0) + bu * 2, (l.v1 - l.v0) + bv * 2);
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uOpacity, s.opacity);
      gl.uniform1f(u.uSoften, s.soften);
      gl.uniform1f(u.uEdge, s.edge);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // ---- grain ----------------------------------------------------------
    gl.useProgram(this.grain.p);
    u = this.grain.u;
    gl.uniform4fv(u.uRect, full);
    gl.uniform2f(u.uUV0, 0, 0);
    gl.uniform2f(u.uUV1, 1, 1);
    gl.uniform2fv(u.uRes, res);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uGrain, state.grain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);
  }
}
