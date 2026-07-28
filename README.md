# Heet Barot — Cinematic Portfolio

A cinematic scrolling portfolio for Heet Barot — AI/ML Software Engineer.
Inspired by [vaibhav-create.vercel.app](https://vaibhav-create.vercel.app/), rebuilt
from scratch around Heet's resume, live projects, and a dark emerald visual language.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **GSAP + ScrollTrigger** — scroll-driven cinematic animations
- **Lenis** — smooth inertial scrolling
- **Tailwind CSS** — design system (ink / fog / ember palette)
- **Higgsfield AI** — generated hero video loop & project artwork

## Sections

Preloader → Hero (video loop) → About (scroll-reveal statement + stats) →
Selected Work (7 real projects) → Experience → Capabilities (marquee + grid) →
Credentials → Contact

## Develop

```bash
npm install
npm run dev
```

## Swap in the real headshot

Drop your photo at `public/media/headshot.jpg` — the About section picks it up
automatically (it falls back to an HB monogram card if the file is missing).
