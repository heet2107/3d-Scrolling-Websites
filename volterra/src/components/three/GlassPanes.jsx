import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFloat } from './useFloat.js'
import { glassShader } from './shaders.js'

/* Three panes of smoked glass, hanging at slightly different depths.
   Their fresnel shader draws only the turning edge, so on a bone-white
   page they read as sheets catching a light rather than as the frosted
   panels the brief rules out. */
const PANES = [
  { size: [1.5, 2.1], rot: [0.06, 0.5, -0.04], z: 0 },
  { size: [1.1, 1.6], rot: [-0.04, -0.42, 0.06], z: -0.7 },
  { size: [0.8, 1.2], rot: [0.1, 0.9, 0.02], z: 0.55 },
]

export default function GlassPanes({ home, chapters, seed = 4 }) {
  const group = useRef(null)

  const materials = useMemo(
    () =>
      PANES.map(() => {
        const uniforms = THREE.UniformsUtils.clone(glassShader.uniforms)
        uniforms.uEdge.value = new THREE.Color('#D8CEC0')
        uniforms.uCore.value = new THREE.Color('#A98D67')
        return new THREE.ShaderMaterial({
          vertexShader: glassShader.vertexShader,
          fragmentShader: glassShader.fragmentShader,
          uniforms,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      }),
    []
  )

  useFloat(group, {
    chapters,
    home,
    seed,
    drift: 0.18,
    travel: 2.4,
    parallax: 0.16,
    spin: [0, 0.018, 0],
    onVisibility: (v) => {
      for (const m of materials) m.uniforms.uOpacity.value = v
    },
  })

  return (
    <group ref={group}>
      {PANES.map((p, i) => (
        <mesh key={i} material={materials[i]} rotation={p.rot} position={[i * 0.28 - 0.28, 0, p.z]}>
          <planeGeometry args={p.size} />
        </mesh>
      ))}
    </group>
  )
}
