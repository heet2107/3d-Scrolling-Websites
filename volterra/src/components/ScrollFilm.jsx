import { useRef } from 'react'
import { useScrollFilm } from '../hooks/useScrollFilm.js'
import { useLazyFilm } from '../hooks/useLazyFilm.js'
import { useIsCompact, useReducedMotion } from '../hooks/useMediaQuery.js'
import { filmSource } from '../lib/media.js'

/* ------------------------------------------------------------------ *
 *  A film pinned behind a chapter, scrubbed by that chapter's track.
 *
 *  Everything that makes a <video> behave as a scroll surface rather than
 *  a player is set here in one place: muted and playsInline so mobile
 *  Safari renders it inline instead of taking it fullscreen, no controls,
 *  and it is never played — the scrub hook owns currentTime outright.
 *
 *  Under prefers-reduced-motion the element is dropped entirely and the
 *  poster frame stands in, so the chapter still has its image and the
 *  browser never downloads two megabytes to hold on frame one.
 * ------------------------------------------------------------------ */
export default function ScrollFilm({
  film,
  trackRef,
  eager = false,
  alt = '',
  className = '',
  style,
  scrub = 0.6,
  from = 0,
  to = 1,
  start = 'top top',
  end = 'bottom bottom',
  onProgress,
}) {
  const videoRef = useRef(null)
  const holderRef = useRef(null)
  const compact = useIsCompact()
  const reduced = useReducedMotion()

  const armed = useLazyFilm(holderRef, { eager })
  // Resolved once per element: codec first, then rendition. See media.js.
  const src = filmSource(film, compact)

  useScrollFilm(videoRef, trackRef, {
    scrub,
    from,
    to,
    start,
    end,
    enabled: armed && !reduced,
    onProgress,
  })

  return (
    <div ref={holderRef} className="absolute inset-0" style={style}>
      {reduced ? (
        <img src={film.poster} alt={alt} className={`film ${className}`} draggable="false" />
      ) : (
        <video
          ref={videoRef}
          className={`film ${className}`}
          // Keyed on the resolved URL so crossing the breakpoint reloads
          // rather than leaving the old rendition decoded in place.
          key={src}
          src={armed ? src : undefined}
          poster={film.poster}
          preload={armed ? 'auto' : 'none'}
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  )
}
