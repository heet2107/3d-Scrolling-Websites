import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { initSmoothScroll } from './lib/smooth.js';
import { initCursorDust } from './lib/cursorDust.js';
import { initTilt } from './lib/tilt3d.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
window.__ST = ScrollTrigger; // test/automation hook

initSmoothScroll();

/* ---------- initial states ---------- */
gsap.set('.ut-bbox', { drawSVG: '0%' });
gsap.set('.ut-check', { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
gsap.set('.plat-connector', { drawSVG: '0%' });
gsap.set('#surf0', { xPercent: -26, yPercent: -26, opacity: 0 });
gsap.set('#surf1', { xPercent: 26, yPercent: -26, opacity: 0 });
gsap.set('#surf2', { xPercent: -26, yPercent: 26, opacity: 0 });
gsap.set('#surf3', { xPercent: 26, yPercent: 26, opacity: 0 });
gsap.set('#platCore', { scale: 0.6, opacity: 0, transformOrigin: '50% 50%' });
gsap.set('.terminal .t-line', { opacity: 0, y: 12 });

/* ---------- loader ---------- */
const loaderBar = document.querySelector('#loader .loader-bar i');
gsap.to(loaderBar, { scaleX: 1, transformOrigin: 'left', duration: 0.9, ease: 'power1.inOut' });

/* ---------- hero title reveal ---------- */
const split = new SplitText('#heroTitle', { type: 'chars', charsClass: 'char' });
window.addEventListener('load', startIntro, { once: true });
setTimeout(startIntro, 1400); // fallback if load already fired
let introDone = false;
function startIntro() {
  if (introDone) return;
  introDone = true;
  const intro = gsap.timeline();
  intro
    .to('#loader', { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' })
    .from(split.chars, {
      opacity: 0, letterSpacing: '0.6em', y: 60, rotationX: -55, filter: 'blur(14px)',
      duration: 1.4, stagger: { each: 0.05, from: 'center' }, ease: 'power3.out',
    }, '-=0.15')
    .from('.hero-copy .kicker, .hero-sub, .scroll-hint, .cov-hud', {
      opacity: 0, y: 24, duration: 1, stagger: 0.1, ease: 'power2.out',
    }, '-=0.85');
}

/* ---------- 1 · hero: run the test suite on scroll ---------- */
const blocks = gsap.utils.toArray('.ut-block');
const cov = { v: 0 };
const heroTl = gsap.timeline({
  scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=320%', pin: true, scrub: 0.6, anticipatePin: 1 },
});
// scanning beam sweeps down the page body
heroTl.fromTo('#utBeam', { y: 0 }, { y: 356, ease: 'none', duration: 1 }, 0);
// title tracks out as the scan begins
heroTl.to('#heroTitle', { letterSpacing: '0.45em', autoAlpha: 0, ease: 'power1.in', duration: 0.32 }, 0.04)
  .to('.hero-copy .kicker, .scroll-hint', { autoAlpha: 0, duration: 0.15 }, 0.02)
  .to('.hero-sub', { autoAlpha: 0, y: -30, duration: 0.25 }, 0.12);
// each UI block gets validated as the beam passes it
blocks.forEach((b, i) => {
  const p = 0.14 + i * (0.74 / blocks.length);
  heroTl.to(b.querySelector('.ut-bbox'), { drawSVG: '100%', duration: 0.07, ease: 'power1.out' }, p)
    .to(b.querySelector('.ut-check'), { scale: 1, opacity: 1, duration: 0.06, ease: 'back.out(2.4)' }, p + 0.03);
});
// coverage HUD counts up alongside
heroTl.to(cov, {
  v: 100, duration: 0.74, ease: 'none',
  onUpdate: () => {
    const val = Math.round(cov.v);
    document.getElementById('covVal').textContent = val;
    document.getElementById('covBar').style.width = val + '%';
  },
}, 0.14);

/* ---------- 2 · story reveals ---------- */
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const lines = new SplitText(el, { type: 'lines', linesClass: 'line' });
  gsap.from(lines.lines, {
    yPercent: 120, opacity: 0, duration: 1.05, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 84%', once: true },
  });
});

/* ---------- 3 · self-healing selector ----------
   State (selector text/class + status badge) is driven deterministically
   from scroll progress so it stays correct scrubbing in both directions. */
const sel = document.getElementById('shSelector');
const statusEl = document.getElementById('shStatus');
const OLD_SEL = "'#buy-now'";
const NEW_SEL = "'[data-testid=\"checkout\"]'";
let shState = '';
function setHealState(s) {
  if (s === shState) return;
  shState = s;
  if (s === 'pending') { sel.textContent = OLD_SEL; sel.className = 'sh-selector'; statusEl.textContent = 'PENDING'; statusEl.className = 'st pending'; }
  else if (s === 'fail') { sel.textContent = OLD_SEL; sel.className = 'sh-selector broken'; statusEl.textContent = 'FAIL'; statusEl.className = 'st fail'; }
  else { sel.textContent = NEW_SEL; sel.className = 'sh-selector healed'; statusEl.textContent = 'PASS'; statusEl.className = 'st pass'; }
}
setHealState('pending');

const healTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#selfheal', start: 'top top', end: '+=360%', pin: true, scrub: 0.6, anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      setHealState(p < 0.24 ? 'pending' : p < 0.64 ? 'fail' : 'pass');
    },
  },
});
healTl.from('#healHeading', { autoAlpha: 0, y: 50, duration: 0.1 }, 0.01)
  .to('#healHeading', { autoAlpha: 0, y: -40, duration: 0.12 }, 0.26)
  .to('#shDeploy', { autoAlpha: 1, duration: 0.05 }, 0.18)                          // deploy ships
  .fromTo('#healC1', { autoAlpha: 0, y: 60, rotationX: 18 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.12 }, 0.26)
  .to('#healC1', { autoAlpha: 0, y: -40, duration: 0.1 }, 0.46)
  .fromTo('#shScan', { y: 0 }, { y: 320, duration: 0.26, ease: 'none' }, 0.48)      // contextqa scans + rewrites
  .to('#shDeploy', { autoAlpha: 0, duration: 0.1 }, 0.66)
  .fromTo('#healC2', { autoAlpha: 0, y: 60, rotationX: 18 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.12 }, 0.66)
  .to('#healC2', { autoAlpha: 0, y: -40, duration: 0.1 }, 0.92);

