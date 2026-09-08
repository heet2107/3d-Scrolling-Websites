// Act III — the room, the clock, and the seven years.
//
// Two layers over one geometry. The canvas draws the fitted arc, the light the
// clock throws down it and the floor that catches the spill; the seven cards
// are DOM, because each carries real body copy that has to stay crisp,
// selectable and reachable by a screen reader, and each has to be a real
// <button> so a keyboard or a thumb can drive the act. Both layers are placed
// from layout3.js, so they cannot drift apart.
//
// The one thing this file really does is decide WHICH YEAR the visitor means.
// That answer is a continuous position along the timeline, not an index: the
// hand can sit between two years and drift, while the cards read its rounded
// value. See projectToPath() in layout3.js for why the cursor's x alone is not
// an answer to that question.

import { createGL, program, unitQuad } from '../gl/renderer.js';
import {
  FULL_VERT, ROOM_FRAG, CLOCK_FRAG, MOTE_VERT, MOTE_FRAG,
} from '../gl/shaders3.js';
import {
  computeChrono, projectToPath, arcPointAt, toQ, N,
} from './layout3.js';
import { YEARS } from '../data/content.js';
import { clamp, damp, lerp } from '../lib/ease.js';

const MOTES = 260;
const HAND_LAMBDA = 4.6;     // the hand has weight; it arrives, it does not cut
const HEAT_LAMBDA = 7.0;

export class Chrono {
  constructor(canvas, deckEl) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.ok = !!this.gl;
    if (!this.ok) return;

    const gl = this.gl;
    this.quad = unitQuad(gl);
    this.room = program(gl, FULL_VERT, ROOM_FRAG, 'chrono room');
    this.clock = program(gl, FULL_VERT, CLOCK_FRAG, 'chrono clock');
    this.mote = program(gl, MOTE_VERT, MOTE_FRAG, 'chrono mote');
    this.buildMotes();

    this.deck = new Deck(deckEl);

    this.time = 0;
    this.pos = 0;                    // the hand, continuous 0..N-1
    this.pointerT = 0;               // where the pointer says the hand belongs
    this.hasPointer = false;
    this.command = null;             // a card was activated, by key or by thumb
    this.take = 0;                   // how far that activation has taken over
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.heat = new Float32Array(N);
    this.qNode = new Float32Array(N * 2);
    this.state = null;
  }

  buildMotes() {
    const gl = this.gl;
    this.moteVAO = gl.createVertexArray();
    gl.bindVertexArray(this.moteVAO);
    const buf = gl.createBuffer();
    const data = new Float32Array(MOTES * 4);
    for (let i = 0; i < MOTES; i++) {
      const r = Math.random();
      data[i * 4 + 0] = Math.random();
      data[i * 4 + 1] = Math.random();
      data[i * 4 + 2] = r;
      // a few large, soft motes and many small ones reads as depth; a uniform
      // size reads as a texture laid over the frame
      data[i * 4 + 3] = lerp(1.1, 4.6, r * r);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
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
    this.dpr = dpr;

    const L = computeChrono(w, h);
    this.L = L;
    this.deck.place(L);

    // everything the shaders read is pre-converted once per resize; the frame
    // loop only ever moves the landing point
    this.qArc = new Float32Array([...toQ(L, L.arc.cx, L.arc.cy), L.arc.r / h]);
    for (let i = 0; i < N; i++) {
      const [qx, qy] = toQ(L, L.nodes[i].x, L.nodes[i].y);
      this.qNode[i * 2] = qx;
      this.qNode[i * 2 + 1] = qy;
    }
    this.qPivot = new Float32Array(toQ(L, L.pivot.x, L.pivot.y));
    this.ballR = L.pivot.r / h;
    this.horizon = 1 - L.horizon / h;
    this.sweep = new Float32Array([L.a0, L.a1]);
    // the shaders measure every radius in frame-heights, which a standing
    // composition has far too many of; layout3 says how far the light may run
    this.spread = L.spread;
  }

  /** A pointer sample, in the pin's own pixels. */
  aimAt(x, y) {
    this.pointer.tx = (x / this.L.w) * 2 - 1;
    this.pointer.ty = (y / this.L.h) * 2 - 1;
    // In the standing composition the stage sits beside the rail, so a pointer
    // resting on the panel to READ it is nearer some other year than the one
    // it is reading — and hover would swap the card out from under it. There
    // the chips are the whole interface, exactly as they are for a thumb.
    if (this.L.portrait) return;
    this.pointerT = projectToPath(this.L.path, x, y);
    // the pointer moving is not by itself a decision, so it does not steal the
    // hand back from a card the visitor deliberately chose
    this.hasPointer = true;
  }

  /** A card was focused or activated: that IS a decision, and it takes over. */
  commandTo(i) {
    this.command = clamp(i, 0, N - 1);
  }

  update(dt, state) {
    this.time += dt;
    this.state = state;

    const p = this.pointer;
    p.x = damp(p.x, p.tx, 3.0, dt);
    p.y = damp(p.y, p.ty, 3.0, dt);

    // Before the pointer has ever been seen its target IS the sequence's, so
    // the authority ramp has nothing to blend toward and the hand cannot jump
    // at the moment the act goes live.
    const live = this.command !== null
      ? this.command
      : (this.hasPointer ? this.pointerT : state.scripted);
    this.take = damp(this.take, this.command !== null ? 1 : 0, 6.0, dt);
    const authority = Math.max(state.authority, this.take);

    const target = lerp(state.scripted, live, authority);
    this.pos = damp(this.pos, target, HAND_LAMBDA, dt);

    for (let i = 0; i < N; i++) {
      const want = Math.max(0, 1 - Math.abs(i - this.pos));
      this.heat[i] = damp(this.heat[i], want, HEAT_LAMBDA, dt);
    }
    this.deck.apply(this.pos, state.lit);
  }

  /**
   * Land on the finished composition and hold it there, with no loop and no
   * drift. The damping in update() would take a second of frames to arrive, so
   * everything it would have converged on is written straight in.
   */
  settle(state, i) {
    this.state = state;
    this.pos = clamp(i, 0, N - 1);
    this.command = this.pos;
    this.take = 1;
    for (let k = 0; k < N; k++) {
      this.heat[k] = Math.max(0, 1 - Math.abs(k - this.pos));
    }
    this.deck.apply(this.pos, state.lit);
    this.render();
  }

  render() {
    if (!this.ok || !this.L) return;
    const gl = this.gl;
    const s = this.state;
    if (!s) return;

    const land = arcPointAt(this.L, this.pos);
    const qLand = toQ(this.L, land.x, land.y);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(this.quad);

    gl.useProgram(this.room.p);
    let u = this.room.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uIn, s.room);
    gl.uniform1f(u.uDrift, s.drift);
    gl.uniform2f(u.uPar, this.pointer.x, this.pointer.y);
    gl.uniform3fv(u.uArc, this.qArc);
    gl.uniform2fv(u.uSweep, this.sweep);
    gl.uniform1f(u.uRail, s.rail);
    gl.uniform2fv(u.uNode, this.qNode);
    gl.uniform1fv(u.uHeat, this.heat);
    gl.uniform1f(u.uLit, s.lit);
    gl.uniform2fv(u.uLand, qLand);
    gl.uniform1f(u.uLandA, land.a);
    gl.uniform1f(u.uHorizon, this.horizon);
    gl.uniform1f(u.uSpread, this.spread);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(this.clock.p);
    u = this.clock.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uIn, s.ball);
    gl.uniform2f(u.uPar, this.pointer.x, this.pointer.y);
    gl.uniform2fv(u.uPivot, this.qPivot);
    gl.uniform1f(u.uBallR, this.ballR);
    gl.uniform2fv(u.uLand, qLand);
    gl.uniform1f(u.uCore, s.rail);
    gl.uniform1f(u.uHand, s.ball);
    gl.uniform1f(u.uSpread, this.spread);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(this.mote.p);
    u = this.mote.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform2fv(u.uPivot, this.qPivot);
    gl.uniform2fv(u.uLand, qLand);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uIn, s.room);
    gl.bindVertexArray(this.moteVAO);
    gl.drawArrays(gl.POINTS, 0, MOTES);
    gl.bindVertexArray(null);
  }
}

