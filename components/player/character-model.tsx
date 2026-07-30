'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/lib/game-store'
import * as THREE from 'three'

// Easing functions for natural motion
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

interface CharacterModelProps {
  isMoving: boolean
  walkCycle: number
  isSprinting: boolean
}

export function CharacterModel({ isMoving, walkCycle, isSprinting }: CharacterModelProps) {
  // Two-segment arm refs (shoulder pivot → upper arm → elbow pivot → forearm)
  const leftUpperArmRef = useRef<THREE.Group>(null)
  const leftForearmRef = useRef<THREE.Group>(null)
  const rightUpperArmRef = useRef<THREE.Group>(null)
  const rightForearmRef = useRef<THREE.Group>(null)

  // Two-segment leg refs
  const leftThighRef = useRef<THREE.Group>(null)
  const leftShinRef = useRef<THREE.Group>(null)
  const rightThighRef = useRef<THREE.Group>(null)
  const rightShinRef = useRef<THREE.Group>(null)

  // Held item ref
  const heldItemRef = useRef<THREE.Group>(null)

  const actionTimer = useRef(0)
  const lastAction = useRef<string>('idle')

  useFrame((_, delta) => {
    const playerAction = useGameStore.getState().playerAction

    // Track action changes
    if (playerAction !== 'idle' && playerAction !== lastAction.current) {
      lastAction.current = playerAction
      actionTimer.current = 0
    }
    if (playerAction !== 'idle') {
      actionTimer.current += delta
    } else {
      lastAction.current = 'idle'
      actionTimer.current = 0
    }

    // ---- LEGS ----
    let thighL = 0, shinL = 0, thighR = 0, shinR = 0

    if (isMoving) {
      const speed = isSprinting ? 1.3 : 1.0
      const cycle = walkCycle * speed
      // Thigh swings forward/back
      thighL = Math.sin(cycle) * 0.5
      thighR = Math.sin(cycle + Math.PI) * 0.5
      // Shin bends back on the lift phase (only when thigh goes back)
      shinL = Math.max(0, -Math.sin(cycle)) * 0.6
      shinR = Math.max(0, -Math.sin(cycle + Math.PI)) * 0.6
    }

    if (leftThighRef.current) leftThighRef.current.rotation.x = thighL
    if (leftShinRef.current) leftShinRef.current.rotation.x = shinL
    if (rightThighRef.current) rightThighRef.current.rotation.x = thighR
    if (rightShinRef.current) rightShinRef.current.rotation.x = shinR

    // ---- ARMS ----
    let upperL = 0, foreL = 0, upperR = 0, foreR = 0

    if (playerAction === 'chopping') {
      // Chop from overhead: raise arm up behind, then swing forward/down
      const t = Math.min(actionTimer.current / 0.5, 1)
      if (t < 0.35) {
        // Wind up — raise arm up behind head
        const p = t / 0.35
        upperR = -2.2 * easeInQuad(p)    // Negative = arm goes up/back
        foreR = -1.2 * p                  // Forearm bends back
        upperL = 0
      } else {
        // Swing forward/down — fast slam
        const p = (t - 0.35) / 0.65
        const swing = easeOutBack(Math.min(p, 1))
        upperR = -2.2 + 3.0 * swing      // Swings from behind to in front
        foreR = -1.2 + 1.5 * swing        // Forearm extends through
        upperL = 0
      }
    } else if (playerAction === 'fishing') {
      // Fishing — right arm forward and slightly down, steady hold
      const bob = Math.sin(Date.now() * 0.0015) * 0.03
      upperR = -0.6 + bob
      foreR = -0.3 + bob * 0.5
      upperL = 0
      foreL = 0
    } else if (playerAction === 'shooting') {
      // Bow — left arm pushes forward (holding bow), right pulls back string
      const t = Math.min(actionTimer.current / 0.4, 1)
      if (t < 0.7) {
        // Draw
        const p = t / 0.7
        upperL = -0.7 * p    // Left forward
        foreL = -0.2 * p
        upperR = 0.5 * p     // Right pulls back
        foreR = 1.2 * p      // Elbow bends to pull string
      } else {
        // Release — snap forward
        const p = (t - 0.7) / 0.3
        upperL = -0.7
        foreL = -0.2
        upperR = 0.5 - 1.0 * p   // Arm snaps forward
        foreR = 1.2 - 1.5 * p    // Forearm extends
      }
    } else if (isMoving) {
      // Walk swing — arms opposite to legs, with forearm bend
      upperL = -Math.sin(walkCycle) * 0.35
      upperR = Math.sin(walkCycle) * 0.35
      foreL = Math.max(0, Math.sin(walkCycle)) * 0.3
      foreR = Math.max(0, -Math.sin(walkCycle)) * 0.3
    }

    if (leftUpperArmRef.current) leftUpperArmRef.current.rotation.x = upperL
    if (leftForearmRef.current) leftForearmRef.current.rotation.x = foreL
    if (rightUpperArmRef.current) rightUpperArmRef.current.rotation.x = upperR
    if (rightForearmRef.current) rightForearmRef.current.rotation.x = foreR
  })

  const items = useGameStore((s) => s.items)
  const playerAction = useGameStore((s) => s.playerAction)

  return (
    <group>
      {/* === LEGS === */}
      {/* Left leg: thigh pivots at hip, shin pivots at knee */}
      <group ref={leftThighRef} position={[-0.1, 0.7, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 3, 6]} />
          <meshStandardMaterial color="#2a4030" roughness={0.9} flatShading />
        </mesh>
        {/* Knee joint → Shin */}
        <group ref={leftShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.25, 3, 6]} />
            <meshStandardMaterial color="#2a4030" roughness={0.9} flatShading />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.35, 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.18]} />
            <meshStandardMaterial color="#3a2210" roughness={0.95} flatShading />
          </mesh>
        </group>
      </group>

      {/* Right leg */}
      <group ref={rightThighRef} position={[0.1, 0.7, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.25, 3, 6]} />
          <meshStandardMaterial color="#2a4030" roughness={0.9} flatShading />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.32, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.25, 3, 6]} />
            <meshStandardMaterial color="#2a4030" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, -0.35, 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.18]} />
            <meshStandardMaterial color="#3a2210" roughness={0.95} flatShading />
          </mesh>
        </group>
      </group>

      {/* === TORSO === */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#6a3a1a" roughness={0.85} flatShading />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
        <meshStandardMaterial color="#4a3018" roughness={0.8} flatShading />
      </mesh>
      {/* Shoulders */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.28, 4, 6]} />
        <meshStandardMaterial color="#5a3015" roughness={0.85} flatShading />
      </mesh>

      {/* === LEFT ARM === */}
      <group ref={leftUpperArmRef} position={[-0.28, 1.28, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.2, 3, 5]} />
          <meshStandardMaterial color="#6a3a1a" roughness={0.85} flatShading />
        </mesh>
        {/* Elbow → Forearm */}
        <group ref={leftForearmRef} position={[0, -0.28, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.18, 3, 5]} />
            <meshStandardMaterial color="#6a3a1a" roughness={0.85} flatShading />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.05, 5, 4]} />
            <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
          </mesh>
          {/* Bow held in left hand when shooting */}
          {playerAction === 'shooting' && items.bow && (
            <group position={[0, -0.22, 0.05]} rotation={[0, 0, 0]}>
              <mesh castShadow>
                <torusGeometry args={[0.15, 0.012, 4, 8, Math.PI]} />
                <meshStandardMaterial color="#5a3018" roughness={0.9} flatShading />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.002, 0.002, 0.28, 3]} />
                <meshStandardMaterial color="#c0b090" roughness={0.5} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightUpperArmRef} position={[0.28, 1.28, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.2, 3, 5]} />
          <meshStandardMaterial color="#6a3a1a" roughness={0.85} flatShading />
        </mesh>
        {/* Elbow → Forearm */}
        <group ref={rightForearmRef} position={[0, -0.28, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.18, 3, 5]} />
            <meshStandardMaterial color="#6a3a1a" roughness={0.85} flatShading />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <sphereGeometry args={[0.05, 5, 4]} />
            <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
          </mesh>
          {/* Held item — parented to forearm end so it moves with the arm */}
          <group ref={heldItemRef} position={[0, -0.24, 0]}>
            {/* Axe — handle extends down from hand, head at far end */}
            {(playerAction === 'idle' || playerAction === 'chopping') && items.axe && (
              <group rotation={[0, 0, 0]} position={[0, 0, 0.04]}>
                {/* Handle — extends down from grip */}
                <mesh position={[0, -0.15, 0]} castShadow>
                  <cylinderGeometry args={[0.013, 0.01, 0.3, 4]} />
                  <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
                </mesh>
                {/* Axe head — at the bottom end of handle */}
                <mesh position={[0.03, -0.28, 0]} rotation={[0, 0, 0]} castShadow>
                  <boxGeometry args={[0.1, 0.07, 0.02]} />
                  <meshStandardMaterial color="#6a6a6a" roughness={0.5} flatShading />
                </mesh>
              </group>
            )}
            {/* Fishing rod */}
            {playerAction === 'fishing' && (
              <group rotation={[-0.8, 0, 0]} position={[0, 0, 0.03]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.01, 0.006, 0.7, 4]} />
                  <meshStandardMaterial color="#5a3a18" roughness={0.9} flatShading />
                </mesh>
                <mesh position={[0, 0.35, 0]} rotation={[0.6, 0, 0]}>
                  <cylinderGeometry args={[0.002, 0.002, 0.4, 3]} />
                  <meshStandardMaterial color="#888888" roughness={0.4} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>

      {/* === HEAD === */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 6]} />
        <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.17, 7, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} flatShading />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.16, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0.16, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
      </mesh>
      {/* Brow */}
      <mesh position={[0, 1.66, 0.12]} castShadow>
        <boxGeometry args={[0.18, 0.03, 0.05]} />
        <meshStandardMaterial color="#c89060" roughness={0.7} flatShading />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.6, 0.16]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.04]} />
        <meshStandardMaterial color="#c89a6a" roughness={0.7} flatShading />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.055, 1.63, 0.14]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[-0.055, 1.63, 0.14]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      {/* Toque */}
      <mesh position={[0, 1.76, 0]} castShadow>
        <sphereGeometry args={[0.15, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#8a2020" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.17, 0.05, 8]} />
        <meshStandardMaterial color="#6a1515" roughness={0.9} flatShading />
      </mesh>

      {/* === BACKPACK === */}
      <mesh position={[0, 1.05, -0.22]} castShadow>
        <boxGeometry args={[0.28, 0.38, 0.15]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.25, -0.24]} castShadow>
        <boxGeometry args={[0.26, 0.08, 0.13]} />
        <meshStandardMaterial color="#245020" roughness={0.9} flatShading />
      </mesh>
      {/* Straps */}
      <mesh position={[-0.1, 1.1, -0.12]} castShadow>
        <boxGeometry args={[0.03, 0.35, 0.03]} />
        <meshStandardMaterial color="#1a3a12" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.1, 1.1, -0.12]} castShadow>
        <boxGeometry args={[0.03, 0.35, 0.03]} />
        <meshStandardMaterial color="#1a3a12" roughness={0.9} flatShading />
      </mesh>

      {/* Torch light — visible at night when player has torch */}
      {items.torch && (
        <pointLight position={[0, 1.5, 0.3]} color="#ff8830" intensity={3} distance={15} decay={2} />
      )}
    </group>
  )
}
