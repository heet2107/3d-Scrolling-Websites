import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

gsap.registerPlugin(Physics2DPlugin);

// Site-wide gold-dust cursor: tiny particles ejected along the pointer's
// path, thrown with Physics2D (velocity + gravity) and faded out.
export function initCursorDust() {
  if (matchMedia('(pointer: coarse)').matches) return; // skip touch devices

  const layer = document.createElement('div');
  layer.id = 'dust-layer';
  document.body.appendChild(layer);

  const MAX_LIVE = 90;
  let live = 0;
  let lastX = -1;
  let lastY = -1;
  let lastSpawn = 0;

  function spawn(x, y, speedBoost) {
    if (live >= MAX_LIVE) return;
    live++;
    const p = document.createElement('span');
    p.className = 'dust' + (Math.random() < 0.22 ? ' violet' : '');
    layer.appendChild(p);
    const size = gsap.utils.random(2, 5);
    gsap.set(p, { x, y, width: size, height: size, opacity: 1, scale: gsap.utils.random(0.6, 1.2) });
    gsap.to(p, {
      duration: gsap.utils.random(0.7, 1.4),
      physics2D: {
        velocity: gsap.utils.random(40, 110) + speedBoost,
        angle: gsap.utils.random(0, 360),
        gravity: 160,
      },
      scale: 0,
      opacity: 0,
      ease: 'none',
      onComplete() {
        p.remove();
        live--;
      },
    });
  }

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastSpawn < 22) return;
    lastSpawn = now;
    const dx = lastX < 0 ? 0 : e.clientX - lastX;
    const dy = lastY < 0 ? 0 : e.clientY - lastY;
    const speed = Math.min(Math.hypot(dx, dy), 60);
    lastX = e.clientX;
    lastY = e.clientY;
    const n = speed > 24 ? 3 : speed > 8 ? 2 : 1;
    for (let i = 0; i < n; i++) spawn(e.clientX, e.clientY, speed * 1.5);
  }, { passive: true });
}
