'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/lib/game-store'
import { isInsideWater } from './water'
import * as THREE from 'three'

interface RabbitData {
  id: number
  startPos: [number, number, number]
}

function Rabbit({ startPos, id }: { startPos: [number, number, number]; id: number }) {
  const groupRef = useRef<THREE.Group>(null)

  // Movement state
  const state = useRef({
    pos: new THREE.Vector3(...startPos),
    target: new THREE.Vector3(...startPos),
    speed: 0,
    idle: true,
    idleTimer: Math.random() * 3,
    hopPhase: 0,
    fleeing: false,
    fleeTimer: 0,
  })

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const s = state.current
    const playerPos = useGameStore.getState().playerPos

    // Distance to player
    const dx = playerPos[0] - s.pos.x
    const dz = playerPos[2] - s.pos.z
    const distToPlayer = Math.sqrt(dx * dx + dz * dz)

    // Flee if player gets close
    if (distToPlayer < 8 && !s.fleeing) {
      s.fleeing = true
      s.fleeTimer = 2 + Math.random()
      s.idle = false
      // Run away from player
      const awayX = s.pos.x - dx * 3 + (Math.random() - 0.5) * 10
      const awayZ = s.pos.z - dz * 3 + (Math.random() - 0.5) * 10
      s.target.set(
        THREE.MathUtils.clamp(awayX, -120, 120),
        0,
        THREE.MathUtils.clamp(awayZ, -120, 120)
      )
      s.speed = 12 + Math.random() * 4
    }

    if (s.fleeing) {
      s.fleeTimer -= delta
      if (s.fleeTimer <= 0) {
        s.fleeing = false
        s.idle = true
        s.idleTimer = 1 + Math.random() * 3
        s.speed = 0
      }
    }

    if (s.idle) {
      s.idleTimer -= delta
      s.speed = 0
      s.hopPhase = 0
      s.pos.y = 0
      if (s.idleTimer <= 0) {
        // Pick a new wander target nearby
        s.idle = false
        s.target.set(
          s.pos.x + (Math.random() - 0.5) * 15,
          0,
          s.pos.z + (Math.random() - 0.5) * 15
        )
        s.target.x = THREE.MathUtils.clamp(s.target.x, -120, 120)
        s.target.z = THREE.MathUtils.clamp(s.target.z, -120, 120)
        s.speed = 3 + Math.random() * 2
      }
    }

    // Move toward target
    if (!s.idle && s.speed > 0) {
      const toTarget = new THREE.Vector3().subVectors(s.target, s.pos)
      const dist = toTarget.length()

      if (dist < 0.5) {
        s.idle = true
        s.idleTimer = 2 + Math.random() * 4
        s.speed = 0
      } else {
        toTarget.normalize()
        const nextX = s.pos.x + toTarget.x * s.speed * delta
        const nextZ = s.pos.z + toTarget.z * s.speed * delta

        // Water collision — don't enter water
        const wouldEnterWater = isInsideWater(nextX, nextZ)

        if (wouldEnterWater) {
          // Pick a new direction away from water
          s.idle = true
          s.idleTimer = 0.5 + Math.random()
          s.speed = 0
        } else {
          s.pos.x = nextX
          s.pos.z = nextZ

          // Face movement direction
          const angle = Math.atan2(toTarget.x, toTarget.z)
          groupRef.current.rotation.y = angle

          // Hop animation
          s.hopPhase += delta * (s.fleeing ? 14 : 8)
          s.pos.y = Math.abs(Math.sin(s.hopPhase)) * (s.fleeing ? 0.4 : 0.2)
        }
      }
    }

    groupRef.current.position.copy(s.pos)
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    useGameStore.getState().log('Too fast! Use a rabbit trap to catch it.')
  }, [])

  return (
    <group ref={groupRef} position={startPos} onClick={handleClick}>
      {/* Invisible hitbox */}
      <mesh position={[0, 0.3, 0]} visible={false}>
        <sphereGeometry args={[0.6, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.22, 6, 5]} />
        <meshStandardMaterial color="#a08060" roughness={0.9} flatShading />
      </mesh>
      {/* Rump — slightly bigger */}
      <mesh position={[0, 0.22, -0.15]} castShadow>
        <sphereGeometry args={[0.2, 6, 5]} />
        <meshStandardMaterial color="#907050" roughness={0.9} flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.35, 0.2]} castShadow>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshStandardMaterial color="#b09070" roughness={0.9} flatShading />
      </mesh>
      {/* Ears */}
      <mesh position={[0.05, 0.55, 0.18]} castShadow>
        <capsuleGeometry args={[0.03, 0.15, 3, 4]} />
        <meshStandardMaterial color="#b09070" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.05, 0.55, 0.18]} castShadow>
        <capsuleGeometry args={[0.03, 0.15, 3, 4]} />
        <meshStandardMaterial color="#b09070" roughness={0.9} flatShading />
      </mesh>
      {/* Ear insides (pink) */}
      <mesh position={[0.05, 0.55, 0.19]} castShadow>
        <capsuleGeometry args={[0.015, 0.1, 3, 4]} />
        <meshStandardMaterial color="#d0a0a0" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.05, 0.55, 0.19]} castShadow>
        <capsuleGeometry args={[0.015, 0.1, 3, 4]} />
        <meshStandardMaterial color="#d0a0a0" roughness={0.8} flatShading />
      </mesh>
      {/* Tail — little white puff */}
      <mesh position={[0, 0.22, -0.3]} castShadow>
        <sphereGeometry args={[0.07, 5, 4]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.9} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.06, 0.38, 0.32]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[-0.06, 0.38, 0.32]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.34, 0.33]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#5a3030" roughness={0.5} />
      </mesh>
      {/* Front legs */}
      <mesh position={[0.08, 0.1, 0.1]} castShadow>
        <capsuleGeometry args={[0.03, 0.12, 3, 4]} />
        <meshStandardMaterial color="#907050" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.08, 0.1, 0.1]} castShadow>
        <capsuleGeometry args={[0.03, 0.12, 3, 4]} />
        <meshStandardMaterial color="#907050" roughness={0.9} flatShading />
      </mesh>
      {/* Back legs — bigger */}
      <mesh position={[0.09, 0.12, -0.15]} castShadow>
        <capsuleGeometry args={[0.04, 0.14, 3, 4]} />
        <meshStandardMaterial color="#907050" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.09, 0.12, -0.15]} castShadow>
        <capsuleGeometry args={[0.04, 0.14, 3, 4]} />
        <meshStandardMaterial color="#907050" roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}



