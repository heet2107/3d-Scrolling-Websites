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

## Caching

The page's HTML revalidates on every load, so a deploy reaches visitors immediately.
Its stylesheets and scripts must not lag behind it: when they do, a returning visitor
runs new markup against an old stylesheet, and the page paints blank sections and
unstyled icons. Two things prevent that.

`vercel.json` serves `/assets/css` and `/assets/js` with `max-age=0, must-revalidate`,
so they are checked on every load and cost a 304 rather than a download. Fonts, frames,
images and the vendored libraries keep a year of `immutable` caching, since those never
change in place.

Every stylesheet and script URL also carries a short content hash, so a changed file
gets a new URL and any copy already sitting in a browser cache is bypassed at once.
**Run this after touching anything under `assets/css` or `assets/js`, and commit the
result:**

```bash
bash build/stamp_assets.sh
```

## Design

"Signal" theme. One cyan accent for order and one violet for chaos, which is also the
film's own palette: a turbulent violet stream of unvalidated code enters a six ring
gyroscope and leaves as calm cyan beams. Type is **Space Grotesk** (display), **Inter**
(body) and **JetBrains Mono** (labels), self hosted as variable woff2 subsets (224 KB
total) so there is no CDN dependency.

### Light and dark

Two themes, switched by the toggle in the nav and remembered per visitor in
`localStorage` (`cqa-theme`). **Light is the default**; change the `t="light"` fallback
in the inline script in `index.html`'s head to flip that. The script runs before the
stylesheet so there is no flash of the wrong theme.

Every colour in `cqa.css` is a token on `:root`, restated under `:root[data-theme="light"]`
with the accents deepened for contrast on the pale ground (`#3DDCFF` becomes `#0891B2`,
and so on). Three places stay dark in both themes because they are built on dark
imagery: the hero film, the closing call to action, and the nav while it floats over the
film. They redeclare the dark tokens on themselves (`.hero`, `.cta`, `.nav.is-over-hero`)
so everything inside inherits the cinematic palette without any per element overrides.
The Three.js gyroscope and the bug hunt canvas listen for the `cqa:theme` event and
recolour themselves; the gyroscope also swaps its additive glow for normal blending,
since additive light disappears on a white ground.

### The ambient layer

The page is never flat. Behind every section sit, in order:

- a dot grid on the body,
- `.aurora`, three soft radial washes of violet, cyan and magenta that drift on a 52 second
  loop,
- `#bugs`, a fixed canvas running **the bug hunt**: a dozen beetle glyphs crawl across the
  viewport; every few seconds a cyan reticle locks onto one, it bursts into sparks and
  fragments, and a green check mark is left where it was, while a faint scan band sweeps
  the screen. It is the product story as ambient motion, and the footer keeps a tally of
  bugs caught on this visit.

Sections sit above these layers with translucent glass panels, so the motion shows
through the gaps but never behind body copy. The canvas pauses while the hero film covers
the viewport and while the tab is hidden, caps its pixel ratio at 1.5, and does not run at
all under `prefers-reduced-motion`. Line icons for the cards live in one inline SVG
sprite at the top of `index.html`.

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
  Under the call to action sits a **logo marquee**: two identical rows of the twelve
  integration marks slide as one track, each row carrying a trailing gap equal to its
  inner gaps so the halves are exactly equal and a -50% translate lands one full row
  along with no seam. Pure CSS keyframes, paused on hover and focus, and hidden below
  900px.
- **Three.js particle field** over the hero: additive bokeh, sine drift, twinkle in the
  vertex shader, pointer parallax on the camera, thinning as the film resolves.
- **Three.js gyroscope** in the engine section: six torus rings on different axes, each
  spinning at its own rate, the whole rig yawing with scroll. The ring for the active
  stage lights up and pulses; completed rings stay lit; upcoming rings stay dim.
- **The shift** — three era cards rise out of perspective; code output bars outrun
  validation capacity bars. Then a word by word statement scrub on a 260vh track.
- **The villain** — six consequence cards fly out of a stacked deck into a grid in 3D.
- **The engine** — pinned horizontal rail of the six stages, feeding the gyroscope.
- **Four hero flows** — one tabbed panel. Each flow shows a trigger card, a work log that
  ticks through ContextQA's steps, the artifact (ticket, blast radius report, Slack
  triage) and the metrics. The four used to be four 300vh pinned stages, which cost
  1200vh of scrolling through the same layout four times; they now share a single
  panel switched by a real tablist, and the section is about 1400px tall. The
  highlight behind the active tab is one element that slides, so it travels rather
  than blinking across. Clicking or arrow keys switch flows, Home and End jump to the
  ends, and a flow ticks through its investigation the first time it is shown. With
  JavaScript blocked the tablist is hidden and all four flows stay in the page and
  readable.
- **Stack** — the integrations section: a checklist of what ContextQA touches beside an
  **orbit**, three dotted rings of integration marks turning around the ContextQA core at
  26, 34 and 44 seconds a revolution, each mark counter spinning at its ring's own rate so
  every logo stays upright. Ported from a React component into plain CSS keyframes, so it
  needs no build step and no JavaScript at all. The rings stop under
  `prefers-reduced-motion` and with JS blocked, where the marks simply sit still in place,
  and the whole thing is one `role="img"` with a screen reader list of the tool names
  beside it.
- **Impact** — the north star chart draws with scroll; counters count up on entry.
- **Voices** — a staggered testimonial deck. Cards fan out from the centre with
  alternating tilt, the middle one lifts and takes the accent colour, and previous
  and next rotate the deck endlessly. Ported from a React and shadcn component into
  this site's stack, so it needs no build step. Arrow keys work, clicking a card
  brings it to the centre, and the markup ships as a plain readable grid that the
  controller upgrades, so the quotes survive with JavaScript blocked and under
  reduced motion, where a moving deck would be the wrong answer.
- **Compare** — pointer tracked 3D tilt on the three positioning cards.
- Reveals, progress bar, CTA parallax.

Both Three.js renderers only draw while their section is on screen and the tab is
visible, cap the device pixel ratio, and dispose on page hide.

Everything is applied *from* JavaScript, so the page renders complete and readable with
JS blocked (the hero collapses to the poster with the chapters stacked below it), and all
motion is skipped under `prefers-reduced-motion`.

## Mobile

Below 900px the deck and engine stop pinning and read as ordinary sections; the
stage rail becomes a native swipe rail with scroll snap, and the closest card to centre
drives the gyroscope. The flow tablist becomes a horizontal swipe rail, and the hero
logo marquee is hidden. The hero keeps its scrub on a 420vh track with the portrait
frame set.

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
- The twelve marks orbiting in the Stack section are the surfaces named in the
  playbook plus the ones raised on the demo call. Confirm the list against the real
  integration catalogue before launch, and drop any tool that is not actually
  supported. Their marks are vendored from [Simple Icons](https://simpleicons.org)
  (CC0) into the inline sprite, so there is still no CDN dependency; each brand
  remains the trademark of its owner and is shown for identification only.
- The testimonials in the Voices section are **illustrative**, written in the voice of
  the target persona and labelled as such on the page. Replace them with real,
  attributable customer quotes before launch.
- The signup form is front end only; wire it to a mail handler or CRM before going live.
- No external domain is assumed: canonical URLs, social links and the contact route are
  left for the owner to set.
