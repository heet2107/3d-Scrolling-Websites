import { useRef } from 'react'
import { FiArrowUpRight } from 'react-icons/fi'
import SplitText from '../components/SplitText.jsx'
import { STUDIO, CHAPTERS } from '../lib/constants.js'
import { scrollToChapter } from '../hooks/useSmoothScroll.js'
import { useReveal } from '../hooks/useReveal.js'
import { useChapterStage } from '../hooks/useChapterStage.js'
import { useReducedMotion } from '../hooks/useMediaQuery.js'

/* ------------------------------------------------------------------ *
 *  Contact.
 *
 *  The only chapter with no film and no scroll track — after eight
 *  pinned stages the page finally lets go, and that release is the point.
 *  Back on bone, back to normal scrolling, everything you need to reach
 *  the studio and nothing else.
 *
 *  The wordmark is set to the full width of the page as the last image in
 *  the film.
 * ------------------------------------------------------------------ */
export default function Contact() {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  // Takes the page back to bone and clears the 3D layer — no object
  // belongs to 'contact', so the floating layer eases itself out as the
  // footer arrives.
  useChapterStage(ref, { id: 'contact', ground: '#F7F5F2', figure: '#151515', start: 'top 75%' })
  useReveal(ref, { enabled: !reduced, start: 'top 88%' })

  const line = (label, value, href) => (
    <div data-reveal-group className="border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
      <span className="label mb-2 block opacity-45">
        <span data-reveal className="block">{label}</span>
      </span>
      {href ? (
        <a
          href={href}
          className="body-sm inline-flex items-baseline gap-1.5 transition-opacity duration-500 hover:opacity-55"
        >
          <span data-reveal className="block">{value}</span>
        </a>
      ) : (
        <span className="body-sm block">
          <span data-reveal className="block">{value}</span>
        </span>
      )}
    </div>
  )

  return (
    <footer
      id="contact"
      ref={ref}
      className="relative z-10 flex min-h-svh flex-col justify-between gutter pb-[max(1.5rem,4vh)] pt-[max(6rem,16vh)]"
    >
      <div className="max-w-[26rem]">
        <SplitText as="h2" className="display display-md mb-6" start="top 88%" stagger={0.1}>
          Tell us about the house.
        </SplitText>
        <p className="body-sm max-w-[40ch] opacity-65">
          We take on four projects a year. Write with the address, the light and roughly when you
          would like to be living in it.
        </p>
      </div>

      <div className="my-14 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {line('Email', STUDIO.email, `mailto:${STUDIO.email}`)}
        {line('Telephone', STUDIO.phone, `tel:${STUDIO.phone.replace(/\s/g, '')}`)}

        <div data-reveal-group className="border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
          <span className="label mb-2 block opacity-45">
            <span data-reveal className="block">Studio</span>
          </span>
          <address className="body-sm not-italic">
            {STUDIO.address.map((l) => (
              <span key={l} className="block overflow-hidden">
                <span data-reveal className="block">{l}</span>
              </span>
            ))}
          </address>
        </div>

        <div data-reveal-group className="border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
          <span className="label mb-2 block opacity-45">
            <span data-reveal className="block">Elsewhere</span>
          </span>
          <ul className="body-sm">
            {STUDIO.social.map((s) => (
              <li key={s.label} className="overflow-hidden">
                <a
                  data-reveal
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1 transition-opacity duration-500 hover:opacity-55"
                >
                  {s.label}
                  <FiArrowUpRight
                    aria-hidden="true"
                    className="translate-y-px transition-transform duration-500 ease-keynote group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The wordmark, set to the measure of the page. */}
      <div>
        <nav className="mb-10 flex flex-wrap gap-x-7 gap-y-2">
          {CHAPTERS.slice(0, -1).map((c) => (
            <button
              key={c.id}
              onClick={() => scrollToChapter(c.id)}
              className="label opacity-45 transition-opacity duration-500 hover:opacity-100"
            >
              {c.title}
            </button>
          ))}
        </nav>

        <div className="overflow-hidden">
          <h2
            data-reveal
            className="display block w-full leading-[0.78] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(4rem, 21.5vw, 22rem)' }}
          >
            {STUDIO.name}
          </h2>
        </div>

        <div
          className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span className="label opacity-40">
            © {new Date().getFullYear()} {STUDIO.name} — {STUDIO.role}
          </span>
          <span className="label opacity-40">All work shown is a studio exercise</span>
        </div>
      </div>
    </footer>
  )
}
