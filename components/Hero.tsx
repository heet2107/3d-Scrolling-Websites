"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "power4.out",
          delay: 2.2,
        }
      );
      gsap.fromTo(
        ".hero-meta",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, delay: 3 }
      );

      // cinematic parallax exit
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
        scale: 1.15,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      className="relative flex h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* background video */}
      <div className="absolute inset-0">
        <video
          className="hero-video h-full w-full object-cover opacity-60"
          src="/media/hero-loop.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink" />
      </div>

      <div className="hero-inner relative z-10 px-6 pb-14 md:px-12 md:pb-20">
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

        <div className="mt-10 flex flex-col justify-between gap-6 border-t border-line pt-6 md:flex-row md:items-end">
          <p className="hero-meta max-w-md text-sm leading-relaxed text-moss">
            {profile.statement}
          </p>
          <div className="hero-meta flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider2">
            <a
              href="#work"
              className="border border-line px-5 py-3 text-fog transition-colors duration-300 hover:border-ember hover:text-ember"
            >
              View Work ↓
            </a>
            <span className="text-moss">Scroll</span>
          </div>
        </div>
      </div>
    </section>
  );
}
