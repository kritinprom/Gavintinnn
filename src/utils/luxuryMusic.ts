import {
  LUXURY_CATEGORY_TABS,
  LUXURY_PLAYLIST,
  LuxuryCategory,
  LuxuryTrack,
} from '../data/hitPlaylist100';

export { LUXURY_CATEGORY_TABS, LUXURY_PLAYLIST };
export type { LuxuryCategory, LuxuryTrack };

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

interface YTPlayer {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (vol: number) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
}

interface YTGlobal {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    }
  ) => YTPlayer;
  PlayerState?: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTGlobal | null> | null = null;

function loadYouTubeIframeAPI(): Promise<YTGlobal | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') prevReady();
      resolve(window.YT ?? null);
    };

    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => resolve(null);
      document.head.appendChild(tag);
    }

    window.setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      }
    }, 1500);
  });

  return ytApiPromise;
}

class YouTubeHitMusicEngine {
  private player: YTPlayer | null = null;
  private hostContainer: HTMLDivElement | null = null;
  private playerReady = false;
  private initializing = false;
  private track: LuxuryTrack | null = null;
  private playing = false;
  private muted = false;
  private volume = 0.65;
  private elapsedSec = 0;
  private durationSec = 210;
  private waitingForGesture = false;
  private userStopped = false;
  private onTrackEndCallback: (() => void) | null = null;
  private gestureHandlerBound: (() => void) | null = null;
  private progressTimerId: number | null = null;
  private autoplayVerifyTimerId: number | null = null;
  private listeners = new Set<LuxuryEngineListener>();
  private errorAdvanceTimerId: number | null = null;

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

