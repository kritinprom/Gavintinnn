const STORAGE_KEY_SOUND = 'centro_rama2_sound_enabled_v1';

let audioCtx: AudioContext | null = null;
let soundEnabledCache: boolean | null = null;

// C-major pentatonic acoustic pitches for calm, harmonious luxury UI feedback
const HARMONIC_CLICK_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
let clickStep = 0;

export function isSoundEnabled(): boolean {
  if (soundEnabledCache !== null) return soundEnabledCache;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    soundEnabledCache = saved === null ? true : saved === 'true';
  } catch {
    soundEnabledCache = true;
  }
  return soundEnabledCache;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabledCache = enabled;
  try {
    localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
  } catch {
    // ignore
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Plays a soft acoustic piano/celesta note for refined tactile UI feedback */
function playAcousticChime(
  freq: number,
  durationSec: number,
  peakGain = 0.048,
  delaySec = 0,
  endFreq?: number
): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + durationSec);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);

  // Subtle warm octave resonance
  const overtone = ctx.createOscillator();
  const overGain = ctx.createGain();
  overtone.type = 'triangle';
  overtone.frequency.setValueAtTime(freq * 2, now);
  if (endFreq && endFreq !== freq) {
    overtone.frequency.exponentialRampToValueAtTime(Math.max(80, endFreq * 2), now + durationSec);
  }

  overGain.gain.setValueAtTime(0.0001, now);
  overGain.gain.linearRampToValueAtTime(peakGain * 0.18, now + 0.006);
  overGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(0.13, durationSec * 0.7));

  overtone.connect(overGain);
  overGain.connect(ctx.destination);
  overtone.start(now);
  overtone.stop(now + Math.min(0.15, durationSec) + 0.02);
}

function playRawTone(
  startFreq: number,
  endFreq: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.05,
  delaySec = 0
): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  if (endFreq !== startFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + durationSec);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.009);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

/** Soft acoustic tap for general buttons */
export function playClickSound(): void {
  const note = HARMONIC_CLICK_NOTES[clickStep % HARMONIC_CLICK_NOTES.length];
  clickStep += 1;
  playAcousticChime(note, 0.085, 0.045, 0);
}

/** Crisp double-chime tick for filters, toggles, and mode switches */
export function playToggleSound(): void {
  playAcousticChime(783.99, 0.075, 0.042, 0);
  playAcousticChime(1567.98, 0.075, 0.018, 0.014);
}

/** Smooth C-major pentatonic arpeggio when switching main tabs */
export function playTabSwitchSound(): void {
  playAcousticChime(523.25, 0.09, 0.04, 0);
  playAcousticChime(659.25, 0.1, 0.044, 0.035);
  playAcousticChime(783.99, 0.13, 0.046, 0.07);
}

/** Rising harmonic chime when zooming in on the master plan */
export function playZoomInSound(): void {
  playAcousticChime(523.25, 0.09, 0.044, 0, 783.99);
}

/** Descending harmonic chime when zooming out or resetting camera */
export function playZoomOutSound(): void {
  playAcousticChime(783.99, 0.09, 0.044, 0, 523.25);
}

/** Crystal bell chime when selecting a house plot on the map */
export function playSelectPlotSound(): void {
  playAcousticChime(659.25, 0.08, 0.046, 0);
  playAcousticChime(1046.5, 0.15, 0.052, 0.04);
}

/** Warm 2-note chime when opening edit mode or data manager */
export function playEditOpenSound(): void {
  playAcousticChime(587.33, 0.085, 0.045, 0);
  playAcousticChime(880.0, 0.13, 0.05, 0.05);
}

/** Soft descending cadence when canceling or clearing filters */
export function playCancelSound(): void {
  playAcousticChime(659.25, 0.08, 0.042, 0);
  playAcousticChime(523.25, 0.11, 0.038, 0.045);
}

/** Bright C-major chord chime when saving, exporting, or importing */
export function playSuccessSound(): void {
  playAcousticChime(523.25, 0.1, 0.045, 0);
  playAcousticChime(659.25, 0.1, 0.048, 0.045);
  playAcousticChime(783.99, 0.12, 0.05, 0.09);
  playAcousticChime(1046.5, 0.2, 0.055, 0.135);
}

/** Bookmark chime (ascending) or gentle remove (descending) */
export function playBookmarkSound(added: boolean): void {
  if (added) {
    playAcousticChime(783.99, 0.09, 0.045, 0);
    playAcousticChime(1046.5, 0.15, 0.052, 0.05);
  } else {
    playAcousticChime(659.25, 0.085, 0.042, 0);
    playAcousticChime(440.0, 0.11, 0.038, 0.045);
  }
}

/** Playful kitty "meow~" chirp with subtle gold bell sparkle */
export function playMeowSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(640, now);
  osc.frequency.exponentialRampToValueAtTime(980, now + 0.07);
  osc.frequency.exponentialRampToValueAtTime(590, now + 0.24);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.075, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.28);

  playAcousticChime(1567.98, 0.1, 0.022, 0.12);
}

/** Low wooden chime when touching a locked sold plot */
export function playLockedSound(): void {
  playRawTone(261.63, 220.0, 0.08, 'triangle', 0.055, 0);
  playRawTone(196.0, 164.81, 0.1, 'triangle', 0.05, 0.07);
}

/** Ascending chord chime when passcode unlocks */
export function playUnlockSound(): void {
  playAcousticChime(523.25, 0.08, 0.046, 0);
  playAcousticChime(659.25, 0.09, 0.048, 0.045);
  playAcousticChime(783.99, 0.1, 0.05, 0.09);
  playAcousticChime(987.77, 0.11, 0.05, 0.135);
  playAcousticChime(1046.5, 0.22, 0.058, 0.18);
}

/** Distinct wrong-passcode descending alert */
export function playErrorSound(): void {
  playRawTone(329.63, 277.18, 0.09, 'triangle', 0.05, 0);
  playRawTone(246.94, 196.0, 0.14, 'triangle', 0.05, 0.09);
}

/** Smooth ascending glissando when entering the site */
export function playWarpEnterSound(): void {
  playAcousticChime(523.25, 0.12, 0.042, 0);
  playAcousticChime(659.25, 0.13, 0.045, 0.05);
  playAcousticChime(783.99, 0.15, 0.048, 0.1);
  playAcousticChime(1046.5, 0.22, 0.052, 0.15);
  playAcousticChime(1318.51, 0.25, 0.042, 0.2);
}
