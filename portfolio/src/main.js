// Boot, orchestration, the frame loop.
//
// Order of operations matters here: the page must sit on TRUE black until the
// fonts are loadable and the first composition is measured, otherwise the
// sequence starts and the wordmark pops in three frames later. Nothing is
// revealed until everything the first eight seconds needs is in hand.

import { Stage1 } from './gl/stage1.js';
import { computeLayout } from './scene1/layout1.js';
import { buildWord, fontsReady } from './scene1/type.js';
import { Furniture, headerRule } from './scene1/furniture.js';
import { sample, letterOrder, CUES, T } from './scene1/timeline1.js';
import { damp, clamp } from './lib/ease.js';

// a cinematic page manages its own positions; the browser restoring an old
// scroll offset mid-boot yanks the visitor (and any scripted anchor) around
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const MIN_BLACK = 560;          // the darkness has to be felt, even on fibre

const root = document.documentElement;
const boot = document.getElementById('boot');
const bootFill = document.getElementById('bootFill');
const bootEnter = document.getElementById('bootEnter');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const app = {
  stage: null,
  furniture: null,
  layout: null,
  word: null,
  order: [],
  t0: 0,
  fired: new Set(),
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  running: false,
  onScreen: true,
};
window.__app = app;

// --------------------------------------------------------------------------

async function main() {
  const canvas = document.getElementById('stage');
  app.stage = new Stage1(canvas);
  app.furniture = new Furniture(document);

  if (!app.stage.ok) return degrade('WebGL unavailable');

  const steps = 2;
  let done = 0;
  const tick = () => { bootFill.style.width = `${(++done / steps) * 100}%`; };

  const startedAt = performance.now();
  await fontsReady();
  tick();

  layout();
  window.addEventListener('resize', debounce(layout, 140));
  window.addEventListener('orientationchange', () => setTimeout(layout, 220));
  tick();

  const held = performance.now() - startedAt;
  if (held < MIN_BLACK) await wait(MIN_BLACK - held);

  // the later acts build while the opening plays, so scrolling into them is
  // instant; each one runs only while it is actually on screen
  bootActs();

  begin();
}

/**
 * Later acts are loaded on their own and are allowed to fail: a scene that
 * cannot start leaves its section as readable markup rather than taking the
 * whole page down with it.
 */
function bootActs() {
  const acts = [
    ['stack',  () => import('./scene2/boot2.js'), 'initStack'],
    ['chrono', () => import('./scene3/boot3.js'), 'initChrono'],
    ['work',   () => import('./scene4/boot4.js'), 'initWork'],
    ['record', () => import('./scene5/boot5.js'), 'initRecord'],
    ['finale', () => import('./scene6/boot6.js'), 'initFinale'],
  ];
  // Settled means every act has either started or failed — not that all of
  // them succeeded. Review tooling needs a signal it can wait on, because a
  // fixed timeout races the lazy imports and photographs half-built sections.
  Promise.allSettled(acts.map(([name, load, fn]) => load()
    .then((m) => m[fn]())
    .then((inst) => { app[name] = inst; })
    .catch((e) => { console.warn(`[hb] ${name} unavailable:`, e.message); })))
    .then(() => { window.__actsSettled = true; });
}

function begin() {
  boot.classList.add('is-done');
  root.classList.remove('is-booting');
  app.t0 = performance.now();
  app.running = true;
  bindPointer();

  const drawRule = headerRule(document.getElementById('hdrRule'),
                              document.getElementById('hdrRulePath'));
  if (drawRule) window.addEventListener('resize', debounce(drawRule, 160));

  // ?t=4.2 starts the sequence part-way through and ?t=end lands on the
  // settled composition — a review aid for tuning one beat without sitting
  // through the whole opening each time
  const q = new URLSearchParams(location.search).get('t');
  if (q !== null) {
    const at = q === 'end' ? T.settled : parseFloat(q);
    if (Number.isFinite(at)) {
      app.t0 = performance.now() - at * 1000;
      for (const [when, name] of CUES) {
        if (at >= when) { app.fired.add(name); root.classList.add(`is-${name}`); }
      }
    }
  }

  if (reduced) {
    // honour the preference fully: land on the finished composition and hold
    // it — no build-up, no drifting grain
    app.t0 = performance.now() - T.settled * 1000;
    for (const [, name] of CUES) root.classList.add(`is-${name}`);
    renderStill();
    window.addEventListener('resize', debounce(renderStill, 160));
    return;
  }
  requestAnimationFrame(frame);
}

// --------------------------------------------------------------------------

