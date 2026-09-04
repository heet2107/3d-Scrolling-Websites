import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { STUDIO } from '../lib/constants.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Overture.
 *
 *  The chair turns, comes apart and puts itself back together across four
 *  viewports of scroll — the whole clip, scrubbed. The headline is set
 *  over it and leaves before the chair is done, rising and softening so
 *  the frame is clear for the Living Room to arrive underneath.
 *
 *  This is the only chapter whose type plays on a timer rather than on a
 *  trigger: it is already on screen when the curtain lifts, so it waits
 *  for `ready` instead of for a scroll position that will never come.
 * ------------------------------------------------------------------ */
export default function Hero({ ready }) {
  const stageRef = useRef(null)
  const typeRef = useRef(null)
  const cueRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (!ready || reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cueRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', delay: 1.9 }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [ready, reduced])

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // The headline leaves on the first viewport of scroll: up, soft and
      // slightly smaller, as though the camera pulled focus past it.
      gsap.to(typeRef.current, {
        yPercent: -34,
        opacity: 0,
        filter: 'blur(14px)',
        scale: 0.94,
        ease: 'none',
        scrollTrigger: {
          trigger: stageRef.current?.closest('section'),
          start: 'top top',
          end: '38% top',
          scrub: 0.8,
        },
      })
      gsap.to(cueRef.current, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: stageRef.current?.closest('section'),
          start: 'top top',
          end: '12% top',
          scrub: true,
        },
      })
    }, stageRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="hero" length={compact ? 3.2 : 4} ground="#F7F5F2" figure="#151515" fade={false}>
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#101010' }}>
          <ScrollFilm
            film={films.hero}
            trackRef={trackRef}
            eager
            alt="A marble lounge chair turning in a dark void, separating into its parts and reassembling"
            scrub={0.7}
          />
          <div className="scrim-edge" />
          <div className="scrim-base" />

          <div
            className="absolute inset-0 flex flex-col justify-between gutter py-[max(5.5rem,12vh)]"
            style={{ color: '#F7F5F2' }}
          >
            <div />

            <div ref={typeRef} className="gpu">
              <SplitText
                as="h1"
                mode="chars"
                variant="punch"
                className="display display-xl no-select"
                play={ready}
                delay={0.15}
                stagger={0.035}
                start="top bottom"
              >
                We Design Experiences.
              </SplitText>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6">
              <p className="label opacity-70">{STUDIO.role}</p>
              {/* Hidden from CSS only when something is going to come
                  along and reveal it. Under reduced motion the GSAP pass
                  never runs, and a class-hidden element would simply stay
                  gone. */}
              <div
                ref={cueRef}
                className={`flex items-center gap-3 ${reduced ? '' : 'opacity-0'}`}
              >
                <span className="label opacity-70">Scroll to enter</span>
                <span
                  className="block h-px w-12 origin-left"
                  style={{ background: 'currentColor', opacity: 0.5 }}
                />
              </div>
              <p className="label hidden opacity-70 md:block">Est. 2009 — Volterra, IT</p>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
