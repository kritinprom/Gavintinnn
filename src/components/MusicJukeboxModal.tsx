import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Disc3,
  Music,
  Pause,
  Play,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  LUXURY_CATEGORY_TABS,
  LUXURY_PLAYLIST,
  LuxuryCategory,
  LuxuryTrack,
  luxuryMusicEngine,
} from '../utils/luxuryMusic';
import {
  playCancelSound,
  playClickSound,
  playToggleSound,
} from '../utils/soundEffects';

interface MusicJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  isStaffMode: boolean;
  onMusicActiveChange?: (activeTrack: LuxuryTrack | null, isPlaying: boolean) => void;
}

function formatSeconds(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MusicJukeboxModal({
  isOpen,
  onClose,
  onOpen,
  isStaffMode,
  onMusicActiveChange,
}: MusicJukeboxModalProps) {
  const [category, setCategory] = useState<LuxuryCategory>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [activeTrack, setActiveTrack] = useState<LuxuryTrack | null>(
    () => luxuryMusicEngine.getSnapshot().track ?? LUXURY_PLAYLIST[0]
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(
    () => luxuryMusicEngine.getSnapshot().playing
  );
  const [waitingForGesture, setWaitingForGesture] = useState<boolean>(
    () => luxuryMusicEngine.getSnapshot().waitingForGesture
  );
  const [isMuted, setIsMuted] = useState<boolean>(
    () => luxuryMusicEngine.getSnapshot().muted
  );
  const [volume, setVolume] = useState<number>(() =>
    Math.round(luxuryMusicEngine.getSnapshot().volume * 100)
  );
  const [shuffleMode, setShuffleMode] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(
    () => luxuryMusicEngine.getSnapshot().elapsedSec
  );
  const [durationSec, setDurationSec] = useState<number>(
    () => luxuryMusicEngine.getSnapshot().durationSec
  );

  // Optional user-uploaded local audio file (MP3/M4A/WAV)
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const [isLocalAudioPlaying, setIsLocalAudioPlaying] = useState<boolean>(false);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTrackRef = useRef<LuxuryTrack | null>(null);
  const filteredTracksRef = useRef<LuxuryTrack[]>(LUXURY_PLAYLIST);
  const shuffleModeRef = useRef<boolean>(false);
  const stepTrackRef = useRef<(direction: 'next' | 'prev') => void>(() => {});

  useEffect(() => {
    activeTrackRef.current = activeTrack;
  }, [activeTrack]);

  useEffect(() => {
    shuffleModeRef.current = shuffleMode;
  }, [shuffleMode]);

  useEffect(() => {
    onMusicActiveChange?.(
      activeTrack,
      (isPlaying && !waitingForGesture) || isLocalAudioPlaying
    );
  }, [activeTrack, isPlaying, waitingForGesture, isLocalAudioPlaying, onMusicActiveChange]);

  const filteredTracks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return LUXURY_PLAYLIST.filter((track) => {
      if (category !== 'all' && track.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        track.title.toLowerCase().includes(q) ||
        track.subtitle.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q) ||
        track.moodNote.toLowerCase().includes(q)
      );
    });
  }, [category, searchText]);

  useEffect(() => {
    filteredTracksRef.current =
      filteredTracks.length > 0 ? filteredTracks : LUXURY_PLAYLIST;
  }, [filteredTracks]);

  const stopLocalAudio = useCallback(() => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
    }
    setIsLocalAudioPlaying(false);
  }, []);

  const handleSelectTrack = useCallback(
    (track: LuxuryTrack) => {
      playClickSound();
      stopLocalAudio();
      setActiveTrack(track);
      setElapsedSec(0);
      setDurationSec(track.durationSec);
      setIsPlaying(true);
      luxuryMusicEngine.setVolume(volume / 100);
      luxuryMusicEngine.setMuted(isMuted);
      luxuryMusicEngine.start(track, () => {
        stepTrackRef.current('next');
      });
    },
    [isMuted, stopLocalAudio, volume]
  );

  const handleStepTrack = useCallback(
    (direction: 'next' | 'prev') => {
      const pool = filteredTracksRef.current;
      if (pool.length === 0) return;

      const current = activeTrackRef.current;
      if (!current) {
        handleSelectTrack(pool[0]);
        return;
      }

      if (shuffleModeRef.current && pool.length > 1) {
        let randomIdx = Math.floor(Math.random() * pool.length);
        if (pool[randomIdx].id === current.id) {
          randomIdx = (randomIdx + 1) % pool.length;
        }
        handleSelectTrack(pool[randomIdx]);
        return;
      }

      const idx = pool.findIndex((t) => t.id === current.id);
      if (idx === -1) {
        handleSelectTrack(pool[0]);
        return;
      }
      const nextIdx =
        direction === 'next' ? (idx + 1) % pool.length : (idx - 1 + pool.length) % pool.length;
      handleSelectTrack(pool[nextIdx]);
    },
    [handleSelectTrack]
  );

  useEffect(() => {
    stepTrackRef.current = handleStepTrack;
  }, [handleStepTrack]);

  // Subscribe to hit music engine and enable auto-play automatically on mount
  useEffect(() => {
    const unsubscribe = luxuryMusicEngine.subscribe((snap) => {
      setActiveTrack(snap.track);
      setIsPlaying(snap.playing);
      setWaitingForGesture(snap.waitingForGesture);
      setIsMuted(snap.muted);
      setVolume(Math.round(snap.volume * 100));
      setElapsedSec(snap.elapsedSec);
      setDurationSec(snap.durationSec);
    });

    luxuryMusicEngine.enableAutoPlay(() => {
      stepTrackRef.current('next');
    });

    return () => {
      unsubscribe();
      luxuryMusicEngine.stop();
    };
  }, []);

  // Revoke local object URL cleanly when changed or unmounted
  useEffect(() => {
    return () => {
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl);
      }
    };
  }, [localAudioUrl]);

  // Close drawer with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTogglePlayPause = () => {
    if (!activeTrack) {
      handleSelectTrack(filteredTracks[0] ?? LUXURY_PLAYLIST[0]);
      return;
    }
    playToggleSound();
    if (waitingForGesture) {
      luxuryMusicEngine.unlockFromGesture();
      return;
    }
    if (isPlaying) {
      luxuryMusicEngine.pause();
    } else {
      luxuryMusicEngine.resume();
    }
  };

  const handleToggleMute = () => {
    playToggleSound();
    const next = !isMuted;
    setIsMuted(next);
    luxuryMusicEngine.setMuted(next);
    if (localAudioRef.current) {
      localAudioRef.current.muted = next;
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    if (isMuted && nextVol > 0) {
      setIsMuted(false);
      luxuryMusicEngine.setMuted(false);
    }
    luxuryMusicEngine.setVolume(nextVol / 100);
    if (localAudioRef.current) {
      localAudioRef.current.volume = nextVol / 100;
    }
  };

  const handleStopAndDismiss = () => {
    playCancelSound();
    luxuryMusicEngine.stop();
    setActiveTrack(null);
    setIsPlaying(false);
    setElapsedSec(0);
  };

  const handleUploadLocalAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localAudioUrl) {
      URL.revokeObjectURL(localAudioUrl);
    }
    const url = URL.createObjectURL(file);
    luxuryMusicEngine.stop();
    setActiveTrack(null);
    setIsPlaying(false);
    setElapsedSec(0);
    setLocalAudioUrl(url);
    setLocalAudioName(file.name.replace(/\.[^.]+$/, ''));
    setIsLocalAudioPlaying(true);
    window.setTimeout(() => {
      if (localAudioRef.current) {
        localAudioRef.current.muted = isMuted;
        localAudioRef.current.volume = volume / 100;
        void localAudioRef.current.play().catch(() => {});
      }
    }, 50);
  };

  const showFloatingBar = !isOpen && !waitingForGesture && Boolean(activeTrack || localAudioUrl);
  const progressPct = activeTrack
    ? Math.min(100, (elapsedSec / Math.max(1, durationSec || activeTrack.durationSec)) * 100)
    : 0;

  return (
    <>
      {/* Hidden audio element for optional user-uploaded MP3/M4A files */}
      {localAudioUrl && (
        <audio
          ref={localAudioRef}
          src={localAudioUrl}
          onPlay={() => setIsLocalAudioPlaying(true)}
          onPause={() => setIsLocalAudioPlaying(false)}
          onEnded={() => setIsLocalAudioPlaying(false)}
          className="hidden"
        />
      )}

      {/* Modal / Minimized Mini-Bar Wrapper */}
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
          aria-label="คลังเพลงฮิตประจำโครงการ"
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
                    Top 100 Hit Songs · เพลงฮิตเต็มเพลง (ไทย &amp; สากล)
                  </h2>
                  <p className="text-xs text-zinc-400 truncate">
                    รวมเพลงฮิตฉบับเต็ม {LUXURY_PLAYLIST.length} เพลง เล่นต่อเนื่องอัตโนมัติ (T-Pop · ไทยป๊อป · Global Hits · R&amp;B)
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
              {/* Hit Song Album Cover & Soundstage */}
              {isOpen ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#1F2731] via-[#13181F] to-[#0D1015] border border-[#C59B48]/25 p-4 flex flex-col items-center justify-center text-center shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(197,155,72,0.16),transparent_65%)] pointer-events-none" />

                  {activeTrack?.artworkUrl ? (
                    <div className="relative mb-2.5 flex items-center justify-center">
                      <img
                        src={activeTrack.artworkUrl}
                        alt={activeTrack.title}
                        referrerPolicy="no-referrer"
                        className={`relative z-10 w-20 h-20 rounded-2xl object-cover border border-[#E5C57B]/60 shadow-[0_10px_28px_rgba(0,0,0,0.5)] transition-transform duration-500 ${
                          isPlaying ? 'scale-105' : 'opacity-85'
                        }`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`relative w-16 h-16 rounded-full border flex items-center justify-center mb-3 transition-transform duration-700 ${
                        isPlaying || isLocalAudioPlaying
                          ? 'border-[#E5C57B]/70 bg-[#C59B48]/15 scale-105'
                          : 'border-white/15 bg-white/5'
                      }`}
                    >
                      <Disc3
                        className={`w-8 h-8 text-[#E5C57B] ${
                          isPlaying || isLocalAudioPlaying ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '8s' }}
                      />
                    </div>
                  )}

                  {/* Subtle Equalizer Bars */}
                  <div className="flex items-end justify-center gap-1.5 h-5 mb-1.5" aria-hidden="true">
                    {[12, 20, 15, 22, 13, 18, 10].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-gradient-to-t from-[#C59B48] to-[#F3DC9E] transition-all duration-300 ${
                          isPlaying || isLocalAudioPlaying ? 'animate-pulse' : 'opacity-35'
                        }`}
                        style={{
                          height: isPlaying || isLocalAudioPlaying ? `${h}px` : '5px',
                          animationDelay: `${i * 110}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <p className="relative text-[11px] font-medium text-[#E5C57B] tracking-wide uppercase">
                    {activeTrack
                      ? waitingForGesture
                        ? 'แตะเพื่อเปิดเสียงเพลงฮิต'
                        : isPlaying
                        ? 'Now Playing · Full Track'
                        : 'Paused'
                      : localAudioName
                      ? 'Local Audio File'
                      : 'CENTRO Top 100 Hits'}
                  </p>
                </div>
              ) : activeTrack?.artworkUrl ? (
                <img
                  src={activeTrack.artworkUrl}
                  alt={activeTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover border border-[#C59B48]/45 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#C59B48]/15 border border-[#C59B48]/35 flex items-center justify-center shrink-0">
                  <Disc3
                    className={`w-4 h-4 text-[#E5C57B] ${
                      isPlaying || isLocalAudioPlaying ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: '6s' }}
                  />
                </div>
              )}

              {/* Active Track Details */}
              <div className={isOpen ? 'space-y-1.5 min-w-0' : 'min-w-0 flex-1'}>
                {activeTrack ? (
                  <>
                    <div className="text-xs font-semibold text-[#E5C57B] truncate">
                      {activeTrack.subtitle}
                    </div>
                    <div
                      className={
                        isOpen
                          ? 'text-base font-bold text-white font-display leading-snug'
                          : 'text-xs font-semibold text-white truncate'
                      }
                    >
                      {activeTrack.title}
                    </div>
                    {isOpen && (
                      <div className="text-xs text-zinc-400 leading-relaxed">
                        {activeTrack.moodNote}
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
                      <div className="text-xs font-semibold text-[#E5C57B] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        คลังเพลงฮิตประจำโครงการ ({LUXURY_PLAYLIST.length} เพลง)
                      </div>
                      <div className="text-sm font-bold text-white">
                        พร้อมเล่นทันทีไม่มีสะดุด
                      </div>
                      <div className="text-xs text-zinc-400">
                        เลือกเพลงฮิตไทยหรือสากลยอดนิยมจากรายการด้านขวา
                      </div>
                    </>
                  )
                )}
              </div>

              {/* Progress Bar (Seekable for full-length songs) */}
              {isOpen && activeTrack && (
                <div className="space-y-1.5">
                  <div
                    role="slider"
                    aria-label="เลื่อนเวลาเพลง"
                    aria-valuemin={0}
                    aria-valuemax={durationSec || activeTrack.durationSec}
                    aria-valuenow={Math.round(elapsedSec)}
                    tabIndex={0}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      luxuryMusicEngine.seekTo(ratio * (durationSec || activeTrack.durationSec));
                    }}
                    className="w-full h-2 rounded-full bg-white/15 overflow-hidden cursor-pointer group"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#C59B48] to-[#F0D48F] rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular text-zinc-400">
                    <span>{formatSeconds(elapsedSec)}</span>
                    <span>{formatSeconds(durationSec || activeTrack.durationSec)}</span>
                  </div>
                </div>
              )}

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
                        onClick={() => handleStepTrack('prev')}
                        aria-label="เพลงก่อนหน้า"
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        data-sound="custom"
                        onClick={handleTogglePlayPause}
                        aria-label={isPlaying ? 'หยุดชั่วคราว' : 'เล่นเพลง'}
                        className="w-12 h-12 inline-flex items-center justify-center rounded-xl bg-[#E5C57B] hover:bg-[#D4B368] text-[#14191F] cursor-pointer transition-colors shadow-sm"
                      >
                        {isPlaying && !waitingForGesture ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepTrack('next')}
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

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="text-[11px] text-zinc-400 shrink-0">ระดับเสียง</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label="ระดับเสียงเพลงฮิต"
                      className="w-full accent-[#E5C57B] cursor-pointer h-1.5"
                    />
                    <span className="text-[11px] font-mono-tabular text-zinc-300 w-8 text-right">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>

                  {/* Quick local audio upload */}
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
                      className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-white/6 hover:bg-white/14 border border-white/15 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#E5C57B]" />
                      เปิดไฟล์เพลง MP3 / M4A จากเครื่อง
                    </button>
                  </div>
                </div>
              ) : (
                /* Compact Floating Mini-Bar Controls */
                <div className="flex items-center gap-1 shrink-0">
                  {activeTrack && (
                    <>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={handleTogglePlayPause}
                        aria-label={isPlaying ? 'หยุด' : 'เล่น'}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-[#E5C57B] text-[#14191F] cursor-pointer"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => handleStepTrack('next')}
                        aria-label="เพลงถัดไป"
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {localAudioUrl && !activeTrack && (
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
                      handleStopAndDismiss();
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

            {/* RIGHT PLAYLIST DIRECTORY (only when open) — 20 Hit Songs */}
            {isOpen && (
              <div className="flex-1 min-h-0 flex flex-col bg-[#FFFEFC] overflow-hidden">
                {/* Category Filter Tabs + Search */}
                <div className="p-4 sm:p-5 border-b border-[#EAE4D7] space-y-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {LUXURY_CATEGORY_TABS.map((cat) => {
                      const isActive = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          data-sound="custom"
                          onClick={() => {
                            playClickSound();
                            setCategory(cat.id);
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-[#14191F] border-[#14191F] text-[#E5C57B] font-semibold shadow-2xs'
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
                      placeholder="ค้นหาชื่อเพลงฮิต ชื่อศิลปิน หรือแนวเพลง (เช่น Jeff Satur, NONT TANONT, ROSÉ, LISA)..."
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
                </div>

                {/* Scrollable Hit Song Track List */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#EFEAE0]">
                  {filteredTracks.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="text-sm font-medium text-zinc-600">
                        ไม่พบเพลงที่ตรงกับ "{searchText}"
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchText('');
                          setCategory('all');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-[#14191F] bg-[#F3EFE6] hover:bg-[#EAE4D7] rounded-xl cursor-pointer"
                      >
                        แสดงเพลงทั้งหมด ({LUXURY_PLAYLIST.length} เพลง)
                      </button>
                    </div>
                  ) : (
                    filteredTracks.map((track) => {
                      const isSelected = activeTrack?.id === track.id;
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
                            onClick={() => handleSelectTrack(track)}
                            className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                          >
                            <span
                              className={`w-7 text-xs font-mono-tabular shrink-0 ${
                                isSelected ? 'font-bold text-[#9B7A36]' : 'text-zinc-400'
                              }`}
                            >
                              {String(track.number).padStart(2, '0')}
                            </span>

                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-[#14191F]">
                              <img
                                src={track.artworkUrl}
                                alt={track.title}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover transition-opacity ${
                                  isSelected ? 'opacity-45' : 'opacity-90'
                                }`}
                              />
                              <div
                                className={`absolute inset-0 flex items-center justify-center ${
                                  isSelected
                                    ? 'text-[#E5C57B] bg-black/25'
                                    : 'text-white/95 bg-black/20 opacity-0 hover:opacity-100 transition-opacity'
                                }`}
                              >
                                {isSelected && isPlaying && !waitingForGesture ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </div>
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
                                <span className="font-medium text-zinc-700">{track.artist}</span>
                                <span aria-hidden="true" className="mx-1.5">
                                  ·
                                </span>
                                <span>{track.moodNote}</span>
                              </div>
                            </div>
                          </button>

                          <span className="text-xs font-mono-tabular text-zinc-400 shrink-0">
                            {formatSeconds(track.durationSec)}
                          </span>
                        </div>
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
