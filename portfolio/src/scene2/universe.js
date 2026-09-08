// The room, the deck, the ribbon and the embers.
//
// Card depth is chosen, and the world position is then SOLVED so the
// projection puts the card where the composition wants it on screen. That is
// why the parallax, the dolly and the hover tilt all behave correctly at any
// viewport aspect: the depths are physically consistent rather than guessed,
// and the layout re-fits instead of cropping.

import { createGL, program, unitQuad, texture, upload, bind } from '../gl/renderer.js';
import {
  ROOM_VERT, ROOM_FRAG, CARD_VERT, CARD_FRAG,
  RIBBON_VERT, RIBBON_FRAG, EMBER_VERT, EMBER_FRAG,
} from '../gl/shaders2.js';
import { perspective, multiply, compose, identity, projectPoint } from '../lib/mat4.js';
import { TOOLS, KIND_TINT } from '../data/content.js';
import { buildAtlas } from './cards.js';
import { clamp, damp, lerp } from '../lib/ease.js';

const FOV = 0.72;                 // radians
const NEAR_Z = -3.5;              // depth 0 lands here
const FAR_Z = -11.6;              // depth 1 lands here
// A card's world width is solved from how much of the SCREEN a nearest card
// should occupy. Fixing the world size instead makes the deck balloon on a
// phone, because apparent size goes as 1/aspect and a portrait aspect is a
// third of a landscape one — the same deck that reads as a room on a laptop
// becomes four overlapping billboards on a handset.
// Fraction of frame WIDTH one card fills. The plates are square now, so a card
// is as tall as it is wide; the old landscape values would have made the deck
// 1.6x taller overnight and stacked the rows into each other.
const CARD_NDC = 0.155;           // landscape
const CARD_NDC_PORTRAIT = 0.255;
const TRAIL_SECONDS = 6.5;
const TRAIL_STEPS = 150;
const EMBERS = 620;

export class Universe {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.quad = unitQuad(gl);
    this.room = program(gl, ROOM_VERT, ROOM_FRAG, 'room');
    this.card = program(gl, CARD_VERT, CARD_FRAG, 'card');
    this.ribbon = program(gl, RIBBON_VERT, RIBBON_FRAG, 'ribbon');
    this.ember = program(gl, EMBER_VERT, EMBER_FRAG, 'ember');

    const atlas = buildAtlas();
    this.atlas = atlas;
    this.art = texture(gl);
    upload(gl, this.art, atlas.canvas);
    // Every vector mark and monogram is already on that first upload, so the
    // deck is complete from frame one. Supplied images land later and repaint
    // their own tile; re-upload only if one actually arrived, so a deck with
    // no rasters — or a failed fetch — costs nothing.
    atlas.ready.then((changed) => {
      if (changed) upload(gl, this.art, atlas.canvas);
    });

    this.proj = new Float32Array(16);
    this.view = identity(new Float32Array(16));
    this.mvp = new Float32Array(16);
    this.model = new Float32Array(16);

    this.cards = TOOLS.map((tool, i) => ({
      tool,
      tile: atlas.tiles[i],
      tint: KIND_TINT[tool.kind] || KIND_TINT.llm,
      seed: (i * 37.7) % 11,
      hot: 0,
      z: 0, x: 0, y: 0,
      // per-card variation is only in HOW it travels once it exists, never in
      // WHEN it arrives — a stagger would read as a queue of fades
      swing: Math.sin(i * 2.39) * 0.5,
    }));

