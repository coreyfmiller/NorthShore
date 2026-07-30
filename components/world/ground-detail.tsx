'use client'

import { useMemo, useState, useCallback } from 'react'
import { useGameStore } from '@/lib/game-store'
import { playPickup } from '@/lib/audio'

interface DetailItem {
  type: 'rock' | 'stick' | 'leaf'
  pos: [number, number, number]
  rot: number
  scale: number
  id: number
}

function PickableItem({ item, onPick }: { item: DetailItem; onPick: () => void }) {
  const [visible, setVisible] = useState(true)

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    setVisible(false)
    playPickup()
    onPick()
  }, [onPick])

  if (!visible) return null

  if (item.type === 'rock') {
    return (
      <mesh position={item.pos} rotation={[0, item.rot, 0]} scale={item.scale} onClick={handleClick}>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshLambertMaterial color="#4a4540" flatShading />
      </mesh>
    )
  }
  if (item.type === 'stick') {
    return (
      <mesh position={item.pos} rotation={[Math.PI / 2, item.rot, 0]} scale={[0.03, item.scale * 2, 0.03]} onClick={handleClick}>
        <cylinderGeometry args={[1, 0.8, 1, 4]} />
        <meshLambertMaterial color="#4a3018" flatShading />
      </mesh>
    )
  }
  // Leaf
  return (
    <mesh position={item.pos} rotation={[-Math.PI / 2, 0, item.rot]} scale={item.scale * 0.5} onClick={handleClick}>
      <circleGeometry args={[0.2, 5]} />
      <meshLambertMaterial color={item.id % 2 === 0 ? '#5a3a10' : '#3a5a20'} flatShading side={2} />
    </mesh>
  )
}

export function GroundDetail() {
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const details = useMemo(() => {
    const items: DetailItem[] = []
    
    const waterZones = [
      { x: 45, z: 5, radius: 22 },
      { x: -55, z: 50, radius: 16 },
      { x: -40, z: -40, radius: 16 },
    ]

    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue

      const type = Math.random() < 0.4 ? 'rock' : Math.random() < 0.6 ? 'stick' : 'leaf'
      const rot = Math.random() * Math.PI * 2
      const scale = 0.3 + Math.random() * 0.4

      items.push({ type, pos: [x, 0.02, z], rot, scale, id: i })
    }
    return items
  }, [])

  return (
    <group>
      {details.map((item) => (
        <PickableItem
          key={item.id}
          item={item}
          onPick={() => {
            if (item.type === 'stick') {
              addItem('branches', 1)
              log('Picked up a branch.')
            } else if (item.type === 'rock') {
              addItem('rocks', 1)
              log('Picked up a rock.')
            } else {
              addItem('tinder', 1)
              log('Picked up some tinder.')
            }
          }}
        />
      ))}
    </group>
  )
}


// Wild mushrooms — some safe, some poisonous
interface MushroomData {
  pos: [number, number, number]
  id: number
  poisonous: boolean
  capColor: string
  stemColor: string
  scale: number
  rotation: number
}

function Mushroom({ data, onPick }: { data: MushroomData; onPick: () => void }) {
  const [visible, setVisible] = useState(true)

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!visible) return
    setVisible(false)
    onPick()
    // Regrow after 2 minutes
    setTimeout(() => setVisible(true), 120000)
  }, [visible, onPick])

  if (!visible) return null

  return (
    <group position={data.pos} scale={data.scale} rotation={[0, data.rotation, 0]} onClick={handleClick}>
      {/* Stem */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 6]} />
        <meshStandardMaterial color={data.stemColor} roughness={0.8} flatShading />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.13, 0]} castShadow>
        <sphereGeometry args={[0.07, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={data.capColor} roughness={0.7} flatShading />
      </mesh>
      {/* Cap underside */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.07, 0.03, 0.02, 6]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.8} flatShading />
      </mesh>
    </group>
  )
}

