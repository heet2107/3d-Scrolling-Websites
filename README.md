# HEET BAROT — Cinematic 3D-Scroll Portfolio

An award-style, scroll-driven personal portfolio in the spirit of Awwwards Site-of-the-Year
cinematics: a central "3D" element (Heet, shot by an orbiting AI camera) scrubbed
frame-by-frame as you scroll, huge condensed display type, kinetic text, counting stats,
and scene-backed content sections.

**Stack:** vanilla HTML/CSS/JS · GSAP ScrollTrigger · Lenis smooth scroll · canvas frame
sequence. Zero build step, zero runtime dependencies — everything is vendored in
`assets/js` and `assets/fonts`.

## Run it

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Any static file server works.

## How the hero scrub works

The 8-second, 360° "hero orbit" clip (Seedance 2.0 on Higgsfield, 1080p) is pre-extracted
into 120 JPEG frames (`assets/frames/orbit_0001..0120.jpg`). A pinned 500vh hero section
maps scroll progress → frame index (GSAP ScrollTrigger, `scrub: 0.4`) and draws onto a
full-screen `<canvas>` with cover-fit and devicePixelRatio awareness. Frames preload
behind a percentage loader; missing frames fall back to the nearest loaded neighbour.

The Pillars and Work sections sit over the two other generated clips
(`assets/video/builder.mp4`, `assets/video/closer.mp4`), played muted/looped and paused
whenever off-screen.

## Regenerating the visuals

The three source clips were generated on Higgsfield (Seedance 2.0, std mode, 1080p, 16:9,
8s, no audio) with the same identity-reference photo passed to every generation:

1. **Hero orbit** — slow 360° orbit, black-void studio, emerald rim light
2. **The builder** — dark desk, floating holographic screens, slow push-in
3. **The closer** — walk toward camera down a gallery of glowing screens, hero pose

To rebuild all derived assets from new source clips:

```bash
tools/build_assets.sh orbit.mp4 builder.mp4 closer.mp4
```

Requires `ffmpeg` (or `pip install imageio-ffmpeg`).
