// Act VI: mount, gate, run.
//
// The copy goes into the DOM FIRST, before anything that can throw. This act
// is the only place on the page where a visitor can actually reach him, so if
// WebGL is missing, the atlas fails to build or the driver dies, main.js logs
// it and what is left is still a complete, readable contact card — not a black
// footer with an empty blockquote in it.

import { Finale } from './finale.js';
import { sample6 } from './timeline6.js';
import { fontsReady } from '../scene1/type.js';
import { ME } from '../data/content.js';
import { clamp } from '../lib/ease.js';

export async function initFinale() {
  const section = document.getElementById('fin');
  const canvas = document.getElementById('finStage');
  if (!section || !canvas) throw new Error('no finale section');

  buildDOM(section);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the mark is an atlas of real Anton letterforms; building it before the
  // face has loaded silently rasterises the fallback grotesque instead
  await fontsReady();

  const scene = new Finale(canvas);
  if (!scene.ok) throw new Error('WebGL unavailable');

  /** The settled frame, drawn once — what reduced motion is held on. */
  const still = () => scene.render({ t: 2.4, gather: 1, lit: 1, grain: 0.030 });

  const fit = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // a zero-sized canvas would build a zero-pixel atlas and poison the cache
    // key, so the whole act would stay blank until the next real resize
    if (w > 0 && h > 0) {
      scene.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
    }
  };
  fit();

  /** 0 as the pin engages, 1 as the page runs out. */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    // a viewport tall enough to swallow the whole section has no travel to
    // read; this is the finale, so the settled frame is the right answer
    if (travel <= 0) return 1;
    return clamp(-r.top / travel);
  };

  let shown = -1;
  const draw = (t) => {
    const state = sample6(t, progress());
    // the card and the quote respond to the same scalar the field does, but
    // only when it has actually moved — writing a custom property every frame
    // asks for a style recalculation sixty times a second for nothing
    if (Math.abs(state.gather - shown) > 0.004) {
      shown = state.gather;
      section.style.setProperty('--g', state.gather.toFixed(3));
    }
    section.classList.toggle('is-home', state.home);
    scene.render(state);
  };

  let live = false;
  let t0 = 0;
  let raf = 0;
  const frame = (now) => {
    if (!live) return;
    raf = requestAnimationFrame(frame);
    draw((now - t0) / 1000);
  };

  // a running act redraws itself on the next frame, but a still one has no
  // loop to notice that resizing the canvas just threw its backing store away
  window.addEventListener('resize', debounce(() => {
    fit();
    if (reduced) still();
  }, 150));

  // the copy is lit the moment the act takes the frame, and stays lit. Only
  // the plate behind it is tied to scroll — a visitor who stops half way
  // through the section still gets a contact card they can read and use.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) section.classList.add('is-lit');
    if (reduced || e.isIntersecting === live) return;
    live = e.isIntersecting;
    if (live) {
      if (!t0) t0 = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }, { rootMargin: '12% 0px' }).observe(section);

  if (reduced) {
    // honour the preference fully: land on the settled composition and hold it
    // — no gather, no drifting grain, no loop at all
    section.classList.add('is-lit', 'is-home');
    section.style.setProperty('--g', '1');
    still();
  }

  return scene;
}

// --------------------------------------------------------------------------

/**
 * Every string on this frame comes from content.js, including the ones the
 * markup already carries, so the résumé can never end up disagreeing with the
 * footer of its own site. Scoped to the footer rather than the document: no
 * act should be able to rewrite another act's copy by sharing a class name.
 */
function buildDOM(root) {
  const quote = root.querySelector('#finQuote');
  if (quote) {
    // four words, four lines: stacking them is the point, and a single text
    // node would let the browser reflow them into three lines on a phone
    quote.replaceChildren(...ME.quote.map((word, i) => {
      const line = document.createElement('span');
      line.textContent = word;
      line.style.setProperty('--i', i);
      return line;
    }));
  }

  const lede = root.querySelector('#finLede');
  if (lede) lede.textContent = ME.statement;

  const mail = root.querySelector('#finMail');
  if (mail) {
    mail.href = `mailto:${ME.email}`;
    const span = mail.querySelector('span') || mail;
    span.textContent = ME.email;
  }

  const status = root.querySelector('.fin__status');
  if (status) {
    const dot = status.querySelector('i');
    status.textContent = '';
    if (dot) status.append(dot);
    status.append(`${ME.availability} — ${ME.location}`);
  }

  const mark = root.querySelector('.fin__mark');
  if (mark) mark.textContent = ME.name;

  const copy = root.querySelector('.fin__c');
  if (copy) copy.textContent = `© ${ME.year} ${ME.name} — All rights reserved`;

  // matched on what each link already points AT rather than on its position,
  // so reordering the social bar in the markup cannot silently swap two hrefs
  for (const a of root.querySelectorAll('.fin__soc a')) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('mailto:')) a.href = `mailto:${ME.email}`;
    else if (href.includes('github')) a.href = ME.github;
    else if (href.includes('linkedin')) a.href = ME.linkedin;
  }
}

function debounce(fn, ms) {
  let id;
  return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}
