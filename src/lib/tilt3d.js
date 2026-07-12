import { gsap } from 'gsap';

// Site-wide 3D pointer effects:
//  - [data-tilt] elements rotate toward the cursor while hovered
//  - [data-depth-scene] wrappers get a slow whole-scene parallax tilt
//    driven by the pointer's position in the viewport
export function initTilt() {
  if (matchMedia('(pointer: coarse)').matches) return;

  // --- per-element hover tilt ---
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const strength = parseFloat(el.dataset.tilt) || 8;
    if (!el.parentElement.classList.contains('tilt-scene')) {
      el.parentElement.classList.add('tilt-scene');
    }
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const z = gsap.quickTo(el, 'z', { duration: 0.5, ease: 'power3.out' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * strength);
      ry(px * strength);
      z(18);
      el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      rx(0); ry(0); z(0);
    });
  });

  // --- whole-scene pointer parallax ---
  const scenes = [...document.querySelectorAll('[data-depth-scene]')].map((el) => {
    const depth = parseFloat(el.dataset.depthScene) || 1;
    if (!el.parentElement.classList.contains('tilt-scene')) {
      el.parentElement.classList.add('tilt-scene');
    }
    return {
      rx: gsap.quickTo(el, 'rotationX', { duration: 1.2, ease: 'power2.out' }),
      ry: gsap.quickTo(el, 'rotationY', { duration: 1.2, ease: 'power2.out' }),
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power2.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power2.out' }),
      depth,
    };
  });

  if (scenes.length) {
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      scenes.forEach((s) => {
        s.ry(nx * 5 * s.depth);
        s.rx(-ny * 4 * s.depth);
        s.x(nx * 22 * s.depth);
        s.y(ny * 14 * s.depth);
      });
    }, { passive: true });
  }

  // --- magnetic buttons ---
  document.querySelectorAll('.btn').forEach((btn) => {
    const bx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * 0.3);
      by((e.clientY - r.top - r.height / 2) * 0.4);
    });
    btn.addEventListener('pointerleave', () => { bx(0); by(0); });
  });
}
