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
  const deck = document.getElementById('credDeck');
  // [element, how far into the frame it has to come (% of viewport), what to
  //  run the first time it resolves]
  const beats = [];
  // rows resolve one at a time, because the rail is read one job at a time
  for (const row of section.querySelectorAll('.xp')) beats.push([row, 12, null]);
  // the deck is watched as ONE element, so its five cards arrive as a single
  // event with a stagger rather than as five unrelated fades
  if (deck) beats.push([deck, 10, null]);
  if (stats) beats.push([stats, 6, () => count(stats)]);

  // Reduced motion, or a browser with no IntersectionObserver: land on the
  // finished page. A résumé that only appears if you happen to scroll it into
  // view at the right speed is worse than one that never animates at all.
  if (reduced || !('IntersectionObserver' in window)) {
    for (const [el] of beats) el.classList.add('is-lit');
    return;
  }

  const pending = new Map(beats.map(([el, , then]) => [el, then]));

  /** @param {boolean} arriving false when the element was already scrolled
   *  past, in which case it appears finished rather than replaying. */
  const light = (el, arriving) => {
    if (!pending.has(el)) return;
    const then = pending.get(el);
    pending.delete(el);
    el.classList.add('is-lit');
    if (arriving) then?.();
    if (!pending.size) removeEventListener('scroll', sweep);
  };

  for (const [el, bottom] of beats) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      light(el, true);
    }, { rootMargin: `0px 0px -${bottom}% 0px` });
    io.observe(el);
  }

  // An IntersectionObserver only reports a threshold being CROSSED. Something
  // that goes from below the viewport to above it inside one frame — a hard
  // flick, a scripted jump, or simply this act finishing its lazy import while
  // the visitor is already halfway down it — crosses nothing, is never
  // reported, and would sit at opacity 0 for good. This is the backstop: it
  // lights whatever is already behind the reader, and unhooks itself the
  // moment there is nothing left to light.
  let queued = false;
  const sweep = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const el of [...pending.keys()]) {
        if (el.getBoundingClientRect().bottom <= 0) light(el, false);
      }
    });
  };
  addEventListener('scroll', sweep, { passive: true });
  sweep();
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
