'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Terrain } from './terrain'
import { Forest } from './trees'
import { Rocks } from './rocks'
import { Water } from './water'
import { Sky } from './sky'
import { Animals, PondFish } from './animals'

import { AirParticles, Fireflies } from './particles'
import { GroundDetail, Mushrooms, Cattails, SupplyCrates } from './ground-detail'
import { MapBoundary } from './boundary'
import { Rain, Snow, WeatherFog } from './weather'
import { RockyClearing, DenseForestZone, BeachZone, SwampZone } from './map-zones'
import { Player } from '../player/player'
import { useGameStore } from '@/lib/game-store'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function CameraFollow() {
  const cameraAngle = useRef(0)
  const cameraDistance = useRef(35)
  const cameraPitch = useRef(0.6)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDragging.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) isDragging.current = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      cameraAngle.current += dx * 0.005
      cameraPitch.current = Math.max(0.2, Math.min(0.85, cameraPitch.current - dy * 0.003))
    }
    const onWheel = (e: WheelEvent) => {
      cameraDistance.current = Math.max(5, Math.min(80, cameraDistance.current + e.deltaY * 0.05))
    }
    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  useFrame(({ camera }) => {
    const playerPos = useGameStore.getState().playerPos
    const dist = cameraDistance.current
    const angle = cameraAngle.current
    const pitch = cameraPitch.current

    const target = new THREE.Vector3(playerPos[0], playerPos[1] + 1, playerPos[2])
    const height = dist * pitch
    const horizontalDist = dist * (1 - pitch * 0.5)

    const camX = target.x + Math.sin(angle) * horizontalDist
    const camZ = target.z + Math.cos(angle) * horizontalDist
    const camY = target.y + height

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05)
    camera.lookAt(target)

    ;(window as any).__cameraAngle = angle
  })

  return null
}

function GameLoop() {
  const tick = useGameStore((s) => s.tick)
  const speedUpTime = useGameStore((s) => s.speedUpTime)
  const slowDownTime = useGameStore((s) => s.slowDownTime)

  useFrame((_, delta) => {
    tick(delta)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyT') speedUpTime()
      if (e.code === 'KeyY') slowDownTime()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [speedUpTime, slowDownTime])

  return null
}

function Lighting() {
  const hour = useGameStore((s) => s.hour)
  
  // Sun position based on time of day
  const sunAngle = ((hour - 6) / 12) * Math.PI // 6am = horizon, 12pm = overhead
  const sunY = Math.sin(sunAngle) * 60
  const sunZ = -Math.cos(sunAngle) * 50
  const isDay = hour >= 6 && hour < 20
  
  // Dynamic intensity based on sun height
  const intensity = isDay ? Math.max(0.3, Math.sin(sunAngle) * 1.4) : 0.1
  
  // Warm sunrise/sunset, bright midday
  let sunColor = '#fff5e0'
  if (hour >= 5 && hour < 7) sunColor = '#ff9040'
  else if (hour >= 18 && hour < 20) sunColor = '#ff7030'
  else if (!isDay) sunColor = '#3040a0'

  const ambientIntensity = isDay ? 0.45 : 0.15

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={isDay ? '#9ab8d0' : '#1a2040'} />
      <directionalLight
        position={[20, Math.max(sunY, 5), sunZ]}
        intensity={intensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <hemisphereLight args={[
        isDay ? '#b0d8f0' : '#1a2050',
        '#3a6a3a',
        isDay ? 0.35 : 0.1
      ]} />
      {/* Subtle fill light from opposite side */}
      <directionalLight
        position={[-30, 15, 30]}
        intensity={isDay ? 0.15 : 0.02}
        color="#a0b0c0"
      />
    </>
  )
}

export function GameScene({ placingItem, onPlace }: { placingItem?: string | null; onPlace?: () => void }) {
  const hour = useGameStore((s) => s.hour)
  
  // Dynamic sky/fog colors based on time
  let bgColor = '#87CEEB'
  let fogColor = '#8ab8a0'
  let fogNear = 60
  let fogFar = 200

  if (hour >= 5 && hour < 7) {
    bgColor = '#e89060'
    fogColor = '#c08060'
    fogNear = 50
    fogFar = 160
  } else if (hour >= 7 && hour < 18) {
    bgColor = '#6aA8D0'
    fogColor = '#7aB0a0'
    fogNear = 70
    fogFar = 200
  } else if (hour >= 18 && hour < 21) {
    bgColor = '#4a3060'
    fogColor = '#3a2850'
    fogNear = 40
    fogFar = 150
  } else {
    bgColor = '#0a0a1a'
    fogColor = '#080818'
    fogNear = 20
    fogFar = 100
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 28, 28], fov: 50, near: 0.5, far: 300 }}
      style={{ background: bgColor }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
    >
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <GameLoop />
      <CameraFollow />
      <Lighting />
      <Sky />
      <Terrain />
      <GroundDetail />
      <Mushrooms />
      <Cattails />
      <SupplyCrates />
      <Forest />
      <Rocks />
      <MapBoundary />
      <RockyClearing />
      <DenseForestZone />
      <BeachZone />
      <SwampZone />
      <Water />
      <Animals />
      <PondFish />
      <AirParticles />
      <Fireflies />
      <Rain />
      <Snow />
      <WeatherFog />
      <Player placingItem={placingItem} onPlace={onPlace} />
    </Canvas>
  )
}
