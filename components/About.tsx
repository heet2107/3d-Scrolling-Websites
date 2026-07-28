"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function About({
  hasPortrait: portraitOnDisk = false,
  portraitSrc = "/media/headshot.jpg",
}: {
  hasPortrait?: boolean;
  portraitSrc?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [hasPortrait, setHasPortrait] = useState(portraitOnDisk);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // word-by-word reveal of the statement
      gsap.fromTo(
        ".about-word",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-statement",
            start: "top 75%",
            end: "bottom 45%",
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        ".about-portrait",
        { clipPath: "inset(100% 0 0 0)", scale: 1.15 },
        {
          clipPath: "inset(0% 0 0 0)",
          scale: 1,
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".about-portrait",
            start: "top 80%",
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const words = profile.summary.split(" ");

  return (
    <section ref={rootRef} id="about" className="relative px-6 py-28 md:px-12 md:py-40">
      <div className="mb-14 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider2 text-moss">
        <span className="h-px w-12 bg-line" />
        01 / About
      </div>

      <div className="grid gap-16 md:grid-cols-[1.6fr_1fr]">
        <p className="about-statement max-w-4xl font-display text-2xl font-light leading-snug text-fog md:text-4xl">
          {words.map((w, i) => (
            <span key={i} className="about-word">
              {w}{" "}
            </span>
          ))}
        </p>

        <div className="relative">
          {hasPortrait ? (
            <div className="about-portrait relative aspect-[4/5] overflow-hidden rounded-sm border border-line">
              {/* Drop your headshot at public/media/headshot.jpg */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portraitSrc}
                alt="Heet Barot — Software Engineer specializing in AI/ML systems"
                className="h-full w-full object-cover"
                onError={() => setHasPortrait(false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-wider2 text-fog/80">
                {profile.name} · {profile.location}
              </div>
            </div>
          ) : (
            <div className="about-portrait relative flex aspect-[4/5] items-end overflow-hidden rounded-sm border border-line bg-panel p-6">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-ember/10 blur-3xl" />
              <div>
                <span className="font-display text-7xl font-light text-outline">
                  HB
                </span>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wider2 text-moss">
                  {profile.name} · {profile.location}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[
          ["500+", "test scenarios daily via autonomous agents"],
          ["99.7%", "malicious inputs blocked by AI guardrails"],
          ["40%", "QA workflow efficiency gained with hybrid RAG"],
          ["4hrs", "release cycles — down from 3 days"],
        ].map(([num, label]) => (
          <div key={label} className="bg-ink p-6 md:p-8">
            <div className="font-display text-4xl font-light text-ember md:text-5xl">
              {num}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-moss">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
