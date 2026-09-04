import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Chapter from '../components/Chapter.jsx'
import ScrollFilm from '../components/ScrollFilm.jsx'
import { films } from '../lib/media.js'
import { useReducedMotion, useIsCompact } from '../hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

const MARKS = [
  { label: 'GF / 00', at: '12%', side: 'left' },
  { label: 'Sect. A—A', at: '34%', side: 'right' },
  { label: '± 0.000', at: '58%', side: 'left' },
  { label: 'Scale 1:200', at: '78%', side: 'right' },
]

/* ------------------------------------------------------------------ *
 *  Blueprint.
 *
 *  The page is black and the drawing stands itself up: lines extrude into
 *  walls, clay becomes stone. The overlay is deliberately technical —
 *  a survey grid, four datum marks and nothing that could be called a
 *  headline until the last moment.
 *
 *  The grid is a repeating-linear-gradient rather than markup. Forty-odd
 *  lines as elements would be forty-odd layers to composite over a
 *  decoding video; as a background it is one.
 * ------------------------------------------------------------------ */
export default function Blueprint() {
  const stageRef = useRef(null)
  const gridRef = useRef(null)
  const markRef = useRef(null)
  const titleRef = useRef(null)
  const reduced = useReducedMotion()
  const compact = useIsCompact()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const track = stageRef.current?.closest('section')

      // The grid draws itself on, then retreats as the building takes
      // over — the drawing giving way to the thing drawn.
      gsap.fromTo(
        gridRef.current,
        { opacity: 0, scale: 1.12 },
        {
          opacity: 0.5,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: track, start: 'top bottom', end: 'top 20%', scrub: 1 },
        }
      )
      gsap.to(gridRef.current, {
        opacity: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: track, start: '45% center', end: 'bottom bottom', scrub: 1 },
      })

      gsap.fromTo(
        markRef.current?.querySelectorAll('[data-mark]') ?? [],
        { opacity: 0, x: (i) => (i % 2 ? 18 : -18) },
        {
          opacity: 0.55,
          x: 0,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: track, start: 'top 45%', once: true },
        }
      )

      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: track, start: '62% center', once: true },
        }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <Chapter id="blueprint" length={compact ? 3.4 : 4.4} ground="#0B0B0B" figure="#F7F5F2">
      {({ trackRef }) => (
        <div ref={stageRef} className="relative h-full w-full" style={{ background: '#070707' }}>
          <ScrollFilm
            film={films.blueprint}
            trackRef={trackRef}
            alt="A villa blueprint extruding upward into walls and columns, then resolving into a finished model"
            scrub={0.6}
          />

          <div
            ref={gridRef}
            className="gpu pointer-events-none absolute inset-0 opacity-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, rgb(247 245 242 / 0.16) 0 1px, transparent 1px 8.3333%),' +
                'repeating-linear-gradient(to bottom, rgb(247 245 242 / 0.16) 0 1px, transparent 1px 8.3333%)',
            }}
          />

          <div
            ref={markRef}
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{ color: '#F7F5F2' }}
          >
            {MARKS.map((m) => (
              <div
                key={m.label}
                data-mark
                className={`absolute flex items-center gap-3 ${reduced ? '' : 'opacity-0'}`}
                style={{
                  top: m.at,
                  [m.side]: 'var(--gutter)',
                  flexDirection: m.side === 'right' ? 'row-reverse' : 'row',
                }}
              >
                <span
                  className="block h-px w-10"
                  style={{ background: 'currentColor', opacity: 0.5 }}
                />
                <span className="label num">{m.label}</span>
              </div>
            ))}
          </div>

          {/* The model resolves to near-white and the copy is bone, so
              the lower-left corner is darkened under it. */}
          <div className="scrim-type-dark" />

          <div
            className="pointer-events-none absolute inset-0 flex flex-col justify-between gutter py-[max(5rem,10vh)]"
            style={{ color: '#F7F5F2' }}
          >
            <div className="flex items-start justify-between">
              <span className="label opacity-50">07 — Blueprint</span>
              <span className="label num opacity-50">Villa Sestri · 412 m²</span>
            </div>

            <div
              ref={titleRef}
              className={`gpu max-w-[22rem] ${reduced ? '' : 'opacity-0'}`}
            >
              <h2 className="display display-md mb-5">The drawing stands up.</h2>
              <p className="body-sm max-w-[36ch] opacity-60">
                Every project leaves this studio as a model before it leaves as a room. What you
                walk through was walked through here first.
              </p>
            </div>
          </div>
        </div>
      )}
    </Chapter>
  )
}
