import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Disc3,
  ExternalLink,
  Music,
  Pause,
  Play,
  Radio,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  VOCAL_CATEGORY_TABS,
  VOCAL_PLAYLIST,
  VocalCategory,
  VocalTrack,
} from '../data/vocalPlaylist';
import {
  LUXURY_AMBIENT_PLAYLIST,
  LuxuryTrack,
} from '../utils/christmasMusic';
import {
  playCancelSound,
  playClickSound,
  playToggleSound,
} from '../utils/soundEffects';

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YTGlobal {
  Player: new (
    element: HTMLElement,
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
  ) => YTPlayerInstance;
  PlayerState?: {
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

let ytApiPromise: Promise<YTGlobal> | null = null;

function loadYouTubeIframeApi(): Promise<YTGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<YTGlobal>((resolve, reject) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') prevCallback();
      if (window.YT) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API unavailable'));
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

interface MusicJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  isStaffMode: boolean;
  ambientEnabled: boolean;
  currentAmbientTrack: LuxuryTrack;
  onSelectAmbientTrack: (index: number) => void;
  onToggleAmbientMusic: () => void;
  onStopAmbientMusic: () => void;
  onVocalActiveChange?: (activeTrack: VocalTrack | null, isPlaying: boolean) => void;
}

export function MusicJukeboxModal({
  isOpen,
  onClose,
  onOpen,
  isStaffMode,
  ambientEnabled,
  currentAmbientTrack,
  onSelectAmbientTrack,
  onToggleAmbientMusic,
  onStopAmbientMusic,
  onVocalActiveChange,
}: MusicJukeboxModalProps) {
  const [libraryTab, setLibraryTab] = useState<'vocal' | 'ambient'>('vocal');
  const [vocalCategory, setVocalCategory] = useState<VocalCategory>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [activeVocalTrack, setActiveVocalTrack] = useState<VocalTrack | null>(null);
  const [isVocalPlaying, setIsVocalPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [embedBlockedCode, setEmbedBlockedCode] = useState<number | null>(null);

  // Optional user-uploaded local audio file (MP3/M4A/WAV)
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const [isLocalAudioPlaying, setIsLocalAudioPlaying] = useState<boolean>(false);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef<boolean>(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const activeVocalTrackRef = useRef<VocalTrack | null>(null);
  const filteredVocalTracksRef = useRef<VocalTrack[]>(VOCAL_PLAYLIST);
  const shuffleModeRef = useRef<boolean>(false);

  useEffect(() => {
    activeVocalTrackRef.current = activeVocalTrack;
  }, [activeVocalTrack]);

  useEffect(() => {
    shuffleModeRef.current = shuffleMode;
  }, [shuffleMode]);

  useEffect(() => {
    onVocalActiveChange?.(activeVocalTrack, isVocalPlaying || isLocalAudioPlaying);
  }, [activeVocalTrack, isVocalPlaying, isLocalAudioPlaying, onVocalActiveChange]);

  const filteredVocalTracks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return VOCAL_PLAYLIST.filter((track) => {
      if (vocalCategory !== 'all' && track.category !== vocalCategory) {
        return false;
      }
      if (!q) return true;
      return (
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.albumOrOrigin.toLowerCase().includes(q) ||
        track.moodNote.toLowerCase().includes(q)
      );
    });
  }, [vocalCategory, searchText]);

  useEffect(() => {
    filteredVocalTracksRef.current =
      filteredVocalTracks.length > 0 ? filteredVocalTracks : VOCAL_PLAYLIST;
  }, [filteredVocalTracks]);

  const stopLocalAudio = useCallback(() => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
    }
    setIsLocalAudioPlaying(false);
  }, []);

  const handleSelectVocalTrack = useCallback(
    (track: VocalTrack) => {
      playClickSound();
      stopLocalAudio();
      onStopAmbientMusic();
      setEmbedBlockedCode(null);
      setActiveVocalTrack(track);
      setIsVocalPlaying(true);

      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(track.youtubeId);
          if (isMuted) {
            ytPlayerRef.current.mute();
          } else {
            ytPlayerRef.current.unMute();
          }
        } catch {
          pendingVideoIdRef.current = track.youtubeId;
        }
      } else {
        pendingVideoIdRef.current = track.youtubeId;
      }
    },
    [isMuted, onStopAmbientMusic, stopLocalAudio]
  );

  const handleStepVocalTrack = useCallback(
    (direction: 'next' | 'prev') => {
      const pool = filteredVocalTracksRef.current;
      if (pool.length === 0) return;

      const current = activeVocalTrackRef.current;
      if (!current) {
        handleSelectVocalTrack(pool[0]);
        return;
      }

      if (shuffleModeRef.current && pool.length > 1) {
        let randomIdx = Math.floor(Math.random() * pool.length);
        if (pool[randomIdx].id === current.id) {
          randomIdx = (randomIdx + 1) % pool.length;
        }
        handleSelectVocalTrack(pool[randomIdx]);
        return;
      }

      const idx = pool.findIndex((t) => t.id === current.id);
      if (idx === -1) {
        handleSelectVocalTrack(pool[0]);
        return;
      }
      const nextIdx =
        direction === 'next' ? (idx + 1) % pool.length : (idx - 1 + pool.length) % pool.length;
      handleSelectVocalTrack(pool[nextIdx]);
    },
    [handleSelectVocalTrack]
  );

  // Initialize YouTube IFrame Player once the first vocal track is activated
  useEffect(() => {
    if (!activeVocalTrack) return;
    if (ytPlayerRef.current) return;
    let cancelled = false;

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !ytHostRef.current || ytPlayerRef.current) return;
        const container = ytHostRef.current;
        const target = document.createElement('div');
        target.className = 'w-full h-full';
        container.innerHTML = '';
        container.appendChild(target);

        const initialVideoId = pendingVideoIdRef.current || activeVocalTrack.youtubeId;
        ytPlayerRef.current = new YT.Player(target, {
          width: '100%',
          height: '100%',
          videoId: initialVideoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              ytReadyRef.current = true;
              const player = ytPlayerRef.current;
              if (!player) return;
              if (pendingVideoIdRef.current) {
                player.loadVideoById(pendingVideoIdRef.current);
                pendingVideoIdRef.current = null;
              } else {
                player.playVideo();
              }
            },
            onStateChange: (event) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setEmbedBlockedCode(null);
                setIsVocalPlaying(true);
                onStopAmbientMusic();
              } else if (event.data === 2) {
                setIsVocalPlaying(false);
              } else if (event.data === 0) {
                handleStepVocalTrack('next');
              }
            },
            onError: (event) => {
              setIsVocalPlaying(false);
              setEmbedBlockedCode(event.data || 150);
            },
          },
        });
      })
      .catch(() => {
        setEmbedBlockedCode(150);
      });

    return () => {
      cancelled = true;
    };
  }, [activeVocalTrack, handleStepVocalTrack, onStopAmbientMusic]);

  // Cleanup YouTube player and local object URL on unmount
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl);
      }
    };
  }, [localAudioUrl]);

  const handleToggleVocalPlayPause = () => {
    if (!activeVocalTrack) {
      handleSelectVocalTrack(filteredVocalTracks[0] ?? VOCAL_PLAYLIST[0]);
      return;
    }
    if (!ytPlayerRef.current || !ytReadyRef.current) return;
    playToggleSound();
    if (isVocalPlaying) {
      ytPlayerRef.current.pauseVideo();
      setIsVocalPlaying(false);
    } else {
      onStopAmbientMusic();
      ytPlayerRef.current.playVideo();
      setIsVocalPlaying(true);
    }
  };

  const handleToggleMute = () => {
    playToggleSound();
    const next = !isMuted;
    setIsMuted(next);
    if (ytPlayerRef.current && ytReadyRef.current) {
      if (next) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
      }
    }
    if (localAudioRef.current) {
      localAudioRef.current.muted = next;
    }
  };

  const handleStopAndDismissVocal = () => {
    playCancelSound();
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.stopVideo();
      } catch {
        // ignore
      }
    }
    setActiveVocalTrack(null);
    setIsVocalPlaying(false);
    setEmbedBlockedCode(null);
  };

  const handleUploadLocalAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localAudioUrl) {
      URL.revokeObjectURL(localAudioUrl);
    }
    const url = URL.createObjectURL(file);
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {
        // ignore
      }
    }
    setActiveVocalTrack(null);
    setIsVocalPlaying(false);
    onStopAmbientMusic();
    setLocalAudioUrl(url);
    setLocalAudioName(file.name.replace(/\.[^.]+$/, ''));
    setIsLocalAudioPlaying(true);
    window.setTimeout(() => {
      if (localAudioRef.current) {
        localAudioRef.current.muted = isMuted;
        void localAudioRef.current.play().catch(() => {});
      }
    }, 50);
  };

  const showFloatingBar = !isOpen && Boolean(activeVocalTrack || localAudioUrl);

  return (
    <>
      {/* Hidden audio element for user-uploaded MP3/M4A files */}
      {localAudioUrl && (
        <audio
          ref={localAudioRef}
          src={localAudioUrl}
          onPlay={() => {
            setIsLocalAudioPlaying(true);
            onStopAmbientMusic();
          }}
          onPause={() => setIsLocalAudioPlaying(false)}
          onEnded={() => setIsLocalAudioPlaying(false)}
          className="hidden"
        />
      )}

      {/* Persistent Single-Mount Wrapper (Keeps YT.Player alive while browsing the site!) */}
      <div
        className={
          isOpen
            ? 'fixed inset-0 z-50 bg-[#101419]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6'
            : showFloatingBar
            ? `fixed right-4 z-30 ${
                isStaffMode ? 'bottom-[74px] lg:bottom-4' : 'bottom-4'
              } max-w-[calc(100vw-2rem)] sm:max-w-md`
            : 'hidden'
        }
        onClick={() => {
          if (isOpen) {
            playCancelSound();
            onClose();
          }
        }}
      >
        <div
          role={isOpen ? 'dialog' : undefined}
          aria-modal={isOpen ? 'true' : undefined}
          aria-label="คลังเพลงประจำโครงการ"
          onClick={(e) => e.stopPropagation()}
          className={
            isOpen
              ? 'w-full max-w-5xl max-h-[90dvh] bg-[#FFFEFC] border border-[#E5DEC9] rounded-3xl shadow-[0_28px_80px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden'
              : 'bg-[#14191F]/95 backdrop-blur-xl text-white border border-[#C59B48]/40 rounded-2xl shadow-[0_14px_36px_rgba(0,0,0,0.34)] p-2.5 flex items-center gap-3'
          }
        >
          {/* Modal Top Header (only when drawer is open) */}
          {isOpen && (
            <div className="px-5 sm:px-6 py-4 bg-[#14191F] text-white border-b border-[#C59B48]/25 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#C59B48]/15 border border-[#C59B48]/40 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-[#E5C57B]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold font-display text-white truncate">
                    คลังเพลงบ้านของหัวใจ & เพลงใหม่ LISA
                  </h2>
                  <p className="text-xs text-zinc-400 truncate">
                    เพลงมีคนร้อง {VOCAL_PLAYLIST.length} เพลง · เพลงบรรเลงเกี่ยวกับบ้าน{' '}
                    {LUXURY_AMBIENT_PLAYLIST.length} เพลง
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playCancelSound();
                  onClose();
                }}
                aria-label="ปิดหน้าต่างเพลง"
                className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Main Grid when Open OR Compact Bar Layout when Minimized */}
          <div
            className={
              isOpen
                ? 'flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr] overflow-hidden'
                : 'flex items-center gap-3 min-w-0 w-full'
            }
          >
            {/* LEFT STAGE (Or Compact Mini-Bar Info) */}
            <div
              className={
                isOpen
                  ? 'bg-[#171D24] text-white p-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto shrink-0'
                  : 'flex items-center gap-2.5 min-w-0 flex-1'
              }
            >
              {/* Persistent YouTube Embed Stage */}
              <div
                className={
                  isOpen
                    ? 'relative w-full aspect-video rounded-xl overflow-hidden bg-[#0E1216] border border-white/10 shrink-0'
                    : activeVocalTrack
                    ? 'relative w-16 h-10 rounded-lg overflow-hidden bg-black border border-white/15 shrink-0'
                    : 'hidden'
                }
              >
                <div ref={ytHostRef} className="w-full h-full" />

                {!activeVocalTrack && isOpen && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#1C232C] to-[#101419]">
                    <Disc3 className="w-9 h-9 text-[#E5C57B] mb-2" />
                    <p className="text-sm font-semibold text-white">
                      {localAudioName
                        ? `กำลังเล่นไฟล์: ${localAudioName}`
                        : ambientEnabled
                        ? 'กำลังเล่นเพลงบรรเลงเกี่ยวกับบ้าน'
                        : 'เลือกเพลงที่ต้องการฟังจากรายการด้านขวา'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      กดปุ่มเล่นที่เพลง "บ้านของหัวใจ" หรือเพลงใหม่ของ LISA ได้ทันที
                    </p>
                  </div>
                )}

                {embedBlockedCode !== null && activeVocalTrack && isOpen && (
                  <div className="absolute inset-0 bg-[#101419]/92 p-4 flex flex-col items-center justify-center text-center gap-2.5">
                    <p className="text-xs font-semibold text-[#E5C57B]">
                      ค่ายเพลงจำกัดการเล่นวิดีโอนี้แบบฝังบนเว็บไซต์อื่น
                    </p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      คุณสามารถกดฟังเพลง "{activeVocalTrack.title}" เต็มเพลงบน YouTube หรือข้ามไปเพลงถัดไปได้ทันที
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${activeVocalTrack.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        ฟังบน YouTube
                      </a>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepVocalTrack('next')}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        เพลงถัดไป
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Track Details */}
              <div className={isOpen ? 'space-y-1 min-w-0' : 'min-w-0 flex-1'}>
                {activeVocalTrack ? (
                  <>
                    <div className="text-xs font-semibold text-[#E5C57B] truncate">
                      {activeVocalTrack.artist}
                    </div>
                    <div
                      className={
                        isOpen
                          ? 'text-base font-bold text-white font-display leading-snug'
                          : 'text-xs font-semibold text-white truncate'
                      }
                    >
                      {activeVocalTrack.title}
                    </div>
                    {isOpen && (
                      <div className="text-xs text-zinc-400">
                        {activeVocalTrack.albumOrOrigin} · {activeVocalTrack.moodNote}
                      </div>
                    )}
                  </>
                ) : localAudioName ? (
                  <>
                    <div className="text-xs font-semibold text-[#E5C57B]">ไฟล์เพลงในเครื่อง</div>
                    <div className="text-sm font-bold text-white truncate">{localAudioName}</div>
                  </>
                ) : (
                  isOpen && (
                    <>
                      <div className="text-xs font-semibold text-[#E5C57B]">
                        โหมดเพลงบรรเลงเปียโน (20 เพลง)
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {currentAmbientTrack.title}
                      </div>
                      <div className="text-xs text-zinc-400">{currentAmbientTrack.thaiMood}</div>
                    </>
                  )
                )}
              </div>

              {/* Controls */}
              {isOpen ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playToggleSound();
                        setShuffleMode((s) => !s);
                      }}
                      title={shuffleMode ? 'ปิดการสุ่มเพลง' : 'เปิดการสุ่มเพลง'}
                      className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                        shuffleMode
                          ? 'bg-[#C59B48]/20 border-[#E5C57B] text-[#E5C57B]'
                          : 'bg-white/8 border-white/15 text-zinc-300 hover:bg-white/15'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepVocalTrack('prev')}
                        aria-label="เพลงก่อนหน้า"
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        data-sound="custom"
                        onClick={handleToggleVocalPlayPause}
                        aria-label={isVocalPlaying ? 'หยุดชั่วคราว' : 'เล่นเพลง'}
                        className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-[#E5C57B] hover:bg-[#D4B368] text-[#14191F] cursor-pointer transition-colors shadow-sm"
                      >
                        {isVocalPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepVocalTrack('next')}
                        aria-label="เพลงถัดไป"
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={handleToggleMute}
                      aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียงชั่วคราว'}
                      className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-zinc-300 cursor-pointer transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {activeVocalTrack && (
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVocalTrack.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-200 bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#E5C57B]" />
                      เปิดฟังเพลงนี้บน YouTube Official
                    </a>
                  )}

                  {/* Quick local audio upload & Ambient toggle */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadLocalAudio}
                      className="hidden"
                    />
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-white/6 hover:bg-white/14 border border-white/15 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#E5C57B]" />
                      เปิดไฟล์ MP3 จากเครื่อง
                    </button>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        if (activeVocalTrack) {
                          handleStopAndDismissVocal();
                        }
                        stopLocalAudio();
                        onToggleAmbientMusic();
                      }}
                      className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border cursor-pointer transition-colors whitespace-nowrap ${
                        ambientEnabled && !activeVocalTrack && !isLocalAudioPlaying
                          ? 'bg-[#E5C57B]/20 border-[#E5C57B] text-[#E5C57B]'
                          : 'bg-white/6 border-white/15 text-zinc-300 hover:bg-white/14'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      {ambientEnabled && !activeVocalTrack ? 'ปิดบรรเลง' : 'ฟังบรรเลง'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Compact Floating Mini-Bar Controls */
                <div className="flex items-center gap-1 shrink-0">
                  {activeVocalTrack && (
                    <>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={handleToggleVocalPlayPause}
                        aria-label={isVocalPlaying ? 'หยุด' : 'เล่น'}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-[#E5C57B] text-[#14191F] cursor-pointer"
                      >
                        {isVocalPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepVocalTrack('next')}
                        aria-label="เพลงถัดไป"
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {localAudioUrl && !activeVocalTrack && (
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        if (!localAudioRef.current) return;
                        if (isLocalAudioPlaying) {
                          localAudioRef.current.pause();
                        } else {
                          void localAudioRef.current.play();
                        }
                      }}
                      aria-label={isLocalAudioPlaying ? 'หยุด' : 'เล่น'}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-[#E5C57B] text-[#14191F] cursor-pointer"
                    >
                      {isLocalAudioPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => {
                      playClickSound();
                      onOpen();
                    }}
                    className="h-9 px-2.5 text-xs font-medium text-[#E5C57B] bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    เพลย์ลิสต์
                  </button>

                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => {
                      handleStopAndDismissVocal();
                      stopLocalAudio();
                      setLocalAudioUrl(null);
                      setLocalAudioName(null);
                    }}
                    aria-label="ปิดเครื่องเล่นเพลง"
                    className="w-8 h-9 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PLAYLIST DIRECTORY (only when open) */}
            {isOpen && (
              <div className="flex-1 min-h-0 flex flex-col bg-[#FFFEFC] overflow-hidden">
                {/* Library Mode Tabs + Search */}
                <div className="p-4 sm:p-5 border-b border-[#EAE4D7] space-y-3 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center p-1 bg-[#F3EFE6] rounded-xl border border-[#E5DEC9]">
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => {
                          playClickSound();
                          setLibraryTab('vocal');
                        }}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          libraryTab === 'vocal'
                            ? 'bg-[#14191F] text-[#E5C57B] shadow-2xs'
                            : 'text-zinc-600 hover:text-[#14191F]'
                        }`}
                      >
                        เพลงมีคนร้อง ({VOCAL_PLAYLIST.length})
                      </button>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => {
                          playClickSound();
                          setLibraryTab('ambient');
                        }}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          libraryTab === 'ambient'
                            ? 'bg-[#14191F] text-[#E5C57B] shadow-2xs'
                            : 'text-zinc-600 hover:text-[#14191F]'
                        }`}
                      >
                        เพลงบรรเลงเกี่ยวกับบ้าน ({LUXURY_AMBIENT_PLAYLIST.length})
                      </button>
                    </div>
                  </div>

                  {libraryTab === 'vocal' && (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {VOCAL_CATEGORY_TABS.map((cat) => {
                          const isActive = vocalCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              data-sound="custom"
                              onClick={() => {
                                playClickSound();
                                setVocalCategory(cat.id);
                              }}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                                isActive
                                  ? 'bg-[#FBF7EE] border-[#C59B48] text-[#8A6820] font-semibold'
                                  : 'bg-white border-[#E4DFD3] text-zinc-600 hover:text-[#14191F] hover:border-[#C59B48]/50'
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="ค้นหาชื่อเพลง ศิลปิน หรืออัลบั้ม (เช่น บ้านของหัวใจ, LISA, Alter Ego, Press Play)..."
                          className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-[#FAF8F4] border border-[#E2DDD0] rounded-xl text-[#14191F] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#C59B48]/50 focus:border-[#C59B48]"
                        />
                        {searchText && (
                          <button
                            type="button"
                            onClick={() => setSearchText('')}
                            aria-label="ล้างคำค้นหา"
                            className="w-8 h-8 inline-flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Scrollable Track List */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#EFEAE0]">
                  {libraryTab === 'vocal' ? (
                    filteredVocalTracks.length === 0 ? (
                      <div className="p-10 text-center space-y-2">
                        <p className="text-sm font-medium text-zinc-600">
                          ไม่พบเพลงที่ตรงกับ "{searchText}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchText('');
                            setVocalCategory('all');
                          }}
                          className="px-4 py-2 text-xs font-semibold text-[#14191F] bg-[#F3EFE6] hover:bg-[#EAE4D7] rounded-xl cursor-pointer"
                        >
                          แสดงเพลงทั้งหมด ({VOCAL_PLAYLIST.length} เพลง)
                        </button>
                      </div>
                    ) : (
                      filteredVocalTracks.map((track, idx) => {
                        const isSelected = activeVocalTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className={`px-4 sm:px-5 py-3 flex items-center justify-between gap-3 transition-colors ${
                              isSelected ? 'bg-[#FBF7EE]' : 'hover:bg-[#FAF8F4]'
                            }`}
                          >
                            <button
                              type="button"
                              data-sound="custom"
                              onClick={() => handleSelectVocalTrack(track)}
                              className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                            >
                              <span
                                className={`w-7 text-xs font-mono-tabular shrink-0 ${
                                  isSelected ? 'font-bold text-[#9B7A36]' : 'text-zinc-400'
                                }`}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </span>

                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-[#14191F] text-[#E5C57B]'
                                    : 'bg-[#F3EFE6] text-[#14191F]'
                                }`}
                              >
                                {isSelected && isVocalPlaying ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div
                                  className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-[#14191F]' : 'text-zinc-900'
                                  }`}
                                >
                                  {track.title}
                                </div>
                                <div className="text-xs text-zinc-500 truncate">
                                  <span>{track.artist}</span>
                                  <span aria-hidden="true" className="mx-1.5">
                                    ·
                                  </span>
                                  <span>{track.albumOrOrigin}</span>
                                </div>
                              </div>
                            </button>

                            <a
                              href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`ฟัง ${track.title} บน YouTube`}
                              aria-label={`ฟัง ${track.title} บน YouTube`}
                              className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-[#14191F] hover:bg-[#EFEAE0] shrink-0 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })
                    )
                  ) : (
                    LUXURY_AMBIENT_PLAYLIST.map((track, idx) => {
                      const isActive =
                        !activeVocalTrack &&
                        !isLocalAudioPlaying &&
                        ambientEnabled &&
                        currentAmbientTrack.id === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          data-sound="custom"
                          onClick={() => {
                            playClickSound();
                            handleStopAndDismissVocal();
                            stopLocalAudio();
                            onSelectAmbientTrack(idx);
                          }}
                          className={`w-full px-4 sm:px-5 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                            isActive ? 'bg-[#FBF7EE]' : 'hover:bg-[#FAF8F4]'
                          }`}
                        >
                          <span
                            className={`w-7 text-xs font-mono-tabular shrink-0 ${
                              isActive ? 'font-bold text-[#9B7A36]' : 'text-zinc-400'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-[#14191F] text-[#E5C57B]'
                                : 'bg-[#F3EFE6] text-[#14191F]'
                            }`}
                          >
                            <Music className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[#14191F] truncate">
                              {track.title}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{track.thaiMood}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
