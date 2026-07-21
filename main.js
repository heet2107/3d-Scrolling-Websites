/* ============================================================
   RATHANG RAJPAL — cinematic 3D-scroll portfolio
   Lenis smooth scroll + GSAP ScrollTrigger + canvas orbit scrub
   ============================================================ */

(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const FRAME_COUNT = 160;
  const framePath = (i) => `assets/frames/orbit_${String(i + 1).padStart(3, '0')}.jpg`;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------------- Lenis smooth scroll ---------------- */
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // locked until the loader clears

  document.querySelectorAll('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6 });
    });
  });

  /* ---------------- canvas setup ---------------- */
  const canvas = document.getElementById('orbitCanvas');
  const ctx = canvas.getContext('2d');
  const frames = new Array(FRAME_COUNT);
  const orbit = { frame: 0 };
  const hud = document.getElementById('orbitHud');

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    render();
  }

  function render() {
    const img = frames[Math.round(orbit.frame)] || frames.find(Boolean);
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    if (hud) hud.textContent = `Orbit ${String(Math.round(orbit.frame) + 1).padStart(3, '0')} / ${FRAME_COUNT}`;
  }

  window.addEventListener('resize', sizeCanvas);

  /* ---------------- preload ---------------- */
  const loader = document.getElementById('loader');
  const loaderPct = document.getElementById('loaderPct');
  const loaderBar = document.getElementById('loaderBar');
  let loadedCount = 0;

  function preloadFrames() {
    return new Promise((resolve) => {
      let settled = 0;
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          frames[i] = img.naturalWidth ? img : frames[i];
          settled++;
          loadedCount = settled;
          const pct = Math.round((settled / FRAME_COUNT) * 100);
          loaderPct.textContent = pct;
          loaderBar.style.width = pct + '%';
          if (settled === FRAME_COUNT) resolve();
        };
        img.src = framePath(i);
      }
    });
  }

  /* ---------------- text splitting ---------------- */
  document.querySelectorAll('[data-split]').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((chr) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = chr;
      line.appendChild(s);
    });
  });

  const finaleTitle = document.querySelector('[data-split-words]');
  if (finaleTitle) {
    const words = finaleTitle.textContent.trim().split(/\s+/);
    finaleTitle.textContent = '';
    words.forEach((word, i) => {
      const s = document.createElement('span');
      s.className = 'w' + (i === words.length - 1 ? ' w--accent' : '');
      s.textContent = word;
      finaleTitle.appendChild(s);
      if (i < words.length - 1) finaleTitle.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------------- videos: play only in view ---------------- */
  function lazyVideo(video) {
    if (!video) return;
    ScrollTrigger.create({
      trigger: video.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => video.play().catch(() => {}),
      onEnterBack: () => video.play().catch(() => {}),
      onLeave: () => video.pause(),
      onLeaveBack: () => video.pause(),
    });
  }

  /* ---------------- scroll choreography ---------------- */
  function buildScrollScenes() {
    const chars1 = document.querySelectorAll('.hero__line:first-child .ch');
    const chars2 = document.querySelectorAll('.hero__line--accent .ch');

    /* HERO — pin + orbit scrub + kinetic type */
    const heroTl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=350%',
        pin: '#heroStage',
        pinSpacing: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    heroTl.to(orbit, { frame: FRAME_COUNT - 1, duration: 1, onUpdate: render, snap: 'frame' }, 0);

    const spread = (chars, dir) =>
      [...chars].map((_, i) => {
        const mid = (chars.length - 1) / 2;
        return (i - mid) * 14 * dir;
      });

    const off1 = spread(chars1, 1);
    const off2 = spread(chars2, -1);
    heroTl.to(chars1, { x: (i) => off1[i], duration: 1 }, 0);
    heroTl.to(chars2, { x: (i) => off2[i], duration: 1 }, 0);
    heroTl.to('.hero__name', { yPercent: -14, duration: 1 }, 0);
    heroTl.to('#heroSub', { autoAlpha: 0, y: -30, duration: 0.18 }, 0.06);
    heroTl.to('#scrollCue', { autoAlpha: 0, duration: 0.06 }, 0.01);
    heroTl.to('#heroTitle', { autoAlpha: 0, duration: 0.16 }, 0.84);
    heroTl.to('.hero__corners', { autoAlpha: 0, duration: 0.16 }, 0.84);

    /* STATS — count-up */
    document.querySelectorAll('.stat__val').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const compact = el.dataset.compact === '1';
      const state = { v: 0 };
      const fmt = (v) => {
        if (!compact) return Math.round(v).toString();
        if (v >= 1e6) {
          const m = v / 1e6;
          return (m >= 9.95 ? Math.round(m) : parseFloat(m.toFixed(1))) + 'M';
        }
        if (v >= 1e3) return Math.round(v / 1e3) + 'K';
        return Math.round(v).toString();
      };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () =>
          gsap.to(state, {
            v: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => (el.textContent = fmt(state.v)),
          }),
      });
    });

    gsap.from('.stat', {
      y: 50,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.stats__grid', start: 'top 85%', once: true },
    });

    /* PILLARS — pinned sequential reveal */
    const pillars = gsap.utils.toArray('[data-pillar]');
    const ticks = gsap.utils.toArray('[data-tick]');
    const craftTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#craft',
        start: 'top top',
        end: '+=300%',
        pin: '#craftStage',
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          const active = Math.min(2, Math.floor(self.progress * 3));
          ticks.forEach((t, i) => t.classList.toggle('is-active', i === active));
        },
      },
    });

    pillars.forEach((p, i) => {
      craftTl.fromTo(
        p,
        { autoAlpha: 0, y: 90, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: 'power2.out' },
        i + 0.08
      );
      if (i < pillars.length - 1) {
        craftTl.to(p, { autoAlpha: 0, y: -90, duration: 0.26, ease: 'power2.in' }, i + 0.74);
      }
    });
    craftTl.set({}, {}, 3); // normalize duration to 3 units

    gsap.from('.craft__head', {
      autoAlpha: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#craft', start: 'top 60%', once: true },
    });

    /* WORK — reveal + card tilt */
    gsap.from('.work__title', {
      yPercent: 60,
      autoAlpha: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.work__head', start: 'top 80%', once: true },
    });

    gsap.utils.toArray('[data-card]').forEach((card, i) => {
      gsap.from(card, {
        y: 90,
        autoAlpha: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
      });

      if (!isTouch) {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', `${px * 100}%`);
          card.style.setProperty('--my', `${py * 100}%`);
          gsap.to(card, {
            rotateY: (px - 0.5) * 7,
            rotateX: (0.5 - py) * 7,
            y: -8,
            transformPerspective: 900,
            duration: 0.4,
            ease: 'power2.out',
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        });
      }
    });

    /* FINALE — word reveal */
    gsap.from('.finale__title .w', {
      yPercent: 120,
      autoAlpha: 0,
      rotate: 4,
      stagger: 0.09,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.finale__inner', start: 'top 75%', once: true },
    });
    gsap.from('.finale__sub, .finale__actions', {
      y: 40,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 0.9,
      delay: 0.25,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.finale__inner', start: 'top 75%', once: true },
    });

    lazyVideo(document.getElementById('craftVideo'));
    lazyVideo(document.getElementById('workVideo'));
  }

  /* ---------------- intro ---------------- */
  function intro() {
    const tl = gsap.timeline();
    tl.to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' });
    tl.set(loader, { display: 'none' });
    tl.from('.hero__line:first-child .ch', {
      yPercent: 120,
      autoAlpha: 0,
      stagger: 0.045,
      duration: 1.1,
      ease: 'power4.out',
    }, '-=0.45');
    tl.from('.hero__line--accent .ch', {
      yPercent: 120,
      autoAlpha: 0,
      stagger: 0.045,
      duration: 1.1,
      ease: 'power4.out',
    }, '<0.12');
    tl.from('#heroSub', { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6');
    tl.from('.hero__corner, .nav', { autoAlpha: 0, duration: 0.7, stagger: 0.05 }, '-=0.5');
    tl.from('#scrollCue', { autoAlpha: 0, duration: 0.6 }, '-=0.3');
    tl.call(() => {
      lenis.start();
      ScrollTrigger.refresh();
    }, null, '-=0.8');
    return tl;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    sizeCanvas();

    if (reduceMotion) {
      document.body.classList.add('no-motion');
      loader.style.display = 'none';
      orbit.frame = 0;
      preloadFrames().then(render);
      lenis.destroy();
      document.querySelectorAll('video').forEach((v) => v.play().catch(() => {}));
      return;
    }

    Promise.all([preloadFrames(), document.fonts.ready]).then(() => {
      render();
      buildScrollScenes();
      intro();
    });
  }

  window.scrollTo(0, 0);
  boot();
})();
