// Act IV — the room, the deck, the floor it stands on.
//
// The whole act is one scalar: `head`, a continuous position in the deck that
// the scroll writes and everything else reads. A plate's distance from it
// decides where the plate is, how big, how bright, how sharp and whether it is
// drawn at all — so there is no per-plate state to fall out of step with the
// scroll, and jumping straight to project five is the same operation as
// drifting there.
//
// The floor reflection is real geometry, not a painted smear: each plate is
// drawn a second time through a matrix that mirrors it about the floor plane.
// That is why the reflection foreshortens correctly, slides at the right rate
// when the deck moves, and disappears when its plate leaves — none of which a
// screen-space fake does without being caught at it.

import { createGL, program, unitQuad, texture, upload, bind } from '../gl/renderer.js';
import {
  SCREEN_VERT, ROOM_FRAG, HAZE_FRAG, GRAIN_FRAG,
  PLATE_VERT, PLATE_FRAG, DUST_VERT, DUST_FRAG,
} from '../gl/shaders4.js';
import { perspective, multiply, compose, identity, projectPoint } from '../lib/mat4.js';
import { PROJECTS } from '../data/content.js';
import { buildPlates } from './plates.js';
import { deckConfig, pose, order, visible, FOV, PLATE_W, PLATE_ASPECT } from './layout4.js';
import { clamp, damp, lerp } from '../lib/ease.js';

const DUST = 420;
const BLUR_MAX = 7.0;

export class Gallery {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.quad = unitQuad(gl);
    this.room = program(gl, SCREEN_VERT, ROOM_FRAG, 'work room');
    this.haze = program(gl, SCREEN_VERT, HAZE_FRAG, 'work haze');
    this.grain = program(gl, SCREEN_VERT, GRAIN_FRAG, 'work grain');
    this.plate = program(gl, PLATE_VERT, PLATE_FRAG, 'work plate');
    this.dust = program(gl, DUST_VERT, DUST_FRAG, 'work dust');

    const atlas = buildPlates();
    this.atlas = atlas;
    this.art = texture(gl);
    upload(gl, this.art, atlas.canvas);
    this.texel = [1 / atlas.canvas.width, 1 / atlas.canvas.height];

    this.proj = new Float32Array(16);
    this.view = identity(new Float32Array(16));
    this.vp = new Float32Array(16);
    this.mvp = new Float32Array(16);
    this.model = new Float32Array(16);
    this.mirrored = new Float32Array(16);
    // mirror about the floor plane; m[13] is filled in once the floor's height
    // is known, which only happens after the first resize
    this.mirror = identity(new Float32Array(16));
    this.mirror[5] = -1;

    this.plates = PROJECTS.map((p, i) => ({
      project: p,
      tile: atlas.tiles[i],
      tint: p.tint,
      seed: (i * 41.3) % 17,
    }));
    this.slot = {};

