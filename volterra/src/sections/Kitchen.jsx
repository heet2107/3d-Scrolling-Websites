import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

const SPEC = [
  ['Slab', 'Calacatta Oro, single block'],
  ['Edge', 'Waterfall, mitred at 45°'],
  ['Fittings', 'Unlacquered brass'],
  ['Span', '4.2 m, unsupported'],
]

/* ------------------------------------------------------------------ *
 *  Kitchen.
 *
 *  The island floats above the page: the film is inset, lifted on a long
 *  soft shadow, and it travels a little slower than the type around it so
 *  it never quite sits on the same plane as the page.
 *
 *  The heading enters from the left as a masked wipe rather than a slide —
 *  the words are already in place and the mask uncovers them, so nothing
 *  moves through space to get where it is going.
 * ------------------------------------------------------------------ */
export default function Kitchen() {
  const stageRef = useRef(null)
  const plateRef = useRef(null)
  const headRef = useRef(null)
  const specRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const track = stageRef.current?.closest('section')

      // The camera enters the kitchen: a long, even push across the whole
      // chapter with a touch of rotation, so the island turns into the
      // frame rather than at the centre of it.
      gsap.fromTo(
        plateRef.current,
        { scale: 0.86, rotate: -1.4, yPercent: 4 },
        {
          scale: 1.06,
          rotate: 0,
          yPercent: -4,
          ease: 'none',
          scrollTrigger: { trigger: track, start: 'top bottom', end: 'bottom top', scrub: 1 },
        }
      )

      // Heading wipe. clip-path is composited, so this is free next to
      // animating width.
      gsap.fromTo(
        headRef.current,
        { clipPath: 'inset(0 100% 0 0)', xPercent: -4 },
        {
          clipPath: 'inset(0 0% 0 0)',
          xPercent: 0,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: track, start: 'top 55%', once: true },
        }
      )

      gsap.fromTo(
        specRef.current?.querySelectorAll('[data-spec]') ?? [],
        { opacity: 0, x: -18 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: track, start: 'top 42%', once: true },
        }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="kitchen" length={compact ? 3.2 : 4} ground="#EFEAE3" figure="#151515">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#EFEAE3' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={plateRef}
              className="gpu relative overflow-hidden"
              style={{
                width: compact ? '92vw' : '68vw',
                height: compact ? '46svh' : '64svh',
                borderRadius: '2px',
                // A single long shadow is what lifts the plate off the
                // page. No border, no gradient — just distance.
                boxShadow: '0 60px 120px -40px rgb(21 21 21 / 0.42)',
              }}
            >
              <ScrollFilm
                film={films.kitchen}
                trackRef={trackRef}
                alt="A marble kitchen island turning as its slabs separate and realign"
                scrub={0.6}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gutter py-[max(5rem,10vh)]">
            <div className="flex items-start justify-between">
              <span className="label opacity-55">04 — Kitchen</span>
              <span className="label hidden opacity-55 md:block">One block, four metres</span>
            </div>

            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div ref={headRef} className="gpu max-w-[19rem]">
                <h2 className="display display-md">A single piece of stone.</h2>
              </div>

              {/* A spec table, set like a drawing's title block. Tabular
                  numerals so the column edges line up. */}
              <dl ref={specRef} className="min-w-[16rem] max-w-[22rem] md:text-right">
                {SPEC.map(([k, v]) => (
                  <div
                    key={k}
                    data-spec
                    className="flex items-baseline justify-between gap-6 border-t py-2.5"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <dt className="label opacity-45">{k}</dt>
                    <dd className="body-sm num">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