export function Mushrooms() {
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const mushrooms = useMemo(() => {
    const result: MushroomData[] = []
    const waterZones = [
      { x: 45, z: 5, radius: 22 },
      { x: -55, z: 50, radius: 16 },
      { x: -40, z: -40, radius: 16 },
    ]

    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue

      const poisonous = Math.random() < 0.25 // 25% chance poisonous
      const scale = 0.8 + Math.random() * 0.6
      const rotation = Math.random() * Math.PI * 2

      // Safe mushrooms are brown/tan, poisonous ones are brighter/spotted
      const capColor = poisonous
        ? (Math.random() > 0.5 ? '#cc3030' : '#8a2aaa')
        : (Math.random() > 0.5 ? '#8a6a40' : '#6a5030')
      const stemColor = poisonous ? '#e8e0d0' : '#d4c8b0'

      result.push({ pos: [x, 0, z], id: i, poisonous, capColor, stemColor, scale, rotation })
    }
    return result
  }, [])

  return (
    <group>
      {mushrooms.map((m) => (
        <Mushroom
          key={`mush-${m.id}`}
          data={m}
          onPick={() => {
            if (m.poisonous) {
              addItem('poisonous_mushroom', 1)
              log('Picked a suspicious looking mushroom...')
            } else {
              addItem('wild_mushroom', 1)
              log('Picked a wild mushroom.')
            }
          }}
        />
      ))}
    </group>
  )
}


// Cattails growing near water edges
function Cattail({ position, scale }: { position: [number, number, number]; scale: number }) {
  const [visible, setVisible] = useState(true)
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!visible) return
    setVisible(false)
    addItem('cattail_root', 1)
    addItem('tinder', 1)
    log('Harvested cattail. +1 cattail root, +1 tinder')
    setTimeout(() => setVisible(true), 150000) // Regrow 2.5 min
  }, [visible, addItem, log])

  if (!visible) return null

  return (
    <group position={position} scale={scale} onClick={handleClick}>
      {/* Stem */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.8, 4]} />
        <meshStandardMaterial color="#4a6a30" roughness={0.9} flatShading />
      </mesh>
      {/* Brown head */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.035, 0.12, 4, 5]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
      </mesh>
      {/* Leaves */}
      <mesh position={[0.02, 0.3, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.01, 0.5, 0.04]} />
        <meshStandardMaterial color="#3a5a20" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.02, 0.25, 0]} rotation={[0, 0.5, -0.15]} castShadow>
        <boxGeometry args={[0.01, 0.45, 0.035]} />
        <meshStandardMaterial color="#3a5a20" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

export function Cattails() {
  const cattails = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number }[] = []
    // Place cattails in clusters of 10-20, inside the green bank area
    // Bank is ~3 units wider than water, so place between water edge and bank edge
    const waters = [
      { cx: 45, cz: 5, waterRadius: 18, clusters: 3 },
      { cx: -55, cz: 50, waterRadius: 12, clusters: 2 },
      { cx: -40, cz: -40, waterRadius: 12, clusters: 2 },
    ]
    for (const water of waters) {
      for (let c = 0; c < water.clusters; c++) {
        // Pick a random spot on the shore for this cluster
        const clusterAngle = (c / water.clusters) * Math.PI * 2 + Math.random() * 1.5
        const clusterCount = 10 + Math.floor(Math.random() * 11) // 10-20 per cluster
        
        for (let i = 0; i < clusterCount; i++) {
          // Place tight to the water edge, within the bank
          const angle = clusterAngle + (Math.random() - 0.5) * 0.4
          const r = water.waterRadius + 0.3 + Math.random() * 1.2 // Stay close to water edge
          const spreadX = (Math.random() - 0.5) * 1.2
          const spreadZ = (Math.random() - 0.5) * 1.2
          const x = water.cx + Math.cos(angle) * r + spreadX
          const z = water.cz - Math.sin(angle) * r + spreadZ
          result.push({ pos: [x, 0, z], scale: 0.7 + Math.random() * 0.5 })
        }
      }
    }
    return result
  }, [])

  return (
    <group>
      {cattails.map((c, i) => (
        <Cattail key={`cattail-${i}`} position={c.pos} scale={c.scale} />
      ))}
    </group>
  )
}


