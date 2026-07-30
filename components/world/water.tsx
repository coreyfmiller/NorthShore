'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Create an organic lake shape using a distorted circle
// Calculate the lake radius at a given angle (matches the visual shape)
export function getLakeRadius(baseRadius: number, seed: number, angle: number): number {
  const noise1 = Math.sin(angle * 2 + seed) * baseRadius * 0.2
  const noise2 = Math.sin(angle * 3 + seed * 1.7) * baseRadius * 0.12
  const noise3 = Math.cos(angle * 5 + seed * 0.6) * baseRadius * 0.06
  return baseRadius + noise1 + noise2 + noise3
}

// Check if a world position is inside any lake water surface
export function isInsideWater(x: number, z: number): boolean {
  const lakes = [
    { cx: 45, cz: 5, baseRadius: 18, seed: 42 },
    { cx: -55, cz: 50, baseRadius: 12, seed: 77 },
    { cx: -40, cz: -40, baseRadius: 12, seed: 99 },
  ]
  for (const lake of lakes) {
    const dx = x - lake.cx
    const dz = z - lake.cz
    const dist = Math.sqrt(dx * dx + dz * dz)
    // Shape Y maps to world -Z due to rotation={[-Math.PI/2, 0, 0]}
    const angle = Math.atan2(-dz, dx)
    const edgeRadius = getLakeRadius(lake.baseRadius, lake.seed, angle)
    if (dist < edgeRadius) return true
  }
  return false
}

function createLakeShape(centerX: number, centerZ: number, baseRadius: number, segments: number, seed: number): THREE.Shape {
  const shape = new THREE.Shape()
  const points: [number, number][] = []

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    // Distort the radius with multiple sine waves for organic shape
    const noise1 = Math.sin(angle * 2 + seed) * baseRadius * 0.2
    const noise2 = Math.sin(angle * 3 + seed * 1.7) * baseRadius * 0.12
    const noise3 = Math.cos(angle * 5 + seed * 0.6) * baseRadius * 0.06
    const r = baseRadius + noise1 + noise2 + noise3

    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    points.push([x, y])
  }

  shape.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1])
  }
  shape.closePath()
  return shape
}

export function Water() {
  const lake1Ref = useRef<THREE.Mesh>(null)
  const lake2Ref = useRef<THREE.Mesh>(null)
  const pondRef = useRef<THREE.Mesh>(null)

  const lake1Geo = useMemo(() => {
    const shape = createLakeShape(0, 0, 18, 32, 42)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])
  const lake1BankGeo = useMemo(() => {
    const shape = createLakeShape(0, 0, 21, 32, 42)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])

  const lake2Geo = useMemo(() => {
    const shape = createLakeShape(0, 0, 12, 28, 77)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])
  const lake2BankGeo = useMemo(() => {
    const shape = createLakeShape(0, 0, 15, 28, 77)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])

  const pondGeo = useMemo(() => {
    const shape = createLakeShape(0, 0, 12, 24, 99)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])
  const pondBankGeo = useMemo(() => {
    const shape = createLakeShape(0, 0, 14, 24, 99)
    return new THREE.ShapeGeometry(shape, 16)
  }, [])

  useFrame(() => {
    const t = Date.now() * 0.0008
    if (lake1Ref.current) lake1Ref.current.position.y = 0.08 + Math.sin(t) * 0.015
    if (lake2Ref.current) lake2Ref.current.position.y = 0.08 + Math.sin(t * 0.9 + 1) * 0.015
    if (pondRef.current) pondRef.current.position.y = 0.08 + Math.sin(t * 0.7) * 0.015
  })

  return (
    <group>
      {/* Lake 1 — main lake, northeast */}
      <mesh position={[45, 0.01, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={lake1BankGeo} attach="geometry" />
        <meshStandardMaterial color="#2a4a1e" roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lake1Ref} position={[45, 0.08, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={lake1Geo} attach="geometry" />
        <meshStandardMaterial color="#1a5080" transparent opacity={0.7} roughness={0.15} metalness={0.2} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Lake 2 — smaller, southwest */}
      <mesh position={[-55, 0.01, 50]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={lake2BankGeo} attach="geometry" />
        <meshStandardMaterial color="#2a4a1e" roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lake2Ref} position={[-55, 0.08, 50]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={lake2Geo} attach="geometry" />
        <meshStandardMaterial color="#1a4a7a" transparent opacity={0.7} roughness={0.15} metalness={0.2} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Pond — organic shape */}
      <mesh position={[-40, 0.01, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={pondBankGeo} attach="geometry" />
        <meshStandardMaterial color="#2a4a1e" roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={pondRef} position={[-40, 0.08, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={pondGeo} attach="geometry" />
        <meshStandardMaterial color="#1a4a7a" transparent opacity={0.7} roughness={0.15} metalness={0.2} flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
