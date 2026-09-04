import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ *
 *  Drive video.currentTime from scroll position.
 *
 *  The naive version — assign currentTime inside a scroll listener —
 *  fails three ways, and each one is handled here:
 *
 *  1. Scroll events are jerky. A wheel notch is a step, not a ramp, so
 *     the film lurches. Fix: never write the scroll value straight to the
 *     video. GSAP tweens a proxy number with `scrub`, which gives the
 *     value momentum and a decelerating tail, and the video reads the
 *     proxy. This is the single biggest contributor to the scrub feeling
 *     expensive rather than mechanical.
 *
 *  2. Seeks queue up. Assigning currentTime while the decoder is still
 *     seeking stacks requests until it stalls. Fix: skip the write while
 *     `video.seeking` is true — the proxy keeps advancing, and the next
 *     tick lands on the newer, more correct time. Dropping a seek is free;
 *     queueing one is not.
 *
 *  3. Sub-frame writes are wasted work. Fix: ignore a target closer than
 *     half a frame to where the video already is.
 *
 *  The films are encoded all-intra (see build/encode-films.sh), so each
 *  seek resolves on the frame itself rather than decoding forward from a
 *  distant keyframe. Without that, none of the above is enough.
 * ------------------------------------------------------------------ */

const FRAME = 1 / 24 // the films are 24fps

export function useScrollFilm(videoRef, trackRef, options = {}) {
  const {
    start = 'top top',
    end = 'bottom bottom',
    scrub = 0.6,
    /** Portion of the clip to play across this track, 0..1. */
    from = 0,
    to = 1,
    enabled = true,
    onProgress,
  } = options

  // Kept in a ref so changing the callback never rebuilds the trigger.
  const progressRef = useRef(onProgress)
  progressRef.current = onProgress

  useEffect(() => {
    const video = videoRef.current
    const track = trackRef.current
    if (!video || !track || !enabled) return

    video.pause()

    let tween = null
    let disposed = false

    const build = () => {
      if (disposed || tween) return
      const duration = video.duration
      if (!duration || !Number.isFinite(duration)) return

      const head = { t: duration * from }
      const tail = duration * to

      tween = gsap.to(head, {
        t: tail,
        ease: 'none',
        overwrite: true,
        scrollTrigger: {
          trigger: track,
          start,
          end,
          scrub,
          invalidateOnRefresh: true,
          onUpdate: (self) => progressRef.current?.(self.progress),
        },
        onUpdate: () => {
          // HAVE_CURRENT_DATA — anything less and the seek is a no-op that
          // still costs a decoder round trip.
          if (video.readyState < 2) return
          if (video.seeking) return
          const t = Math.min(Math.max(head.t, 0), duration - 0.01)
          if (Math.abs(video.currentTime - t) < FRAME * 0.5) return
          video.currentTime = t
        },
      })
    }

    // The source is attached lazily, so metadata usually arrives well
    // after mount. The trigger is simply built then — a ScrollTrigger
    // created late measures itself correctly at creation, and the chapter
    // height it measures against is set in CSS and does not depend on the
    // film, so there is nothing here to refresh.
    if (video.readyState >= 1) build()
    video.addEventListener('loadedmetadata', build)

    return () => {
      disposed = true
      video.removeEventListener('loadedmetadata', build)
      tween?.scrollTrigger?.kill()
      tween?.kill()
    }
  }, [videoRef, trackRef, start, end, scrub, from, to, enabled])
}
