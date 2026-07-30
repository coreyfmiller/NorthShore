'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/lib/game-store'
import { getTerrainHeight } from '@/components/world/terrain'
import { isInsideWater } from '@/components/world/water'
import { CharacterModel } from './character-model'
import { playChop, playFootstep, startAmbientBirds } from '@/lib/audio'

const SPEED = 14
const SPRINT_SPEED = 22

function CampfireObject({ position, onClick }: { position: [number, number, number]; onClick: () => void }) {
  const flameRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const t = Date.now() * 0.005
    if (flameRef.current) {
      flameRef.current.scale.y = 0.8 + Math.sin(t * 3) * 0.2 + Math.sin(t * 7) * 0.1
      flameRef.current.scale.x = 0.9 + Math.sin(t * 4) * 0.1
      flameRef.current.rotation.y += 0.02
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2.5 + Math.sin(t * 5) * 1 + Math.sin(t * 11) * 0.5
    }
  })

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Stone ring */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.25, 8]} />
        <meshLambertMaterial color="#4a4040" flatShading />
      </mesh>
      {/* Logs */}
      <mesh position={[0.2, 0.25, 0]} rotation={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 5]} />
        <meshLambertMaterial color="#3d2210" flatShading />
      </mesh>
      <mesh position={[-0.1, 0.25, 0.15]} rotation={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 5]} />
        <meshLambertMaterial color="#4a2a10" flatShading />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.8, 0]}>
        <coneGeometry args={[0.25, 1.0, 5]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.12, 0.5, 4]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
      </mesh>
      {/* Embers glow */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.3, 5, 3]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.3} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1, 0]} color="#ff6600" intensity={5} distance={30} decay={1.5} />
    </group>
  )
}

function ShelterObject({ position, rotation = 0, onClick }: { position: [number, number, number]; rotation?: number; onClick: () => void }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} onClick={(e) => { e.stopPropagation(); onClick() }}>
      {/* Invisible hitbox */}
      <mesh position={[0, 0.8, 0]} visible={false}>
        <boxGeometry args={[3.5, 2.5, 3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.1, 2]} />
        <meshLambertMaterial color="#4a3020" flatShading />
      </mesh>
      {/* Sloped roof */}
      <mesh position={[0, 1.2, -0.3]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[2.6, 0.1, 2.2]} />
        <meshLambertMaterial color="#2d1a08" flatShading />
      </mesh>
      {/* Support posts */}
      <mesh position={[-1.1, 0.7, 0.7]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 4]} />
        <meshLambertMaterial color="#5a3a1a" flatShading />
      </mesh>
      <mesh position={[1.1, 0.7, 0.7]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 4]} />
        <meshLambertMaterial color="#5a3a1a" flatShading />
      </mesh>
    </group>
  )
}



// Shows the currently relevant tool in the player's hand
// (moved to character-model.tsx)

