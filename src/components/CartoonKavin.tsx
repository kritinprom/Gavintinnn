import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playClickSound, playMeowSound } from '../utils/soundEffects';

interface CartoonKavinSVGProps {
  className?: string;
  isRunning?: boolean;
  facingRight?: boolean;
}

/**
 * Cute animated Chibi Cartoon Kavin SVG mascot in a tailored luxury consultant suit.
 * Legs and arms animate in a lively running stride, eyes blink periodically,
 * and champagne-gold sparkles float nearby.
 */
export function CartoonKavinSVG({
  className = 'w-28 h-32',
  isRunning = true,
  facingRight = true,
}: CartoonKavinSVGProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 160);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  const stroke = '#1E242B';

  return (
    <motion.svg
      viewBox="0 0 120 136"
      className={`${className} overflow-visible select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.22)]`}
      style={{ transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)' }}
      aria-label="การ์ตูนกวิน ที่ปรึกษาโครงการ"
    >
      {/* Ground running shadow */}
      <motion.ellipse
        cx="60"
        cy="127"
        rx="24"
        ry="4.5"
        fill="rgba(16, 20, 25, 0.25)"
        animate={isRunning ? { rx: [24, 18, 24], opacity: [0.28, 0.16, 0.28] } : {}}
        transition={{ duration: 0.38, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Running motion puffs */}
      {isRunning && (
        <motion.g
          animate={{ opacity: [0, 0.75, 0], x: [-2, -14, -22], scale: [0.6, 1, 1.25] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeOut' }}
        >
          <circle cx="30" cy="122" r="3.5" fill="#F3DC9E" opacity="0.55" />
          <circle cx="22" cy="117" r="2.2" fill="#E5C57B" opacity="0.45" />
        </motion.g>
      )}

      {/* Whole Body Bounce & Slight Forward Lean */}
      <motion.g
        animate={
          isRunning
            ? { y: [0, -6, 0, -5, 0], rotate: [2, 5, 2, 4, 2] }
            : { y: [0, -2, 0], rotate: 0 }
        }
        transition={{
          duration: isRunning ? 0.56 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ originX: '60px', originY: '95px' }}
      >
        {/* Back Arm (swinging) */}
        <motion.g
          style={{ originX: '48px', originY: '76px' }}
          animate={isRunning ? { rotate: [34, -32, 34] } : { rotate: 4 }}
          transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 48 76 C 40 84, 38 93, 42 98"
            fill="none"
            stroke="#7C8594"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 48 76 C 40 84, 38 93, 42 98"
            fill="none"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="42" cy="99" r="4.8" fill="#FBE0CA" stroke={stroke} strokeWidth="2" />
        </motion.g>

        {/* Back Leg */}
        <motion.g
          style={{ originX: '53px', originY: '99px' }}
          animate={isRunning ? { rotate: [-36, 34, -36] } : { rotate: 0 }}
          transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect
            x="48"
            y="98"
            width="10"
            height="18"
            rx="4.5"
            fill="#4B5563"
            stroke={stroke}
            strokeWidth="2.2"
          />
          {/* Dress shoe */}
          <path
            d="M 47 114 H 61 C 63 114, 64 117, 62 119 H 47 Z"
            fill="#14191F"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Front Leg */}
        <motion.g
          style={{ originX: '65px', originY: '99px' }}
          animate={isRunning ? { rotate: [34, -36, 34] } : { rotate: 0 }}
          transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect
            x="60"
            y="98"
            width="10"
            height="18"
            rx="4.5"
            fill="#64748B"
            stroke={stroke}
            strokeWidth="2.2"
          />
          {/* Dress shoe */}
          <path
            d="M 59 114 H 73 C 75 114, 76 117, 74 119 H 59 Z"
            fill="#14191F"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Tailored Grey Luxury Suit Torso */}
        <path
          d="M 43 72 C 43 68, 77 68, 77 72 L 79 100 C 79 102, 76 104, 60 104 C 44 104, 41 102, 41 100 Z"
          fill="#94A3B8"
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />

        {/* Crisp White Dress Shirt V */}
        <path
          d="M 52 70 L 60 88 L 68 70 Z"
          fill="#FFFFFF"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Suit Lapels */}
        <path
          d="M 50 70 L 58 87 L 51 89 L 47 75 Z"
          fill="#64748B"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M 70 70 L 62 87 L 69 89 L 73 75 Z"
          fill="#64748B"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Champagne Gold Tie */}
        <path
          d="M 58.2 73 L 61.8 73 L 63 86 L 60 91 L 57 86 Z"
          fill="#E5C57B"
          stroke="#9A762A"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* Gold Pocket Square */}
        <path d="M 67 82 L 73 82 L 71 78 Z" fill="#F5D06B" />

        {/* Suit Button */}
        <circle cx="60" cy="95" r="1.7" fill="#1E242B" />

        {/* Front Arm (cheerfully waving / holding golden house key) */}
        <motion.g
          style={{ originX: '72px', originY: '75px' }}
          animate={isRunning ? { rotate: [-26, 22, -26] } : { rotate: [-10, 12, -10] }}
          transition={{ duration: 0.42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 72 75 C 82 79, 86 71, 88 64"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 72 75 C 82 79, 86 71, 88 64"
            fill="none"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Cute waving hand */}
          <circle cx="89" cy="61" r="5" fill="#FBE0CA" stroke={stroke} strokeWidth="2" />
          {/* Tiny Golden House Badge / Key glint in hand */}
          <path
            d="M 92 50 L 97 54 H 95.5 V 58 H 88.5 V 54 H 87 Z"
            fill="#F5D06B"
            stroke="#9A762A"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Neck */}
        <rect x="54.5" y="61" width="11" height="10" rx="4" fill="#F6CFB0" />

        {/* Cute Chibi Ears */}
        <circle cx="33" cy="43" r="5.5" fill="#F6CFB0" stroke={stroke} strokeWidth="2.1" />
        <circle cx="87" cy="43" r="5.5" fill="#F6CFB0" stroke={stroke} strokeWidth="2.1" />

        {/* Cute Rounded Chibi Head */}
        <ellipse
          cx="60"
          cy="41"
          rx="26.5"
          ry="24.5"
          fill="#FBE0CA"
          stroke={stroke}
          strokeWidth="2.4"
        />

        {/* Rosy Cheeks */}
        <ellipse cx="44" cy="49" rx="5.2" ry="3" fill="#FDA4AF" opacity="0.65" />
        <ellipse cx="77" cy="49" rx="5.2" ry="3" fill="#FDA4AF" opacity="0.65" />

        {/* Cute Expressive Eyes (blink animation) */}
        {isBlinking ? (
          <g stroke={stroke} strokeWidth="2.3" strokeLinecap="round" fill="none">
            <path d="M 45 42 Q 49.5 45 54 42" />
            <path d="M 67 42 Q 71.5 45 76 42" />
          </g>
        ) : (
          <g>
            {/* Left Eye */}
            <ellipse cx="49.5" cy="42" rx="4.2" ry="4.8" fill="#1F1916" />
            <circle cx="48" cy="40.3" r="1.5" fill="#FFFFFF" />
            <circle cx="51" cy="43.8" r="0.8" fill="#FFFFFF" opacity="0.85" />
            {/* Right Eye */}
            <ellipse cx="71.5" cy="42" rx="4.2" ry="4.8" fill="#1F1916" />
            <circle cx="70" cy="40.3" r="1.5" fill="#FFFFFF" />
            <circle cx="73" cy="43.8" r="0.8" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}

        {/* Friendly Eyebrows */}
        <path
          d="M 44 34.5 Q 49.5 32.5 54.5 34.5"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 66.5 34.5 Q 71.5 32.5 77 34.5"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Cute Small Nose & Big Happy Smile */}
        <circle cx="61.5" cy="47" r="1.1" fill="#D99B78" />
        <path
          d="M 53.5 51.5 Q 61 58.5 68.5 51.5"
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Happy tongue/smile tint */}
        <path d="M 56.5 53 Q 61 57.5 65.5 53 Z" fill="#FB7185" opacity="0.85" />

        {/* Neat Stylish Short Dark Hair (Chibi Bangs) */}
        <path
          d="M 33 41 C 32 23, 45 12, 61 12 C 78 12, 89 23, 87 40 C 84 31, 78 26, 72 28 C 67 24, 59 25, 55 30 C 49 26, 42 29, 39 34 C 36 36, 34 38, 33 41 Z"
          fill="#221E1D"
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        {/* Subtle hair shine */}
        <path
          d="M 48 19 Q 60 16 72 20"
          fill="none"
          stroke="#4B4442"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Tiny Floating Champagne Sparkles */}
        <motion.path
          d="M 98 24 L 100 28 L 104 30 L 100 32 L 98 36 L 96 32 L 92 30 L 96 28 Z"
          fill="#F5D06B"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '98px', originY: '30px' }}
        />
      </motion.g>
    </motion.svg>
  );
}

