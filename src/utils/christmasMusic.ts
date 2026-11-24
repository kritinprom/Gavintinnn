const STORAGE_KEY_MUSIC = 'centro_rama2_ambient_music_v1';
const STORAGE_KEY_TRACK = 'centro_rama2_ambient_track_v1';

interface MusicNote {
  freq: number; // 0 = rest
  beats: number;
  bassFreq?: number;
  chordFreq?: number;
  bellSparkle?: boolean;
}

export interface LuxuryTrack {
  id: string;
  title: string;
  thaiMood: string;
  beatMs: number;
  waveform: OscillatorType;
  notes: MusicNote[];
}

export type ChristmasTrack = LuxuryTrack;

// Calm Luxury Residence Ambient Piano & Acoustic Lounge Arrangements
export const LUXURY_AMBIENT_PLAYLIST: LuxuryTrack[] = [
  {
    id: 'evening-residence',
    title: 'Evening Residence',
    thaiMood: 'เปียโนอะคูสติก นุ่มนวล หรูหรา',
    beatMs: 480,
    waveform: 'sine',
    notes: [
      { freq: 523.25, beats: 1, bassFreq: 130.81, chordFreq: 261.63, bellSparkle: true },
      { freq: 659.25, beats: 1 },
      { freq: 783.99, beats: 1.5, bassFreq: 196.0 },
      { freq: 880.0, beats: 0.5 },
      { freq: 1046.5, beats: 2, bassFreq: 130.81, chordFreq: 329.63, bellSparkle: true },
      { freq: 880.0, beats: 1 },
      { freq: 783.99, beats: 1 },
      { freq: 659.25, beats: 1.5, bassFreq: 174.61 },
      { freq: 587.33, beats: 0.5 },
      { freq: 523.25, beats: 2, bassFreq: 130.81, chordFreq: 261.63 },
      { freq: 587.33, beats: 1, bassFreq: 196.0 },
      { freq: 659.25, beats: 1 },
      { freq: 783.99, beats: 1, bassFreq: 130.81, bellSparkle: true },
      { freq: 659.25, beats: 1 },
      { freq: 587.33, beats: 1.5, bassFreq: 196.0 },
      { freq: 440.0, beats: 0.5 },
      { freq: 523.25, beats: 3, bassFreq: 130.81, chordFreq: 329.63, bellSparkle: true },
      { freq: 0, beats: 1.5 },
    ],
  },
  {
    id: 'champagne-lounge',
    title: 'Champagne Lounge',
    thaiMood: 'ผ่อนคลาย ละมุน ระดับ Private Club',
    beatMs: 460,
    waveform: 'sine',
    notes: [
      { freq: 392.0, beats: 1, bassFreq: 130.81, chordFreq: 261.63 },
      { freq: 523.25, beats: 1.5, bellSparkle: true },
      { freq: 659.25, beats: 0.5 },
      { freq: 587.33, beats: 1.5, bassFreq: 196.0 },
      { freq: 523.25, beats: 0.5 },
      { freq: 440.0, beats: 2, bassFreq: 174.61, chordFreq: 261.63 },
      { freq: 392.0, beats: 1 },
      { freq: 523.25, beats: 1, bassFreq: 130.81 },
      { freq: 659.25, beats: 1.5, bellSparkle: true },
      { freq: 783.99, beats: 0.5 },
      { freq: 880.0, beats: 1.5, bassFreq: 174.61 },
      { freq: 783.99, beats: 0.5 },
      { freq: 659.25, beats: 2, bassFreq: 130.81, chordFreq: 329.63 },
      { freq: 587.33, beats: 1, bassFreq: 196.0 },
      { freq: 523.25, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 523.25, beats: 3, bassFreq: 130.81, bellSparkle: true },
      { freq: 0, beats: 1.5 },
    ],
  },
  {
    id: 'courtyard-nocturne',
    title: 'Courtyard Nocturne',
    thaiMood: 'บรรยากาศสวนส่วนตัว ยามเย็น',
    beatMs: 490,
    waveform: 'sine',
    notes: [
      { freq: 440.0, beats: 1, bassFreq: 174.61, chordFreq: 261.63 },
      { freq: 523.25, beats: 1 },
      { freq: 587.33, beats: 1, bassFreq: 196.0 },
      { freq: 659.25, beats: 1.5, bellSparkle: true },
      { freq: 783.99, beats: 0.5 },
      { freq: 659.25, beats: 1, bassFreq: 130.81 },
      { freq: 587.33, beats: 1 },
      { freq: 523.25, beats: 2, bassFreq: 130.81, chordFreq: 329.63 },
      { freq: 783.99, beats: 1, bassFreq: 196.0, bellSparkle: true },
      { freq: 880.0, beats: 1 },
      { freq: 783.99, beats: 1 },
      { freq: 659.25, beats: 1, bassFreq: 130.81 },
      { freq: 587.33, beats: 1.5, bassFreq: 196.0 },
      { freq: 523.25, beats: 0.5 },
      { freq: 440.0, beats: 1, bassFreq: 174.61 },
      { freq: 523.25, beats: 2.5, bassFreq: 130.81, chordFreq: 329.63, bellSparkle: true },
      { freq: 0, beats: 1.5 },
    ],
  },
  {
    id: 'obsidian-salon',
    title: 'Obsidian Salon',
    thaiMood: 'สง่างาม สุขุม มีระดับ',
    beatMs: 500,
    waveform: 'sine',
    notes: [
      { freq: 392.0, beats: 1.5, bassFreq: 130.81, chordFreq: 261.63 },
      { freq: 440.0, beats: 0.5 },
      { freq: 392.0, beats: 1 },
      { freq: 329.63, beats: 3, bassFreq: 130.81, chordFreq: 261.63 },
      { freq: 392.0, beats: 1.5, bassFreq: 130.81 },
      { freq: 440.0, beats: 0.5 },
      { freq: 392.0, beats: 1 },
      { freq: 329.63, beats: 3, bassFreq: 130.81, chordFreq: 261.63 },
      { freq: 587.33, beats: 2, bassFreq: 196.0, chordFreq: 293.66, bellSparkle: true },
      { freq: 587.33, beats: 1 },
      { freq: 493.88, beats: 3, bassFreq: 196.0 },
      { freq: 523.25, beats: 2, bassFreq: 130.81, chordFreq: 329.63, bellSparkle: true },
      { freq: 523.25, beats: 1 },
      { freq: 392.0, beats: 3, bassFreq: 130.81 },
      { freq: 0, beats: 1.5 },
    ],
  },
];

