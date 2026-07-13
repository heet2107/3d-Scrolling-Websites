# ContextQA — Cinematic 3D Scroll Website · Plan & Copy Deck

Branch: `contextqa` · Status: awaiting video clips (Google Flow / Veo)

Same architecture as the AURUM & NOIR concept: canvas frame-sequence scrubbing,
Lenis smooth scroll, pinned text reveals. Dark cinematic theme so video edges
blend invisibly into the page background.

---

## Design system

- Background: deep space navy / off-black `#05070d`
- Accents: electric blue `#3b82f6` → violet `#8b5cf6` gradient, thin glowing lines
- Type: high-contrast display font (e.g. "Clash Display" / "Space Grotesk" bold)
  paired with a minimal sans (Inter) for body/specs
- Copy tone: quiet, confident, very few words

## Sections (scroll order)

1. **HERO — scroll-scrub orbit** (Clip 1, canvas frame sequence)
   - "CONTEXTQA" letters track in over the rotating AI core
   - H1: `Testing that thinks.`
   - Sub: `AI agents that create, run, and heal your tests — while you ship.`

2. **STORY — "Trained on your context."**
   - `Every release used to break a test. Nobody noticed until a user did.`
   - `ContextQA watches real user behavior and turns it into coverage.`

3. **MACRO DETAILS — self-healing** (Clip 2, scroll-scrub)
   - Heading: `Tests that repair themselves.`
   - Callouts pinned to scroll: DOM drift detection · Visual AI + DOM analysis ·
     Root cause analysis, not false failures

4. **ENGINEERING — one platform assembles** (Clip 3, scroll-scrub)
   - Heading: `One platform. Every surface.`
   - Spec callouts (HTML overlays, appear as pieces converge):
     - `Web · Mobile · API · Salesforce`
     - `20% → 80% coverage in weeks`
     - `70% less test maintenance`
     - `Plain-English test creation — no code`
     - `Jenkins · GitHub Actions · Azure DevOps · Bitbucket · Jira · Slack`

5. **AI AGENT TESTING** (Clip 4 as ambient background, slow autoplay or scrub)
   - Heading: `Your AI agents need QA too.`
   - Sub: `Adversarial scenarios, hallucination traps, policy violations —
     generated before your users find them.`
   - Line: `Agentforce · Bedrock · Azure AI Foundry · Snowflake Cortex · Intercom Fin`

6. **CTA**
   - `See it heal a test in 15 minutes.`
   - Buttons: `Book a demo` · `Start free`

## Tech stack (when clips arrive)

- Static site: Vite + vanilla JS (or plain HTML/JS), GSAP ScrollTrigger + Lenis
- Clips → frames: `ffmpeg -i clip.mp4 -vf "fps=15,scale=1600:-1" frames/f_%04d.webp`
  (~120 frames per 8s clip), preloaded + drawn to `<canvas>` on scroll progress
- Verify in headless Chromium (Playwright) before calling it done

## Video delivery

Drop the 4 MP4s (16:9, 1080p minimum, 4K preferred, no burned-in text or
watermarks) into `assets/video/` named:

```
clip1_hero_orbit.mp4
clip2_macro_selfheal.mp4
clip3_assembly.mp4
clip4_atmosphere.mp4
```

Prompts to generate them: see `docs/VIDEO_PROMPTS.md`.
