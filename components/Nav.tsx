"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";

const links = [
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Chicago",
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <a
          href="#top"
          className="font-display text-sm font-semibold uppercase tracking-wider2 text-fog"
        >
          HB<span className="text-ember">.</span>
        </a>

        <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-wider2 text-fog md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition-opacity duration-300 hover:opacity-50"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="font-mono text-[11px] uppercase tracking-wider2 text-fog">
          <span className="hidden sm:inline">{profile.location} · </span>
          <span suppressHydrationWarning>{time}</span>
        </div>
      </nav>
    </header>
  );
}
