import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useReducedMotion } from '../hooks/useMediaQuery.js'

/* A control that leans toward the cursor as it approaches, and returns
   when it leaves. Used once, on the one call to action — a page this
   restrained can afford exactly one flourish, and it should be on the
   thing you want pressed. */
export default function Magnetic({ children, strength = 0.35, radius = 90, className = '' }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return

    // quickTo compiles the tween once and then just sets a value, so this
    // is not allocating a tween per pointermove.
    const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'expo.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'expo.out' })

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      if (Math.hypot(dx, dy) > r.width / 2 + radius) {
        x(0)
        y(0)
        return
      }
      x(dx * strength)
      y(dy * strength)
    }
    const onLeave = () => {
      x(0)
      y(0)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(el)
    }
  }, [strength, radius, reduced])

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  )
}
