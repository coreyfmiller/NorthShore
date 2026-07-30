import { create } from 'zustand'

export interface GameState {
  health: number
  hunger: number
  thirst: number
  bodyTemp: number
  stamina: number
  fatigue: number

  hour: number
  minute: number
  day: number
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  timeSpeed: number

  weather: 'clear' | 'cloudy' | 'rain' | 'fog' | 'snow' | 'blizzard'
  airTemp: number

  items: Record<string, number>
  playerPos: [number, number, number]
  playerRotation: number

  isDead: boolean
  deathCause: string
  isFishing: boolean
  nearWater: boolean
  nearFire: boolean
  nearShelter: boolean
  playerAction: 'idle' | 'chopping' | 'fishing' | 'shooting'
  openCrate: { items: Record<string, number>; index: number } | null

  logs: string[]

  // Actions
  tick: (delta: number) => void
  eat: () => void
  drink: () => void
  addItem: (id: string, qty: number) => void
  removeItem: (id: string, qty: number) => boolean
  hasItem: (id: string, qty?: number) => boolean
  craftCampfire: () => [number, number, number] | null
  craftShelter: () => [number, number, number] | null
  startFishing: () => void
  setNearWater: (v: boolean) => void
  setNearFire: (v: boolean) => void
  setNearShelter: (v: boolean) => void
  setPlayerPos: (pos: [number, number, number]) => void
  setPlayerRotation: (rot: number) => void
  speedUpTime: () => void
  slowDownTime: () => void
  log: (msg: string) => void
}

const SEASON_ORDER: GameState['season'][] = ['spring', 'summer', 'autumn', 'winter']
const SEASON_TEMPS: Record<string, { low: number; high: number }> = {
  spring: { low: -2, high: 16 },
  summer: { low: 12, high: 32 },
  autumn: { low: 0, high: 18 },
  winter: { low: -28, high: -2 },
}

