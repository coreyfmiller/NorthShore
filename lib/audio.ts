// Procedural audio using Web Audio API — no files needed

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Short noise burst — footstep crunch
export function playFootstep() {
  const ctx = getCtx()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3))
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 800
  const gain = ctx.createGain()
  gain.gain.value = 0.08
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start()
}

// Sharp attack — chop/hit sound
export function playChop() {
  const ctx = getCtx()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.8
      + Math.sin(t * 200) * Math.exp(-t * 20) * 0.3
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = 0.15
  source.connect(gain).connect(ctx.destination)
  source.start()
}

// Water splash
export function playSplash() {
  const ctx = getCtx()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.5
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1500
  const gain = ctx.createGain()
  gain.gain.value = 0.1
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start()
}

// Pickup/collect sound
export function playPickup() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}

// Eat/consume sound
export function playEat() {
  const ctx = getCtx()
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate
    data[i] = Math.sin(t * 150 + Math.sin(t * 40) * 3) * Math.exp(-t * 10) * 0.3
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = 0.12
  source.connect(gain).connect(ctx.destination)
  source.start()
}

// Craft complete sound
export function playCraft() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.setValueAtTime(450, ctx.currentTime + 0.1)
  osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

// Ambient bird chirp — random pitch tweet
export function playBirdChirp() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const baseFreq = 2000 + Math.random() * 2000
  osc.type = 'sine'
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0.03, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.12)
}

// Start ambient bird loop — chirps randomly every few seconds
let birdInterval: ReturnType<typeof setInterval> | null = null
export function startAmbientBirds() {
  if (birdInterval) return
  birdInterval = setInterval(() => {
    if (Math.random() < 0.3) playBirdChirp()
  }, 2000 + Math.random() * 3000)
}

export function stopAmbientBirds() {
  if (birdInterval) {
    clearInterval(birdInterval)
    birdInterval = null
  }
}
