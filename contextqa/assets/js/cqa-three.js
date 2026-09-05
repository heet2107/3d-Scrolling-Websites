/* ==========================================================================
   ContextQA — Three.js layers.
   1. A floating particle field over the hero (additive bokeh, sine drift,
      pointer parallax) that sits between the film and the copy.
   2. A live six ring gyroscope in the engine section. The rings rotate
      with scroll and the ring for the active stage lights up.

   Both renderers only draw while their section is on screen, cap the
   device pixel ratio, and dispose their GPU resources on page hide.
   Loaded as a module; if WebGL or the import fails the page simply keeps
   its static fallbacks.
   ========================================================================== */
import * as THREE from '/assets/js/vendor/three.module.min.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = window.matchMedia('(max-width: 900px)').matches;
const CYAN = new THREE.Color('#3DDCFF');
const VIOLET = new THREE.Color('#8B5CF6');
const MAGENTA = new THREE.Color('#C084FC');
const WHITE = new THREE.Color('#EAF0F8');
const LIGHT_CYAN = new THREE.Color('#0891B2');
const LIGHT_HI = new THREE.Color('#22D3EE');
const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !MOBILE, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  r.setClearColor(0x000000, 0);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

/* Soft radial sprite for the particles, generated once. */
function spriteTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Elapsed and delta seconds from performance.now (the Three.js clock class is deprecated in r185). */
function makeTimer() {
  const start = performance.now();
  let last = start;
  return {
    elapsed() { return (performance.now() - start) / 1000; },
    delta() { const now = performance.now(); const d = (now - last) / 1000; last = now; return d; }
  };
}

/* Pointer as a normalised, eased vector shared by both layers. */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
if (!MOBILE) {
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
}
function easePointer() {
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;
}

/* Only render a layer while its host is visible and the tab is active. */
function visibility(host, onChange) {
  let inView = false, hidden = document.hidden;
  const update = () => onChange(inView && !hidden);
  const io = new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; update(); }, { threshold: 0 });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; update(); });
}

/* ---------- 1. Hero particle field ------------------------------------ */
function initParticles() {
  const canvas = document.getElementById('fx');
  const host = document.querySelector('.hero__stage');
  if (!canvas || !host) return;

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const COUNT = MOBILE ? 160 : 420;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);
  const size = new Float32Array(COUNT);
  const tmp = new THREE.Color();

  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    // Mostly cyan and white, a few violet strays from the incoming stream.
    const r = Math.random();
    tmp.copy(r < 0.55 ? CYAN : r < 0.85 ? WHITE : r < 0.95 ? VIOLET : MAGENTA);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    phase[i] = Math.random() * Math.PI * 2;
    speed[i] = 0.3 + Math.random() * 0.7;
    size[i] = 6 + Math.random() * 22;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uTex: { value: spriteTexture() }, uPixelRatio: { value: renderer.getPixelRatio() }, uFade: { value: 1 } },
    vertexShader: `
      attribute float aPhase; attribute float aSpeed; attribute float aSize;
      uniform float uTime; uniform float uPixelRatio;
      varying vec3 vColor; varying float vTwinkle;
      void main() {
        vColor = color;
        vec3 p = position;
        p.y += sin(uTime * aSpeed + aPhase) * 0.35;
        p.x += cos(uTime * aSpeed * 0.6 + aPhase) * 0.25;
        vTwinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSpeed) + aPhase * 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uPixelRatio * (10.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uFade;
      varying vec3 vColor; varying float vTwinkle;
      void main() {
        float a = texture2D(uTex, gl_PointCoord).a;
        gl_FragColor = vec4(vColor, a * vTwinkle * 0.55 * uFade);
      }`,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  let active = false, raf = 0;
  const clock = makeTimer();
  const loop = () => {
    if (!active) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    easePointer();
    const t = clock.elapsed();
    mat.uniforms.uTime.value = t;
    // The field thins out as the film resolves into order.
    const p = window.__cqaHero ? window.__cqaHero.progress() : 0;
    mat.uniforms.uFade.value = 1 - p * 0.7;
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.06;
    camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.06;
    camera.lookAt(0, 0, 0);
    points.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  };
  visibility(host, (on) => { active = on; if (on && !raf) loop(); });
  document.addEventListener('pagehide', () => { active = false; geo.dispose(); mat.dispose(); renderer.dispose(); });
}

