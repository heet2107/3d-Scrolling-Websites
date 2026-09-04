import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { STUDIO } from '../lib/constants.js'

/* ------------------------------------------------------------------ *
 *  The curtain.
 *
 *  A film should not open on a half-buffered frame. This holds the page
 *  on the studio's name until the hero clip has enough data to be
 *  scrubbed, then lifts — and while it is up, the document is locked so a
 *  visitor cannot scroll past the opening before it has begun.
 *
 *  It gives up after a few seconds. A slow connection should get a
 *  slightly rough opening, never a page that never starts.
 * ------------------------------------------------------------------ */
export default function Curtain({ onDone }) {
  const root = useRef(null)
  const bar = useRef(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    html.style.overflow = 'hidden'

    let lifted = false
    const lift = () => {
      if (lifted) return
      lifted = true
      html.style.overflow = ''

      gsap
        .timeline({
          onComplete: () => {
            setGone(true)
            onDone?.()
          },
        })
        .to(bar.current, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' })
        .to(root.current?.querySelectorAll('[data-curtain-type]') ?? [], {
          yPercent: -110,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.inOut',
          stagger: 0.05,
        })
        // The curtain leaves upward as one sheet, which reads as the first
        // camera move rather than as a loader disappearing.
        .to(root.current, { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, '-=0.45')
    }

    // Progress is a rough count of what has arrived, not a real byte
    // total — an honest-looking bar beats a fake precise one.
    const tl = gsap.to(bar.current, {
      scaleX: 0.82,
      duration: 3.2,
      ease: 'power2.out',
    })

    const hero = document.querySelector('video')
    const ready = () => hero && hero.readyState >= 3

    let raf
    const poll = () => {
      if (ready()) return lift()
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)

    // Hard ceiling. Nothing waits on the network forever.
    const bail = setTimeout(lift, 4200)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(bail)
      tl.kill()
      html.style.overflow = ''
    }
  }, [onDone])

  if (gone) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col justify-between gutter py-[max(1.5rem,5vh)]"
      style={{ background: '#101010', color: '#F7F5F2' }}
    >
      <div className="flex items-baseline justify-between">
        <span data-curtain-type className="label tracking-wide2">
          {STUDIO.name}
        </span>
        <span data-curtain-type className="label opacity-50">
          Est. 2009 — Volterra, IT
        </span>
      </div>

      <div className="overflow-hidden">
        <p data-curtain-type className="display display-md max-w-[16ch]">
          A house is a sequence of rooms.
        </p>
      </div>

      <div>
        <div className="mb-4 h-px w-full" style={{ background: 'rgb(247 245 242 / 0.18)' }}>
          <div
            ref={bar}
            className="h-full origin-left"
            style={{ background: '#A98D67', transform: 'scaleX(0.04)' }}
          />
        </div>
        <span data-curtain-type className="label opacity-50">
          {STUDIO.role}
        </span>
      </div>
    </div>
  )
}
