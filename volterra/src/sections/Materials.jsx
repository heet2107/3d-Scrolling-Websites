import { useCallback, useRef, useState } from 'react'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import SplitText from '../components/SplitText.jsx'
import { films } from '../lib/media.js'
import { MATERIALS } from '../lib/constants.js'
import { useIsCompact, useReducedMotion } from '../hooks/useMediaQuery.js'

/* ------------------------------------------------------------------ *
 *  Materials.
 *
 *  The page goes to plain white here — the only chapter that does. It is
 *  a specimen board, not a room, and it should feel like the film has cut
 *  to a studio wall.
 *
 *  The cube turns through its six finishes as you scroll and the list
 *  beside it follows: the row matching the face currently showing is the
 *  one lit. The index comes from the film's own scrub progress, so the
 *  label and the frame can never drift apart.
 *
 *  Progress fires every frame; the state only changes six times. The
 *  guard below is what keeps that from becoming sixty re-renders a
 *  second.
 * ------------------------------------------------------------------ */
export default function Materials() {
  const stageRef = useRef(null)
  const [active, setActive] = useState(0)
  const compact = useIsCompact()
  const reduced = useReducedMotion()

  const onProgress = useCallback((p) => {
    // The clip opens and closes on a full face, so the first and last
    // sixth are held rather than scanned — this maps the middle of the
    // scrub across the six finishes.
    const i = Math.min(MATERIALS.length - 1, Math.max(0, Math.floor(p * MATERIALS.length)))
    setActive((prev) => (prev === i ? prev : i))
  }, [])

  return (
    <Chapter id="materials" length={compact ? 4 : 5} ground="#FFFFFF" figure="#151515">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#FFFFFF' }}>
          {/* This chapter is the one that has to fit a whole list inside a
              single viewport, so its vertical rhythm is set tighter on a
              phone than anywhere else on the site. At 844px tall the
              padding, the specimen, the heading and six rows come to more
              than the screen at the desktop measurements, and the last two
              materials fall off the bottom of a stage that cannot scroll. */}
          <div className="absolute inset-0 flex flex-col gutter py-[max(3.25rem,6.5vh)] md:py-[max(4.5rem,9vh)]">
            <div className="flex items-start justify-between">
              <span className="label opacity-55">06 — Materials</span>
              <span className="label num opacity-40">
                {String(active + 1).padStart(2, '0')} / {String(MATERIALS.length).padStart(2, '0')}
              </span>
            </div>

            <div className="grid flex-1 items-center gap-4 md:grid-cols-[1.1fr_1fr] md:gap-16">
              {/* The specimen. */}
              <div
                className="relative overflow-hidden"
                style={{ height: compact ? '25svh' : '62svh', borderRadius: '2px' }}
              >
                <ScrollFilm
                  film={films.materials}
                  trackRef={trackRef}
                  alt="A cube turning as each face changes between marble, walnut, travertine, glass, brass and concrete"
                  scrub={0.55}
                  onProgress={onProgress}
                />
              </div>

              {/* The board. */}
              <div>
                <SplitText
                  as="h2"
                  className="display display-md mb-4 md:mb-12"
                  start="top 82%"
                  stagger={0.1}
                >
                  Six finishes, one house.
                </SplitText>

                <ul>
                  {MATERIALS.map((m, i) => {
                    // With no scrub there is no active face to follow, so
                    // every row reads at full strength rather than leaving
                    // five of the six permanently dimmed.
                    const on = reduced || i === active
                    return (
                      <li
                        key={m.key}
                        className="border-t"
                        style={{ borderColor: 'var(--rule)' }}
                        aria-current={on ? 'true' : undefined}
                      >
                        <div
                          className="flex items-baseline gap-4 py-2 md:py-4"
                          style={{
                            opacity: on ? 1 : 0.3,
                            transform: `translateX(${on ? (compact ? 6 : 14) : 0}px)`,
                            transition:
                              'opacity 0.75s var(--ease-keynote), transform 0.75s var(--ease-keynote)',
                          }}
                        >
                          <span className="label num opacity-50">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="display text-[clamp(1.5rem,3.2vw,2.6rem)] leading-none">
                            {m.name}
                          </span>
                          <span className="ml-auto hidden text-right md:block">
                            <span className="label block opacity-50">{m.origin}</span>
                          </span>
                        </div>

                        {/* The note only opens on the active row, so the
                            list stays a list and still says something. */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateRows: on ? '1fr' : '0fr',
                            opacity: on ? 0.6 : 0,
                            transition:
                              'grid-template-rows 0.75s var(--ease-keynote), opacity 0.75s var(--ease-keynote)',
                          }}
                        >
                          <p className="body-sm overflow-hidden pb-2 pl-10 md:pb-3">{m.note}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="border-t" style={{ borderColor: 'var(--rule)' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
