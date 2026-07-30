'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

// Map is 260x260 (-130 to 130). 8% = ~54 sq units = radius ~18-20 each zone

// Rocky clearing — boulder field with bare ground
export function RockyClearing() {
  const rocks = useMemo(() => {
    const result: { pos: [number, number, number]; scale: [number, number, number]; rot: number; color: string }[] = []
    const cx = -75, cz = -80
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 18
      const x = cx + Math.cos(angle) * dist
      const z = cz + Math.sin(angle) * dist
      const sx = 0.4 + Math.random() * 1.8
      const sy = 0.3 + Math.random() * 1.0
      const sz = 0.4 + Math.random() * 1.8
      const shade = 0.35 + Math.random() * 0.2
      result.push({
        pos: [x, sy * 0.3, z],
        scale: [sx, sy, sz],
        rot: Math.random() * Math.PI,
        color: `rgb(${Math.floor(shade * 255)}, ${Math.floor(shade * 245)}, ${Math.floor(shade * 235)})`
      })
    }
    return result
  }, [])

  return (
    <group>
      <mesh position={[-75, 0.015, -80]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 20]} />
        <meshStandardMaterial color="#4a4030" roughness={1} flatShading />
      </mesh>
      <mesh position={[-75, 0.02, -80]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 18]} />
        <meshStandardMaterial color="#5a4a38" roughness={1} flatShading />
      </mesh>
      {rocks.map((rock, i) => (
        <mesh key={i} position={rock.pos} scale={rock.scale} rotation={[Math.random() * 0.2, rock.rot, Math.random() * 0.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// Dense forest zone — tightly packed dark trees
export function DenseForestZone() {
  const trees = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; rot: number }[] = []
    const cx = 85, cz = -75
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 2 + Math.random() * 18
      const x = cx + Math.cos(angle) * dist
      const z = cz + Math.sin(angle) * dist
      result.push({ pos: [x, 0, z], scale: 0.5 + Math.random() * 0.4, rot: Math.random() * Math.PI * 2 })
    }
    return result
  }, [])

  return (
    <group>
      {/* Darker ground under canopy */}
      <mesh position={[85, 0.016, -75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 18]} />
        <meshStandardMaterial color="#1a2a12" roughness={1} flatShading />
      </mesh>
      {trees.map((tree, i) => (
        <group key={i} position={tree.pos} scale={tree.scale} rotation={[0, tree.rot, 0]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.1, 3, 5]} />
            <meshStandardMaterial color="#2a1808" roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[1.0, 1.5, 6]} />
            <meshStandardMaterial color="#0a2008" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 3.3, 0]} castShadow>
            <coneGeometry args={[0.8, 1.3, 6]} />
            <meshStandardMaterial color="#0c2810" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0, 4.0, 0]} castShadow>
            <coneGeometry args={[0.5, 1.0, 5]} />
            <meshStandardMaterial color="#0e3012" roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Open meadow clearing — wildflowers and tall grass in a forest gap
export function BeachZone() {
  const flowers = useMemo(() => {
    const result: { pos: [number, number, number]; color: string; scale: number }[] = []
    const cx = 0, cz = 100
    const colors = ['#d44080', '#e0a020', '#d0d040', '#8040c0', '#e06030', '#ffffff']
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 17
      const x = cx + Math.cos(angle) * dist
      const z = cz + Math.sin(angle) * dist
      result.push({ pos: [x, 0, z], color: colors[Math.floor(Math.random() * colors.length)], scale: 0.6 + Math.random() * 0.5 })
    }
    return result
  }, [])

  const tallGrass = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number; scale: number }[] = []
    const cx = 0, cz = 100
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 8 + Math.random() * 12
      const x = cx + Math.cos(angle) * dist
      const z = cz + Math.sin(angle) * dist
      result.push({ pos: [x, 0, z], rot: Math.random() * Math.PI, scale: 0.7 + Math.random() * 0.4 })
    }
    return result
  }, [])

  return (
    <group>
      {/* Lighter green ground — organic shape */}
      <mesh position={[0, 0.014, 100]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 24]} />
        <meshStandardMaterial color="#3a6a28" roughness={1} flatShading />
      </mesh>
      {/* Inner lighter patch */}
      <mesh position={[2, 0.016, 98]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 16]} />
        <meshStandardMaterial color="#4a7a30" roughness={1} flatShading />
      </mesh>
      {/* Wildflowers */}
      {flowers.map((f, i) => (
        <group key={`flower-${i}`} position={f.pos} scale={f.scale}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.01, 0.15, 3]} />
            <meshStandardMaterial color="#3a6020" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.04, 5, 4]} />
            <meshStandardMaterial color={f.color} roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
      {/* Tall grass at edges */}
      {tallGrass.map((g, i) => (
        <mesh key={`tgrass-${i}`} position={[g.pos[0], 0.2, g.pos[2]]} rotation={[0, g.rot, 0]} scale={g.scale} castShadow>
          <coneGeometry args={[0.06, 0.4, 4]} />
          <meshStandardMaterial color="#5a8a35" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// Marshy swamp area
export function SwampZone() {
  const deadTrees = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number; scale: number; lean: number }[] = []
    const cx = -90, cz = 25
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 18
      const x = cx + Math.cos(angle) * dist
      const z = cz + Math.sin(angle) * dist
      result.push({ pos: [x, 0, z], rot: Math.random() * Math.PI * 2, scale: 0.6 + Math.random() * 0.5, lean: (Math.random() - 0.5) * 0.25 })
    }
    return result
  }, [])

  const puddles = useMemo(() => {
    const result: { pos: [number, number]; radius: number }[] = []
    const cx = -90, cz = 25
    for (let i = 0; i < 6; i++) {
      result.push({
        pos: [cx + (Math.random() - 0.5) * 30, cz + (Math.random() - 0.5) * 30],
        radius: 1 + Math.random() * 2,
      })
    }
    return result
  }, [])

  return (
    <group>
      {/* Dark boggy ground */}
      <mesh position={[-90, 0.015, 25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 18]} />
        <meshStandardMaterial color="#2a3018" roughness={1} flatShading />
      </mesh>
      {/* Murky puddles */}
      {puddles.map((p, i) => (
        <mesh key={`puddle-${i}`} position={[p.pos[0], 0.025, p.pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p.radius, 8]} />
          <meshStandardMaterial color="#1a3020" transparent opacity={0.6} roughness={0.2} flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Dead/bare trees */}
      {deadTrees.map((tree, i) => (
        <group key={`swamp-tree-${i}`} position={tree.pos} rotation={[tree.lean, tree.rot, tree.lean * 0.5]} scale={tree.scale}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.12, 4, 5]} />
            <meshStandardMaterial color="#3a3025" roughness={1} flatShading />
          </mesh>
          <mesh position={[0.15, 3.2, 0.1]} rotation={[0, 0, 0.8]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.7, 4]} />
            <meshStandardMaterial color="#3a3025" roughness={1} flatShading />
          </mesh>
          <mesh position={[-0.1, 2.8, -0.05]} rotation={[0.2, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.5, 4]} />
            <meshStandardMaterial color="#3a3025" roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      {/* Moss patches */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`moss-${i}`} position={[-90 + (Math.random() - 0.5) * 34, 0.02, 25 + (Math.random() - 0.5) * 34]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
          <circleGeometry args={[0.5 + Math.random() * 1.0, 6]} />
          <meshStandardMaterial color="#1a4010" roughness={1} flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
