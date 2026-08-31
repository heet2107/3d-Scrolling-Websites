import { useEffect } from 'react'
import { pointer } from '../lib/store.js'

/* One pointermove listener for the entire site. Everything that reacts to
   the mouse — the 3D layer, the cursor, the stage parallax — reads the
   shared store rather than adding a listener of its own. */
export function usePointerTracking() {
  useEffect(() => {
    const onMove = (e) => {
      // Coarse pointers fire pointermove on tap; treating that as mouse
      // movement snaps every parallax to the tap position.
      if (e.pointerType === 'touch') return
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
      pointer.idle = false
    }
    const onLeave = () => {
      pointer.idle = true
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
}
