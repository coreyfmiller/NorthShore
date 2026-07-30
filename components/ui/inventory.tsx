'use client'

import { useGameStore } from '@/lib/game-store'

// Item categories for visual grouping
const ITEM_CATEGORIES: Record<string, string> = {
  axe: 'tools', knife: 'tools', lighter: 'tools', fishing_line: 'tools', bow: 'tools', torch: 'tools',
  arrows: 'ammo',
  firewood: 'materials', branches: 'materials', rocks: 'materials', tinder: 'materials', rope: 'materials', hide: 'materials',
  cooked_brook_trout: 'food', cooked_smallmouth_bass: 'food', cooked_yellow_perch: 'food',
  cooked_rabbit: 'food', cooked_venison: 'food', canned_food: 'food',
  blueberries: 'food', wild_mushroom: 'food', poisonous_mushroom: 'food',
  brook_trout: 'food', smallmouth_bass: 'food', yellow_perch: 'food',
  raw_rabbit: 'food', raw_venison: 'food', cattail_root: 'food',
}

// Item icons (emoji stand-ins)
const ITEM_ICONS: Record<string, string> = {
  axe: '🪓', knife: '🔪', lighter: '🔥', fishing_line: '🎣', bow: '🏹', torch: '🕯️',
  arrows: '➵',
  firewood: '🪵', branches: '🌿', rocks: '🪨', tinder: '🍂', rope: '🪢', hide: '🦌',
  cooked_brook_trout: '🐟', cooked_smallmouth_bass: '🐟', cooked_yellow_perch: '🐟',
  cooked_rabbit: '🍖', cooked_venison: '🥩', canned_food: '🥫',
  blueberries: '🫐', wild_mushroom: '🍄', poisonous_mushroom: '🍄',
  brook_trout: '🐟', smallmouth_bass: '🐟', yellow_perch: '🐟',
  raw_rabbit: '🥩', raw_venison: '🥩',
}

const USABLE_ITEMS: Record<string, { action: string; label: string }> = {
  cooked_brook_trout: { action: 'eat', label: 'Eat' },
  cooked_smallmouth_bass: { action: 'eat', label: 'Eat' },
  cooked_yellow_perch: { action: 'eat', label: 'Eat' },
  cooked_rabbit: { action: 'eat', label: 'Eat' },
  cooked_venison: { action: 'eat', label: 'Eat' },
  canned_food: { action: 'eat', label: 'Eat' },
  blueberries: { action: 'eat', label: 'Eat' },
  wild_mushroom: { action: 'eat', label: 'Eat' },
  poisonous_mushroom: { action: 'eat', label: 'Eat' },
  cattail_root: { action: 'eat', label: 'Eat' },
  brook_trout: { action: 'eat', label: 'Eat raw' },
  smallmouth_bass: { action: 'eat', label: 'Eat raw' },
  yellow_perch: { action: 'eat', label: 'Eat raw' },
  raw_rabbit: { action: 'eat', label: 'Eat raw' },
  raw_venison: { action: 'eat', label: 'Eat raw' },
}

const ITEM_INFO: Record<string, string> = {
  axe: 'Chop trees for wood',
  knife: 'Hunt animals up close',
  lighter: 'Ignite campfires',
  fishing_line: 'Cast near water to fish',
  bow: 'Hunt from a distance',
  arrows: 'Ammunition for your bow',
  rope: 'Used in advanced crafting',
  torch: 'Light the darkness',
  firewood: 'Fuel for fire',
  branches: 'Basic building material',
  rocks: 'Hard and sharp',
  tinder: 'Catches a spark easily',
  hide: 'Tan it for leather',
  blueberries: '+5 hunger, +3 thirst',
  wild_mushroom: '+12 hunger',
  poisonous_mushroom: 'Risky... looks off',
  cattail_root: '+8 hunger, +2 thirst',
  canned_food: '+25 hunger',
  cooked_brook_trout: '+35 hunger',
  cooked_smallmouth_bass: '+35 hunger',
  cooked_yellow_perch: '+30 hunger',
  cooked_rabbit: '+30 hunger',
  cooked_venison: '+40 hunger',
  raw_rabbit: 'Cook it first',
  raw_venison: 'Cook it first',
  brook_trout: 'Better cooked',
  smallmouth_bass: 'Better cooked',
  yellow_perch: 'Better cooked',
}

interface InventoryProps {
  isOpen: boolean
  onClose: () => void
}