export function Player({ placingItem, onPlace }: { placingItem?: string | null; onPlace?: () => void }) {
  const ref = useRef<THREE.Group>(null)
  const keys = useRef<Set<string>>(new Set())
  const { setPlayerPos, setPlayerRotation, setNearWater, setNearFire, eat, drink, startFishing, craftCampfire, craftShelter, speedUpTime, slowDownTime } = useGameStore()
  const [campfires, setCampfires] = useState<[number, number, number][]>([])
  const [shelters, setShelters] = useState<{ pos: [number, number, number]; rot: number }[]>([])
  const [traps, setTraps] = useState<{ pos: [number, number, number]; hasCatch: boolean; timer: number }[]>([])
  const [dryingRacks, setDryingRacks] = useState<{ pos: [number, number, number]; rot: number }[]>([])
  const [crates, setCrates] = useState<{ pos: [number, number, number]; rot: number; items: Record<string, number> }[]>([])
  const [cabins, setCabins] = useState<{ pos: [number, number, number]; rot: number }[]>([])
  const [docks, setDocks] = useState<{ pos: [number, number, number]; rot: number }[]>([])
  const [sleeping, set_sleeping] = useState(false)
  const placingRef = useRef<string | null>(null)
  const placingRotation = useRef(0)
  const actionRef = useRef<'idle' | 'chopping' | 'fishing' | 'shooting'>('idle')
  const actionTimer = useRef(0)

  // Start ambient sounds
  useEffect(() => {
    startAmbientBirds()
  }, [])

  // Keep ref in sync with prop for use in click handler
  useEffect(() => {
    placingRef.current = placingItem || null
    if (placingItem) placingRotation.current = 0
  }, [placingItem])

  // Q/E to rotate during placement
  useEffect(() => {
    const onPlacementKey = (e: KeyboardEvent) => {
      if (!placingRef.current) return
      if (e.code === 'KeyQ') placingRotation.current -= Math.PI / 4
      if (e.code === 'KeyE') placingRotation.current += Math.PI / 4
    }
    window.addEventListener('keydown', onPlacementKey)
    return () => window.removeEventListener('keydown', onPlacementKey)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code)
      
      // Action keys
      if (e.code === 'KeyF') eat()
      if (e.code === 'KeyR') drink()
      if (e.code === 'KeyE') {
        // Context-aware: fish if near water, otherwise try to pick up nearby items
        const state = useGameStore.getState()
        if (state.nearWater) {
          startFishing()
        } else {
          // Dispatch a custom event for ground items to respond to
          window.dispatchEvent(new CustomEvent('player-interact', { detail: { pos: state.playerPos } }))
        }
      }
      if (e.code === 'KeyC') {
        // Handled by page-level craft menu now
      }
      if (e.code === 'KeyT') {} // Disabled for now — time locked at noon
      if (e.code === 'KeyY') {} // Disabled for now
    }
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code)
    
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [eat, drink, startFishing, craftCampfire, craftShelter, speedUpTime, slowDownTime])

  const walkCycle = useRef(0)
  const isMoving = useRef(false)
  const cameraAngleRef = useRef(0)

  // Expose camera angle from scene for relative movement
  useEffect(() => {
    const updateCameraAngle = () => {
      // Read from the global camera angle (set by CameraFollow)
      cameraAngleRef.current = (window as any).__cameraAngle || 0
    }
    const id = setInterval(updateCameraAngle, 16)
    return () => clearInterval(id)
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return

    const k = keys.current
    let inputX = 0
    let inputZ = 0

    if (k.has('KeyW') || k.has('ArrowUp')) inputZ -= 1
    if (k.has('KeyS') || k.has('ArrowDown')) inputZ += 1
    if (k.has('KeyA') || k.has('ArrowLeft')) inputX -= 1
    if (k.has('KeyD') || k.has('ArrowRight')) inputX += 1

    if (inputX !== 0 || inputZ !== 0) {
      // Rotate input direction by camera angle so movement is camera-relative
      const camAngle = cameraAngleRef.current
      const cos = Math.cos(camAngle)
      const sin = Math.sin(camAngle)
      
      const dirX = inputX * cos + inputZ * sin
      const dirZ = -inputX * sin + inputZ * cos
      
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ)
      const normX = dirX / length
      const normZ = dirZ / length

      const isSprinting = k.has('ShiftLeft') || k.has('ShiftRight')
      const staminaState = useGameStore.getState()
      const canSprint = isSprinting && staminaState.stamina > 0
      const speed = canSprint ? SPRINT_SPEED : SPEED
      
      // Drain stamina while sprinting
      if (canSprint) {
        useGameStore.setState({ stamina: Math.max(0, staminaState.stamina - 20 * delta) })
      }
      
      // Calculate next position
      const nextX = ref.current.position.x + normX * speed * delta
      const nextZ = ref.current.position.z + normZ * speed * delta
      
      // Block movement into water — check ahead in movement direction
      const wouldEnterWater = isInsideWater(nextX, nextZ) ||
        isInsideWater(nextX + normX * 0.5, nextZ + normZ * 0.5) ||
        isInsideWater(nextX + normZ * 0.4, nextZ - normX * 0.4) ||
        isInsideWater(nextX - normZ * 0.4, nextZ + normX * 0.4)
      
      if (!wouldEnterWater) {
        ref.current.position.x = nextX
        ref.current.position.z = nextZ
      }

      // Face movement direction — smooth rotation
      const targetAngle = Math.atan2(normX, normZ)
      let currentAngle = ref.current.rotation.y
      let diff = targetAngle - currentAngle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      ref.current.rotation.y = currentAngle + diff * 0.15

      // Walk animation
      isMoving.current = true
      const walkSpeed = canSprint ? 14 : 9
      walkCycle.current += delta * walkSpeed

      // Walk bob — subtle
      ref.current.position.y = getTerrainHeight(ref.current.position.x, ref.current.position.z) + Math.abs(Math.sin(walkCycle.current)) * 0.03
    } else {
      ref.current.position.y = getTerrainHeight(ref.current.position.x, ref.current.position.z)
      isMoving.current = false
      walkCycle.current = 0
      // Recover stamina when idle
      const stam = useGameStore.getState().stamina
      if (stam < 100) {
        useGameStore.setState({ stamina: Math.min(100, stam + 15 * delta) })
      }
    }

    // Animate limbs — handled by CharacterModel now
    // (walkCycle and isMoving passed as props)

    // Bounds
    ref.current.position.x = THREE.MathUtils.clamp(ref.current.position.x, -130, 130)
    ref.current.position.z = THREE.MathUtils.clamp(ref.current.position.z, -130, 130)

    // Water collision — push player out if somehow inside (safety net)
    if (isInsideWater(ref.current.position.x, ref.current.position.z)) {
      // Push back to previous position
      ref.current.position.x = useGameStore.getState().playerPos[0]
      ref.current.position.z = useGameStore.getState().playerPos[2]
    }

    // Update store position (throttled to avoid excess re-renders)
    const pos: [number, number, number] = [ref.current.position.x, ref.current.position.y, ref.current.position.z]
    useGameStore.setState({ playerPos: pos, playerRotation: ref.current.rotation.y })

    // Water proximity check — slightly larger than collision so you can fish from the edge
    const px = ref.current.position.x
    const pz = ref.current.position.z
    // Near water if within 3 units of the actual lake edge (for fishing/drinking)
    const nearWater = isInsideWater(px + 3, pz) || isInsideWater(px - 3, pz) ||
      isInsideWater(px, pz + 3) || isInsideWater(px, pz - 3) ||
      isInsideWater(px + 2, pz + 2) || isInsideWater(px - 2, pz - 2)
    setNearWater(nearWater)

    // Fire proximity — warm player when near a campfire
    const nearFire = campfires.some((firePos) => {
      const fdx = px - firePos[0]
      const fdz = pz - firePos[2]
      return Math.sqrt(fdx * fdx + fdz * fdz) < 5
    })
    setNearFire(nearFire)

    // Shelter proximity — near shelter or cabin blocks weather
    const nearShelter = shelters.some((s) => {
      const sdx = px - s.pos[0]
      const sdz = pz - s.pos[2]
      return Math.sqrt(sdx * sdx + sdz * sdz) < 3
    }) || cabins.some((c) => {
      const cdx = px - c.pos[0]
      const cdz = pz - c.pos[2]
      return Math.sqrt(cdx * cdx + cdz * cdz) < 3
    })
    useGameStore.getState().setNearShelter(nearShelter)
  })

  return (
    <>
      <group ref={ref} position={[0, 0, 0]}>
        <CharacterModel isMoving={isMoving.current} walkCycle={walkCycle.current} isSprinting={false} />
      </group>

      {/* Placed campfires */}
      {campfires.map((pos, i) => (
        <CampfireObject key={`fire-${i}`} position={pos} onClick={() => {
          // Cook raw meat if available
          const state = useGameStore.getState()
          const cookable: [string, string][] = [
            ['brook_trout', 'cooked_brook_trout'],
            ['smallmouth_bass', 'cooked_smallmouth_bass'],
            ['yellow_perch', 'cooked_yellow_perch'],
            ['raw_rabbit', 'cooked_rabbit'],
            ['raw_venison', 'cooked_venison'],
          ]
          for (const [raw, cooked] of cookable) {
            if ((state.items[raw] || 0) > 0) {
              state.removeItem(raw, 1)
              state.addItem(cooked, 1)
              state.log(`Cooked ${raw.replace(/_/g, ' ')} on the fire!`)
              return
            }
          }
          // Add fuel if have firewood
          if ((state.items.firewood || 0) > 0) {
            state.removeItem('firewood', 1)
            state.log('Added firewood to the fire.')
          } else {
            state.log('Click with raw meat to cook, or firewood to fuel.')
          }
        }} />
      ))}

      {/* Placed shelters */}
      {shelters.map((shelter, i) => (
        <group key={`shelter-wrap-${i}`} onContextMenu={(e: any) => {
          e.stopPropagation()
          setShelters((prev) => prev.map((s, idx) => idx === i ? { ...s, rot: s.rot + Math.PI / 4 } : s))
        }}>
          <ShelterObject key={`shelter-${i}`} position={shelter.pos} rotation={shelter.rot} onClick={() => {
          const state = useGameStore.getState()
          if (state.fatigue < 20) {
            state.log("You're not tired enough to sleep.")
            return
          }
          // Sleep: recover fatigue, heal, advance time
          set_sleeping(true)
          state.log('Sleeping...')
          setTimeout(() => {
            const s = useGameStore.getState()
            useGameStore.setState({
              fatigue: Math.max(0, s.fatigue - 60),
              health: Math.min(100, s.health + 15),
              stamina: 100,
              hour: (s.hour + 7) % 24,
              day: s.hour + 7 >= 24 ? s.day + 1 : s.day,
            })
            useGameStore.getState().log(`Woke up refreshed. Day ${useGameStore.getState().day}.`)
            set_sleeping(false)
          }, 2000)
        }} />
        </group>
      ))}

      {/* Placed rabbit traps */}
      {traps.map((trap, i) => (
        <group key={`trap-${i}`} position={trap.pos} onClick={(e) => {
          e.stopPropagation()
          if (trap.hasCatch) {
            setTraps((prev) => prev.filter((_, idx) => idx !== i))
            useGameStore.getState().addItem('raw_rabbit', 1)
            useGameStore.getState().log('Collected a rabbit from the trap!')
          } else {
            useGameStore.getState().log('Trap is empty. Check back later.')
          }
        }}>
          {/* Base sticks */}
          <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.6, 0.04, 0.04]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[0.6, 0.04, 0.04]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
          {/* Arch */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <torusGeometry args={[0.2, 0.02, 4, 8, Math.PI]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.9} flatShading />
          </mesh>
          {/* Bait indicator */}
          {!trap.hasCatch && (
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.04, 4, 4]} />
              <meshStandardMaterial color="#cc2020" roughness={0.5} />
            </mesh>
          )}
          {/* Caught rabbit indicator */}
          {trap.hasCatch && (
            <mesh position={[0, 0.15, 0]} castShadow>
              <sphereGeometry args={[0.12, 5, 4]} />
              <meshStandardMaterial color="#a08060" roughness={0.9} flatShading />
            </mesh>
          )}
        </group>
      ))}

      {/* Placed drying racks */}
      {dryingRacks.map((rack, i) => (
        <group key={`rack-${i}`} position={rack.pos} rotation={[0, rack.rot, 0]} onContextMenu={(e: any) => {
          e.stopPropagation()
          setDryingRacks((prev) => prev.map((r, idx) => idx === i ? { ...r, rot: r.rot + Math.PI / 4 } : r))
        }}>
          {/* Posts */}
          <mesh position={[-0.5, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1, 5]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0.5, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1, 5]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
          {/* Cross bars */}
          <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.1, 4]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.1, 4]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}

      {/* Placed storage crates */}
      {crates.map((crate, i) => (
        <group key={`crate-${i}`} position={crate.pos} rotation={[0, crate.rot, 0]} 
          onClick={(e) => { e.stopPropagation(); useGameStore.setState({ openCrate: { items: crate.items, index: i } }) }}
          onContextMenu={(e: any) => {
            e.stopPropagation()
            setCrates((prev) => prev.map((c, idx) => idx === i ? { ...c, rot: c.rot + Math.PI / 4 } : c))
          }}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.7, 0.5, 0.5]} />
            <meshStandardMaterial color="#7a5a30" roughness={0.9} flatShading />
          </mesh>
          {/* Lid */}
          <mesh position={[0, 0.52, 0]} castShadow>
            <boxGeometry args={[0.74, 0.06, 0.54]} />
            <meshStandardMaterial color="#6a4a25" roughness={0.9} flatShading />
          </mesh>
          {/* Metal bands */}
          <mesh position={[0, 0.25, 0.26]} castShadow>
            <boxGeometry args={[0.72, 0.06, 0.02]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.25, -0.26]} castShadow>
            <boxGeometry args={[0.72, 0.06, 0.02]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}

      {/* Placed cabins */}
      {cabins.map((cabin, i) => (
        <group key={`cabin-${i}`} position={cabin.pos} rotation={[0, cabin.rot, 0]} onContextMenu={(e: any) => {
          e.stopPropagation()
          setCabins((prev) => prev.map((c, idx) => idx === i ? { ...c, rot: c.rot + Math.PI / 4 } : c))
        }}>
          {/* Floor */}
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[2.5, 0.1, 2.0]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.95} flatShading />
          </mesh>
          {/* Left wall */}
          <mesh position={[-1.2, 1.0, 0]} castShadow>
            <boxGeometry args={[0.1, 2.0, 2.0]} />
            <meshStandardMaterial color="#6a4a20" roughness={0.9} flatShading />
          </mesh>
          {/* Right wall */}
          <mesh position={[1.2, 1.0, 0]} castShadow>
            <boxGeometry args={[0.1, 2.0, 2.0]} />
            <meshStandardMaterial color="#6a4a20" roughness={0.9} flatShading />
          </mesh>
          {/* Back wall */}
          <mesh position={[0, 1.0, -0.95]} castShadow>
            <boxGeometry args={[2.5, 2.0, 0.1]} />
            <meshStandardMaterial color="#5a3a15" roughness={0.9} flatShading />
          </mesh>
          {/* A-frame roof left */}
          <mesh position={[-0.6, 2.2, 0]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[1.5, 0.08, 2.2]} />
            <meshStandardMaterial color="#3a2510" roughness={0.95} flatShading />
          </mesh>
          {/* A-frame roof right */}
          <mesh position={[0.6, 2.2, 0]} rotation={[0, 0, -0.5]} castShadow>
            <boxGeometry args={[1.5, 0.08, 2.2]} />
            <meshStandardMaterial color="#3a2510" roughness={0.95} flatShading />
          </mesh>
          {/* Ridge beam */}
          <mesh position={[0, 2.55, 0]} castShadow>
            <boxGeometry args={[0.1, 0.1, 2.3]} />
            <meshStandardMaterial color="#4a2a0a" roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}

      {/* Placed docks */}
      {docks.map((dock, i) => (
        <group key={`dock-${i}`} position={dock.pos} rotation={[0, dock.rot, 0]} onContextMenu={(e: any) => {
          e.stopPropagation()
          setDocks((prev) => prev.map((d, idx) => idx === i ? { ...d, rot: d.rot + Math.PI / 4 } : d))
        }}>
          {/* Platform planks */}
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.08, 4]} />
            <meshStandardMaterial color="#6a4a25" roughness={0.9} flatShading />
          </mesh>
          {/* Support posts */}
          <mesh position={[-0.6, 0.0, -1.5]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 5]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0.6, 0.0, -1.5]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 5]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[-0.6, 0.0, 1.5]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 5]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0.6, 0.0, 1.5]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 5]} />
            <meshStandardMaterial color="#4a2a10" roughness={0.95} flatShading />
          </mesh>
          {/* Railing */}
          <mesh position={[-0.7, 0.45, 0]} castShadow>
            <boxGeometry args={[0.04, 0.5, 4]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0.7, 0.45, 0]} castShadow>
            <boxGeometry args={[0.04, 0.5, 4]} />
            <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}

      {/* Ground click plane for placement — always present, raised above terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={(e) => {
          if (!placingRef.current) return
          e.stopPropagation()
          const point = e.point
          const pos: [number, number, number] = [point.x, 0, point.z]
          
          const item = placingRef.current
          if (item === 'campfire') {
            setCampfires((prev) => [...prev, pos])
          } else if (item === 'shelter') {
            setShelters((prev) => [...prev, { pos, rot: placingRotation.current }])
          } else if (item === 'rabbit_trap') {
            setTraps((prev) => [...prev, { pos, hasCatch: false, timer: 0 }])
            // Start trap timer — catches rabbit after 30-60 seconds
            setTimeout(() => {
              if (Math.random() < 0.6) {
                setTraps((prev) => prev.map((t) =>
                  t.pos[0] === pos[0] && t.pos[2] === pos[2] ? { ...t, hasCatch: true } : t
                ))
                useGameStore.getState().log('You hear rustling from your trap!')
              }
            }, 30000 + Math.random() * 30000)
          } else if (item === 'cabin') {
            setCabins((prev) => [...prev, { pos, rot: placingRotation.current }])
          } else if (item === 'dock') {
            setDocks((prev) => [...prev, { pos, rot: placingRotation.current }])
          } else if (item === 'drying_rack') {
            setDryingRacks((prev) => [...prev, { pos, rot: placingRotation.current }])
          } else if (item === 'storage_crate') {
            setCrates((prev) => [...prev, { pos, rot: placingRotation.current, items: {} }])
          }
          
          useGameStore.getState().log(`Placed ${item.replace(/_/g, ' ')}!`)
          onPlace?.()
        }}
      >
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}
