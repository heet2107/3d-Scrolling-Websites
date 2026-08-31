import { useRef } from 'react'
import { useFloat } from './useFloat.js'

/* Unlacquered brass, caught edge-on. A torus reads as a ring only while
   it is near-edge-on to camera, so the idle spin is kept on one axis and
   the pointer lean supplies the rest. */
export default function BrassRing({ home, chapters, radius = 0.78, tube = 0.035, seed = 1 }) {
  const group = useRef(null)
  const material = useRef(null)

  useFloat(group, {
    chapters,
    home,
    seed,
    drift: 0.14,
    travel: 2.6,
    parallax: 0.14,
    spin: [0.012, 0.05, 0],
    onVisibility: (v) => {
      if (material.current) material.current.opacity = v * 0.62
    },
  })

  return (
    <group ref={group} rotation={[Math.PI * 0.36, 0, Math.PI * 0.1]}>
      <mesh>
        <torusGeometry args={[radius, tube, 20, 128]} />
        <meshStandardMaterial
          ref={material}
          color="#A98D67"
          metalness={0.96}
          roughness={0.26}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
