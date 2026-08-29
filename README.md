# 3d-Scrolling-Websites

Two independent static sites, each deployed as its own Vercel project:

| Directory | Site | Vercel project | Serves at |
| --- | --- | --- | --- |
| repository root | Monga Brothers Ltd. | `monga-brothers-website` | `/` |
| [`forge/`](forge/) | FORGE — strength gym, Detroit | `forge-gym` | `/` (root directory `forge`) |

`forge/` carries its own `vercel.json` and is served as a site root, not under
`/forge`. See [`forge/README.md`](forge/README.md) for its build notes — in
particular, its scroll-scrubbed hero needs a server that honours HTTP Range.

---

# Monga Brothers Ltd. — website

A static, dependency-light marketing site for **Monga Brothers Ltd.**, an ISO 9001:2015
manufacturer of forged and machined components for the defense and railway industries
(B-16, Phase-2, Focal Point, Ludhiana-141010, Punjab, India).

## Design

"Forged" theme — dark graphite/navy grounds with the logo's gold as the single accent.
Type: **Anton** (display, echoes the condensed logo wordmark), **IBM Plex Sans** (body),
**IBM Plex Mono** (technical labels, numbers, buttons). All imagery is generated
specifically for each service/industry; the six background films were generated with
Higgsfield and compressed for the web.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Hero film, bento services grid, statement scrub, pinned process rail, sticky sector stack, product marquee, testimonials, FAQ |
| `about.html` | Company overview, milestone timeline, quality lab, promise statement |
| `solutions.html` | Sticky-stack of the three solution lines + industries bento |
| `defense.html` | Defense service area — editorial capability rows |
| `railway.html` | Railway service area — editorial capability rows |
| `manufacturing.html` | The four production units as sticky panels + mosaic gallery |
| `industries.html` | Service areas bento, engagement timeline, coverage statement |
| `products.html` | Filterable product gallery (studio shots) + materials |
| `contact.html` | Enquiry form, info panel, quote checklist |

## Motion

GSAP + ScrollTrigger (vendored in `assets/js/vendor/`, no CDN dependency) drive:

- pinned horizontal **process rail** (desktop; native swipe rail on mobile)
- **sticky-stacking** sector panels that settle and dim as the next slides over
- word-by-word **statement scrub** (text lights up with scroll)
- hero entrance (mask-reveal headline) + scrub parallax on hero/banner media
- staggered section reveals, animated counters, scroll progress bar
- pointer-tracked **3D tilt** on product tiles, 3D dropdown, marquee strips

Everything is applied *from* JavaScript, so the page renders complete and static
without JS, and all motion is disabled under `prefers-reduced-motion`.

## Editing content

Pages are generated so the chrome is written once:

```bash
python3 build/build.py            # writes the nine HTML files
python3 build/stamp_dimensions.py # stamps intrinsic image sizes (no layout shift)
```

- `build/partials.py` — header, footer, nav, contact details, icons.
- `build/build.py` — the content of each page.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment

Static site — `vercel.json` sets clean URLs and cache headers. No build step required.

## Notes

- The contact form is front-end only; wire it to a mail handler before going live.
- Footer social links are placeholders.
