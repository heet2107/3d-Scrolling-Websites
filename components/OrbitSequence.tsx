"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mediaUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

/**
 * Apple-style scroll-driven image sequence (Creative Developer Playbook §2):
 * 120 cinematic orbit frames scrubbed by scroll on a pinned fullscreen canvas.
 */
const FRAME_COUNT = 120;
const framePath = (i: number) =>
  mediaUrl(`/frames/orbit_${String(i + 1).padStart(4, "0")}.jpg`);

const CAPTIONS = [
  { at: 0.06, title: "The Builder", body: "AI systems, agents, and full-stack products — engineered end to end." },
  { at: 0.45, title: "Production First", body: "RAG pipelines, MCP servers, and guardrails that hold up under real traffic." },
  { at: 0.82, title: "Ship It", body: "From prompt architecture to CI/CD — ideas become deployed products." },
];

export default function OrbitSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const state = { frame: 0 };
    let disposed = false;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      render();
    };

    const currentImage = () => {
      const want = Math.round(state.frame);
      if (frames[want]) return frames[want];
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (frames[want - d]) return frames[want - d];
        if (frames[want + d]) return frames[want + d];
      }
      return null;
    };

    const render = () => {
      const img = currentImage();
      if (!img) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx2d.clearRect(0, 0, cw, ch);
      ctx2d.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    // staggered preload: first/last/middle frames first, then fill in
    const order: number[] = [];
    for (let step = FRAME_COUNT; step >= 1; step = Math.floor(step / 2)) {
      for (let i = 0; i < FRAME_COUNT; i += step) {
        if (!order.includes(i)) order.push(i);
      }
      if (step === 1) break;
    }
    order.forEach((i, k) => {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(i);
      img.onload = () => {
        if (disposed) return;
        frames[i] = img;
        if (k < 8) render();
      };
    });

    const ctx = gsap.context(() => {
      gsap.to(state, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=280%",
          pin: true,
          scrub: 0.4,
        },
        onUpdate: render,
      });

      gsap.utils.toArray<HTMLElement>(".orbit-caption").forEach((el, i) => {
        const { at } = CAPTIONS[i];
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: `top+=${at * 280 - 10}% top`,
              end: `top+=${at * 280 + 12}% top`,
              scrub: true,
            },
          }
        );
        gsap.to(el, {
          opacity: 0,
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: `top+=${at * 280 + 45}% top`,
            end: `top+=${at * 280 + 65}% top`,
            scrub: true,
          },
        });
      });
    }, root);

    size();
    window.addEventListener("resize", size);
    return () => {
      disposed = true;
      window.removeEventListener("resize", size);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative h-[100svh] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-label="Cinematic orbit sequence of Heet Barot in a studio with green fog"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink/70" />

      {CAPTIONS.map((c) => (
        <div
          key={c.title}
          className="orbit-caption pointer-events-none absolute inset-x-0 bottom-[16%] px-6 text-center opacity-0 md:px-12"
        >
          <h3 className="font-display text-4xl font-light tracking-tightest text-fog md:text-6xl">
            {c.title}
          </h3>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fog/70">
            {c.body}
          </p>
        </div>
      ))}

      <div className="pointer-events-none absolute left-6 top-8 font-mono text-[11px] uppercase tracking-wider2 text-moss md:left-12">
        <span className="mr-4 inline-block h-px w-12 translate-y-[-3px] bg-line" />
        Scroll Story
      </div>
    </section>
  );
}
