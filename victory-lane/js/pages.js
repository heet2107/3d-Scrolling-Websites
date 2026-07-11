/* Shared engine for inner pages: Lenis smooth scroll, reveal-on-scroll,
   and an ambient ping-pong canvas hero reusing the site's frame sequences. */
(() => {
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.__VL = { lenis, ambient: { frame: -1 }, ready: false };

  // reveal-on-scroll — the huge top rootMargin also catches elements the user
  // scrolled past quickly (End key / scrollbar drag), so nothing stays hidden
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '10000px 0px -8% 0px', threshold: 0.05 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // ambient canvas hero (every 3rd frame, ping-pong)
  const COUNTS = { hero: 220, macro: 200, assembly: 200, atmosphere: 200, workshop: 200 };
  const canvas = document.querySelector('canvas[data-seq]');
  if (!canvas) { window.__VL.ready = true; return; }
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
    const cycle = ((ts - t0) / 8000) % 2;
    const p = 1 - Math.abs(1 - cycle);
    const k = Math.round(p * (imgs.length - 1));
    if (k !== window.__VL.ambient.frame) { window.__VL.ambient.frame = k; draw(imgs[k]); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
