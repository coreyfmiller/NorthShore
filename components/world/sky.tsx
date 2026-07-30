'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Sky() {
  const groupRef = useRef<THREE.Group>(null)

  const clouds = useMemo(() => {
    const result: { pos: [number, number, number]; puffs: { offset: [number, number, number]; scale: [number, number, number] }[] }[] = []
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      const y = 25 + Math.random() * 12
      
      // Each cloud is a cluster of puffs
      const puffCount = 3 + Math.floor(Math.random() * 4)
      const puffs: { offset: [number, number, number]; scale: [number, number, number] }[] = []
      for (let p = 0; p < puffCount; p++) {
        puffs.push({
          offset: [
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 4
          ],
          scale: [
            4 + Math.random() * 6,
            1.5 + Math.random() * 1.5,
            3 + Math.random() * 4
          ]
        })
      }
      result.push({ pos: [x, y, z], puffs })
    }
    return result
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <group key={i} position={cloud.pos}>
          {cloud.puffs.map((puff, j) => (
            <mesh key={j} position={puff.offset} scale={puff.scale}>
              <sphereGeometry args={[1, 6, 5]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.7 - j * 0.05}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