/* ---------- 4 · platform assembles ---------- */
const platTl = gsap.timeline({
  scrollTrigger: { trigger: '#platform', start: 'top top', end: '+=360%', pin: true, scrub: 0.6, anticipatePin: 1 },
});
platTl.from('#platHeading', { autoAlpha: 0, y: 50, duration: 0.1 }, 0.02)
  .to('#platCore', { scale: 1, opacity: 1, duration: 0.16, ease: 'back.out(1.7)' }, 0.06);
['#surf0', '#surf1', '#surf2', '#surf3'].forEach((id, i) => {
  const p = 0.2 + i * 0.13;
  platTl.to(id, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.12, ease: 'power2.out' }, p)
    .to(`#conn${i}`, { drawSVG: '100%', duration: 0.1, ease: 'power1.out' }, p + 0.04);
});
['#spec1', '#spec2', '#spec3', '#spec4'].forEach((id, i) => {
  platTl.fromTo(id, { autoAlpha: 0, y: 60, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.34 + i * 0.12);
});
platTl.to('#platHeading', { autoAlpha: 0, y: -30, duration: 0.14 }, 0.42);

/* ---------- 5 · agents terminal streams in ---------- */
gsap.timeline({ scrollTrigger: { trigger: '#agents', start: 'top 62%', once: true } })
  .to('.terminal .t-line', { opacity: 1, y: 0, duration: 0.4, stagger: 0.22, ease: 'power2.out' });

const track = document.getElementById('marqueeTrack');
track.innerHTML += track.innerHTML;
gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });

/* ---------- site-wide pointer effects ---------- */
initCursorDust();
initTilt();
