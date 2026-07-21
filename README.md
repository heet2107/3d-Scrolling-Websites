# Rathang Rajpal — Cinematic 3D-Scroll Portfolio

An award-style, scroll-driven personal portfolio in the spirit of Awwwards Site-of-the-Year work:
huge condensed display typography, cinematic scroll sequences, and a central "3D element" — Rathang
himself, captured as an AI-generated camera orbit that scrubs with scroll.

## Highlights

- **Hero orbit scrub** — a Seedance 2.0 (Higgsfield) generated 360° camera orbit around Rathang,
  exported as a JPEG frame sequence and scrubbed frame-by-frame on a `<canvas>` while the hero is
  pinned (~3.5 viewport-heights of scroll).
- **Kinetic typography** — "RATHANG RAJPAL" tracks in letter-by-letter on load, then the letters
  spread and drift with scroll.
- **Animated stats strip** — count-up numbers (years shipping, records/day, microservices, AI agent
  workflows, hackathon wins) triggered on scroll.
- **Three pillars** — pinned section over "The Builder" clip; offers reveal one at a time.
- **Selected work** — cards with hover tilt + glow over "The Closer" clip.
- **Finale CTA** — email + LinkedIn, with full social footer.
- Ink-black background, emerald accent, cream type (Anton + Space Grotesk), film grain,
  Lenis smooth scroll, GSAP ScrollTrigger choreography. Reduced-motion fallback included.

## Run locally

No build step — plain HTML/CSS/JS with vendored libraries.

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Structure

```
index.html        markup
styles.css        design system + sections
main.js           Lenis + GSAP choreography, canvas frame scrub, preloader
assets/frames/    hero orbit JPEG frame sequence (canvas scrub)
assets/video/     builder.mp4 / closer.mp4 background loops
assets/img/       video posters
assets/fonts/     Anton + Space Grotesk (woff2, self-hosted)
assets/vendor/    gsap.min.js, ScrollTrigger.min.js, lenis.min.js
```

## Credits

- Video clips generated with **Seedance 2.0** via the **Higgsfield** MCP, using Rathang's headshot
  as an identity reference (std mode, 16:9, no audio).
- Type: [Anton](https://fonts.google.com/specimen/Anton) &
  [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (OFL).
- Motion: [GSAP + ScrollTrigger](https://gsap.com), [Lenis](https://lenis.darkroom.engineering/).
