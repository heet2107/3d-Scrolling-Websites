'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import styles from '@/styles/ui/AmbientAudio.module.css'

const MUSIC_VOLUME = 0.32

/**
 * Soothing background loop for everything after the intro video.
 * - Unlocked (silently) by the screen-loader dismiss click, so later
 *   programmatic play() calls survive autoplay policies.
 * - Fades in once the scroller moves past the intro section and back
 *   out when returning to it, so it never competes with the intro voice.
 * - Floating equalizer button (bottom-left) lets the visitor mute it.
 */
export default function AmbientAudio() {
  const audioRef   = useRef(null)
  const activeRef  = useRef(false) // scrolled past the intro
  const enabledRef = useRef(true)  // user preference via the toggle
  const [enabled, setEnabled] = useState(true)
  const [visible, setVisible] = useState(false)

  function applyVolume() {
    const a = audioRef.current
    if (!a) return
    const target = activeRef.current && enabledRef.current ? MUSIC_VOLUME : 0
    gsap.to(a, {
      volume: target,
      duration: 1.4,
      ease: 'power1.inOut',
      overwrite: 'auto',
      onComplete: () => { if (target === 0) a.pause() },
    })
  }

  function ensurePlaying() {
    const a = audioRef.current
    if (a && a.paused) a.play().catch(() => {})
  }

  useEffect(() => {
    const a = audioRef.current
    const scroller = document.querySelector('main')
    if (!a || !scroller) return
    a.volume = 0

    // The loader dismiss happens inside a click - use it to unlock audio
    function unlock() {
      a.play().then(() => { if (!activeRef.current) a.pause() }).catch(() => {})
    }
    window.addEventListener('loader-dismissed', unlock)

    function onScroll() {
      const past = scroller.scrollTop > window.innerHeight * 0.55
      if (past === activeRef.current) return
      activeRef.current = past
      setVisible(past)
      if (past) ensurePlaying()
      applyVolume()
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('loader-dismissed', unlock)
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [])

  function toggle() {
    enabledRef.current = !enabledRef.current
    setEnabled(enabledRef.current)
    if (enabledRef.current) ensurePlaying()
    applyVolume()
  }

  return (
    <>
      <audio ref={audioRef} src="/assets/ambient.mp3" loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className={`${styles.toggle} ${visible ? styles.show : ''} ${enabled ? '' : styles.muted}`}
        aria-label={enabled ? 'Mute background music' : 'Play background music'}
        aria-pressed={!enabled}
      >
        <span className={styles.bars} aria-hidden>
          <span /><span /><span />
          {!enabled && <span className={styles.slash} />}
        </span>
      </button>
    </>
  )
}
