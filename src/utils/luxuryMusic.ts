export type LuxuryCategory =
  | 'all'
  | 'lounge-piano'
  | 'botanical-harp'
  | 'hotel-jazz'
  | 'chamber-calm';

export type InstrumentVoice =
  | 'felt-piano'
  | 'harp-pad'
  | 'rhodes-lounge'
  | 'velvet-strings';

export interface LuxuryTrack {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  category: Exclude<LuxuryCategory, 'all'>;
  voice: InstrumentVoice;
  bpm: number;
  durationSec: number;
  chords: number[][]; // 4 rich chords in MIDI note numbers
  melodyOffsets: number[]; // indices into active chord + upper octave
  moodNote: string;
}

export const LUXURY_CATEGORY_TABS: { id: LuxuryCategory; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด (20)' },
  { id: 'lounge-piano', label: 'Grand Piano (5)' },
  { id: 'botanical-harp', label: 'Harp & Garden (5)' },
  { id: 'hotel-jazz', label: 'Five-Star Lounge (5)' },
  { id: 'chamber-calm', label: 'Velvet Strings (5)' },
];

export const LUXURY_PLAYLIST: LuxuryTrack[] = [
  // 1. Grand Lounge Piano (5)
  {
    id: 'lux-01',
    number: 1,
    title: 'Champagne Morning Prelude',
    subtitle: 'Felt Grand Piano · C Maj9',
    category: 'lounge-piano',
    voice: 'felt-piano',
    bpm: 66,
    durationSec: 120,
    chords: [
      [48, 55, 59, 62, 64], // Cmaj9
      [45, 52, 55, 59, 60], // Am9
      [41, 48, 52, 55, 57], // Fmaj9
      [43, 50, 53, 57, 59], // G13sus4
    ],
    melodyOffsets: [2, 3, 4, 2, 3, 4, 5, 3],
    moodNote: 'เปียโนนุ่มละมุนยามเช้า โปร่งสบายระดับแกลเลอรี',
  },
  {
    id: 'lux-02',
    number: 2,
    title: 'Velvet Foyer Nocturne',
    subtitle: 'Warm Acoustic Piano · Eb Maj7',
    category: 'lounge-piano',
    voice: 'felt-piano',
    bpm: 60,
    durationSec: 135,
    chords: [
      [51, 58, 62, 65, 67], // Ebmaj9
      [48, 55, 58, 62, 63], // Cm9
      [44, 51, 55, 58, 60], // Abmaj9
      [46, 53, 56, 60, 62], // Bb9sus4
    ],
    melodyOffsets: [4, 3, 2, 4, 5, 3, 2, 1],
    moodNote: 'โทนอบอุ่นสุขุม เหมาะกับโถงต้อนรับสไตล์โมเดิร์นลักชัวรี',
  },
  {
    id: 'lux-03',
    number: 3,
    title: 'Sunlit Marble Courtyard',
    subtitle: 'Bright Lounge Piano · G Maj9',
    category: 'lounge-piano',
    voice: 'felt-piano',
    bpm: 72,
    durationSec: 115,
    chords: [
      [43, 50, 54, 57, 59], // Gmaj9
      [40, 47, 50, 54, 55], // Em9
      [48, 55, 59, 62, 64], // Cmaj9
      [45, 52, 55, 59, 62], // Am11
    ],
    melodyOffsets: [1, 2, 4, 3, 2, 4, 5, 4],
    moodNote: 'จังหวะพลิ้วไหวสดใส สะท้อนแสงแดดอ่อนบนหินอ่อน',
  },
  {
    id: 'lux-04',
    number: 4,
    title: 'Golden Hour Reverie',
    subtitle: 'Lyrical Felt Piano · F Maj9',
    category: 'lounge-piano',
    voice: 'felt-piano',
    bpm: 62,
    durationSec: 130,
    chords: [
      [41, 48, 52, 55, 57], // Fmaj9
      [45, 52, 55, 59, 60], // Am9
      [46, 53, 57, 60, 62], // Bbmaj9
      [48, 55, 58, 62, 65], // C11
    ],
    melodyOffsets: [3, 4, 5, 3, 2, 3, 4, 2],
    moodNote: 'บรรยากาศช่วงเวลาสีทองยามเย็น ละเมียดละไมและผ่อนคลาย',
  },
  {
    id: 'lux-05',
    number: 5,
    title: 'Midnight Penthouse Waltz',
    subtitle: 'Slow Ballad Keys · D Min9',
    category: 'lounge-piano',
    voice: 'felt-piano',
    bpm: 58,
    durationSec: 140,
    chords: [
      [50, 57, 60, 64, 65], // Dm9
      [46, 53, 57, 60, 62], // Bbmaj9
      [43, 50, 53, 57, 58], // Gm9
      [45, 52, 55, 58, 61], // A7b9
    ],
    melodyOffsets: [2, 4, 3, 5, 4, 2, 3, 1],
    moodNote: 'ท่วงทำนองเรียบหรูชวนเคลิ้ม สำหรับค่ำคืนอันเงียบสงบ',
  },

  // 2. Botanical & Harp (5)
  {
    id: 'lux-06',
    number: 6,
    title: 'Sanctuary Silk Breeze',
    subtitle: 'Golden Harp & Pad · A Maj9',
    category: 'botanical-harp',
    voice: 'harp-pad',
    bpm: 62,
    durationSec: 125,
    chords: [
      [45, 52, 56, 59, 61], // Amaj9
      [42, 49, 52, 56, 57], // F#m9
      [50, 57, 61, 64, 66], // Dmaj9
      [47, 54, 57, 61, 64], // Bm11
    ],
    melodyOffsets: [0, 2, 3, 4, 5, 4, 3, 2],
    moodNote: 'เสียงฮาร์ปพริ้วใสผสานคอร์ดอุ่นดุจสายลมในสวนส่วนตัว',
  },
  {
    id: 'lux-07',
    number: 7,
    title: 'Morning Dew Pavilion',
    subtitle: 'Crystalline Arpeggio · E Maj7',
    category: 'botanical-harp',
    voice: 'harp-pad',
    bpm: 68,
    durationSec: 118,
    chords: [
      [40, 47, 51, 54, 56], // Emaj9
      [49, 56, 59, 63, 64], // C#m9
      [45, 52, 56, 59, 61], // Amaj9
      [47, 54, 57, 61, 63], // B9sus4
    ],
    melodyOffsets: [1, 3, 4, 5, 3, 2, 4, 3],
    moodNote: 'โน้ตใสกระจ่างเหมือนหยดน้ำค้างบนศาลาพักผ่อน',
  },
  {
    id: 'lux-08',
    number: 8,
    title: 'Terrace Rain & Tea',
    subtitle: 'Soft Pluck & Shimmer · D Maj9',
    category: 'botanical-harp',
    voice: 'harp-pad',
    bpm: 64,
    durationSec: 124,
    chords: [
      [50, 57, 61, 64, 66], // Dmaj9
      [47, 54, 57, 61, 62], // Bm9
      [43, 50, 54, 57, 59], // Gmaj9
      [45, 52, 55, 59, 61], // A13
    ],
    melodyOffsets: [2, 4, 3, 2, 5, 4, 2, 3],
    moodNote: 'ความสงบละมุนดุจนั่งจิบชาชมสวนหลังฝนพรำ',
  },
  {
    id: 'lux-09',
    number: 9,
    title: 'Private Garden Serenade',
    subtitle: 'Acoustic Harp Blend · Bb Maj7',
    category: 'botanical-harp',
    voice: 'harp-pad',
    bpm: 60,
    durationSec: 132,
    chords: [
      [46, 53, 57, 60, 62], // Bbmaj9
      [43, 50, 53, 57, 58], // Gm9
      [51, 58, 62, 65, 67], // Ebmaj9
      [48, 55, 58, 62, 65], // Cm11
    ],
    melodyOffsets: [0, 1, 3, 4, 5, 3, 2, 4],
    moodNote: 'อารมณ์หรูหราอ่อนโยนสำหรับการเดินชมคลับเฮาส์และสวน',
  },
  {
    id: 'lux-10',
    number: 10,
    title: 'Lotus Pond Reflection',
    subtitle: 'Zen Luxury Harp · G Pentatonic',
    category: 'botanical-harp',
    voice: 'harp-pad',
    bpm: 56,
    durationSec: 140,
    chords: [
      [43, 50, 55, 57, 59], // G6/9
      [40, 47, 52, 55, 57], // Em7/11
      [48, 55, 57, 62, 64], // C6/9
      [45, 52, 55, 57, 62], // Am11
    ],
    melodyOffsets: [4, 2, 3, 5, 4, 3, 1, 2],
    moodNote: 'เพนทาโทนิกสงบเย็น ปลอบประโลมใจดุจสปาระดับไฮเอนด์',
  },

  // 3. Five-Star Hotel Jazz (5)
  {
    id: 'lux-11',
    number: 11,
    title: 'Lobby Jazz at Dusk',
    subtitle: 'Warm Lounge Rhodes · F Maj7',
    category: 'hotel-jazz',
    voice: 'rhodes-lounge',
    bpm: 74,
    durationSec: 115,
    chords: [
      [41, 48, 52, 55, 57], // Fmaj9
      [50, 57, 60, 64, 65], // Dm9
      [43, 50, 53, 57, 58], // Gm9
      [48, 55, 58, 62, 64], // C13
    ],
    melodyOffsets: [3, 4, 2, 3, 5, 4, 3, 2],
    moodNote: 'เสียงคีย์บอร์ดโรดส์นุ่มอุ่น สไตล์เลานจ์โรงแรม 5 ดาว',
  },
  {
    id: 'lux-12',
    number: 12,
    title: 'Rama II Twilight Lounge',
    subtitle: 'Smooth Neo-Jazz · C Min9',
    category: 'hotel-jazz',
    voice: 'rhodes-lounge',
    bpm: 68,
    durationSec: 126,
    chords: [
      [48, 55, 58, 62, 63], // Cm9
      [41, 48, 51, 55, 56], // Fm9
      [44, 51, 55, 58, 60], // Abmaj9
      [43, 50, 53, 57, 59], // G13b9
    ],
    melodyOffsets: [4, 3, 5, 4, 2, 3, 4, 1],
    moodNote: 'โทนแจ๊สนุ่มลึก สง่างามและมีรสนิยม',
  },
  {
    id: 'lux-13',
    number: 13,
    title: 'Espresso & Travertine',
    subtitle: 'Bossa Lounge Keys · G Maj7',
    category: 'hotel-jazz',
    voice: 'rhodes-lounge',
    bpm: 78,
    durationSec: 112,
    chords: [
      [43, 50, 54, 57, 59], // Gmaj9
      [45, 52, 55, 59, 60], // Am9
      [50, 57, 60, 64, 66], // D13
      [40, 47, 50, 54, 55], // Em9
    ],
    melodyOffsets: [2, 3, 5, 4, 2, 4, 3, 1],
    moodNote: 'กลิ่นอาย Bossa Lounge เบาๆ ฟังเพลินระหว่างชมแบบบ้าน',
  },
  {
    id: 'lux-14',
    number: 14,
    title: 'Obsidian Bar Interlude',
    subtitle: 'Velvet Electric Piano · Ab Maj9',
    category: 'hotel-jazz',
    voice: 'rhodes-lounge',
    bpm: 66,
    durationSec: 128,
    chords: [
      [44, 51, 55, 58, 60], // Abmaj9
      [41, 48, 51, 55, 56], // Fm9
      [49, 56, 60, 63, 65], // Dbmaj9
      [51, 58, 61, 65, 67], // Eb13
    ],
    melodyOffsets: [3, 5, 4, 2, 3, 4, 2, 1],
    moodNote: 'คอร์ด Neo-Soul หรูหราน่าค้นหา เหมือนไพรเวทคลับ',
  },
  {
    id: 'lux-15',
    number: 15,
    title: 'Champagne Flute Solitude',
    subtitle: 'Cocktail Lounge Keys · Eb Maj9',
    category: 'hotel-jazz',
    voice: 'rhodes-lounge',
    bpm: 70,
    durationSec: 120,
    chords: [
      [51, 58, 62, 65, 67], // Ebmaj9
      [43, 50, 53, 57, 58], // Gm7
      [48, 55, 58, 62, 63], // Cm9
      [46, 53, 56, 60, 62], // Bb13
    ],
    melodyOffsets: [4, 2, 3, 5, 4, 3, 2, 4],
    moodNote: 'เสียงเปียโนไฟฟ้าใสละมุน สำหรับการพักผ่อนเหนือระดับ',
  },

  // 4. Architectural Strings & Calm (5)
  {
    id: 'lux-16',
    number: 16,
    title: 'Timeless Residence Adagio',
    subtitle: 'Chamber Strings · D Maj7',
    category: 'chamber-calm',
    voice: 'velvet-strings',
    bpm: 54,
    durationSec: 145,
    chords: [
      [50, 57, 61, 64, 66], // Dmaj9
      [45, 52, 57, 61, 64], // A/C# warm
      [47, 54, 57, 61, 62], // Bm9
      [43, 50, 54, 57, 59], // Gmaj9
    ],
    melodyOffsets: [2, 3, 4, 5, 4, 3, 2, 1],
    moodNote: 'เครื่องสายประสานเสียงกังวานอุ่น สง่างามเหนือกาลเวลา',
  },
  {
    id: 'lux-17',
    number: 17,
    title: 'Silk Curtain Horizon',
    subtitle: 'Velvet Ambient Pad · A Min9',
    category: 'chamber-calm',
    voice: 'velvet-strings',
    bpm: 52,
    durationSec: 150,
    chords: [
      [45, 52, 55, 59, 60], // Am9
      [41, 48, 52, 55, 57], // Fmaj9
      [48, 55, 59, 62, 64], // Cmaj9
      [43, 50, 54, 57, 59], // Gmaj9
    ],
    melodyOffsets: [3, 4, 2, 5, 3, 4, 2, 0],
    moodNote: 'ซาวด์แพดเนื้อเนียนดุจผ้าไหม ให้ความรู้สึกโอบกอดอบอุ่น',
  },
  {
    id: 'lux-18',
    number: 18,
    title: 'Chandelier Glow',
    subtitle: 'Strings & Soft Bell · C Maj7',
    category: 'chamber-calm',
    voice: 'velvet-strings',
    bpm: 60,
    durationSec: 132,
    chords: [
      [48, 55, 59, 62, 64], // Cmaj9
      [43, 50, 54, 57, 59], // Gmaj9
      [45, 52, 55, 59, 60], // Am9
      [41, 48, 52, 55, 57], // Fmaj9
    ],
    melodyOffsets: [4, 5, 3, 4, 2, 3, 4, 5],
    moodNote: 'ประกายเสียงใสคล้ายแสงโคมระย้าคริสตัลในห้องรับแขก',
  },
  {
    id: 'lux-19',
    number: 19,
    title: 'Quiet Luxury Sanctuary',
    subtitle: 'Deep Spa Harmony · F# Min9',
    category: 'chamber-calm',
    voice: 'velvet-strings',
    bpm: 50,
    durationSec: 155,
    chords: [
      [42, 49, 52, 56, 57], // F#m9
      [50, 57, 61, 64, 66], // Dmaj9
      [45, 52, 56, 59, 61], // Amaj9
      [40, 47, 51, 54, 56], // Emaj9
    ],
    melodyOffsets: [1, 3, 4, 2, 5, 3, 2, 1],
    moodNote: 'คอร์ดช้าลึกสงบระดับไพรเวทสปา ช่วยให้จิตใจนิ่งสบาย',
  },
  {
    id: 'lux-20',
    number: 20,
    title: 'Evening Starlight Suite',
    subtitle: 'Grand Finale Strings · E Maj9',
    category: 'chamber-calm',
    voice: 'velvet-strings',
    bpm: 56,
    durationSec: 142,
    chords: [
      [40, 47, 51, 54, 56], // Emaj9
      [47, 54, 57, 61, 63], // B/D#
      [49, 56, 59, 63, 64], // C#m9
      [45, 52, 56, 59, 61], // Amaj9
    ],
    melodyOffsets: [2, 4, 5, 3, 4, 2, 3, 5],
    moodNote: 'บทเพลงปิดท้ายอันงดงาม อบอวลด้วยความประทับใจแห่งการอยู่อาศัย',
  },
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface LuxuryEngineSnapshot {
  track: LuxuryTrack | null;
  playing: boolean;
  muted: boolean;
  volume: number;
  waitingForGesture: boolean;
}

type LuxuryEngineListener = (snapshot: LuxuryEngineSnapshot) => void;

class LuxuryMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lpFilter: BiquadFilterNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private track: LuxuryTrack | null = null;
  private playing = false;
  private muted = false;
  private volume = 0.65;
  private trackStartTime = 0;
  private onTrackEndCallback: (() => void) | null = null;
  private waitingForGesture = false;
  private userStopped = false;
  private gestureHandlerBound: (() => void) | null = null;
  private listeners = new Set<LuxuryEngineListener>();

  public getSnapshot(): LuxuryEngineSnapshot {
    return {
      track: this.track,
      playing: this.playing,
      muted: this.muted,
      volume: this.volume,
      waitingForGesture: this.waitingForGesture,
    };
  }

  public subscribe(listener: LuxuryEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;

      this.lpFilter = this.ctx.createBiquadFilter();
      this.lpFilter.type = 'lowpass';
      this.lpFilter.frequency.value = 2100;
      this.lpFilter.Q.value = 0.5;

      // Subtle warm delay reverb network
      const delayL = this.ctx.createDelay(1.0);
      delayL.delayTime.value = 0.34;
      const delayR = this.ctx.createDelay(1.0);
      delayR.delayTime.value = 0.51;
      const wetFilter = this.ctx.createBiquadFilter();
      wetFilter.type = 'lowpass';
      wetFilter.frequency.value = 1150;
      const wetGain = this.ctx.createGain();
      wetGain.gain.value = 0.24;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume * 0.42;

      this.lpFilter.connect(compressor);
      this.lpFilter.connect(delayL);
      delayL.connect(delayR);
      delayR.connect(wetFilter);
      wetFilter.connect(wetGain);
      wetGain.connect(compressor);

      compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().then(() => {
        if (this.playing && this.waitingForGesture && !this.userStopped) {
          this.waitingForGesture = false;
          this.removeGestureListeners();
          this.beginPlaybackLoop();
          this.emit();
        }
      }).catch(() => {});
    }
    return this.ctx;
  }

  private removeGestureListeners() {
    if (typeof window === 'undefined' || !this.gestureHandlerBound) return;
    window.removeEventListener('pointerdown', this.gestureHandlerBound, true);
    window.removeEventListener('touchstart', this.gestureHandlerBound, true);
    window.removeEventListener('keydown', this.gestureHandlerBound, true);
    this.gestureHandlerBound = null;
  }

  private installGestureListeners() {
    if (typeof window === 'undefined' || this.gestureHandlerBound) return;
    this.gestureHandlerBound = () => {
      if (this.userStopped) {
        this.removeGestureListeners();
        return;
      }
      this.unlockFromGesture();
    };
    window.addEventListener('pointerdown', this.gestureHandlerBound, {
      capture: true,
      passive: true,
    });
    window.addEventListener('touchstart', this.gestureHandlerBound, {
      capture: true,
      passive: true,
    });
    window.addEventListener('keydown', this.gestureHandlerBound, {
      capture: true,
      passive: true,
    });
  }

  public unlockFromGesture() {
    if (this.userStopped) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.stepIndex = 0;
      this.trackStartTime = Date.now();
    }
    this.playing = true;
    this.waitingForGesture = false;
    this.removeGestureListeners();

    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (this.playing && !this.userStopped) {
          this.beginPlaybackLoop();
          this.emit();
        }
      }).catch(() => {});
    } else {
      this.beginPlaybackLoop();
      this.emit();
    }
  }

  public enableAutoPlay(onTrackEnd?: () => void) {
    if (this.userStopped) return;
    if (onTrackEnd) {
      this.onTrackEndCallback = onTrackEnd;
    }
    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.stepIndex = 0;
      this.trackStartTime = Date.now();
    }
    this.playing = true;

    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'running') {
      this.waitingForGesture = false;
      this.removeGestureListeners();
      if (this.timerId === null) {
        this.beginPlaybackLoop();
      }
      this.emit();
      return;
    }

    // Browser requires a user gesture before AudioContext can produce sound
    this.waitingForGesture = true;
    this.installGestureListeners();
    this.emit();
  }

  private beginPlaybackLoop() {
    if (!this.track || !this.ctx) return;
    this.stopTimer();
    this.trackStartTime = this.trackStartTime || Date.now();

    if (this.masterGain) {
      const targetGain = this.muted ? 0 : this.volume * 0.42;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(
        Math.max(0.0001, this.masterGain.gain.value),
        this.ctx.currentTime
      );
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.35);
    }

    const stepMs = (60 / this.track.bpm / 2) * 1000;
    this.scheduleStep();
    this.timerId = window.setInterval(() => {
      this.scheduleStep();
    }, stepMs);
  }

  private playTone(
    freq: number,
    duration: number,
    gainPeak: number,
    type: OscillatorType,
    attackSec: number,
    delayOffset = 0,
    detuneCents = 0
  ) {
    if (!this.ctx || !this.lpFilter) return;
    const now = this.ctx.currentTime + delayOffset;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detuneCents !== 0) {
      osc.detune.setValueAtTime(detuneCents, now);
    }

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gainPeak, now + Math.max(0.015, attackSec));
    g.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.15, duration));

    osc.connect(g);
    g.connect(this.lpFilter);

    osc.start(now);
    osc.stop(now + duration + 0.08);
  }

  private scheduleStep() {
    if (!this.playing || !this.track || !this.ctx || this.ctx.state !== 'running') return;
    const tr = this.track;
    const stepMs = (60 / tr.bpm / 2) * 1000; // eighth-note pulse
    const chordIdx = Math.floor(this.stepIndex / 8) % tr.chords.length;
    const stepInBar = this.stepIndex % 8;
    const chord = tr.chords[chordIdx];
    const beatSec = stepMs / 1000;

    // On downbeat of each bar (step 0): play warm bass + lush pad chord
    if (stepInBar === 0) {
      const bassMidi = chord[0] - 12;
      this.playTone(midiToFreq(bassMidi), beatSec * 7.5, 0.14, 'sine', 0.08);

      if (tr.voice === 'velvet-strings') {
        chord.forEach((m, idx) => {
          this.playTone(midiToFreq(m), beatSec * 8.2, 0.048, 'sine', 0.9, idx * 0.03, -5);
          this.playTone(midiToFreq(m), beatSec * 8.2, 0.032, 'triangle', 1.1, idx * 0.03, 5);
        });
      } else if (tr.voice === 'harp-pad') {
        chord.slice(0, 4).forEach((m, idx) => {
          this.playTone(midiToFreq(m), beatSec * 7.2, 0.04, 'sine', 0.65, idx * 0.05);
        });
      } else if (tr.voice === 'rhodes-lounge') {
        chord.forEach((m, idx) => {
          this.playTone(midiToFreq(m), beatSec * 5.8, 0.052, 'sine', 0.03, idx * 0.04);
          this.playTone(midiToFreq(m + 12), beatSec * 1.4, 0.018, 'sine', 0.015, idx * 0.04);
        });
      } else {
        // felt-piano
        chord.forEach((m, idx) => {
          this.playTone(midiToFreq(m), beatSec * 6.0, 0.055, 'triangle', 0.025, idx * 0.035);
          this.playTone(midiToFreq(m), beatSec * 6.4, 0.04, 'sine', 0.02, idx * 0.035);
        });
      }
    }

    // Gentle mid-bar shimmer on beat 4
    if (stepInBar === 4 && (tr.voice === 'rhodes-lounge' || tr.voice === 'felt-piano')) {
      const midMidi = chord[2];
      this.playTone(midiToFreq(midMidi), beatSec * 3.2, 0.042, 'sine', 0.025);
    }

    // Melodic motif note
    const offsetIdx = tr.melodyOffsets[stepInBar % tr.melodyOffsets.length];
    const shouldPlayMelody =
      tr.voice === 'harp-pad'
        ? stepInBar % 1 === 0
        : tr.voice === 'velvet-strings'
        ? stepInBar === 0 || stepInBar === 3 || stepInBar === 6
        : stepInBar === 0 || stepInBar === 2 || stepInBar === 3 || stepInBar === 5 || stepInBar === 7;

    if (shouldPlayMelody) {
      const baseNote = chord[offsetIdx % chord.length];
      const octaveShift = offsetIdx >= chord.length ? 24 : 12;
      const melFreq = midiToFreq(baseNote + octaveShift);

      if (tr.voice === 'felt-piano') {
        this.playTone(melFreq, beatSec * 3.4, 0.075, 'triangle', 0.018);
        this.playTone(melFreq * 2, beatSec * 1.2, 0.012, 'sine', 0.01);
      } else if (tr.voice === 'harp-pad') {
        this.playTone(melFreq, beatSec * 2.8, 0.068, 'sine', 0.012);
        this.playTone(melFreq * 2, beatSec * 1.5, 0.016, 'sine', 0.01);
      } else if (tr.voice === 'rhodes-lounge') {
        this.playTone(melFreq, beatSec * 2.9, 0.07, 'sine', 0.018);
        this.playTone(melFreq * 3, beatSec * 0.45, 0.01, 'sine', 0.008);
      } else {
        this.playTone(melFreq, beatSec * 5.2, 0.055, 'sine', 0.45, 0, 4);
      }
    }

    this.stepIndex += 1;

    // Auto-advance at track duration
    const elapsedSec = (Date.now() - this.trackStartTime) / 1000;
    if (elapsedSec >= tr.durationSec && this.onTrackEndCallback) {
      this.onTrackEndCallback();
    }
  }

  public start(track: LuxuryTrack, onTrackEnd?: () => void) {
    this.userStopped = false;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopTimer();
    this.track = track;
    this.stepIndex = 0;
    this.playing = true;
    this.trackStartTime = Date.now();
    this.onTrackEndCallback = onTrackEnd ?? null;

    if (ctx.state === 'running') {
      this.waitingForGesture = false;
      this.removeGestureListeners();
      this.beginPlaybackLoop();
    } else {
      this.waitingForGesture = true;
      this.installGestureListeners();
    }
    this.emit();
  }

  public pause() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    this.stopTimer();
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
    }
    this.emit();
  }

  public resume() {
    this.userStopped = false;
    if (!this.track) {
      this.start(LUXURY_PLAYLIST[0], this.onTrackEndCallback ?? undefined);
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playing = true;
    this.waitingForGesture = ctx.state !== 'running';
    this.stopTimer();

    if (ctx.state === 'running') {
      this.removeGestureListeners();
      this.beginPlaybackLoop();
    } else {
      this.installGestureListeners();
    }
    this.emit();
  }

  public stop() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    this.stopTimer();
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
    }
    this.track = null;
    this.stepIndex = 0;
    this.emit();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      const targetGain = muted || !this.playing ? 0 : this.volume * 0.42;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.15);
    }
    this.emit();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.muted && this.playing) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.42, this.ctx.currentTime + 0.1);
    }
    this.emit();
  }

  private stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const luxuryMusicEngine = new LuxuryMusicEngine();
