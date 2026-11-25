export type LuxuryCategory =
  | 'all'
  | 'thai-chart'
  | 'thai-chill'
  | 'global-chart'
  | 'global-pop';

export interface LuxuryTrack {
  id: string;
  number: number;
  title: string;
  subtitle: string; // Artist display label
  artist: string;
  album: string;
  category: Exclude<LuxuryCategory, 'all'>;
  trackId: number;
  previewUrl: string;
  artworkUrl: string;
  durationSec: number;
  moodNote: string;
}

export const LUXURY_CATEGORY_TABS: { id: LuxuryCategory; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด (20)' },
  { id: 'thai-chart', label: 'เพลงไทยติดชาร์ต (5)' },
  { id: 'thai-chill', label: 'ไทยป๊อปฟังสบาย (5)' },
  { id: 'global-chart', label: 'เพลงสากลติดกระแส (5)' },
  { id: 'global-pop', label: 'สากลป๊อป & R&B ฮิต (5)' },
];

export const LUXURY_PLAYLIST: LuxuryTrack[] = [
  // 1. เพลงไทยติดชาร์ต (5)
  {
    id: 'hit-01',
    number: 1,
    title: 'ซ่อน(ไม่)หา (Ghost)',
    subtitle: 'Jeff Satur',
    artist: 'Jeff Satur',
    album: 'Ghost - Single',
    category: 'thai-chart',
    trackId: 1724685427,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/be/ea/9c/beea9cc5-2f4a-657a-cda1-5e5ef382ba7a/mzaf_6797589711112840217.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/2d/8a/7c/2d8a7c7b-5ebd-6f42-8300-69730a55a2eb/5054197954672.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงฮิตติดชาร์ตอันดับ 1 ของ Jeff Satur น้ำเสียงทรงพลัง',
  },
  {
    id: 'hit-02',
    number: 2,
    title: 'โต๊ะริม (Melt)',
    subtitle: 'NONT TANONT',
    artist: 'NONT TANONT',
    album: 'โต๊ะริม (Melt) - Single',
    category: 'thai-chart',
    trackId: 1622714542,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f4/5f/f4/f45ff486-6fa0-9df5-9d58-8ed552c86140/mzaf_5412811150878921175.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5d/70/fe/5d70fe6e-f3e4-c874-a2de-e4ecd186bf80/cover.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงป๊อปอารมณ์ดีสุดฮิตจาก นนท์ ธนนท์',
  },
  {
    id: 'hit-03',
    number: 3,
    title: 'ฝนตกไหม',
    subtitle: 'Three Man Down',
    artist: 'Three Man Down',
    album: 'This City Won’t Be Lonely Anymore',
    category: 'thai-chart',
    trackId: 1792752632,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/d2/65/34d2659e-148d-c029-0cc8-60d75ca37f13/mzaf_12794166550202757517.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fc/22/ba/fc22ba00-0d93-66cd-dce0-ded6923c8537/888332922777.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงฮิตระดับร้อยล้านวิวของ Three Man Down',
  },
  {
    id: 'hit-04',
    number: 4,
    title: 'เพื่อนเล่น ไม่เล่นเพื่อน (feat. MILLI)',
    subtitle: 'Tilly Birds',
    artist: 'Tilly Birds & MILLI',
    album: 'It’s Gonna Be OK',
    category: 'thai-chart',
    trackId: 1792753812,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/90/b1/cf/90b1cffa-e581-488a-1978-77b61af4f9b1/mzaf_14460411884468388426.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3a/d1/4c/3ad14c38-72fa-5cbc-558b-7ee6ef9d101e/888332916318.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ที-ป๊อป/อัลเทอร์เนทีฟยอดฮิต จังหวะสนุกฟังติดหู',
  },
  {
    id: 'hit-05',
    number: 5,
    title: 'วาดไว้ (Recall)',
    subtitle: 'BOWKYLION',
    artist: 'BOWKYLION',
    album: 'วาดไว้ (Recall) - Single',
    category: 'thai-chart',
    trackId: 1829231896,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/14/66/49/1466491a-b745-525c-7b96-321b4fd231d0/mzaf_16914207157708959097.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0f/0f/42/0f0f4249-8f24-a6e8-56e4-6ec088900d93/25UMGIM79865.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงฮิตกินใจเสียงร้องละมุนจาก โบกี้ไลอ้อน',
  },

  // 2. ไทยป๊อปฟังสบาย (5)
  {
    id: 'hit-06',
    number: 6,
    title: 'ชอบตัวเองตอนอยู่กับเธอ (I Like Us)',
    subtitle: 'BILLKIN',
    artist: 'BILLKIN',
    album: 'ชอบตัวเองตอนอยู่กับเธอ - Single',
    category: 'thai-chill',
    trackId: 1635564114,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c7/69/c4/c769c412-77a9-781b-3326-1c3de343acc3/mzaf_3426441544729006461.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/7b/65/5b/7b655b08-2460-38c9-353b-47f4666b2a2f/22UMGIM78199.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'โซลป๊อปอบอุ่นหัวใจ จากเสียงร้องมีเสน่ห์ของบิวกิ้น',
  },
  {
    id: 'hit-07',
    number: 7,
    title: "สายตาหลอกกันไม่ได้ (Eyes don't lie)",
    subtitle: 'Ink Waruntorn',
    artist: 'Ink Waruntorn',
    album: "สายตาหลอกกันไม่ได้ (Eyes don't lie)",
    category: 'thai-chill',
    trackId: 1861516784,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/64/a6/db/64a6db06-8931-cd05-30a7-6ff976ed96ca/mzaf_1200240892676868907.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/90/c3/5b/90c35b5b-ba74-e3fb-1a0e-6ba03e914c93/0840102441345_Cover.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ซินธ์ป๊อปเสียงใสชวนฝัน จาก อิ้งค์ วรันธร',
  },
  {
    id: 'hit-08',
    number: 8,
    title: 'ใกล้ (Close)',
    subtitle: 'SCRUBB',
    artist: 'SCRUBB',
    album: 'Club',
    category: 'thai-chill',
    trackId: 554571894,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cb/bd/73/cbbd7357-98ab-bd5d-02a4-1401d541b115/mzaf_18293941087721276643.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ff/2a/7b/ff2a7bb1-7993-c9e1-61ae-55414fcd48be/884977628104.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงฮิตตลอดกาล ฟังกี่ครั้งก็อบอุ่นสบายใจ',
  },
  {
    id: 'hit-09',
    number: 9,
    title: 'สลักจิต (feat. ดา เอ็นโดรฟิน)',
    subtitle: 'Pop Pongkool',
    artist: 'Pop Pongkool & Da Endorphine',
    album: 'สลักจิต - Single',
    category: 'thai-chill',
    trackId: 1792747349,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e6/6e/34/e66e34c2-c971-ef2c-2e0f-f8a99e220912/mzaf_7695861381642299193.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8c/69/cb/8c69cba7-b440-a3b3-b9c0-8e409b8613f2/888332908481.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ดูเอตระดับตำนาน ป๊อบ ปองกูล x ดา เอ็นโดรฟิน',
  },
  {
    id: 'hit-10',
    number: 10,
    title: 'พบกันใหม่ (So Long)',
    subtitle: 'Polycat',
    artist: 'Polycat',
    album: '80 Kisses',
    category: 'thai-chill',
    trackId: 1219179133,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d7/db/c6/d7dbc6b7-df68-509b-393c-d2e7461e4782/mzaf_16441888389148470421.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/83/11/6f/83116f31-73a4-3df3-6c5f-6658aabbea49/cover.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เรโทรซินธ์ป๊อปสุดฮิตจาก Polycat',
  },

  // 3. เพลงสากลติดกระแส (5)
  {
    id: 'hit-11',
    number: 11,
    title: 'APT.',
    subtitle: 'ROSÉ & Bruno Mars',
    artist: 'ROSÉ & Bruno Mars',
    album: 'rosie',
    category: 'global-chart',
    trackId: 1771105935,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/70/41/42/70414259-14f5-245e-bd79-93c80401d556/mzaf_8687698460653166345.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/2d/14/66/2d14661b-345b-d0f3-4e86-56ef626e68aa/075679629203.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เมกะฮิตระดับโลก จังหวะสนุกสดใสจาก ROSÉ & Bruno Mars',
  },
  {
    id: 'hit-12',
    number: 12,
    title: 'Die With A Smile',
    subtitle: 'Lady Gaga & Bruno Mars',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile - Single',
    category: 'global-chart',
    trackId: 1762656732,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/6a/99/076a99ed-b946-431b-6f1f-54fa187ca5bd/mzaf_8102882277995122875.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'บัลลาดระดับโลก เสียงประสานสุดหรูของ Lady Gaga & Bruno Mars',
  },
  {
    id: 'hit-13',
    number: 13,
    title: 'Espresso',
    subtitle: 'Sabrina Carpenter',
    artist: 'Sabrina Carpenter',
    album: 'Espresso - Single',
    category: 'global-chart',
    trackId: 1744253558,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/48/14/5f/48145fa9-a5b6-32a0-45e8-05af48e52b9c/mzaf_6315924685303002328.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3a/09/fa/3a09fabd-7a71-d0d7-3e6a-7f3c4c89014e/24UMGIM32304.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ป๊อปกรูฟติดหูอันดับ 1 ชาร์ตโลกจาก Sabrina Carpenter',
  },
  {
    id: 'hit-14',
    number: 14,
    title: 'BIRDS OF A FEATHER',
    subtitle: 'Billie Eilish',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    category: 'global-chart',
    trackId: 1739659142,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/31/d3/3431d34e-847f-5d66-df83-0bce688d997e/mzaf_18106743962423782018.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงฮิตยอดสตรีมสูงสุดจาก Billie Eilish',
  },
  {
    id: 'hit-15',
    number: 15,
    title: 'Rockstar',
    subtitle: 'LISA',
    artist: 'LISA',
    album: 'Alter Ego',
    category: 'global-chart',
    trackId: 1799316832,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2a/ce/ed/2aceed99-a73e-421e-89bd-7ad58a8a7c25/mzaf_17944082866403100247.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/88/f6/7f/88f67fd9-c010-e52a-d10e-f5781116b99a/196872937138.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'โกลบอลฮิตสุดเท่จาก ลิซ่า (LISA)',
  },

  // 4. สากลป๊อป & R&B ฮิต (5)
  {
    id: 'hit-16',
    number: 16,
    title: 'Cruel Summer',
    subtitle: 'Taylor Swift',
    artist: 'Taylor Swift',
    album: 'Lover',
    category: 'global-pop',
    trackId: 1468058171,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/af/81/44af8168-9609-1b85-5048-ada08dceacf3/mzaf_1341699644335558812.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงป๊อปยอดนิยมจากอัลบั้ม Lover ของ Taylor Swift',
  },
  {
    id: 'hit-17',
    number: 17,
    title: 'Leave The Door Open',
    subtitle: 'Bruno Mars & Silk Sonic',
    artist: 'Bruno Mars, Anderson .Paak & Silk Sonic',
    album: 'An Evening with Silk Sonic',
    category: 'global-pop',
    trackId: 1611637849,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2b/a4/4e/2ba44ec0-066f-146f-7d78-d92e146bd860/mzaf_13302332917246733732.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4e/b2/25/4eb22575-99e3-8c06-7446-51a99add8b0f/075679754585.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'R&B ระดับรางวัลแกรมมี ละมุนหรูสไตล์ Silk Sonic',
  },
  {
    id: 'hit-18',
    number: 18,
    title: 'Perfect',
    subtitle: 'Ed Sheeran',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    category: 'global-pop',
    trackId: 1193701400,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c7/ba/bc/c7babc66-f598-aaa6-bcf6-307281795817/mzaf_16337361235117168274.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'เพลงรักสุดคลาสสิกที่อบอุ่นลงตัวจาก Ed Sheeran',
  },
  {
    id: 'hit-19',
    number: 19,
    title: 'Blinding Lights',
    subtitle: 'The Weeknd',
    artist: 'The Weeknd',
    album: 'After Hours',
    category: 'global-pop',
    trackId: 1499378607,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/19/d6/60/19d660ff-e3a9-8377-15a3-ce4b28e89cac/mzaf_18422426156481158187.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ซินธ์เวฟฮิตอันดับ 1 ตลอดกาลของชาร์ต Billboard',
  },
  {
    id: 'hit-20',
    number: 20,
    title: 'Attention',
    subtitle: 'Charlie Puth',
    artist: 'Charlie Puth',
    album: 'Voicenotes',
    category: 'global-pop',
    trackId: 1293229677,
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0b/76/e1/0b76e164-35b8-7fbb-a773-9832f3155532/mzaf_12020704327610118862.plus.aac.p.m4a',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a8/e2/1b/a8e21b3b-9c8d-2974-2318-6bcd4c9d2370/075679884336.jpg/300x300bb.jpg',
    durationSec: 30,
    moodNote: 'ป๊อปเบสไลน์สุดคมจาก Charlie Puth',
  },
];

