'use client'

import { useMemo } from 'react'
import { getTerrainHeight } from './terrain'
import * as THREE from 'three'

export function Rocks() {
  const rocks = useMemo(() => {
    const result: { pos: [number, number, number]; scale: [number, number, number]; rotation: [number, number, number]; color: string; type: 'boulder' | 'flat' | 'cluster' }[] = []

    const waterZones = [
      { x: 45, z: 5, radius: 22 },
      { x: -55, z: 50, radius: 16 },
      { x: -40, z: -40, radius: 16 },
    ]

    for (let i = 0; i < 45; i++) {
      const x = (Math.random() - 0.5) * 240
      const z = (Math.random() - 0.5) * 240

      const inWater = waterZones.some((zone) => {
        const dx = x - zone.x
        const dz = z - zone.z
        return Math.sqrt(dx * dx + dz * dz) < zone.radius
      })
      if (inWater) continue

      const y = getTerrainHeight(x, z)
      const sx = 0.3 + Math.random() * 1.2
      const sy = 0.2 + Math.random() * 0.7
      const sz = 0.3 + Math.random() * 1.2
      const rotation: [number, number, number] = [
        Math.random() * 0.3,
        Math.random() * Math.PI,
        Math.random() * 0.2
      ]

      // More natural color variation
      const shade = 0.3 + Math.random() * 0.25
      const warmth = Math.random() * 0.03
      const r = Math.floor((shade + warmth) * 255)
      const g = Math.floor((shade - warmth * 0.5) * 245)
      const b = Math.floor((shade - warmth) * 230)
      const color = `rgb(${r}, ${g}, ${b})`

      const type = Math.random() < 0.3 ? 'flat' : Math.random() < 0.5 ? 'cluster' : 'boulder'
      result.push({ pos: [x, y + sy * 0.35, z], scale: [sx, sy, sz], rotation, color, type })
    }
    return result
  }, [])

  return (
    <group>
      {rocks.map((rock, i) => {
        if (rock.type === 'cluster') {
          // Group of 2-3 smaller rocks together
          return (
            <group key={i} position={rock.pos} rotation={rock.rotation}>
              <mesh scale={[rock.scale[0], rock.scale[1], rock.scale[2]]} castShadow receiveShadow>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
              </mesh>
              <mesh
                position={[rock.scale[0] * 0.7, -rock.scale[1] * 0.2, rock.scale[2] * 0.3]}
                scale={[rock.scale[0] * 0.5, rock.scale[1] * 0.6, rock.scale[2] * 0.5]}
                castShadow receiveShadow
              >
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
              </mesh>
            </group>
          )
        }
        if (rock.type === 'flat') {
          return (
            <mesh key={i} position={rock.pos} scale={[rock.scale[0] * 1.5, rock.scale[1] * 0.4, rock.scale[2] * 1.5]} rotation={rock.rotation} castShadow receiveShadow>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
            </mesh>
          )
        }
        // Boulder
        return (
          <mesh key={i} position={rock.pos} scale={rock.scale} rotation={rock.rotation} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}
