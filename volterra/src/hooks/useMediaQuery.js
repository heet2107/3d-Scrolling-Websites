import { useEffect, useState } from 'react'

/** Subscribe to a media query. Returns false during the first paint on the
    server; on the client the initial value is read synchronously. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** The site's one breakpoint. Below this the films switch to the small
    rendition and the scroll tracks shorten. */
export const useIsCompact = () => useMediaQuery('(max-width: 860px)')

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
