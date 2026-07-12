# ContextQA — Video Generation Prompts (Google Flow / Veo)

Goal: 4 clips + 1 master image. All clips must look like they belong to one
film: same object, same lighting, same palette. Generate the MASTER IMAGE
first, then animate it with "Frames to Video" so every clip shares the same
design — the same trick as the watch hero image.

## Flow settings for every clip

- Model: highest-quality Veo available (Veo 3.1 "Quality" mode)
- Aspect ratio: 16:9 · Duration: 8s
- Audio: off / discard (site is silent)
- Download at the highest resolution available (upscale to 1080p/4K if your
  plan offers it)
- Motion must be SLOW and CONSTANT-SPEED with no cuts — the site scrubs these
  frame-by-frame; any speed ramp, camera shake, or cut will feel broken under
  a scrollbar
- If a generation adds readable text, captions, or watermarks, regenerate —
  fake AI-gibberish UI text ruins the shot

## Shared style block

Paste this at the end of every prompt:

> Cinematic product film, shot on a virtual RED camera with a macro prime
> lens. Deep space-navy black void background (#05070d), no floor, no horizon.
> Palette: near-black, glass, brushed gunmetal, glowing electric-blue and
> violet light (#3b82f6 → #8b5cf6). Dramatic rim lighting, shallow depth of
> field, faint drifting blue light particles like dust in a projector beam.
> Photorealistic 3D render aesthetic, 4K, noir mood, elegant and expensive.
> No people, no readable text, no logos, no captions, no watermark, no cuts.

---

## 0 · MASTER IMAGE (generate first, reuse as start frame)

> Hero product still of "the ContextQA Core": a levitating sphere of dark
> glass and brushed gunmetal, its interior a glowing lattice of electric-blue
> neural filaments and tiny golden micro-circuits, like a mechanical brain in
> a crystal shell. Around it, three thin translucent glass panels orbit —
> one shaped like an abstract browser window, one like a smartphone, one like
> a hexagonal API node — each edge-lit in violet, all completely blank, no
> text. Centered composition, floating in a black void. + [style block]

Regenerate until you love it. This exact render is the "product" — every clip
starts from it.

## 1 · HERO ORBIT (scroll-scrub hero — the Apple effect)

Flow mode: **Frames to Video**, start frame = master image, end frame = the
SAME master image (identical first/last frame ⇒ a perfect 360° loop, which
makes the scroll scrub seamless).

> A slow, perfectly smooth 360-degree studio turntable orbit around the
> ContextQA Core. The camera circles the levitating glass-and-gunmetal sphere
> at constant speed and fixed distance; the orbiting browser, phone, and API
> panels rotate gently with it. The blue neural lattice inside pulses very
> subtly. Rim light sweeps across the glass as the camera moves. The shot
> begins and ends at exactly the same angle for a seamless loop. No zoom, no
> speed changes, no cuts. + [style block]

## 2 · MACRO FLY-THROUGH (self-healing section)

Flow mode: Frames to Video, start frame = a tight crop of the master image
(crop into the sphere's surface), or Ingredients to Video with the master
image as ingredient.

> Extreme macro close-up gliding slowly across the surface of the ContextQA
> Core: brushed gunmetal micro-panels, engraved hairline circuit traces,
> glowing blue neural filaments running beneath dark glass. Mid-shot, one
> filament is severed and flickering red — as the camera passes, it re-fuses
> itself with a soft weld of blue light and turns calm blue again
> (a machine healing itself). Light ripples across the brushed metal as the
> camera glides. One continuous slow lateral dolly, constant speed, no cuts.
> + [style block]

## 3 · EXPLODED ASSEMBLY (one-platform section)

Flow mode: Frames to Video with the master image as the END frame (pieces
converge INTO the finished product), or text-to-video then pick the best.

> Exploded-view assembly: dozens of components float apart in the black void —
> dark glass browser panels, a slim smartphone slab, hexagonal API nodes,
> tiny gears, coiled springs of light, ribbons of glowing blue circuitry —
> all slowly and precisely converging toward the center, docking together to
> form the finished ContextQA Core sphere with its three orbiting panels.
> Movement is graceful, magnetic, inevitable, like a Swiss watch assembling
> itself. Constant speed, single continuous shot, ends on the completed
> levitating product. + [style block]

## 4 · ATMOSPHERE (AI-agent section / closing CTA)

Flow mode: Frames to Video, start frame = master image (or a variant sitting
on a surface).

> The ContextQA Core rests on a slab of black polished marble in darkness,
> lit by a single narrow spotlight from above. Thin blue-tinted smoke drifts
> slowly through the beam. The sphere's inner neural lattice breathes with a
> slow, calm pulse; its reflection glows faintly in the marble. Camera is
> nearly static with an imperceptible slow push-in. Quiet, minimal, expensive.
> + [style block]

---

## Delivery

Name and drop the files as:

```
assets/video/clip1_hero_orbit.mp4
assets/video/clip2_macro_selfheal.mp4
assets/video/clip3_assembly.mp4
assets/video/clip4_atmosphere.mp4
```

16:9, 1080p minimum (4K preferred), 5–10s each, no audio needed, no burned-in
text. I'll extract ~15fps frame sequences with ffmpeg and wire up the
scroll-scrub site from there.
