/* ============================================================
   HEET BAROT — cinematic scroll engine
   Lenis smooth scroll + GSAP ScrollTrigger + canvas orbit scrub
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 120;
// Optional CDN prefix (set window.ASSET_BASE before this script to serve
// the heavy assets from elsewhere, e.g. a commit-pinned CDN mirror).
const BASE = window.ASSET_BASE || '';
const FRAME_PATH = (i) => `${BASE}assets/frames/orbit_${String(i + 1).padStart(4, '0')}.jpg`;
const POSTER_PATH = `${BASE}assets/img/poster.jpg`;

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Lenis smooth scroll ---------- */
const lenis = new Lenis({
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 1.0,
});
window.__lenis = lenis; // test hook
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- canvas setup ---------- */
const canvas = document.getElementById('orbit');
const ctx = canvas.getContext('2d');
const frames = new Array(FRAME_COUNT).fill(null);
const orbit = { frame: 0 };
window.__orbit = orbit; // test hook: current scrub frame
let posterImg = null;
let loadedCount = 0;

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  render();
}

function currentImage() {
  const want = Math.round(orbit.frame);
  if (frames[want]) return frames[want];
  // nearest loaded frame fallback
  for (let d = 1; d < FRAME_COUNT; d++) {
    if (frames[want - d]) return frames[want - d];
    if (frames[want + d]) return frames[want + d];
  }
  return posterImg;
}

function render() {
  const img = currentImage();
  if (!img) return;
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

/* ---------- loader / frame preload ---------- */
const loaderEl = document.getElementById('loader');
const loaderNum = document.getElementById('loaderNum');
const loaderBar = document.getElementById('loaderBar');

function updateLoader() {
  const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
  loaderNum.textContent = pct;
  loaderBar.style.width = pct + '%';
}

function finishLoading() {
  updateLoader();
  render();
  loaderEl.classList.add('done');
  document.body.classList.add('ready');
  introReveal();
}

function preloadFrames() {
  let settled = 0;
  const onSettle = () => {
    settled++;
    updateLoader();
    if (settled === FRAME_COUNT) finishLoading();
  };
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = () => {
      frames[i] = img;
      loadedCount++;
      if (i === 0) render();
      onSettle();
    };
    img.onerror = onSettle;
    img.src = FRAME_PATH(i);
  }
}

// poster fallback (also shown before frame 0 arrives)
posterImg = new Image();
posterImg.onload = render;
posterImg.src = POSTER_PATH;

sizeCanvas();
window.addEventListener('resize', sizeCanvas);
preloadFrames();

/* ---------- intro reveal (post-loader) ---------- */
function introReveal() {
  const tl = gsap.timeline({ delay: 0.15 });
  tl.to('.hero-name .line:first-child .ltr', {
    y: 0, duration: 1.1, stagger: 0.07, ease: 'power4.out',
  })
    .to('.hero-name .line-outline .ltr', {
      y: 0, duration: 1.1, stagger: 0.06, ease: 'power4.out',
    }, '-=0.85')
    .to('.hero-sub', {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    }, '-=0.55');
}

/* ---------- hero orbit scrub ---------- */
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.4,
  onUpdate(self) {
    orbit.frame = self.progress * (FRAME_COUNT - 1);
    render();

    // type drifts up + fades as the orbit begins
    const p = self.progress;
    const type = document.querySelector('.hero-type');
    const drift = gsap.utils.clamp(0, 1, p / 0.42);
    type.style.opacity = String(1 - drift * 0.92);
    type.style.transform = `translateY(${drift * -9}vh) scale(${1 - drift * 0.06})`;

    const hint = document.getElementById('heroHint');
    hint.style.opacity = String(1 - gsap.utils.clamp(0, 1, p / 0.08));
  },
});

/* ---------- scroll progress bar ---------- */
gsap.to('#progressBar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
});

/* ---------- kinetic marquee (scroll-driven) ---------- */
const marqueeTrack = document.getElementById('marqueeTrack');
let marqueeX = 0;
gsap.ticker.add(() => {
  const v = prefersReduced ? 0 : lenis.velocity || 0;
  marqueeX -= 0.6 + Math.min(Math.abs(v) * 0.06, 4);
  const half = marqueeTrack.scrollWidth / 2;
  if (-marqueeX >= half) marqueeX += half;
  marqueeTrack.style.transform = `translateX(${marqueeX}px)`;
});

