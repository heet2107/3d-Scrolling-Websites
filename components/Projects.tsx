"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

export default function Projects() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".proj-card").forEach((card) => {
        const img = card.querySelector(".proj-img");
        gsap.fromTo(
          card,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
          }
        );
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.12 },
            {
              yPercent: 8,
              scale: 1.12,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="work" className="relative px-6 py-28 md:px-12 md:py-40">
      <div className="mb-14 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider2 text-moss">
        <span className="h-px w-12 bg-line" />
        02 / Selected Work
      </div>

      <h2 className="mb-20 font-display text-5xl font-light tracking-tightest text-fog md:text-7xl">
        Things I&apos;ve <span className="text-outline">shipped</span>
      </h2>

      <div className="grid gap-x-8 gap-y-24 md:grid-cols-2">
        {projects.map((p, i) => {
          const CardInner = (
            <>
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-line bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(p.image)}
                  alt={p.title}
                  loading="lazy"
                  className="proj-img h-full w-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-wider2 text-fog/70">
                  {String(i + 1).padStart(2, "0")} — {p.year}
                </span>
              </div>

              <div className="mt-6 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-3xl font-light text-fog transition-colors duration-300 group-hover:text-ember">
                  {p.title}
                  {p.link && (
                    <span className="ml-3 inline-block text-base text-moss transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ember">
                      ↗
                    </span>
                  )}
                </h3>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider2 text-ember">
                  {p.metric}
                </span>
              </div>

              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider2 text-moss">
                {p.category}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-fog/75">
                {p.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-moss"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          );

          return p.link ? (
            <a
              key={p.slug}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`proj-card group block ${i % 2 === 1 ? "md:mt-24" : ""}`}
            >
              {CardInner}
            </a>
          ) : (
            <div
              key={p.slug}
              className={`proj-card group ${i % 2 === 1 ? "md:mt-24" : ""}`}
            >
              {CardInner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