// Fish swimming in the pond
function Fish({ center, radius, id }: { center: [number, number]; radius: number; id: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  const speed = useMemo(() => 0.15 + Math.random() * 0.2, [])
  const orbitRadius = useMemo(() => 2 + Math.random() * (radius - 4), [radius])
  const depth = useMemo(() => 0.15 + Math.random() * 0.05, [])
  const wobble = useMemo(() => Math.random() * 2, [])

  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() * 0.001 * speed + phase

    // Swim in wobbly orbit around pond center
    const x = center[0] + Math.cos(t) * orbitRadius + Math.sin(t * 2.3 + wobble) * 1.5
    const z = center[1] + Math.sin(t) * orbitRadius + Math.cos(t * 1.7 + wobble) * 1.5
    const y = depth

    groupRef.current.position.set(x, y, z)

    // Face movement direction
    const nextX = center[0] + Math.cos(t + 0.05) * orbitRadius + Math.sin((t + 0.05) * 2.3 + wobble) * 1.5
    const nextZ = center[1] + Math.sin(t + 0.05) * orbitRadius + Math.cos((t + 0.05) * 1.7 + wobble) * 1.5
    const angle = Math.atan2(nextX - x, nextZ - z)
    groupRef.current.rotation.y = angle

    // Tail wiggle
    const tail = groupRef.current.children.find((c) => c.userData.isTail)
    if (tail) {
      tail.rotation.y = Math.sin(t * 8) * 0.3
    }
  })

  // Color based on fish type
  const colors = ['#6a9a4a', '#4a8a8a', '#c09040']
  const color = colors[id % colors.length]

  return (
    <group ref={groupRef}>
      {/* Body — rotated flat so it swims horizontally */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 6, 4]} />
        <meshStandardMaterial color={color} roughness={0.3} flatShading />
      </mesh>
      {/* Tail fin — flat triangle shape behind */}
      <mesh position={[0, 0, -0.18]} rotation={[0, 0, 0]} userData={{ isTail: true }}>
        <coneGeometry args={[0.08, 0.12, 4]} />
        <meshStandardMaterial color={color} roughness={0.3} flatShading />
      </mesh>
      {/* Nose/front taper */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.1, 5]} />
        <meshStandardMaterial color={color} roughness={0.3} flatShading />
      </mesh>
    </group>
  )
}

