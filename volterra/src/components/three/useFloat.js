import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { pointer, scroll, stage } from '../../lib/store.js'

const lerp = (a, b, t) => a + (b - a) * t

/* ------------------------------------------------------------------ *
 *  The one motion rule the floating layer obeys.
 *
 *  Every object in the 3D layer moves the same way, and all of it is
 *  small on purpose — the brief's word is "never distracting". Four
 *  inputs, in descending order of size:
 *
 *    drift     an endless slow figure, so nothing is ever truly still
 *    scroll    the object rises as its chapter passes, at its own rate,
 *              which is what sells depth against the film behind it
 *    pointer   a few degrees of lean, chased with a spring
 *    rush      a fast flick stretches the object very slightly along its
 *              travel, then it settles
 *
 *  Visibility is part of the same pass: an object belongs to a set of
 *  chapters and eases to and from nothing at the edges, so the layer is
 *  never suddenly populated.
 *
 *  Everything is written straight to the object3D. No component in this
 *  layer holds state, so scrolling the page re-renders nothing.
 * ------------------------------------------------------------------ */
export function useFloat(
  ref,
  {
    chapters = [],
    home = [0, 0, 0],
    /** Amplitude of the idle drift, in world units. */
    drift = 0.16,
    /** Seconds per drift cycle — deliberately long. */
    period = 14,
    /** How far the object travels as its chapter passes. */
    travel = 1.6,
    /** Degrees of pointer lean. */
    parallax = 0.09,
    /** Constant rotation, radians per second, per axis. */
    spin = [0, 0.05, 0],
    seed = 0,
    onVisibility,
  }
) {
  const vis = useRef(0)
  const t = useRef(seed * 37)

  useFrame((_, delta) => {
    const o = ref.current
    if (!o) return
    // Clamp: a backgrounded tab resumes with a huge delta and everything
    // would jump a full cycle.
    const dt = Math.min(delta, 1 / 20)
    t.current += dt

    const target = chapters.length === 0 || chapters.includes(stage.chapter) ? 1 : 0
    vis.current = lerp(vis.current, target, 1 - Math.pow(0.06, dt))
    onVisibility?.(vis.current)

    // Below a pixel of contribution there is nothing to see; skip the
    // transform work and let the material's opacity finish fading.
    if (vis.current < 0.002) {
      o.visible = false
      return
    }
    o.visible = true

    const w = (Math.PI * 2) / period
    const p = t.current * w

    const local = chapters.includes(stage.chapter) ? stage.local : 0.5
    const rise = (0.5 - local) * travel

    o.position.x = home[0] + Math.cos(p * 0.83 + seed) * drift + pointer.ex * parallax * 2.4
    o.position.y = home[1] + Math.sin(p + seed) * drift + rise + pointer.ey * parallax * -1.5
    o.position.z = home[2] + Math.sin(p * 0.61 + seed) * drift * 0.6

    o.rotation.x += spin[0] * dt
    o.rotation.y += spin[1] * dt

    // Pointer lean rides on top of the constant spin. Z is chased rather
    // than accumulated, so the object returns to level when the pointer
    // leaves instead of holding the last tilt.
    o.rotation.z = lerp(o.rotation.z, pointer.ex * -parallax * 0.9, 1 - Math.pow(0.05, dt))

    // A fast flick stretches the object along its travel and thins it
    // across — the same squash-and-stretch a physical object would show,
    // at about a twentieth of the amount you would use in animation.
    // The hook owns this group's scale, so objects set their own size on
    // the mesh inside rather than on the group.
    const stretch = 1 + scroll.rush * 0.05
    o.scale.set(vis.current / stretch, vis.current * stretch, vis.current / stretch)
  })

  return vis
}
