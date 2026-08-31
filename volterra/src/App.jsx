import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

import Nav from './components/Nav.jsx'
import ProgressRail from './components/ProgressRail.jsx'
import Curtain from './components/Curtain.jsx'

import Hero from './sections/Hero.jsx'
import LivingRoom from './sections/LivingRoom.jsx'
import Light from './sections/Light.jsx'
import Kitchen from './sections/Kitchen.jsx'
import Bedroom from './sections/Bedroom.jsx'
import Materials from './sections/Materials.jsx'
import Blueprint from './sections/Blueprint.jsx'
import Finale from './sections/Finale.jsx'
import Contact from './sections/Contact.jsx'

import { useSmoothScroll } from './hooks/useSmoothScroll.js'
import { usePointerTracking } from './hooks/usePointer.js'
import { useReducedMotion } from './hooks/useMediaQuery.js'

gsap.registerPlugin(ScrollTrigger)

/* The 3D layer is the heaviest thing on the page by an order of
   magnitude and nothing in the story depends on it. It is split out and
   mounted after the curtain lifts, so the first film starts scrubbing
   while three hundred kilobytes of Three.js is still arriving. */
const Scene = lazy(() => import('./components/three/Scene.jsx'))

export default function App() {
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()

  useSmoothScroll(!reduced)
  usePointerTracking()

  const onCurtainDone = useCallback(() => setReady(true), [])

  // The page is one continuous animation, and its length is the sum of
  // nine chapters that each measure themselves. Anything that changes a
  // chapter's height — a font landing, an orientation change, a film
  // finally reporting its dimensions — invalidates every start and end
  // below it, so the whole set is re-measured on those events rather than
  // per section.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()

    if (document.fonts?.ready) document.fonts.ready.then(refresh)

    let last = window.innerWidth
    const onResize = () => {
      // Mobile browsers fire resize when the URL bar collapses. Refreshing
      // on that mid-scroll would jump the page.
      if (window.innerWidth === last) return
      last = window.innerWidth
      refresh()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', refresh)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', refresh)
    }
  }, [])

  // Land at the top on reload. Restoring the scroll position drops the
  // visitor into the middle of a film whose sources have not been
  // attached yet.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  return (
    <>
      <div className="grain" aria-hidden="true" />

      {!reduced && <Curtain onDone={onCurtainDone} />}

      <Nav />
      <ProgressRail />

      {ready && !reduced && (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      )}

      <main className="relative z-10">
        <Hero ready={ready || reduced} />
        <LivingRoom />
        <Light />
        <Kitchen />
        <Bedroom />
        <Materials />
        <Blueprint />
        <Finale />
        <Contact />
      </main>
    </>
  )
}
