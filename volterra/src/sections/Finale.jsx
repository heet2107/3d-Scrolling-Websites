import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import Magnetic from '../components/Magnetic.jsx'
import { films } from '../lib/media.js'
import { scrollToChapter } from '../hooks/useSmoothScroll.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Finale.
 *
 *  Everything the film has shown separately arrives at once and builds
 *  the house. Three beats of type ride over it, each holding the frame
 *  alone before handing to the next — at most one is ever legible, so a
 *  fast scroll cross-fades rather than stacking three headlines on top of
 *  each other.
 *
 *  The beats are driven by a single scrubbed timeline instead of three
 *  independent triggers. One timeline cannot get out of order with
 *  itself; three triggers racing each other can, and does, on a flick.
 * ------------------------------------------------------------------ */
export default function Finale() {
  const stageRef = useRef(null)
  const beatsRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (reduced) return
    const beats = beatsRef.current?.querySelectorAll('[data-beat]')
    if (!beats?.length) return

    const ctx = gsap.context(() => {
      gsap.set(beats, { opacity: 0, y: 40, filter: 'blur(12px)' })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current?.closest('section'),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.9,
        },
      })

      beats.forEach((beat, i) => {
        const at = i * 1.1
        tl.to(beat, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out' }, at)
        // The last beat is the call to action — it stays.
        if (i < beats.length - 1) {
          tl.to(
            beat,
            { opacity: 0, y: -34, filter: 'blur(12px)', duration: 0.45, ease: 'power2.in' },
            at + 0.72
          )
        }
      })
    }, stageRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="finale" length={compact ? 4 : 5} ground="#101010" figure="#F7F5F2">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#0A0A0A' }}>
          <ScrollFilm
            film={films.finale}
            trackRef={trackRef}
            alt="Furniture suspended in an architectural void flying into position to complete a villa interior"
            scrub={0.7}
          />
          <div className="scrim-edge" />
          <div className="scrim-base" />

          <div
            className="absolute inset-0 flex flex-col justify-between gutter py-[max(5rem,10vh)]"
            style={{ color: '#F7F5F2' }}
          >
            <span className="label opacity-50">08 — The Villa</span>

            {/* The beats share one grid cell so they occupy the same space
                and cross-fade in place — but only while there is a timeline
                to cross-fade them. Under reduced motion nothing hides any of
                them, so three headlines would print on top of each other;
                there they lay out as an ordinary stacked column instead. */}
            <div
              ref={beatsRef}
              className={
                reduced
                  ? 'flex flex-col items-center gap-8 text-center'
                  : 'grid place-items-center text-center'
              }
            >
              <h2
                data-beat
                className="display display-lg gpu"
                style={{ gridArea: reduced ? undefined : '1 / 1' }}
              >
                Designed For Living.
              </h2>

              <p
                data-beat
                className="display display-lg gpu"
                style={{ gridArea: reduced ? undefined : '1 / 1' }}
              >
                Our Spaces Tell Stories.
              </p>

              <div data-beat className="gpu" style={{ gridArea: reduced ? undefined : '1 / 1' }}>
                <Magnetic>
                  <button
                    onClick={() => scrollToChapter('contact')}
                    className="group relative inline-flex items-center gap-5 px-1 py-3"
                  >
                    <span className="display text-[clamp(2rem,5.4vw,4.6rem)] leading-none">
                      Start Your Project
                    </span>
                    <span
                      className="block h-px w-10 origin-left transition-transform duration-700 ease-keynote group-hover:scale-x-[1.9] md:w-16"
                      style={{ background: 'currentColor' }}
                    />
                  </button>
                </Magnetic>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <span className="label opacity-45">Villa Sestri</span>
              <span className="label hidden opacity-45 md:block">Completed 2025</span>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
