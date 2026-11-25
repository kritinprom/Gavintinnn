import { motion } from 'motion/react';

interface SnowflakeSpec {
  id: number;
  leftPercent: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  driftPx: number;
  opacity: number;
}

const SNOWFLAKES: SnowflakeSpec[] = [
  { id: 1, leftPercent: 4, sizePx: 5, durationSec: 12, delaySec: 0, driftPx: 18, opacity: 0.75 },
  { id: 2, leftPercent: 9, sizePx: 7, durationSec: 15, delaySec: -4, driftPx: -22, opacity: 0.65 },
  { id: 3, leftPercent: 14, sizePx: 4, durationSec: 11, delaySec: -7, driftPx: 14, opacity: 0.55 },
  { id: 4, leftPercent: 19, sizePx: 6, durationSec: 14, delaySec: -2, driftPx: -16, opacity: 0.7 },
  { id: 5, leftPercent: 25, sizePx: 8, durationSec: 16, delaySec: -9, driftPx: 24, opacity: 0.6 },
  { id: 6, leftPercent: 31, sizePx: 4, durationSec: 10, delaySec: -3, driftPx: -12, opacity: 0.6 },
  { id: 7, leftPercent: 37, sizePx: 6, durationSec: 13, delaySec: -6, driftPx: 20, opacity: 0.75 },
  { id: 8, leftPercent: 43, sizePx: 5, durationSec: 12, delaySec: -1, driftPx: -18, opacity: 0.6 },
  { id: 9, leftPercent: 49, sizePx: 7, durationSec: 15, delaySec: -8, driftPx: 15, opacity: 0.7 },
  { id: 10, leftPercent: 55, sizePx: 4, durationSec: 11, delaySec: -5, driftPx: -14, opacity: 0.55 },
  { id: 11, leftPercent: 61, sizePx: 6, durationSec: 14, delaySec: -10, driftPx: 22, opacity: 0.72 },
  { id: 12, leftPercent: 67, sizePx: 8, durationSec: 17, delaySec: -3, driftPx: -20, opacity: 0.62 },
  { id: 13, leftPercent: 73, sizePx: 5, durationSec: 12, delaySec: -7, driftPx: 16, opacity: 0.68 },
  { id: 14, leftPercent: 79, sizePx: 6, durationSec: 13, delaySec: -2, driftPx: -15, opacity: 0.74 },
  { id: 15, leftPercent: 85, sizePx: 4, durationSec: 11, delaySec: -6, driftPx: 12, opacity: 0.58 },
  { id: 16, leftPercent: 91, sizePx: 7, durationSec: 15, delaySec: -11, driftPx: -20, opacity: 0.68 },
  { id: 17, leftPercent: 96, sizePx: 5, durationSec: 13, delaySec: -4, driftPx: 14, opacity: 0.64 },
  { id: 18, leftPercent: 22, sizePx: 5, durationSec: 14, delaySec: -12, driftPx: 18, opacity: 0.5 },
  { id: 19, leftPercent: 52, sizePx: 6, durationSec: 16, delaySec: -13, driftPx: -16, opacity: 0.55 },
  { id: 20, leftPercent: 82, sizePx: 5, durationSec: 12, delaySec: -8, driftPx: 14, opacity: 0.6 },
];

const LIGHT_BULBS = [
  { left: '3%', color: '#F5D06B', glow: 'rgba(245, 208, 107, 0.85)', delay: 0 },
  { left: '9%', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.85)', delay: 0.4 },
  { left: '15%', color: '#34D399', glow: 'rgba(52, 211, 153, 0.8)', delay: 0.8 },
  { left: '21%', color: '#FFFBEB', glow: 'rgba(255, 251, 235, 0.9)', delay: 0.2 },
  { left: '27%', color: '#F5D06B', glow: 'rgba(245, 208, 107, 0.85)', delay: 1.0 },
  { left: '33%', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.85)', delay: 0.6 },
  { left: '39%', color: '#34D399', glow: 'rgba(52, 211, 153, 0.8)', delay: 1.2 },
  { left: '45%', color: '#F5D06B', glow: 'rgba(245, 208, 107, 0.85)', delay: 0.3 },
  { left: '51%', color: '#FFFBEB', glow: 'rgba(255, 251, 235, 0.9)', delay: 0.9 },
  { left: '57%', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.85)', delay: 0.5 },
  { left: '63%', color: '#34D399', glow: 'rgba(52, 211, 153, 0.8)', delay: 1.1 },
  { left: '69%', color: '#F5D06B', glow: 'rgba(245, 208, 107, 0.85)', delay: 0.1 },
  { left: '75%', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.85)', delay: 0.7 },
  { left: '81%', color: '#FFFBEB', glow: 'rgba(255, 251, 235, 0.9)', delay: 1.3 },
  { left: '87%', color: '#34D399', glow: 'rgba(52, 211, 153, 0.8)', delay: 0.4 },
  { left: '93%', color: '#F5D06B', glow: 'rgba(245, 208, 107, 0.85)', delay: 0.95 },
  { left: '97.5%', color: '#F43F5E', glow: 'rgba(244, 63, 94, 0.85)', delay: 0.25 },
];

