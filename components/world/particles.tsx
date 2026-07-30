'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/lib/game-store'

// Floating pollen/dust particles
export function AirParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100
      pos[i * 3 + 1] = Math.random() * 15 + 1
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return pos
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const playerPos = useGameStore.getState().playerPos

    for (let i = 0; i < count; i++) {
      // Gentle drift
      pos.array[i * 3] += Math.sin(Date.now() * 0.0003 + i) * delta * 0.3
      pos.array[i * 3 + 1] += Math.sin(Date.now() * 0.0005 + i * 2) * delta * 0.2
      pos.array[i * 3 + 2] += Math.cos(Date.now() * 0.0004 + i) * delta * 0.3

      // Keep near player
      const dx = pos.array[i * 3] - playerPos[0]
      const dz = pos.array[i * 3 + 2] - playerPos[2]
      if (Math.abs(dx) > 50) pos.array[i * 3] = playerPos[0] + (Math.random() - 0.5) * 80
      if (Math.abs(dz) > 50) pos.array[i * 3 + 2] = playerPos[2] + (Math.random() - 0.5) * 80
      if (pos.array[i * 3 + 1] > 16) pos.array[i * 3 + 1] = 1
      if (pos.array[i * 3 + 1] < 0.5) pos.array[i * 3 + 1] = 15
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffcc"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// Firefly particles (evening only in future, always for now)
export function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 30

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = 0.5 + Math.random() * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return pos
  }, [])

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const t = Date.now() * 0.001

    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += Math.sin(t + i * 3) * 0.02
      pos.array[i * 3 + 1] += Math.sin(t * 2 + i * 5) * 0.01
      pos.array[i * 3 + 2] += Math.cos(t + i * 4) * 0.02
    }
    pos.needsUpdate = true

    // Pulse opacity
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.3 + Math.sin(t * 3) * 0.2
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#aaffaa"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
