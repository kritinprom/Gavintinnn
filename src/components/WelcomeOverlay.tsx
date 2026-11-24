import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Music, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActiveTab } from '../types/project';
import {
  ChristmasTrack,
  getCurrentChristmasTrack,
  subscribeChristmasTrack,
} from '../utils/christmasMusic';
import { playToggleSound, playWarpEnterSound } from '../utils/soundEffects';
import { CuteWalkingCats } from './CuteWalkingCats';

interface WelcomeOverlayProps {
  isOpen: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  onNextTrack: () => void;
  onEnter: (tab: ActiveTab) => void;
}

const AUTO_WARP_MS = 2900;

export function WelcomeOverlay({
  isOpen,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  onNextTrack,
  onEnter,
}: WelcomeOverlayProps) {
  const [autoWarpPaused, setAutoWarpPaused] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<ChristmasTrack>(() => getCurrentChristmasTrack());

  useEffect(() => {
    return subscribeChristmasTrack(setCurrentTrack);
  }, []);

  const handleWarpIntoApp = useCallback(() => {
    playWarpEnterSound();
    onEnter('plan');
  }, [onEnter]);

  useEffect(() => {
    if (isOpen) {
      setAutoWarpPaused(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || autoWarpPaused) return;
    const timer = window.setTimeout(() => {
      handleWarpIntoApp();
    }, AUTO_WARP_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoWarpPaused, handleWarpIntoApp]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleWarpIntoApp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleWarpIntoApp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#101419]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-gavintin-title"
        >
          {/* Real House Twilight Architectural Backdrop */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <img
              src="/assets/aistudio/image_fb8b8a7e.png"
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-35 scale-105 blur-[1.5px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 35%, rgba(28, 35, 43, 0.56), rgba(20, 25, 31, 0.88) 70%, rgba(12, 15, 20, 0.96) 100%)',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-3xl w-full max-h-[92dvh] overflow-y-auto bg-[#FFFEFC] text-[#14191F] rounded-3xl shadow-[0_28px_80px_rgba(0,0,0,0.45)] border border-[#E5DEC9]"
          >
            {/* Luxury Obsidian Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#14191F] via-[#1C232B] to-[#101419] px-6 sm:px-8 pt-6 pb-5 text-white border-b border-[#C59B48]/25">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#C59B48]/15 border border-[#C59B48]/45 flex items-center justify-center font-display text-lg font-bold text-[#E5C57B] shrink-0">
                    C
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#E5C57B]">
                      CENTRO พระราม 2 - พุทธบูชา 2 · Private Luxury Residence
                    </p>
                    <h1
                      id="welcome-gavintin-title"
                      className="mt-0.5 text-2xl sm:text-4xl font-bold font-display tracking-[0.08em] text-white"
                    >
                      GAVINTIN
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={onToggleMusic}
                    className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                      musicEnabled
                        ? 'bg-white/15 border-[#E5C57B]/50 text-white hover:bg-white/25'
                        : 'bg-white/8 border-white/20 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-[#E5C57B]' : 'text-white/60'}`} />
                    <span>{musicEnabled ? 'เพลง: เปิด' : 'เพลง: ปิด'}</span>
                  </button>

                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => {
                      setAutoWarpPaused(true);
                      playToggleSound();
                      onNextTrack();
                    }}
                    title={`เปลี่ยนบทเพลง (กำลังเล่น: ${currentTrack.title})`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#E5C57B] bg-white/10 hover:bg-white/20 border border-[#C59B48]/35 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span className="max-w-[130px] truncate">{currentTrack.title}</span>
                  </button>

                  <button
                    type="button"
                    data-sound="custom"
                    onClick={onToggleSound}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#E5C57B]" />
                        <span>เสียง: เปิด</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-white/60" />
                        <span>เสียง: ปิด</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Courtyard Cats Showcase */}
            <div className="px-6 sm:px-8 pt-5 pb-5">
              <CuteWalkingCats onCatInteract={() => setAutoWarpPaused(true)} />
            </div>

            {/* Bottom Warp Bar */}
            <div className="px-6 sm:px-8 pb-6 pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:flex-1 flex flex-col gap-1.5">
                {!autoWarpPaused ? (
                  <>
                    <span className="text-xs text-zinc-600">
                      กำลังพาเข้าสู่เว็บไซต์ผังโครงการ...
                    </span>
                    <div className="h-1.5 w-full max-w-xs bg-[#E8E5DD] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTO_WARP_MS / 1000, ease: 'linear' }}
                        className="h-full rounded-full bg-gradient-to-r from-[#14191F] via-[#C59B48] to-[#E5C57B]"
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-600">
                    สัมผัสกับน้องแมวประจำโครงการได้เลย หรือกดปุ่มเพื่อเข้าสู่เว็บไซต์
                  </span>
                )}
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={handleWarpIntoApp}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#14191F] hover:bg-[#232B36] active:scale-[0.98] rounded-xl transition-colors cursor-pointer shadow-sm whitespace-nowrap"
              >
                เข้าสู่เว็บไซต์เลย
                <ArrowRight className="w-4 h-4 text-[#E5C57B]" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
