'use client'

import { useEffect } from 'react'
import { gsap } from '@/lib/gsap'

// Degrees of rotation at the element edges, per data-tilt flavor
const MAX_TILT = { soft: 5, default: 9, strong: 13 }

/**
 * Global 3D hover manager: any element carrying a `data-tilt` attribute
 * gets a cursor-following perspective tilt plus a lift (scale + shadow).
 * data-tilt="soft" | "strong" tunes the intensity; bare data-tilt is medium.
 * Renders nothing - it only wires listeners after the sections mount.
 */
export default function TiltEffects() {
  useEffect(() => {
    const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const cleanups = []

    document.querySelectorAll('[data-tilt]').forEach(el => {
      const max = MAX_TILT[el.dataset.tilt] ?? MAX_TILT.default
      // Transforms don't apply to inline boxes - blockify without moving layout
      if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block'
      gsap.set(el, { transformPerspective: 700 })
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.45, ease: 'power2.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.45, ease: 'power2.out' })

      function onMove(e) {
        const r  = el.getBoundingClientRect()
        const dx = (e.clientX - r.left) / r.width  - 0.5
        const dy = (e.clientY - r.top)  / r.height - 0.5
        ry(dx * max * 2)
        rx(-dy * max * 2)
      }

      function onEnter() {
        el.classList.add('tiltLifted')
        gsap.to(el, { scale: 1.04, z: 22, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      }

      function onLeave() {
        el.classList.remove('tiltLifted')
        rx(0)
        ry(0)
        gsap.to(el, { scale: 1, z: 0, duration: 0.55, ease: 'power3.out', overwrite: 'auto' })
      }

      el.addEventListener('mousemove',  onMove,  { passive: true })
      el.addEventListener('mouseenter', onEnter, { passive: true })
      el.addEventListener('mouseleave', onLeave, { passive: true })
      cleanups.push(() => {
        el.removeEventListener('mousemove',  onMove)
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => cleanups.forEach(fn => fn())
  }, [])

  return null
}