/**
 * Subtle top-edge twinkling fairy lights garland (pointer-events-none, compositor-only).
 */
export function ChristmasLightsGarland() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 inset-x-0 z-40 h-5 overflow-hidden select-none"
    >
      {/* Delicate pine wire */}
      <svg
        viewBox="0 0 1200 18"
        preserveAspectRatio="none"
        className="w-full h-3.5 opacity-80"
      >
        <path
          d="M0 2 Q 75 13 150 2 T 300 2 T 450 2 T 600 2 T 750 2 T 900 2 T 1050 2 T 1200 2"
          fill="none"
          stroke="#14532D"
          strokeWidth="2"
        />
      </svg>

      {LIGHT_BULBS.map((bulb, i) => (
        <motion.span
          key={i}
          style={{
            left: bulb.left,
            backgroundColor: bulb.color,
            boxShadow: `0 0 8px 2px ${bulb.glow}`,
          }}
          animate={{
            opacity: [0.45, 1, 0.55, 1, 0.45],
            scale: [0.88, 1.15, 0.94, 1.12, 0.88],
          }}
          transition={{
            duration: 2.4,
            delay: bulb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1.5 w-2 h-2.5 rounded-full"
        />
      ))}
    </div>
  );
}

/**
 * Gentle falling snow layer across the viewport (pointer-events-none).
 */
export function ChristmasSnowfall() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden select-none"
    >
      {SNOWFLAKES.map((flake) => (
        <motion.div
          key={flake.id}
          style={{
            left: `${flake.leftPercent}%`,
            width: `${flake.sizePx}px`,
            height: `${flake.sizePx}px`,
            opacity: flake.opacity,
          }}
          initial={{ y: '-5vh', x: 0 }}
          animate={{
            y: '105vh',
            x: [0, flake.driftPx, -flake.driftPx * 0.6, flake.driftPx * 0.4, 0],
          }}
          transition={{
            y: {
              duration: flake.durationSec,
              delay: flake.delaySec,
              repeat: Infinity,
              ease: 'linear',
            },
            x: {
              duration: flake.durationSec * 0.75,
              delay: flake.delaySec,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="absolute top-0 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.85)]"
        />
      ))}
    </div>
  );
}

/**
 * Decorated Christmas Tree SVG with glowing star topper, garland, twinkling lights & gifts.
 */
export function ChristmasTreeSVG({
  className = 'w-20 h-24',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 110 132"
      className={`${className} overflow-visible select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)]`}
      aria-label="ต้นคริสต์มาส"
    >
      {/* Snow shadow */}
      <ellipse cx="55" cy="123" rx="34" ry="5" fill="rgba(255, 255, 255, 0.25)" />

      {/* Trunk */}
      <rect x="47" y="102" width="16" height="18" rx="3" fill="#6D4C3D" stroke="#2D1E17" strokeWidth="2" />

      {/* Bottom Tier */}
      <path
        d="M 55 56 L 94 104 Q 55 110 16 104 Z"
        fill="#0F4C36"
        stroke="#082E20"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Middle Tier */}
      <path
        d="M 55 34 L 86 76 Q 55 82 24 76 Z"
        fill="#146145"
        stroke="#082E20"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Top Tier */}
      <path
        d="M 55 16 L 77 49 Q 55 54 33 49 Z"
        fill="#1A7956"
        stroke="#082E20"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Snow Frost Accents */}
      <path
        d="M 44 33 Q 55 37 66 33 M 33 65 Q 55 71 77 65 M 24 94 Q 55 101 86 94"
        fill="none"
        stroke="#E5C57B"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />

      {/* Twinkling Tree Ornaments */}
      <motion.circle
        cx="55"
        cy="34"
        r="3.3"
        fill="#F43F5E"
        animate={{ opacity: [0.65, 1, 0.65], scale: [0.95, 1.15, 0.95] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <motion.circle
        cx="42"
        cy="60"
        r="3.5"
        fill="#F5D06B"
        animate={{ opacity: [1, 0.55, 1], scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 1.9, repeat: Infinity }}
      />
      <motion.circle
        cx="69"
        cy="63"
        r="3.5"
        fill="#FFFBEB"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <motion.circle
        cx="33"
        cy="88"
        r="3.8"
        fill="#F43F5E"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2.1, repeat: Infinity }}
      />
      <motion.circle
        cx="56"
        cy="86"
        r="3.8"
        fill="#F5D06B"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.7, repeat: Infinity }}
      />
      <motion.circle
        cx="78"
        cy="91"
        r="3.6"
        fill="#60A5FA"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Glowing Star Topper */}
      <motion.path
        d="M 55 3 L 58.5 10.5 L 67 11.5 L 60.5 17 L 62.2 25 L 55 21 L 47.8 25 L 49.5 17 L 43 11.5 L 51.5 10.5 Z"
        fill="#FDE047"
        stroke="#B45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
        animate={{ scale: [0.96, 1.1, 0.96], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '55px', originY: '14px' }}
      />

      {/* Gift Boxes under tree */}
      <g>
        <rect x="20" y="108" width="18" height="14" rx="2.5" fill="#E11D48" stroke="#4C0519" strokeWidth="1.6" />
        <path d="M 29 108 V 122 M 20 115 H 38" stroke="#FDE047" strokeWidth="2.4" />
        <rect x="70" y="109" width="16" height="13" rx="2.5" fill="#F5D06B" stroke="#78350F" strokeWidth="1.6" />
        <path d="M 78 109 V 122 M 70 115.5 H 86" stroke="#BE123C" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

