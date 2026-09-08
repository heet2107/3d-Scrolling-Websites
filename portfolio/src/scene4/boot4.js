// Act IV: mount, gate, run.
//
// The plates are canvas, so the words are not. The active project's copy is
// real DOM — selectable, findable with ctrl-F, crisp at any zoom — and the
// pips are real buttons, so the deck can be driven from the keyboard by anyone
// who cannot or will not drag a scrollbar through five viewport heights. The
// scroll position stays the single source of truth: a pip does not move the
// deck, it moves the PAGE, and the deck follows the way it always does.

import { Gallery } from './gallery.js';
import { sample4, scrollFor } from './timeline4.js';
import { PROJECTS } from '../data/content.js';
import { clamp } from '../lib/ease.js';

export async function initWork() {
  const section = document.getElementById('work');
  const canvas = document.getElementById('workStage');
  if (!section || !canvas) throw new Error('no work section');

  // The plates are TYPE, drawn into a canvas: building the atlas before Anton
  // and Oswald are usable bakes the fallback face into the texture for good,
  // and nothing later can repaint it. Waiting on `fonts.ready` alone is not
  // enough — it resolves immediately for a face nothing has asked for yet —
  // so the faces the atlas needs are requested here by name.
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('400 60px Anton'),
      document.fonts.load('600 15px Oswald'),
      document.fonts.load('500 15px Oswald'),
      document.fonts.load('400 15px Oswald'),
      document.fonts.load('300 15px Oswald'),
    ]).catch(() => { /* fall back to the stack in each font shorthand */ });
  }

  const scene = new Gallery(canvas);
  if (!scene.ok) throw new Error('WebGL unavailable');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const dom = buildDOM(section);

  const resize = () => scene.resize(
    canvas.clientWidth, canvas.clientHeight,
    Math.min(window.devicePixelRatio || 1, 2));
  resize();
  window.addEventListener('resize', debounce(resize, 150));

  /** 0 as the pin engages, 1 as it releases. */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    if (travel <= 0) return 0;
    return clamp(-r.top / travel);
  };

  /** The document offset at which the deck lands on project `i`. */
  const offsetFor = (i) => {
    const travel = section.offsetHeight - window.innerHeight;
    return section.getBoundingClientRect().top + window.scrollY
         + travel * scrollFor(i, PROJECTS.length);
  };

  let shown = -1;
  const syncDOM = () => {
    if (scene.active === shown) return;
    shown = scene.active;
    dom.show(shown);
  };

  let live = false;
  let t0 = 0;
  let last = 0;
  let raf = 0;

  const frame = (now) => {
    if (!live) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    scene.update(dt, sample4((now - t0) / 1000, progress(), PROJECTS.length));
    scene.render();
    syncDOM();
  };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (!live) { cancelAnimationFrame(raf); return; }
    if (reduced) return;
    if (!t0) t0 = performance.now();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }, { rootMargin: '10% 0px' }).observe(section);

  if (reduced) {
    // no loop at all. The act still has to TRACK, though — a deck frozen on
    // project one while the visitor scrolls past all seven is not a reduced
    // animation, it is a broken one — so a settled frame is drawn on demand
    // and coalesced to at most one per animation frame.
    let queued = false;
    const still = () => {
      queued = false;
      scene.update(0.016, sample4(9, progress(), PROJECTS.length), true);
      scene.render();
      syncDOM();
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(still); } };
    still();
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', debounce(ask, 160));
    scene.redraw = ask;
  }

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

  dom.onJump((i) => {
    window.scrollTo({ top: Math.round(offsetFor(i)),
                      behavior: reduced ? 'auto' : 'smooth' });
    if (reduced) scene.redraw?.();
  });

  dom.show(0);
  return scene;
}

// --------------------------------------------------------------------------

function buildDOM(section) {
  const card = document.getElementById('workCard');
  const pips = document.getElementById('workPips');
  const list = document.getElementById('workList');
  const num = document.getElementById('workNum');

  // the deck is canvas, so the full run of projects lives here for anyone
  // reading with a screen reader or a search engine
  if (list) {
    list.innerHTML = PROJECTS.map(() => '<li></li>').join('');
    [...list.children].forEach((li, i) => {
      const p = PROJECTS[i];
      // A name, not a heading. The visible card already publishes the active
      // project as an h3, so emitting one per project here put eight h3s under
      // "Projects" and listed the active one twice — a screen reader user
      // would walk seven headings that are really just list items, and hear
      // whichever project is on stage announced two ways.
      const h = document.createElement('strong');
      h.textContent = `${p.name} — ${p.kind}`;
      const b = document.createElement('p');
      b.textContent = p.body;
      const t = document.createElement('p');
      t.textContent = p.tags.join(', ');
      li.append(h, b, t);
    });
  }

  const parts = {};
  if (card) {
    card.innerHTML = '';
    const article = el('article', 'work__cardIn');
    parts.kind = el('p', 'work__kind');
    parts.name = el('h3', 'work__name');
    parts.sub = el('p', 'work__sub');
    parts.body = el('p', 'work__body');
    parts.tags = el('ul', 'work__tags');
    article.append(parts.kind, parts.name, parts.sub, parts.body, parts.tags);
    card.append(article);
    parts.article = article;
  }

  const buttons = [];
  if (pips) {
    pips.innerHTML = '';
    PROJECTS.forEach((p, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'work__pip';
      b.dataset.i = String(i);
      const label = document.createElement('span');
      label.className = 'sr-only';
      label.textContent = `${i + 1}. ${p.name}`;
      const bar = document.createElement('i');
      bar.setAttribute('aria-hidden', 'true');
      b.append(label, bar);
      li.append(b);
      pips.append(li);
      buttons.push(b);
    });
  }

  let jump = () => {};

  pips?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) jump(+b.dataset.i);
  });
  // a row of buttons is a single widget: arrows walk it, home and end bracket
  // it, and only the current one is in the tab order
  pips?.addEventListener('keydown', (e) => {
    const at = buttons.indexOf(document.activeElement);
    if (at < 0) return;
    const to = { ArrowLeft: at - 1, ArrowRight: at + 1, ArrowUp: at - 1,
                 ArrowDown: at + 1, Home: 0, End: buttons.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(buttons.length - 1, to));
    buttons[i].focus();
    jump(i);
  });

  return {
    onJump(fn) { jump = fn; },
    show(i) {
      const p = PROJECTS[i];
      if (!p) return;
      if (num) num.textContent = String(i + 1).padStart(2, '0');
      buttons.forEach((b, k) => {
        b.classList.toggle('is-on', k === i);
        b.tabIndex = k === i ? 0 : -1;
        if (k === i) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      if (!parts.article) return;
      parts.kind.textContent = p.kind;
      parts.name.textContent = p.name;
      parts.sub.textContent = p.sub;
      parts.body.textContent = p.body;
      parts.tags.innerHTML = '';
      for (const tag of p.tags) {
        const li = document.createElement('li');
        li.textContent = tag;
        parts.tags.append(li);
      }
      section.style.setProperty('--tint', tintCss(p.tint));
      // restart the entrance: without the reflow the class is added and
      // removed inside one frame and the animation never runs again
      parts.article.classList.remove('is-in');
      void parts.article.offsetWidth;
      parts.article.classList.add('is-in');
    },
  };
}

const el = (tag, cls) => {
  const n = document.createElement(tag);
  n.className = cls;
  return n;
};

const tintCss = (t) =>
  `rgb(${Math.round(t[0] * 255)} ${Math.round(t[1] * 255)} ${Math.round(t[2] * 255)})`;

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
