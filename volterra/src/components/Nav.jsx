import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { STUDIO, CHAPTERS } from '../lib/constants.js'
import { scrollToChapter } from '../hooks/useSmoothScroll.js'

/* Mobile only, and never on the critical path. The import is warmed on
   first touch of the Index control so the sheet is already in memory by
   the time the tap resolves. */
const ChapterIndex = lazy(() => import('./ChapterIndex.jsx'))

gsap.registerPlugin(ScrollTrigger)

/* Minimal chrome. The wordmark, the chapter you are in, and a way to
   reach the studio — nothing else competes with the film.

   It inherits `currentColor` from <body>, which the chapters tween from
   ink to bone and back, so the nav is legible over a bone page and over a
   black one without ever being told which it is on. */
export default function Nav() {
  const ref = useRef(null)
  const [chapter, setChapter] = useState(CHAPTERS[0])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { yPercent: -140, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out', delay: 2.4 }
      )
    })

    const triggers = CHAPTERS.map((c) => {
      const el = document.getElementById(c.id)
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => self.isActive && setChapter(c),
      })
    }).filter(Boolean)

    return () => {
      ctx.revert()
      triggers.forEach((t) => t.kill())
    }
  }, [])

  const go = (id) => {
    setOpen(false)
    scrollToChapter(id)
  }

  return (
    <>
      <header
        ref={ref}
        className="fixed inset-x-0 top-0 z-50 gutter mix-blend-difference"
        style={{ color: '#F7F5F2' }}
      >
        <div className="flex items-center justify-between py-5 md:py-7">
          <button
            onClick={() => go('hero')}
            className="label tracking-wide2 no-select"
            aria-label={`${STUDIO.name} — back to the top`}
          >
            {STUDIO.name}
          </button>

          {/* The chapter counter. It is the only moving part in the nav,
              and it is how you know where you are in a page with no
              sections to scroll back to. */}
          <div className="hidden items-baseline gap-3 md:flex">
            <span className="label num opacity-55">{chapter.index}</span>
            <span className="label">{chapter.title}</span>
            <span className="label num opacity-40">
              / {String(CHAPTERS.length).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => go('contact')}
              className="label hidden transition-opacity duration-500 hover:opacity-55 md:block"
            >
              Contact
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              onPointerDown={() => import('./ChapterIndex.jsx')}
              className="label md:hidden"
              aria-expanded={open}
              aria-haspopup="menu"
            >
              {open ? 'Close' : 'Index'}
            </button>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <ChapterIndex open={open} onSelect={go} />
      </Suspense>
    </>
  )
}
