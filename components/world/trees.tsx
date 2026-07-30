'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getTerrainHeight } from './terrain'
import { useGameStore } from '@/lib/game-store'
import { playChop } from '@/lib/audio'
import * as THREE from 'three'

interface TreeData {
  pos: [number, number, number]
  type: 'spruce' | 'birch' | 'pine' | 'maple' | 'cedar'
  scale: number
  id: number
  lean: number
  leanDir: number
}

interface BushData {
  pos: [number, number, number]
  id: number
  hasBerries: boolean
  scale: number
}

function Tree({ position, type, scale, lean, leanDir, onChop }: { 
  position: [number, number, number]; type: string; scale: number; 
  lean: number; leanDir: number; onChop: () => void 
}) {
  const [health, setHealth] = useState(5)
  const [visible, setVisible] = useState(true)
  const groupRef = useRef<THREE.Group>(null)
  const shakeRef = useRef(0)
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, [])
  const swaySpeed = useMemo(() => 0.8 + Math.random() * 0.4, [])

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return
    const t = Date.now() * 0.001
    // Multi-frequency wind sway for natural look
    const sway = Math.sin(t * swaySpeed + swayOffset) * 0.012 
      + Math.sin(t * swaySpeed * 2.3 + swayOffset * 1.7) * 0.005
    groupRef.current.rotation.z = lean * Math.cos(leanDir) + sway
    groupRef.current.rotation.x = lean * Math.sin(leanDir)
    
    if (shakeRef.current > 0) {
      shakeRef.current -= delta * 4
      groupRef.current.rotation.x += Math.sin(shakeRef.current * 20) * shakeRef.current * 0.1
    }
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    // Require axe to chop trees
    const state = useGameStore.getState()
    if (!state.hasItem('axe')) {
      state.log('Need an axe to chop trees.')
      return
    }
    // Must be close to the tree
    const playerPos = state.playerPos
    const treePos = position
    const dx = playerPos[0] - treePos[0]
    const dz = playerPos[2] - treePos[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 4) {
      state.log('Get closer to chop the tree.')
      return
    }
    useGameStore.setState({ playerAction: 'chopping' })
    setTimeout(() => useGameStore.setState({ playerAction: 'idle' }), 600)
    playChop()
    shakeRef.current = 1
    const h = health - 1
    setHealth(h)
    if (h <= 0) {
      setVisible(false)
      onChop()
      // Regrow after 3 minutes
      setTimeout(() => {
        setVisible(true)
        setHealth(5)
      }, 180000)
    }
  }, [health, onChop])

  if (!visible) return null

  if (type === 'birch') {
    return (
      <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
        <mesh position={[0, 3, 0]} visible={false}>
          <cylinderGeometry args={[2.5, 2.5, 7, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Trunk with slight curve */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.18, 5, 7]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.9} flatShading />
        </mesh>
        {/* Dark bark marks */}
        <mesh position={[0.09, 1.8, 0.06]}>
          <boxGeometry args={[0.05, 0.35, 0.03]} />
          <meshStandardMaterial color="#2a2520" roughness={1} flatShading />
        </mesh>
        <mesh position={[-0.07, 3.0, -0.05]}>
          <boxGeometry args={[0.04, 0.25, 0.03]} />
          <meshStandardMaterial color="#2a2520" roughness={1} flatShading />
        </mesh>
        <mesh position={[0.05, 4.0, 0.03]}>
          <boxGeometry args={[0.03, 0.2, 0.03]} />
          <meshStandardMaterial color="#2a2520" roughness={1} flatShading />
        </mesh>
        {/* Branch stubs */}
        <mesh position={[0.15, 3.5, 0]} rotation={[0, 0, 0.8]} castShadow>
          <cylinderGeometry args={[0.02, 0.04, 0.6, 4]} />
          <meshStandardMaterial color="#d8d0c0" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[-0.12, 4.0, 0.05]} rotation={[0, 0, -0.6]} castShadow>
          <cylinderGeometry args={[0.02, 0.03, 0.5, 4]} />
          <meshStandardMaterial color="#d8d0c0" roughness={0.9} flatShading />
        </mesh>
        {/* Multi-sphere canopy with depth */}
        <mesh position={[0, 5.4, 0]} castShadow>
          <icosahedronGeometry args={[1.7, 1]} />
          <meshStandardMaterial color="#4a9a3a" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.9, 5.9, 0.4]} castShadow>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#3d8530" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.7, 5.1, -0.5]} castShadow>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial color="#55a845" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.3, 6.3, -0.3]} castShadow>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color="#4a9538" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.4, 6.0, 0.6]} castShadow>
          <icosahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#5aaa48" roughness={0.85} flatShading />
        </mesh>
      </group>
    )
  }

  if (type === 'pine') {
    return (
      <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
        <mesh position={[0, 3.5, 0]} visible={false}>
          <cylinderGeometry args={[2.5, 2.5, 9, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Thick trunk with texture */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.3, 4.5, 7]} />
          <meshStandardMaterial color="#2d1a08" roughness={1} flatShading />
        </mesh>
        {/* Exposed roots */}
        <mesh position={[0.22, 0.12, 0.15]} castShadow>
          <sphereGeometry args={[0.14, 5, 3]} />
          <meshStandardMaterial color="#3d2510" roughness={1} flatShading />
        </mesh>
        <mesh position={[-0.18, 0.08, -0.2]} castShadow>
          <sphereGeometry args={[0.11, 5, 3]} />
          <meshStandardMaterial color="#3d2510" roughness={1} flatShading />
        </mesh>
        <mesh position={[0.05, 0.1, 0.25]} castShadow>
          <sphereGeometry args={[0.09, 4, 3]} />
          <meshStandardMaterial color="#3d2510" roughness={1} flatShading />
        </mesh>
        {/* Layered canopy — wider at bottom, darker inside */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <coneGeometry args={[2.4, 2.8, 8]} />
          <meshStandardMaterial color="#0c2810" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 5.3, 0]} castShadow>
          <coneGeometry args={[1.9, 2.4, 7]} />
          <meshStandardMaterial color="#103015" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 6.7, 0]} castShadow>
          <coneGeometry args={[1.3, 2.0, 7]} />
          <meshStandardMaterial color="#14381a" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 7.8, 0]} castShadow>
          <coneGeometry args={[0.7, 1.4, 6]} />
          <meshStandardMaterial color="#1a4020" roughness={0.9} flatShading />
        </mesh>
      </group>
    )
  }

  if (type === 'maple') {
    return (
      <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
        <mesh position={[0, 3, 0]} visible={false}>
          <cylinderGeometry args={[3, 3, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Thicker, gnarled trunk */}
        <mesh position={[0, 2.0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.25, 4, 6]} />
          <meshStandardMaterial color="#3a2010" roughness={1} flatShading />
        </mesh>
        {/* Main branches splitting */}
        <mesh position={[0.3, 3.5, 0.1]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.04, 0.08, 1.5, 5]} />
          <meshStandardMaterial color="#3a2010" roughness={1} flatShading />
        </mesh>
        <mesh position={[-0.25, 3.8, -0.1]} rotation={[0, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.03, 0.07, 1.3, 5]} />
          <meshStandardMaterial color="#3a2010" roughness={1} flatShading />
        </mesh>
        {/* Full, rounded canopy */}
        <mesh position={[0, 5.0, 0]} castShadow>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshStandardMaterial color="#2d7a25" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[1.0, 5.2, 0.5]} castShadow>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#3a8a30" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.8, 4.8, -0.6]} castShadow>
          <icosahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color="#258020" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.2, 5.8, -0.4]} castShadow>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#35922c" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.5, 5.5, 0.7]} castShadow>
          <icosahedronGeometry args={[1.0, 1]} />
          <meshStandardMaterial color="#409038" roughness={0.85} flatShading />
        </mesh>
      </group>
    )
  }

  if (type === 'cedar') {
    return (
      <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
        <mesh position={[0, 4, 0]} visible={false}>
          <cylinderGeometry args={[2, 2, 10, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Tall straight trunk */}
        <mesh position={[0, 3.0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.2, 6, 6]} />
          <meshStandardMaterial color="#4a2a12" roughness={1} flatShading />
        </mesh>
        {/* Drooping branch layers */}
        <mesh position={[0, 3.0, 0]} castShadow rotation={[0.15, 0, 0]}>
          <coneGeometry args={[1.8, 1.2, 7]} />
          <meshStandardMaterial color="#1a3a18" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 3.8, 0]} castShadow rotation={[-0.1, 0.5, 0]}>
          <coneGeometry args={[1.5, 1.2, 7]} />
          <meshStandardMaterial color="#1e4220" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 4.6, 0]} castShadow rotation={[0.05, 1.0, 0]}>
          <coneGeometry args={[1.3, 1.2, 6]} />
          <meshStandardMaterial color="#224a24" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 5.3, 0]} castShadow rotation={[-0.08, 1.5, 0]}>
          <coneGeometry args={[1.1, 1.1, 6]} />
          <meshStandardMaterial color="#265228" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 6.0, 0]} castShadow>
          <coneGeometry args={[0.8, 1.0, 6]} />
          <meshStandardMaterial color="#2a5a2c" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 6.6, 0]} castShadow>
          <coneGeometry args={[0.5, 0.8, 5]} />
          <meshStandardMaterial color="#2e6230" roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 7.1, 0]} castShadow>
          <coneGeometry args={[0.25, 0.6, 4]} />
          <meshStandardMaterial color="#326a34" roughness={0.9} flatShading />
        </mesh>
      </group>
    )
  }

  // Spruce (default) — tall and narrow with many dense layers
  return (
    <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
      <mesh position={[0, 4, 0]} visible={false}>
        <cylinderGeometry args={[2.5, 2.5, 9, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.16, 4, 6]} />
        <meshStandardMaterial color="#3d2210" roughness={1} flatShading />
      </mesh>
      {/* Many cone layers — dense spruce look */}
      <mesh position={[0, 3.0, 0]} castShadow>
        <coneGeometry args={[1.6, 1.8, 7]} />
        <meshStandardMaterial color="#0e3018" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[1.4, 1.6, 7]} />
        <meshStandardMaterial color="#12381c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 4.7, 0]} castShadow>
        <coneGeometry args={[1.2, 1.5, 6]} />
        <meshStandardMaterial color="#164020" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[1.0, 1.3, 6]} />
        <meshStandardMaterial color="#1a4824" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 6.2, 0]} castShadow>
        <coneGeometry args={[0.75, 1.1, 5]} />
        <meshStandardMaterial color="#1e5028" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 6.8, 0]} castShadow>
        <coneGeometry args={[0.5, 0.9, 5]} />
        <meshStandardMaterial color="#22582c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 7.3, 0]} castShadow>
        <coneGeometry args={[0.25, 0.6, 4]} />
        <meshStandardMaterial color="#266030" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function BerryBush({ position, hasBerries: initialBerries, scale, onPick }: { 
  position: [number, number, number]; hasBerries: boolean; scale: number; onPick: () => void 
}) {
  const [hasBerries, setHasBerries] = useState(initialBerries)
  const groupRef = useRef<THREE.Group>(null)
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() * 0.001
    groupRef.current.rotation.z = Math.sin(t * 1.2 + swayOffset) * 0.015
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!hasBerries) return
    // Must be close
    const playerPos = useGameStore.getState().playerPos
    const dx = playerPos[0] - position[0]
    const dz = playerPos[2] - position[2]
    if (Math.sqrt(dx * dx + dz * dz) > 4) {
      useGameStore.getState().log('Get closer to pick berries.')
      return
    }
    setHasBerries(false)
    onPick()
    setTimeout(() => setHasBerries(true), 60000)
  }, [hasBerries, onPick])

  return (
    <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
      <mesh position={[0, 0.5, 0]} visible={false}>
        <sphereGeometry args={[1.2, 6, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Multi-sphere bush shape — always green */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color="#2a5a2a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.3, 0.35, 0.2]} castShadow>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color="#2d5d2d" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.25, 0.3, -0.15]} castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color="#256025" roughness={0.9} flatShading />
      </mesh>
      {/* Berries sit ON TOP of the bush surface */}
      {hasBerries && (
        <>
          <mesh position={[0.38, 0.8, 0.32]} castShadow>
            <sphereGeometry args={[0.1, 5, 4]} />
            <meshStandardMaterial color="#cc2020" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[-0.32, 0.75, -0.28]} castShadow>
            <sphereGeometry args={[0.1, 5, 4]} />
            <meshStandardMaterial color="#b81818" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.05, 0.93, 0.1]} castShadow>
            <sphereGeometry args={[0.09, 5, 4]} />
            <meshStandardMaterial color="#d42a2a" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.45, 0.58, -0.18]} castShadow>
            <sphereGeometry args={[0.09, 5, 4]} />
            <meshStandardMaterial color="#c01515" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[-0.28, 0.83, 0.35]} castShadow>
            <sphereGeometry args={[0.1, 5, 4]} />
            <meshStandardMaterial color="#dd2525" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.18, 0.88, -0.3]} castShadow>
            <sphereGeometry args={[0.08, 5, 4]} />
            <meshStandardMaterial color="#aa1010" roughness={0.4} flatShading />
          </mesh>
        </>
      )}
    </group>
  )
}

