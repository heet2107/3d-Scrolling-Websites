import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { initSmoothScroll } from './lib/smooth.js';
import { initCursorDust } from './lib/cursorDust.js';
import { initTilt } from './lib/tilt3d.js';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase);

CustomEase.create('cinematic', 'M0,0 C0.22,0.9 0.32,1 1,1');

initSmoothScroll();

/* ---------- hero title ---------- */
const split = new SplitText('#svcTitle', { type: 'chars', charsClass: 'char' });
gsap.from(split.chars, {
  opacity: 0,
  yPercent: 110,
  rotationX: -60,
  duration: 1.2,
  stagger: 0.04,
  ease: 'cinematic',
  delay: 0.2,
});
gsap.from('.svc-hero .kicker, .svc-hero .lede', {
  opacity: 0, y: 26, duration: 1, stagger: 0.15, delay: 0.7, ease: 'power2.out',
});

/* ---------- scramble stats ---------- */
document.querySelectorAll('.stat .num').forEach((el, i) => {
  gsap.to(el, {
    scrambleText: {
      text: el.dataset.stat,
      chars: '0123456789%/,',
      speed: 0.4,
    },
    duration: 1.6,
    delay: i * 0.12,
    ease: 'none',
    scrollTrigger: { trigger: '#stats', start: 'top 80%', once: true },
  });
});
gsap.from('.stat', {
  opacity: 0, y: 40, stagger: 0.1, duration: 0.9, ease: 'power2.out',
  scrollTrigger: { trigger: '#stats', start: 'top 85%', once: true },
});

/* ---------- shared line reveals ---------- */
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const lines = new SplitText(el, { type: 'lines', linesClass: 'line' });
  el.querySelectorAll('.line').forEach((l) => (l.style.overflow = 'hidden'));
  gsap.from(lines.lines, {
    yPercent: 120,
    opacity: 0,
    duration: 1,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  });
});

/* ---------- service cards: stagger in + draw icons ---------- */
gsap.from('.svc-card', {
  opacity: 0,
  y: 90,
  rotationX: -14,
  transformOrigin: '50% 0%',
  duration: 1.1,
  stagger: 0.12,
  ease: 'cinematic',
  scrollTrigger: { trigger: '.svc-grid', start: 'top 82%', once: true },
});
document.querySelectorAll('.svc-card svg').forEach((svg) => {
  gsap.from(svg.querySelectorAll('path, rect, circle, line'), {
    drawSVG: '0%',
    duration: 1.4,
    stagger: 0.12,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: svg, start: 'top 88%', once: true },
  });
});

/* ---------- self-healing line: break, then weld shut ---------- */
const healTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.heal-band svg',
    start: 'top 75%',
    end: 'bottom 30%',
    scrub: 0.8,
  },
});
healTl
  .fromTo('#healPath', { drawSVG: '0% 0%' }, { drawSVG: '0% 42%', ease: 'none', duration: 0.35 })
  .fromTo('#healBreak', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.1 }, 0.3)
  .to('#healBreak', { opacity: 0, duration: 0.1 }, 0.55)
  .to('#healPath', { drawSVG: '0% 100%', ease: 'none', duration: 0.45 }, 0.5)
  .fromTo('#healPulse',
    { attr: { cx: 0 }, opacity: 0 },
    { attr: { cx: 880 }, opacity: 1, ease: 'none', duration: 0.9 },
    0.05
  )
  .to('#healPulse', { opacity: 0, duration: 0.05 }, 0.95);

/* ---------- ambient video drift ---------- */
gsap.from('.svc-hero video', {
  scale: 1.18,
  duration: 3,
  ease: 'power2.out',
});
document.querySelector('.svc-hero video').play().catch(() => {});

/* ---------- site-wide pointer effects ---------- */
initCursorDust();
initTilt();
