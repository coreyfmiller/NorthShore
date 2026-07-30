'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { useGameStore } from '@/lib/game-store'
import * as THREE from 'three'

// Load ALL models at the top level in one batch
const TREE_PATHS = [
  '/models/nature/PineTree_1.fbx',
  '/models/nature/PineTree_2.fbx',
  '/models/nature/PineTree_3.fbx',
  '/models/nature/BirchTree_1.fbx',
  '/models/nature/BirchTree_2.fbx',
  '/models/nature/CommonTree_1.fbx',
  '/models/nature/CommonTree_2.fbx',
  '/models/nature/BirchTree_Dead_1.fbx',
]

const ROCK_PATHS = [
  '/models/nature/Rock_1.fbx',
  '/models/nature/Rock_2.fbx',
  '/models/nature/Rock_3.fbx',
  '/models/nature/Rock_Moss_1.fbx',
  '/models/nature/Rock_Moss_2.fbx',
]

const BUSH_PATHS = [
  '/models/nature/BushBerries_1.fbx',
  '/models/nature/BushBerries_2.fbx',
]

const EXTRA_PATHS = [
  '/models/nature/Grass.fbx',
  '/models/nature/Plant_1.fbx',
  '/models/nature/Plant_2.fbx',
  '/models/nature/TreeStump.fbx',
  '/models/nature/TreeStump_Moss.fbx',
]

// Water zone check
function isInWater(x: number, z: number): boolean {
  const zones = [
    { x: 45, z: 5, radius: 22 },
    { x: -40, z: -40, radius: 16 },
  ]
  return zones.some((zone) => {
    const dx = x - zone.x
    const dz = z - zone.z
    return Math.sqrt(dx * dx + dz * dz) < zone.radius
  })
}

// Seeded random for consistent world generation
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// Prepare a cloned model with shadows enabled
function prepareModel(source: THREE.Group): THREE.Group {
  const clone = source.clone()
  clone.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  return clone
}

