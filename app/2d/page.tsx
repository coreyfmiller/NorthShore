'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/lib/game-store'
import { HUD } from '@/components/ui/hud'
import { CraftMenu } from '@/components/ui/craft-menu'
import { Inventory } from '@/components/ui/inventory'

// Tile types
const TILE_GRASS = 0
const TILE_WATER = 1
const TILE_DIRT = 2
const TILE_SAND = 3
const TILE_SWAMP = 4
const TILE_ROCK = 5

// Object types on tiles
const OBJ_NONE = 0
const OBJ_TREE_PINE = 1
const OBJ_TREE_BIRCH = 2
const OBJ_BUSH_BERRY = 3
const OBJ_ROCK = 4
const OBJ_MUSHROOM = 5
const OBJ_CATTAIL = 6
const OBJ_FLOWER = 7
const OBJ_STUMP = 8
const OBJ_STICK = 9

const MAP_SIZE = 80
const TILE_SIZE = 16

// Generate the world map
function generateMap(): { tiles: number[][]; objects: number[][] } {
  const tiles: number[][] = []
  const objects: number[][] = []

  for (let y = 0; y < MAP_SIZE; y++) {
    tiles[y] = []
    objects[y] = []
    for (let x = 0; x < MAP_SIZE; x++) {
      tiles[y][x] = TILE_GRASS
      objects[y][x] = OBJ_NONE
    }
  }

  // Lakes (organic circles)
  const lakes = [
    { cx: 55, cy: 30, r: 6 },
    { cx: 20, cy: 60, r: 5 },
    { cx: 65, cy: 65, r: 4 },
  ]
  for (const lake of lakes) {
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const dx = x - lake.cx
        const dy = y - lake.cy
        const angle = Math.atan2(dy, dx)
        const noise = Math.sin(angle * 3 + lake.cx) * 1.2 + Math.sin(angle * 5 + lake.cy) * 0.6
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < lake.r + noise) {
          tiles[y][x] = TILE_WATER
        } else if (dist < lake.r + noise + 1.5) {
          if (tiles[y][x] === TILE_GRASS) tiles[y][x] = TILE_DIRT
        }
      }
    }
  }

  // Biomes
  // Swamp — bottom left
  for (let y = 55; y < 75; y++) {
    for (let x = 5; x < 25; x++) {
      const dx = x - 15, dy = y - 65
      if (Math.sqrt(dx * dx + dy * dy) < 10 && tiles[y][x] !== TILE_WATER) {
        tiles[y][x] = TILE_SWAMP
      }
    }
  }
  // Rocky area — top right
  for (let y = 5; y < 20; y++) {
    for (let x = 58; x < 75; x++) {
      const dx = x - 66, dy = y - 12
      if (Math.sqrt(dx * dx + dy * dy) < 8 && tiles[y][x] !== TILE_WATER) {
        tiles[y][x] = TILE_ROCK
      }
    }
  }
  // Meadow — top center
  for (let y = 5; y < 18; y++) {
    for (let x = 30; x < 50; x++) {
      const dx = x - 40, dy = y - 11
      if (Math.sqrt(dx * dx + dy * dy) < 8 && tiles[y][x] !== TILE_WATER) {
        tiles[y][x] = TILE_SAND // reuse as meadow light green
      }
    }
  }

  // Place objects
  for (let y = 2; y < MAP_SIZE - 2; y++) {
    for (let x = 2; x < MAP_SIZE - 2; x++) {
      if (tiles[y][x] === TILE_WATER) continue
      if (x === 40 && y === 40) continue // player spawn

      const r = Math.random()
      if (tiles[y][x] === TILE_GRASS) {
        if (r < 0.06) objects[y][x] = Math.random() > 0.4 ? OBJ_TREE_PINE : OBJ_TREE_BIRCH
        else if (r < 0.08) objects[y][x] = OBJ_BUSH_BERRY
        else if (r < 0.09) objects[y][x] = OBJ_ROCK
        else if (r < 0.095) objects[y][x] = OBJ_MUSHROOM
        else if (r < 0.1) objects[y][x] = OBJ_STICK
      } else if (tiles[y][x] === TILE_DIRT) {
        if (r < 0.1) objects[y][x] = OBJ_CATTAIL
      } else if (tiles[y][x] === TILE_ROCK) {
        if (r < 0.15) objects[y][x] = OBJ_ROCK
        else if (r < 0.17) objects[y][x] = OBJ_STUMP
      } else if (tiles[y][x] === TILE_SAND) {
        if (r < 0.06) objects[y][x] = OBJ_FLOWER
        else if (r < 0.08) objects[y][x] = OBJ_BUSH_BERRY
      } else if (tiles[y][x] === TILE_SWAMP) {
        if (r < 0.04) objects[y][x] = OBJ_STUMP
        else if (r < 0.07) objects[y][x] = OBJ_MUSHROOM
      }
    }
  }

  return { tiles, objects }
}

