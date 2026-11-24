import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playClickSound, playMeowSound } from '../utils/soundEffects';

interface CatSpec {
  id: string;
  name: string;
  bodyFill: string;
  bellyFill: string;
  earInner: string;
  accentFill: string;
  collarFill: string;
  eyeColor: string;
  variant: 'tabby' | 'calico' | 'snow' | 'siamese' | 'grey';
  targetPercent: number;
  walkDelay: number;
  walkDuration: number;
}

const FIVE_CATS: CatSpec[] = [
  {
    id: 'cat-1',
    name: 'ส้ม',
    bodyFill: '#F4A261',
    bellyFill: '#FFF3E2',
    earInner: '#F9A8D4',
    accentFill: '#D97724',
    collarFill: '#14191F',
    eyeColor: '#27272A',
    variant: 'tabby',
    targetPercent: 83,
    walkDelay: 0.05,
    walkDuration: 1.55,
  },
  {
    id: 'cat-2',
    name: 'สามสี',
    bodyFill: '#FFFDF9',
    bellyFill: '#FFFDF9',
    earInner: '#F9A8D4',
    accentFill: '#E07A38',
    collarFill: '#C59B48',
    eyeColor: '#27272A',
    variant: 'calico',
    targetPercent: 66.5,
    walkDelay: 0.25,
    walkDuration: 1.55,
  },
  {
    id: 'cat-3',
    name: 'ปุยฝ้าย',
    bodyFill: '#FFFFFF',
    bellyFill: '#FFFFFF',
    earInner: '#FBCFE8',
    accentFill: '#E7E5E4',
    collarFill: '#14191F',
    eyeColor: '#27272A',
    variant: 'snow',
    targetPercent: 50,
    walkDelay: 0.45,
    walkDuration: 1.55,
  },
  {
    id: 'cat-4',
    name: 'วิเชียรมาศ',
    bodyFill: '#F5EAD8',
    bellyFill: '#FBF5EC',
    earInner: '#E5B8A7',
    accentFill: '#5C4438',
    collarFill: '#C59B48',
    eyeColor: '#2563EB',
    variant: 'siamese',
    targetPercent: 33.5,
    walkDelay: 0.65,
    walkDuration: 1.55,
  },
  {
    id: 'cat-5',
    name: 'เทาน้อย',
    bodyFill: '#9CA3AF',
    bellyFill: '#E5E7EB',
    earInner: '#F9A8D4',
    accentFill: '#6B7280',
    collarFill: '#14191F',
    eyeColor: '#B45309',
    variant: 'grey',
    targetPercent: 17,
    walkDelay: 0.85,
    walkDuration: 1.55,
  },
];

