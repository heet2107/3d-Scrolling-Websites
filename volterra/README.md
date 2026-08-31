# VOLTERRA — luxury interior studio

A scroll-driven film for a fictional interior studio. One continuous timeline, nine
chapters, no pages. Eight cinematic clips scrub under the scroll while a Three.js layer
floats above them.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serves dist/ with HTTP Range, which the scrub needs
```

> **Range requests are required.** Python's `http.server` ignores the `Range` header,
> which breaks seeking — every film would sit frozen on frame one. `vite preview`,
> `http-server`, `serve`, nginx and Vercel all handle it.

## Stack

React + Vite · Tailwind · GSAP + ScrollTrigger · Lenis · Three.js + React Three Fiber ·
Framer Motion (one interaction) · react-icons · GLSL.

## The timeline

| # | Chapter | Film | What the scroll drives |
| --- | --- | --- | --- |
| 01 | Overture | Marble lounge chair | Chair turns, comes apart, reassembles. Headline rises and blurs out |
| 02 | Living Room | Travertine coffee table | Camera pushes in, grade warms, copy arrives line by line |
| 03 | Light | Pendant descends | The one near-black chapter — resets the eye before the kitchen |
| 04 | Kitchen | Marble island | Island floats on a long shadow, heading wipes in from the left |
| 05 | Bedroom | Bed assembly | Curtains draw back; type waits until the bed is whole |
| 06 | Materials | Material cube | Cube turns through six finishes; the matching row lights up |
| 07 | Blueprint | Blueprint → villa | Survey grid draws on, datum marks, the drawing stands up |
| 08 | The Villa | Furniture constellation | Everything assembles. Three beats of type, then the CTA |
| 09 | Contact | — | The page finally lets go: no track, no film, back to bone |

Chapters are declared in `src/lib/constants.js` and each one names its clip in
`src/lib/media.js`. Nothing references a video path directly.

## How the scrub works

The three things that make `video.currentTime` behave under a scroll wheel, all in
`src/hooks/useScrollFilm.js`:

1. **Never write the scroll value straight to the video.** A wheel notch is a step, not
   a ramp. GSAP tweens a proxy number with `scrub`, giving it momentum and a
   decelerating tail, and the video reads the proxy. This is most of why the scrub feels
   expensive rather than mechanical.
2. **Drop seeks instead of queueing them.** Assigning `currentTime` while the decoder is
   still seeking stacks requests until it stalls. The write is skipped while
   `video.seeking` is true; the proxy keeps moving and the next tick lands on a newer,
   more correct time.
3. **Encode all-intra.** `build/encode-films.sh` passes `-g 1`, so every frame is a
   keyframe and a seek resolves on the frame itself instead of decoding forward from a
   distant one. It roughly triples the bitrate. Without it, neither of the above is
   enough.

Chapters are pinned with `position: sticky`, not ScrollTrigger's `pin`. Sticky is
composited by the browser, needs no pin-spacer and no re-measure on refresh, which is
what holds 60fps across nine stacked stages.

Lenis, GSAP and ScrollTrigger are wired to a single rAF in `useSmoothScroll.js`. Left
alone they run on three separate loops and the film ends up a frame behind the type.

## Films

Generated with Higgsfield (Seedance 2.5, 1080p, 16:9, silent, 8s), then re-encoded:

```bash
./build/encode-films.sh <dir-of-source-mp4s>
```

Each clip ships four ways, because the two constraints do not overlap:

| File | Codec | Why |
| --- | --- | --- |
| `<name>.mp4` | H.264 1280×720 | The desktop source. The only codec Safari can be relied on for |
| `<name>-sm.mp4` | H.264 854×480 | Served under 860px |
| `<name>.webm` | VP9 1280×720 | Chromium built without proprietary codecs reports `canPlayType('…avc1…')` as `""` and fails an mp4 with `DEMUXER_ERROR_NO_SUPPORTED_STREAMS`. That includes the Linux distribution builds and the Chromium Playwright ships, so this site cannot be tested without it |
| `<name>.jpg` | — | Poster, and the still shown under reduced motion |

`preferredCodec()` in `src/lib/media.js` picks once per session. WebM is 720p only —
the engines that need it are desktop builds, and a second small rendition would add
~8 MB to serve a narrow window on a Linux desktop.

Films are attached one viewport ahead of their chapter (`useLazyFilm`); only the hero is
eager.

## The floating layer

One fixed canvas above the films and below the type, `pointer-events: none`, lazily
imported after the curtain lifts so 800 kB of WebGL never touches the critical path.

- `MarbleSphere` — Calacatta generated in the fragment shader: fbm veining, domain-warped
- `BrassRing`, `MaterialCube` — PBR against a procedural studio
- `GlassPanes` — fresnel-only, so a pane reads as an edge catching light rather than the
  frosted panel the brief rules out
- `WireVilla` — massing model as merged `EdgesGeometry`, one draw call
- `Motes` — one `Points` draw; each mote's drift is computed in the vertex shader

`StudioEnvironment` builds the reflection map with three's own `PMREMGenerator` — a soft
box and two strips, prefiltered once on the first frame. Brass is almost entirely what it
reflects, and the usual answers are an HDR download or drei's `<Environment>`, which costs
64 kB gzipped to place three rectangles.

Every object moves on the same four inputs (`useFloat.js`): idle drift, a rise tied to its
chapter, a few degrees of pointer lean, and a slight stretch on a fast flick. All of it is
written straight to the object3D, so scrolling re-renders no React.

## Performance

Eager path is ~111 kB gzipped (entry + React + GSAP/Lenis). Three.js (217 kB) loads after
the curtain; Framer Motion (38 kB) only when a phone opens the chapter index.

`manualChunks` matches resolved paths, not bare specifiers — the array form does not
survive Vite's CommonJS interop for React, and React ended up inside the three chunk,
which put the whole WebGL bundle on the critical path.

## Type

**Instrument Serif** stands in for Canela / PP Editorial, **Inter** for Neue Montreal.
The originals are commercial licences; these are the open faces closest in character.
Self-hosted, latin + latin-ext, 460 kB — no CDN. To swap in the real licensed families,
replace the files in `public/assets/fonts/` and the `src` URLs in `volterra-fonts.css`;
the stacks in `tailwind.config.js` already name the originals first.

Measures are set in `rem`, not `ch`. A `ch` on a container resolves against that
container's font-size — body size — so a measure meant for a 90px headline came out as a
180px column.

## Reduced motion

The story stays; the motion goes. Lenis is not started, films are replaced by their poster
frames, the curtain is skipped, the 3D layer never mounts, and the Finale's three beats lay
out as a stacked column instead of sharing one grid cell. Anything hidden by CSS for a
GSAP reveal is only hidden when GSAP is going to run.

## Deployment

Its own Vercel project, root directory `volterra`, framework Vite. Asset URLs are
root-absolute; `vercel.json` sets long cache headers for `/assets/*`.

## Content

Everything is invented. The studio, the address, the phone number (Italy's 0588 range for
Volterra, with a 555 subscriber block) and Villa Sestri are fictional.