interface CartoonKavinPlaygroundProps {
  compact?: boolean;
  onCheer?: () => void;
}

/**
 * Center-stage interactive running track for Cartoon Kavin (used on intro & customer page).
 * Gavin runs happily left-to-right and flips direction smoothly when turning back.
 */
export function CartoonKavinPlayground({
  compact = false,
  onCheer,
}: CartoonKavinPlaygroundProps) {
  const [facingRight, setFacingRight] = useState(true);
  const [cheerBurst, setCheerBurst] = useState(false);

  // Sync character facing direction with the 8-second loop
  useEffect(() => {
    const durationMs = compact ? 6400 : 7600;
    const half = durationMs / 2;
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - start) % durationMs;
      setFacingRight(elapsed < half);
    }, 250);
    return () => window.clearInterval(id);
  }, [compact]);

  const handleTapKavin = () => {
    playMeowSound();
    setCheerBurst(true);
    onCheer?.();
    window.setTimeout(() => setCheerBurst(false), 1100);
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${
        compact ? 'h-[126px] sm:h-[138px]' : 'h-[210px] sm:h-[235px]'
      }`}
    >
      {/* Subtle Architectural Running Horizon Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 bottom-4 h-px bg-gradient-to-r from-transparent via-[#C59B48]/50 to-transparent"
      />

      {/* Running Cartoon Gavin */}
      <div className="relative w-full h-full flex items-end justify-center pb-3">
        <motion.div
          animate={{
            x: compact ? ['-26%', '26%', '-26%'] : ['-30%', '30%', '-30%'],
          }}
          transition={{
            duration: compact ? 6.4 : 7.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full flex justify-center"
        >
          <button
            type="button"
            data-sound="custom"
            onClick={(e) => {
              e.stopPropagation();
              handleTapKavin();
            }}
            aria-label="การ์ตูนกวินกำลังวิ่งเล่น"
            className="relative group flex flex-col items-center cursor-pointer focus:outline-none"
          >
            {/* Cheerful Speech Bubble */}
            <AnimatePresence>
              {cheerBurst && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: -4, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-1 px-3 py-1 rounded-xl bg-[#F5D06B] text-[#14191F] text-[11px] font-bold shadow-md whitespace-nowrap"
                >
                  พร้อมเช็คผลสินเชื่อแล้วค้าบบ!
                </motion.div>
              )}
            </AnimatePresence>

            <CartoonKavinSVG
              isRunning
              facingRight={facingRight}
              className={compact ? 'w-20 h-24 sm:w-24 sm:h-28' : 'w-32 h-36 sm:w-40 sm:h-44'}
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Playful floating Cartoon Kavin running along the bottom edge of the web page.
 * Pointer-events-none on the track so it never blocks form inputs or page buttons.
 */
export function FloatingCartoonKavin({
  onOpenLoanTab,
}: {
  onOpenLoanTab?: () => void;
}) {
  const [facingRight, setFacingRight] = useState(true);
  const [showBubble, setShowBubble] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cycleMs = 18000;
    const half = cycleMs / 2;
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - start) % cycleMs;
      setFacingRight(elapsed < half);
    }, 300);
    return () => window.clearInterval(id);
  }, []);

  if (dismissed) return null;

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-28 overflow-hidden"
    >
      <motion.div
        animate={{ x: ['-15vw', '78vw', '-15vw'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1 left-0 flex items-end"
      >
        <div className="pointer-events-auto relative flex flex-col items-center group">
          {showBubble && (
            <div className="mb-0.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14191F]/92 text-[#F7E3AC] border border-[#C59B48]/45 text-[10px] sm:text-[11px] font-semibold shadow-md whitespace-nowrap backdrop-blur-xs">
              <span>มาเช็คผลสินเชื่อกับกวินนะค้าบบ</span>
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playClickSound();
                  setDismissed(true);
                }}
                aria-label="พักการ์ตูนกวินชั่วคราว"
                className="ml-1 text-zinc-400 hover:text-white cursor-pointer leading-none"
              >
                ×
              </button>
            </div>
          )}

          <button
            type="button"
            data-sound="custom"
            onClick={() => {
              playClickSound();
              setShowBubble((v) => !v);
              onOpenLoanTab?.();
            }}
            title="มาเช็คผลสินเชื่อกับกวินนะค้าบบ"
            className="cursor-pointer focus:outline-none hover:scale-105 transition-transform"
          >
            <CartoonKavinSVG
              isRunning
              facingRight={facingRight}
              className="w-16 h-[74px] sm:w-[74px] sm:h-[84px]"
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
