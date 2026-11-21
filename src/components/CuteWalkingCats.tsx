import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

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
    collarFill: '#6B1D45',
    eyeColor: '#27272A',
    variant: 'tabby',
    targetPercent: 84,
    walkDelay: 0.1,
    walkDuration: 2.0,
  },
  {
    id: 'cat-2',
    name: 'สามสี',
    bodyFill: '#FFFDF9',
    bellyFill: '#FFFDF9',
    earInner: '#F9A8D4',
    accentFill: '#E07A38',
    collarFill: '#EA580C',
    eyeColor: '#27272A',
    variant: 'calico',
    targetPercent: 67,
    walkDelay: 0.38,
    walkDuration: 2.05,
  },
  {
    id: 'cat-3',
    name: 'ปุยฝ้าย',
    bodyFill: '#FFFFFF',
    bellyFill: '#FFFFFF',
    earInner: '#FBCFE8',
    accentFill: '#E7E5E4',
    collarFill: '#2563EB',
    eyeColor: '#27272A',
    variant: 'snow',
    targetPercent: 50,
    walkDelay: 0.66,
    walkDuration: 2.0,
  },
  {
    id: 'cat-4',
    name: 'วิเชียรมาศ',
    bodyFill: '#F5EAD8',
    bellyFill: '#FBF5EC',
    earInner: '#E5B8A7',
    accentFill: '#5C4438',
    collarFill: '#059669',
    eyeColor: '#2563EB',
    variant: 'siamese',
    targetPercent: 33,
    walkDelay: 0.94,
    walkDuration: 1.95,
  },
  {
    id: 'cat-5',
    name: 'เทาน้อย',
    bodyFill: '#9CA3AF',
    bellyFill: '#E5E7EB',
    earInner: '#F9A8D4',
    accentFill: '#6B7280',
    collarFill: '#D97706',
    eyeColor: '#B45309',
    variant: 'grey',
    targetPercent: 16,
    walkDelay: 1.22,
    walkDuration: 1.9,
  },
];

