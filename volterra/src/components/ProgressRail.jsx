import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { scroll } from '../lib/store.js'

/* A hairline down the right edge that fills as the film runs. It is the
   only progress indicator on a page with no scrollbar worth looking at,
   and it is deliberately almost invisible until you are moving.

   Driven off the shared scroll store on GSAP's ticker rather than a React
   state update, so a full page of scrolling re-renders nothing. */
export default function ProgressRail() {
  const fill = useRef(null)
  const wrap = useRef(null)

  useEffect(() => {
    let shown = 0
    const tick = () => {
      const el = fill.current
      const box = wrap.current
      if (!el || !box) return
      el.style.transform = `scaleY(${scroll.progress.toFixed(4)})`
      // Fade the rail in while the page is moving and let it settle back
      // when it stops — present when useful, gone when not.
      const want = Math.min(1, 0.28 + Math.abs(scroll.velocity) * 0.05)
      shown += (want - shown) * 0.08
      box.style.opacity = shown.toFixed(3)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  return (
    <div
      ref={wrap}
      className="pointer-events-none fixed right-[max(1rem,2.4vw)] top-1/2 z-50 hidden h-[26vh] w-px -translate-y-1/2 md:block"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Track and fill are separate elements so the track can sit at a
          fraction of the fill's weight — one hairline of the page's own
          ink, one solid line of brass over it. */}
      <div className="absolute inset-0 opacity-[0.16]" style={{ background: 'currentColor' }} />
      <div
        ref={fill}
        className="absolute inset-x-0 top-0 h-full origin-top"
        style={{ background: 'var(--brass)', transform: 'scaleY(0)' }}
      />
    </div>
  )
}
