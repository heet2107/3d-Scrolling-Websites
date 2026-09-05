# FORGE — strength gym, Detroit

A single-page cinematic site for **FORGE**, a fictional strength gym. Motto: *Earn it.*

Static, dependency-light, no build step. Lives in `forge/` so it sits alongside the
Monga Brothers site at the repository root rather than replacing it.

```bash
# Serve THIS directory as the site root, with a server that supports HTTP Range
npx http-server forge -p 8000
# open http://localhost:8000
```

> **Range requests are required.** Python's `http.server` ignores the `Range` header,
> which breaks seeking — the hero scrub will sit frozen on frame one. Use
> `http-server`, `serve`, nginx, or Vercel. Vercel serves ranges by default.

## Asset paths

`forge/` is its own deployable site root — it has its own `vercel.json` and deploys as
the Vercel project **forge-gym**, so the site is served at `/`, not under a subpath.

Asset URLs in `index.html` and `forge.js` are **root-absolute** (`/assets/...`) rather
than relative. `vercel.json` sets `trailingSlash: false`; relative paths break the moment
a host serves the page at a subpath without a trailing slash, because they then resolve
against `/`. Root-absolute paths hold regardless. The `@font-face` URLs in
`forge-fonts.css` are stylesheet-relative and resolve correctly either way.

Serve this directory as the root — not the repository root. The site is no longer
reachable at `/forge` on the repo's other deployment.

## Caching

Pages revalidate on every load, but their stylesheets and scripts are cached. When those
lag behind the markup, a returning visitor runs new HTML against an old stylesheet, and
the page paints blank sections and unstyled icons. Two things prevent that.

`vercel.json` serves `/assets/css` and `/assets/js` with `max-age=0, must-revalidate`, so
they are checked on every load and cost a 304 rather than a download. Fonts, video and images keep a
year of `immutable` caching, since those never change in place.

Every stylesheet and script URL also carries a short content hash, so a changed file gets
a new URL and any copy already sitting in a browser cache is bypassed at once. **Run this
after touching anything under `assets/css` or `assets/js`, and commit the result:**

```bash
bash build/stamp_assets.sh
```

There is no generator here, so this is the only step.

## Design

Charcoal ground (`#0B0C0D`), bone-white type (`#EDE6DA`), one blood-red accent
(`#C1121C`). Display type is **Anton** — heavy condensed industrial — over
**Barlow Condensed** for UI, **IBM Plex Sans** for body and **IBM Plex Mono** for
labels and numerals. Fonts are self-hosted (latin subsets, woff2, 448 KB) so the
page has no CDN dependency.

Every piece of imagery carries the same treatment: an animated fractal-noise
**grain** layer in `overlay` blend mode plus a two-stop **vignette**, and a shared
grade applied in CSS (`grayscale · contrast · brightness · saturate`) so the films,
the portraits and the film-derived stills all sit in one palette.

## Films

Three clips, generated with **Seedance 2.0** (`std` mode, 1080p, 16:9, silent, 8s):

| Clip | Shot |
| --- | --- |
| `hero-chalk` | Slow motion — chalked hands clap, the cloud blooming through one overhead shaft of light |
| `the-iron` | Macro tracking along a loaded barbell as hands grip it; knurling, chalk, plates settling |
| `the-grind` | Low, fast tracking shot alongside a runner on an outdoor track at dawn |

Each ships as **VP9/WebM and H.264/MP4**. Chromium builds without proprietary codecs
can't decode H.264, and Safari can't decode VP9 — between the two every engine gets a
stream. The hero picks its source at runtime via `canPlayType`.

The hero is encoded **all-intra** (`-g 1`): every frame is a keyframe, so a scroll-driven
seek always lands on a real frame instead of the nearest preceding one. It costs bitrate
and buys smooth scrubbing. A 960×540 variant is served under 860px.

## Motion

GSAP + ScrollTrigger, vendored in `assets/js/vendor/` (no CDN).

- **Hero scrub** — a 340vh track drives `video.currentTime` across the chalk film while
  the stage stays sticky. `FORGE` punches in on load (per-letter scale + blur + stagger),
  then rides out as the section clears.
- **Philosophy** — one creed line per scroll step, driven off a 500vh track. At most two
  lines ever share the frame, so a fast flick crossfades instead of stacking.
- **Programs / coaches / tiers** — CSS hover states: a red wash sweeping up from the base,
  card lift, image zoom, ghost-glyph drift.
- **Counters, reveals, band parallax** — scrub-linked, all one-shot.

Everything is applied *from* JavaScript, so the page renders complete and readable with
JS blocked, and all motion is skipped under `prefers-reduced-motion` (the hero collapses
to a static frame and all five creed lines render as a stacked list).

## Mobile

Below 860px the programs grid becomes a **swipeable card rail** — horizontal scroll with
`scroll-snap-type: x mandatory`, cards at 82% width so the next one peeks, and a dot
indicator that tracks position. Touch has no hover, so the red wash sits partly open at
rest instead of reading as a dead card. Nav collapses to a full-bleed sheet; pricing
stacks with the middle tier still flagged.

## Content

Everything is invented. The address, phone number, coaches, prices and statistics are
fictional; the phone number uses the 555 reserved range. The signup form is front-end
only — wire it to a handler before any real use.

## Known gap

Two of the four coach images are portraits generated for the brief. The other two
(`coach-voss`, `coach-poole`) are tight crops pulled from the films, standing in as
action shots because the image quota was exhausted mid-build. They are graded to match
and read as an intentional editorial mix, but if you want four true portraits, regenerate
those two at 4:5 and drop them in under the same filenames.
