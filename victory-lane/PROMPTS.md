# VICTORY LANE — Google Flow (Veo) Video Prompts

Cinematic clip set for the scroll-driven website. **Read the workflow notes first — clip
consistency depends on generating the hero still image before any video.**

---

## Workflow in Google Flow (important)

1. **Generate the HERO STILL first** (Flow → "Text to Image") using Prompt 0 below.
   Re-roll until you love the car. This one image defines the car design for the whole site.
2. For **every video clip**, use **"Frames to Video"** (image → video) with that hero still
   as the starting frame (or as an "ingredient" in "Ingredients to Video"). This is what keeps
   the exact same car — same body lines, same wheels, same reflections — across all clips.
3. Settings for all clips: **16:9 landscape, highest quality/1080p+ output, 8 seconds**
   (Flow's max — longer is better for scroll-scrubbing), **no dialogue, no music** (audio is
   stripped anyway).
4. The HERO ORBIT clip is scrubbed frame-by-frame on scroll, so it must be **one continuous
   shot, no cuts, constant speed, minimal motion blur**. If a generation adds a cut, flash,
   camera shake, or speed ramp — reject it and re-roll. Judge candidates by scrubbing the
   preview slider, not by watching playback.
5. Export/download at the highest resolution offered. Hand me the MP4s named:
   `hero.mp4`, `macro.mp4`, `assembly.mp4`, `atmosphere.mp4`.

**Note on the car:** deliberately unbranded (no badges/logos) — a "generic" obsidian GT coupe.
This avoids trademark problems and lets the footage represent every marque the workshop serves.

---

## Prompt 0 — HERO STILL (generate this image first)

> Ultra-detailed cinematic studio photograph of a low, wide, unbranded obsidian-black
> grand-touring sports coupe floating in a pure black void, three-quarter front view.
> Deep gloss black paint with subtle metallic flake, razor-sharp gold rim lighting tracing
> the silhouette from above-left, gold-accented brake calipers glowing behind dark
> multi-spoke forged wheels, faint gold dust particles drifting in the air, soft reflection
> on an invisible black floor. No badges, no logos, no text, no license plate. Shot on a
> cinema camera, 50mm lens, f/2.8, hyper-realistic, 4K, epic noir automotive advertising style.

---

## Clip 1 — HERO ORBIT (scroll-scrubbed turntable — the money shot)

> Seamless studio turntable of this exact black GT coupe floating in a pure black void.
> The camera is completely locked and static; the car rotates slowly and perfectly smoothly
> around its own vertical axis at constant speed, completing one full 360-degree rotation
> across the entire clip. Dramatic gold rim lighting sweeps across the bodywork as it turns,
> gold brake calipers catching light behind the wheel spokes, faint gold dust particles
> drifting slowly in the void, soft floor reflection. Single continuous shot: no cuts, no
> zoom, no camera movement, no speed changes, no motion blur, no flashes. Pure black
> background throughout. Cinematic, hyper-realistic, epic noir. No audio.

*Re-roll criteria: rotation must be constant-speed and complete (or nearly complete) 360°;
background must stay pure black; no cuts. This clip becomes ~200 scrub frames.*

## Clip 2 — MACRO FLY-THROUGH (detail scrub)

> Extreme macro close-up journey across the same black GT coupe, one slow continuous camera
> glide: the lens drifts along the knife-edge body crease where gold rim light ripples across
> deep black metallic paint, past the honeycomb grille, across the jeweled LED headlight
> internals glinting like optics in a watch movement, then along the carbon-fiber weave of
> the splitter and finishes on the gold brake caliper visible through the slowly turning
> forged wheel spokes. Shallow depth of field, focus gently pulling with the camera, gold
> dust motes floating through the light. Single continuous shot, slow constant camera speed,
> no cuts, black void background, cinematic macro lens, hyper-realistic, epic noir. No audio.

## Clip 3 — EXPLODED ASSEMBLY (engineering section)

> Cinematic exploded-view assembly of the same black GT coupe in a pure black void: the car
> begins as dozens of separated components suspended in space — forged wheels, gold brake
> calipers, coilover springs, turbocharger, exhaust system, carbon-fiber body panels, bezel
> trim and glass — all slowly drifting inward and converging with millimetre precision into
> the finished car, panels seating flush, wheels docking onto glowing gold hubs. Camera
> holds a slow, subtle push-in from a three-quarter angle. Gold rim lighting, fine gold
> particles, soft floor reflection. Single continuous shot, smooth constant motion, no cuts,
> no text. Hyper-realistic CGI-style automotive film, epic noir. Ends on the completed car,
> perfectly still. No audio.

*If Flow struggles converging into the exact hero car, generate the reverse — the car
gently exploding apart from the hero still — and tell me; I'll reverse the frames.*

## Clip 4 — ATMOSPHERE (ambient loop)

> The same black GT coupe at rest on polished black marble in total darkness, lit by a
> single hard spotlight from directly above. Thin wisps of smoke drift slowly through the
> cone of light and curl across the hood. The car is perfectly still; only the smoke and a
> subtle shimmer of the spotlight move. Gold edge light kisses the roofline and wheel lips.
> Locked static camera, wide cinematic composition with generous negative space above the
> car. Single continuous shot, no cuts, very slow ambient motion, loop-friendly (first and
> last frames nearly identical). Hyper-realistic, epic noir, 4K. No audio.

---

## Optional Clip 5 — WORKSHOP REVEAL (if you have spare generations)

> Slow dolly forward through a dark, immaculate 15,000 sq ft luxury automotive workshop at
> night: polished dark floors reflecting pools of warm light, a single black GT coupe on a
> lift under a spotlight, tool walls and wheel displays fading into darkness on both sides.
> Thin haze in the air, gold-tinted practical lights. Single continuous shot, slow constant
> speed, no people, no logos, no cuts. Cinematic anamorphic look, epic noir. No audio.

---

### When you bring the MP4s back

Drop them in `victory-lane/incoming/` and I'll run the frame-extraction pipeline
(`tools/video-to-frames.mjs`) — the site picks the frames up with zero code changes.
