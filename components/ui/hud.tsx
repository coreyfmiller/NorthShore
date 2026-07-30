'use client'

import { useGameStore } from '@/lib/game-store'
import { useState, useEffect, useRef } from 'react'

export function HUD() {
  const { health, hunger, thirst, bodyTemp, airTemp, hour, minute, day, season, weather, stamina, items, isDead, deathCause, timeSpeed, nearFire } = useGameStore()

  const timeStr = `${hour.toString().padStart(2, '0')}:${Math.floor(minute).toString().padStart(2, '0')}`

  if (isDead) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/85 z-50">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-red-500">You Died</h1>
          <p className="mt-3 text-lg text-gray-300">Cause: {deathCause}</p>
          <div className="mt-4 text-sm text-gray-400 space-y-1">
            <p>Survived {day} day{day > 1 ? 's' : ''}</p>
            <p>Season: {season}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 rounded-lg bg-red-600/80 px-8 py-3 text-white font-medium hover:bg-red-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Inventory summary
  const itemList = Object.entries(items).filter(([_, qty]) => qty > 0)

  return (
    <>
      {/* Low stat warnings */}
      <Warnings health={health} hunger={hunger} thirst={thirst} bodyTemp={bodyTemp} stamina={stamina} />

      {/* Stats */}
      <div className="fixed top-4 left-4 z-40 font-mono text-xs text-white/90 bg-black/50 rounded-lg p-3 backdrop-blur-sm space-y-1">
        <div>Day {day} — {timeStr} — {season} — {weather} {timeSpeed === 0 && '(paused)'}</div>
        <div className="flex gap-3">
          <span className={health < 30 ? 'text-red-400' : ''}>HP: {Math.round(health)}</span>
          <span className={hunger < 20 ? 'text-red-400' : hunger < 40 ? 'text-yellow-400' : ''}>Hunger: {Math.round(hunger)}</span>
          <span className={thirst < 20 ? 'text-red-400' : thirst < 40 ? 'text-yellow-400' : ''}>Thirst: {Math.round(thirst)}</span>
        </div>
        <div className="flex gap-3">
          <span className={bodyTemp < 35 ? 'text-blue-400' : ''}>Body: {bodyTemp.toFixed(1)}°C</span>
          <span>Air: {Math.round(airTemp)}°C</span>
          <span className={stamina < 20 ? 'text-yellow-400' : ''}>Stam: {Math.round(stamina)}</span>
          {nearFire && <span className="text-orange-400">🔥 Warm</span>}
        </div>
      </div>

      {/* Inventory */}
      <div className="fixed top-4 right-4 z-40 font-mono text-xs text-white/90 bg-black/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-white/60 mb-1">Inventory</div>
        {itemList.length === 0 ? (
          <div className="text-white/40">Empty</div>
        ) : (
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {itemList.map(([id, qty]) => (
              <div key={id} className="flex justify-between gap-4">
                <span>{id.replace(/_/g, ' ')}</span>
                <span className="text-white/60">x{qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-4 left-4 z-40 font-mono text-[10px] text-white/50 bg-black/40 rounded-lg p-2 backdrop-blur-sm space-y-0.5">
        <div>WASD: move | Shift: sprint</div>
        <div>Click tree: chop (axe) | Click animal: hunt (knife)</div>
        <div>E near water: fish | F: eat food</div>
        <div>B: backpack | C: craft menu | R: drink (near water)</div>
        <div>T/Y: time speed | Click fire: cook | Click shelter: sleep</div>
      </div>

      {/* Compass */}
      <Compass />

      {/* Hotbar */}
      <Hotbar />

      {/* Action feedback */}
      <ActionLog />
    </>
  )
}

function Warnings({ health, hunger, thirst, bodyTemp, stamina }: { health: number; hunger: number; thirst: number; bodyTemp: number; stamina: number }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const lastMsg = useRef('')

  useEffect(() => {
    let msg = ''
    if (health < 20) msg = '⚠ Health critical!'
    else if (thirst < 15) msg = '⚠ Dying of thirst! Find water!'
    else if (hunger < 15) msg = '⚠ Starving! Find food!'
    else if (bodyTemp < 34) msg = '⚠ Freezing! Find warmth!'
    else if (thirst < 30) msg = 'Getting thirsty...'
    else if (hunger < 30) msg = 'Getting hungry...'
    else if (bodyTemp < 35.5) msg = 'Getting cold...'
    
    if (!msg) {
      // Stats are fine — hide warning
      setVisible(false)
      lastMsg.current = ''
      return
    }

    if (msg !== lastMsg.current) {
      lastMsg.current = msg
      setMessage(msg)
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
  }, [health, hunger, thirst, bodyTemp])

  if (!visible || !message) return null

  const isCritical = message.includes('critical') || message.includes('Dying') || message.includes('Starving') || message.includes('Freezing')

  return (
    <div className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center px-4 py-2 rounded-lg backdrop-blur-sm ${
      isCritical ? 'bg-red-900/60 text-red-300' : 'bg-yellow-900/40 text-yellow-300'
    } text-sm font-medium animate-pulse`}>
      {message}
    </div>
  )
}

function ActionLog() {
  const logs = useGameStore((s) => s.logs)
  
  return (
    <div className="fixed bottom-4 right-4 z-40 font-mono text-[11px] text-white/70 bg-black/40 rounded-lg p-2 backdrop-blur-sm w-64 max-h-32 overflow-hidden">
      {logs.slice(-5).map((log, i) => (
        <div key={i} className="truncate" style={{ opacity: 1 - i * 0.15 }}>{log}</div>
      ))}
    </div>
  )
}


function Compass() {
  const rotation = useGameStore((s) => s.playerRotation)
  // Convert rotation to compass direction
  const deg = ((rotation * 180 / Math.PI) + 360) % 360
  let dir = 'N'
  if (deg > 337.5 || deg <= 22.5) dir = 'N'
  else if (deg > 22.5 && deg <= 67.5) dir = 'NE'
  else if (deg > 67.5 && deg <= 112.5) dir = 'E'
  else if (deg > 112.5 && deg <= 157.5) dir = 'SE'
  else if (deg > 157.5 && deg <= 202.5) dir = 'S'
  else if (deg > 202.5 && deg <= 247.5) dir = 'SW'
  else if (deg > 247.5 && deg <= 292.5) dir = 'W'
  else if (deg > 292.5 && deg <= 337.5) dir = 'NW'

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-xs font-mono">
        {dir}
      </div>
    </div>
  )
}


function Hotbar() {
  const items = useGameStore((s) => s.items)
  const eat = useGameStore((s) => s.eat)
  const drink = useGameStore((s) => s.drink)
  const startFishing = useGameStore((s) => s.startFishing)

  // Fixed hotbar slots
  const slots = [
    { key: '1', label: 'Eat', action: () => eat(), icon: '🍖' },
    { key: '2', label: 'Drink', action: () => drink(), icon: '💧' },
    { key: '3', label: 'Fish', action: () => startFishing(), icon: '🎣' },
    { key: '4', label: 'Axe', action: () => {}, icon: '🪓', passive: true },
    { key: '5', label: 'Torch', action: () => {}, icon: '🕯️', passive: true },
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5) {
        slots[num - 1].action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 flex gap-1">
      {slots.map((slot) => (
        <div key={slot.key} className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded border border-white/10 flex flex-col items-center justify-center text-white/70 text-[9px] cursor-pointer hover:border-white/30" onClick={slot.action}>
          <span className="text-sm">{slot.icon}</span>
          <span className="text-[8px] text-white/40">{slot.key}</span>
        </div>
      ))}
    </div>
  )
}
