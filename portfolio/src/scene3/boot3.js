// Act III: mount, gate, run, and hand over control.
//
// The scene renders only while its section is on screen. Three different
// things can drive the hand — the opening sequence, the pointer, and a card
// that was focused or tapped — and this file is where they are wired to the
// one continuous position the scene reads. The cards themselves are buttons,
// so the act is playable with a keyboard and with a thumb, not only with a
// mouse that happens to be hovering the right part of an arc.

import { Chrono } from './chrono.js';
import { sample3 } from './timeline3.js';
import { N } from './layout3.js';
import { clamp } from '../lib/ease.js';

const LAST = N - 1;

export async function initChrono() {
  const section = document.getElementById('chrono');
  const canvas = document.getElementById('chronoStage');
  const deckEl = document.getElementById('chronoDeck');
  if (!section || !canvas || !deckEl) throw new Error('no chrono section');

  const scene = new Chrono(canvas, deckEl);
  if (!scene.ok) throw new Error('WebGL unavailable');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const resize = () => scene.resize(
    canvas.clientWidth || section.clientWidth || window.innerWidth,
    canvas.clientHeight || window.innerHeight,
    Math.min(window.devicePixelRatio || 1, 2));
  resize();

  // ---- the pointer -------------------------------------------------------
  if (fine && !reduced) {
    section.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      scene.aimAt(e.clientX - r.left, e.clientY - r.top);
    }, { passive: true });
  }

  // ---- keyboard and touch ------------------------------------------------
  // focusin rather than focus, because focus does not bubble and the cards are
  // rebuilt from data; a tab into any of them has to drive the hand
  const drive = (e) => {
    const btn = e.target.closest?.('.c');
    if (!btn) return;
    scene.commandTo(+btn.dataset.i);
    if (reduced) still();
  };
  deckEl.addEventListener('focusin', drive);
  deckEl.addEventListener('click', drive);

  // arrow keys walk the timeline rather than making the visitor tab through it
  deckEl.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const from = +(e.target.closest?.('.c')?.dataset.i ?? 0);
    const to = clamp(from + step, 0, LAST);
    if (to === from) return;
    e.preventDefault();
    deckEl.querySelector(`.c[data-i="${to}"]`)?.focus();
  });

  // ---- the loop ----------------------------------------------------------
  let live = false;
  let started = false;
  let t0 = 0;
  let last = 0;
  let raf = 0;

  /** 0 as the pin engages, 1 as it releases. */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    if (travel <= 0) return 0;
    return clamp(-r.top / travel);
  };

  const frame = (now) => {
    if (!live) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const state = sample3((now - t0) / 1000, progress(), LAST);
    if (!started && state.rail > 0.01) {
      started = true;
      section.classList.add('is-on');
    }
    scene.update(dt, state);
    scene.render();
  };

  /** One frame of the finished composition, for prefers-reduced-motion. */
  const still = () => {
    section.classList.add('is-on');
    scene.settle(sample3(30, 0.4, LAST), scene.command ?? LAST);
  };

  window.addEventListener('resize', debounce(() => {
    resize();
    if (reduced) still();
  }, 150));

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (!live) { cancelAnimationFrame(raf); return; }
    // the walk down the timeline plays once, the first time the act takes the
    // frame — scrolling back up should not restart it
    if (!t0) t0 = performance.now();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }, { rootMargin: '12% 0px' }).observe(section);

  if (reduced) {
    live = false;
    still();
  }

  return scene;
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
