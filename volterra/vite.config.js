import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* ------------------------------------------------------------------ *
 *  Chunking.
 *
 *  Split by resolved path rather than by package name. The array form of
 *  manualChunks matches bare specifiers, which do not survive Vite's
 *  CommonJS interop for React — the entry ended up importing React out of
 *  the three chunk, which made the browser fetch 800 kB of WebGL before
 *  it could render the first line of type on a page that shows no 3D
 *  until after the curtain lifts. Matching on the id catches every proxy
 *  module the interop generates.
 *
 *  react-reconciler is deliberately not named: only @react-three/fiber
 *  pulls it, so it falls through into the three chunk and stays off the
 *  critical path with the rest of the 3D layer.
 * ------------------------------------------------------------------ */
const inPackage = (id, name) => id.includes(`/node_modules/${name}/`)

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    // The three chunk is meant to be large and meant to be late; warning
    // about it on every build only trains us to ignore the warning.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          if (inPackage(id, 'react') || inPackage(id, 'react-dom') || inPackage(id, 'scheduler')) {
            return 'react'
          }
          if (id.includes('/node_modules/three/') || id.includes('/node_modules/@react-three/')) {
            return 'three'
          }
          if (inPackage(id, 'gsap') || inPackage(id, 'lenis')) return 'motion'
        },
      },
    },
  },
})
