# HEET BAROT — cinematic portfolio

A six-act, scroll-driven portfolio for **Heet Barot**, AI Engineer and Full-Stack
Developer in Austin, TX. Everything is WebGL and vanilla ES modules: **no
framework, no build step, no dependency and no CDN**. Clone it, serve the
directory, and it runs.

It is a rebuild of [gireeshkumarreddy/cinematic-portofilo](https://github.com/gireeshkumarreddy/cinematic-portofilo)
carrying Heet's own information, taken from
[heet-barot-portfolio.vercel.app](https://heet-barot-portfolio.vercel.app).
The architecture — one act per scene directory, a canvas pinned inside a tall
section, DOM layered over it for anything that carries real words — is the
reference's. Everything visible is new.

## Run it

```bash
python3 -m http.server 5173
```

then open <http://localhost:5173>. Any static file server works in production;
there is nothing to compile.

Review helpers (dev only):

- `?t=3.2` starts the opening at 3.2s; `?t=end` jumps straight to the settled
  composition, so a single beat can be tuned without sitting through the whole
  title sequence.
- `window.__shot()` returns the opening's canvas as a PNG data URL.
- `window.__app` is the live opening — layout, word atlas, pointer, clock.

## The one thing this rebuild had to solve

The reference is built on footage: a matted video of its subject walking, a
supplied film for its second act, photographs for its years, screenshots for
its projects. **None of that exists here** — there are no photographs of Heet
and no captures of his work that could be redistributed.

So every asset is *generated*, at runtime, in the browser:

| Reference | Here |
| --- | --- |
| Matted video of the subject, clipped inside the wordmark | A procedural **signal field** — streams, filaments and pulsing nodes — clipped inside the wordmark |
| A supplied film for the tools scene | A **projected room**: cards solved to real world positions, lit by a light-painting ribbon |
| Photographs behind the year cards | A drawn **clock and timeline**, with the room and its mechanism shaded in GLSL |
| Screenshots of each project | **Procedural interface plates**, one per project, drawn to a canvas atlas |

The only binary files in the repository are two open-licensed typefaces.

## Colour

The accent is carried straight over from Heet's live site: `#f7931e` amber with
`#e85500` beneath it, on true black. In GLSL those are `AMBER`, `EMBER` and
`HOT`, defined identically in every shader so the acts share one light.

## The acts

### Act I — the opening

Black → a signal field condenses out of the dark → **HEET BAROT** materialises,
centre letters first, so the wordmark grows from the middle → the lede drops and
overshoots → the role and location chips arrive from opposite sides → tick marks
and the corner dot grid snap in → the header draws itself → the composition
settles and breathes under pointer parallax.

**The wordmark is a texture, not DOM text.** The field that lives inside the
letters has to be clipped by the real letterforms, and sharing one coverage
atlas means the clip mask and the visible letter are the same pixels — they
cannot drift apart by a subpixel at any size or device pixel ratio.
`src/scene1/type.js` renders it and reports the ink rectangle of every glyph.

**The letters are windows onto one field, not ten patches.** Each glyph is its
own draw call, because each carries its own reveal, rise and softness — but the
field is evaluated in *screen* space in the fragment shader, so what shows
through the letters is continuous across the whole word.

**Letters resolve, they do not fade.** The reveal is a noise-thresholded
dissolve, so a letter materialises out of static with a bright leading edge
riding the threshold.

**The beats overlap on purpose.** The letters are still resolving when the lede
drops; the chips are still sliding when the field starts to run. That overlap is
the difference between a title sequence and a queue of fades.

Landscape sets the wordmark on one line, portrait stacks it — a 2.6:1 wordmark
on a phone is either three storeys of empty screen or a strip of hairlines.

### Act II — the stack

A room you fly through, holding the fourteen things Heet actually builds with.

**Depth is chosen; position is solved.** A card's depth is authored, and its
world position is then solved so the projection lands it exactly where the
composition wants it on screen. That is why the parallax, the scroll dolly and
the hover tilt all behave correctly, and why the layout re-fits at any viewport
aspect instead of cropping.

**A card's size comes from how much of the frame it should fill**, not from a
fixed world width. Apparent size goes as 1/aspect, so a deck fixed in world
units reads as a room on a laptop and as four overlapping billboards on a
handset. Portrait also pulls the spread in and lifts the deck clear of the copy.

**The outer cards are pulled in with `tanh`**, so the middle of the deck keeps
the spacing it was authored with while the extremes stop being sliced in half by
a wide viewport.

**The ribbon is a light-painting, not a shape.** A parametric head travels the
room on an orbit with slower incommensurate drifts layered on, so its path never
visibly repeats, and the strip is rebuilt every frame from the last 6.5 seconds
of where the head has been. Sampling the path *backwards* rather than pushing
history means the trail is exact at any frame rate and survives a throttled tab.
The strip is split at the deck's mid depth and drawn in two passes, so it weaves
behind the far cards and in front of the near ones. The head also lights the
room it passes through, and the embers near it flare.

**The materialisation is one event.** There is deliberately no per-card stagger:
`mat` is a single scalar every card reads. The only per-card variation is in
*how* each one travels once it exists, which reads as choreography rather than
as a queue. It is time-based and triggered on entry, while the camera dolly is
scroll-based — tying the arrival to scroll would let a fast flick skip the
moment the act is built around, and tying the camera to time would take it away
from the visitor.

Every draw pass binds the vertex array it needs. The ember and ribbon passes
leave none bound, and a card drawn without one silently produces nothing.

### Act III — a journey through time

2020 to 2026, one card per year, carrying the real milestone behind each: the
MiHIN internship and healthcare IT, Restoration Partner and full-stack, the
years of OWASP hardening and AWS monitoring, ContextQA and the turn to models,
MCP and ReAct agents in production, BiznezzAI and CaseGenius, and Vanikaar now.

**The timeline is a fitted arc**, not a spline through eyeballed points. A ball
pivot hangs a beam hand over it whose hot core lands as an amber flood exactly
on the active year's node, so the clock reads as *projecting light into* the
timeline rather than merely pointing at it.

**The year cards are DOM.** Each carries prose that has to stay crisp,
selectable and reachable, and each is a real `<button>`, so keyboard and touch
support come almost free. They are positioned by JS from the same fitted
geometry the canvas draws with, so the two layers cannot drift.

**Portrait is a different composition, not a scaled one.** Mapped straight onto
a tall screen the arc collapses into a narrow band with seven cards on top of
each other, so on a phone the timeline stands up: the years become a vertical
rail of tap targets and one card at a time holds the stage beside it.

The active year needed a dark halo. The beam floods that exact node, so the one
label the visitor most wants to read was the only one sitting on near-white,
and amber on near-white is nothing. The halo keeps the colour and returns the
contrast.

### Act IV — the projects

The seven real projects as a deck travelling through a dark room over a floor
that reflects them, scrubbed by scroll so the visitor drives it. The active
project's copy is DOM so it stays crisp and selectable; the pips are real
buttons that jump the deck.

**Every screen is generated.** There are no screenshots of this work and none
could be redistributed, so each plate is drawn to a canvas atlas at runtime and
each had to read as a different piece of software rather than seven tinted
rectangles: a live transcription view for Vanikaar, a security console for
CaseGenius, a reasoning graph for BiznezzAI, an analytics dashboard for
InboundCMS, a cinematic hero for Victory Lane, a document layout for D Barot
Law, nutrition rings for FoodLab AI. They are drawn deterministically, so they
do not reshuffle between reloads.

### Act V — the record

Built the opposite way round from every other act: a normal-flow document with
the canvas demoted to quiet decoration behind it, because this is the act where
somebody actually reads, and reading beats spectacle here.

The three roles hang off a hairline spine as an ordered list, each with a large
index numeral, the company, the role, the dates and place, the achievement
bullets and the stack as chips. The five credentials follow as a card deck. The
three headline numbers count up once, the first time they are seen.

The whole record is written into the page *before* anything that could throw,
so a WebGL failure costs a decoration and never the content.

### Act VI — the finale

The bookend to the opening: the same amber on black, the same ember and grain,
but warmer and calmer — the film ending rather than beginning. The ember field
GATHERS as the visitor reaches the bottom, driven by the section's own scroll
progress rather than a timer, so arriving at the contact card feels like
arriving somewhere the visitor took themselves.

The wordmark is built from the same coverage atlas the opening uses but treated
as a backlit slab, so the closing frame rhymes with the opening without
repeating it shot for shot. The quote sets as four stacked lines. The contact
card carries the statement, the email as a target sized to be hit on a phone,
and the availability line with a live dot.

Its DOM text is also set before anything that can throw, so even a WebGL
failure leaves a reachable email address — which is the point of the page.

## Layout

```
index.html              the whole page; every act's markup lives here
vercel.json             static headers; fonts immutable, source revalidated
public/fonts/           Anton and Oswald, subset to woff2
src/main.js             boot, the opening's frame loop, nav, menu, act loading
src/data/content.js     every word on the site, in one place
src/lib/                ease.js, mat4.js
src/gl/renderer.js      WebGL2 helpers: programs, uniforms, textures, a quad
src/gl/shadersN.js      one shader module per act
src/scene1/             the opening: type, layout, timeline, furniture
src/scene2/             the stack: universe, cards, timeline
src/scene3/             the journey: chrono, layout, timeline
src/scene4/             the work: gallery, plates, layout, timeline
src/scene5/             the record: sheet (typesetting), plate (ambient)
src/scene6/             the finale
src/styles/             app.css plus one stylesheet per act
favicon.svg             drawn as geometry, not set in a webfont that a
                        16px favicon would never get to load
```

`src/data/content.js` is the only file that knows what the site is *about*.
Four of the six acts build their DOM from it, so splitting the source of truth
between a template and a module is how a résumé ends up disagreeing with itself.

## Deploying

Serve this directory. There is nothing to build, so no build command and no
install step.

On Vercel that means one project with **root directory `portfolio`**, and
`vercel.json` sets `outputDirectory` to `.` — which is load bearing. Without
it the zero config build finds `public/` and takes that for the output
directory, so the deploy carries the six woff2 files and nothing else. Every
page 404s and the build still reports READY, because from Vercel's side
nothing went wrong.

## Robustness

Each act is loaded on its own and is allowed to fail: a scene that cannot start
leaves its section as readable markup instead of taking the page down.

- **No WebGL** → the page falls back to the name and title, and every DOM cue
  fires so the furniture still lands.
- **No JavaScript** → the `<h1>`, the metadata and the JSON-LD carry the whole
  identity; a `<noscript>` explains the opening.
- **`prefers-reduced-motion`** → every act lands on its settled composition and
  holds it still. No build-up, no loops, no drifting grain.
- **Off screen** → each act gates its own `requestAnimationFrame` loop with an
  `IntersectionObserver`, and the opening stops rendering once the flow covers
  it, rather than burning battery on frames nobody is looking at.
- **Acts are independent.** Each is imported on its own and allowed to fail;
  `window.__actsSettled` goes true once every act has either started or failed,
  which is what review tooling waits on. Settled deliberately does not mean all
  succeeded: an act that cannot start is a legitimate final state, and a
  success-only signal would hang forever on a broken one.
- **Hidden tab** → the loop stops entirely.

`overflow-x` on the document is `clip`, not `hidden`: `hidden` promotes `body`
to a scroll container, which silently breaks every `position: sticky` pin in the
acts below.

## Credits

Type: [Anton](https://fonts.google.com/specimen/Anton) and
[Oswald](https://fonts.google.com/specimen/Oswald), both SIL Open Font License,
vendored as woff2 so the site has no network dependency.

Structure and scene architecture after
[gireeshkumarreddy/cinematic-portofilo](https://github.com/gireeshkumarreddy/cinematic-portofilo).
