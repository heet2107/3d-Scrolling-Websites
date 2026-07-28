"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Preloader() {
  const [done, setDone] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setDone(true),
      });

      tl.to(counter, {
        v: 100,
        duration: 1.6,
        ease: "power2.inOut",
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
          }
        },
      })
        .to(nameRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.9")
        .to(wrapRef.current, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          delay: 0.25,
        });
    });
    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[100] flex items-end justify-between bg-ink p-8 md:p-14"
    >
      <div
        ref={nameRef}
        className="translate-y-4 font-mono text-xs uppercase tracking-wider2 text-moss opacity-0"
      >
        Heet Barot — AI Engineer
        <span className="ml-3 inline-block h-2 w-2 rounded-full bg-ember glow-dot" />
      </div>
      <span
        ref={countRef}
        className="font-display text-7xl font-light tabular-nums text-fog md:text-9xl"
      >
        000
      </span>
    </div>
  );
}
