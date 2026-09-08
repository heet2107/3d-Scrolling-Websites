// Act II: the film, under the visitor's hand.
//
// The section IS the supplied reference film. It is not re-created here and it
// is not played: it is taken apart into stills and handed to the scroll, so the
// push through the room, the neon stroke drawing itself and the embers rising
// all happen at exactly the rate the visitor scrolls them, forwards or back.
//
// The section is 320svh of scroll wrapped around a sticky 100svh pin, and the
// pin's travel maps linearly onto the strip: at the top of the travel the first
// frame, at the bottom the last. Everything else — the act title, the stack
// list, the marquee — is DOM layered over the canvas, built from the same data
// the rest of the site reads.

import { Film, loadManifest } from './film.js';
import { ME, STACK, TOOLS } from '../data/content.js';
import { clamp } from '../lib/ease.js';

const MANIFEST = 'public/stack/frames.json';

export async function initStack() {
  const section = document.getElementById('stack');
  const canvas = document.getElementById('stackStage');
  if (!section || !canvas) throw new Error('no stack section');

  buildDOM();

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('no 2d context');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Half the strip on a phone: half the bytes over the network and half the
  // decoded pixels held live. Scrubbed, six frames a second still reads as
  // continuous, because the visitor is setting the rate rather than watching.
  const stride = window.innerWidth < 760 ? 2 : 1;

  const man = await loadManifest(MANIFEST);
  const film = new Film(man, { stride });

  const view = { w: 0, h: 0, dpr: 1 };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    return true;
  };
  resize();

  /** 0 as the pin engages, 1 as it releases. */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    if (travel <= 0) return 0;
    return clamp(-r.top / travel);
  };

  let shown = -1;
  const paint = (force = false) => {
    const p = reduced ? 0.5 : progress();
    const i = Math.round(p * (film.length - 1));
    if (i === shown && !force) return;
    const img = film.nearest(i);
    if (!img) return;
    shown = i;
    cover(ctx, img, view.w, view.h);
    section.style.setProperty('--p', p.toFixed(4));
  };

  // Frames arrive over several seconds; each one that lands may be a better
  // match for where the visitor already is, so repaint on arrival rather than
  // waiting for the next scroll.
  film.load({
    onFirst: () => { section.classList.add('is-live'); paint(true); },
    onFrame: (i) => { if (Math.abs(i - shown) <= 1) paint(true); },
  });

  let live = false;
  let raf = 0;
  const frame = () => {
    if (!live) return;
    raf = requestAnimationFrame(frame);
    if (resize()) paint(true);
    else paint();
  };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (live) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  }, { rootMargin: '25% 0px' }).observe(section);

  window.addEventListener('resize', debounce(() => {
    if (resize()) paint(true);
  }, 150));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && live) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  });

  return { film, section, paint, progress };
}

/**
 * Draw the frame as `object-fit: cover` would.
 *
 * The film is 16:9 and the pin is whatever shape the visitor's window is, so
 * one axis always overflows. Cropping rather than letterboxing keeps the room
 * filling the frame, which is the whole point of a pinned act; centring the
 * crop keeps the figure — who stands dead centre — on screen at every aspect.
 */
function cover(ctx, img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) * 0.5, (h - dh) * 0.5, dw, dh);
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

  // the act is a canvas, so what it is about lives here for anyone reading
  // with a screen reader or a search engine
  const list = document.getElementById('stackList');
  if (list) {
    list.innerHTML = TOOLS.map((t) => `<li>${t.label}</li>`).join('');
  }
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
