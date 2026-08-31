import { AnimatePresence, motion } from 'framer-motion'
import { CHAPTERS } from '../lib/constants.js'

/* ------------------------------------------------------------------ *
 *  The chapter index — mobile only.
 *
 *  On a page that is one continuous scroll, this list is the only
 *  navigation there is, so it takes the whole screen rather than
 *  hanging off the header as a dropdown.
 *
 *  This is the one place Framer Motion earns its place over GSAP: the
 *  sheet is genuinely unmounted when closed, and AnimatePresence is what
 *  lets a component animate on the way out after React has already
 *  decided it is gone. Doing that with GSAP means keeping the node
 *  mounted and tracking a "closing" state by hand.
 *
 *  It is loaded in its own chunk, after the curtain, so the library never
 *  touches the critical path — and on desktop, never loads at all.
 * ------------------------------------------------------------------ */

const EASE = [0.16, 1, 0.3, 1]

const sheet = {
  hidden: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE, staggerChildren: 0.045, delayChildren: 0.08 },
  },
  leaving: { opacity: 0, transition: { duration: 0.35, ease: EASE, when: 'afterChildren' } },
}

const row = {
  hidden: { y: '110%', opacity: 0 },
  shown: { y: '0%', opacity: 1, transition: { duration: 0.85, ease: EASE } },
  leaving: { y: '-60%', opacity: 0, transition: { duration: 0.28, ease: EASE } },
}

export default function ChapterIndex({ open, onSelect }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.nav
          key="index"
          variants={sheet}
          initial="hidden"
          animate="shown"
          exit="leaving"
          className="fixed inset-0 z-40 flex flex-col justify-center gutter md:hidden"
          style={{ background: 'var(--ground)', color: 'var(--figure)' }}
        >
          <ul>
            {CHAPTERS.map((c) => (
              <li key={c.id} className="overflow-hidden">
                <motion.button
                  variants={row}
                  onClick={() => onSelect(c.id)}
                  className="flex w-full items-baseline gap-4 py-2 text-left"
                >
                  <span className="label num opacity-40">{c.index}</span>
                  <span className="display text-[2.1rem] leading-none">{c.title}</span>
                </motion.button>
              </li>
            ))}
          </ul>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
