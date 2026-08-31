import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  The house reveal.
 *
 *  Nothing on this site fades in on its own. Every element arrives from
 *  under a mask, slightly low, slightly soft, and settles — one shape of
 *  motion used everywhere so the page reads as a single film rather than
 *  a stack of components that each animate their own way.
 *
 *  Elements are marked up already visible and are hidden here, from
 *  JavaScript, so the page is complete and readable if the script never
 *  runs.
 * ------------------------------------------------------------------ */

export const REVEAL = {
  duration: 1.5,
  ease: 'expo.out',
  stagger: 0.085,
}

export function useReveal(scopeRef, { enabled = true, start = 'top 82%', deps = [] } = {}) {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return

    if (!enabled) {
      // Reduced motion: leave the markup exactly as authored.
      gsap.set(scope.querySelectorAll('[data-reveal]'), { clearProps: 'all' })
      return
    }

    const ctx = gsap.context(() => {
      const groups = new Map()
      scope.querySelectorAll('[data-reveal]').forEach((el) => {
        const key = el.closest('[data-reveal-group]') || scope
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(el)
      })

      groups.forEach((els, key) => {
        gsap.set(els, { yPercent: 108, opacity: 0 })
        gsap.to(els, {
          yPercent: 0,
          opacity: 1,
          duration: REVEAL.duration,
          ease: REVEAL.ease,
          stagger: REVEAL.stagger,
          scrollTrigger: { trigger: key, start, once: true },
        })
      })
    }, scope)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeRef, enabled, start, ...deps])
}
