import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scroll } from '../lib/store.js'

gsap.registerPlugin(ScrollTrigger)

/* Held at module scope so anchor navigation can hand the scroll to Lenis
   rather than starting a second, competing animation. */
let instance = null

/* ------------------------------------------------------------------ *
 *  One clock for the whole site.
 *
 *  Lenis, GSAP and ScrollTrigger each want to own the frame loop. Left
 *  alone they run on three separate rAF callbacks and the film scrub ends
 *  up a frame or two behind the type — exactly the kind of "nearly
 *  synchronised" that reads as broken.
 *
 *  So GSAP's ticker becomes the only rAF in the app: it drives Lenis,
 *  Lenis tells ScrollTrigger the position moved, and lag smoothing is off
 *  so a slow frame stretches time instead of jumping over it.
 *
 *  Lenis scrolls the window itself, so ScrollTrigger needs no
 *  scrollerProxy — it reads the same scrollY everyone else does.
 * ------------------------------------------------------------------ */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      // Reduced motion: no interpolation. ScrollTrigger still runs, so the
      // chapters still hand off — they just do it instantly.
      const onNative = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight
        scroll.y = window.scrollY
        scroll.velocity = 0
        scroll.progress = limit > 0 ? window.scrollY / limit : 0
      }
      onNative()
      window.addEventListener('scroll', onNative, { passive: true })
      ScrollTrigger.refresh()
      return () => window.removeEventListener('scroll', onNative)
    }

    const lenis = new Lenis({
      duration: 1.15,
      // A long, decelerating tail — the same curve the type moves on.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch keeps the platform's own physics. Interpolated touch scrolling
      // feels laggy on phones and fights momentum.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })
    instance = lenis

    const onScroll = ({ scroll: y, limit, velocity }) => {
      scroll.y = y
      scroll.velocity = velocity
      scroll.progress = limit > 0 ? y / limit : 0
      ScrollTrigger.update()
    }
    lenis.on('scroll', onScroll)

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.off('scroll', onScroll)
      lenis.destroy()
      instance = null
    }
  }, [enabled])
}

/** Scroll to a chapter by id — through Lenis when it is running, natively
    when it is not (reduced motion), so there is only ever one animation. */
export function scrollToChapter(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (instance) {
    instance.scrollTo(el, { offset: 0, duration: 1.6 })
    return
  }
  el.scrollIntoView({ behavior: 'auto', block: 'start' })
}
