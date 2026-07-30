'use client'

import { useGameStore } from '@/lib/game-store'

interface CrateUIProps {
  isOpen: boolean
  crateItems: Record<string, number>
  onClose: () => void
  onStoreItem: (itemId: string) => void
  onTakeItem: (itemId: string) => void
}

export function CrateUI({ isOpen, crateItems, onClose, onStoreItem, onTakeItem }: CrateUIProps) {
  const playerItems = useGameStore((s) => s.items)

  if (!isOpen) return null

  const playerList = Object.entries(playerItems).filter(([_, qty]) => qty > 0)
  const crateList = Object.entries(crateItems).filter(([_, qty]) => qty > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-stone-900/95 border border-stone-600/50 rounded-2xl p-5 w-[600px] max-h-[75vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-700/50">
          <h2 className="text-base font-semibold text-stone-200">📦 Storage Crate</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-sm px-2 py-1 rounded hover:bg-stone-700/50">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Player inventory — store items */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">🎒 Your Backpack</div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {playerList.length === 0 ? (
                <div className="text-stone-600 text-xs py-4 text-center">Empty</div>
              ) : (
                playerList.map(([id, qty]) => (
                  <div key={id} className="flex items-center justify-between rounded border border-stone-700/50 bg-stone-800/40 px-2 py-1.5">
                    <div>
                      <span className="text-xs text-stone-300 capitalize">{id.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-stone-500 ml-1.5">x{qty}</span>
                    </div>
                    <button
                      onClick={() => onStoreItem(id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-600/25 text-blue-400 hover:bg-blue-600/40 border border-blue-600/30"
                    >
                      Store →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Crate contents — take items */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">📦 In Crate</div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {crateList.length === 0 ? (
                <div className="text-stone-600 text-xs py-4 text-center">Empty</div>
              ) : (
                crateList.map(([id, qty]) => (
                  <div key={id} className="flex items-center justify-between rounded border border-stone-700/50 bg-stone-800/40 px-2 py-1.5">
                    <div>
                      <span className="text-xs text-stone-300 capitalize">{id.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-stone-500 ml-1.5">x{qty}</span>
                    </div>
                    <button
                      onClick={() => onTakeItem(id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-green-600/25 text-green-400 hover:bg-green-600/40 border border-green-600/30"
                    >
                      ← Take
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-stone-700/50 text-center text-[10px] text-stone-600">
          Click Store to move items in, Take to move items out
        </div>
      </div>
    </div>
  )
}
