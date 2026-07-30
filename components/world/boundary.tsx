'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

// Visible boundary around the map edge — dense tree wall + fog hides the void
export function MapBoundary() {
  const posts = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number; scale: number }[] = []
    const size = 130
    const spacing = 4

    // All four edges
    for (let i = -size; i <= size; i += spacing) {
      // North
      result.push({ pos: [i, 0, -size], rot: Math.random() * 0.3, scale: 0.8 + Math.random() * 0.4 })
      // South
      result.push({ pos: [i, 0, size], rot: Math.random() * 0.3, scale: 0.8 + Math.random() * 0.4 })
      // East
      result.push({ pos: [size, 0, i], rot: Math.random() * 0.3, scale: 0.8 + Math.random() * 0.4 })
      // West
      result.push({ pos: [-size, 0, i], rot: Math.random() * 0.3, scale: 0.8 + Math.random() * 0.4 })
    }
    return result
  }, [])

  return (
    <group>
      {/* Dense tree wall at edges */}
      {posts.map((post, i) => (
        <group key={i} position={post.pos} scale={post.scale}>
          {/* Trunk */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 5, 5]} />
            <meshStandardMaterial color="#2a1a08" roughness={0.95} flatShading />
          </mesh>
          {/* Dark dense canopy */}
          <mesh position={[0, 5.5, 0]} castShadow>
            <coneGeometry args={[1.8, 4, 6]} />
            <meshStandardMaterial color="#0a2010" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 7, 0]} castShadow>
            <coneGeometry args={[1.2, 2.5, 5]} />
            <meshStandardMaterial color="#0c2812" roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