const EDIBLES: Record<string, { hunger: number; thirst: number }> = {
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

const FISH_TYPES = ['brook_trout', 'smallmouth_bass', 'yellow_perch']

export const useGameStore = create<GameState>((set, get) => ({
  health: 100,
  hunger: 100,
  thirst: 100,
  bodyTemp: 37,
  stamina: 100,
  fatigue: 0,

  hour: 12,
  minute: 0,
  day: 1,
  season: 'summer',
  timeSpeed: 1,

  weather: 'clear',
  airTemp: 20,

  items: { axe: 1, knife: 1, lighter: 1, fishing_line: 1, canned_food: 2 },
  playerPos: [0, 0, 0],
  playerRotation: 0,

  isDead: false,
  deathCause: '',
  isFishing: false,
  nearWater: false,
  nearFire: false,
  nearShelter: false,
  playerAction: 'idle',
  openCrate: null,

  logs: ['Welcome to North Shore. Survive.'],

  tick: (delta: number) => {
    const state = get()
    if (state.isDead || state.timeSpeed === 0) return

    // Day (6am-8pm) takes ~30 real minutes, night (8pm-6am) takes ~5 real minutes
    const isNight = state.hour >= 20 || state.hour < 6
    const effectiveSpeed = isNight ? 2.0 : 0.47

    const minutesElapsed = delta * effectiveSpeed * state.timeSpeed
    let { minute, hour, day, season } = state
    minute += minutesElapsed
    let hoursPassed = 0

    while (minute >= 60) {
      minute -= 60
      hour++
      hoursPassed++
      if (hour >= 24) {
        hour = 0
        day++
        if (day % 28 === 0) {
          const idx = SEASON_ORDER.indexOf(season)
          season = SEASON_ORDER[(idx + 1) % 4]
        }
      }
    }

    if (hoursPassed === 0) {
      set({ minute })
      return
    }

    let { health, hunger, thirst, bodyTemp, fatigue, stamina, airTemp } = state
    hunger = Math.max(0, hunger - 2.5 * hoursPassed)
    thirst = Math.max(0, thirst - 3.5 * hoursPassed)
    fatigue = Math.min(100, fatigue + 4 * hoursPassed)

    const seasonRange = SEASON_TEMPS[season]
    airTemp = (seasonRange.low + seasonRange.high) / 2 + (Math.random() - 0.5) * 8

    // Random weather changes each hour
    let { weather } = state
    if (Math.random() < 0.3) {
      if (season === 'winter') {
        const options: GameState['weather'][] = ['clear', 'cloudy', 'snow', 'snow', 'blizzard', 'fog']
        weather = options[Math.floor(Math.random() * options.length)]
      } else if (season === 'autumn') {
        const options: GameState['weather'][] = ['clear', 'cloudy', 'rain', 'rain', 'fog', 'fog']
        weather = options[Math.floor(Math.random() * options.length)]
      } else {
        const options: GameState['weather'][] = ['clear', 'clear', 'clear', 'cloudy', 'rain', 'fog']
        weather = options[Math.floor(Math.random() * options.length)]
      }
    }

    if (airTemp < 10) {
      bodyTemp = Math.max(airTemp, bodyTemp - (10 - airTemp) * 0.15 * hoursPassed)
    } else {
      bodyTemp += (37 - bodyTemp) * 0.3 * hoursPassed
    }

    // Weather effects on body (sheltered = no weather penalty)
    const hasCoat = (state.items.leather_coat || 0) > 0
    const coldMultiplier = hasCoat ? 0.4 : 1.0
    if (!state.nearShelter) {
      if (weather === 'rain') {
        bodyTemp -= 1.5 * coldMultiplier * hoursPassed
        thirst = Math.min(100, thirst + 2 * hoursPassed)
      } else if (weather === 'snow' || weather === 'blizzard') {
        bodyTemp -= (weather === 'blizzard' ? 4 : 2) * coldMultiplier * hoursPassed
      }
    }

    // Fire warmth — warms player when near a campfire
    if (state.nearFire) {
      bodyTemp += (37 - bodyTemp) * 0.5 * hoursPassed
      bodyTemp = Math.min(37, bodyTemp)
    }

    if (hunger <= 0) health -= 5 * hoursPassed
    if (thirst <= 0) health -= 8 * hoursPassed
    if (bodyTemp < 35) health -= 3 * hoursPassed
    if (bodyTemp < 32) health -= 8 * hoursPassed

    // Health regeneration — slowly heal when well-fed, hydrated, and warm
    if (hunger > 50 && thirst > 50 && bodyTemp > 36 && health < 100) {
      health += 3 * hoursPassed
    } else if (hunger > 25 && thirst > 25 && bodyTemp > 35 && health < 100) {
      health += 1 * hoursPassed
    }
    health = Math.min(100, health)

    let isDead = false
    let deathCause = ''
    if (health <= 0) {
      isDead = true
      if (bodyTemp < 35) deathCause = 'hypothermia'
      else if (hunger <= 0) deathCause = 'starvation'
      else if (thirst <= 0) deathCause = 'dehydration'
      else deathCause = 'unknown'
    }

    set({ minute, hour, day, season, weather, health: Math.max(0, health), hunger, thirst, bodyTemp, fatigue, stamina, airTemp, isDead, deathCause })
  },

  eat: () => {
    const state = get()
    for (const [id, nutrition] of Object.entries(EDIBLES)) {
      if ((state.items[id] || 0) > 0) {
        const newItems = { ...state.items }
        newItems[id]--
        if (newItems[id] <= 0) delete newItems[id]
        set({
          items: newItems,
          hunger: Math.min(100, state.hunger + nutrition.hunger),
          thirst: Math.min(100, state.thirst + nutrition.thirst),
        })
        // Poison effect
        if (id === 'poisonous_mushroom') {
          get().log('Ate a mushroom... something feels wrong!')
          setTimeout(() => {
            const s = get()
            set({ health: Math.max(0, s.health - 25), hunger: Math.max(0, s.hunger - 15) })
            get().log('The mushroom was poisonous! -25 health')
          }, 3000)
        } else {
          get().log(`Ate ${id.replace(/_/g, ' ')} (+${nutrition.hunger} hunger)`)
        }
        return
      }
    }
    get().log('No food in inventory.')
  },

  drink: () => {
    const state = get()
    if (!state.nearWater) {
      get().log('Need to be near water to drink.')
      return
    }
    set({ thirst: Math.min(100, state.thirst + 25) })
    get().log('Drank from the water. (+25 thirst)')
  },

  addItem: (id, qty) => {
    set((s) => ({ items: { ...s.items, [id]: (s.items[id] || 0) + qty } }))
    get().log(`+${qty} ${id.replace(/_/g, ' ')}`)
  },

  removeItem: (id, qty) => {
    const state = get()
    if ((state.items[id] || 0) < qty) return false
    const newItems = { ...state.items }
    newItems[id] -= qty
    if (newItems[id] <= 0) delete newItems[id]
    set({ items: newItems })
    return true
  },

  hasItem: (id, qty = 1) => (get().items[id] || 0) >= qty,

  craftCampfire: () => {
    const state = get()
    const branches = state.items.branches || 0
    if (branches < 5) {
      get().log(`Need 5 branches for campfire (have ${branches})`)
      return null
    }
    const newItems = { ...state.items }
    newItems.branches -= 5
    if (newItems.branches <= 0) delete newItems.branches
    set({ items: newItems })
    get().log('Built a campfire!')
    // Return player position offset for placement
    const pos = state.playerPos
    const angle = state.playerRotation
    return [pos[0] + Math.sin(angle) * 3, 0, pos[2] + Math.cos(angle) * 3] as [number, number, number]
  },

  craftShelter: () => {
    const state = get()
    const branches = state.items.branches || 0
    if (branches < 10) {
      get().log(`Need 10 branches for shelter (have ${branches})`)
      return null
    }
    const newItems = { ...state.items }
    newItems.branches -= 10
    if (newItems.branches <= 0) delete newItems.branches
    set({ items: newItems })
    get().log('Built a lean-to shelter!')
    const pos = state.playerPos
    const angle = state.playerRotation
    return [pos[0] + Math.sin(angle) * 4, 0, pos[2] + Math.cos(angle) * 4] as [number, number, number]
  },

  startFishing: () => {
    const state = get()
    if (!state.nearWater) {
      get().log('Need to be near water to fish.')
      return
    }
    if (!state.hasItem('fishing_line')) {
      get().log('Need a fishing line.')
      return
    }
    set({ isFishing: true, playerAction: 'fishing' })
    get().log('Casting line...')

    // Simulate fishing delay
    setTimeout(() => {
      const s = get()
      if (!s.isFishing) return
      set({ isFishing: false, playerAction: 'idle' })

      if (Math.random() < 0.7) {
        const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)]
        get().addItem(fish, 1)
        get().log(`Caught a ${fish.replace(/_/g, ' ')}!`)
      } else {
        get().log('Nothing biting. Try again.')
      }
    }, 3000 + Math.random() * 4000)
  },

  setNearWater: (v) => set({ nearWater: v }),
  setNearFire: (v) => set({ nearFire: v }),
  setNearShelter: (v) => set({ nearShelter: v }),
  setPlayerPos: (pos) => set({ playerPos: pos }),
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  speedUpTime: () => set((s) => ({ timeSpeed: Math.min((s.timeSpeed || 1) * 3, 120) })),
  slowDownTime: () => set((s) => ({ timeSpeed: Math.max(s.timeSpeed / 3, 0) })),

  log: (msg: string) => set((s) => ({ logs: [...s.logs.slice(-20), msg] })),
}))
