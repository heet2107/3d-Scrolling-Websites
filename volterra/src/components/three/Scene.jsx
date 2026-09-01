import { Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import StudioEnvironment from './StudioEnvironment.jsx'
import MarbleSphere from './MarbleSphere.jsx'
import BrassRing from './BrassRing.jsx'
import MaterialCube from './MaterialCube.jsx'
import WireVilla from './WireVilla.jsx'
import GlassPanes from './GlassPanes.jsx'
import Motes from './Motes.jsx'
import { easeFrameState } from '../../lib/store.js'
import { useIsCompact, useReducedMotion } from '../../hooks/useMediaQuery.js'

/* Advance the shared pointer/scroll easing exactly once per rendered
   frame, before anything reads it. Mounted first so it runs first. */
function FrameState() {
  useFrame((_, delta) => easeFrameState(Math.min(delta, 1 / 20)))
  return null
}

/* ------------------------------------------------------------------ *
 *  Placing objects in a frame that changes shape.
 *
 *  World coordinates are the wrong unit here: an object parked at x = 2.9
 *  sits just inside the edge on a laptop and a long way off-screen on a
 *  phone. Objects are placed in normalised frame coordinates instead
 *  (-1..1 across the visible plane at z = 0) and converted to world units
 *  against the live viewport, so the composition holds at any aspect.
 * ------------------------------------------------------------------ */
function Composition({ compact }) {
  const { viewport } = useThree()
  const hw = viewport.width / 2
  const hh = viewport.height / 2
  const at = (nx, ny, z = 0) => [nx * hw, ny * hh, z]

  // The box every floating object is held inside, in world units. Narrower
  // vertically than horizontally because the top of the frame carries the
  // nav and the bottom carries each chapter's type — the sides are the only
  // part of the screen this layer can use without landing on something.
  const bounds = [hw * 0.8, hh * 0.56]

  return (
    <>
      <FrameState />

      {/* Key and fill. No shadow maps anywhere in this layer — the objects
          never touch a surface, so a shadow would have nothing to fall on
          and would cost a second pass. */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, 1, -2]} intensity={0.45} color="#D8CEC0" />

      {/* A procedural studio, baked once on the first frame. Brass is
          unreadable without something to reflect; this gives it a soft box
          and two strips without downloading an HDR. */}
      <StudioEnvironment resolution={compact ? 64 : 128} />

      {/* Placement rule: the type in this site lives along the bottom and
          the left. The floating layer stays high and to the outside of the
          frame, because an object drifting across a headline is the one
          thing that would make this layer read as decoration. */}

      {/* Overture — stone high left, brass out right. */}
      <MarbleSphere bounds={bounds} chapters={['hero']} home={at(-0.78, 0.22, 0)} radius={0.54} seed={0} />
      <BrassRing bounds={bounds} chapters={['hero']} home={at(0.88, -0.12, -1)} radius={0.66} seed={1} />

      {/* Living Room — glass hanging where the room would have a window,
          and stone above it, both clear of the copy at lower left. */}
      <GlassPanes bounds={bounds} chapters={['living']} home={at(0.8, -0.05, -0.4)} seed={4} />
      {!compact && (
        <MarbleSphere bounds={bounds} chapters={['living']} home={at(0.86, 0.52, -1.2)} radius={0.3} seed={5} />
      )}

      {/* Light — the chapter is nearly black, so this is mostly dust. */}
      <Motes chapters={['light', 'blueprint', 'finale']} count={compact ? 110 : 230} />
      <BrassRing bounds={bounds} chapters={['light']} home={at(-0.76, 0.46, -0.6)} radius={0.82} seed={6} />

      {/* Kitchen — both high, flanking the floating island. */}
      <BrassRing bounds={bounds} chapters={['kitchen']} home={at(-0.8, 0.24, 0)} radius={0.58} seed={7} />
      {!compact && (
        <MarbleSphere bounds={bounds} chapters={['kitchen']} home={at(0.9, 0.5, -0.8)} radius={0.34} seed={8} />
      )}

      {/* Bedroom — one soft stone, far out on the right. The chapter is
          meant to be the calmest thing on the page. */}
      <MarbleSphere bounds={bounds} chapters={['bedroom']} home={at(0.92, 0.44, -0.5)} radius={0.4} seed={9} />

      {/* Materials has no floating object of its own: the film in that
          chapter is a turning material cube, and a second one beside it
          read as a duplicate rather than as depth. */}

      {/* Blueprint — the massing model, in line with the datum marks. */}
      <WireVilla bounds={bounds} chapters={['blueprint']} home={at(0.7, 0.4, 0)} seed={3} scale={0.72} />

      {/* Finale — everything the house is made of, together. */}
      <MaterialCube bounds={bounds} chapters={['finale']} home={at(0.86, 0.5, -1)} size={0.5} seed={10} />
      {!compact && (
        <MarbleSphere bounds={bounds} chapters={['finale']} home={at(-0.9, 0.44, -1.4)} radius={0.32} seed={11} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ *
 *  The floating layer.
 *
 *  One fixed canvas for the whole site, above the films and below the
 *  type. It never takes a pointer event — the cursor belongs to the page
 *  underneath — and it is not rendered at all under reduced motion,
 *  where a drifting object would be the exact thing the setting asks to
 *  be spared.
 * ------------------------------------------------------------------ */
export default function Scene() {
  const compact = useIsCompact()
  const reduced = useReducedMotion()

  if (reduced) return null

  return (
    <div
      className="fixed inset-0 z-30"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Canvas
        // A phone gains nothing from a 3x buffer for six soft objects, and
        // loses a lot of fill rate.
        dpr={[1, compact ? 1.4 : 1.75]}
        gl={{
          antialias: !compact,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 40 }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Composition compact={compact} />
        </Suspense>
      </Canvas>
    </div>
  )
}