export function Inventory({ isOpen, onClose }: InventoryProps) {
  const items = useGameStore((s) => s.items)

  if (!isOpen) return null

  const itemList = Object.entries(items).filter(([_, qty]) => qty > 0)

  // Group by category
  const grouped: Record<string, [string, number][]> = { tools: [], food: [], materials: [], ammo: [], other: [] }
  itemList.forEach(([id, qty]) => {
    const cat = ITEM_CATEGORIES[id] || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push([id, qty])
  })

  const handleUse = (itemId: string) => {
    const state = useGameStore.getState()
    const usable = USABLE_ITEMS[itemId]
    if (!usable) return

    if (usable.action === 'eat') {
      const nutrition = getItemNutrition(itemId)
      if (nutrition) {
        state.removeItem(itemId, 1)
        useGameStore.setState({
          hunger: Math.min(100, state.hunger + nutrition.hunger),
          thirst: Math.min(100, state.thirst + nutrition.thirst),
        })
        if (itemId === 'poisonous_mushroom') {
          state.log('Ate a mushroom... something feels wrong!')
          setTimeout(() => {
            const s = useGameStore.getState()
            useGameStore.setState({ health: Math.max(0, s.health - 25), hunger: Math.max(0, s.hunger - 15) })
            useGameStore.getState().log('The mushroom was poisonous! -25 health')
          }, 3000)
        } else {
          state.log(`Ate ${itemId.replace(/_/g, ' ')} (+${nutrition.hunger} hunger)`)
        }
      }
    }
  }

  const handleDrop = (itemId: string) => {
    const state = useGameStore.getState()
    state.removeItem(itemId, 1)
    state.log(`Dropped ${itemId.replace(/_/g, ' ')}`)
  }

  const categoryLabels: Record<string, string> = {
    tools: '⚒️ Tools',
    food: '🍖 Food',
    materials: '📦 Materials',
    ammo: '🏹 Ammo',
    other: '📋 Other',
  }

  const categoryColors: Record<string, string> = {
    tools: 'border-blue-500/30',
    food: 'border-green-500/30',
    materials: 'border-yellow-500/30',
    ammo: 'border-orange-500/30',
    other: 'border-gray-500/30',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-stone-900/95 border border-stone-600/50 rounded-2xl p-6 w-[420px] max-h-[75vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎒</span>
            <h2 className="text-base font-semibold text-stone-200">Backpack</h2>
            <span className="text-xs text-stone-500 ml-2">{itemList.length} items</span>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-sm px-2 py-1 rounded hover:bg-stone-700/50 transition-colors">✕</button>
        </div>

        {itemList.length === 0 ? (
          <div className="text-stone-500 text-sm text-center py-12">Nothing in your pack yet.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, catItems]) => {
              if (catItems.length === 0) return null
              return (
                <div key={cat}>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">{categoryLabels[cat]}</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {catItems.map(([id, qty]) => {
                      const usable = USABLE_ITEMS[id]
                      const info = ITEM_INFO[id]
                      const icon = ITEM_ICONS[id] || '•'
                      return (
                        <div key={id} className={`flex items-center gap-3 rounded-lg border ${categoryColors[cat]} bg-stone-800/40 px-3 py-2 hover:bg-stone-800/70 transition-colors`}>
                          <span className="text-lg w-7 text-center shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-stone-200 capitalize">{id.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-stone-500">x{qty}</span>
                            </div>
                            {info && <div className="text-[10px] text-stone-500 mt-0.5">{info}</div>}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {usable && (
                              <button
                                onClick={() => handleUse(id)}
                                className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600/25 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-600/30 transition-colors"
                              >
                                {usable.label}
                              </button>
                            )}
                            <button
                              onClick={() => handleDrop(id)}
                              className="text-[11px] px-2 py-1 rounded-md bg-stone-700/40 text-stone-400 hover:bg-red-600/30 hover:text-red-400 border border-stone-600/30 transition-colors"
                            >
                              Drop
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-4 pt-3 border-t border-stone-700/50 text-center text-[10px] text-stone-600">
          B to close | F to quick-eat best food
        </div>
      </div>
    </div>
  )
}

function getItemNutrition(id: string): { hunger: number; thirst: number } | null {
  const map: Record<string, { hunger: number; thirst: number }> = {
    cooked_brook_trout: { hunger: 35, thirst: 5 },
    cooked_smallmouth_bass: { hunger: 35, thirst: 5 },
    cooked_yellow_perch: { hunger: 30, thirst: 5 },
    cooked_rabbit: { hunger: 30, thirst: 0 },
    cooked_venison: { hunger: 40, thirst: 0 },
    canned_food: { hunger: 25, thirst: 5 },
    blueberries: { hunger: 5, thirst: 3 },
    brook_trout: { hunger: 10, thirst: 0 },
    smallmouth_bass: { hunger: 10, thirst: 0 },
    yellow_perch: { hunger: 8, thirst: 0 },
    raw_rabbit: { hunger: 8, thirst: 0 },
    raw_venison: { hunger: 12, thirst: 0 },
    wild_mushroom: { hunger: 12, thirst: 2 },
    poisonous_mushroom: { hunger: 5, thirst: 0 },
    cattail_root: { hunger: 8, thirst: 2 },
  }
  return map[id] || null
}