// Color palettes
const TILE_COLORS: Record<number, string> = {
  [TILE_GRASS]: '#3a7a30',
  [TILE_WATER]: '#2060a0',
  [TILE_DIRT]: '#5a4a30',
  [TILE_SAND]: '#5a9a40',
  [TILE_SWAMP]: '#2a4020',
  [TILE_ROCK]: '#6a6a60',
}

// Draw a pixel-art style object on the tile
function drawObject(ctx: CanvasRenderingContext2D, obj: number, x: number, y: number) {
  const cx = x + TILE_SIZE / 2
  const cy = y + TILE_SIZE / 2

  if (obj === OBJ_TREE_PINE) {
    // Trunk
    ctx.fillStyle = '#4a2a10'
    ctx.fillRect(cx - 1, cy + 2, 3, 5)
    // Canopy layers
    ctx.fillStyle = '#1a5020'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 6)
    ctx.lineTo(cx - 5, cy + 2)
    ctx.lineTo(cx + 5, cy + 2)
    ctx.fill()
    ctx.fillStyle = '#1a6028'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 4)
    ctx.lineTo(cx - 4, cy + 1)
    ctx.lineTo(cx + 4, cy + 1)
    ctx.fill()
  } else if (obj === OBJ_TREE_BIRCH) {
    ctx.fillStyle = '#e0d8c8'
    ctx.fillRect(cx - 1, cy + 1, 2, 6)
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(cx - 1, cy + 3, 1, 1)
    ctx.fillStyle = '#4a9a3a'
    ctx.beginPath()
    ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a8530'
    ctx.beginPath()
    ctx.arc(cx + 2, cy - 3, 3, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj === OBJ_BUSH_BERRY) {
    ctx.fillStyle = '#2a5a2a'
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fill()
    // Berries
    ctx.fillStyle = '#cc2020'
    ctx.fillRect(cx - 2, cy - 2, 2, 2)
    ctx.fillRect(cx + 1, cy, 2, 2)
    ctx.fillRect(cx - 1, cy + 1, 2, 2)
  } else if (obj === OBJ_ROCK) {
    ctx.fillStyle = '#7a7a70'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 2, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#8a8a80'
    ctx.beginPath()
    ctx.ellipse(cx - 1, cy + 1, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj === OBJ_MUSHROOM) {
    ctx.fillStyle = '#d0c0a0'
    ctx.fillRect(cx - 1, cy + 1, 2, 3)
    ctx.fillStyle = '#8a5030'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, Math.PI, 0)
    ctx.fill()
  } else if (obj === OBJ_CATTAIL) {
    ctx.fillStyle = '#4a7030'
    ctx.fillRect(cx, cy - 2, 1, 8)
    ctx.fillStyle = '#5a3018'
    ctx.fillRect(cx - 1, cy - 2, 3, 4)
  } else if (obj === OBJ_FLOWER) {
    ctx.fillStyle = '#3a6020'
    ctx.fillRect(cx, cy + 2, 1, 3)
    const colors = ['#e040a0', '#e0a020', '#a040d0', '#e06030']
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.beginPath()
    ctx.arc(cx, cy + 1, 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj === OBJ_STUMP) {
    ctx.fillStyle = '#5a3a18'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 2, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#7a5a30'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 1, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj === OBJ_STICK) {
    ctx.fillStyle = '#5a3a18'
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(0.5)
    ctx.fillRect(-4, -1, 8, 1)
    ctx.restore()
  }
}

// Draw the player sprite
function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number) {
  // Body
  ctx.fillStyle = '#6a3a1a' // jacket
  ctx.fillRect(x - 4, y - 3, 8, 8)
  // Legs
  ctx.fillStyle = '#2a4030'
  ctx.fillRect(x - 3, y + 5, 3, 4)
  ctx.fillRect(x + 1, y + 5, 3, 4)
  // Head
  ctx.fillStyle = '#d4a574'
  ctx.fillRect(x - 3, y - 7, 6, 5)
  // Toque
  ctx.fillStyle = '#8a2020'
  ctx.fillRect(x - 3, y - 10, 6, 4)
  // Backpack
  ctx.fillStyle = '#2d5a27'
  ctx.fillRect(x - 3, y - 1, 2, 5)
  // Direction indicator
  ctx.fillStyle = '#ffffff'
  if (facing === 0) ctx.fillRect(x - 1, y - 11, 2, 1) // north
  else if (facing === 1) ctx.fillRect(x + 4, y, 1, 2)  // east
  else if (facing === 2) ctx.fillRect(x - 1, y + 9, 2, 1) // south
  else ctx.fillRect(x - 5, y, 1, 2) // west
}