/**
 * Cheerful Waving Santa Claus SVG Mascot.
 */
export function SantaClausSVG({
  className = 'w-20 h-24',
}: {
  className?: string;
}) {
  return (
    <motion.svg
      viewBox="0 0 110 124"
      className={`${className} overflow-visible select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)]`}
      aria-label="ซานตาคลอส"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="55" cy="116" rx="26" ry="4.5" fill="rgba(255,255,255,0.22)" />

      {/* Gift Sack behind Santa */}
      <path
        d="M 72 62 C 88 58, 96 74, 92 92 C 88 100, 72 100, 70 92 Z"
        fill="#92400E"
        stroke="#451A03"
        strokeWidth="2"
      />
      <rect x="78" y="54" width="10" height="10" rx="2" fill="#F5D06B" stroke="#78350F" strokeWidth="1.5" />

      {/* Boots */}
      <rect x="37" y="99" width="13" height="14" rx="4" fill="#18181B" stroke="#09090B" strokeWidth="2" />
      <rect x="60" y="99" width="13" height="14" rx="4" fill="#18181B" stroke="#09090B" strokeWidth="2" />

      {/* Santa Red Coat */}
      <path
        d="M 32 62 C 32 54, 78 54, 78 62 L 82 99 C 82 103, 28 103, 28 99 Z"
        fill="#DC2626"
        stroke="#7F1D1D"
        strokeWidth="2.2"
      />
      {/* White Fur Trim */}
      <rect x="27" y="94" width="56" height="9" rx="4.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="51" y="60" width="8" height="36" rx="3" fill="#FFFFFF" />

      {/* Black Belt & Gold Buckle */}
      <rect x="29" y="77" width="52" height="7" fill="#18181B" />
      <rect x="49" y="75" width="12" height="11" rx="2" fill="none" stroke="#F5D06B" strokeWidth="2.6" />

      {/* Waving Left Arm */}
      <motion.g
        style={{ originX: '34px', originY: '66px' }}
        animate={{ rotate: [-14, 18, -14] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M 34 66 C 20 62, 16 50, 20 42"
          fill="none"
          stroke="#DC2626"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <circle cx="20" cy="41" r="6" fill="#FFFFFF" stroke="#7F1D1D" strokeWidth="1.8" />
      </motion.g>

      {/* Right Arm */}
      <path
        d="M 76 66 C 84 72, 85 80, 81 84"
        fill="none"
        stroke="#DC2626"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="81" cy="84" r="5.5" fill="#FFFFFF" stroke="#7F1D1D" strokeWidth="1.8" />

      {/* Face */}
      <circle cx="55" cy="42" r="19" fill="#FDE2C8" stroke="#7F1D1D" strokeWidth="2" />
      {/* Rosy Cheeks & Nose */}
      <circle cx="44" cy="45" r="3.5" fill="#FDA4AF" opacity="0.7" />
      <circle cx="66" cy="45" r="3.5" fill="#FDA4AF" opacity="0.7" />
      <circle cx="55" cy="44" r="3.2" fill="#F87171" />

      {/* Happy Eyes */}
      <circle cx="48" cy="39" r="2.2" fill="#18181B" />
      <circle cx="62" cy="39" r="2.2" fill="#18181B" />

      {/* Fluffy White Beard & Mustache */}
      <path
        d="M 35 45 C 33 66, 46 73, 55 73 C 64 73, 77 66, 75 45 C 70 50, 62 49, 55 47 C 48 49, 40 50, 35 45 Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M 43 47 Q 50 52 55 47 Q 60 52 67 47" fill="none" stroke="#94A3B8" strokeWidth="1.4" />

      {/* Santa Hat */}
      <path
        d="M 34 32 C 36 14, 54 7, 74 16 C 82 20, 85 28, 86 35 L 77 35 C 74 28, 69 27, 65 29 Z"
        fill="#DC2626"
        stroke="#7F1D1D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="32" y="28" width="46" height="9" rx="4.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.6" />
      <circle cx="87" cy="35" r="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    </motion.svg>
  );
}