// Supply crates — random loot boxes scattered in biomes
function SupplyCrate({ position }: { position: [number, number, number] }) {
  const [opened, setOpened] = useState(false)
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (opened) return
    // Check proximity
    const playerPos = useGameStore.getState().playerPos
    const dx = playerPos[0] - position[0]
    const dz = playerPos[2] - position[2]
    if (Math.sqrt(dx * dx + dz * dz) > 4) {
      log('Get closer to open the crate.')
      return
    }
    setOpened(true)
    // Random loot table
    const lootTable = [
      () => { addItem('canned_food', 2); addItem('rope', 1); log('Found canned food and rope!') },
      () => { addItem('arrows', 5); addItem('tinder', 3); log('Found arrows and tinder!') },
      () => { addItem('firewood', 4); addItem('branches', 6); log('Found firewood and branches!') },
      () => { addItem('fishing_line', 1); addItem('canned_food', 1); log('Found a fishing line and food!') },
      () => { addItem('hide', 2); addItem('rope', 2); log('Found hides and rope!') },
      () => { addItem('leather', 1); addItem('canned_food', 3); log('Found leather and lots of food!') },
    ]
    lootTable[Math.floor(Math.random() * lootTable.length)]()
  }, [opened, position, addItem, log])

  return (
    <group position={position} onClick={handleClick}>
      {opened ? (
        // Open empty crate
        <group>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.4]} />
            <meshStandardMaterial color="#5a4020" roughness={0.9} flatShading />
          </mesh>
          {/* Open lid leaning back */}
          <mesh position={[0, 0.35, -0.2]} rotation={[-0.8, 0, 0]} castShadow>
            <boxGeometry args={[0.62, 0.04, 0.4]} />
            <meshStandardMaterial color="#6a4a25" roughness={0.9} flatShading />
          </mesh>
        </group>
      ) : (
        // Closed crate with marking
        <group>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.6, 0.4, 0.4]} />
            <meshStandardMaterial color="#6a4a25" roughness={0.9} flatShading />
          </mesh>
          {/* Metal bands */}
          <mesh position={[0, 0.2, 0.21]} castShadow>
            <boxGeometry args={[0.62, 0.05, 0.02]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.2, -0.21]} castShadow>
            <boxGeometry args={[0.62, 0.05, 0.02]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} flatShading />
          </mesh>
          {/* Question mark indicator */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.06, 5, 4]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.5} emissive="#aa8800" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function SupplyCrates() {
  const crates = useMemo(() => {
    const result: [number, number, number][] = []
    // Place supply crates in each biome area
    const spots = [
      // Rocky clearing area
      { cx: -75, cz: -80, count: 2 },
      // Dense forest
      { cx: 85, cz: -75, count: 2 },
      // Meadow
      { cx: 0, cz: 100, count: 1 },
      // Swamp
      { cx: -90, cz: 25, count: 2 },
      // Random spots around map
      { cx: 50, cz: 70, count: 1 },
      { cx: -60, cz: 50, count: 1 },
    ]
    for (const spot of spots) {
      for (let i = 0; i < spot.count; i++) {
        const x = spot.cx + (Math.random() - 0.5) * 15
        const z = spot.cz + (Math.random() - 0.5) * 15
        result.push([x, 0, z])
      }
    }
    return result
  }, [])

  return (
    <group>
      {crates.map((pos, i) => (
        <SupplyCrate key={`supply-${i}`} position={pos} />
      ))}
    </group>
  )
}