/* ---------- stats count-up ---------- */
document.querySelectorAll('.stat-num').forEach((el) => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const state = { v: 0 };
  gsap.to(state, {
    v: target,
    duration: 1.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
    onUpdate() {
      el.textContent = state.v.toFixed(decimals) + suffix;
    },
    onComplete() {
      el.textContent = target.toFixed(decimals) + suffix;
    },
  });
});
gsap.utils.toArray('.stat').forEach((el, i) => {
  gsap.from(el, {
    opacity: 0, y: 40, duration: 0.8, delay: i * 0.06, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 92%' },
  });
});

/* ---------- three pillars scrub ---------- */
const pillars = gsap.utils.toArray('.pillar');
const pillarTL = gsap.timeline({
  scrollTrigger: {
    trigger: '.pillars',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
  },
});
pillars.forEach((pillar, i) => {
  const idx = pillar.querySelector('.pillar-idx');
  const title = pillar.querySelector('.pillar-title');
  const copy = pillar.querySelector('.pillar-copy');
  pillarTL
    .set(pillar, { autoAlpha: 1 }, i * 3)
    .fromTo(idx, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, i * 3)
    .fromTo(title, { opacity: 0, y: 90, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: 1 }, i * 3 + 0.15)
    .fromTo(copy, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7 }, i * 3 + 0.5);
  if (i < pillars.length - 1) {
    pillarTL
      .to(pillar, { opacity: 0, y: -70, duration: 0.8 }, i * 3 + 2.2)
      .set(pillar, { visibility: 'hidden' }, i * 3 + 3);
  }
});

/* ---------- background videos: pick a playable codec, blob-load
   (works on Range-less static servers), play only in view ---------- */
[['#builderVideo', '.pillars'], ['#closerVideo', '.work']].forEach(([vidSel, trigSel]) => {
  const video = document.querySelector(vidSel);
  if (!video) return;
  const canH264 = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
  const srcUrl = BASE + (canH264 ? video.dataset.mp4 : video.dataset.webm);
  const loaded = fetch(srcUrl)
    .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
    .then((blob) => { video.src = URL.createObjectURL(blob); })
    .catch(() => { video.src = srcUrl; });
  ScrollTrigger.create({
    trigger: trigSel,
    start: 'top bottom',
    end: 'bottom top',
    onToggle(self) {
      if (self.isActive) {
        loaded.then(() => video.play().catch(() => {}));
      } else {
        video.pause();
      }
    },
  });
});

/* ---------- work section reveals ---------- */
gsap.from('.work-title', {
  y: 120, opacity: 0, duration: 1, ease: 'power4.out',
  scrollTrigger: { trigger: '.work', start: 'top 70%' },
});
gsap.utils.toArray('.card').forEach((card, i) => {
  gsap.from(card, {
    y: 90, opacity: 0, duration: 0.9, delay: i * 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.cards', start: 'top 85%' },
  });
});

/* ---------- card hover tilt ---------- */
if (!prefersReduced && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const qx = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const qy = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const qz = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      qx(nx * 8);
      qy(ny * -8);
      qz(-6);
    });
    card.addEventListener('mouseleave', () => { qx(0); qy(0); qz(0); });
  });
}

/* ---------- experience rows reveal ---------- */
gsap.utils.toArray('.xp-row').forEach((row, i) => {
  gsap.from(row, {
    opacity: 0, y: 60, duration: 0.85, delay: i * 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: row, start: 'top 90%' },
  });
});

/* ---------- skills chips reveal ---------- */
gsap.utils.toArray('.skill-group').forEach((group) => {
  const chips = group.querySelectorAll('.chip');
  gsap.from(group.querySelector('.skill-label'), {
    opacity: 0, y: 40, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: group, start: 'top 88%' },
  });
  gsap.from(chips, {
    opacity: 0, y: 24, scale: 0.94, duration: 0.5, stagger: 0.035, ease: 'power2.out',
    scrollTrigger: { trigger: group, start: 'top 88%' },
  });
});

/* ---------- contact form → mailto ---------- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  gsap.from(contactForm, {
    opacity: 0, y: 50, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: contactForm, start: 'top 88%' },
  });
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const subject = encodeURIComponent(`Project inquiry — ${name || 'your site'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`);
    window.location.href = `mailto:Heetbarot21@gmail.com?subject=${subject}&body=${body}`;
    const note = document.getElementById('formNote');
    if (note) note.textContent = 'Opening your mail app… if nothing happens, email Heetbarot21@gmail.com directly.';
  });
}

/* ---------- finale kinetic type ---------- */
gsap.utils.toArray('.fin-line i').forEach((line, i) => {
  gsap.to(line, {
    y: 0, duration: 1.1, delay: i * 0.08, ease: 'power4.out',
    scrollTrigger: { trigger: '.finale', start: 'top 62%' },
  });
});

/* ---------- anchor links through Lenis ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  });
});
