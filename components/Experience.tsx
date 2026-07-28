"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".xp-row").forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 82%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="experience"
      className="relative px-6 py-28 md:px-12 md:py-40"
    >
      <div className="mb-14 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider2 text-moss">
        <span className="h-px w-12 bg-line" />
        03 / Experience
      </div>

      <h2 className="mb-20 font-display text-5xl font-light tracking-tightest text-fog md:text-7xl">
        Where I&apos;ve <span className="text-outline">built</span>
      </h2>

      <div className="space-y-24">
        {experience.map((xp) => (
          <article key={xp.company} className="xp-row group grid gap-8 border-t border-line pt-10 md:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="font-display text-3xl font-light text-fog transition-colors duration-300 group-hover:text-ember md:text-4xl">
                {xp.company}
              </h3>
              <p className="mt-2 text-sm text-moss">{xp.role}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider2 text-moss">
                {xp.period} · {xp.location}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {xp.stack.map((s) => (
                  <span
                    key={s}
                    className="border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-moss"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <ul className="space-y-5">
              {xp.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex gap-4 text-sm leading-relaxed text-fog/85"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember/70" />
                  {h}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
