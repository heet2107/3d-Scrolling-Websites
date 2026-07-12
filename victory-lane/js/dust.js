/* Gold dust cursor — site-wide ambient particle drift.
   GSAP Physics2D moves each mote; a single gsap.ticker pass paints them all
   onto one fixed canvas (transform/alpha only, no DOM churn). */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap || !window.Physics2DPlugin) return;
  gsap.registerPlugin(Physics2DPlugin);

  const c = document.createElement('canvas');
  Object.assign(c.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 80, mixBlendMode: 'screen',
  });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fit = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
  fit();
  addEventListener('resize', fit);

  const COLORS = ['#d4af37', '#f5e3ae', '#b8860b', '#fff2c6'];
  const parts = new Set();
  const MAX = 140;
  let lastX = -1, lastY = -1;

  const spawn = (x, y, vx, vy) => {
    if (parts.size >= MAX) return;
    const z = 0.35 + Math.random() * 1.25; // depth: size, speed, brightness
    const p = {
      x: x * dpr, y: y * dpr, z,
      r: (0.7 + Math.random() * 1.7) * z * dpr,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      alpha: 0,
      tw: Math.random() * 6.28,
    };
    parts.add(p);
    const speed = Math.min(Math.hypot(vx, vy), 42);
    gsap.to(p, { alpha: Math.min(1, 0.55 + 0.45 * z), duration: 0.12, ease: 'none' });
    gsap.to(p, {
      duration: 1.2 + Math.random() * 1.5,
      ease: 'none',
      physics2D: {
        velocity: (18 + speed * 4 + Math.random() * 60) * z * dpr * 0.5,
        angle: Math.atan2(vy, vx) * 57.2958 + gsap.utils.random(-50, 50),
        gravity: -22 * z * dpr, // dust floats gently upward
        friction: 0.08,
      },
    });
    gsap.to(p, {
      alpha: 0, duration: 0.9, delay: 0.4 + Math.random() * 1.1, ease: 'power1.in',
      onComplete: () => parts.delete(p),
    });
  };

  addEventListener('pointermove', e => {
    if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
    const vx = e.clientX - lastX, vy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const n = Math.min(1 + ((Math.hypot(vx, vy) / 7) | 0), 4);
    for (let i = 0; i < n; i++) {
      spawn(e.clientX + gsap.utils.random(-7, 7), e.clientY + gsap.utils.random(-7, 7), vx, vy);
    }
  }, { passive: true });

  gsap.ticker.add(() => {
    ctx.clearRect(0, 0, c.width, c.height);
    if (!parts.size) return;
    const t = performance.now() / 1000;
    for (const p of parts) {
      const twinkle = 0.65 + 0.35 * Math.sin(t * 7 + p.tw);
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5 * p.z * dpr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });

  window.__VL_DUST = { get count() { return parts.size; } };
})();
