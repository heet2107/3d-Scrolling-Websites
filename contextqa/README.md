# ContextQA — Autonomous Quality Engineering

A single page, cinematic scroll site for **ContextQA**, the autonomous quality layer
around the software development lifecycle. The copy follows the *ContextQA Content
Playbook* (core narrative, the four hero flows, the content formula, metrics, positioning
and objection handling) and the build follows the *Creative Developer Playbook* technique:
generate one continuous AI film, turn it into frames, paint the frames on a canvas from
scroll position, add a Three.js layer, and hang the story sections off the same scroll.

Static, no build toolchain. `contextqa/` is its own deployable site root with its own
`vercel.json`, served at `/`, not under a subpath, exactly like `forge/` and `meridian/`.

```bash
# Serve THIS directory as the site root
npx http-server contextqa -p 8002
# or
python3 -m http.server 8002 --directory contextqa
# open http://localhost:8002
```

Asset URLs are root absolute (`/assets/...`) so they hold whether or not the host serves
the page with a trailing slash.

## Live

Vercel project **`contextqa-site`** (root directory `contextqa`), linked to this repository.

**Public:** <https://contextqa-site.vercel.app>

The project's very first build came from this branch and Vercel marked it production, so
the public alias serves that build. Later pushes to a non production branch create
*preview* deployments, which sit behind the team's deployment protection (a Vercel login)
and do not move the public alias. Merging to `main` promotes automatically; to promote
sooner, use *Promote to Production* on the latest build in the project's Deployments tab.

## Design

"Signal" theme. Near black ground (`#05070B`), one cyan accent (`#3DDCFF`) for order and
one violet (`#8B5CF6` to `#C084FC`) for chaos, which is also the film's own palette: a
turbulent violet stream of unvalidated code enters a six ring gyroscope and leaves as calm
cyan beams. Type is **Space Grotesk** (display), **Inter** (body) and **JetBrains Mono**
(labels), self hosted as variable woff2 subsets (224 KB total) so there is no CDN
dependency.

## The film (Higgsfield)

Everything visual was generated with Higgsfield during the build, then downloaded and
encoded into the site. Nothing is generated at runtime and the page makes no requests to
Higgsfield.

| Asset | Model | Notes |
| --- | --- | --- |
| Hero keyframe (start frame) | Nano Banana Pro, 16:9, 2K | Three concepts were rendered (obsidian icosahedron, tilted six ring gyroscope, front facing rings). The gyroscope won: six rings for the six stages of the loop. |
| Hero film | Seedance 2.0, std, 1080p, high bitrate, 15 s, silent | One single continuous take from the keyframe: slow push in and orbit, rings rotating on their own axes, the stream resolving ring by ring, a brief exploded beat, then a front on settle with one beam toward the lens. Locked exposure, no cuts, no text. |
| Backup film | Seedance 2.5, omni reference, 1080p, 15 s | Same prompt. Steadier but subtler; not used on the page. |
| Section stills | Nano Banana Pro | The icosahedron concept backs the closing call to action; the front facing rings are the no WebGL fallback in the engine section. |

The prompt obeys the scroll scrub footage contract: one hero subject, centered, dark
seamless background, slow constant motion, no cuts, no flicker, no on screen text, and a
start state that differs from the end state so the scrub has a payoff.

## Frames

The film is scrubbed as WebP frames on a `<canvas>`, not as a video element, so seeking is
deterministic on every engine (Safari included) and frames never tear.

| Set | Frames | Size | For |
| --- | --- | --- | --- |
| `assets/frames/d/` | 240 · 1440×810 · 16 fps | 14M | landscape screens |
| `assets/frames/m/` | 180 · 640×853 · 12 fps | 5.5M | portrait screens (a 3:4 centre crop, so no bandwidth goes to pixels the phone never shows) |

Regenerate both sets and the poster with:

```bash
FFMPEG=/path/to/ffmpeg bash build/extract_frames.sh film.mp4
```

Loading is progressive: frame one, then every 12th, 6th, 3rd, then the rest, six at a
time. The scrub works after the first pass and only gets smoother. Until a frame arrives
the nearest decoded neighbour is painted, preferring the past so motion never appears to
run backwards. The poster is the film's first frame and is adopted as frame zero, so the
canvas paints instantly and the poster fades out underneath it without a jump. On wide
screens the film opens slightly zoomed and anchored left so the gyroscope sits beside the
lockup, then eases to a centred, unzoomed frame as the title rides out.

## Motion

GSAP + ScrollTrigger (vendored in `assets/js/vendor/`, no CDN) and Three.js r185
(`three.module.min.js`, loaded as an ES module).

- **Hero** — a 520vh track scrubs the 240 frames while the stage stays sticky. Four
  chapters (the shift, the bottleneck, the quality layer, the outcome) fade in and out of
  their slice of the film. The lockup punches in on load and rides out as the film starts.
- **Three.js particle field** over the hero: additive bokeh, sine drift, twinkle in the
  vertex shader, pointer parallax on the camera, thinning as the film resolves.
- **Three.js gyroscope** in the engine section: six torus rings on different axes, each
  spinning at its own rate, the whole rig yawing with scroll. The ring for the active
  stage lights up and pulses; completed rings stay lit; upcoming rings stay dim.
- **The shift** — three era cards rise out of perspective; code output bars outrun
  validation capacity bars. Then a word by word statement scrub on a 260vh track.
- **The villain** — six consequence cards fly out of a stacked deck into a grid in 3D.
- **The engine** — pinned horizontal rail of the six stages, feeding the gyroscope.
- **Four hero flows** — each flow is a 300vh sticky stage: trigger card, a work log that
  ticks through ContextQA's steps, the artifact (ticket, blast radius report, Slack
  triage) and the metrics, all keyed to scroll. On phones each flow plays once when it
  enters view instead.
- **Impact** — the north star chart draws with scroll; counters count up on entry.
- **Compare** — pointer tracked 3D tilt on the three positioning cards.
- Reveals, progress bar, CTA parallax.

Both Three.js renderers only draw while their section is on screen and the tab is
visible, cap the device pixel ratio, and dispose on page hide.

Everything is applied *from* JavaScript, so the page renders complete and readable with
JS blocked (the hero collapses to the poster with the chapters stacked below it), and all
motion is skipped under `prefers-reduced-motion`.

## Mobile

Below 900px the deck, engine and flows stop pinning and read as ordinary sections; the
stage rail becomes a native swipe rail with scroll snap, and the closest card to centre
drives the gyroscope. The hero keeps its scrub on a 420vh track with the portrait frame
set.

## Content

- The narrative, hooks, flows, metrics, positioning and FAQ answers come from the content
  playbook. The messaging guardrails were followed: ContextQA is positioned as the
  autonomous quality layer around coding agents, complementary to Claude and Codex,
  Playwright, CodeRabbit and Greptile, never as a replacement for any of them or for QA
  teams.
- The investigations inside the four flows (ticket numbers, file paths, the one cent
  proration bug) are **illustrative examples** written to show the shape of the artifact,
  and the impact tiles are example outcomes in the format the playbook asks for
  (`2h → 12m`). Both are labelled as such on the page. Replace them with real numbers
  before launch.
- A recorded customer demo call was used only to understand the product (context graph,
  MCP driven workflows, bug reproduction, auto heal, RCA, integrations). Nothing from the
  recording, its transcript or its participants appears on the page.
- The signup form is front end only; wire it to a mail handler or CRM before going live.
- No external domain is assumed: canonical URLs, social links and the contact route are
  left for the owner to set.
