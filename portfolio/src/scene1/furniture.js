// Everything layered OVER the opening's canvas: the lede, the two chips, the
// tick marks and the corner dot grid.
//
// These are DOM rather than canvas because they carry real text that has to
// stay crisp, selectable and reachable by a screen reader. JS positions them
// from the same layout the canvas draws with, so the two layers cannot drift.

export class Furniture {
  constructor(doc) {
    this.lede = doc.getElementById('lede');
    this.role = doc.getElementById('chipRole');
    this.place = doc.getElementById('chipPlace');
    this.marksL = doc.getElementById('marksL');
    this.marksR = doc.getElementById('marksR');
    this.dots = doc.getElementById('dotsBR');
    this.built = false;
  }

  build(L) {
    if (this.built) return;
    this.built = true;

    const tick = (i, n) => {
      const el = document.createElement('i');
      el.style.setProperty('--i', i);
      // the middle mark is the long one, so the pair reads as a scale
      el.style.setProperty('--len', String(i === (n - 1) / 2 ? 1 : 0.55));
      return el;
    };
    for (let i = 0; i < L.marks.count; i++) {
      this.marksL?.appendChild(tick(i, L.marks.count));
      this.marksR?.appendChild(tick(i, L.marks.count));
    }
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('i');
      d.style.setProperty('--i', i);
      this.dots?.appendChild(d);
    }
  }

  apply(L) {
    this.build(L);
    const px = (n) => `${Math.round(n)}px`;

    if (this.lede) {
      this.lede.style.top = px(L.lede.y);
    }

    for (const [el, cfg] of [[this.role, L.role], [this.place, L.place]]) {
      if (!el) continue;
      el.style.top = px(cfg.y);
      if (cfg.centre) {
        el.style.left = '50%';
        el.style.right = 'auto';
        el.style.transform = 'translateX(-50%)';
        el.dataset.centred = 'true';
      } else {
        delete el.dataset.centred;
        el.style.transform = '';
        if (cfg.x > L.w * 0.5) {
          el.style.left = 'auto';
          el.style.right = px(L.w - cfg.x);
        } else {
          el.style.right = 'auto';
          el.style.left = px(cfg.x);
        }
      }
    }

    const top = px(L.h * L.marks.top);
    const height = px(L.h * (L.marks.bottom - L.marks.top));
    for (const [el, xFrac] of [[this.marksL, L.marks.left],
                               [this.marksR, L.marks.right]]) {
      if (!el) continue;
      el.style.top = top;
      el.style.height = height;
      el.style.left = px(L.w * xFrac);
    }

    if (this.dots) {
      this.dots.style.left = px(L.w * L.dots.x);
      this.dots.style.top = px(L.h * L.dots.y);
    }
  }
}

/**
 * The header's hairline. It is an SVG polyline rather than a border so it can
 * step around the wordmark and the nav instead of running behind them, and so
 * it can be drawn on with a dash offset.
 */
export function headerRule(svg, path) {
  if (!svg || !path) return;
  const draw = () => {
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const w = r.width;
    const y = r.height - 1;
    const notchL = Math.min(w * 0.30, 320);
    const notchR = Math.max(w * 0.62, w - 480);
    path.setAttribute('points',
      `0,${y} ${notchL},${y} ${notchL + 12},${y - 9} `
      + `${notchR - 12},${y - 9} ${notchR},${y} ${w},${y}`);
    const len = path.getTotalLength?.() || w;
    path.style.setProperty('--len', String(Math.ceil(len)));
  };
  draw();
  return draw;
}
