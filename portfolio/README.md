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
src/styles/             app.css plus one stylesheet per act
```

`src/data/content.js` is the only file that knows what the site is *about*.
Four of the six acts build their DOM from it, so splitting the source of truth
between a template and a module is how a résumé ends up disagreeing with itself.

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