/* ---------- 2. Engine gyroscope ---------------------------------------- */
function initGyro() {
  const canvas = document.getElementById('gyro');
  const host = canvas && canvas.parentElement;
  if (!canvas || !host) return;

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.2, 7.4);

  const ambient = new THREE.AmbientLight(0x3a4658, 2.2);
  const hemi = new THREE.HemisphereLight(0x3ddcff, 0x8b5cf6, 0.9);
  scene.add(ambient, hemi);
  const keyLight = new THREE.PointLight(CYAN.getHex(), 260, 20);
  keyLight.position.set(3, 3, 4);
  const fillLight = new THREE.PointLight(VIOLET.getHex(), 160, 20);
  fillLight.position.set(-4, -2, 3);
  scene.add(keyLight, fillLight);

  const rig = new THREE.Group();
  scene.add(rig);

  const RINGS = 6;
  const rings = [];
  const seg = MOBILE ? 96 : 160;
  for (let i = 0; i < RINGS; i++) {
    const radius = 1.7 - i * 0.22;
    const g = new THREE.Group();
    // Base tilt gives the armillary look; each ring spins on its own axis.
    g.rotation.x = (i * 0.55) % Math.PI;
    g.rotation.y = (i * 0.9) % Math.PI;

    const body = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.055, 12, seg),
      new THREE.MeshStandardMaterial({ color: 0x1b2330, metalness: 0.55, roughness: 0.42, emissive: 0x06101a })
    );
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.026, 8, seg),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    g.add(body, glow);
    rig.add(g);
    rings.push({ group: g, glow, body, speed: 0.12 + i * 0.05, dir: i % 2 ? 1 : -1 });
  }

  // Core: a small sphere plus a soft additive sprite.
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTexture(), color: CYAN, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(1.6, 1.6, 1);
  rig.add(core, halo);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);
  host.classList.add('is-webgl');

  // Additive glow reads as light on a dark ground and vanishes on a pale one,
  // so the light theme swaps to normal blending and deeper teals.
  let glowBase = CYAN, glowHi = WHITE;
  const applyTheme = () => {
    const light = isLight();
    glowBase = light ? LIGHT_CYAN : CYAN;
    glowHi = light ? LIGHT_HI : WHITE;
    rings.forEach((r) => {
      r.glow.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      r.glow.material.needsUpdate = true;
      r.body.material.color.set(light ? 0x2a3547 : 0x1b2330);
      r.body.material.emissive.set(light ? 0x0b1a24 : 0x06101a);
    });
    core.material.color.set(light ? 0x0e7490 : 0xffffff);
    halo.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    halo.material.color.copy(light ? LIGHT_CYAN : CYAN);
    halo.material.opacity = light ? 0.5 : 0.9;
    halo.material.needsUpdate = true;
    ambient.intensity = light ? 3.4 : 2.2;
    hemi.color.set(light ? 0xffffff : 0x3ddcff);
  };
  applyTheme();
  document.addEventListener('cqa:theme', applyTheme);

  let stage = 0, progress = 0, targetYaw = 0;
  window.__cqaGyro = {
    setStage(i, p) { stage = i; progress = p; targetYaw = p * Math.PI * 1.5; }
  };

  let active = false, raf = 0;
  const clock = makeTimer();
  const loop = () => {
    if (!active) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    easePointer();
    const dt = Math.min(clock.delta(), 0.05);
    const t = clock.elapsed();

    rig.rotation.y += (targetYaw + pointer.x * 0.35 - rig.rotation.y) * 0.05;
    rig.rotation.x += (pointer.y * -0.25 + 0.15 - rig.rotation.x) * 0.05;

    rings.forEach((r, i) => {
      r.group.rotation.z += r.speed * r.dir * dt;
      // Active ring: bright and steady. Completed rings: lit. Upcoming: dim.
      const state = i < stage ? 0.6 : i === stage ? 1 : 0.28;
      const pulse = i === stage ? 0.85 + 0.15 * Math.sin(t * 3) : 1;
      r.glow.material.opacity += (state * pulse - r.glow.material.opacity) * 0.08;
      r.glow.material.color.lerpColors(glowBase, glowHi, i === stage ? 0.35 : 0);
    });
    const glowScale = 1.3 + 0.5 * Math.min(1, progress) + 0.08 * Math.sin(t * 2.2);
    halo.scale.set(glowScale, glowScale, 1);
    keyLight.intensity = 240 + 60 * Math.sin(t * 0.8);

    renderer.render(scene, camera);
  };
  visibility(host, (on) => { active = on; if (on && !raf) loop(); });
  document.addEventListener('pagehide', () => {
    active = false;
    rings.forEach((r) => { r.body.geometry.dispose(); r.body.material.dispose(); r.glow.geometry.dispose(); r.glow.material.dispose(); });
    renderer.dispose();
  });
}

if (!REDUCED && webglOK()) {
  const start = () => { try { initParticles(); } catch (e) {} try { initGyro(); } catch (e) {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