export function PondFish() {
  return (
    <group>
      {/* Pond fish — at [-40, -40] radius 10 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Fish key={`pond-${i}`} id={i} center={[-40, -40]} radius={10} />
      ))}
      {/* Lake 1 fish — at [45, 5] radius 15 */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Fish key={`lake1-${i}`} id={i + 6} center={[45, 5]} radius={15} />
      ))}
      {/* Lake 2 fish — at [-55, 50] radius 10 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Fish key={`lake2-${i}`} id={i + 14} center={[-55, 50]} radius={10} />
      ))}
    </group>
  )
}


// Moose — large, wanders slowly, dangerous if you get too close
function Moose({ startPos, id, onKill }: { startPos: [number, number, number]; id: number; onKill: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [health, setHealth] = useState(2)
  const [alive, setAlive] = useState(true)
  const [downed, setDowned] = useState(false)
  const headRef = useRef<THREE.Group>(null)
  const legLF = useRef<THREE.Mesh>(null)
  const legRF = useRef<THREE.Mesh>(null)
  const legLB = useRef<THREE.Mesh>(null)
  const legRB = useRef<THREE.Mesh>(null)

  const state = useRef({
    pos: new THREE.Vector3(...startPos),
    target: new THREE.Vector3(...startPos),
    speed: 0,
    idle: true,
    idleTimer: 3 + Math.random() * 5,
    walkCycle: 0,
    grazing: false,
    grazingTimer: 0,
    agitated: false,
    agitatedTimer: 0,
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!alive) return
    const st = useGameStore.getState()

    // If downed — harvest with knife
    if (downed) {
      if (!st.hasItem('knife')) {
        st.log('Need a knife to harvest.')
        return
      }
      setAlive(false)
      onKill()
      setTimeout(() => { setAlive(true); setHealth(2); setDowned(false) }, 180000)
      return
    }

    const hasBow = st.hasItem('bow') && st.hasItem('arrows')
    if (!hasBow) {
      st.log('Need a bow and arrows to hunt moose.')
      return
    }
    st.removeItem('arrows', 1)
    useGameStore.setState({ playerAction: 'shooting' })
    setTimeout(() => useGameStore.setState({ playerAction: 'idle' }), 500)
    const h = health - 1
    setHealth(h)
    if (h <= 0) {
      setDowned(true)
      st.log('Moose is down! Click with knife to harvest.')
    } else {
      st.log('Hit! The moose is wounded. One more shot!')
    }
  }, [alive, health, downed, onKill])

  useFrame((_, delta) => {
    if (!groupRef.current || !alive) return

    // When downed, fall to side
    if (downed) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.08)
      return
    }
    groupRef.current.rotation.z = 0

    const s = state.current
    const playerPos = useGameStore.getState().playerPos

    const dx = playerPos[0] - s.pos.x
    const dz = playerPos[2] - s.pos.z
    const distToPlayer = Math.sqrt(dx * dx + dz * dz)

    // Moose flees if player gets close (not aggressive for now)
    if (distToPlayer < 10 && !s.agitated) {
      s.agitated = true
      s.agitatedTimer = 3
      s.idle = false
      s.grazing = false
      // Run away from player
      s.target.set(
        s.pos.x - dx * 2 + (Math.random() - 0.5) * 15,
        0,
        s.pos.z - dz * 2 + (Math.random() - 0.5) * 15
      )
      s.target.x = THREE.MathUtils.clamp(s.target.x, -110, 110)
      s.target.z = THREE.MathUtils.clamp(s.target.z, -110, 110)
      s.speed = 8
    }

    if (s.agitated) {
      s.agitatedTimer -= delta
      if (s.agitatedTimer <= 0) {
        s.agitated = false
        s.idle = true
        s.idleTimer = 4 + Math.random() * 4
        s.speed = 0
      }
    }

    // Grazing behavior
    if (s.grazing) {
      s.grazingTimer -= delta
      if (s.grazingTimer <= 0) {
        s.grazing = false
        s.idle = true
        s.idleTimer = 2 + Math.random() * 3
      }
      // Head bobs down while grazing
      if (headRef.current) {
        headRef.current.rotation.x = 0.3
      }
    } else if (headRef.current) {
      headRef.current.rotation.x = 0
    }

    if (s.idle && !s.agitated) {
      s.idleTimer -= delta
      s.speed = 0
      s.walkCycle = 0
      if (s.idleTimer <= 0) {
        // 40% chance to graze, 60% to walk
        if (Math.random() < 0.4) {
          s.grazing = true
          s.grazingTimer = 3 + Math.random() * 4
        } else {
          s.idle = false
          s.target.set(
            s.pos.x + (Math.random() - 0.5) * 30,
            0,
            s.pos.z + (Math.random() - 0.5) * 30
          )
          s.target.x = THREE.MathUtils.clamp(s.target.x, -110, 110)
          s.target.z = THREE.MathUtils.clamp(s.target.z, -110, 110)
          s.speed = 1.5 + Math.random()
        }
      }
    }

    // Move toward target
    if (!s.idle && s.speed > 0) {
      const toTarget = new THREE.Vector3().subVectors(s.target, s.pos)
      const dist = toTarget.length()

      if (dist < 1) {
        s.idle = true
        s.idleTimer = 3 + Math.random() * 5
        s.speed = 0
      } else {
        toTarget.normalize()
        const nextX = s.pos.x + toTarget.x * s.speed * delta
        const nextZ = s.pos.z + toTarget.z * s.speed * delta

        // Water collision
        const wouldEnterWater = isInsideWater(nextX, nextZ)

        if (wouldEnterWater) {
          s.idle = true
          s.idleTimer = 1 + Math.random() * 2
          s.speed = 0
        } else {
          s.pos.x = nextX
          s.pos.z = nextZ
          const angle = Math.atan2(toTarget.x, toTarget.z)
          groupRef.current.rotation.y = angle

          s.walkCycle += delta * (s.agitated ? 10 : 4)
        }
      }
    }

    // Leg animation — slow heavy gait
    if (s.speed > 0) {
      const cycle = s.walkCycle
      const intensity = s.agitated ? 0.5 : 0.3
      if (legLF.current) legLF.current.rotation.x = Math.sin(cycle) * intensity
      if (legRB.current) legRB.current.rotation.x = Math.sin(cycle) * intensity
      if (legRF.current) legRF.current.rotation.x = Math.sin(cycle + Math.PI) * intensity
      if (legLB.current) legLB.current.rotation.x = Math.sin(cycle + Math.PI) * intensity
      s.pos.y = Math.abs(Math.sin(cycle * 2)) * 0.04
    } else {
      if (legLF.current) legLF.current.rotation.x = 0
      if (legRF.current) legRF.current.rotation.x = 0
      if (legLB.current) legLB.current.rotation.x = 0
      if (legRB.current) legRB.current.rotation.x = 0
      s.pos.y = 0
    }

    groupRef.current.position.copy(s.pos)
  })

  if (!alive) return null

  return (
    <group ref={groupRef} position={startPos} onClick={handleClick}>
      {/* Body — rotated horizontal */}
      <mesh position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1.3, 5, 8]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.85} flatShading />
      </mesh>
      {/* Hump/shoulders */}
      <mesh position={[0, 1.9, 0.3]} castShadow>
        <sphereGeometry args={[0.4, 6, 5]} />
        <meshStandardMaterial color="#5a3a20" roughness={0.85} flatShading />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 2.0, 0.9]} rotation={[0.4, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.6, 4, 6]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      {/* Head group */}
      <group ref={headRef} position={[0, 2.2, 1.3]}>
        {/* Head */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.35, 0.55]} />
          <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.1, 0.3]} castShadow>
          <boxGeometry args={[0.22, 0.2, 0.25]} />
          <meshStandardMaterial color="#5a3a22" roughness={0.85} flatShading />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.08, 0.42]}>
          <sphereGeometry args={[0.08, 5, 4]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.14, 0.05, 0.15]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        <mesh position={[-0.14, 0.05, 0.15]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Antlers */}
        <mesh position={[0.2, 0.25, 0]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.7, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0.5, 0.5, 0]} rotation={[0, 0, 1.2]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.35, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0.35, 0.55, 0.1]} rotation={[0.3, 0, 0.8]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.3, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[-0.2, 0.25, 0]} rotation={[0, 0, -0.5]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.7, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[-0.5, 0.5, 0]} rotation={[0, 0, -1.2]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.35, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[-0.35, 0.55, 0.1]} rotation={[0.3, 0, -0.8]} castShadow>
          <cylinderGeometry args={[0.02, 0.015, 0.3, 4]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.8} flatShading />
        </mesh>
        {/* Dewlap (bell) — hanging chin flap */}
        <mesh position={[0, -0.25, 0.2]} castShadow>
          <capsuleGeometry args={[0.04, 0.15, 3, 4]} />
          <meshStandardMaterial color="#5a3a20" roughness={0.85} flatShading />
        </mesh>
      </group>

      {/* Legs — long and lanky */}
      <mesh ref={legLF} position={[0.25, 0.6, 0.5]} castShadow>
        <capsuleGeometry args={[0.07, 0.9, 3, 5]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legRF} position={[-0.25, 0.6, 0.5]} castShadow>
        <capsuleGeometry args={[0.07, 0.9, 3, 5]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legLB} position={[0.25, 0.6, -0.5]} castShadow>
        <capsuleGeometry args={[0.07, 0.9, 3, 5]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legRB} position={[-0.25, 0.6, -0.5]} castShadow>
        <capsuleGeometry args={[0.07, 0.9, 3, 5]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      {/* Hooves */}
      <mesh position={[0.25, 0.05, 0.5]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.14]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.25, 0.05, 0.5]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.14]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.25, 0.05, -0.5]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.14]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.25, 0.05, -0.5]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.14]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} flatShading />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 1.5, -0.8]} castShadow>
        <sphereGeometry args={[0.08, 4, 4]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

// Deer — skittish, flees at distance, huntable
function Deer({ startPos, id, onCatch }: { startPos: [number, number, number]; id: number; onCatch: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [alive, setAlive] = useState(true)
  const [downed, setDowned] = useState(false)
  const legLF = useRef<THREE.Mesh>(null)
  const legRF = useRef<THREE.Mesh>(null)
  const legLB = useRef<THREE.Mesh>(null)
  const legRB = useRef<THREE.Mesh>(null)

  const state = useRef({
    pos: new THREE.Vector3(...startPos),
    target: new THREE.Vector3(...startPos),
    speed: 0,
    idle: true,
    idleTimer: 2 + Math.random() * 4,
    walkCycle: 0,
    fleeing: false,
    fleeTimer: 0,
  })

  useFrame((_, delta) => {
    if (!groupRef.current || !alive) return

    // When downed, fall to side and stop moving
    if (downed) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.PI / 2, 0.1)
      return
    }
    groupRef.current.rotation.z = 0

    const s = state.current
    const playerPos = useGameStore.getState().playerPos

    const dx = playerPos[0] - s.pos.x
    const dz = playerPos[2] - s.pos.z
    const distToPlayer = Math.sqrt(dx * dx + dz * dz)

    // Flee if player gets within 14 units — deer are very skittish
    if (distToPlayer < 14 && !s.fleeing) {
      s.fleeing = true
      s.fleeTimer = 3 + Math.random() * 2
      s.idle = false
      const awayX = s.pos.x - dx * 3 + (Math.random() - 0.5) * 10
      const awayZ = s.pos.z - dz * 3 + (Math.random() - 0.5) * 10
      s.target.set(
        THREE.MathUtils.clamp(awayX, -110, 110),
        0,
        THREE.MathUtils.clamp(awayZ, -110, 110)
      )
      s.speed = 14 + Math.random() * 4
    }

    if (s.fleeing) {
      s.fleeTimer -= delta
      if (s.fleeTimer <= 0) {
        s.fleeing = false
        s.idle = true
        s.idleTimer = 3 + Math.random() * 5
        s.speed = 0
      }
    }

    if (s.idle) {
      s.idleTimer -= delta
      s.speed = 0
      s.walkCycle = 0
      if (s.idleTimer <= 0) {
        s.idle = false
        s.target.set(
          s.pos.x + (Math.random() - 0.5) * 25,
          0,
          s.pos.z + (Math.random() - 0.5) * 25
        )
        s.target.x = THREE.MathUtils.clamp(s.target.x, -110, 110)
        s.target.z = THREE.MathUtils.clamp(s.target.z, -110, 110)
        s.speed = 2 + Math.random()
      }
    }

    if (!s.idle && s.speed > 0) {
      const toTarget = new THREE.Vector3().subVectors(s.target, s.pos)
      const dist = toTarget.length()
      if (dist < 1) {
        s.idle = true
        s.idleTimer = 3 + Math.random() * 5
        s.speed = 0
      } else {
        toTarget.normalize()
        const nextX = s.pos.x + toTarget.x * s.speed * delta
        const nextZ = s.pos.z + toTarget.z * s.speed * delta
        const wouldEnterWater = isInsideWater(nextX, nextZ)
        if (wouldEnterWater) {
          s.idle = true
          s.idleTimer = 1
          s.speed = 0
        } else {
          s.pos.x = nextX
          s.pos.z = nextZ
          groupRef.current.rotation.y = Math.atan2(toTarget.x, toTarget.z)
          s.walkCycle += delta * (s.fleeing ? 12 : 5)
        }
      }
    }

    // Natural trot gait — diagonal pairs move together, with body bob
    if (s.speed > 0) {
      const cycle = s.walkCycle
      const intensity = s.fleeing ? 0.6 : 0.4
      // Diagonal pair gait (like a real deer trot)
      if (legLF.current) legLF.current.rotation.x = Math.sin(cycle) * intensity
      if (legRB.current) legRB.current.rotation.x = Math.sin(cycle) * intensity
      if (legRF.current) legRF.current.rotation.x = Math.sin(cycle + Math.PI) * intensity
      if (legLB.current) legLB.current.rotation.x = Math.sin(cycle + Math.PI) * intensity
      // Body bob
      s.pos.y = Math.abs(Math.sin(cycle * 2)) * 0.05
    } else {
      if (legLF.current) legLF.current.rotation.x = 0
      if (legRF.current) legRF.current.rotation.x = 0
      if (legLB.current) legLB.current.rotation.x = 0
      if (legRB.current) legRB.current.rotation.x = 0
      s.pos.y = 0
    }

    groupRef.current.position.copy(s.pos)
  })

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (!alive) return
    const state = useGameStore.getState()

    // If downed — harvest with knife
    if (downed) {
      if (!state.hasItem('knife')) {
        state.log('Need a knife to harvest.')
        return
      }
      setAlive(false)
      onCatch()
      setTimeout(() => { setAlive(true); setDowned(false) }, 120000)
      return
    }

    // Shoot to down
    const hasBow = state.hasItem('bow') && state.hasItem('arrows')
    if (!hasBow) {
      state.log('Need a bow and arrows to hunt deer.')
      return
    }
    state.removeItem('arrows', 1)
    useGameStore.setState({ playerAction: 'shooting' })
    setTimeout(() => useGameStore.setState({ playerAction: 'idle' }), 500)
    setDowned(true)
    state.log('Deer is down! Click again with knife to harvest.')
  }, [alive, downed, onCatch])

  if (!alive) return null

  return (
    <group ref={groupRef} position={startPos} onClick={handleClick}>
      {/* Body — rotated horizontal */}
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.8, 5, 7]} />
        <meshStandardMaterial color="#a07040" roughness={0.85} flatShading />
      </mesh>
      {/* White belly */}
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 4, 6]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.85} flatShading />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.15, 0.45]} rotation={[0.6, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 5]} />
        <meshStandardMaterial color="#906030" roughness={0.85} flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0.6]} castShadow>
        <sphereGeometry args={[0.13, 6, 5]} />
        <meshStandardMaterial color="#906030" roughness={0.85} flatShading />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 1.3, 0.73]} castShadow>
        <boxGeometry args={[0.08, 0.07, 0.1]} />
        <meshStandardMaterial color="#805528" roughness={0.85} flatShading />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.3, 0.78]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.07, 1.38, 0.67]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[-0.07, 1.38, 0.67]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.07, 1.48, 0.55]} rotation={[0.3, 0.2, 0]} castShadow>
        <coneGeometry args={[0.035, 0.1, 4]} />
        <meshStandardMaterial color="#906030" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.07, 1.48, 0.55]} rotation={[0.3, -0.2, 0]} castShadow>
        <coneGeometry args={[0.035, 0.1, 4]} />
        <meshStandardMaterial color="#906030" roughness={0.85} flatShading />
      </mesh>
      {/* Tail — white */}
      <mesh position={[0, 1.05, -0.45]} castShadow>
        <sphereGeometry args={[0.06, 4, 4]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.85} flatShading />
      </mesh>
      {/* Legs */}
      <mesh ref={legLF} position={[0.12, 0.4, 0.3]} castShadow>
        <capsuleGeometry args={[0.035, 0.5, 3, 5]} />
        <meshStandardMaterial color="#805528" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legRF} position={[-0.12, 0.4, 0.3]} castShadow>
        <capsuleGeometry args={[0.035, 0.5, 3, 5]} />
        <meshStandardMaterial color="#805528" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legLB} position={[0.12, 0.4, -0.3]} castShadow>
        <capsuleGeometry args={[0.035, 0.5, 3, 5]} />
        <meshStandardMaterial color="#805528" roughness={0.85} flatShading />
      </mesh>
      <mesh ref={legRB} position={[-0.12, 0.4, -0.3]} castShadow>
        <capsuleGeometry args={[0.035, 0.5, 3, 5]} />
        <meshStandardMaterial color="#805528" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