export interface LuxuryEngineSnapshot {
  track: LuxuryTrack | null;
  playing: boolean;
  muted: boolean;
  volume: number;
  waitingForGesture: boolean;
  elapsedSec: number;
  durationSec: number;
}

type LuxuryEngineListener = (snapshot: LuxuryEngineSnapshot) => void;

class HitMusicEngine {
  private audio: HTMLAudioElement | null = null;
  private track: LuxuryTrack | null = null;
  private playing = false;
  private muted = false;
  private volume = 0.65;
  private elapsedSec = 0;
  private durationSec = 30;
  private waitingForGesture = false;
  private userStopped = false;
  private onTrackEndCallback: (() => void) | null = null;
  private gestureHandlerBound: (() => void) | null = null;
  private listeners = new Set<LuxuryEngineListener>();
  private refreshedTrackIds = new Set<number>();

  public getSnapshot(): LuxuryEngineSnapshot {
    return {
      track: this.track,
      playing: this.playing,
      muted: this.muted,
      volume: this.volume,
      waitingForGesture: this.waitingForGesture,
      elapsedSec: this.elapsedSec,
      durationSec: this.durationSec,
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

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      const el = new Audio();
      el.preload = 'auto';
      el.crossOrigin = 'anonymous';
      el.volume = this.volume;
      el.muted = this.muted;

      el.addEventListener('timeupdate', () => {
        this.elapsedSec = Number.isFinite(el.currentTime) ? el.currentTime : 0;
        if (Number.isFinite(el.duration) && el.duration > 0) {
          this.durationSec = Math.round(el.duration);
        }
        this.emit();
      });

      el.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(el.duration) && el.duration > 0) {
          this.durationSec = Math.round(el.duration);
          this.emit();
        }
      });

      el.addEventListener('playing', () => {
        if (!this.userStopped) {
          this.playing = true;
          this.waitingForGesture = false;
          this.removeGestureListeners();
          this.emit();
        }
      });

      el.addEventListener('ended', () => {
        this.elapsedSec = 0;
        if (this.onTrackEndCallback) {
          this.onTrackEndCallback();
        }
      });

      el.addEventListener('error', () => {
        if (!this.track || this.userStopped) return;
        const currentTrack = this.track;
        if (!this.refreshedTrackIds.has(currentTrack.trackId)) {
          this.refreshedTrackIds.add(currentTrack.trackId);
          void this.refreshAndReplay(currentTrack);
        } else if (this.onTrackEndCallback) {
          this.onTrackEndCallback();
        }
      });

      this.audio = el;
    }
    return this.audio;
  }

  private async refreshAndReplay(track: LuxuryTrack) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${track.trackId}&country=th`
      );
      const data = (await res.json()) as {
        results?: Array<{ previewUrl?: string }>;
      };
      const freshUrl = data.results?.[0]?.previewUrl;
      if (freshUrl && this.track?.id === track.id && !this.userStopped) {
        track.previewUrl = freshUrl;
        const el = this.ensureAudio();
        if (el) {
          el.src = freshUrl;
          void this.tryPlayElement(el);
          return;
        }
      }
    } catch {
      // Ignore network fallback failure and step to next song
    }
    if (this.onTrackEndCallback && !this.userStopped) {
      this.onTrackEndCallback();
    }
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

  private tryPlayElement(el: HTMLAudioElement) {
    el.muted = this.muted;
    el.volume = this.volume;
    try {
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (!this.userStopped) {
              this.playing = true;
              this.waitingForGesture = false;
              this.removeGestureListeners();
              this.emit();
            }
          })
          .catch(() => {
            if (!this.userStopped) {
              this.waitingForGesture = true;
              this.installGestureListeners();
              this.emit();
            }
          });
      }
    } catch {
      this.waitingForGesture = true;
      this.installGestureListeners();
      this.emit();
    }
  }

  public unlockFromGesture() {
    if (this.userStopped) return;
    const el = this.ensureAudio();
    if (!el) return;

    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.durationSec = this.track.durationSec;
      this.elapsedSec = 0;
    }

    if (el.src !== this.track.previewUrl) {
      el.src = this.track.previewUrl;
    }

    this.playing = true;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    this.tryPlayElement(el);
    this.emit();
  }

  public enableAutoPlay(onTrackEnd?: () => void) {
    if (this.userStopped) return;
    if (onTrackEnd) {
      this.onTrackEndCallback = onTrackEnd;
    }
    const el = this.ensureAudio();
    if (!el) return;

    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.durationSec = this.track.durationSec;
      this.elapsedSec = 0;
    }

    if (el.src !== this.track.previewUrl) {
      el.src = this.track.previewUrl;
    }

    this.playing = true;
    this.tryPlayElement(el);
    this.emit();
  }

  public start(track: LuxuryTrack, onTrackEnd?: () => void) {
    this.userStopped = false;
    const el = this.ensureAudio();
    if (!el) return;

    this.track = track;
    this.elapsedSec = 0;
    this.durationSec = track.durationSec;
    this.playing = true;
    this.onTrackEndCallback = onTrackEnd ?? this.onTrackEndCallback;

    el.pause();
    el.src = track.previewUrl;
    el.currentTime = 0;
    this.tryPlayElement(el);
    this.emit();
  }

  public pause() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    if (this.audio) {
      this.audio.pause();
    }
    this.emit();
  }

  public resume() {
    this.userStopped = false;
    if (!this.track) {
      this.start(LUXURY_PLAYLIST[0], this.onTrackEndCallback ?? undefined);
      return;
    }
    const el = this.ensureAudio();
    if (!el) return;
    if (el.src !== this.track.previewUrl) {
      el.src = this.track.previewUrl;
    }
    this.playing = true;
    this.tryPlayElement(el);
    this.emit();
  }

  public stop() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.track = null;
    this.elapsedSec = 0;
    this.durationSec = 30;
    this.emit();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.emit();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.emit();
  }
}

export const luxuryMusicEngine = new HitMusicEngine();
