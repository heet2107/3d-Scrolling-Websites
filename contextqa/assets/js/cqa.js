/* ==========================================================================
   ContextQA — motion.
   Everything here is progressive: the page renders complete and readable
   with this file blocked, and all motion is skipped under reduced-motion.

   Hero: a Higgsfield generated single take film, extracted to WebP frames
   and painted on a canvas, with the frame index tied to scroll progress
   (GSAP ScrollTrigger). Chapters, decks, rails and charts are scrubbed off
   the same scroll position. The Three.js layers live in cqa-three.js.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOBILE = window.matchMedia('(max-width: 900px)');
  var COARSE = window.matchMedia('(pointer: coarse)').matches;

  if (REDUCED) doc.classList.add('reduced');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* The hero is a scrub track: landing mid-track on a refresh would drop
     the visitor into the middle of the film. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- Nav ------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    if (!nav) return;

    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
    }
    document.querySelectorAll('.nav__menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll progress ------------------------------------------ */
  function initProgress() {
    var bar = document.getElementById('progress');
    if (!bar) return;
    var tick = function () {
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
  }

  /* ---------- HERO: frame sequence painted from scroll ------------------ */
  function initHeroSequence() {
    var hero = document.querySelector('.hero');
    var canvas = document.getElementById('seq');
    var chapters = Array.prototype.slice.call(document.querySelectorAll('#heroChapters .chapter'));
    if (!hero || !canvas) return;

    if (REDUCED || !hasGSAP || !canvas.getContext) {
      doc.classList.add('static-hero');
      return;
    }

    var ctx = canvas.getContext('2d', { alpha: false });
    /* Portrait screens get a 3:4 crop of the film at a lower frame rate;
       everything else gets the full 16:9 set. Layout decisions (zoom and
       focus) follow the CSS breakpoint instead. */
    var portrait = window.innerHeight > window.innerWidth;
    var small = MOBILE.matches;
    var total = parseInt(canvas.getAttribute(portrait ? 'data-mframes' : 'data-frames'), 10) || 0;
    var base = canvas.getAttribute(portrait ? 'data-mobile' : 'data-desktop');
    var poster = document.getElementById('heroPoster');
    if (!total || !base) { doc.classList.add('static-hero'); return; }

    var frames = new Array(total);   // HTMLImageElement or undefined
    var loaded = new Array(total);   // true once decoded
    var loadedCount = 0;
    var failed = 0;
    var current = -1;
    var target = 0;
    var progress = 0;
    var W = 0, H = 0, DPR = 1;
    var raf = 0;
    var ready = false;

    var pad = function (n) { return ('0000' + n).slice(-4); };
    var src = function (i) { return base + pad(i + 1) + '.webp'; };

    /* Load order: first frame, then coarse keyframes, then fill in.
       The scrub is usable after the first pass and only gets smoother. */
    var order = [];
    var seen = {};
    var push = function (i) { if (!seen[i]) { seen[i] = true; order.push(i); } };
    push(0);
    [12, 6, 3, 1].forEach(function (step) { for (var i = 0; i < total; i += step) push(i); });
    push(total - 1);

    var inflight = 0;
    var MAX = 6;
    var cursor = 0;

    var markReady = function () {
      if (ready) return;
      ready = true;
      hero.classList.add('is-ready');
      requestDraw();
    };

    /* The poster is the film's first frame, so it doubles as frame zero:
       the canvas can paint immediately, with the same cover fit, and the
       poster fades out underneath it with no visible jump. */
    var adoptPoster = function () {
      if (loaded[0] || !poster || !poster.naturalWidth) return;
      frames[0] = poster;
      loaded[0] = true;
      loadedCount++;
      markReady();
    };
    var pump = function () {
      while (inflight < MAX && cursor < order.length) {
        (function (i) {
          inflight++;
          var img = new Image();
          img.decoding = 'async';
          img.onload = function () {
            inflight--;
            frames[i] = img;
            if (!loaded[i]) loadedCount++;
            loaded[i] = true;
            if (i === 0) markReady();
            // If the frame we are showing was a stand-in, repaint with the real one.
            else if (Math.abs(i - target) <= 2) requestDraw();
            pump();
          };
          img.onerror = function () {
            inflight--; failed++;
            if (failed > 8 && loadedCount === 0) doc.classList.add('static-hero');
            pump();
          };
          img.src = src(i);
        })(order[cursor++]);
      }
    };

    /* Nearest decoded frame to the target, preferring the past so the
       motion never appears to run backwards while frames arrive. */
    var nearest = function (i) {
      if (loaded[i]) return i;
      for (var d = 1; d < total; d++) {
        if (i - d >= 0 && loaded[i - d]) return i - d;
        if (i + d < total && loaded[i + d]) return i + d;
      }
      return -1;
    };

    var resize = function () {
      var r = canvas.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      W = Math.max(1, Math.round(r.width * DPR));
      H = Math.max(1, Math.round(r.height * DPR));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      current = -1;
      requestDraw();
    };

    /* Cover fit with an animated focus point: on wide screens the film
       opens zoomed a little and anchored left, so the gyroscope sits to the
       right of the lockup, then eases to a centered, unzoomed frame as the
       title rides out. */
    var draw = function () {
      raf = 0;
      var i = nearest(target);
      if (i < 0) return;
      var img = frames[i];
      var iw = img.naturalWidth, ih = img.naturalHeight;
      if (!iw || !ih) return;

      var t = smooth(progress / 0.26);
      // Phones open zoomed with the gyroscope lifted above the lockup;
      // wide screens open zoomed and anchored left. Both ease to centre.
      var zoom = lerp(small ? 1.3 : 1.28, 1, t);
      var focusX = small ? 0.5 : lerp(0.02, 0.5, t);
      var focusY = small ? lerp(1, 0.5, t) : 0.5;

      var s = Math.max(W / iw, H / ih) * zoom;
      var dw = iw * s, dh = ih * s;
      var dx = (W - dw) * focusX;
      var dy = (H - dh) * focusY;

      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, dx, dy, dw, dh);
      current = i;
    };

    var requestDraw = function () { if (!raf) raf = requestAnimationFrame(draw); };

    /* Chapters: each one lives in a slice of the scrub, fading in over its
       first fifth and out over its last fifth while drifting upward. */
    var chapterData = chapters.map(function (el) {
      return { el: el, a: parseFloat(el.getAttribute('data-in')) || 0, b: parseFloat(el.getAttribute('data-out')) || 1, center: el.classList.contains('chapter--center') };
    });
    var updateChapters = function (p) {
      chapterData.forEach(function (c) {
        var span = c.b - c.a;
        var t = (p - c.a) / span;
        var o = 0;
        if (t > 0 && t < 1) {
          var fade = 0.22;
          o = t < fade ? t / fade : t > 1 - fade ? (1 - t) / fade : 1;
          o = smooth(o);
        }
        var y = (0.5 - clamp(t, 0, 1)) * 60;
        var base = c.center ? 'translateX(-50%) ' : (small ? '' : 'translateY(-50%) ');
        c.el.style.opacity = o.toFixed(3);
        c.el.style.transform = base + 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    };

    var proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.45 },
      onUpdate: function () {
        progress = proxy.p;
        target = clamp(Math.round(progress * (total - 1)), 0, total - 1);
        updateChapters(progress);
        if (nearest(target) !== current || progress < 0.27) requestDraw();
      }
    });

    resize();
    updateChapters(0);
    window.addEventListener('resize', resize);
    // Adopt the poster only now that the draw helpers exist.
    if (poster) {
      if (poster.complete) adoptPoster();
      else poster.addEventListener('load', adoptPoster, { once: true });
    }
    pump();

    // Let the Three.js layer know how far along the film is.
    window.__cqaHero = { progress: function () { return progress; } };
  }

  /* ---------- HERO: lockup punches in, then rides out ------------------- */
  function initHeroLockup() {
    var lines = Array.prototype.slice.call(document.querySelectorAll('#heroTitle .line > span'));
    var sub = document.getElementById('heroSub');
    var actions = document.getElementById('heroActions');
    var eyebrow = document.querySelector('.hero__eyebrow');
    var lockup = document.getElementById('heroLockup');
    var meta = document.getElementById('heroMeta');
    if (!lines.length || !hasGSAP || REDUCED) return;

    gsap.set(lines, { yPercent: 112 });
    gsap.set([sub, actions, eyebrow], { opacity: 0, y: 18 });
    gsap.set(meta, { opacity: 0 });

    gsap.timeline({ delay: 0.25 })
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
      .to(lines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09 }, '-=0.5')
      .to(sub, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7')
      .to(actions, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to(meta, { opacity: 1, duration: 0.8 }, '-=0.4');

    // As the film starts to scrub, the lockup pushes toward the viewer and clears.
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.5 }
    })
      .to(lockup, { scale: 1.16, xPercent: -6, ease: 'none', duration: 0.24 }, 0)
      .to(lockup, { opacity: 0, filter: 'blur(10px)', ease: 'power2.in', duration: 0.14 }, 0.06)
      .to(meta, { opacity: 0, duration: 0.05, ease: 'none' }, 0.02)
      .to({}, { duration: 0.76 }); // hold the timeline to full track length
  }

  /* ---------- The shift: eras rise in 3D, bars grow --------------------- */
  function initEras() {
    var eras = Array.prototype.slice.call(document.querySelectorAll('.era'));
    if (!eras.length) return;

    eras.forEach(function (era) {
      var out = era.querySelector('.bar--out .bar__fill');
      var cap = era.querySelector('.bar--cap .bar__fill');
      var vo = (parseFloat(era.getAttribute('data-out')) || 0) / 100;
      var vc = (parseFloat(era.getAttribute('data-cap')) || 0) / 100;
      if (out) out.style.setProperty('--v', vo);
      if (cap) cap.style.setProperty('--v', vc);

      if (!hasGSAP || REDUCED) return;

      gsap.set(era, { rotateY: -14, z: -160, opacity: 0, transformOrigin: '50% 50%' });
      gsap.timeline({
        scrollTrigger: { trigger: era, start: 'top 82%', once: true }
      })
        .to(era, { rotateY: 0, z: 0, opacity: 1, duration: 1.2, ease: 'expo.out' })
        .to(out, { scaleX: vo, duration: 1.4, ease: 'power3.inOut' }, '-=0.7')
        .to(cap, { scaleX: vc, duration: 1.4, ease: 'power3.inOut' }, '-=1.3');
    });
  }

  /* ---------- Statement: word by word lights up with scroll ------------- */
  function initStatement() {
    var track = document.getElementById('statement');
    var el = document.getElementById('statementText');
    if (!track || !el) return;

    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    var keys = { throughput: 1, understanding: 1 };
    el.textContent = '';
    var spans = words.map(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w' + (keys[w.replace(/[.,]/g, '').toLowerCase()] ? ' key' : '');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });

    if (!hasGSAP || REDUCED || MOBILE.matches) {
      spans.forEach(function (s) { s.classList.add('lit'); });
      return;
    }

    var proxy = { n: 0 };
    gsap.to(proxy, {
      n: spans.length,
      ease: 'none',
      scrollTrigger: { trigger: track, start: 'top 20%', end: 'bottom 90%', scrub: 0.3 },
      onUpdate: function () {
        var n = Math.round(proxy.n);
        spans.forEach(function (s, i) { s.classList.toggle('lit', i < n); });
      }
    });
  }

  /* ---------- The villain: deck fans out of a stack in 3D --------------- */
  function initDeck() {
    var track = document.querySelector('.villain__track');
    var deck = document.getElementById('deck');
    var head = document.querySelector('.villain__head');
    var quote = document.querySelector('.villain__quote');
    if (!track || !deck) return;
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.card3d'));

    if (!hasGSAP || REDUCED || MOBILE.matches) {
      [head, quote].concat(cards).forEach(function (el) { if (el) el.classList.add('reveal'); });
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
    });

    gsap.set(head.children, { opacity: 0, y: 30 });
    gsap.set(quote, { opacity: 0, y: 24 });

    tl.to(head.children, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, 0);

    // Measure each card's resting slot, then start them all stacked in the
    // middle of the deck with a slight fan, and fly them home.
    var dr = deck.getBoundingClientRect();
    var cx = dr.left + dr.width / 2, cy = dr.top + dr.height / 2;
    cards.forEach(function (card, i) {
      var r = card.getBoundingClientRect();
      var ox = cx - (r.left + r.width / 2);
      var oy = cy - (r.top + r.height / 2);
      gsap.set(card, { x: ox, y: oy, z: -260 - i * 40, rotateY: (i % 2 ? 1 : -1) * 18, rotateX: 10, opacity: 0, transformOrigin: '50% 50%' });
      tl.to(card, { x: 0, y: 0, z: 0, rotateY: 0, rotateX: 0, opacity: 1, duration: 0.9, ease: 'power3.inOut' }, 0.35 + i * 0.22);
    });

    tl.to(quote, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '>-0.2');
    tl.to({}, { duration: 0.4 });

    ScrollTrigger.addEventListener('refreshInit', function () { gsap.set(cards, { clearProps: 'x,y' }); });
  }

  /* ---------- The engine: pinned rail, active stage feeds the gyroscope -- */
  function initEngine() {
    var track = document.getElementById('engineTrack');
    var rail = document.getElementById('rail');
    var name = document.getElementById('stageName');
    if (!track || !rail) return;
    var stages = Array.prototype.slice.call(rail.querySelectorAll('.stage'));
    var active = -1;

    var setActive = function (i, p) {
      if (i !== active) {
        active = i;
        stages.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        if (name) name.textContent = stages[i].querySelector('.stage__title').textContent;
      }
      if (window.__cqaGyro) window.__cqaGyro.setStage(i, p);
    };

    if (MOBILE.matches || !hasGSAP || REDUCED) {
      // Native swipe rail on mobile: the closest card to center is active.
      var pick = function () {
        var rr = rail.getBoundingClientRect();
        var mid = rr.left + rr.width / 2;
        var best = 0, bd = Infinity;
        stages.forEach(function (s, k) {
          var r = s.getBoundingClientRect();
          var d = Math.abs(r.left + r.width / 2 - mid);
          if (d < bd) { bd = d; best = k; }
        });
        setActive(best, best / Math.max(1, stages.length - 1));
      };
      pick();
      rail.addEventListener('scroll', pick, { passive: true });
      if (!MOBILE.matches) setActive(0, 0);
      return;
    }

    var proxy = { p: 0 };
    var travel = function () { return Math.max(0, rail.scrollWidth - rail.clientWidth); };
    var head = document.querySelector('.engine__head');
    gsap.set(head.children, { opacity: 0, y: 26 });
    gsap.set(stages, { opacity: 0, y: 30 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true }
    });
    tl.to(head.children, { opacity: 1, y: 0, stagger: 0.05, duration: 0.25, ease: 'power3.out' }, 0)
      .to(stages, { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power3.out' }, 0.1)
      .to(proxy, {
        p: 1, duration: 2.2, ease: 'none',
        onUpdate: function () {
          gsap.set(rail, { x: -travel() * proxy.p });
          var i = clamp(Math.round(proxy.p * (stages.length - 1)), 0, stages.length - 1);
          setActive(i, proxy.p);
        }
      }, 0.35)
      .to({}, { duration: 0.3 });

    setActive(0, 0);
  }

  /* ---------- Four hero flows: steps reveal with scroll (or play on view) - */
  function initFlows() {
    var flows = Array.prototype.slice.call(document.querySelectorAll('.flow'));
    if (!flows.length) return;

    flows.forEach(function (flow) {
      var stepped = Array.prototype.slice.call(flow.querySelectorAll('[data-step]'));
      var log = Array.prototype.slice.call(flow.querySelectorAll('.worklog li'));
      var maxStep = 0;
      stepped.forEach(function (el) { maxStep = Math.max(maxStep, parseInt(el.getAttribute('data-step'), 10) || 0); });

      var apply = function (step) {
        stepped.forEach(function (el) {
          var s = parseInt(el.getAttribute('data-step'), 10) || 0;
          el.classList.toggle('is-on', step >= s);
        });
        log.forEach(function (li) {
          var s = parseInt(li.getAttribute('data-step'), 10) || 0;
          li.classList.toggle('is-done', step > s);
          li.classList.toggle('is-live', step === s);
        });
      };

      if (REDUCED) { apply(maxStep + 1); return; }

      if (MOBILE.matches || !hasGSAP) {
        // Without pinning there is no scroll range to scrub: the panels stay
        // visible and the investigation ticks through once the flow is in view.
        stepped.forEach(function (el) { if (!el.closest('.worklog')) el.classList.add('is-on'); });
        var played = false;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting || played) return;
            played = true;
            var step = 1;
            var tick = function () {
              log.forEach(function (li) {
                var s = parseInt(li.getAttribute('data-step'), 10) || 0;
                li.classList.toggle('is-done', step > s);
                li.classList.toggle('is-live', step === s);
              });
              if (step <= maxStep) { step++; setTimeout(tick, 420); }
            };
            tick();
            io.disconnect();
          });
        }, { threshold: 0.15 });
        io.observe(flow);
        return;
      }

      var hook = flow.querySelector('.flow__hook');
      var tabs = flow.querySelector('.flow__tabs');
      gsap.set([tabs, hook], { opacity: 0, y: 20 });

      var proxy = { s: 0 };
      var tl = gsap.timeline({
        scrollTrigger: { trigger: flow, start: 'top top', end: 'bottom bottom', scrub: 0.4 }
      });
      tl.to([tabs, hook], { opacity: 1, y: 0, stagger: 0.05, duration: 0.18, ease: 'power3.out' }, 0)
        .to(proxy, {
          s: maxStep + 1, duration: 1, ease: 'none',
          onUpdate: function () { apply(Math.floor(proxy.s)); }
        }, 0.08)
        .to({}, { duration: 0.22 });
      apply(0);
    });
  }

  /* ---------- Impact: chart draws with scroll, counters count ----------- */
  function initImpact() {
    var chart = document.getElementById('chart');
    if (chart) {
      var lines = Array.prototype.slice.call(chart.querySelectorAll('.chart__line'));
      lines.forEach(function (path) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = (hasGSAP && !REDUCED) ? len : 0;
      });
      if (hasGSAP && !REDUCED) {
        var tl = gsap.timeline({
          scrollTrigger: { trigger: chart, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 }
        });
        lines.forEach(function (path, i) {
          tl.to(path, { strokeDashoffset: 0, duration: 1, ease: 'none' }, i * 0.12);
        });
      }
    }

    var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    counters.forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var render = function (v) { el.textContent = prefix + Math.round(v) + suffix; };
      if (!hasGSAP || REDUCED) { render(end); return; }
      var o = { v: 0 };
      render(0);
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: function () { render(o.v); } }); }
      });
    });
  }

  /* ---------- Pointer tilt on the comparison cards ---------------------- */
  function initTilt() {
    if (REDUCED || COARSE) return;
    document.querySelectorAll('.tilt').forEach(function (card) {
      var raf = 0, rx = 0, ry = 0;
      var paint = function () { raf = 0; card.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(6px)'; };
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry = px * 10; rx = -py * 8;
        if (!raf) raf = requestAnimationFrame(paint);
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1), border-color .4s, box-shadow .4s';
        card.style.transform = '';
        setTimeout(function () { card.style.transition = ''; }, 800);
      });
    });
  }

  /* ---------- Reveals, CTA parallax, form -------------------------------- */
  function initReveals() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function initParallax() {
    if (!hasGSAP || REDUCED) return;
    document.querySelectorAll('[data-parallax]').forEach(function (media) {
      var img = media.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: media.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  function initForm() {
    var form = document.getElementById('signup');
    var note = document.getElementById('signupNote');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      var ok = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!ok) {
        if (note) note.textContent = 'Please use a valid work email.';
        if (email) email.focus();
        return;
      }
      // Front end only: wire this to a mail handler or CRM before going live.
      form.reset();
      if (note) note.textContent = 'Thanks. We will reach out to schedule a walkthrough on your codebase.';
    });
  }

  /* ---------- Boot ------------------------------------------------------- */
  function boot() {
    initNav();
    initProgress();
    initHeroSequence();
    initHeroLockup();
    initEras();
    initStatement();
    initDeck();
    initEngine();
    initFlows();
    initImpact();
    initTilt();
    initReveals();
    initParallax();
    initForm();

    if (hasGSAP) {
      // Layout settles after fonts and lazy media arrive; keep triggers honest.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