// Animals
interface Animal {
  x: number
  y: number
  type: 'rabbit' | 'deer' | 'moose' | 'fox'
  dir: number
  moveTimer: number
  alive: boolean
}

function drawAnimal(ctx: CanvasRenderingContext2D, animal: Animal, screenX: number, screenY: number) {
  const x = screenX + TILE_SIZE / 2
  const y = screenY + TILE_SIZE / 2

  if (animal.type === 'rabbit') {
    ctx.fillStyle = '#a08060'
    ctx.beginPath()
    ctx.ellipse(x, y, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Ears
    ctx.fillRect(x - 2, y - 4, 1, 3)
    ctx.fillRect(x + 1, y - 4, 1, 3)
    // Tail
    ctx.fillStyle = '#e8e0d8'
    ctx.fillRect(x + 2, y, 2, 2)
  } else if (animal.type === 'deer') {
    ctx.fillStyle = '#a07040'
    ctx.beginPath()
    ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    // Head
    ctx.fillStyle = '#906030'
    ctx.beginPath()
    ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2)
    ctx.fill()
    // White tail
    ctx.fillStyle = '#e8dcc8'
    ctx.fillRect(x - 5, y - 1, 2, 2)
  } else if (animal.type === 'moose') {
    ctx.fillStyle = '#6a4a2a'
    ctx.beginPath()
    ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    // Head
    ctx.fillStyle = '#4a3018'
    ctx.fillRect(x + 4, y - 3, 4, 3)
    // Antlers
    ctx.fillStyle = '#d4c4a0'
    ctx.fillRect(x + 5, y - 6, 1, 3)
    ctx.fillRect(x + 7, y - 5, 1, 2)
  } else if (animal.type === 'fox') {
    ctx.fillStyle = '#cc6a20'
    ctx.beginPath()
    ctx.ellipse(x, y, 3, 2, 0, 0, Math.PI * 2)
    ctx.fill()
    // Tail
    ctx.fillStyle = '#cc6a20'
    ctx.fillRect(x - 5, y - 1, 3, 2)
    ctx.fillStyle = '#e8e0d8'
    ctx.fillRect(x - 5, y - 1, 1, 2)
    // Ears
    ctx.fillStyle = '#cc6a20'
    ctx.fillRect(x + 2, y - 3, 2, 2)
  }
}

