'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/lib/game-store'
import * as THREE from 'three'

// Rain particles that follow the player
export function Rain() {
  const ref = useRef<THREE.Points>(null)
  const weather = useGameStore((s) => s.weather)
  const count = 500

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60
      pos[i * 3 + 1] = Math.random() * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return pos
  }, [])

  useFrame(() => {
    if (!ref.current || weather !== 'rain') return
    const pos = ref.current.geometry.attributes.position
    const playerPos = useGameStore.getState().playerPos

    for (let i = 0; i < count; i++) {
      // Fall down
      pos.array[i * 3 + 1] -= 0.5

      // Reset when hitting ground
      if (pos.array[i * 3 + 1] < 0) {
        pos.array[i * 3] = playerPos[0] + (Math.random() - 0.5) * 60
        pos.array[i * 3 + 1] = 15 + Math.random() * 5
        pos.array[i * 3 + 2] = playerPos[2] + (Math.random() - 0.5) * 60
      }
    }
    pos.needsUpdate = true
  })

  if (weather !== 'rain') return null

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#aaccee"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// Snow particles
export function Snow() {
  const ref = useRef<THREE.Points>(null)
  const weather = useGameStore((s) => s.weather)
  const count = 400

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80
      pos[i * 3 + 1] = Math.random() * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    return pos
  }, [])

  useFrame(() => {
    if (!ref.current || (weather !== 'snow' && weather !== 'blizzard')) return
    const pos = ref.current.geometry.attributes.position
    const playerPos = useGameStore.getState().playerPos
    const speed = weather === 'blizzard' ? 0.15 : 0.06

    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] -= speed
      // Drift sideways
      pos.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.02
      pos.array[i * 3 + 2] += Math.cos(Date.now() * 0.0008 + i) * 0.02

      if (pos.array[i * 3 + 1] < 0) {
        pos.array[i * 3] = playerPos[0] + (Math.random() - 0.5) * 80
        pos.array[i * 3 + 1] = 15 + Math.random() * 5
        pos.array[i * 3 + 2] = playerPos[2] + (Math.random() - 0.5) * 80
      }
    }
    pos.needsUpdate = true
  })

  if (weather !== 'snow' && weather !== 'blizzard') return null

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// Fog overlay — thickens fog when weather is foggy
export function WeatherFog() {
  const weather = useGameStore((s) => s.weather)

  // This component modifies the scene fog dynamically
  useFrame(({ scene }) => {
    if (!scene.fog) return
    const fog = scene.fog as THREE.Fog
    if (weather === 'fog') {
      fog.near = THREE.MathUtils.lerp(fog.near, 10, 0.02)
      fog.far = THREE.MathUtils.lerp(fog.far, 60, 0.02)
    } else if (weather === 'rain') {
      fog.near = THREE.MathUtils.lerp(fog.near, 40, 0.02)
      fog.far = THREE.MathUtils.lerp(fog.far, 120, 0.02)
    } else if (weather === 'blizzard') {
      fog.near = THREE.MathUtils.lerp(fog.near, 5, 0.02)
      fog.far = THREE.MathUtils.lerp(fog.far, 40, 0.02)
    } else {
      fog.near = THREE.MathUtils.lerp(fog.near, 70, 0.02)
      fog.far = THREE.MathUtils.lerp(fog.far, 200, 0.02)
    }
  })

  return null
}
