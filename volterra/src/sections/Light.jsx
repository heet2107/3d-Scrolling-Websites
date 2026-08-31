import { useRef } from 'react'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { useIsCompact } from '../hooks/useMediaQuery.js'

/* ------------------------------------------------------------------ *
 *  Light — an interlude.
 *
 *  The shortest chapter in the film, and the only one that goes fully
 *  dark. It exists to reset the eye: after a bone-white living room, two
 *  viewports of near-black make the kitchen that follows read as brighter
 *  than it actually is. The pendant descends and lights itself as you
 *  scroll, which is the entire content of the chapter.
 * ------------------------------------------------------------------ */
export default function Light() {
  const stageRef = useRef(null)
  const compact = useIsCompact()

  return (
    <Chapter id="light" length={compact ? 2.2 : 2.6} ground="#141210" figure="#F7F5F2">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#0C0B0A' }}>
          <ScrollFilm
            film={films.light}
            trackRef={trackRef}
            alt="A brass and frosted-glass pendant descending and slowly lighting"
            scrub={0.6}
          />
          <div className="scrim-edge" />

          <div
            className="absolute inset-0 flex flex-col justify-between gutter py-[max(5rem,10vh)]"
            style={{ color: '#F7F5F2' }}
          >
            <span className="label opacity-50">03 — Light</span>

            <div className="max-w-[26rem] md:ml-auto md:text-right">
              <SplitText as="h2" className="display display-md" start="top 85%" stagger={0.12}>
                Light is the first material.
              </SplitText>
            </div>

            <p className="body-sm max-w-[34ch] opacity-55">
              Everything else in the house is chosen to answer it — which stone takes a low sun,
              which timber holds a lamp at nine in the evening.
            </p>
          </div>
        </div>
      )}
    </Chapter>
  )
}
