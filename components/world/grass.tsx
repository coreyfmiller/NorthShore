'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Grass as instanced mesh with terrain-following and wind sway
export function Grass() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = 600

  const { matrices, offsets, colors } = useMemo(() => {
    const m: THREE.Matrix4[] = []
    const o: number[] = []
    const c: THREE.Color[] = []

    const waterZones = [
      { x: 45, z: 5, radius: 22 },
      { x: -55, z: 50, radius: 16 },
      { x: -40, z: -40, radius: 16 },
    ]

    const greens = [
      new THREE.Color('#3a7535'),
      new THREE.Color('#2d6628'),
      new THREE.Color('#448540'),
      new THREE.Color('#2a5a22'),
      new THREE.Color('#4a8a3a'),
      new THREE.Color('#356a2e'),
    ]

    let placed = 0
    while (placed < count) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200

      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue

      const mat = new THREE.Matrix4()
      const scaleY = 0.3 + Math.random() * 0.7
      const scaleX = 0.2 + Math.random() * 0.3
      mat.compose(
        new THREE.Vector3(x, scaleY * 0.5, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI),
        new THREE.Vector3(scaleX, scaleY, scaleX)
      )
      m.push(mat)
      o.push(Math.random() * Math.PI * 2)
      c.push(greens[Math.floor(Math.random() * greens.length)])
      placed++
    }

    return { matrices: m, offsets: o, colors: c }
  }, [])

  // Set initial matrices and colors
  useMemo(() => {
    if (!meshRef.current) return
    matrices.forEach((mat, i) => {
      meshRef.current!.setMatrixAt(i, mat)
      meshRef.current!.setColorAt(i, colors[i])
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [matrices, colors])

  // Sway animation
  useFrame(() => {
    if (!meshRef.current) return
    const t = Date.now() * 0.001
    const tempMat = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      matrices[i].decompose(pos, quat, scale)
      // Multi-frequency sway for natural wind effect
      const sway = Math.sin(t * 1.5 + offsets[i]) * 0.07
        + Math.sin(t * 2.8 + offsets[i] * 1.5) * 0.03
      const swayQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0.3), sway
      )
      tempMat.compose(pos, swayQuat.multiply(quat), scale)
      meshRef.current!.setMatrixAt(i, tempMat)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow={false}>
      <coneGeometry args={[1, 1, 4]} />
      <meshStandardMaterial color="#3a7535" roughness={0.9} flatShading />
    </instancedMesh>
  )
}
