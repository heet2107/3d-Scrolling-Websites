"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Floating cinematic particle/bokeh layer (Creative Developer Playbook §Phase 3.2):
 * soft glowing particles, additive blending, sine-wave drift, mouse parallax.
 * Palette follows the site's emerald + warm-white grade.
 */
export default function CinematicLayer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // soft round sprite texture drawn on a canvas (no external asset)
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteCanvas.height = 64;
    const sctx = spriteCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.4)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    const COUNT = 90;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const emerald = new THREE.Color("#34d399");
    const warm = new THREE.Color("#fef3c7");
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.2 + Math.random() * 0.6; // speed
      seeds[i * 3 + 2] = 0.3 + Math.random() * 0.9; // amplitude
      const c = Math.random() < 0.55 ? emerald : warm;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.55,
      map: spriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const base = positions.slice();
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const pos = geo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        const phase = seeds[i * 3];
        const speed = seeds[i * 3 + 1];
        const amp = seeds[i * 3 + 2];
        pos.array[i * 3] = base[i * 3] + Math.sin(t * speed + phase) * amp;
        pos.array[i * 3 + 1] =
          base[i * 3 + 1] + Math.cos(t * speed * 0.8 + phase) * amp * 0.6;
      }
      pos.needsUpdate = true;
      // mouse parallax, eased
      camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      spriteTex.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
    />
  );
}
