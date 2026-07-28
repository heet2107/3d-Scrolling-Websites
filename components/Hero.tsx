"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

const CinematicLayer = dynamic(() => import("@/components/CinematicLayer"), {
  ssr: false,
});

gsap.registerPlugin(ScrollTrigger);

const VIDEO_SRC = "/media/hero-talking.mp4";
const POSTER_SRC = "/media/poster.jpg";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const fgRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0 },
        { opacity: 1, duration: 1.6, ease: "power2.out", delay: 2.1 }
      );
      gsap.fromTo(
        ".hero-line",
        { yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12, ease: "power4.out", delay: 2.2 }
      );
      gsap.fromTo(
        ".hero-meta",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, delay: 3 }
      );
      gsap.to(".hero-inner", {
        yPercent: -18,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".hero-video", {
        scale: 1.12,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    const hide = setTimeout(() => setHintVisible(false), 6000);
    return () => {
      ctx.revert();
      clearTimeout(hide);
    };
  }, []);

  const togglePlay = () => {
    const fg = fgRef.current;
    const bg = bgRef.current;
    if (!fg) return;
    if (fg.paused) {
      fg.play();
      bg?.play();
      setPlaying(true);
    } else {
      fg.pause();
      bg?.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.muted = !fg.muted;
    setMuted(fg.muted);
    setHintVisible(false);
  };

  const scrollToNext = () => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={rootRef}
      id="top"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* blurred ambient duplicate (playbook: background ambient layer) */}
      <div className="absolute inset-0">
        <video
          ref={bgRef}
          className="h-full w-full scale-125 object-cover opacity-50 blur-2xl"
          src={mediaUrl(VIDEO_SRC)}
          poster={mediaUrl(POSTER_SRC)}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      </div>

      {/* foreground talking-head video */}
      <div className="absolute inset-0">
        <video
          ref={fgRef}
          className="hero-video hero-fade h-full w-full object-cover opacity-0"
          src={mediaUrl(VIDEO_SRC)}
          poster={mediaUrl(POSTER_SRC)}
          autoPlay
          muted
          loop
          playsInline
          onClick={toggleMute}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/10 to-ink" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-ink/25" />
      </div>

      {/* Three.js cinematic particle layer */}
      <CinematicLayer />

      {/* glassmorphism video controls */}
      <div className="hero-meta absolute right-6 top-20 z-20 flex gap-3 md:right-12 md:top-24">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause video" : "Play video"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-fog backdrop-blur-md transition-all duration-300 hover:border-ember/60 hover:bg-white/20"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-fog backdrop-blur-md transition-all duration-300 hover:border-ember/60 hover:bg-white/20"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* auto-hiding sound hint */}
      <button
        onClick={toggleMute}
        className={`absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-5 py-2 font-mono text-[10px] uppercase tracking-wider2 text-fog backdrop-blur-md transition-all duration-700 hover:border-ember/60 ${
          hintVisible && muted ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
        Tap for sound
      </button>

      <div className="hero-inner relative z-10 px-6 pb-16 md:px-12 md:pb-20">
        <p className="hero-meta mb-6 font-mono text-[11px] uppercase tracking-wider2 text-ember">
          {profile.tagline}
        </p>

        <h1 className="font-display font-medium leading-[0.95] tracking-tightest">
          <span className="block overflow-hidden">
            <span className="hero-line block text-[16vw] md:text-[11vw]">
              {profile.firstName}
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-line block text-[16vw] text-outline md:text-[11vw]">
              {profile.lastName}
            </span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col justify-between gap-6 border-t border-line/70 pt-6 md:flex-row md:items-end">
          <p className="hero-meta max-w-md text-sm leading-relaxed text-fog/80">
            Software Engineer specializing in LLM integration, RAG pipelines,
            MCP servers, and full-stack product engineering with React,
            TypeScript, Node.js, and Python.
          </p>
          <div className="hero-meta flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider2">
            <a
              href="#work"
              className="border border-line bg-ink/40 px-5 py-3 text-fog backdrop-blur-sm transition-colors duration-300 hover:border-ember hover:text-ember"
            >
              View Work ↓
            </a>
          </div>
        </div>
      </div>

      {/* animated scroll indicator */}
      <button
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        className="hero-meta absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <span className="block h-12 w-px overflow-hidden bg-white/15">
          <span className="block h-4 w-px animate-[scroll-pulse_1.8s_ease-in-out_infinite] bg-ember" />
        </span>
      </button>
    </section>
  );
}
