import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Bedroom.
 *
 *  The calmest chapter, and the only one where the type deliberately
 *  arrives late. The bed assembles itself across the first two thirds of
 *  the track with nothing on screen but the film and a chapter number;
 *  the words only come once it has finished putting itself together. A
 *  headline over a bed mid-assembly would be asking the eye to do two
 *  things at once.
 *
 *  The chapter opens behind curtains: two panels drawn back off a
 *  clip-path, which is the one literal gesture in the whole film and is
 *  over in a second and a half.
 * ------------------------------------------------------------------ */
export default function Bedroom() {
  const stageRef = useRef(null)
  const typeRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const veilRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const track = stageRef.current?.closest('section')

      // Curtains. Two solid panels sliding apart, scrubbed over the first
      // half viewport so it is tied to the scroll rather than played at
      // it.
      gsap.to([leftRef.current, rightRef.current], {
        xPercent: (i) => (i === 0 ? -101 : 101),
        ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 92%', end: 'top 18%', scrub: 1 },
      })

      // Type in, after the bed is whole — 68% of the way through the
      // track, which is where the assembly resolves.
      //
      // A veil of the chapter's own ground colour comes up underneath it.
      // The film here is warm and bright and the type is ink, and there is
      // no corner of this frame dark enough to set ink on; washing the
      // whole image back reads as the light going soft, and it is the only
      // way the headline holds contrast over a frame that keeps changing.
      gsap.fromTo(
        veilRef.current,
        { opacity: 0 },
        {
          opacity: 0.62,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: track, start: '62% center', once: true },
        }
      )

      gsap.fromTo(
        typeRef.current,
        { opacity: 0, y: 34, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: track, start: '68% center', once: true },
        }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="bedroom" length={compact ? 3.2 : 4} ground="#EAE3D9" figure="#151515">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#E4DBCF' }}>
          <ScrollFilm
            film={films.bedroom}
            trackRef={trackRef}
            alt="A king-size bed assembling itself from its frame, mattress, headboard and cushions"
            scrub={0.65}
          />

          {/* A warm morning wash over the frame. Multiply keeps the film's
              own highlights intact instead of flattening them. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: '#C8A97C', opacity: 0.12, mixBlendMode: 'multiply' }}
          />

          {/* Under reduced motion the veil is simply already up: the type
              is shown immediately, so the contrast it depends on has to be
              there immediately too. */}
          <div
            ref={veilRef}
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: '#EAE3D9', opacity: reduced ? 0.62 : 0 }}
          />

          {!reduced && (
            <>
              <div
                ref={leftRef}
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 gpu"
                style={{ background: '#EAE3D9' }}
              />
              <div
                ref={rightRef}
                className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2 gpu"
                style={{ background: '#EAE3D9' }}
              />
            </>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gutter py-[max(5rem,10vh)]">
            <span className="label opacity-55">05 — Bedroom</span>

            <div ref={typeRef} className="gpu max-w-[44rem] md:mx-auto md:text-center">
              <SplitText
                as="h2"
                className="display display-md mb-6"
                start="top 96%"
                stagger={0.1}
              >
                Built quietly, to be woken in.
              </SplitText>
              <p className="body-sm mx-auto max-w-[38ch] opacity-65">
                Walnut, linen and lime plaster. Nothing in the room reflects, so the first light
                of the day has somewhere soft to land.
              </p>
            </div>

            <div className="flex items-end justify-between">
              <span className="label opacity-45">Aman-quiet</span>
              <span className="label hidden opacity-45 md:block">Walnut · Linen · Lime</span>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
