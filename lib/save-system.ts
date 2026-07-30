import { useGameStore, GameState } from './game-store'

const SAVE_KEY = 'northshore_save'

// Fields to save
interface SaveData {
  health: number
  hunger: number
  thirst: number
  bodyTemp: number
  stamina: number
  fatigue: number
  hour: number
  minute: number
  day: number
  season: GameState['season']
  weather: GameState['weather']
  airTemp: number
  items: Record<string, number>
  playerPos: [number, number, number]
  playerRotation: number
  isDead: boolean
}

export function saveGame(): boolean {
  try {
    const state = useGameStore.getState()
    const data: SaveData = {
      health: state.health,
      hunger: state.hunger,
      thirst: state.thirst,
      bodyTemp: state.bodyTemp,
      stamina: state.stamina,
      fatigue: state.fatigue,
      hour: state.hour,
      minute: state.minute,
      day: state.day,
      season: state.season,
      weather: state.weather,
      airTemp: state.airTemp,
      items: state.items,
      playerPos: state.playerPos,
      playerRotation: state.playerRotation,
      isDead: state.isDead,
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    const data: SaveData = JSON.parse(raw)
    useGameStore.setState({
      health: data.health,
      hunger: data.hunger,
      thirst: data.thirst,
      bodyTemp: data.bodyTemp,
      stamina: data.stamina,
      fatigue: data.fatigue,
      hour: data.hour,
      minute: data.minute,
      day: data.day,
      season: data.season,
      weather: data.weather,
      airTemp: data.airTemp,
      items: data.items,
      playerPos: data.playerPos,
      playerRotation: data.playerRotation,
      isDead: data.isDead,
    })
    return true
  } catch {
    return false
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY)
}
