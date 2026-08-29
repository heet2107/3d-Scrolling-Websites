/* ==========================================================================
   FORGE — motion.
   Everything here is progressive: the page renders complete and readable
   with this file blocked, and all motion is skipped under reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* Start every visit at the top — the hero is a scrub track, and landing
     mid-track on a refresh would drop you into the middle of the film. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- Nav ------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
    }
    // Close the mobile sheet after picking a destination.
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
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
  }

  /* ---------- HERO: scroll-scrubbed chalk cloud ------------------------- */
  function initHeroScrub() {
    var v = document.getElementById('heroVid');
    if (!v) return;

    // Lighter encode for small screens; both are all-intra so seeks land clean.
    var small = window.matchMedia('(max-width: 860px)').matches;
    // Root-absolute: the host serves this page at /forge (no trailing slash),
    // so a relative path would resolve against / and 404.
    var base = '/forge/assets/video/' + (small ? 'hero-chalk-sm' : 'hero-chalk');

    // Prefer VP9: Chromium builds without proprietary codecs can't decode H.264,
    // and Safari can't decode VP9 — between them every engine gets a stream.
    var ext = v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : '.mp4';

    // Assigning src runs the resource-selection algorithm on its own; calling
    // load() as well just aborts that first fetch and restarts it.
    v.src = base + ext;

    if (REDUCED || !hasGSAP) {
      // No scrubbing: hold a representative frame so the hero still reads.
      v.addEventListener('loadedmetadata', function () {
        try { v.currentTime = Math.min(3.2, v.duration - 0.05); } catch (e) {}
      }, { once: true });
      return;
    }

    var proxy = { t: 0 };

    var build = function () {
      var dur = v.duration;
      if (!dur || !isFinite(dur)) return;

      // Paint frame one immediately instead of sitting on the poster.
      try { v.currentTime = 0.001; } catch (e) {}

      gsap.to(proxy, {
        t: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.35
        },
        onUpdate: function () {
          if (v.readyState < 1) return;
          var time = Math.min(dur - 0.03, proxy.t * dur);
          // Skip sub-frame seeks; they only cost decoder work.
          if (Math.abs(v.currentTime - time) > 0.008) {
            try { v.currentTime = time; } catch (e) {}
          }
        }
      });

      ScrollTrigger.refresh();
    };

    if (v.readyState >= 1) build();
    else v.addEventListener('loadedmetadata', build, { once: true });
  }

  /* ---------- HERO: type punches in, then rides out --------------------- */
  function initHeroType() {
    var letters = Array.prototype.slice.call(document.querySelectorAll('#heroTitle span'));
    var motto = document.getElementById('heroMotto');
    if (!letters.length || !hasGSAP || REDUCED) return;

    gsap.set(letters, { scale: 1.5, yPercent: 14, opacity: 0, filter: 'blur(22px)' });
    gsap.set(motto, { opacity: 0, y: 24 });

    gsap.timeline({ delay: 0.2 })
      .to(letters, {
        scale: 1, yPercent: 0, opacity: 1, filter: 'blur(0px)',
        duration: 1.1, ease: 'expo.out', stagger: 0.075
      })
      .to(motto, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.55');

    // As the hero scrubs past, the lockup pushes toward the viewer and clears.
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.5 }
    })
      .to('.hero__content', { scale: 1.22, ease: 'none', duration: 1 }, 0)
      .to('.hero__content', { opacity: 0, filter: 'blur(12px)', ease: 'power2.in', duration: 0.34 }, 0.62)
      .to('.hero__meta', { opacity: 0, duration: 0.18, ease: 'none' }, 0.04);
  }

  /* ---------- Philosophy: one line per scroll step ---------------------- */
  function initCreed() {
    var track = document.getElementById('creedTrack');
    var lines = Array.prototype.slice.call(document.querySelectorAll('.philosophy__line'));
    var rail = document.querySelectorAll('#creedRail span');
    var num = document.getElementById('creedNum');
    if (!track || !lines.length) return;

    if (REDUCED || !hasGSAP) {
      lines.forEach(function (l) { l.style.opacity = 1; });
      return;
    }

    var current = -1;

    function show(i) {
      if (i === current) return;
      var dir = i > current ? 1 : -1;
      var prev = current;

      lines.forEach(function (l, k) {
        if (k === i) {
          gsap.fromTo(l,
            { opacity: 0, y: 48 * dir, filter: 'blur(14px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out', overwrite: true }
          );
        } else if (k === prev) {
          gsap.to(l, {
            opacity: 0, y: -48 * dir, filter: 'blur(14px)',
            duration: 0.42, ease: 'power2.in', overwrite: true
          });
        } else {
          // Anything further away is stale — a fast flick skipped past it.
          // Clear it outright so only ever two lines share the frame.
          gsap.set(l, { opacity: 0, filter: 'blur(14px)', overwrite: true });
        }
      });

      for (var k = 0; k < rail.length; k++) rail[k].classList.toggle('on', k === i);
      if (num) num.textContent = ('0' + (i + 1)).slice(-2);
      current = i;
    }

    ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) {
        show(Math.min(lines.length - 1, Math.floor(self.progress * lines.length * 0.9999)));
      }
    });

    show(0);
  }

  /* ---------- Film bands: drift + autoplay ------------------------------ */
  function initBands() {
    document.querySelectorAll('.band__media video').forEach(function (v) {
      if (REDUCED) { v.removeAttribute('autoplay'); v.pause(); return; }
      // Some engines need the nudge even with the autoplay attribute set.
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });

    if (REDUCED || !hasGSAP) return;

    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: el.closest('.band'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Section reveals ------------------------------------------ */
  function initReveals() {
    if (REDUCED || !hasGSAP) return;
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0, duration: 0.95, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete: function () {
            // Hand the element back to CSS. GSAP leaves an inline
            // `transform: translate(0px, 0px)` behind, which outranks the
            // :hover transforms on cards and tiers and kills the lift.
            el.classList.remove('reveal');
            gsap.set(el, { clearProps: 'all' });
          }
        }
      );
    });
  }

  /* ---------- Results counters ----------------------------------------- */
  function initCounters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll('.result__num'));
    if (!nums.length) return;

    nums.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var render = function (n) { el.textContent = Math.round(n).toLocaleString('en-US'); };

      if (REDUCED || !hasGSAP) { render(target); return; }

      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to(o, {
            v: target, duration: 2.2, ease: 'power2.out',
            onUpdate: function () { render(o.v); }
          });
        }
      });
    });
  }

  /* ---------- Programs: swipe rail state (mobile) ----------------------- */
  function initSwipeRail() {
    var grid = document.getElementById('programsGrid');
    var dots = document.querySelectorAll('#swipeDots span');
    if (!grid || !dots.length) return;

    var sync = function () {
      var card = grid.querySelector('.program');
      if (!card) return;
      var step = card.getBoundingClientRect().width + 14; // card + gap
      var i = Math.max(0, Math.min(dots.length - 1, Math.round(grid.scrollLeft / step)));
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
    };
    grid.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---------- Signup form ---------------------------------------------- */
  function initForm() {
    var form = document.getElementById('signupForm');
    var ok = document.getElementById('signupOk');
    if (!form || !ok) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var name = (form.elements.name.value || '').trim().split(' ')[0] || 'there';
      var when = form.elements.start.value.toLowerCase();

      ok.textContent = 'Locked in, ' + name + '. A coach will mail you about starting ' + when +
                       '. Bring flat shoes — this demo form does not send anything anywhere.';
      ok.hidden = false;
      form.querySelector('button[type="submit"]').textContent = 'Sent';
      ok.focus && ok.focus();
    });
  }

  /* ---------- Boot ------------------------------------------------------ */
  function boot() {
    if ('scrollRestoration' in history) window.scrollTo(0, 0);
    initNav();
    initProgress();
    initHeroScrub();
    initHeroType();
    initCreed();
    initBands();
    initReveals();
    initCounters();
    initSwipeRail();
    initForm();
    if (hasGSAP) {
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
