/* Victory Lane — cinematic scroll engine
   Lenis smooth scroll + GSAP ScrollTrigger + canvas frame-sequence scrubbing. */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- frame-sequence scrubber ---------- */
  class Scrubber {
    constructor(canvasId, seqName) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.seq = seqName;
      this.images = [];
      this.loaded = new Set();
      this.count = 0;
      this.frame = -1;
      this.progress = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
      window.addEventListener('resize', () => { this.resize(); this.draw(true); });
    }
    resize() {
      const { clientWidth: w, clientHeight: h } = this.canvas;
      this.canvas.width = w * this.dpr;
      this.canvas.height = h * this.dpr;
    }
    src(i) {
      return `frames/${this.seq}/${this.seq}_${String(i + 1).padStart(4, '0')}.jpg`;
    }
    async load() {
      try {
        const res = await fetch(`frames/${this.seq}/manifest.json`);
        this.count = (await res.json()).count;
      } catch {
        // fetch() is blocked on file:// — fall back to the shipped frame counts
        // so the site also works when index.html is opened directly from disk
        this.count = { hero: 220, macro: 200, assembly: 200, atmosphere: 200, workshop: 200 }[this.seq] || 200;
      }
      this.images = new Array(this.count);
      const loadOne = i => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { this.loaded.add(i); resolve(); };
        img.onerror = resolve;
        img.src = this.src(i);
        this.images[i] = img;
      });
      // coarse pass first so scrubbing works immediately, then fill in
      const coarse = [], fine = [];
      for (let i = 0; i < this.count; i++) (i % 8 === 0 ? coarse : fine).push(i);
      await Promise.all(coarse.map(loadOne));
      this.draw(true);
      const queue = [...fine];
      const workers = Array.from({ length: 6 }, async () => {
        while (queue.length) await loadOne(queue.shift());
      });
      Promise.all(workers).then(() => this.draw(true));
      return this;
    }
    nearest(i) {
      if (this.loaded.has(i)) return i;
      for (let d = 1; d < this.count; d++) {
        if (this.loaded.has(i - d)) return i - d;
        if (this.loaded.has(i + d)) return i + d;
      }
      return -1;
    }
    setProgress(p) {
      this.progress = Math.min(Math.max(p, 0), 1);
      const idx = Math.round(this.progress * (this.count - 1));
      if (idx !== this.frame) { this.frame = idx; this.draw(); }
    }
    draw(force) {
      const i = this.nearest(this.frame < 0 ? 0 : this.frame);
      if (i < 0) return;
      if (force) this.resize();
      const img = this.images[i];
      const cw = this.canvas.width, ch = this.canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      this.drawn = i;
    }
  }

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ duration: 1.25, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelector('.nav-cta').addEventListener('click', e => {
    e.preventDefault();
    lenis.scrollTo('#reserve', { duration: 2 });
  });

  /* ---------- hero title split ---------- */
  const title = document.getElementById('hero-title');
  title.innerHTML = title.textContent.split('').map(c =>
    c === ' ' ? '<span class="sp"></span>' : `<span class="ch">${c}</span>`).join('');

  /* ---------- boot ---------- */
  const scrubbers = {};
  const S = window.__VL = { scrubbers, lenis, ready: false };

  async function boot() {
    const [hero, macro, assembly, atmosphere, workshop] = await Promise.all([
      new Scrubber('canvas-hero', 'hero').load(),
      new Scrubber('canvas-macro', 'macro').load(),
      new Scrubber('canvas-assembly', 'assembly').load(),
      new Scrubber('canvas-atmosphere', 'atmosphere').load(),
      new Scrubber('canvas-workshop', 'workshop').load(),
    ]);
    Object.assign(scrubbers, { hero, macro, assembly, atmosphere, workshop });

    /* HERO — pinned 400vh: title tracks in, orbit scrubs a full 360° */
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero', start: 'top top', end: '+=400%',
        pin: true, scrub: 0.4, anticipatePin: 1,
        onUpdate: self => hero.setProgress(self.progress),
      },
      defaults: { ease: 'none' },
    })
      .from('#hero-title .ch', { opacity: 0, y: 60, letterSpacing: '0.6em', stagger: 0.22, duration: 2.6 }, 0)
      .from('#hero-eyebrow', { opacity: 0, duration: 1.2 }, 0.4)
      .from('#hero-tag', { opacity: 0, y: 24, duration: 1.4 }, 2.2)
      .to('#scroll-cue', { opacity: 0, duration: 0.5 }, 0.2)
      .to('.hero-copy', { opacity: 0, y: -80, duration: 2 }, 7.5)
      .to({}, { duration: 0.5 }); // hold the bare orbit at the end

    /* STORY — pinned, three lines hand over while the workshop dolly scrubs behind */
    const lines = gsap.utils.toArray('#story .story-line');
    const storyTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#story', start: 'top top', end: '+=280%', pin: true, scrub: 0.4,
        onUpdate: self => workshop.setProgress(self.progress),
      },
      defaults: { ease: 'none' },
    });
    lines.forEach((el, i) => {
      storyTl.fromTo(el, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 1.2 });
      storyTl.to(el, { opacity: i === lines.length - 1 ? 1 : 0, y: i === lines.length - 1 ? 0 : -46, duration: 1.2 }, '+=0.8');
    });

    /* MACRO — pinned scrub + callouts */
    const macroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#macro', start: 'top top', end: '+=320%',
        pin: true, scrub: 0.4,
        onUpdate: self => macro.setProgress(self.progress),
      },
      defaults: { ease: 'none' },
    });
    gsap.utils.toArray('#macro [data-callout]').forEach((el, i) => {
      macroTl.fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.9 }, i * 3 + 0.6);
      macroTl.to(el, { autoAlpha: 0, y: -30, duration: 0.9 }, i * 3 + 2.6);
    });
    macroTl.to({}, { duration: 0.4 });

    /* ENGINEERING — pinned scrub, title, four specs, stats */
    const engTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#engineering', start: 'top top', end: '+=380%',
        pin: true, scrub: 0.4,
        onUpdate: self => assembly.setProgress(self.progress),
      },
      defaults: { ease: 'none' },
    });
    engTl.fromTo('#eng-title', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, 0.3)
      .to('#eng-title', { opacity: 0, y: -40, duration: 1 }, 2.6);
    gsap.utils.toArray('#engineering [data-spec]').forEach((el, i) => {
      engTl.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 3.6 + i * 1.1);
    });
    engTl.fromTo('#stats', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 }, 8.6)
      .to({}, { duration: 0.6 });

    /* SIGNATURE — ambient ping-pong playback while on screen
       (real footage doesn't loop seamlessly, so play forward then backward) */
    let atmoRaf = null, atmoT0 = null;
    const atmoTick = ts => {
      if (atmoT0 === null) atmoT0 = ts;
      const cycle = ((ts - atmoT0) / 9000) % 2;
      atmosphere.setProgress(1 - Math.abs(1 - cycle));
      atmoRaf = requestAnimationFrame(atmoTick);
    };
    ScrollTrigger.create({
      trigger: '#signature', start: 'top bottom', end: 'bottom top',
      onEnter: () => { if (!atmoRaf) atmoRaf = requestAnimationFrame(atmoTick); },
      onEnterBack: () => { if (!atmoRaf) atmoRaf = requestAnimationFrame(atmoTick); },
      onLeave: () => { cancelAnimationFrame(atmoRaf); atmoRaf = null; },
      onLeaveBack: () => { cancelAnimationFrame(atmoRaf); atmoRaf = null; },
    });

    /* fade-up reveals */
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 78%' },
      });
    });

    /* form */
    document.getElementById('reserve-form').addEventListener('submit', e => {
      e.preventDefault();
      e.target.querySelectorAll('input, button').forEach(el => (el.style.display = 'none'));
      document.getElementById('form-done').style.display = 'block';
    });

    ScrollTrigger.refresh();
    S.ready = true;
  }

  boot();
})();
