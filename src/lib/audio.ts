"use client";

/* ═══════════════════════════════════════════════════════
   GAME BOY 8-BIT AUDIO SYNTHESIZER
   Authentic square wave sound effects for DMG-01 hardware
   ═══════════════════════════════════════════════════════ */
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playSquareTone(freq: number, startTime: number, duration: number, volume = 0.12) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, startTime);
    // Authentic snappy Game Boy volume envelope: instant attack, exponential decay
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    /* safely ignore audio errors if blocked by browser policy */
  }
}

export function playNoise(startTime: number, duration: number, volume = 0.2) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Use a lowpass filter to muffle the harsh static into a soft paper rustle
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, startTime); 
    filter.frequency.exponentialRampToValueAtTime(1800, startTime + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    // Paper flip envelope: quick sharp rustle (attack), sustain during flip, soft landing fade
    gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.1);
    gain.gain.linearRampToValueAtTime(volume * 0.6, startTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noiseSource.connect(filter).connect(gain).connect(ctx.destination);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);
  } catch {
    /* safely ignore audio errors */
  }
}

export const sfx = {
  // Snappy Game Boy menu cursor chirp (dual rapid square blip: 740Hz -> 988Hz)
  move: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSquareTone(740, now, 0.035, 0.14);
    playSquareTone(988, now + 0.025, 0.045, 0.15);
  },
  // Authentic Game Boy fanfare chime on selection (C5 -> E5 -> G5 -> C6)
  select: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSquareTone(523, now, 0.06, 0.13);
    playSquareTone(659, now + 0.05, 0.06, 0.14);
    playSquareTone(784, now + 0.10, 0.07, 0.15);
    playSquareTone(1046, now + 0.16, 0.22, 0.18);
  },
  // Authentic Game Boy 8-bit low buzz error sound
  error: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSquareTone(160, now, 0.08, 0.18);
    playSquareTone(125, now + 0.085, 0.14, 0.18);
  },
  // Soft hover click for standard UI buttons
  hover: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSquareTone(880, now, 0.02, 0.08);
  },
  // Soft pop sound for UI interactions
  pop: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSquareTone(1200, now, 0.04, 0.1);
  },
  // Resilient click sound handler supporting both sfx.click() and sfx.click.play()
  click: Object.assign(
    () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      playSquareTone(523, now, 0.04, 0.12);
    },
    {
      play: () => {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        playSquareTone(523, now, 0.04, 0.12);
      }
    }
  ),
  // Procedurally generated realistic paper flip sound using white noise
  paper: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playNoise(now, 0.45, 0.8);
  }
};
