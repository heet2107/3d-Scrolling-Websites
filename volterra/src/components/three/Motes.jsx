import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { motesShader } from './shaders.js'
import { stage } from '../../lib/store.js'

const lerp = (a, b, t) => a + (b - a) * t

/* Dust in a light shaft. A single Points draw, positions generated once
   and never touched again — each mote's drift is computed in the vertex
   shader off its seed, so the CPU does nothing per frame but advance a
   clock.

   These outlive the other objects: they sit across the dark chapters
   where the film is mostly void, and they are the thing that keeps that
   void from reading as empty. */
export default function Motes({ count = 220, chapters, spread = [7, 4.5, 4], color = '#D8CEC0' }) {
  const points = useRef(null)
  const vis = useRef(0)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread[0]
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
      seeds[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const material = useMemo(() => {
    const uniforms = THREE.UniformsUtils.clone(motesShader.uniforms)
    uniforms.uColor.value = new THREE.Color(color)
    uniforms.uPixelRatio.value = Math.min(
      typeof window === 'undefined' ? 1 : window.devicePixelRatio,
      2
    )
    return new THREE.ShaderMaterial({
      vertexShader: motesShader.vertexShader,
      fragmentShader: motesShader.fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [color])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    material.uniforms.uTime.value += dt
    const target = !chapters || chapters.includes(stage.chapter) ? 1 : 0
    vis.current = lerp(vis.current, target, 1 - Math.pow(0.08, dt))
    material.uniforms.uOpacity.value = vis.current * 0.55
    if (points.current) points.current.visible = vis.current > 0.002
  })

  return <points ref={points} geometry={geometry} material={material} />
}
