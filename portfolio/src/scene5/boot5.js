// Act V: typeset, reveal, run.
//
// The other acts are pinned stages where the canvas IS the act. This one is a
// normal-flow document with a canvas fixed behind it, because it is the act
// where somebody actually reads — and reading beats spectacle here. So the
// order below is deliberate: the whole record is written into the page first,
// the reveals are wired second, and only then is WebGL asked for anything. A
// throw past that point costs a decoration, never the content.

import { typeset } from './sheet.js';
import { Plate } from './plate.js';
import { clamp, easeOutExpo } from '../lib/ease.js';

export async function initRecord() {
  const section = document.getElementById('record');
  if (!section) throw new Error('no record section');

  typeset();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  reveal(section, reduced);

  const canvas = document.getElementById('recordStage');
  if (!canvas) throw new Error('no record canvas');

  const plate = new Plate(canvas);
  if (!plate.ok) throw new Error('WebGL unavailable');

  let live = false;
  let t0 = 0;
  let raf = 0;

  /** 0 as the act enters the viewport, 1 as its last line leaves it. */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height + window.innerHeight;
    return travel > 0 ? clamp((window.innerHeight - r.top) / travel) : 0;
  };

  const resize = () => {
    plate.resize(canvas.clientWidth, canvas.clientHeight,
                 Math.min(window.devicePixelRatio || 1, 2));
    // with motion off there is no loop to pick the new size up on the next
    // frame, so the still has to be redrawn here or the plate stays stretched
    if (reduced && live) plate.render(0, progress());
  };
  resize();
  window.addEventListener('resize', debounce(resize, 150));

  const frame = (now) => {
    if (!live) return;
    raf = requestAnimationFrame(frame);
    plate.render((now - t0) / 1000, progress());
  };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (!live) { cancelAnimationFrame(raf); return; }
    // the viewport may well have changed shape while the act was off screen
    resize();
    if (reduced) { plate.render(0, progress()); return; }
    if (!t0) t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }, { rootMargin: '12% 0px' }).observe(section);

  return plate;
}

// --------------------------------------------------------------------------
// Reveals. Each is armed once and then forgotten: a row that has resolved
// stays resolved, and the counters run exactly one time.

function reveal(section, reduced) {
  const stats = document.getElementById('recordStats');
  const rows = [...section.querySelectorAll('.xp')];
  const deck = document.getElementById('credDeck');

  // Reduced motion, or a browser with no IntersectionObserver: land on the
  // finished page. A résumé that only appears if you happen to scroll it into
  // view at the right speed is worse than one that never animates at all.
  if (reduced || !('IntersectionObserver' in window)) {
    stats?.classList.add('is-lit');
    rows.forEach((row) => row.classList.add('is-lit'));
    deck?.classList.add('is-lit');
    return;
  }

  const once = (el, bottom, then) => {
    const io = new IntersectionObserver(([e]) => {
      // Anything already ABOVE the viewport is lit without ceremony. A visitor
      // who followed #record, or came back to a restored scroll position, is
      // standing in the middle of the act — and a row that only ever resolves
      // on the way down would simply never appear for them.
      const passed = e.boundingClientRect.bottom <= 0;
      if (!e.isIntersecting && !passed) return;
      io.disconnect();
      el.classList.add('is-lit');
      if (!passed) then?.();
    }, { rootMargin: `0px 0px -${bottom}% 0px` });
    io.observe(el);
  };

  // rows resolve one at a time as they arrive, because the rail is read one
  // job at a time
  rows.forEach((row) => once(row, 12));
  // the deck is watched as ONE element so the five cards arrive as a single
  // event with a stagger, rather than as five unrelated fades
  if (deck) once(deck, 10);
  if (stats) once(stats, 6, () => count(stats));
}

/**
 * Counts each stat up from zero, once. The suffix is carried through
 * untouched: the copy says "5+" and "10+", and a counter that lands on a bare
 * "5" has quietly changed what the page claims.
 */
function count(list) {
  for (const el of list.querySelectorAll('.stat__n')) {
    const raw = el.dataset.n || el.textContent;
    const target = parseFloat(raw);
    if (!Number.isFinite(target)) continue;
    const suffix = raw.replace(/[\d.,\s]/g, '');
    const dur = 820 + target * 26;
    const t0 = performance.now();

    const step = (now) => {
      const p = clamp((now - t0) / dur);
      el.textContent = `${Math.round(target * easeOutExpo(p))}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = raw;    // land on the source string, not on maths
    };
    el.textContent = `0${suffix}`;
    requestAnimationFrame(step);
  }
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
