/* Inner pages — GSAP-driven cinematics:
   SplitText hero headlines, hero parallax, scroll reveals, drawing gold rules,
   chip pops, stat count-ups, 3D card tilt. Lenis smooth scroll + ambient
   ping-pong canvas hero reusing the site's frame sequences. */
(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  document.documentElement.classList.add('gsap-pages'); // disables the CSS-transition fallback

  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__VL = { lenis, ambient: { frame: -1 }, ready: false };

  /* ---------- ambient canvas hero (every 3rd frame, ping-pong) ---------- */
  const COUNTS = { hero: 220, macro: 200, assembly: 200, atmosphere: 200, workshop: 200 };
  const canvas = document.querySelector('canvas[data-seq]');
  if (canvas) {
    const seq = canvas.dataset.seq;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; };
    fit();
    window.addEventListener('resize', fit);
    const idxs = [];
    for (let i = 0; i < (COUNTS[seq] || 200); i += 3) idxs.push(i);
    const imgs = idxs.map(i => {
      const im = new Image();
      im.src = `frames/${seq}/${seq}_${String(i + 1).padStart(4, '0')}.jpg`;
      return im;
    });
    const draw = im => {
      if (!im.complete || !im.naturalWidth) return;
      const s = Math.max(canvas.width / im.naturalWidth, canvas.height / im.naturalHeight);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    imgs[0].onload = () => { draw(imgs[0]); window.__VL.ready = true; };
    let t0 = null;
    const tick = ts => {
      if (t0 === null) t0 = ts;
      const p = 1 - Math.abs(1 - (((ts - t0) / 8000) % 2));
      const k = Math.round(p * (imgs.length - 1));
      if (k !== window.__VL.ambient.frame) { window.__VL.ambient.frame = k; draw(imgs[k]); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // parallax: the footage drifts as the hero leaves the viewport
    gsap.to(canvas, {
      yPercent: 16, ease: 'none',
      scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  } else {
    window.__VL.ready = true;
  }

  /* ---------- hero headline: SplitText entrance ---------- */
  const h1 = document.querySelector('.ph-copy h1');
  if (h1) {
    gsap.set('.ph-copy [data-reveal]', { opacity: 1, y: 0 });
    document.fonts.ready.then(() => {
      const split = new SplitText(h1, { type: 'words,chars' });
      gsap.from(split.chars, {
        opacity: 0, y: 46, rotationX: -55, transformOrigin: '50% 100% -20',
        stagger: 0.035, duration: 0.9, ease: 'power3.out', delay: 0.1,
      });
    });
    gsap.from('.ph-copy .eyebrow', { opacity: 0, letterSpacing: '.9em', duration: 1.2, ease: 'power2.out' });
  }

  /* ---------- scroll reveals (GSAP-owned) ---------- */
  document.querySelectorAll('main [data-reveal]').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 42 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });
  document.querySelectorAll('.gold-rule').forEach(el => {
    gsap.fromTo(el, { scaleX: 0, transformOrigin: '0 50%' }, {
      scaleX: 1, duration: 1.2, ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
  document.querySelectorAll('.finish-row, .pf-chips').forEach(row => {
    gsap.from(row.children, {
      opacity: 0, y: 16, scale: 0.9, stagger: 0.05, duration: 0.55, ease: 'back.out(1.8)',
      scrollTrigger: { trigger: row, start: 'top 90%' },
    });
  });

  /* ---------- stat count-ups ---------- */
  document.querySelectorAll('.stat-band strong').forEach(el => {
    const m = el.textContent.match(/^([\d,.]+)/);
    if (!m) return;
    const target = parseFloat(m[1].replace(/,/g, ''));
    const suffix = el.textContent.slice(m[1].length);
    const o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => {
        el.textContent = (target >= 100 ? Math.round(o.v).toLocaleString('en-IN') : o.v.toFixed(1)) + suffix;
      },
    });
  });

  /* ---------- 3D tilt on cards (hover devices only) ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.svc-card, .pf-card').forEach(card => {
      gsap.set(card, { transformPerspective: 700 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ry(gsap.utils.mapRange(0, r.width, -7, 7, e.clientX - r.left));
        rx(gsap.utils.mapRange(0, r.height, 5, -5, e.clientY - r.top));
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }
})();