function CuteCatSVG({
  cat,
  isRunning,
}: {
  cat: CatSpec;
  isRunning: boolean;
}) {
  const strokeColor = '#2A2F35';

  return (
    <svg
      viewBox="0 0 92 88"
      className="w-[84px] h-[78px] sm:w-[106px] sm:h-[98px] overflow-visible select-none drop-shadow-[0_4px_6px_rgba(20,25,31,0.14)]"
      aria-label={cat.name}
    >
      {/* Ground Shadow */}
      <ellipse cx="46" cy="80" rx="22" ry="4.2" fill="rgba(20, 25, 31, 0.12)" />

      {/* Wagging Tail */}
      <motion.g
        style={{ originX: '24px', originY: '59px' }}
        animate={{
          rotate: isRunning ? [-20, 24, -20] : [-9, 15, -9],
        }}
        transition={{
          duration: isRunning ? 0.36 : 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M 24 59 C 11 57, 7 41, 15 35 C 19 32, 23 36, 19 41 C 14 46, 17 53, 26 55 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {cat.variant === 'calico' && (
          <circle cx="15" cy="39" r="3.8" fill="#4A3B32" />
        )}
      </motion.g>

      {/* Back Legs */}
      <motion.g
        style={{ originX: '32px', originY: '65px' }}
        animate={isRunning ? { rotate: [-34, 30, -34] } : { rotate: 0 }}
        transition={
          isRunning
            ? { duration: 0.28, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="28"
          y="63"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      <motion.g
        style={{ originX: '54px', originY: '65px' }}
        animate={isRunning ? { rotate: [30, -34, 30] } : { rotate: 0 }}
        transition={
          isRunning
            ? { duration: 0.28, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="50"
          y="63"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      {/* Plump Body */}
      <rect
        x="23"
        y="45"
        width="40"
        height="25"
        rx="12.5"
        fill={cat.bodyFill}
        stroke={strokeColor}
        strokeWidth="2.2"
      />

      {/* Soft Belly Patch */}
      <ellipse cx="44" cy="60" rx="12" ry="7.5" fill={cat.bellyFill} />

      {/* Calico Back Patches */}
      {cat.variant === 'calico' && (
        <>
          <path d="M 27 48 Q 36 45 38 54 Q 30 56 25 52 Z" fill={cat.accentFill} />
          <circle cx="34" cy="57" r="4" fill="#4A3B32" />
        </>
      )}

      {/* Tabby / Grey Back Stripes */}
      {(cat.variant === 'tabby' || cat.variant === 'grey') && (
        <g stroke={cat.accentFill} strokeWidth="2.2" strokeLinecap="round">
          <line x1="30" y1="47" x2="32" y2="53" />
          <line x1="36" y1="46" x2="37" y2="53" />
          <line x1="42" y1="46" x2="42" y2="52" />
        </g>
      )}

      {/* Front Legs */}
      <motion.g
        style={{ originX: '37px', originY: '65px' }}
        animate={isRunning ? { rotate: [34, -30, 34] } : { rotate: 0 }}
        transition={
          isRunning
            ? { duration: 0.28, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="33"
          y="64"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      <motion.g
        style={{ originX: '59px', originY: '65px' }}
        animate={isRunning ? { rotate: [-30, 34, -30] } : { rotate: 0 }}
        transition={
          isRunning
            ? { duration: 0.28, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="55"
          y="64"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      {/* Luxury Collar & Champagne Gold Charm */}
      <path
        d="M 42 47 Q 53 51 63 46"
        fill="none"
        stroke={cat.collarFill}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="55.5"
        cy="51.5"
        r="3.2"
        fill="#E5C57B"
        stroke={strokeColor}
        strokeWidth="1.4"
      />

      {/* Rounded Cute Cat Head */}
      <motion.g
        style={{ originX: '54px', originY: '39px' }}
        animate={{ rotate: isRunning ? [-3.5, 3.5, -3.5] : [-1.5, 1.5, -1.5] }}
        transition={{ duration: isRunning ? 0.32 : 2.1, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Left Ear */}
        <path
          d="M 38 27 L 35 10 L 49 19 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.variant === 'calico' ? '#4A3B32' : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M 39.5 23 L 38 14.5 L 46 19.5 Z" fill={cat.earInner} />

        {/* Right Ear */}
        <path
          d="M 60 18 L 72 9 L 71 26 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.variant === 'calico' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M 62 19 L 69.5 14 L 69 23 Z" fill={cat.earInner} />

        {/* Head Base */}
        <ellipse
          cx="55"
          cy="33"
          rx="19.5"
          ry="16.5"
          fill={cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
        />

        {/* Siamese Face Mask */}
        {cat.variant === 'siamese' && (
          <ellipse cx="57" cy="35" rx="11.5" ry="9" fill={cat.accentFill} opacity="0.92" />
        )}

        {/* Eyes with periodic blink */}
        <motion.g
          style={{ originY: '32px' }}
          animate={{ scaleY: [1, 1, 1, 0.12, 1, 1, 1] }}
          transition={{
            duration: 3.6,
            repeat: Infinity,
            times: [0, 0.45, 0.48, 0.5, 0.52, 0.55, 1],
            delay: cat.walkDelay * 0.8,
          }}
        >
          <circle cx="48" cy="32" r="3" fill={cat.eyeColor} />
          <circle cx="47.1" cy="30.8" r="1.1" fill="#FFFFFF" />
          <circle cx="64" cy="32" r="3" fill={cat.eyeColor} />
          <circle cx="63.1" cy="30.8" r="1.1" fill="#FFFFFF" />
        </motion.g>

        {/* Rosy Cheeks */}
        <ellipse cx="42" cy="36.5" rx="3.4" ry="2" fill="#FDA4AF" opacity="0.85" />
        <ellipse cx="69" cy="36.5" rx="3.4" ry="2" fill="#FDA4AF" opacity="0.85" />

        {/* Tiny Pink Nose & Smile */}
        <path d="M 54.5 35.5 L 58.5 35.5 L 56.5 38 Z" fill="#FB7185" />
        <path
          d="M 52 39.5 Q 54.5 41.5 56.5 39 Q 58.5 41.5 61 39.5"
          fill="none"
          stroke={cat.variant === 'siamese' ? '#FDE68A' : strokeColor}
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
          <line x1="36" y1="34" x2="41" y2="35" />
          <line x1="35" y1="38" x2="41" y2="37.5" />
          <line x1="71" y1="35" x2="77" y2="34" />
          <line x1="71" y1="37.5" x2="77" y2="38" />
        </g>
      </motion.g>
    </svg>
  );
}

export function MiniCatFace({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0 select-none overflow-visible`} aria-hidden="true">
      {/* Ears */}
      <path d="M 12 29 L 8 11 L 25 20 Z" fill="#F4A261" stroke="#2A2F35" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M 13.5 25 L 11.5 15.5 L 22 21 Z" fill="#F9A8D4" />
      <path d="M 39 20 L 56 11 L 52 29 Z" fill="#F4A261" stroke="#2A2F35" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M 42 21 L 52.5 15.5 L 50.5 25 Z" fill="#F9A8D4" />
      {/* Head */}
      <ellipse cx="32" cy="38" rx="23" ry="19.5" fill="#F7B277" stroke="#2A2F35" strokeWidth="2.4" />
      {/* Eyes */}
      <circle cx="23.5" cy="37" r="3.2" fill="#27272A" />
      <circle cx="22.4" cy="35.7" r="1.15" fill="#FFFFFF" />
      <circle cx="40.5" cy="37" r="3.2" fill="#27272A" />
      <circle cx="39.4" cy="35.7" r="1.15" fill="#FFFFFF" />
      {/* Rosy Cheeks */}
      <ellipse cx="16.5" cy="42.5" rx="3.8" ry="2.1" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="47.5" cy="42.5" rx="3.8" ry="2.1" fill="#FDA4AF" opacity="0.85" />
      {/* Nose & Smile */}
      <path d="M 30 41.5 L 34 41.5 L 32 44 Z" fill="#FB7185" />
      <path
        d="M 27.5 45.5 Q 30 47.8 32 45 Q 34 47.8 36.5 45.5"
        fill="none"
        stroke="#2A2F35"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CuteWalkingCats({ onCatInteract }: { onCatInteract?: () => void }) {
  const [arrivedIds, setArrivedIds] = useState<Record<string, boolean>>({});
  const [poppedCatId, setPoppedCatId] = useState<string | null>(null);
  const [paradeCycle, setParadeCycle] = useState(0);

  useEffect(() => {
    setArrivedIds({});
    const timers = FIVE_CATS.map((cat) =>
      window.setTimeout(() => {
        setArrivedIds((prev) => ({ ...prev, [cat.id]: true }));
      }, (cat.walkDelay + cat.walkDuration) * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [paradeCycle]);

  const handleCatClick = (id: string) => {
    playMeowSound();
    onCatInteract?.();
    setPoppedCatId(id);
    window.setTimeout(() => {
      setPoppedCatId((curr) => (curr === id ? null : curr));
    }, 1050);
  };

  return (
    <div className="relative w-full h-44 sm:h-52 overflow-hidden rounded-2xl border bg-gradient-to-b from-[#F5F2EB] via-[#FAF8F4] to-[#FFFEFC] border-[#E5DEC9]">
      {/* Architectural Courtyard Garden Backdrop */}
      <svg
        viewBox="0 0 800 140"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <rect x="0" y="108" width="800" height="32" fill="#EFEAE0" />
        <line x1="0" y1="108" x2="800" y2="108" stroke="#DDD4C0" strokeWidth="1.2" />
        <ellipse cx="140" cy="108" rx="95" ry="12" fill="#E6E0D2" opacity="0.6" />
        <ellipse cx="660" cy="108" rx="110" ry="12" fill="#E6E0D2" opacity="0.6" />
      </svg>

      {/* Playful kitty hint */}
      <div className="absolute top-3 left-3.5 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 backdrop-blur-xs rounded-xl px-3 py-1 text-xs shadow-2xs border bg-white/92 border-[#E5DEC9] text-[#14191F]">
          <span className="text-[#C59B48]">◆</span>
          <span>แตะที่น้องแมวประจำโครงการเพื่อทักทายได้เลย</span>
        </div>
      </div>

      {/* Subtle paw prints */}
      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between pointer-events-none text-[11px] opacity-25 text-[#9B7A36]">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>

      {/* Replay running cats */}
      <button
        type="button"
        data-sound="custom"
        onClick={() => {
          playClickSound();
          onCatInteract?.();
          setParadeCycle((c) => c + 1);
        }}
        title="ให้น้องแมววิ่งออกมาใหม่"
        className="absolute top-3 right-3.5 z-20 px-3 py-1 text-xs font-medium rounded-xl border transition-colors cursor-pointer shadow-2xs text-[#14191F] hover:text-[#9B7A36] bg-white/92 hover:bg-white border-[#E5DEC9]"
      >
        วิ่งออกมาอีกครั้ง
      </button>

      {/* 5 Cute Courtyard Cats */}
      {FIVE_CATS.map((cat) => {
        const isRunning = !arrivedIds[cat.id];
        const isPopped = poppedCatId === cat.id;

        return (
          <motion.button
            key={`${paradeCycle}-${cat.id}`}
            type="button"
            data-sound="custom"
            onClick={() => handleCatClick(cat.id)}
            title={`น้อง${cat.name} (คลิกเพื่อทักทาย)`}
            initial={{ left: '-16%', opacity: 0 }}
            animate={{
              left: `${cat.targetPercent}%`,
              opacity: 1,
              y: isPopped
                ? [0, -18, 0]
                : isRunning
                ? [0, -8, 0, -8, 0]
                : [0, -2, 0],
            }}
            transition={{
              left: {
                duration: cat.walkDuration,
                delay: cat.walkDelay,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: {
                duration: 0.25,
                delay: cat.walkDelay,
              },
              y: isPopped
                ? { duration: 0.45, ease: 'easeOut' }
                : isRunning
                ? {
                    duration: 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: cat.walkDelay * 0.4,
                  },
            }}
            className="absolute bottom-3 -translate-x-1/2 z-10 cursor-pointer focus-visible:outline-none group"
          >
            <AnimatePresence>
              {isPopped && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.6 }}
                  animate={{ opacity: 1, y: -16, scale: 1.08 }}
                  exit={{ opacity: 0, y: -26, scale: 0.8 }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold pointer-events-none bg-white/95 px-2.5 py-0.5 rounded-xl border shadow-2xs text-[#14191F] border-[#E5DEC9]"
                >
                  เหมียว~ ({cat.name})
                </motion.span>
              )}
            </AnimatePresence>

            <CuteCatSVG cat={cat} isRunning={isRunning} />
          </motion.button>
        );
      })}
    </div>
  );
}
