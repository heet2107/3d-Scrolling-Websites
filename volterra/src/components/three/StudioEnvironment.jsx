import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/* ------------------------------------------------------------------ *
 *  A photographer's studio, generated on the first frame.
 *
 *  Brass without an environment to reflect is a flat brown circle — a
 *  metal is almost entirely what it reflects, so the ring and the cube
 *  need something around them. The usual answers are an HDR file (a
 *  download, and for this site a CDN dependency the rest of the build
 *  does not have) or drei's <Environment> with lightformers, which is
 *  64 kB gzipped of library to place three rectangles.
 *
 *  This is the same idea against three's own PMREMGenerator: build a
 *  scene containing a soft box and two strips, prefilter it into a
 *  mipmapped radiance map, hand it to the scene and throw away the
 *  render target's source. It runs once, costs nothing after that, and
 *  adds no bytes to the bundle beyond what three already ships.
 * ------------------------------------------------------------------ */

const PANELS = [
  // [w, h, x, y, z, colour, intensity] — a key box overhead, a cool fill
  // to camera-left, a warm bounce to camera-right.
  [8, 5, 0, 4, 3, '#FFFFFF', 2.4],
  [3, 6, -4, 1, 2, '#D8CEC0', 1.1],
  [3, 4, 4, -1, 1, '#A98D67', 0.85],
  // A dark card behind the subject, so edges have something to fall off
  // against instead of reflecting the same white on every side.
  [10, 8, 0, 0, -6, '#101010', 1],
]

export default function StudioEnvironment({ resolution = 128 }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()

    const rig = new THREE.Scene()
    const disposables = []

    for (const [w, h, x, y, z, color, intensity] of PANELS) {
      const geometry = new THREE.PlaneGeometry(w, h)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      mesh.lookAt(0, 0, 0)
      rig.add(mesh)
      disposables.push(geometry, material)
    }

    // A little blur on the prefilter keeps the panel edges from showing
    // up as hard rectangles in a polished surface.
    const target = pmrem.fromScene(rig, 0.04)
    scene.environment = target.texture

    for (const d of disposables) d.dispose()
    pmrem.dispose()

    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene, resolution])

  return null
}
