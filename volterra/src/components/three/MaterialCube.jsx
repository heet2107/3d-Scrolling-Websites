import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFloat } from './useFloat.js'

/* The six materials of the house, one per face — the same set the
   Materials chapter names, so the object on the page and the film behind
   it are describing the same thing.

   BoxGeometry groups its faces in +x, -x, +y, -y, +z, -z order, which is
   what lets one material per face work without splitting the mesh. */
const FACES = [
  { color: '#D6CBB8', metalness: 0.0, roughness: 0.74 }, // travertine
  { color: '#8C6647', metalness: 0.0, roughness: 0.5 }, // walnut
  { color: '#AEABA4', metalness: 0.0, roughness: 0.85 }, // concrete
  { color: '#F6F4F0', metalness: 0.02, roughness: 0.2 }, // marble
  { color: '#BFA079', metalness: 0.92, roughness: 0.26 }, // brass
  { color: '#4A4A4A', metalness: 0.35, roughness: 0.08 }, // smoked glass
]

export default function MaterialCube({ home, chapters, size = 0.92, seed = 2 }) {
  const group = useRef(null)

  const materials = useMemo(
    () =>
      FACES.map(
        (f) =>
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(f.color),
            metalness: f.metalness,
            roughness: f.roughness,
            transparent: true,
            depthWrite: false,
          })
      ),
    []
  )

  useFloat(group, {
    chapters,
    home,
    seed,
    drift: 0.12,
    travel: 1.9,
    parallax: 0.08,
    spin: [0.008, 0.06, 0],
    onVisibility: (v) => {
      // See MarbleSphere: held well under solid so the cube reads as
      // something suspended in the room rather than as a block pasted
      // over the film.
      for (const m of materials) m.opacity = v * 0.5
    },
  })

  return (
    <group ref={group}>
      <mesh material={materials}>
        <boxGeometry args={[size, size, size]} />
      </mesh>
    </group>
  )
}
