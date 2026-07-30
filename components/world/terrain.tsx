'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

// Shared height function — flat terrain
export function getTerrainHeight(x: number, z: number): number {
  return 0
}

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, 128, 128)
    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      positions.setZ(i, 0)

      // Rich color variation for visual interest
      const nx = Math.sin(x * 0.05 + 33) * Math.cos(z * 0.04 + 17)
      const patchNoise = Math.sin(x * 0.12 + 77) * Math.cos(z * 0.1 + 55)
      const isDirtPatch = patchNoise > 0.4

      let r, g, b
      if (isDirtPatch) {
        r = 0.16 + nx * 0.02 + Math.random() * 0.01
        g = 0.13 + nx * 0.01 + Math.random() * 0.01
        b = 0.07 + Math.random() * 0.005
      } else {
        r = 0.10 + nx * 0.02 + Math.random() * 0.008
        g = 0.28 + nx * 0.03 + Math.random() * 0.02
        b = 0.06 + nx * 0.01 + Math.random() * 0.005
      }

      colors[i * 3] = Math.max(0, Math.min(1, r))
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g))
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b))
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial vertexColors flatShading roughness={0.95} />
    </mesh>
  )
}