function layout() {
  const L = computeLayout(window.innerWidth, window.innerHeight);
  app.layout = L;
  app.stage.resize(L);

  const capPx = Math.round(L.word.capH * L.dpr);
  const key = `${capPx}|${L.word.lines.join('/')}`;
  if (!app.word || app.word.key !== key) {
    const word = buildWord(capPx, app.stage.maxTexture, L.word.lines,
                           L.word.ratio);
    word.key = key;
    app.word = word;
    app.stage.setWord(word);
    app.order = letterOrder(word.letters);
  }
  app.furniture.apply(L);
}

function bindPointer() {
  if (reduced || matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener('pointermove', (e) => {
    // normalised to -1..1, then damped in the frame loop; the response is
    // deliberately small — depth, not a toy
    app.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    app.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    app.pointer.tx = 0;
    app.pointer.ty = 0;
  });
}

let last = 0;
function frame(now) {
  if (!app.running) return;
  requestAnimationFrame(frame);
  if (!app.onScreen) return;

  const t = (now - app.t0) / 1000;
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;

  for (const [at, name] of CUES) {
    if (t >= at && !app.fired.has(name)) {
      app.fired.add(name);
      root.classList.add(`is-${name}`);
    }
  }

  const p = app.pointer;
  p.x = damp(p.x, p.tx, 3.1, dt);
  p.y = damp(p.y, p.ty, 3.1, dt);
  // parallax only comes alive once the composition has settled
  const gate = clamp((t - T.settled + 0.9) / 1.2);
  app.stage.parallax.x = p.x * gate;
  app.stage.parallax.y = p.y * gate;

  const state = sample(t, app.word.letters.length, app.order);

  // after the intro the wordmark breathes very slightly, so the frame never
  // becomes a static image
  if (state.settled) {
    const b = Math.sin(t * 0.42) * 0.5 + Math.sin(t * 0.27 + 1.3) * 0.5;
    for (const l of state.letters) l.dy = b * 0.0032;
  }

  app.stage.render(state, t);
}

// --------------------------------------------------------------------------

function degrade(reason) {
  console.warn('[hb] falling back:', reason);
  root.classList.remove('is-booting');
  root.classList.add('is-fallback');
  boot.classList.add('is-done');
  for (const [, name] of CUES) root.classList.add(`is-${name}`);
  document.querySelector('.stage-wrap').insertAdjacentHTML('afterbegin',
    '<div class="fallback"><p>HEET BAROT</p>'
    + '<small>AI Engineer &amp; Full-Stack Developer — Austin, TX</small></div>');
  bootActs();
}

function renderStill() {
  layout();
  const t = T.settled + 1;
  app.stage.render(sample(t, app.word.letters.length, app.order), t);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}

// --------------------------------------------------------------------------
// Mobile menu

const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
menu?.querySelectorAll('a').forEach((a, i) => a.style.setProperty('--i', i));
function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  root.classList.toggle('is-menu', open);
  if (open) menu.hidden = false;
  else setTimeout(() => {
    if (!root.classList.contains('is-menu')) menu.hidden = true;
  }, 450);
}
burger?.addEventListener('click', () =>
  setMenu(burger.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && root.classList.contains('is-menu')) setMenu(false);
});

// --------------------------------------------------------------------------
// The opening is position:fixed behind the flow, so once act two covers it
// there is nothing to see — stop rendering rather than burning battery on
// frames nobody is looking at.

const heroWrap = document.querySelector('.stage-wrap');
const spacer = document.querySelector('.hero-spacer');
if (heroWrap && spacer && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => {
    app.onScreen = e.isIntersecting;
    heroWrap.style.visibility = e.isIntersecting ? '' : 'hidden';
  }, { threshold: 0 }).observe(spacer);
}

// the scroll cue has done its job the moment the visitor takes the hint
addEventListener('scroll', () => {
  if (scrollY > 40) root.classList.add('is-moved');
}, { passive: true, once: false });

// nav: light the entry for whichever act currently holds the frame
const navLinks = [...document.querySelectorAll('.hdr__nav a[data-nav]')];
const targets = navLinks
  .map((a) => ({ a, el: document.querySelector(a.getAttribute('href')) }))
  .filter((x) => x.el);
if (targets.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const hit = targets.find((x) => x.el === e.target);
      if (!hit) continue;
      navLinks.forEach((a) => a.classList.toggle('is-active', a === hit.a));
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  targets.forEach((x) => io.observe(x.el));
}

document.addEventListener('visibilitychange', () => {
  app.running = document.visibilityState !== 'hidden';
  if (app.running) { last = performance.now(); requestAnimationFrame(frame); }
});

// Review hook. Draws one frame on demand and reads the framebuffer in the SAME
// task, because the context is created without preserveDrawingBuffer.
window.__shot = (at = null) => {
  if (!app.word) return null;
  const t = at !== null ? at : (performance.now() - app.t0) / 1000;
  app.stage.render(sample(t, app.word.letters.length, app.order), t);
  return app.stage.canvas.toDataURL('image/png');
};

main().catch((e) => degrade(e.message));