    this.buildDust();

    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.head = 0;
    this.target = 0;
    this.mat = 0;
    this.time = 0;
    this.active = 0;
    this.pool = [0.5, 0.3, 0];
  }

  buildDust() {
    const gl = this.gl;
    this.dustVAO = gl.createVertexArray();
    gl.bindVertexArray(this.dustVAO);
    const buf = gl.createBuffer();
    const data = new Float32Array(DUST * 5);
    for (let i = 0; i < DUST; i++) {
      const r = Math.random();
      // authored in a unit box and stretched to the room's actual depth in the
      // shader, so a phone gets the same density rather than a wall of motes
      data[i * 5 + 0] = (Math.random() * 2 - 1) * 1.35;
      data[i * 5 + 1] = (Math.random() * 2 - 1) * 0.95;
      data[i * 5 + 2] = lerp(-0.30, -4.60, Math.random());
      data[i * 5 + 3] = r;
      data[i * 5 + 4] = lerp(0.9, 3.2, r * r);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
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
    this.aspect = w / h;
    this.cfg = deckConfig(this.aspect, h / w > 1.02);

    perspective(FOV, this.aspect, 0.1, 90, this.proj);
    // a lens shift, applied as the projection's skew terms: it slides the whole
    // composition — floor, deck and reflections together — without pitching the
    // camera, which would swing the horizon and tilt every plate off square
    this.proj[8] = -this.cfg.shift[0];
    this.proj[9] = -this.cfg.shift[1];
    // the floor plane vanishes at eye level, which the shift has just moved
    this.horizon = (this.cfg.shift[1] + 1) * 0.5;
    this.mirror[13] = 2 * this.cfg.floorY;
  }

  viewMatrix() {
    const v = identity(this.view);
    // depth, not a toy — the same restraint the opening uses
    v[12] = -this.pointer.x * 0.10 * this.cfg.z0 * 0.30;
    v[13] = this.pointer.y * 0.07 * this.cfg.z0 * 0.30;
    return v;
  }

  /** @param {{head:number, mat:number}} opts */
  update(dt, opts, instant = false) {
    this.time += dt;
    this.mat = opts.mat;
    this.target = opts.head;

    // the scroll is sampled per frame and can arrive in jumps — a wheel notch,
    // a trackpad fling, a pip that scrolls half the act. Damping the head is
    // what turns those into travel instead of teleporting.
    this.head = instant ? this.target : damp(this.head, this.target, 7.5, dt);

    const p = this.pointer;
    p.x = instant ? p.tx : damp(p.x, p.tx, 3.0, dt);
    p.y = instant ? p.ty : damp(p.y, p.ty, 3.0, dt);

    this.active = clamp(Math.round(this.target), 0, this.plates.length - 1);
  }

  render() {
    if (!this.ok || !this.cfg) return;
    const gl = this.gl;
    const cfg = this.cfg;

    multiply(this.proj, this.viewMatrix(), this.vp);

    // where the active plate stands on the ground, for the room to light
    const a = pose(this.active - this.head, cfg, {});
    const foot = projectPoint(this.vp, a.x, cfg.floorY, a.z);
    this.pool = foot[2] > 0
      ? [foot[0] * 0.5 + 0.5, foot[1] * 0.5 + 0.5, clamp(a.focus + 0.25)]
      : [0.5, this.horizon, 0.2];

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(this.quad);
    this.screenPass(this.room);

    const seq = order(this.plates.length, this.head);

    // reflections first: they are light coming out of the floor, so anything
    // the floor is made of has to be laid over them, not under
    gl.useProgram(this.plate.p);
    gl.uniform1i(this.plate.u.uArt, bind(gl, this.art, 0));
    gl.uniform2f(this.plate.u.uTexel, this.texel[0], this.texel[1]);
    gl.uniform1f(this.plate.u.uTime, this.time);
    gl.uniform1f(this.plate.u.uMat, this.mat);
    gl.uniform1f(this.plate.u.uFogNear, cfg.z0 + cfg.step * 1.1);
    gl.uniform1f(this.plate.u.uFogFar, cfg.z0 + cfg.step * (cfg.vis + 1.4));
    for (const i of seq) this.drawPlate(i, true);

    gl.bindVertexArray(this.quad);
    this.screenPass(this.haze);

    gl.useProgram(this.plate.p);
    gl.uniform1i(this.plate.u.uArt, bind(gl, this.art, 0));
    for (const i of seq) this.drawPlate(i, false);

    this.drawDust();

    gl.bindVertexArray(this.quad);
    gl.useProgram(this.grain.p);
    gl.uniform2f(this.grain.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.grain.u.uTime, this.time);
    gl.uniform1f(this.grain.u.uMat, this.mat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  screenPass(prog) {
    const gl = this.gl;
    const tint = this.plates[this.active].tint;
    gl.useProgram(prog.p);
    gl.uniform2f(prog.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(prog.u.uTime, this.time);
    gl.uniform1f(prog.u.uMat, this.mat);
    gl.uniform1f(prog.u.uHorizon, this.horizon);
    gl.uniform3fv(prog.u.uPool, this.pool);
    gl.uniform3fv(prog.u.uTint, tint);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  drawPlate(i, mirror) {
    const cfg = this.cfg;
    const d = i - this.head;
    if (!visible(d, cfg)) return;

    const gl = this.gl;
    const u = this.plate.u;
    const c = this.plates[i];
    const s = pose(d, cfg, this.slot);
    if (s.alpha <= 0.004) return;

    // a slow float, so a plate the visitor has parked on is still alive
    const bob = Math.sin(this.time * 0.30 + c.seed) * 0.010 * cfg.z0 * 0.30;

    compose(
      [s.x, s.y + bob, s.z],
      [s.rx - this.pointer.y * 0.03, s.ry + this.pointer.x * 0.05, s.rz],
      [PLATE_W, PLATE_W / PLATE_ASPECT],
      this.model,
    );
    const m = mirror ? multiply(this.mirror, this.model, this.mirrored) : this.model;
    multiply(this.vp, m, this.mvp);

    gl.bindVertexArray(this.quad);
    gl.uniformMatrix4fv(u.uMVP, false, this.mvp);
    gl.uniformMatrix4fv(u.uModel, false, m);
    gl.uniform2f(u.uUV0, c.tile.u0, c.tile.v0);
    gl.uniform2f(u.uUV1, c.tile.u1, c.tile.v1);
    gl.uniform3fv(u.uTint, c.tint);
    gl.uniform1f(u.uFocus, s.focus);
    gl.uniform1f(u.uBlur, (1 - s.focus) * BLUR_MAX + Math.max(0, -d) * 3.0);
    gl.uniform1f(u.uMirror, mirror ? 1 : 0);
    gl.uniform1f(u.uAlpha, s.alpha);
    gl.uniform1f(u.uSeed, c.seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  drawDust() {
    const gl = this.gl;
    const u = this.dust.u;
    gl.useProgram(this.dust.p);
    gl.uniformMatrix4fv(u.uMVP, false, this.vp);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uMat, this.mat);
    gl.uniform1f(u.uSpan, this.cfg.z0);
    gl.uniform1f(u.uPx, this.canvas.height * 0.5 / Math.tan(FOV * 0.5) * 0.010);
    gl.uniform3fv(u.uTint, this.plates[this.active].tint);
    gl.bindVertexArray(this.dustVAO);
    gl.drawArrays(gl.POINTS, 0, DUST);
    gl.bindVertexArray(null);
  }
}
