"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { credentials } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger);

export default function Credentials() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cred-col",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 80%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative px-6 py-28 md:px-12 md:py-32">
      <div className="mb-14 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider2 text-moss">
        <span className="h-px w-12 bg-line" />
        05 / Credentials
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <div className="cred-col">
          <h3 className="mb-8 font-display text-2xl font-light text-fog">
            Education
          </h3>
          <div className="space-y-8">
            {credentials.education.map((e) => (
              <div key={e.school} className="border-t border-line pt-6">
                <p className="font-display text-lg text-fog">{e.school}</p>
                <p className="mt-1 text-sm text-moss">{e.degree}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider2 text-moss">
                  {e.place}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="cred-col">
          <h3 className="mb-8 font-display text-2xl font-light text-fog">
            Certifications
          </h3>
          <div className="space-y-4">
            {credentials.certifications.map((c) => (
              <div
                key={c}
                className="flex items-center gap-4 border-t border-line pt-4"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ember/70" />
                <p className="text-sm text-fog/85">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