function CuteCatSVG({
  cat,
  isWalking,
}: {
  cat: CatSpec;
  isWalking: boolean;
}) {
  const strokeColor = '#3F322C';

  return (
    <svg
      viewBox="0 0 92 84"
      className="w-[74px] h-[68px] sm:w-[86px] sm:h-[78px] overflow-visible select-none drop-shadow-[0_3px_4px_rgba(63,50,44,0.12)]"
      aria-label={cat.name}
    >
      {/* Ground Shadow */}
      <ellipse cx="46" cy="77" rx="21" ry="4" fill="rgba(63, 50, 44, 0.14)" />

      {/* Wagging Tail */}
      <motion.g
        style={{ originX: '24px', originY: '56px' }}
        animate={{
          rotate: isWalking ? [-14, 18, -14] : [-8, 14, -8],
        }}
        transition={{
          duration: isWalking ? 0.55 : 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <path
          d="M 24 56 C 11 54, 7 38, 15 32 C 19 29, 23 33, 19 38 C 14 43, 17 50, 26 52 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {cat.variant === 'calico' && (
          <circle cx="15" cy="36" r="3.8" fill="#4A3B32" />
        )}
      </motion.g>

      {/* Back Legs (alternating stride while walking) */}
      <motion.g
        style={{ originX: '32px', originY: '62px' }}
        animate={isWalking ? { rotate: [-24, 22, -24] } : { rotate: 0 }}
        transition={
          isWalking
            ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="28"
          y="60"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      <motion.g
        style={{ originX: '54px', originY: '62px' }}
        animate={isWalking ? { rotate: [22, -24, 22] } : { rotate: 0 }}
        transition={
          isWalking
            ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="50"
          y="60"
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
        y="42"
        width="40"
        height="25"
        rx="12.5"
        fill={cat.bodyFill}
        stroke={strokeColor}
        strokeWidth="2.2"
      />

      {/* Soft Belly Patch */}
      <ellipse cx="44" cy="57" rx="12" ry="7.5" fill={cat.bellyFill} />

      {/* Calico Back Patches */}
      {cat.variant === 'calico' && (
        <>
          <path d="M 27 45 Q 36 42 38 51 Q 30 53 25 49 Z" fill={cat.accentFill} />
          <circle cx="34" cy="54" r="4" fill="#4A3B32" />
        </>
      )}

      {/* Tabby / Grey Back Stripes */}
      {(cat.variant === 'tabby' || cat.variant === 'grey') && (
        <g stroke={cat.accentFill} strokeWidth="2.2" strokeLinecap="round">
          <line x1="30" y1="44" x2="32" y2="50" />
          <line x1="36" y1="43" x2="37" y2="50" />
          <line x1="42" y1="43" x2="42" y2="49" />
        </g>
      )}

      {/* Front Legs */}
      <motion.g
        style={{ originX: '37px', originY: '62px' }}
        animate={isWalking ? { rotate: [24, -22, 24] } : { rotate: 0 }}
        transition={
          isWalking
            ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="33"
          y="61"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      <motion.g
        style={{ originX: '59px', originY: '62px' }}
        animate={isWalking ? { rotate: [-22, 24, -22] } : { rotate: 0 }}
        transition={
          isWalking
            ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.25 }
        }
      >
        <rect
          x="55"
          y="61"
          width="8.5"
          height="15"
          rx="4.2"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.1"
        />
      </motion.g>

      {/* Cute Collar & Little Gold Bell */}
      <path
        d="M 42 44 Q 53 48 63 43"
        fill="none"
        stroke={cat.collarFill}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="55.5"
        cy="48.5"
        r="3"
        fill="#FBBF24"
        stroke={strokeColor}
        strokeWidth="1.4"
      />

      {/* Rounded Cute Cat Head */}
      <motion.g
        style={{ originX: '54px', originY: '36px' }}
        animate={{ rotate: isWalking ? [-2.5, 2.5, -2.5] : [-1.5, 1.5, -1.5] }}
        transition={{ duration: isWalking ? 0.45 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Left Ear */}
        <path
          d="M 38 24 L 35 7 L 49 16 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.variant === 'calico' ? '#4A3B32' : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M 39.5 20 L 38 11.5 L 46 16.5 Z" fill={cat.earInner} />

        {/* Right Ear */}
        <path
          d="M 60 15 L 72 6 L 71 23 Z"
          fill={cat.variant === 'siamese' ? cat.accentFill : cat.variant === 'calico' ? cat.accentFill : cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M 62 16 L 69.5 11 L 69 20 Z" fill={cat.earInner} />

        {/* Head Base */}
        <ellipse
          cx="55"
          cy="30"
          rx="19.5"
          ry="16.5"
          fill={cat.bodyFill}
          stroke={strokeColor}
          strokeWidth="2.2"
        />

        {/* Siamese Face Mask */}
        {cat.variant === 'siamese' && (
          <ellipse cx="57" cy="32" rx="11.5" ry="9" fill={cat.accentFill} opacity="0.92" />
        )}

        {/* Forehead Tabby Stripes */}
        {(cat.variant === 'tabby' || cat.variant === 'grey') && (
          <g stroke={cat.accentFill} strokeWidth="2" strokeLinecap="round">
            <line x1="51" y1="16" x2="51" y2="21" />
            <line x1="55" y1="15" x2="55" y2="21" />
            <line x1="59" y1="16" x2="59" y2="21" />
          </g>
        )}

        {/* Eyes with subtle periodic blink */}
        <motion.g
          style={{ originY: '29px' }}
          animate={{ scaleY: [1, 1, 1, 0.12, 1, 1, 1] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            times: [0, 0.45, 0.48, 0.5, 0.52, 0.55, 1],
            delay: cat.walkDelay * 0.8,
          }}
        >
          <circle cx="48" cy="29" r="3" fill={cat.eyeColor} />
          <circle cx="47.1" cy="27.8" r="1.1" fill="#FFFFFF" />
          <circle cx="64" cy="29" r="3" fill={cat.eyeColor} />
          <circle cx="63.1" cy="27.8" r="1.1" fill="#FFFFFF" />
        </motion.g>

        {/* Rosy Cheeks */}
        <ellipse cx="42" cy="33.5" rx="3.3" ry="1.9" fill="#FDA4AF" opacity="0.75" />
        <ellipse cx="69" cy="33.5" rx="3.3" ry="1.9" fill="#FDA4AF" opacity="0.75" />

        {/* Tiny Pink Nose & Smile */}
        <path d="M 54.5 32.5 L 58.5 32.5 L 56.5 35 Z" fill="#FB7185" />
        <path
          d="M 52 36.5 Q 54.5 38.5 56.5 36 Q 58.5 38.5 61 36.5"
          fill="none"
          stroke={cat.variant === 'siamese' ? '#FDE68A' : strokeColor}
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
          <line x1="36" y1="31" x2="41" y2="32" />
          <line x1="35" y1="35" x2="41" y2="34.5" />
          <line x1="71" y1="32" x2="77" y2="31" />
          <line x1="71" y1="34.5" x2="77" y2="35" />
        </g>
      </motion.g>
    </svg>
  );
}

export function MiniCatFace({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 60" className={`${className} shrink-0 select-none`} aria-hidden="true">
      {/* Ears */}
      <path d="M 12 25 L 8 7 L 25 16 Z" fill="#F4A261" stroke="#3F322C" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M 13.5 21 L 11.5 11.5 L 22 17 Z" fill="#F9A8D4" />
      <path d="M 39 16 L 56 7 L 52 25 Z" fill="#F4A261" stroke="#3F322C" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M 42 17 L 52.5 11.5 L 50.5 21 Z" fill="#F9A8D4" />
      {/* Head */}
      <ellipse cx="32" cy="34" rx="23" ry="19.5" fill="#F7B277" stroke="#3F322C" strokeWidth="2.4" />
      {/* Forehead stripes */}
      <g stroke="#D97724" strokeWidth="2.2" strokeLinecap="round">
        <line x1="27" y1="18" x2="27" y2="23" />
        <line x1="32" y1="17" x2="32" y2="24" />
        <line x1="37" y1="18" x2="37" y2="23" />
      </g>
      {/* Eyes */}
      <circle cx="23.5" cy="33" r="3.2" fill="#27272A" />
      <circle cx="22.4" cy="31.7" r="1.15" fill="#FFFFFF" />
      <circle cx="40.5" cy="33" r="3.2" fill="#27272A" />
      <circle cx="39.4" cy="31.7" r="1.15" fill="#FFFFFF" />
      {/* Rosy Cheeks */}
      <ellipse cx="16.5" cy="38.5" rx="3.8" ry="2.1" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="47.5" cy="38.5" rx="3.8" ry="2.1" fill="#FDA4AF" opacity="0.85" />
      {/* Nose & Smile */}
      <path d="M 30 37.5 L 34 37.5 L 32 40 Z" fill="#FB7185" />
      <path
        d="M 27.5 41.5 Q 30 43.8 32 41 Q 34 43.8 36.5 41.5"
        fill="none"
        stroke="#3F322C"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CuteWalkingCats({ visitorName = '' }: { visitorName?: string }) {
  const [arrivedIds, setArrivedIds] = useState<Record<string, boolean>>({});
  const [poppedCatId, setPoppedCatId] = useState<string | null>(null);
  const [paradeCycle, setParadeCycle] = useState(0);

  const cleanName = visitorName.trim();

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
    setPoppedCatId(id);
    window.setTimeout(() => {
      setPoppedCatId((curr) => (curr === id ? null : curr));
    }, 1050);
  };

  return (
    <div className="relative w-full h-32 sm:h-36 overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFF9F3] via-[#FBF2E9] to-[#F1E6D9] border border-[#EBDCD2]">
      {/* Subtle architectural garden background silhouettes */}
      <svg
        viewBox="0 0 800 120"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Warm sun */}
        <circle cx="715" cy="28" r="18" fill="#FDE68A" opacity="0.65" />
        {/* Soft clouds */}
        <g fill="#FFFFFF" opacity="0.72">
          <ellipse cx="145" cy="24" rx="28" ry="10" />
          <ellipse cx="165" cy="20" rx="20" ry="9" />
          <ellipse cx="470" cy="22" rx="30" ry="10" />
          <ellipse cx="490" cy="18" rx="20" ry="9" />
        </g>
        {/* Soft sage garden bushes */}
        <ellipse cx="90" cy="96" rx="68" ry="20" fill="#CFE2C4" opacity="0.75" />
        <ellipse cx="260" cy="98" rx="85" ry="18" fill="#DAE8D1" opacity="0.7" />
        <ellipse cx="540" cy="97" rx="90" ry="20" fill="#CFE2C4" opacity="0.7" />
        <ellipse cx="725" cy="96" rx="75" ry="22" fill="#DAE8D1" opacity="0.8" />
        {/* Little garden flowers */}
        <circle cx="118" cy="88" r="3" fill="#FDA4AF" />
        <circle cx="290" cy="91" r="2.8" fill="#FDE047" />
        <circle cx="520" cy="89" r="3" fill="#F9A8D4" />
        <circle cx="705" cy="87" r="2.8" fill="#FDBA74" />
        {/* Garden walkway */}
        <rect x="0" y="96" width="800" height="24" fill="#E4D7C8" />
        <line x1="0" y1="96" x2="800" y2="96" stroke="#D4C4B2" strokeWidth="1.5" />
      </svg>

      {/* Personalized Speech Bubble from the 5 Cats */}
      <div className="absolute top-2.5 left-3 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#EBDCD2] rounded-xl px-3 py-1 text-xs text-zinc-700 shadow-2xs">
          <span className="text-[#E11D48]">♥</span>
          <span>
            {cleanName
              ? `เหมียว~ ยินดีต้อนรับคุณ${cleanName} เข้าชมโครงการนะ`
              : 'เหมียว~ ใส่ชื่อของคุณด้านล่าง แล้วมาเลือกบ้านด้วยกันนะ'}
          </span>
        </div>
      </div>

      {/* Cute little paw prints along the path */}
      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between opacity-35 pointer-events-none text-[10px] text-[#7A224F]">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>

      {/* Subtle replay parade trigger in top-right */}
      <button
        type="button"
        onClick={() => setParadeCycle((c) => c + 1)}
        title="ให้น้องแมวเดินออกมาใหม่"
        className="absolute top-2.5 right-3 z-20 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:text-[#6B1D45] bg-white/88 hover:bg-white rounded-lg border border-[#EBDCD2] transition-colors cursor-pointer"
      >
        เดินออกมาอีกครั้ง
      </button>

      {/* 5 Cute Cats Walking Out Parade */}
      {FIVE_CATS.map((cat) => {
        const isWalking = !arrivedIds[cat.id];
        const isPopped = poppedCatId === cat.id;

        return (
          <motion.button
            key={`${paradeCycle}-${cat.id}`}
            type="button"
            onClick={() => handleCatClick(cat.id)}
            title={`น้อง${cat.name} (คลิกเพื่อทักทาย)`}
            initial={{ left: '-14%', opacity: 0 }}
            animate={{
              left: `${cat.targetPercent}%`,
              opacity: 1,
              y: isPopped
                ? [0, -14, 0]
                : isWalking
                ? [0, -4, 0, -4, 0]
                : [0, -1.5, 0],
            }}
            transition={{
              left: {
                duration: cat.walkDuration,
                delay: cat.walkDelay,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: {
                duration: 0.35,
                delay: cat.walkDelay,
              },
              y: isPopped
                ? { duration: 0.45, ease: 'easeOut' }
                : isWalking
                ? {
                    duration: 0.42,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: cat.walkDelay * 0.4,
                  },
            }}
            className="absolute bottom-2.5 -translate-x-1/2 z-10 cursor-pointer focus-visible:outline-none group"
          >
            <AnimatePresence>
              {isPopped && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.6 }}
                  animate={{ opacity: 1, y: -14, scale: 1.05 }}
                  exit={{ opacity: 0, y: -24, scale: 0.8 }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-[#E11D48] font-bold pointer-events-none bg-white/95 px-2 py-0.5 rounded-lg border border-rose-200 shadow-2xs"
                >
                  {cleanName ? `♥ หวัดดีคุณ${cleanName}!` : '♥ เหมียว!'}
                </motion.span>
              )}
            </AnimatePresence>

            <CuteCatSVG cat={cat} isWalking={isWalking} />
          </motion.button>
        );
      })}
    </div>
  );
}
