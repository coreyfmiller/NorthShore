'use client'

import { useGameStore } from '@/lib/game-store'

interface Recipe {
  id: string
  name: string
  requires: Record<string, number>
  description: string
}

const RECIPES: Recipe[] = [
  { id: 'campfire', name: 'Campfire', requires: { branches: 5 }, description: 'Provides warmth. Cook food.' },
  { id: 'shelter', name: 'Lean-to Shelter', requires: { branches: 10 }, description: 'Sleep to recover. Rain protection.' },
  { id: 'cabin', name: 'A-Frame Cabin', requires: { firewood: 8, rope: 2 }, description: 'Full weather protection. Sleep inside.' },
  { id: 'dock', name: 'Fishing Dock', requires: { firewood: 6, rope: 2 }, description: 'Better fishing spot. Place near water.' },
  { id: 'rope', name: 'Rope', requires: { branches: 3 }, description: 'Useful for advanced crafting.' },
  { id: 'torch', name: 'Torch', requires: { branches: 1, tinder: 2 }, description: 'Portable light source.' },
  { id: 'rabbit_trap', name: 'Rabbit Trap', requires: { branches: 4, rope: 1 }, description: 'Set on ground. Catches rabbits passively.' },
  { id: 'bow', name: 'Bow', requires: { branches: 3, rope: 1 }, description: 'Hunt at range. Needs arrows.' },
  { id: 'arrows', name: 'Arrows (x5)', requires: { branches: 2, rocks: 1 }, description: 'Ammo for the bow.' },
  { id: 'leather', name: 'Leather', requires: { hide: 1 }, description: 'Tanned hide. Used for armor.' },
  { id: 'leather_coat', name: 'Leather Coat', requires: { leather: 3, rope: 1 }, description: 'Keeps you warmer in cold.' },
  { id: 'drying_rack', name: 'Drying Rack', requires: { branches: 6, rope: 1 }, description: 'Preserve fish and meat.' },
  { id: 'storage_crate', name: 'Storage Crate', requires: { firewood: 4 }, description: 'Store extra items.' },
]

interface CraftMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipeId: string) => void
}

export function CraftMenu({ isOpen, onClose, onSelect }: CraftMenuProps) {
  const items = useGameStore((s) => s.items)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-5 w-80 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Craft</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">ESC</button>
        </div>

        <div className="space-y-2">
          {RECIPES.map((recipe) => {
            const canCraft = Object.entries(recipe.requires).every(
              ([item, qty]) => (items[item] || 0) >= qty
            )

            return (
              <button
                key={recipe.id}
                onClick={() => canCraft && onSelect(recipe.id)}
                disabled={!canCraft}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  canCraft
                    ? 'border-gray-600 hover:border-green-500/50 hover:bg-green-500/5 cursor-pointer'
                    : 'border-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{recipe.name}</span>
                  {canCraft && <span className="text-[10px] text-green-400">Ready</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{recipe.description}</p>
                <div className="flex gap-2 mt-2">
                  {Object.entries(recipe.requires).map(([item, qty]) => {
                    const have = items[item] || 0
                    const enough = have >= qty
                    return (
                      <span
                        key={item}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          enough ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {item.replace(/_/g, ' ')} {have}/{qty}
                      </span>
                    )
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