// Fox — small, sneaky, wanders near edges
function Fox({ startPos, id }: { startPos: [number, number, number]; id: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)

  const state = useRef({
    pos: new THREE.Vector3(...startPos),
    target: new THREE.Vector3(...startPos),
    speed: 0,
    idle: true,
    idleTimer: 2 + Math.random() * 3,
    walkCycle: 0,
    fleeing: false,
    fleeTimer: 0,
  })

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const s = state.current
    const playerPos = useGameStore.getState().playerPos

    const dx = playerPos[0] - s.pos.x
    const dz = playerPos[2] - s.pos.z
    const distToPlayer = Math.sqrt(dx * dx + dz * dz)

    // Flee at 10 units
    if (distToPlayer < 10 && !s.fleeing) {
      s.fleeing = true
      s.fleeTimer = 2 + Math.random()
      s.idle = false
      s.target.set(
        THREE.MathUtils.clamp(s.pos.x - dx * 2 + (Math.random() - 0.5) * 8, -110, 110),
        0,
        THREE.MathUtils.clamp(s.pos.z - dz * 2 + (Math.random() - 0.5) * 8, -110, 110)
      )
      s.speed = 10 + Math.random() * 3
    }

    if (s.fleeing) {
      s.fleeTimer -= delta
      if (s.fleeTimer <= 0) {
        s.fleeing = false
        s.idle = true
        s.idleTimer = 2 + Math.random() * 4
        s.speed = 0
      }
    }

    if (s.idle) {
      s.idleTimer -= delta
      s.speed = 0
      s.walkCycle = 0
      if (s.idleTimer <= 0) {
        s.idle = false
        s.target.set(
          THREE.MathUtils.clamp(s.pos.x + (Math.random() - 0.5) * 20, -110, 110),
          0,
          THREE.MathUtils.clamp(s.pos.z + (Math.random() - 0.5) * 20, -110, 110)
        )
        s.speed = 3 + Math.random() * 2
      }
    }

    if (!s.idle && s.speed > 0) {
      const toTarget = new THREE.Vector3().subVectors(s.target, s.pos)
      const dist = toTarget.length()
      if (dist < 0.5) {
        s.idle = true
        s.idleTimer = 2 + Math.random() * 4
        s.speed = 0
      } else {
        toTarget.normalize()
        const nextX = s.pos.x + toTarget.x * s.speed * delta
        const nextZ = s.pos.z + toTarget.z * s.speed * delta
        const wouldEnterWater = isInsideWater(nextX, nextZ)
        if (wouldEnterWater) {
          s.idle = true
          s.idleTimer = 0.5
          s.speed = 0
        } else {
          s.pos.x = nextX
          s.pos.z = nextZ
          groupRef.current.rotation.y = Math.atan2(toTarget.x, toTarget.z)
          s.walkCycle += delta * (s.fleeing ? 12 : 7)
        }
      }
    }

    // Tail sway
    if (tailRef.current) {
      const t = Date.now() * 0.003
      tailRef.current.rotation.y = Math.sin(t + id) * 0.3
    }

    groupRef.current.position.copy(s.pos)
  })

  return (
    <group ref={groupRef} position={startPos}>
      {/* Body — rotated horizontal */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.45, 4, 6]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      {/* Chest — white */}
      <mesh position={[0, 0.3, 0.2]} castShadow>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.85} flatShading />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.45, 0.25]} rotation={[0.4, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.15, 3, 5]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.52, 0.35]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      {/* Snout — pointed */}
      <mesh position={[0, 0.48, 0.45]} rotation={[-0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.05, 0.14, 5]} />
        <meshStandardMaterial color="#aa5518" roughness={0.85} flatShading />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.47, 0.52]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.05, 0.55, 0.4]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#2a2a00" roughness={0.3} />
      </mesh>
      <mesh position={[-0.05, 0.55, 0.4]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#2a2a00" roughness={0.3} />
      </mesh>
      {/* Ears — tall and pointy */}
      <mesh position={[0.04, 0.64, 0.33]} castShadow>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.04, 0.64, 0.33]} castShadow>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      {/* Legs — dark/black */}
      <mesh position={[0.07, 0.12, 0.15]} castShadow>
        <capsuleGeometry args={[0.025, 0.2, 3, 4]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.07, 0.12, 0.15]} castShadow>
        <capsuleGeometry args={[0.025, 0.2, 3, 4]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.07, 0.12, -0.15]} castShadow>
        <capsuleGeometry args={[0.025, 0.2, 3, 4]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.07, 0.12, -0.15]} castShadow>
        <capsuleGeometry args={[0.025, 0.2, 3, 4]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.85} flatShading />
      </mesh>
      {/* Tail — big and bushy, white tip */}
      <mesh ref={tailRef} position={[0, 0.35, -0.4]} rotation={[-0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.3, 4, 5]} />
        <meshStandardMaterial color="#cc6a20" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.32, -0.55]} castShadow>
        <sphereGeometry args={[0.06, 5, 4]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

export function Animals() {
  const addItem = useGameStore((s) => s.addItem)
  const log = useGameStore((s) => s.log)

  const waterZones = [
    { x: 45, z: 5, radius: 22 },
    { x: -55, z: 50, radius: 16 },
    { x: -40, z: -40, radius: 16 },
  ]

  const rabbits = useMemo(() => {
    const result: RabbitData[] = []
    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue
      result.push({ id: i, startPos: [x, 0, z] })
    }
    return result
  }, [])

  const mooseSpawns = useMemo(() => {
    const result: { id: number; pos: [number, number, number] }[] = []
    for (let i = 0; i < 3; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue
      if (Math.abs(x) < 25 && Math.abs(z) < 25) continue
      result.push({ id: i, pos: [x, 0, z] })
    }
    return result
  }, [])

  const deerSpawns = useMemo(() => {
    const result: { id: number; pos: [number, number, number] }[] = []
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 180
      const z = (Math.random() - 0.5) * 180
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue
      result.push({ id: i, pos: [x, 0, z] })
    }
    return result
  }, [])

  const foxSpawns = useMemo(() => {
    const result: { id: number; pos: [number, number, number] }[] = []
    for (let i = 0; i < 3; i++) {
      const x = (Math.random() - 0.5) * 160
      const z = (Math.random() - 0.5) * 160
      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue
      result.push({ id: i, pos: [x, 0, z] })
    }
    return result
  }, [])

  return (
    <group>
      {rabbits.map((rabbit) => (
        <Rabbit
          key={rabbit.id}
          id={rabbit.id}
          startPos={rabbit.startPos}
        />
      ))}
      {mooseSpawns.map((moose) => (
        <Moose key={`moose-${moose.id}`} id={moose.id} startPos={moose.pos} onKill={() => {
          addItem('raw_venison', 4)
          addItem('hide', 2)
          log('Took down a moose! +4 raw venison, +2 hide')
        }} />
      ))}
      {deerSpawns.map((deer) => (
        <Deer
          key={`deer-${deer.id}`}
          id={deer.id}
          startPos={deer.pos}
          onCatch={() => {
            addItem('raw_venison', 2)
            addItem('hide', 1)
            log('Caught a deer! +2 raw venison, +1 hide')
          }}
        />
      ))}
      {foxSpawns.map((fox) => (
        <Fox key={`fox-${fox.id}`} id={fox.id} startPos={fox.pos} />
      ))}
    </group>
  )
}