// --------------------------------------------------------------------------

/**
 * The seven year cards.
 *
 * Every measurement written here comes from layout3, as a custom property, so
 * the stylesheet describes how a card LOOKS and never where it is. The panel
 * is a child of its own button and is placed by an offset from that button's
 * corner, which is what lets the same markup be a card standing on an arc in
 * landscape and a chip on a rail with a stage beside it in portrait.
 */
class Deck {
  constructor(el) {
    this.el = el;
    this.cards = [];
    this.live = -1;
    this.shown = -1;
    if (!el) return;

    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'A journey through time — seven years');
    el.innerHTML = YEARS.map((y, i) => `
      <button class="c" type="button" data-i="${i}" aria-pressed="false">
        <i class="c__stem" aria-hidden="true"></i>
        <b class="c__year">${y.year}</b>
        <i class="c__tag">${y.tag}</i>
        <span class="c__body">
          <strong class="c__title">${y.title}</strong>
          <span class="c__copy">${y.body}</span>
          <span class="c__marks">${y.marks.map((m) => `<i>${m}</i>`).join('')}</span>
        </span>
      </button>`).join('');
    this.cards = [...el.querySelectorAll('.c')];
  }

  place(L) {
    if (!this.el) return;
    // the stylesheet is told which composition is running rather than deciding
    // for itself: a media query and layout3's own portrait test would disagree
    // for one hairline band of aspect ratios, and in that band the cards would
    // be positioned for one composition and styled for the other
    this.el.classList.toggle('is-tall', L.portrait);
    this.el.style.setProperty('--hw', L.headW);
    this.el.style.setProperty('--hh', L.headH);
    this.cards.forEach((el, i) => {
      const c = L.cards[i];
      el.style.setProperty('--x', Math.round(c.x));
      el.style.setProperty('--y', Math.round(c.y));
      el.style.setProperty('--bx', c.bx);
      el.style.setProperty('--by', c.by);
      el.style.setProperty('--bw', c.bw);
      el.style.setProperty('--stem', Math.max(0, c.stem));
    });
  }

  /** @param {number} pos the hand, continuous  @param {number} lit years reached */
  apply(pos, lit) {
    const live = Math.round(clamp(pos, 0, N - 1));
    const shown = Math.floor(clamp(lit, 0, N));
    if (live === this.live && shown === this.shown) return;
    this.live = live;
    this.shown = shown;
    this.cards.forEach((el, i) => {
      const on = i === live;
      el.classList.toggle('is-live', on);
      el.classList.toggle('is-in', i < shown);
      // aria-pressed is what tells a screen reader which year is currently
      // held; without it the deck is seven buttons with no state at all
      el.setAttribute('aria-pressed', String(on));
    });
  }
}
