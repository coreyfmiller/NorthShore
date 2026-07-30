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

      {/* Controls toggle */}
      <ControlsPanel />

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


function ControlsPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-black/60 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 hover:text-white transition-colors"
        >
          Show Controls
        </button>
      ) : (
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white/80 font-mono text-[11px] space-y-2 max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-xs font-semibold">Controls</span>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white text-xs">✕</button>
          </div>
          <div className="space-y-1.5">
            <div className="text-white/50 text-[9px] uppercase tracking-wider">Movement</div>
            <div>W/A/S/D — Move</div>
            <div>Shift — Sprint (uses stamina)</div>
            <div>Right-click drag — Rotate camera</div>
            <div>Scroll wheel — Zoom in/out</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-white/50 text-[9px] uppercase tracking-wider">Actions</div>
            <div>Click tree — Chop (need axe, be close)</div>
            <div>Click deer/moose — Shoot (need bow + arrows)</div>
            <div>Click downed animal — Harvest (need knife)</div>
            <div>Click bush — Pick berries</div>
            <div>Click mushroom/cattail — Gather</div>
            <div>Click ground items — Pick up</div>
            <div>Click campfire — Cook raw meat</div>
            <div>Click shelter/cabin — Sleep</div>
            <div>Click storage crate — Open storage</div>
            <div>Right-click structure — Rotate it</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-white/50 text-[9px] uppercase tracking-wider">Keys</div>
            <div>B — Open backpack</div>
            <div>C — Open craft menu</div>
            <div>E — Fish (near water)</div>
            <div>F — Quick eat best food</div>
            <div>R — Drink (near water)</div>
            <div>T — Speed up time</div>
            <div>Y — Slow down time</div>
            <div>Q/E — Rotate item during placement</div>
            <div>Escape — Close menus / cancel placement</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-white/50 text-[9px] uppercase tracking-wider">Hotbar</div>
            <div>1 — Eat | 2 — Drink | 3 — Fish</div>
            <div>4 — Axe | 5 — Torch</div>
          </div>
        </div>
      )}
    </div>
  )
}
