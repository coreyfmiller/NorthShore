'use client'

import dynamic from 'next/dynamic'
import { HUD } from '@/components/ui/hud'
import { CraftMenu } from '@/components/ui/craft-menu'
import { Inventory } from '@/components/ui/inventory'
import { CrateUI } from '@/components/ui/crate-ui'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/game-store'
import { saveGame, loadGame, hasSave } from '@/lib/save-system'

const GameScene = dynamic(
  () => import('@/components/world/scene').then((mod) => mod.GameScene),
  { ssr: false }
)

export default function Home() {
  const [craftOpen, setCraftOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [placingItem, setPlacingItem] = useState<string | null>(null)

  // Load save on mount
  useEffect(() => {
    if (hasSave()) {
      loadGame()
      useGameStore.getState().log('Game loaded.')
    }
  }, [])

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!useGameStore.getState().isDead) {
        saveGame()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' && !craftOpen && !inventoryOpen) {
        setCraftOpen(true)
      } else if (e.code === 'KeyB' && !craftOpen && !inventoryOpen) {
        setInventoryOpen(true)
      } else if (e.code === 'Escape') {
        setCraftOpen(false)
        setInventoryOpen(false)
        setPlacingItem(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [craftOpen, inventoryOpen])

  const handleRecipeSelect = (recipeId: string) => {
    const state = useGameStore.getState()
    
    // Define costs
    const costs: Record<string, Record<string, number>> = {
      campfire: { branches: 5 },
      shelter: { branches: 10 },
      rope: { branches: 3 },
      torch: { branches: 1, tinder: 2 },
      rabbit_trap: { branches: 4, rope: 1 },
      bow: { branches: 3, rope: 1 },
      arrows: { branches: 2, rocks: 1 },
      leather: { hide: 1 },
      leather_coat: { leather: 3, rope: 1 },
      cabin: { firewood: 8, rope: 2 },
      dock: { firewood: 6, rope: 2 },
      drying_rack: { branches: 6, rope: 1 },
      storage_crate: { firewood: 4 },
    }

    // Items that go straight to inventory (not placed in world)
    const inventoryItems: Record<string, { item: string; qty: number }> = {
      rope: { item: 'rope', qty: 1 },
      torch: { item: 'torch', qty: 1 },
      bow: { item: 'bow', qty: 1 },
      arrows: { item: 'arrows', qty: 5 },
      leather: { item: 'leather', qty: 1 },
      leather_coat: { item: 'leather_coat', qty: 1 },
    }

    const cost = costs[recipeId]
    if (!cost) return

    // Check all materials first
    for (const [item, qty] of Object.entries(cost)) {
      if ((state.items[item] || 0) < qty) {
        state.log(`Not enough ${item.replace(/_/g, ' ')}!`)
        return
      }
    }

    // Deduct all materials
    for (const [item, qty] of Object.entries(cost)) {
      state.removeItem(item, qty)
    }

    // If it's an inventory item, add directly and done
    if (inventoryItems[recipeId]) {
      const { item, qty } = inventoryItems[recipeId]
      state.addItem(item, qty)
      state.log(`Crafted ${recipeId.replace(/_/g, ' ')}!`)
      setCraftOpen(false)
      return
    }

    setCraftOpen(false)
    setPlacingItem(recipeId)
    state.log(`Place your ${recipeId.replace(/_/g, ' ')} — click on the ground.`)
  }

  return (
    <div className="w-screen h-screen">
      <GameScene placingItem={placingItem} onPlace={() => setPlacingItem(null)} />
      <HUD />
      <CraftMenu isOpen={craftOpen} onClose={() => setCraftOpen(false)} onSelect={handleRecipeSelect} />
      <Inventory isOpen={inventoryOpen} onClose={() => setInventoryOpen(false)} />
      <CrateStorage />
      
      {/* Placement mode indicator */}
      {placingItem && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            Click to place {placingItem.replace(/_/g, ' ')} • Q/E to rotate • ESC to cancel
          </div>
        </div>
      )}
    </div>
  )
}

function CrateStorage() {
  const openCrate = useGameStore((s) => s.openCrate)
  
  if (!openCrate) return null

  const handleStore = (itemId: string) => {
    const state = useGameStore.getState()
    if (!state.hasItem(itemId)) return
    state.removeItem(itemId, 1)
    // Add to crate
    const crate = useGameStore.getState().openCrate
    if (!crate) return
    const newItems = { ...crate.items, [itemId]: (crate.items[itemId] || 0) + 1 }
    useGameStore.setState({ openCrate: { ...crate, items: newItems } })
  }

  const handleTake = (itemId: string) => {
    const crate = useGameStore.getState().openCrate
    if (!crate || !crate.items[itemId]) return
    const state = useGameStore.getState()
    state.addItem(itemId, 1)
    const newItems = { ...crate.items }
    newItems[itemId]--
    if (newItems[itemId] <= 0) delete newItems[itemId]
    useGameStore.setState({ openCrate: { ...crate, items: newItems } })
  }

  return (
    <CrateUI
      isOpen={true}
      crateItems={openCrate.items}
      onClose={() => useGameStore.setState({ openCrate: null })}
      onStoreItem={handleStore}
      onTakeItem={handleTake}
    />
  )
}
