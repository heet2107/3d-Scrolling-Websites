/* ------------------------------------------------------------------ *
 *  Frame state, deliberately outside React.
 *
 *  The 3D layer and the cursor need scroll position and pointer position
 *  every frame. Routing 60 updates a second through useState would
 *  re-render the tree 60 times a second for values that only ever reach
 *  a useFrame callback. These are plain mutable singletons instead:
 *  written once per frame by the scroll/pointer listeners, read directly
 *  inside the render loop. Nothing subscribes, so nothing re-renders.
 * ------------------------------------------------------------------ */

export const scroll = {
  /** Document progress, 0 at the top and 1 at the very bottom. */
  progress: 0,
  /** Pixels scrolled. */
  y: 0,
  /** Lenis velocity — signed, roughly px per frame. */
  velocity: 0,
  /** Normalised |velocity|, eased, 0..1. Drives the 3D layer's reaction. */
  rush: 0,
}

export const pointer = {
  /** Raw pointer, -1..1 from the viewport centre. */
  x: 0,
  y: 0,
  /** The same values chased with a spring, which is what things actually
      follow — raw pointer movement is far too abrupt for this site. */
  ex: 0,
  ey: 0,
  /** True until the visitor moves a real pointer, so touch devices never
      sit at a frozen off-centre parallax. */
  idle: true,
}

/** Which chapter currently owns the frame. Written by the chapter
    triggers, read by the 3D layer to decide what to show. */
export const stage = {
  chapter: 'hero',
  /** 0..1 through the current chapter. */
  local: 0,
}

const lerp = (a, b, t) => a + (b - a) * t

/** Called once per rendered frame from the R3F loop. */
export function easeFrameState(dt) {
  // Frame-rate independent smoothing: the same feel at 60 and at 120 Hz.
  const k = 1 - Math.pow(0.0015, dt)
  pointer.ex = lerp(pointer.ex, pointer.idle ? 0 : pointer.x, k)
  pointer.ey = lerp(pointer.ey, pointer.idle ? 0 : pointer.y, k)
  const target = Math.min(1, Math.abs(scroll.velocity) / 45)
  scroll.rush = lerp(scroll.rush, target, 1 - Math.pow(0.02, dt))
}