// Single component that loads everything and places it
export function NatureForest() {
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  // Load all models in batch — useLoader can take an array
  const treeModels = useLoader(FBXLoader, TREE_PATHS)
  const rockModels = useLoader(FBXLoader, ROCK_PATHS)
  const bushModels = useLoader(FBXLoader, BUSH_PATHS)
  const extraModels = useLoader(FBXLoader, EXTRA_PATHS)

  // Generate placement data
  const placements = useMemo(() => {
    const rand = seededRandom(42)
    const trees: { model: number; pos: [number, number, number]; scale: number; rot: number; id: number }[] = []
    const rocks: { model: number; pos: [number, number, number]; scale: number; rot: number }[] = []
    const bushes: { model: number; pos: [number, number, number]; scale: number; id: number }[] = []
    const extras: { model: number; pos: [number, number, number]; scale: number; rot: number }[] = []

    // Place 80 trees
    for (let i = 0; i < 80; i++) {
      const x = (rand() - 0.5) * 220
      const z = (rand() - 0.5) * 220
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue
      if (isInWater(x, z)) continue
      trees.push({
        model: Math.floor(rand() * TREE_PATHS.length),
        pos: [x, 0, z],
        scale: 0.01 + rand() * 0.005,
        rot: rand() * Math.PI * 2,
        id: i,
      })
    }

    // Place 25 rocks
    for (let i = 0; i < 25; i++) {
      const x = (rand() - 0.5) * 220
      const z = (rand() - 0.5) * 220
      if (isInWater(x, z)) continue
      rocks.push({
        model: Math.floor(rand() * ROCK_PATHS.length),
        pos: [x, 0, z],
        scale: 0.006 + rand() * 0.008,
        rot: rand() * Math.PI * 2,
      })
    }

    // Place 18 bushes
    for (let i = 0; i < 18; i++) {
      const x = (rand() - 0.5) * 160
      const z = (rand() - 0.5) * 160
      if (isInWater(x, z)) continue
      bushes.push({
        model: Math.floor(rand() * BUSH_PATHS.length),
        pos: [x, 0, z],
        scale: 0.008 + rand() * 0.004,
        id: i,
      })
    }

    // Place 40 extras (grass, plants, stumps)
    for (let i = 0; i < 40; i++) {
      const x = (rand() - 0.5) * 180
      const z = (rand() - 0.5) * 180
      if (isInWater(x, z)) continue
      extras.push({
        model: Math.floor(rand() * EXTRA_PATHS.length),
        pos: [x, 0, z],
        scale: 0.006 + rand() * 0.005,
        rot: rand() * Math.PI * 2,
      })
    }

    return { trees, rocks, bushes, extras }
  }, [])

  // Pre-clone all models for each placement
  const treeClones = useMemo(() =>
    placements.trees.map((t) => prepareModel(treeModels[t.model])),
    [placements.trees, treeModels]
  )
  const rockClones = useMemo(() =>
    placements.rocks.map((r) => prepareModel(rockModels[r.model])),
    [placements.rocks, rockModels]
  )
  const bushClones = useMemo(() =>
    placements.bushes.map((b) => prepareModel(bushModels[b.model])),
    [placements.bushes, bushModels]
  )
  const extraClones = useMemo(() =>
    placements.extras.map((e) => prepareModel(extraModels[e.model])),
    [placements.extras, extraModels]
  )

  // Tree chop state
  const [choppedTrees, setChoppedTrees] = useState<Set<number>>(new Set())
  const [bushPicked, setBushPicked] = useState<Set<number>>(new Set())

  const handleChop = useCallback((id: number, treeIndex: number) => {
    setChoppedTrees((prev) => new Set(prev).add(id))
    addItem('firewood', 2)
    addItem('branches', 3)
    const treeType = treeIndex >= 7 ? 'dead' : treeIndex >= 5 ? 'common' : treeIndex >= 3 ? 'birch' : 'pine'
    log(`Chopped a ${treeType} tree! +2 firewood, +3 branches`)
  }, [addItem, log])

  const handlePickBerry = useCallback((id: number) => {
    setBushPicked((prev) => new Set(prev).add(id))
    addItem('blueberries', 3)
    log('Picked 3 berries!')
    // Regrow after 60s
    setTimeout(() => {
      setBushPicked((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 60000)
  }, [addItem, log])

  return (
    <group>
      {/* Trees */}
      {placements.trees.map((t, i) => {
        if (choppedTrees.has(t.id)) return null
        return (
          <group
            key={`tree-${t.id}`}
            position={t.pos}
            scale={t.scale}
            rotation={[0, t.rot, 0]}
            onClick={(e) => { e.stopPropagation(); handleChop(t.id, t.model) }}
          >
            <primitive object={treeClones[i]} />
          </group>
        )
      })}

      {/* Rocks */}
      {placements.rocks.map((r, i) => (
        <group key={`rock-${i}`} position={r.pos} scale={r.scale} rotation={[0, r.rot, 0]}>
          <primitive object={rockClones[i]} />
        </group>
      ))}

      {/* Bushes */}
      {placements.bushes.map((b, i) => (
        <group
          key={`bush-${b.id}`}
          position={b.pos}
          scale={b.scale}
          onClick={(e) => {
            e.stopPropagation()
            if (!bushPicked.has(b.id)) handlePickBerry(b.id)
          }}
        >
          <primitive object={bushClones[i]} />
          {!bushPicked.has(b.id) && (
            <>
              <mesh position={[30, 50, 20]} castShadow>
                <sphereGeometry args={[5, 5, 4]} />
                <meshStandardMaterial color="#cc2020" roughness={0.5} />
              </mesh>
              <mesh position={[-20, 40, -15]} castShadow>
                <sphereGeometry args={[5, 5, 4]} />
                <meshStandardMaterial color="#b81818" roughness={0.5} />
              </mesh>
              <mesh position={[10, 60, 10]} castShadow>
                <sphereGeometry args={[4, 5, 4]} />
                <meshStandardMaterial color="#d42a2a" roughness={0.5} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* Extras (grass, plants, stumps) */}
      {placements.extras.map((e, i) => (
        <group key={`extra-${i}`} position={e.pos} scale={e.scale} rotation={[0, e.rot, 0]}>
          <primitive object={extraClones[i]} />
        </group>
      ))}
    </group>
  )
}
