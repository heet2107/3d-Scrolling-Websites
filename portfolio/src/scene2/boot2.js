// Act II: mount, gate, run.
//
// The scene renders only while its section is on screen. Everything else — the
// marquee, the bio, the screen-reader list — is DOM, built from the same data
// the cards are drawn from so the two can never disagree.

import { Universe } from './universe.js';
import { sample2 } from './timeline2.js';
import { ME, STACK, TOOLS } from '../data/content.js';
import { clamp } from '../lib/ease.js';

export async function initStack() {
  const section = document.getElementById('stack');
  const canvas = document.getElementById('stackStage');
  if (!section || !canvas) throw new Error('no stack section');

  buildDOM();

  const scene = new Universe(canvas);
  if (!scene.ok) throw new Error('WebGL unavailable');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const resize = () => scene.resize(
    canvas.clientWidth, canvas.clientHeight,
    Math.min(window.devicePixelRatio || 1, 2));
  resize();
  window.addEventListener('resize', debounce(resize, 150));

  if (!coarse && !reduced) {
    section.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      scene.pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      scene.pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
    section.addEventListener('pointerleave', () => {
      scene.pointer.tx = 0;
      scene.pointer.ty = 0;
    });
  }

  let live = false;
  let t0 = 0;
  let last = 0;
  let raf = 0;

  /** 0 at the moment the pin engages, 1 as it releases. */
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
    const state = sample2((now - t0) / 1000, progress());
    scene.update(dt, state);
    scene.render();
  };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (live) {
      // the arrival plays once, the first time the act takes the frame
      if (!t0) t0 = performance.now();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }, { rootMargin: '10% 0px' }).observe(section);

  if (reduced) {
    // land on the settled composition and hold it still
    t0 = performance.now() - 4000;
    scene.update(0.016, sample2(4, 0.5));
    scene.render();
  }

  return scene;
}

function buildDOM() {
  const bio = document.getElementById('stackBio');
  if (bio) bio.textContent = ME.bio;

  // the marquee is doubled so the loop has no seam to see
  const marquee = document.getElementById('stackMarquee');
  if (marquee) {
    const run = STACK.map((s) => `<span>${s}</span>`).join('<i>·</i>');
    marquee.innerHTML = `${run}<i>·</i>${run}<i>·</i>`;
  }

  // the cards are canvas, so the list of what they say lives here for anyone
  // reading with a screen reader or a search engine
  const list = document.getElementById('stackList');
  if (list) {
    list.innerHTML = TOOLS.map((t) => `<li>${t.label}</li>`).join('');
  }
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