let musicAudioCtx: AudioContext | null = null;
let musicMasterGain: GainNode | null = null;
let musicEnabledCache: boolean | null = null;
let isPlaying = false;

function loadTrackIndex(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRACK);
    const parsed = saved ? Number(saved) : 0;
    return Number.isFinite(parsed) && parsed >= 0 && parsed < LUXURY_AMBIENT_PLAYLIST.length
      ? parsed
      : 0;
  } catch {
    return 0;
  }
}

let trackIndex = loadTrackIndex();
let noteIndex = 0;
let schedulerTimer: number | null = null;
const trackListeners = new Set<(track: LuxuryTrack) => void>();

function notifyTrackListeners(): void {
  const current = LUXURY_AMBIENT_PLAYLIST[trackIndex % LUXURY_AMBIENT_PLAYLIST.length];
  trackListeners.forEach((cb) => cb(current));
}

export function getCurrentChristmasTrack(): LuxuryTrack {
  return LUXURY_AMBIENT_PLAYLIST[trackIndex % LUXURY_AMBIENT_PLAYLIST.length];
}

export function subscribeChristmasTrack(cb: (track: LuxuryTrack) => void): () => void {
  trackListeners.add(cb);
  return () => {
    trackListeners.delete(cb);
  };
}

export function nextChristmasTrack(): LuxuryTrack {
  trackIndex = (trackIndex + 1) % LUXURY_AMBIENT_PLAYLIST.length;
  noteIndex = 0;
  try {
    localStorage.setItem(STORAGE_KEY_TRACK, String(trackIndex));
  } catch {
    // ignore
  }
  const track = getCurrentChristmasTrack();
  notifyTrackListeners();

  if (isPlaying && isMusicEnabled()) {
    if (schedulerTimer !== null) {
      window.clearTimeout(schedulerTimer);
      schedulerTimer = null;
    }
    scheduleNextNote();
  }
  return track;
}

export function isMusicEnabled(): boolean {
  if (musicEnabledCache !== null) return musicEnabledCache;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MUSIC);
    musicEnabledCache = saved === null ? true : saved === 'true';
  } catch {
    musicEnabledCache = true;
  }
  return musicEnabledCache;
}

export function setMusicEnabledPref(enabled: boolean): void {
  musicEnabledCache = enabled;
  try {
    localStorage.setItem(STORAGE_KEY_MUSIC, String(enabled));
  } catch {
    // ignore
  }
}