  /**
   * Keeps a single non-interactive fixed iframe container inside viewport bounds
   * so Chrome never suspends background audio and the document NEVER jumps/bounces.
   */
  private ensureHostElement(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;
    if (this.hostContainer && document.body.contains(this.hostContainer)) {
      return this.hostContainer;
    }
    const wrapper = document.createElement('div');
    wrapper.id = 'gavintin-yt-audio-host';
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.style.position = 'fixed';
    wrapper.style.bottom = '8px';
    wrapper.style.right = '8px';
    wrapper.style.width = '200px';
    wrapper.style.height = '112px';
    wrapper.style.opacity = '0.001';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '-1';
    wrapper.style.overflow = 'hidden';

    const inner = document.createElement('div');
    inner.id = 'gavintin-yt-player-slot';
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);
    this.hostContainer = wrapper;
    return wrapper;
  }

  private startProgressPolling() {
    this.stopProgressPolling();
    this.progressTimerId = window.setInterval(() => {
      if (!this.player || !this.playerReady || !this.playing) return;
      try {
        const cur = this.player.getCurrentTime();
        const dur = this.player.getDuration();
        let changed = false;
        if (Number.isFinite(cur) && cur >= 0 && Math.abs(cur - this.elapsedSec) >= 0.4) {
          this.elapsedSec = cur;
          changed = true;
        }
        if (Number.isFinite(dur) && dur > 5 && Math.round(dur) !== this.durationSec) {
          this.durationSec = Math.round(dur);
          changed = true;
        }
        if (changed) {
          this.emit();
        }
      } catch {
        // Ignore transient YouTube bridge errors while loading
      }
    }, 500);
  }

  private stopProgressPolling() {
    if (this.progressTimerId !== null) {
      window.clearInterval(this.progressTimerId);
      this.progressTimerId = null;
    }
  }

  private clearAutoplayVerifyTimer() {
    if (this.autoplayVerifyTimerId !== null) {
      window.clearTimeout(this.autoplayVerifyTimerId);
      this.autoplayVerifyTimerId = null;
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

  private async ensurePlayer(initialVideoId: string): Promise<void> {
    if (this.player || this.initializing) return;
    this.initializing = true;

    const YT = await loadYouTubeIframeAPI();
    if (!YT || !YT.Player) {
      this.initializing = false;
      return;
    }

    const host = this.ensureHostElement();
    const slot = host?.querySelector('#gavintin-yt-player-slot') as HTMLElement | null;
    if (!slot) {
      this.initializing = false;
      return;
    }

    this.player = new YT.Player(slot, {
      width: 200,
      height: 112,
      videoId: initialVideoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          this.playerReady = true;
          this.initializing = false;
          try {
            const iframe = this.player?.getIframe();
            if (iframe) {
              iframe.setAttribute('tabindex', '-1');
              iframe.setAttribute('title', 'เครื่องเล่นเพลงฮิตประจำโครงการ');
            }
          } catch {
            // Ignore
          }

          if (!this.userStopped && this.track) {
            this.attemptPlayCurrentTrack();
          }
        },
        onStateChange: (event) => {
          const state = event.data;
          // 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 5 = CUED
          if (state === 1) {
            this.clearAutoplayVerifyTimer();
            if (!this.userStopped) {
              this.playing = true;
              try {
                const dur = this.player?.getDuration();
                if (dur && Number.isFinite(dur) && dur > 5) {
                  this.durationSec = Math.round(dur);
                }
                const mutedNow = this.player?.isMuted();
                if (mutedNow && !this.muted) {
                  // Playing muted waiting for gesture to unmute cleanly
                  this.waitingForGesture = true;
                  this.installGestureListeners();
                } else {
                  this.waitingForGesture = false;
                  this.removeGestureListeners();
                }
              } catch {
                this.waitingForGesture = false;
              }
              this.startProgressPolling();
              this.emit();
            }
          } else if (state === 0) {
            // Song finished completely -> play next hit song automatically
            this.elapsedSec = 0;
            if (!this.userStopped && this.onTrackEndCallback) {
              this.onTrackEndCallback();
            }
          } else if (state === 2 && !this.userStopped && !this.waitingForGesture) {
            this.playing = false;
            this.emit();
          }
        },
        onError: () => {
          if (this.userStopped) return;
          if (this.errorAdvanceTimerId !== null) {
            window.clearTimeout(this.errorAdvanceTimerId);
          }
          this.errorAdvanceTimerId = window.setTimeout(() => {
            this.errorAdvanceTimerId = null;
            if (!this.userStopped && this.onTrackEndCallback) {
              this.onTrackEndCallback();
            }
          }, 450);
        },
      },
    });
  }

  private attemptPlayCurrentTrack() {
    if (!this.player || !this.playerReady || !this.track) return;
    this.clearAutoplayVerifyTimer();

    try {
      this.player.setVolume(Math.round(this.volume * 100));
      if (this.muted) {
        this.player.mute();
      } else {
        this.player.unMute();
      }
      this.player.playVideo();
    } catch {
      // Fall through to check
    }

    // Verify if unmuted autoplay succeeded; if blocked, wait for first gesture & keep muted playback buffered
    this.autoplayVerifyTimerId = window.setTimeout(() => {
      if (!this.player || !this.playerReady || this.userStopped) return;
      try {
        const st = this.player.getPlayerState();
        if (st !== 1 && st !== 3) {
          // Try muted autoplay so the song starts buffering/playing immediately, ready to unmute on first tap
          this.player.mute();
          this.player.playVideo();
          this.waitingForGesture = true;
          this.installGestureListeners();
          this.emit();
        }
      } catch {
        this.waitingForGesture = true;
        this.installGestureListeners();
        this.emit();
      }
    }, 950);
  }

  public unlockFromGesture() {
    if (this.userStopped) return;
    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.durationSec = this.track.durationSec;
      this.elapsedSec = 0;
    }

    this.playing = true;
    this.waitingForGesture = false;
    this.removeGestureListeners();

    if (!this.player) {
      void this.ensurePlayer(this.track.videoId);
      this.emit();
      return;
    }

    if (this.playerReady) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
        if (this.muted) {
          this.player.mute();
        } else {
          this.player.unMute();
        }
        this.player.playVideo();
        this.startProgressPolling();
      } catch {
        // Ignore
      }
    }
    this.emit();
  }

  public enableAutoPlay(onTrackEnd?: () => void) {
    if (this.userStopped) return;
    if (onTrackEnd) {
      this.onTrackEndCallback = onTrackEnd;
    }
    if (!this.track) {
      this.track = LUXURY_PLAYLIST[0];
      this.durationSec = this.track.durationSec;
      this.elapsedSec = 0;
    }

    this.playing = true;
    this.waitingForGesture = true;
    this.installGestureListeners();

    if (!this.player) {
      void this.ensurePlayer(this.track.videoId);
    } else if (this.playerReady) {
      this.attemptPlayCurrentTrack();
    }
    this.emit();
  }

  public start(track: LuxuryTrack, onTrackEnd?: () => void) {
    this.userStopped = false;
    this.track = track;
    this.elapsedSec = 0;
    this.durationSec = track.durationSec;
    this.playing = true;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    if (onTrackEnd) {
      this.onTrackEndCallback = onTrackEnd;
    }

    if (!this.player) {
      void this.ensurePlayer(track.videoId);
    } else if (this.playerReady) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
        if (this.muted) {
          this.player.mute();
        } else {
          this.player.unMute();
        }
        this.player.loadVideoById(track.videoId);
        this.startProgressPolling();
      } catch {
        // Ignore
      }
    }
    this.emit();
  }

  public seekTo(seconds: number) {
    if (!this.player || !this.playerReady || !this.track) return;
    const clamped = Math.max(0, Math.min(this.durationSec || 600, seconds));
    this.elapsedSec = clamped;
    try {
      this.player.seekTo(clamped, true);
    } catch {
      // Ignore
    }
    this.emit();
  }

  public pause() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    this.clearAutoplayVerifyTimer();
    this.stopProgressPolling();
    if (this.player && this.playerReady) {
      try {
        this.player.pauseVideo();
      } catch {
        // Ignore
      }
    }
    this.emit();
  }

  public resume() {
    this.userStopped = false;
    if (!this.track) {
      this.start(LUXURY_PLAYLIST[0], this.onTrackEndCallback ?? undefined);
      return;
    }
    this.playing = true;
    this.waitingForGesture = false;
    this.removeGestureListeners();

    if (!this.player) {
      void this.ensurePlayer(this.track.videoId);
    } else if (this.playerReady) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
        if (this.muted) {
          this.player.mute();
        } else {
          this.player.unMute();
        }
        this.player.playVideo();
        this.startProgressPolling();
      } catch {
        // Ignore
      }
    }
    this.emit();
  }

  public stop() {
    this.userStopped = true;
    this.playing = false;
    this.waitingForGesture = false;
    this.removeGestureListeners();
    this.clearAutoplayVerifyTimer();
    this.stopProgressPolling();
    if (this.errorAdvanceTimerId !== null) {
      window.clearTimeout(this.errorAdvanceTimerId);
      this.errorAdvanceTimerId = null;
    }
    if (this.player && this.playerReady) {
      try {
        this.player.stopVideo();
      } catch {
        // Ignore
      }
    }
    this.track = null;
    this.elapsedSec = 0;
    this.durationSec = 210;
    this.emit();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.player && this.playerReady) {
      try {
        if (muted) {
          this.player.mute();
        } else {
          this.player.unMute();
          this.player.setVolume(Math.round(this.volume * 100));
        }
      } catch {
        // Ignore
      }
    }
    this.emit();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.player && this.playerReady) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
        if (!this.muted && this.playing) {
          this.player.unMute();
        }
      } catch {
        // Ignore
      }
    }
    this.emit();
  }
}

export const luxuryMusicEngine = new YouTubeHitMusicEngine();
