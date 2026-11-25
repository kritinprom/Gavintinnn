import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Music, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LuxuryEngineSnapshot,
  luxuryMusicEngine,
} from '../utils/luxuryMusic';
import { playClickSound, playWarpEnterSound } from '../utils/soundEffects';
import { CartoonKavinPlayground } from './CartoonKavin';

interface KavinIntroOverlayProps {
  isOpen: boolean;
  onEnter: () => void;
}

export function KavinIntroOverlay({ isOpen, onEnter }: KavinIntroOverlayProps) {
  const [musicSnap, setMusicSnap] = useState<LuxuryEngineSnapshot>(() =>
    luxuryMusicEngine.getSnapshot()
  );

  useEffect(() => {
    return luxuryMusicEngine.subscribe(setMusicSnap);
  }, []);

  const handleEnter = useCallback(() => {
    luxuryMusicEngine.unlockFromGesture();
    playWarpEnterSound();
    onEnter();
  }, [onEnter]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleEnter]);

  const handleToggleIntroMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    if (musicSnap.waitingForGesture || !musicSnap.playing) {
      luxuryMusicEngine.unlockFromGesture();
      if (musicSnap.muted) {
        luxuryMusicEngine.setMuted(false);
      }
      return;
    }
    luxuryMusicEngine.setMuted(!musicSnap.muted);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleEnter}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kavin-intro-headline"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0E1217]/90 backdrop-blur-md"
        >
          {/* Architectural House Backdrop */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <img
              src="/assets/aistudio/image_fb8b8a7e.png"
              alt="ภาพบ้านเดี่ยวโครงการ CENTRO พระราม 2 - พุทธบูชา 2"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-40 scale-105 blur-[1px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, rgba(28, 35, 46, 0.45), rgba(14, 18, 23, 0.88) 72%, rgba(9, 12, 16, 0.96) 100%)',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              luxuryMusicEngine.unlockFromGesture();
            }}
            className="relative z-10 w-full max-w-3xl bg-[#14191F] text-white rounded-3xl border border-[#C59B48]/40 shadow-[0_32px_90px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            {/* Subtle Top Editorial Header */}
            <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#101419]/75">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-medium text-[#E5C57B] tracking-wide">
                  CENTRO พระราม 2 - พุทธบูชา 2 · Mortgage Concierge
                </div>
                <div className="text-sm sm:text-base font-bold font-display text-white tracking-wider">
                  GAVINTIN
                </div>
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={handleToggleIntroMusic}
                className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-[#C59B48]/35 bg-[#C59B48]/12 hover:bg-[#C59B48]/22 text-[#F2D999] transition-colors cursor-pointer whitespace-nowrap max-w-[260px]"
              >
                {musicSnap.muted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                ) : musicSnap.waitingForGesture ? (
                  <Music className="w-3.5 h-3.5 text-[#E5C57B] shrink-0" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#E5C57B] shrink-0" />
                )}
                <span className="truncate">
                  {musicSnap.muted
                    ? 'ปิดเสียงเพลงอยู่ (กดเปิด)'
                    : musicSnap.waitingForGesture
                    ? 'แตะเพื่อเปิดเพลงฮิตอัตโนมัติ'
                    : `กำลังเล่น: ${musicSnap.track?.title ?? 'Top Hit'}`}
                </span>
              </button>
            </div>

            {/* Center Running / Gliding Cartoon Kavin Stage */}
            <div className="relative px-4 sm:px-8 pt-4 pb-5 bg-gradient-to-b from-[#171D26] via-[#131820] to-[#10141A] overflow-hidden">
              {/* Warm Champagne Ambient Stage Spotlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-56 bg-[radial-gradient(ellipse_at_center,rgba(229,197,123,0.20)_0%,rgba(197,155,72,0.06)_48%,transparent_75%)]"
              />

              {/* Animated Cute Cartoon Kavin Running Playfully */}
              <CartoonKavinPlayground />

              {/* Center Greeting Headline */}
              <div className="relative z-10 mt-1 text-center space-y-2 max-w-xl mx-auto">
                <h1
                  id="kavin-intro-headline"
                  className="text-xl sm:text-3xl font-bold font-display text-[#F7E3AC] leading-snug text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                >
                  “มาเช็คผลสินเชื่อกับกวินกันนะค้าบบ”
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  ที่ปรึกษาฝ่ายขายและสินเชื่อธนาคาร · ตรวจสอบผลอนุมัติรายธนาคารได้ทันทีอย่างเป็นส่วนตัว
                </p>
              </div>
            </div>

            {/* Bottom CTA Bar */}
            <div className="px-5 sm:px-8 py-4 sm:py-5 bg-[#101419] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-400 text-center sm:text-left">
                กดปุ่มด้านขวาเพื่อเข้าหน้าเช็คสถานะสินเชื่อ พร้อมเปิดเพลงฮิตเพราะๆ คลออัตโนมัติ
              </span>

              <button
                type="button"
                data-sound="custom"
                onClick={handleEnter}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#14191F] bg-gradient-to-r from-[#E5C57B] to-[#F3DC9E] hover:from-[#D8B567] hover:to-[#E8CE88] active:scale-[0.98] rounded-xl transition-all cursor-pointer shadow-[0_8px_24px_rgba(229,197,123,0.28)] whitespace-nowrap"
              >
                เช็คผลสินเชื่อเลย
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