    this.head = [0, 0, -5];
    this.trail = [];
    this.buildBuffers();

    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.hover = -1;
    this.dolly = 0;
    this.mat = 0;
    this.time = 0;
  }

  buildBuffers() {
    const gl = this.gl;

    // ---- ribbon: a strip rebuilt every frame -----------------------------
    this.ribbonVAO = gl.createVertexArray();
    gl.bindVertexArray(this.ribbonVAO);
    this.ribbonPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribbonPos);
    gl.bufferData(gl.ARRAY_BUFFER, TRAIL_STEPS * 2 * 5 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    gl.bindVertexArray(null);
    this.ribbonData = new Float32Array(TRAIL_STEPS * 2 * 5);

    // ---- embers: static positions, animated in the shader ----------------
    this.emberVAO = gl.createVertexArray();
    gl.bindVertexArray(this.emberVAO);
    const buf = gl.createBuffer();
    const data = new Float32Array(EMBERS * 5);
    for (let i = 0; i < EMBERS; i++) {
      const r = Math.random();
      data[i * 5 + 0] = (Math.random() * 2 - 1) * 4.6;
      data[i * 5 + 1] = (Math.random() * 2 - 1) * 2.5;
      data[i * 5 + 2] = lerp(NEAR_Z + 0.6, FAR_Z - 1.2, Math.random());
      data[i * 5 + 3] = r;
      data[i * 5 + 4] = lerp(1.2, 4.4, r * r);
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
    this.dpr = dpr;
    this.aspect = w / h;
    this.portrait = h / w > 1.02;
    perspective(FOV, this.aspect, 0.1, 40, this.proj);
    this.solve();
  }

  /**
   * Place every card so the projection lands it at its intended screen
   * position. Given a target in NDC and a depth, the world position that
   * projects there is exact — no fitting, no drift when the viewport changes.
   */
  solve() {
    const tanHalf = Math.tan(FOV * 0.5);
    const ndc = this.portrait ? CARD_NDC_PORTRAIT : CARD_NDC;
    this.cardW = ndc * -NEAR_Z * tanHalf * this.aspect;
    // portrait has far less horizontal room, so the deck is pulled in and the
    // whole composition is nudged up above the copy that sits below it
    // Portrait has a third of the horizontal room and the copy sits below the
    // deck, so the composition pulls in and lifts. The lift is small on
    // purpose: at 0.10 it carried the topmost card off the top of the frame,
    // which is a worse failure than the deck sitting a little low.
    const spread = this.portrait ? 0.42 : 1.0;
    const rise = this.portrait ? 0.055 : 0.0;
    // Vertical squash, portrait only. The authored y values are one set shared
    // by both orientations, and a phone has far less room per unit of y, so the
    // extremes of the deck walked off the top and into the copy below. Pulling
    // them toward the centre keeps the same arrangement at a shorter stride.
    const squash = this.portrait ? 0.78 : 1.0;

    for (const c of this.cards) {
      const z = lerp(NEAR_Z, FAR_Z, c.tool.d);
      const dist = -z;
      c.z = z;
      // tanh rather than a plain scale: the middle of the deck keeps the
      // spacing the layout was authored with while the outermost cards pull in
      // off the frame edge, so nothing is sliced in half by the viewport at a
      // wide aspect and the deck still reads as continuing past the frame
      const fx = Math.tanh(c.tool.x * 0.92) * 1.06 * spread;
      c.x = fx * dist * tanHalf * this.aspect;
      c.y = (c.tool.y * squash + rise) * dist * tanHalf;
    }
    // painter's order: the depth test is off so the deck is sorted by hand
    this.order = this.cards.map((c, i) => i)
      .sort((a, b) => this.cards[a].z - this.cards[b].z);
  }

  /** Head of the ribbon: an orbit with slower drifts layered on, so its path
   *  never visibly repeats. */
  headAt(t) {
    const a = t * 0.42;
    const r = 2.15 + Math.sin(t * 0.23) * 0.55;
    return [
      Math.cos(a) * r + Math.sin(t * 0.17) * 0.7,
      Math.sin(a * 1.13) * 1.05 + Math.cos(t * 0.31) * 0.32,
      lerp(NEAR_Z, FAR_Z, 0.42 + 0.34 * Math.sin(t * 0.19 + 1.1)),
    ];
  }

  update(dt, opts) {
    this.time += dt;
    const t = this.time;

    this.mat = opts.mat;
    this.dolly = opts.dolly;

    const p = this.pointer;
    p.x = damp(p.x, p.tx, 3.0, dt);
    p.y = damp(p.y, p.ty, 3.0, dt);

    this.head = this.headAt(t);

    // rebuild the trail from where the head has been. Sampling the parametric
    // path backwards rather than pushing history means the trail is exact at
    // any frame rate and survives a tab that was throttled.
    this.trail.length = 0;
    for (let i = 0; i < TRAIL_STEPS; i++) {
      const age = i / (TRAIL_STEPS - 1);
      this.trail.push(this.headAt(t - age * TRAIL_SECONDS));
    }

    // hover: which card is nearest the pointer on screen
    multiply(this.proj, this.viewMatrix(), this.mvp);
    let best = -1;
    let bestD = 0.16;
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      const [nx, ny, w] = projectPoint(this.mvp, c.x, c.y, c.z);
      if (w <= 0) continue;
      const dx = (nx - p.tx) * this.aspect * 0.5;
      const dy = (ny + p.ty) * 0.5;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    this.hover = best;
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i].hot = damp(this.cards[i].hot, i === best ? 1 : 0, 6.5, dt);
    }
  }

  viewMatrix() {
    // the camera dollies forward through the deck and drifts with the pointer
    const v = identity(this.view);
    v[12] = -this.pointer.x * 0.44;
    v[13] = this.pointer.y * 0.30;
    v[14] = this.dolly * 2.35;
    return v;
  }

  render() {
    if (!this.ok) return;
    const gl = this.gl;
    const t = this.time;
    const mat = this.mat;

    multiply(this.proj, this.viewMatrix(), this.mvp);
    const [hx, hy, hw] = projectPoint(this.mvp, ...this.head);
    const headScreen = hw > 0
      ? [hx * 0.5 + 0.5, hy * 0.5 + 0.5, clamp(1.6 / hw)]
      : [0.5, 0.5, 0];

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ---- the room -------------------------------------------------------
    gl.bindVertexArray(this.quad);
    gl.useProgram(this.room.p);
    let u = this.room.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uMat, Math.max(mat, 0.10));
    gl.uniform3fv(u.uHead, headScreen);
    gl.uniform2f(u.uPar, this.pointer.x, this.pointer.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ---- embers, one field through the whole room -----------------------
    this.drawEmbers();

    // ---- cards, back to front, with the ribbon woven between them -------
    // the strip is split at the deck's mid depth and drawn in two passes, so
    // the trail passes BEHIND the far cards and IN FRONT of the near ones
    const midZ = (NEAR_Z + FAR_Z) * 0.5;
    let ribbonDrawn = false;

    gl.useProgram(this.card.p);
    u = this.card.u;
    gl.uniform1i(u.uArt, bind(gl, this.art, 0));
    gl.uniform1f(u.uMat, mat);
    gl.uniform1f(u.uFogNear, -NEAR_Z + 1.8);
    gl.uniform1f(u.uFogFar, -FAR_Z + 2.6);
    gl.uniform1f(u.uTime, t);

    for (const i of this.order) {
      const c = this.cards[i];
      if (!ribbonDrawn && c.z > midZ) {
        this.drawRibbon(false);
        ribbonDrawn = true;
        gl.useProgram(this.card.p);
        gl.uniform1i(u.uArt, bind(gl, this.art, 0));
      }
      this.drawCard(c);
    }
    if (!ribbonDrawn) this.drawRibbon(false);
    this.drawRibbon(true);

    gl.bindVertexArray(null);
  }

  drawCard(c) {
    const gl = this.gl;
    const u = this.card.u;
    // every pass binds the array it needs: the ember and ribbon passes leave
    // none bound, and a card drawn without one silently produces nothing
    gl.bindVertexArray(this.quad);
    const t = this.time;

    // once a card exists it drifts: a slow float, a lean toward the pointer,
    // and a lift on hover. The arrival itself is shared; only this differs.
    const bob = Math.sin(t * 0.34 + c.seed) * 0.045
              + Math.cos(t * 0.21 + c.seed * 1.7) * 0.028;
    const lift = c.hot * 0.10;
    const settle = 1 - this.mat;
    const enterY = settle * c.swing * 0.55;
    const enterZ = settle * 1.35;

    const scale = this.cardW * (1 + c.hot * 0.055);
    compose(
      [c.x, c.y + bob + lift + enterY, c.z + enterZ],
      [
        -this.pointer.y * 0.10 + c.hot * 0.05,
        this.pointer.x * 0.16 + Math.sin(t * 0.19 + c.seed) * 0.035,
        Math.sin(t * 0.13 + c.seed * 2.1) * 0.014,
      ],
      [scale, scale / this.atlas.aspect],
      this.model,
    );
    const mvp = multiply(this.mvp, this.model, new Float32Array(16));

    gl.uniformMatrix4fv(u.uMVP, false, mvp);
    gl.uniformMatrix4fv(u.uModel, false, this.model);
    gl.uniform2f(u.uUV0, c.tile.u0, c.tile.v0);
    gl.uniform2f(u.uUV1, c.tile.u1, c.tile.v1);
    gl.uniform3fv(u.uTint, c.tint);
    gl.uniform1f(u.uHot, c.hot);
    gl.uniform1f(u.uSeed, c.seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** @param {boolean} front only the segments nearer than the deck's midpoint */
  drawRibbon(front) {
    const gl = this.gl;
    const midZ = (NEAR_Z + FAR_Z) * 0.5;
    const d = this.ribbonData;
    let n = 0;

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const isFront = p[2] > midZ;
      if (isFront !== front) {
        // a gap: emit a degenerate pair so the strip does not bridge it
        if (n > 0 && d[(n - 1) * 5 + 3] < 1.0) {
          for (const side of [-1, 1]) {
            d[n * 5 + 0] = p[0]; d[n * 5 + 1] = p[1]; d[n * 5 + 2] = p[2];
            d[n * 5 + 3] = 1.0; d[n * 5 + 4] = side;
            n++;
          }
        }
        continue;
      }
      const age = i / (this.trail.length - 1);
      // the strip narrows as it ages, so the trail tapers rather than ending
      const half = lerp(0.105, 0.016, age) * (0.55 + 0.45 * Math.sin(i * 0.31));

      // a stable normal: perpendicular to the path in the camera's plane
      const nxt = this.trail[Math.min(i + 1, this.trail.length - 1)];
      const prv = this.trail[Math.max(i - 1, 0)];
      let tx = nxt[0] - prv[0];
      let ty = nxt[1] - prv[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;

      for (const side of [-1, 1]) {
        d[n * 5 + 0] = p[0] - ty * half * side;
        d[n * 5 + 1] = p[1] + tx * half * side;
        d[n * 5 + 2] = p[2];
        d[n * 5 + 3] = age;
        d[n * 5 + 4] = side;
        n++;
      }
    }
    if (n < 4) return;

    gl.useProgram(this.ribbon.p);
    gl.uniformMatrix4fv(this.ribbon.u.uMVP, false, this.mvp);
    gl.uniform1f(this.ribbon.u.uMat, this.mat);
    gl.bindVertexArray(this.ribbonVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribbonPos);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.bindVertexArray(null);
  }

  drawEmbers() {
    const gl = this.gl;
    gl.useProgram(this.ember.p);
    const u = this.ember.u;
    gl.uniformMatrix4fv(u.uMVP, false, this.mvp);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uPx, this.canvas.height * 0.5 / Math.tan(FOV * 0.5) * 0.011);
    gl.uniform3fv(u.uHead, this.head);
    gl.uniform1f(u.uMat, this.mat);
    gl.bindVertexArray(this.emberVAO);
    gl.drawArrays(gl.POINTS, 0, EMBERS);
    gl.bindVertexArray(null);
  }
}