export default function Game2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<{ tiles: number[][]; objects: number[][] } | null>(null)
  const playerRef = useRef({ x: 40, y: 40, facing: 2 })
  const keysRef = useRef<Set<string>>(new Set())
  const animalsRef = useRef<Animal[]>([])
  const [craftOpen, setCraftOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const { addItem, log } = useGameStore()

  // Generate map once
  useEffect(() => {
    mapRef.current = generateMap()
    // Spawn animals
    const animals: Animal[] = []
    for (let i = 0; i < 6; i++) animals.push({ x: 20 + Math.random() * 40, y: 20 + Math.random() * 40, type: 'rabbit', dir: 0, moveTimer: Math.random() * 3, alive: true })
    for (let i = 0; i < 4; i++) animals.push({ x: 10 + Math.random() * 60, y: 10 + Math.random() * 60, type: 'deer', dir: 0, moveTimer: Math.random() * 3, alive: true })
    for (let i = 0; i < 2; i++) animals.push({ x: 10 + Math.random() * 60, y: 10 + Math.random() * 60, type: 'moose', dir: 0, moveTimer: Math.random() * 3, alive: true })
    for (let i = 0; i < 3; i++) animals.push({ x: 10 + Math.random() * 60, y: 10 + Math.random() * 60, type: 'fox', dir: 0, moveTimer: Math.random() * 3, alive: true })
    animalsRef.current = animals
  }, [])

  // Input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.code)
      if (e.code === 'KeyC') setCraftOpen(true)
      if (e.code === 'KeyB') setInventoryOpen(true)
      if (e.code === 'Escape') { setCraftOpen(false); setInventoryOpen(false) }

      // Interact with E
      if (e.code === 'KeyE') {
        const p = playerRef.current
        const map = mapRef.current
        if (!map) return
        // Check facing tile for interactable object
        const fx = Math.round(p.x + (p.facing === 1 ? 1 : p.facing === 3 ? -1 : 0))
        const fy = Math.round(p.y + (p.facing === 2 ? 1 : p.facing === 0 ? -1 : 0))
        if (fx >= 0 && fx < MAP_SIZE && fy >= 0 && fy < MAP_SIZE) {
          const obj = map.objects[fy][fx]
          if (obj === OBJ_TREE_PINE || obj === OBJ_TREE_BIRCH) {
            if (!useGameStore.getState().hasItem('axe')) { log('Need an axe.'); return }
            map.objects[fy][fx] = OBJ_STUMP
            addItem('firewood', 2)
            addItem('branches', 3)
            log('Chopped tree! +2 firewood, +3 branches')
            setTimeout(() => { if (mapRef.current) mapRef.current.objects[fy][fx] = obj }, 180000)
          } else if (obj === OBJ_BUSH_BERRY) {
            map.objects[fy][fx] = OBJ_NONE
            addItem('blueberries', 3)
            log('Picked berries! +3 blueberries')
            setTimeout(() => { if (mapRef.current) mapRef.current.objects[fy][fx] = OBJ_BUSH_BERRY }, 60000)
          } else if (obj === OBJ_ROCK) {
            map.objects[fy][fx] = OBJ_NONE
            addItem('rocks', 1)
            log('Picked up rock.')
            setTimeout(() => { if (mapRef.current) mapRef.current.objects[fy][fx] = OBJ_ROCK }, 120000)
          } else if (obj === OBJ_MUSHROOM) {
            map.objects[fy][fx] = OBJ_NONE
            const poisonous = Math.random() < 0.25
            addItem(poisonous ? 'poisonous_mushroom' : 'wild_mushroom', 1)
            log(poisonous ? 'Picked a suspicious mushroom...' : 'Picked a mushroom.')
            setTimeout(() => { if (mapRef.current) mapRef.current.objects[fy][fx] = OBJ_MUSHROOM }, 120000)
          } else if (obj === OBJ_CATTAIL) {
            map.objects[fy][fx] = OBJ_NONE
            addItem('cattail_root', 1)
            addItem('tinder', 1)
            log('Harvested cattail. +1 root, +1 tinder')
            setTimeout(() => { if (mapRef.current) mapRef.current.objects[fy][fx] = OBJ_CATTAIL }, 150000)
          } else if (obj === OBJ_STICK) {
            map.objects[fy][fx] = OBJ_NONE
            addItem('branches', 1)
            log('Picked up stick.')
          } else if (obj === OBJ_FLOWER) {
            map.objects[fy][fx] = OBJ_NONE
            addItem('tinder', 1)
            log('Picked wildflower. +1 tinder')
          } else if (map.tiles[fy][fx] === TILE_WATER) {
            // Fish
            if (!useGameStore.getState().hasItem('fishing_line')) { log('Need a fishing line.'); return }
            log('Casting line...')
            setTimeout(() => {
              if (Math.random() < 0.7) {
                const fish = ['brook_trout', 'smallmouth_bass', 'yellow_perch'][Math.floor(Math.random() * 3)]
                addItem(fish, 1)
                log(`Caught a ${fish.replace(/_/g, ' ')}!`)
              } else {
                log('Nothing biting.')
              }
            }, 2500)
          }
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) }
  }, [addItem, log])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    let lastTime = 0
    let moveAccum = 0

    const gameLoop = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      const map = mapRef.current
      if (!map) { animFrame = requestAnimationFrame(gameLoop); return }

      const p = playerRef.current
      const keys = keysRef.current

      // Player movement (tile-based, smooth with accumulator)
      moveAccum += delta
      const moveRate = keys.has('ShiftLeft') ? 0.08 : 0.12
      if (moveAccum > moveRate) {
        moveAccum = 0
        let nx = p.x, ny = p.y
        if (keys.has('KeyW') || keys.has('ArrowUp')) { ny -= 1; p.facing = 0 }
        if (keys.has('KeyS') || keys.has('ArrowDown')) { ny += 1; p.facing = 2 }
        if (keys.has('KeyA') || keys.has('ArrowLeft')) { nx -= 1; p.facing = 3 }
        if (keys.has('KeyD') || keys.has('ArrowRight')) { nx += 1; p.facing = 1 }

        // Collision check
        if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
          const tile = map.tiles[Math.round(ny)][Math.round(nx)]
          const obj = map.objects[Math.round(ny)][Math.round(nx)]
          if (tile !== TILE_WATER && obj !== OBJ_TREE_PINE && obj !== OBJ_TREE_BIRCH && obj !== OBJ_ROCK) {
            p.x = nx
            p.y = ny
          }
        }
      }

      // Move animals
      for (const a of animalsRef.current) {
        if (!a.alive) continue
        a.moveTimer -= delta
        if (a.moveTimer <= 0) {
          a.moveTimer = 1 + Math.random() * 3
          const dx = Math.round(Math.random() * 2 - 1)
          const dy = Math.round(Math.random() * 2 - 1)
          const nx = a.x + dx
          const ny = a.y + dy
          if (nx > 1 && nx < MAP_SIZE - 1 && ny > 1 && ny < MAP_SIZE - 1) {
            if (map.tiles[Math.round(ny)][Math.round(nx)] !== TILE_WATER) {
              a.x = nx
              a.y = ny
            }
          }
        }
      }

      // Render
      const W = canvas.width
      const H = canvas.height
      const tilesX = Math.ceil(W / TILE_SIZE) + 2
      const tilesY = Math.ceil(H / TILE_SIZE) + 2
      const camX = p.x - tilesX / 2
      const camY = p.y - tilesY / 2

      ctx.imageSmoothingEnabled = false

      // Draw tiles
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const mx = Math.floor(camX + tx)
          const my = Math.floor(camY + ty)
          const sx = (tx - (camX % 1)) * TILE_SIZE
          const sy = (ty - (camY % 1)) * TILE_SIZE

          if (mx < 0 || mx >= MAP_SIZE || my < 0 || my >= MAP_SIZE) {
            ctx.fillStyle = '#1a1a2a'
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE)
            continue
          }

          // Tile with slight variation
          const baseTile = map.tiles[my][mx]
          ctx.fillStyle = TILE_COLORS[baseTile]
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE)

          // Subtle noise on grass
          if (baseTile === TILE_GRASS && ((mx + my) % 3 === 0)) {
            ctx.fillStyle = 'rgba(0,0,0,0.04)'
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE)
          }

          // Draw objects
          const obj = map.objects[my][mx]
          if (obj !== OBJ_NONE) {
            drawObject(ctx, obj, sx, sy)
          }
        }
      }

      // Draw animals
      for (const a of animalsRef.current) {
        if (!a.alive) continue
        const sx = (a.x - camX) * TILE_SIZE
        const sy = (a.y - camY) * TILE_SIZE
        if (sx > -TILE_SIZE && sx < W + TILE_SIZE && sy > -TILE_SIZE && sy < H + TILE_SIZE) {
          drawAnimal(ctx, a, sx, sy)
        }
      }

      // Draw player (always center)
      const px = (p.x - camX) * TILE_SIZE + TILE_SIZE / 2
      const py = (p.y - camY) * TILE_SIZE + TILE_SIZE / 2
      drawPlayer(ctx, px, py, p.facing)

      // Facing indicator (highlight tile you're looking at)
      const fx = p.x + (p.facing === 1 ? 1 : p.facing === 3 ? -1 : 0)
      const fy = p.y + (p.facing === 2 ? 1 : p.facing === 0 ? -1 : 0)
      const fsx = (fx - camX) * TILE_SIZE
      const fsy = (fy - camY) * TILE_SIZE
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(fsx, fsy, TILE_SIZE, TILE_SIZE)

      animFrame = requestAnimationFrame(gameLoop)
    }

    animFrame = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const handleRecipeSelect = (recipeId: string) => {
    const state = useGameStore.getState()
    const costs: Record<string, Record<string, number>> = {
      campfire: { branches: 5 }, shelter: { branches: 10 },
      rope: { branches: 3 }, torch: { branches: 1, tinder: 2 },
      rabbit_trap: { branches: 4, rope: 1 }, bow: { branches: 3, rope: 1 },
      arrows: { branches: 2, rocks: 1 }, leather: { hide: 1 },
      leather_coat: { leather: 3, rope: 1 },
    }
    const cost = costs[recipeId]
    if (!cost) return
    for (const [item, qty] of Object.entries(cost)) {
      if ((state.items[item] || 0) < qty) { state.log(`Not enough ${item.replace(/_/g, ' ')}!`); return }
    }
    for (const [item, qty] of Object.entries(cost)) { state.removeItem(item, qty) }
    state.addItem(recipeId === 'arrows' ? 'arrows' : recipeId, recipeId === 'arrows' ? 5 : 1)
    state.log(`Crafted ${recipeId.replace(/_/g, ' ')}!`)
    setCraftOpen(false)
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      <canvas ref={canvasRef} className="block" />
      <HUD />
      <CraftMenu isOpen={craftOpen} onClose={() => setCraftOpen(false)} onSelect={handleRecipeSelect} />
      <Inventory isOpen={inventoryOpen} onClose={() => setInventoryOpen(false)} />

      {/* 2D Controls hint */}
      <div className="fixed bottom-4 left-4 z-40 font-mono text-[10px] text-white/50 bg-black/60 rounded-lg p-2 space-y-0.5">
        <div>WASD: move | Shift: run faster</div>
        <div>E: interact with facing tile</div>
        <div>B: backpack | C: craft | F: eat</div>
      </div>
    </div>
  )
}
