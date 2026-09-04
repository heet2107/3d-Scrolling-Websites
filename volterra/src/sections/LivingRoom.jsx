import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

const COPY = [
  'A living room is the one space a house cannot fake.',
  'It has to hold a Tuesday evening as well as it holds a dinner for twelve — so we build it around the light it already has, and let the stone do the talking.',
]

/* ------------------------------------------------------------------ *
 *  Living Room.
 *
 *  The travertine table turns and comes apart while the frame very slowly
 *  closes in on it. Two moves are layered here and neither is large: the
 *  film scales about six percent across the chapter, and the type column
 *  travels up faster than the film behind it. The gap between those two
 *  rates is the whole effect — it is what makes a flat video read as a
 *  room with depth.
 * ------------------------------------------------------------------ */
export default function LivingRoom() {
  const stageRef = useRef(null)
  const filmRef = useRef(null)
  const copyRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const track = stageRef.current?.closest('section')

      // Camera push. Scale only — no width/height, nothing that reflows.
      gsap.fromTo(
        filmRef.current,
        { scale: 1.085 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: track, start: 'top bottom', end: 'bottom top', scrub: 1 },
        }
      )

      // The lighting shift the brief asks for, done as a slow warm-to-neutral
      // grade rather than a colour wash — it is barely nameable while it
      // happens, which is the point.
      gsap.fromTo(
        filmRef.current,
        { filter: 'saturate(0.72) brightness(0.86) contrast(1.06)' },
        {
          filter: 'saturate(1) brightness(1) contrast(1)',
          ease: 'none',
          scrollTrigger: { trigger: track, start: 'top center', end: 'center center', scrub: 1 },
        }
      )

      gsap.fromTo(
        copyRef.current,
        { yPercent: 16 },
        {
          yPercent: -16,
          ease: 'none',
          scrollTrigger: { trigger: track, start: 'top bottom', end: 'bottom top', scrub: 1 },
        }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="living" length={compact ? 3 : 3.6} ground="#F1EDE7" figure="#151515">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#EFEAE3' }}>
          {/* The film sits inset rather than full-bleed, so the page's own
              ground frames it — an editorial plate on a paper page, not a
              background video. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={filmRef}
              className="gpu relative overflow-hidden"
              style={{
                width: 'min(100%, 96vw)',
                height: compact ? '58svh' : '76svh',
                borderRadius: '2px',
              }}
            >
              <ScrollFilm
                film={films.living}
                trackRef={trackRef}
                alt="A travertine coffee table turning as its top lifts away from the base and returns"
                scrub={0.6}
              />
              <div className="scrim-edge" style={{ opacity: 0.5 }} />
            </div>
          </div>

          {/* Between the film and the type: the copy sits at lower left
              over a frame whose brightness changes as it scrubs. */}
          <div className="scrim-type-light" />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gutter py-[max(5rem,10vh)]">
            <div className="flex items-start justify-between">
              <span className="label opacity-55">02 — Living Room</span>
              <span className="label hidden opacity-55 md:block">Calacatta · Travertine · Oak</span>
            </div>

            {/* Measures are set in rem, not ch. A ch on a container is
                read against that container's own font-size — body size
                here — so a ch measure meant for a 90px headline came out
                as a 180px column and broke the line every two words. */}
            <div ref={copyRef} className="gpu max-w-[23rem]">
              <SplitText
                as="h2"
                className="display display-md mb-7"
                start="top 88%"
                stagger={0.11}
              >
                Rooms that keep their silence.
              </SplitText>

              {/* Line by line, one behind the next — a paragraph that
                  arrives at reading speed rather than all at once. */}
              <div className="space-y-3">
                {COPY.map((line, i) => (
                  <SplitText
                    key={i}
                    as="p"
                    className="body-sm max-w-[42ch] opacity-70"
                    delay={0.12 + i * 0.12}
                    stagger={0.07}
                    start="top 90%"
                  >
                    {line}
                  </SplitText>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
