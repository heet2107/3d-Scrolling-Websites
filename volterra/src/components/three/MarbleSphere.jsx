import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useFloat } from './useFloat.js'
import { marbleShader } from './shaders.js'

/* A block of Calacatta, turned slowly. The veining is generated in the
   fragment shader (see shaders.js) rather than sampled from a texture, so
   it costs nothing to download and never tiles visibly. */
export default function MarbleSphere({ home, chapters, radius = 0.62, seed = 0 }) {
  const group = useRef(null)

  const material = useMemo(() => {
    const uniforms = THREE.UniformsUtils.clone(marbleShader.uniforms)
    uniforms.uBase.value = new THREE.Color('#FBFAF8')
    uniforms.uVein.value = new THREE.Color('#A8A29A')
    uniforms.uWarp.value = 1.15
    return new THREE.ShaderMaterial({
      vertexShader: marbleShader.vertexShader,
      fragmentShader: marbleShader.fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    })
  }, [])

  useFloat(group, {
    chapters,
    home,
    seed,
    drift: 0.2,
    travel: 2.1,
    parallax: 0.1,
    spin: [0.006, 0.028, 0],
    onVisibility: (v) => {
      // Capped well below solid. These objects share the frame with the
      // films and the headlines, and the brief's word for them is
      // "never distracting" — at full opacity a floating sphere competes
      // with the thing it is meant to sit behind.
      material.uniforms.uOpacity.value = v * 0.5
    },
  })

  useFrame((_, delta) => {
    material.uniforms.uTime.value += Math.min(delta, 1 / 20)
  })

  return (
    <group ref={group}>
      <mesh material={material}>
        <icosahedronGeometry args={[radius, 24]} />
      </mesh>
    </group>
  )
}
