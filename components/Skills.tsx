"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { skills } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Skills() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".skill-group").forEach((g) => {
        gsap.fromTo(
          g,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: g, start: "top 85%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="skills" className="relative py-28 md:py-40">
      <div className="mb-14 flex items-center gap-4 px-6 font-mono text-[11px] uppercase tracking-wider2 text-moss md:px-12">
        <span className="h-px w-12 bg-line" />
        04 / Capabilities
      </div>

      {/* marquee strips */}
      <div className="mb-20 space-y-3 overflow-hidden">
        {skills.slice(0, 2).map((row, ri) => (
          <div key={row.label} className="flex overflow-hidden whitespace-nowrap">
            <div
              className={`marquee-track flex shrink-0 items-center ${ri % 2 ? "marquee-reverse" : ""}`}
              style={{ "--marquee-speed": `${34 + ri * 10}s` } as React.CSSProperties}
            >
              {[...row.items, ...row.items].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="mx-6 font-display text-4xl font-light text-fog/20 md:text-6xl"
                >
                  {item}
                  <span className="ml-12 text-ember/40">·</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-px border-y border-line bg-line px-0 md:grid-cols-4">
        {skills.map((g) => (
          <div key={g.label} className="skill-group bg-ink p-6 md:p-8">
            <h3 className="mb-6 font-mono text-[11px] uppercase tracking-wider2 text-ember">
              {g.label}
            </h3>
            <ul className="space-y-2.5">
              {g.items.map((item) => (
                <li key={item} className="text-sm text-fog/75">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
