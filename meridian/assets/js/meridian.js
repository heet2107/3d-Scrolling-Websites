/* ==========================================================================
   MERIDIAN — motion.
   Progressive: every page renders complete and readable with this file
   blocked, and all motion is skipped under prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* The four hours, and the light each one casts on the page. */
  var PHASE = {
    dawn:     { c: '#E8A87C', w: '#F7E6D6' },
    meridian: { c: '#DFB55A', w: '#F8EFD9' },
    dusk:     { c: '#C98E86', w: '#F4E1DA' },
    deep:     { c: '#7A8CA0', w: '#E4E8ED' }
  };
  var ORDER = ['dawn', 'meridian', 'dusk', 'deep'];

  function setPhase(key) {
    var p = PHASE[key];
    if (!p) return;
    var r = document.documentElement;
    if (r.dataset.phase === key) return;
    r.dataset.phase = key;
    r.style.setProperty('--phase', p.c);
    r.style.setProperty('--phase-wash', p.w);
  }

  /* ---------- Nav ------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 30); };
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

  /* ---------- Ambient phase light --------------------------------------- */
  /* Whichever hour is nearest the middle of the viewport tints the page. */
  function initPhaseLight() {
    /* data-hour marks the blocks; data-phase is what we write on <html>.
       Sharing one attribute would make the root element its own candidate. */
    var marked = Array.prototype.slice.call(document.querySelectorAll('[data-hour]'));
    if (!marked.length || REDUCED) return;

    var pick = function () {
      var mid = window.innerHeight / 2;
      var best = null, bestD = Infinity;
      marked.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var d = Math.abs((r.top + r.height / 2) - mid);
        if (d < bestD) { bestD = d; best = el; }
      });
      if (best) setPhase(best.getAttribute('data-hour'));
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
  }

  /* ---------- The day arc ----------------------------------------------- */
  function initArcs() {
    document.querySelectorAll('.arc').forEach(function (arc) {
      var prog = arc.querySelector('.arc__prog');
      var sun = arc.querySelector('.arc__sun');
      if (!prog || !sun) return;

      var len = prog.getTotalLength();
      var place = function (t) {
        prog.style.strokeDasharray = len;
        prog.style.strokeDashoffset = len * (1 - t);
        var pt = prog.getPointAtLength(len * Math.max(0.0001, t));
        sun.setAttribute('cx', pt.x);
        sun.setAttribute('cy', pt.y);
        var key = ORDER[Math.min(ORDER.length - 1, Math.floor(t * ORDER.length * 0.999))];
        sun.setAttribute('fill', PHASE[key].c);
        prog.style.stroke = PHASE[key].c;
      };

      if (REDUCED || !hasGSAP) { place(1); return; }

      place(0);
      ScrollTrigger.create({
        trigger: arc,
        start: 'top 88%',
        end: 'bottom 35%',
        scrub: 0.5,
        onUpdate: function (self) { place(self.progress); }
      });
    });
  }

  /* ---------- Hero ------------------------------------------------------ */
  function initHero() {
    var words = Array.prototype.slice.call(document.querySelectorAll('#heroTitle .w'));
    if (!words.length || !hasGSAP || REDUCED) return;
    gsap.set(words, { yPercent: 108, opacity: 0 });
    gsap.to(words, {
      yPercent: 0, opacity: 1, duration: 1.15, ease: 'expo.out',
      stagger: 0.075, delay: 0.15
    });
  }

  /* ---------- Reveals --------------------------------------------------- */
  function initReveals() {
    if (REDUCED || !hasGSAP) return;
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onComplete: function () {
          /* Hand the element back to CSS — GSAP's leftover inline transform
             outranks the :hover lift on cards and tiers and kills it. */
          el.classList.remove('reveal');
          gsap.set(el, { clearProps: 'all' });
        }
      });
    });
  }

  /* ---------- Counters -------------------------------------------------- */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count');
      var target = parseInt(raw, 10);
      if (isNaN(target)) return;
      /* A year is a label, not a quantity — counting up to it looks silly. */
      if (target >= 1900) { el.textContent = raw; return; }
      if (REDUCED || !hasGSAP) { el.textContent = target.toLocaleString('en-US'); return; }

      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () {
          gsap.to(o, {
            v: target, duration: 1.8, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString('en-US'); }
          });
        }
      });
    });
  }

  /* ---------- Swipe rails ----------------------------------------------- */
  function initRails() {
    document.querySelectorAll('.grid--rail').forEach(function (rail) {
      var hint = rail.parentElement.querySelector('.swipe-hint');
      if (!hint) return;
      var dots = hint.querySelectorAll('.swipe-hint__dots span');
      if (!dots.length) return;

      var sync = function () {
        var card = rail.firstElementChild;
        if (!card) return;
        var step = card.getBoundingClientRect().width + 16;
        var i = Math.max(0, Math.min(dots.length - 1, Math.round(rail.scrollLeft / step)));
        for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
      };
      rail.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* ---------- Forms ----------------------------------------------------- */
  function wireForm(formId, okId, message) {
    var form = document.getElementById(formId);
    var ok = document.getElementById(okId);
    if (!form || !ok) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      ok.innerHTML = message(form);
      ok.hidden = false;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Sent'; btn.disabled = true; }
    });
  }

  function initForms() {
    wireForm('bookForm', 'bookOk', function (f) {
      var first = (f.elements.name.value || '').trim().split(' ')[0] || 'there';
      return 'Thanks, ' + first + '. A guide will write to you within a day to fix a time — ' +
             'we will start with the ' + f.elements.phase.value.split('—')[0].trim().toLowerCase() +
             ' hour. This demo form does not send anything anywhere.';
    });
    wireForm('letterForm', 'letterOk', function () {
      return 'You are on the list — first of the month. This demo form does not send anything anywhere.';
    });
  }

  /* ---------- Boot ------------------------------------------------------ */
  function boot() {
    initNav();
    initPhaseLight();
    initArcs();
    initHero();
    initReveals();
    initCounters();
    initRails();
    initForms();
    if (hasGSAP) {
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
