import { useCallback, useEffect, useRef, useState } from 'react'
import { useScrollFilm } from '../hooks/useScrollFilm.js'
import { useLazyFilm } from '../hooks/useLazyFilm.js'
import { useIsCompact, useReducedMotion } from '../hooks/useMediaQuery.js'
import { filmSource, alternateSource } from '../lib/media.js'

/* ------------------------------------------------------------------ *
 *  A film pinned behind a chapter, scrubbed by that chapter's track.
 *
 *  Everything that makes a <video> behave as a scroll surface rather than
 *  a player is set here: muted and playsInline so mobile Safari renders it
 *  inline instead of taking it fullscreen, no controls, and it is never
 *  played — the scrub hook owns currentTime outright.
 *
 *  The rule underneath all of it: a chapter must never show an empty box.
 *
 *  Getting that wrong is what shipped a site whose Kitchen and Materials
 *  chapters were blank. The video is the enhancement, not the floor. So
 *  the poster is painted on an element *behind* the video and the video
 *  itself starts transparent, revealed only once it reports a frame it
 *  can actually paint. If it never gets there — an unplayable codec, a
 *  driver that will not composite it, a browser that has run out of
 *  hardware decoders, an extension that blocked it — nothing is revealed
 *  and the chapter simply keeps showing its opening frame.
 *
 *  That inverts the old assumption. Before, the video was shown
 *  unconditionally and was trusted to paint something; every way that
 *  trust could be broken produced a blank chapter with no error to catch.
 *  Now the only way to see the video is for it to have proven itself.
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
  const [painting, setPainting] = useState(false)

  const armed = useLazyFilm(holderRef, { eager })
  const primary = filmSource(film, compact)
  const src = fellBack ? alternateSource(film, compact) : primary

  // One retry, on the other codec. canPlayType is a claim, not a
  // guarantee: a browser can advertise H.264 and still fail on a given
  // file, driver or build. Without the guard a source failing for some
  // other reason would flip between the two for ever.
  const onError = useCallback(() => setFellBack((v) => v || true), [])

  // HAVE_CURRENT_DATA or better means there is a frame to show.
  const onLoadedData = useCallback(() => setPainting(true), [])

  // A new source has to prove itself again before it is shown.
  useEffect(() => {
    setPainting(false)
  }, [src])

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
      {!reduced && (
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
          onLoadedData={onLoadedData}
          style={{
            opacity: painting ? 1 : 0,
            transition: 'opacity 420ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
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
