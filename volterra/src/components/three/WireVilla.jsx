import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFloat } from './useFloat.js'

/* The villa as the drawing it started as: a massing model reduced to its
   edges. Built from EdgesGeometry over a handful of boxes and merged into
   one LineSegments, so the whole thing is a single draw call.

   It belongs to the Blueprint chapter, where the page has gone black and
   thin white line is the only thing on screen that isn't film. */
const MASSING = [
  // [w, h, d, x, y, z] — a long bar, a cross wing, a tower, a low plinth
  [1.9, 0.5, 0.9, 0, 0, 0],
  [0.75, 0.46, 1.5, -0.5, 0.02, 0.5],
  [0.5, 0.9, 0.5, 0.72, 0.2, -0.1],
  [2.9, 0.06, 1.9, 0, -0.28, 0.2],
  [0.42, 0.3, 0.42, -0.95, -0.1, 0.75],
]

export default function WireVilla({ home, chapters, seed = 3, scale = 1 }) {
  const group = useRef(null)
  const material = useRef(null)

  const geometry = useMemo(() => {
    const positions = []
    for (const [w, h, d, x, y, z] of MASSING) {
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))
      const arr = edges.attributes.position.array
      for (let i = 0; i < arr.length; i += 3) {
        positions.push(arr[i] + x, arr[i + 1] + y, arr[i + 2] + z)
      }
      edges.dispose()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [])

  useFloat(group, {
    chapters,
    home,
    seed,
    drift: 0.1,
    travel: 1.4,
    parallax: 0.07,
    spin: [0, 0.045, 0],
    onVisibility: (v) => {
      if (material.current) material.current.opacity = v * 0.5
    },
  })

  return (
    <group ref={group}>
      <lineSegments geometry={geometry} scale={scale} rotation={[0.34, 0.5, 0]}>
        <lineBasicMaterial
          ref={material}
          color="#F7F5F2"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
