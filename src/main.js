import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { initSmoothScroll } from './lib/smooth.js';
import { initCursorDust } from './lib/cursorDust.js';
import { initTilt } from './lib/tilt3d.js';
import { FrameScrubber } from './lib/frameScrubber.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

initSmoothScroll();

/* ---------- frame sequences ---------- */
const hero = new FrameScrubber(document.getElementById('heroCanvas'), {
  base: 'frames/clip1', count: 120,
});
const heal = new FrameScrubber(document.getElementById('healCanvas'), {
  base: 'frames/clip2', count: 96,
});
const asm = new FrameScrubber(document.getElementById('asmCanvas'), {
  base: 'frames/clip3', count: 96,
});

/* ---------- loader: wait for the hero sequence ---------- */
const loaderBar = document.querySelector('#loader .loader-bar i');
const heroReady = hero.load((p) => gsap.set(loaderBar, { scaleX: p }));

// stream in the other sequences behind the scenes
heal.load();
asm.load();

/* ---------- hero title: tracking-in reveal ---------- */
const split = new SplitText('#heroTitle', { type: 'chars', charsClass: 'char' });

heroReady.then(() => {
  const intro = gsap.timeline();
  intro
    .to('#loader', { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' })
    .from(split.chars, {
      opacity: 0,
      letterSpacing: '0.6em',
      y: 60,
      rotationX: -55,
      filter: 'blur(14px)',
      duration: 1.5,
      stagger: { each: 0.055, from: 'center' },
      ease: 'power3.out',
    }, '-=0.15')
    .from('.hero-copy .kicker, .hero-sub, .scroll-hint', {
      opacity: 0, y: 24, duration: 1, stagger: 0.12, ease: 'power2.out',
    }, '-=0.9');
});

/* ---------- 1 · hero orbit scrub ---------- */
const heroState = { p: 0 };
gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: '+=320%',
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
  },
})
  .to(heroState, {
    p: 1, ease: 'none', duration: 1,
    onUpdate: () => hero.frame(heroState.p),
  }, 0)
  // title tracks out and dissolves as the orbit begins
  .to('#heroTitle', { letterSpacing: '0.45em', autoAlpha: 0, ease: 'power1.in', duration: 0.35 }, 0.05)
  .to('.hero-copy .kicker, .scroll-hint', { autoAlpha: 0, duration: 0.15 }, 0.02)
  .to('.hero-sub', { autoAlpha: 0, y: -30, duration: 0.25 }, 0.15)
  // slow drift-in on the canvas for extra depth
  .fromTo('#heroCanvas', { scale: 1.06 }, { scale: 1, ease: 'none', duration: 1 }, 0);

/* ---------- 2 · story line reveals ---------- */
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const lines = new SplitText(el, { type: 'lines', linesClass: 'line' });
  gsap.from(lines.lines, {
    yPercent: 120,
    opacity: 0,
    duration: 1.1,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 82%',
      once: true,
    },
  });
});

/* ---------- 3 · self-healing scrub with callouts ---------- */
const healState = { p: 0 };
const calloutIn = { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.14, ease: 'power2.out' };
const calloutFrom = { autoAlpha: 0, y: 60, rotationX: 18 };

gsap.timeline({
  scrollTrigger: {
    trigger: '#selfheal',
    start: 'top top',
    end: '+=380%',
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
  },
})
  .to(healState, {
    p: 1, ease: 'none', duration: 1,
    onUpdate: () => heal.frame(healState.p),
  }, 0)
  .from('#healHeading', { autoAlpha: 0, y: 50, duration: 0.1 }, 0.01)
  .to('#healHeading', { autoAlpha: 0, y: -40, duration: 0.12 }, 0.3)
  .fromTo('#healC1', calloutFrom, calloutIn, 0.2)
  .to('#healC1', { autoAlpha: 0, y: -50, duration: 0.12 }, 0.42)
  .fromTo('#healC2', calloutFrom, calloutIn, 0.48)
  .to('#healC2', { autoAlpha: 0, y: -50, duration: 0.12 }, 0.68)
  .fromTo('#healC3', calloutFrom, calloutIn, 0.74)
  .to('#healC3', { autoAlpha: 0, y: -50, duration: 0.12 }, 0.94);

/* ---------- 4 · assembly scrub with spec chips ---------- */
const asmState = { p: 0 };
const asmTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#assembly',
    start: 'top top',
    end: '+=380%',
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
  },
});
asmTl.to(asmState, {
  p: 1, ease: 'none', duration: 1,
  onUpdate: () => asm.frame(asmState.p),
}, 0);
asmTl.from('#asmHeading', { autoAlpha: 0, y: 50, duration: 0.1 }, 0.02);

// spec chips converge with the assembling parts and stay
['#spec1', '#spec2', '#spec3', '#spec4', '#spec5'].forEach((id, i) => {
  asmTl.fromTo(id,
    { autoAlpha: 0, y: 70, scale: 0.9 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.12, ease: 'power2.out' },
    0.22 + i * 0.14
  );
});
asmTl.to('#asmHeading', { autoAlpha: 0.25, duration: 0.15 }, 0.6);

/* ---------- 5 · agents marquee ---------- */
const track = document.getElementById('marqueeTrack');
track.innerHTML += track.innerHTML; // duplicate for seamless wrap
gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });

gsap.from('#agents video', {
  scale: 1.15,
  scrollTrigger: { trigger: '#agents', start: 'top bottom', end: 'bottom top', scrub: 1 },
  ease: 'none',
});

// some browsers refuse autoplay until the element is on screen — nudge it
const agentsVideo = document.querySelector('#agents video');
ScrollTrigger.create({
  trigger: '#agents',
  start: 'top 90%',
  onEnter: () => agentsVideo.play().catch(() => {}),
  onEnterBack: () => agentsVideo.play().catch(() => {}),
});

/* ---------- site-wide pointer effects ---------- */
initCursorDust();
initTilt();