// Dead/fallen tree for variety
function DeadTree({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Fallen trunk */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2 - 0.1]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 3.5, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={1} flatShading />
      </mesh>
      {/* Broken stump */}
      <mesh position={[-1.5, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 5]} />
        <meshStandardMaterial color="#4a3520" roughness={1} flatShading />
      </mesh>
      {/* A few dead branch stubs */}
      <mesh position={[0.5, 0.25, 0.1]} rotation={[0.3, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.02, 0.04, 0.5, 4]} />
        <meshStandardMaterial color="#5a4530" roughness={1} flatShading />
      </mesh>
    </group>
  )
}



export function Forest() {
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const waterZones = useMemo(() => [
    { x: 45, z: 5, radius: 22 },
    { x: -55, z: 50, radius: 16 },
    { x: -40, z: -40, radius: 16 },
  ], [])

  const isInWater = useCallback((x: number, z: number) => {
    return waterZones.some((zone) => {
      const dx = x - zone.x
      const dz = z - zone.z
      return Math.sqrt(dx * dx + dz * dz) < zone.radius
    })
  }, [waterZones])

  // Biome zones — don't spawn regular trees/objects here
  const isInBiome = useCallback((x: number, z: number) => {
    const biomes = [
      { cx: -75, cz: -80, radius: 22 },  // Rocky clearing
      { cx: 85, cz: -75, radius: 20 },   // Dense forest
      { cx: 0, cz: 100, radius: 20 },    // Meadow
      { cx: -90, cz: 25, radius: 20 },   // Swamp
    ]
    return biomes.some((b) => {
      const dx = x - b.cx
      const dz = z - b.cz
      return Math.sqrt(dx * dx + dz * dz) < b.radius
    })
  }, [])

  const trees = useMemo(() => {
    const result: TreeData[] = []
    const types: TreeData['type'][] = ['spruce', 'spruce', 'spruce', 'birch', 'pine', 'pine', 'maple', 'cedar', 'cedar']

    for (let i = 0; i < 120; i++) {
      const x = (Math.random() - 0.5) * 240
      const z = (Math.random() - 0.5) * 240
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue
      if (isInWater(x, z)) continue
      if (isInBiome(x, z)) continue

      const y = getTerrainHeight(x, z)
      const type = types[Math.floor(Math.random() * types.length)]
      const scale = 0.55 + Math.random() * 0.55
      const lean = Math.random() * 0.04
      const leanDir = Math.random() * Math.PI * 2
      result.push({ pos: [x, y, z], type, scale, id: i, lean, leanDir })
    }
    return result
  }, [isInWater, isInBiome])

  const bushes = useMemo(() => {
    const result: BushData[] = []
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      if (isInWater(x, z)) continue
      if (isInBiome(x, z)) continue
      const y = getTerrainHeight(x, z)
      const scale = 0.7 + Math.random() * 0.5
      result.push({ pos: [x, y, z], id: i, hasBerries: true, scale })
    }
    return result
  }, [isInWater, isInBiome])

  const deadTrees = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number }[] = []
    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * 200
      const z = (Math.random() - 0.5) * 200
      if (isInWater(x, z)) continue
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue
      result.push({ pos: [x, getTerrainHeight(x, z), z], rot: Math.random() * Math.PI * 2 })
    }
    return result
  }, [isInWater])



  return (
    <group>
      {trees.map((tree) => (
        <Tree
          key={tree.id}
          position={tree.pos}
          type={tree.type}
          scale={tree.scale}
          lean={tree.lean}
          leanDir={tree.leanDir}
          onChop={() => {
            addItem('firewood', 2)
            addItem('branches', 3)
            log(`Chopped a ${tree.type} tree! +2 firewood, +3 branches`)
          }}
        />
      ))}
      {bushes.map((bush) => (
        <BerryBush
          key={`bush-${bush.id}`}
          position={bush.pos}
          hasBerries={bush.hasBerries}
          scale={bush.scale}
          onPick={() => {
            addItem('blueberries', 3)
            log('Picked 3 blueberries!')
          }}
        />
      ))}
      {deadTrees.map((dt, i) => (
        <DeadTree key={`dead-${i}`} position={dt.pos} rotation={dt.rot} />
      ))}

    </group>
  )
}
