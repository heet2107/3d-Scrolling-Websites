import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Lenis smooth scroll driven by GSAP's ticker, wired into ScrollTrigger.
export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; // test/automation hook
  return lenis;
}
