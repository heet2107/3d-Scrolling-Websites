"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".contact-line",
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer
      ref={rootRef}
      id="contact"
      className="relative flex min-h-[90svh] flex-col justify-between px-6 pb-10 pt-32 md:px-12"
    >
      <div>
        <p className="mb-8 font-mono text-[11px] uppercase tracking-wider2 text-moss">
          06 / Contact — open to AI engineering & full-stack roles
        </p>
        <a href={`mailto:${profile.email}`} className="group block">
          <h2 className="font-display font-light leading-[1.02] tracking-tightest">
            <span className="block overflow-hidden">
              <span className="contact-line block text-[9vw] text-fog md:text-[7vw]">
                Let&apos;s build
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="contact-line block text-[9vw] text-outline transition-colors duration-500 group-hover:text-ember md:text-[7vw]">
                something →
              </span>
            </span>
          </h2>
        </a>

        <div className="mt-14 flex flex-col gap-3 font-mono text-xs uppercase tracking-wider2 text-moss md:flex-row md:gap-10">
          <a
            href={`mailto:${profile.email}`}
            className="transition-colors hover:text-ember"
          >
            {profile.email}
          </a>
          <span>{profile.phone}</span>
          <span>{profile.location}</span>
        </div>

        <div className="mt-6 flex gap-8 font-mono text-xs uppercase tracking-wider2">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fog transition-colors hover:text-ember"
          >
            GitHub ↗
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fog transition-colors hover:text-ember"
          >
            LinkedIn ↗
          </a>
        </div>
      </div>

      <div className="mt-24 flex flex-col justify-between gap-4 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-wider2 text-moss md:flex-row">
        <span>© {year} {profile.name}</span>
        <span>Building AI systems that ship</span>
        <a href="#top" className="transition-colors hover:text-ember">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
