import { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 *  Attach a film's source only when it is nearly needed.
 *
 *  Eight all-intra clips is more than twenty megabytes. Pointing eight
 *  <video> elements at them on load would saturate the connection and
 *  starve the one film the visitor is actually looking at, so each source
 *  is attached one viewport ahead of its chapter and preloaded from there.
 *
 *  The hero opts out (`eager`) — it is on screen at load and has to be
 *  scrubbable immediately.
 * ------------------------------------------------------------------ */
export function useLazyFilm(ref, { eager = false, rootMargin = '120% 0px' } = {}) {
  const [armed, setArmed] = useState(eager)

  useEffect(() => {
    if (armed) return
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setArmed(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, armed, rootMargin])

  return armed
}
