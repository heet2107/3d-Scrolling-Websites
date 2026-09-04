import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stage } from '../lib/store.js'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Claim the frame.
 *
 *  Whichever chapter is crossing the middle of the viewport owns two
 *  things: the page's ground and figure colours, and the `stage.chapter`
 *  the 3D layer reads to decide what should be floating.
 *
 *  Pulled out of <Chapter> so the footer can use it too. The footer is
 *  not a pinned track — it has no film and no scroll length — but it
 *  still has to take the page back to bone and tell the 3D layer to clear
 *  out, and without this it inherited the Finale's black.
 * ------------------------------------------------------------------ */
export function useChapterStage(ref, { id, ground, figure, start = 'top 55%', end = 'bottom 45%' }) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start,
        end,
        onToggle: (self) => {
          if (!self.isActive) return
          stage.chapter = id
          if (!ground) return
          gsap.to(document.body, {
            backgroundColor: ground,
            color: figure,
            duration: 1.1,
            ease: 'power2.inOut',
            overwrite: 'auto',
          })
        },
      })

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (stage.chapter === id) stage.local = self.progress
        },
      })
    }, el)

    return () => ctx.revert()
  }, [ref, id, ground, figure, start, end])
}
