import { useCallback, useEffect } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { playWarpEnterSound } from '../utils/soundEffects';
import { CuteWalkingCats } from './CuteWalkingCats';

interface WelcomeOverlayProps {
  isOpen: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEnter: () => void;
}

export function WelcomeOverlay({
  isOpen,
  soundEnabled,
  onToggleSound,
  onEnter,
}: WelcomeOverlayProps) {
  const handleWarpIntoApp = useCallback(() => {
    playWarpEnterSound();
    onEnter();
  }, [onEnter]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
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
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#101419]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-gavintin-title"
          onClick={handleWarpIntoApp}
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
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
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
                    onClick={onToggleSound}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#E5C57B]" />
                        <span>เสียงเอฟเฟค: เปิด</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-white/60" />
                        <span>เสียงเอฟเฟค: ปิด</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Courtyard Cats Showcase */}
            <div className="px-6 sm:px-8 pt-5 pb-5">
              <CuteWalkingCats />
            </div>

            {/* Bottom Action Bar */}
            <div className="px-6 sm:px-8 pb-6 pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:flex-1">
                <span className="text-xs text-zinc-600">
                  สัมผัสกับน้องแมวประจำโครงการได้เลย หรือกดปุ่มเพื่อเข้าสู่หน้าผังโครงการต่อ
                </span>
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={handleWarpIntoApp}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#14191F] hover:bg-[#232B36] active:scale-[0.98] rounded-xl transition-colors cursor-pointer shadow-sm whitespace-nowrap"
              >
                ปิดหน้าต่างนี้
                <ArrowRight className="w-4 h-4 text-[#E5C57B]" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
