// The ambient plate behind the record.
//
// Two draws a frame and no state worth the name — that is the point. Every
// other act owns the frame it is in; this one is wallpaper for a page of body
// copy, so it is built to be cheap enough to leave running while somebody
// reads, and dim enough that they can.

import { createGL, program, unitQuad } from '../gl/renderer.js';
import {
  PLATE_VERT, PLATE_FRAG, EMBER_VERT, EMBER_FRAG,
} from '../gl/shaders5.js';

const EMBERS = 130;               // act two runs 620; this room is much quieter
const READ_COL = 1120;            // must track --rec-w in record.css

/** Deterministic, so the plate is the same picture on every reload. */
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export class Plate {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.quad = unitQuad(gl);
    this.plate = program(gl, PLATE_VERT, PLATE_FRAG, 'plate');
    this.ember = program(gl, EMBER_VERT, EMBER_FRAG, 'ember5');

    // one static buffer: the embers move entirely in the vertex shader, so
    // there is nothing to re-upload however long the act is left on screen
    const data = new Float32Array(EMBERS * 4);
    for (let i = 0; i < EMBERS; i++) {
      data[i * 4 + 0] = rnd(i * 3.1);
      data[i * 4 + 1] = rnd(i * 7.7 + 1.3);
      data[i * 4 + 2] = rnd(i * 5.3 + 4.1);
      data[i * 4 + 3] = 1.1 + rnd(i * 9.9 + 2.7) * 2.3;
    }
    this.emberVAO = gl.createVertexArray();
    gl.bindVertexArray(this.emberVAO);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.dpr = 1;
    this.col = 0.8;
  }

  resize(w, h, dpr) {
    if (!this.ok || !w || !h) return;
    const gl = this.gl;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    gl.viewport(0, 0, pw, ph);
    this.dpr = dpr;
    // the shader has to know where the reading column is to keep the grid out
    // of it, and that is a CSS decision — so it is measured, not guessed
    this.col = Math.min(1, READ_COL / w);
  }

  /** @param {number} t seconds since the act first took the frame
   *  @param {number} scroll 0 as the act enters the viewport, 1 as it leaves */
  render(t, scroll) {
    if (!this.ok || !this.canvas.width) return;
    const gl = this.gl;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(this.quad);
    gl.useProgram(this.plate.p);
    let u = this.plate.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform1f(u.uCol, this.col);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(this.emberVAO);
    gl.useProgram(this.ember.p);
    u = this.ember.u;
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.drawArrays(gl.POINTS, 0, EMBERS);

    gl.bindVertexArray(null);
  }
}
