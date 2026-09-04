import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useChapterStage } from '../hooks/useChapterStage.js'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  A chapter of the film.
 *
 *  Structure is the same every time: a tall `track` that the page scrolls
 *  past, and a `stage` stuck to the top of the viewport inside it. The
 *  stage holds still while the track passes, which is the pin — done with
 *  position: sticky rather than ScrollTrigger's pin. Sticky is composited
 *  by the browser, needs no pin-spacer, and does not have to be
 *  re-measured every refresh, so it holds 60fps where a stack of eight
 *  pinned sections would not.
 *
 *  Handing off: consecutive chapters cross-fade over the last and first
 *  fifth of their tracks, so the eye never sees a cut — one camera move
 *  from the chair to the villa.
 *
 *  The chapter also owns the page's ground colour. Descending from the
 *  Overture to the Blueprint takes the whole document from bone to black,
 *  a chapter at a time, tweened on the same scrub as everything else.
 * ------------------------------------------------------------------ */
export default function Chapter({
  id,
  /** Track length as a multiple of the viewport. */
  length = 3,
  ground,
  figure,
  fade = true,
  className = '',
  stageClassName = '',
  children,
  enabled = true,
}) {
  const trackRef = useRef(null)
  const stageRef = useRef(null)

  // Ground colour and stage ownership, shared with the footer.
  useChapterStage(trackRef, { id, ground, figure })

  useEffect(() => {
    const track = trackRef.current
    const el = stageRef.current
    if (!track || !el || !fade || !enabled) return

    const ctx = gsap.context(() => {
      // The hand-off. Opacity only — a cross-fade between two composited
      // layers costs nothing, where animating a filter here would force a
      // full-frame repaint of a decoding video.
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: track,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        }
      )
      gsap.to(el, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: track,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, track)

    return () => ctx.revert()
  }, [fade, enabled])

  return (
    <section
      id={id}
      ref={trackRef}
      className={`relative ${className}`}
      style={{ height: `${length * 100}svh` }}
    >
      <div ref={stageRef} className={`stage ${stageClassName}`}>
        {typeof children === 'function' ? children({ trackRef, stageRef }) : children}
      </div>
    </section>
  )
}
