import { useCallback, useRef, useState } from 'react'
import { useScrollFilm } from '../hooks/useScrollFilm.js'
import { useLazyFilm } from '../hooks/useLazyFilm.js'
import { useIsCompact, useReducedMotion } from '../hooks/useMediaQuery.js'
import { filmSource, alternateSource } from '../lib/media.js'

/* ------------------------------------------------------------------ *
 *  A film pinned behind a chapter, scrubbed by that chapter's track.
 *
 *  Everything that makes a <video> behave as a scroll surface rather than
 *  a player is set here in one place: muted and playsInline so mobile
 *  Safari renders it inline instead of taking it fullscreen, no controls,
 *  and it is never played — the scrub hook owns currentTime outright.
 *
 *  Two layers of fallback sit under it, because a chapter that shows
 *  nothing is worse than a chapter that shows a still:
 *
 *    1. The poster is painted on the element *behind* the video, not just
 *       as the video's own poster attribute. A poster attribute only
 *       covers "no frame decoded yet"; this also covers a video that
 *       loads and then fails to paint.
 *    2. If the chosen source errors, the other codec is tried once.
 *       preferredCodec() reads canPlayType, which is a claim rather than
 *       a guarantee — a browser can advertise H.264 and still fail on a
 *       given file or driver.
 *
 *  Under prefers-reduced-motion the video is dropped entirely and the
 *  poster stands in, so the chapter still has its image and the browser
 *  never downloads megabytes to hold on frame one.
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
  const [fellBack, setFellBack] = useState(false)

  const armed = useLazyFilm(holderRef, { eager })
  const primary = filmSource(film, compact)
  const src = fellBack ? alternateSource(film, compact) : primary

  // One retry, on the other codec. Without the guard a source that fails
  // for a reason unrelated to codec would flip back and forth for ever.
  const onError = useCallback(() => setFellBack((v) => v || true), [])

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
      <div
        className="film-bed"
        style={{ backgroundImage: `url(${film.poster})` }}
        aria-hidden="true"
      />
      {reduced ? (
        <img src={film.poster} alt={alt} className={`film ${className}`} draggable="false" />
      ) : (
        <video
          ref={videoRef}
          className={`film ${className}`}
          // Keyed on the resolved URL so crossing the breakpoint, or
          // falling back to the other codec, reloads rather than leaving
          // the old rendition decoded in place.
          key={src}
          src={armed ? src : undefined}
          poster={film.poster}
          preload={armed ? 'auto' : 'none'}
          onError={armed ? onError : undefined}
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