function ensureMusicContext(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!musicAudioCtx) {
    try {
      musicAudioCtx = new Ctx();
      musicMasterGain = musicAudioCtx.createGain();
      musicMasterGain.gain.value = 0.042;
      musicMasterGain.connect(musicAudioCtx.destination);
    } catch {
      return null;
    }
  }

  if (musicAudioCtx.state === 'suspended') {
    musicAudioCtx.resume().catch(() => {});
  }

  if (!musicMasterGain) return null;
  return { ctx: musicAudioCtx, master: musicMasterGain };
}

function triggerAmbientNote(
  note: MusicNote,
  durationSec: number,
  waveform: OscillatorType
): void {
  const audio = ensureMusicContext();
  if (!audio) return;
  const { ctx, master } = audio;
  const now = ctx.currentTime;

  if (note.freq > 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveform;
    osc.frequency.setValueAtTime(note.freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.48, now + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + Math.max(0.35, durationSec * 1.15));

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + Math.max(0.42, durationSec * 1.25));

    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(note.freq * 2, now);

    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.linearRampToValueAtTime(note.bellSparkle ? 0.14 : 0.08, now + 0.015);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, now + Math.min(0.45, durationSec * 0.72));

    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now);
    shimmer.stop(now + 0.52);

    if (note.bellSparkle) {
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(note.freq * 3, now);
      bellGain.gain.setValueAtTime(0.0001, now);
      bellGain.gain.linearRampToValueAtTime(0.036, now + 0.008);
      bellGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.2);
      bell.connect(bellGain);
      bellGain.connect(master);
      bell.start(now);
      bell.stop(now + 0.25);
    }
  }

  if (note.bassFreq && note.bassFreq > 0) {
    const pad = ctx.createOscillator();
    const padFilter = ctx.createBiquadFilter();
    const padGain = ctx.createGain();

    pad.type = 'triangle';
    pad.frequency.setValueAtTime(note.bassFreq, now);

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(340, now);

    const padLen = Math.max(0.9, durationSec * 2.2);
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(0.24, now + 0.14);
    padGain.gain.exponentialRampToValueAtTime(0.0008, now + padLen);

    pad.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(master);
    pad.start(now);
    pad.stop(now + padLen + 0.05);
  }

  if (note.chordFreq && note.chordFreq > 0) {
    const chordOsc = ctx.createOscillator();
    const chordGain = ctx.createGain();
    chordOsc.type = 'sine';
    chordOsc.frequency.setValueAtTime(note.chordFreq, now);

    const chordLen = Math.max(0.75, durationSec * 1.8);
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(0.13, now + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.0006, now + chordLen);

    chordOsc.connect(chordGain);
    chordGain.connect(master);
    chordOsc.start(now);
    chordOsc.stop(now + chordLen + 0.04);
  }
}

function scheduleNextNote(): void {
  if (!isPlaying || !isMusicEnabled()) return;
  if (typeof document !== 'undefined' && document.hidden) {
    schedulerTimer = window.setTimeout(scheduleNextNote, 600);
    return;
  }

  const currentTrack = LUXURY_AMBIENT_PLAYLIST[trackIndex % LUXURY_AMBIENT_PLAYLIST.length];
  const note = currentTrack.notes[noteIndex % currentTrack.notes.length];
  const durationMs = note.beats * currentTrack.beatMs;

  triggerAmbientNote(note, durationMs / 1000, currentTrack.waveform);

  noteIndex += 1;
  if (noteIndex >= currentTrack.notes.length) {
    noteIndex = 0;
    trackIndex = (trackIndex + 1) % LUXURY_AMBIENT_PLAYLIST.length;
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, String(trackIndex));
    } catch {
      // ignore
    }
    notifyTrackListeners();
  }

  schedulerTimer = window.setTimeout(scheduleNextNote, durationMs);
}

export function startChristmasMusic(): void {
  if (!isMusicEnabled()) return;
  const audio = ensureMusicContext();
  if (!audio) return;

  if (audio.master) {
    audio.master.gain.setTargetAtTime(0.042, audio.ctx.currentTime, 0.2);
  }

  if (isPlaying) return;
  isPlaying = true;
  notifyTrackListeners();
  scheduleNextNote();
}

export function stopChristmasMusic(): void {
  isPlaying = false;
  if (schedulerTimer !== null) {
    window.clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  if (musicAudioCtx && musicMasterGain) {
    musicMasterGain.gain.setTargetAtTime(0.0001, musicAudioCtx.currentTime, 0.12);
  }
}

export function isChristmasMusicPlaying(): boolean {
  return isPlaying && isMusicEnabled();
}
