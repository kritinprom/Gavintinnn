import { useMemo } from 'react';
import { PlotUnit } from '../types/project';

interface NotOpenFogOverlayProps {
  plots: PlotUnit[];
}

// Matches master plan image aspect ratio (4961 / 3398)
const VB_WIDTH = 1000;
const VB_HEIGHT = 684.94;

function hashPlotId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 997;
  }
  return h;
}

interface CloudNode {
  id: string;
  cx: number;
  cy: number;
  seed: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

interface CloudBridge {
  x: number;
  y: number;
  rx: number;
  ry: number;
  key: string;
}

export function NotOpenFogOverlay({ plots }: NotOpenFogOverlayProps) {
  const fogData = useMemo(() => {
    const notOpenPlots = plots.filter((p) => p.status === 'not_open');
    if (notOpenPlots.length === 0) return null;

    const openPlots = plots.filter((p) => p.status !== 'not_open');

    const nodes: CloudNode[] = notOpenPlots.map((p) => {
      const cx = (p.x / 100) * VB_WIDTH;
      const cy = (p.y / 100) * VB_HEIGHT;
      const seed = hashPlotId(p.id);

      // Measure directional clearance to nearest open plot so clouds hug the unopened block cleanly
      let minDist = 999;
      let nearestDx = 0;
      let nearestDy = 0;

      for (const op of openPlots) {
        const ox = (op.x / 100) * VB_WIDTH;
        const oy = (op.y / 100) * VB_HEIGHT;
        const dx = ox - cx;
        const dy = oy - cy;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          nearestDx = dx;
          nearestDy = dy;
        }
      }

      // Gently tuck away from close open neighbors (e.g., K11 next to K10, N01 below N02)
      let offsetX = 0;
      let offsetY = 0;
      let scaleX = 1;
      let scaleY = 1;

      if (minDist < 34) {
        scaleX = Math.abs(nearestDx) > Math.abs(nearestDy) ? 0.78 : 0.92;
        scaleY = Math.abs(nearestDy) > Math.abs(nearestDx) ? 0.78 : 0.92;
        offsetX = -(nearestDx / (minDist || 1)) * 3.2;
        offsetY = -(nearestDy / (minDist || 1)) * 3.2;
      } else if (minDist < 48) {
        scaleX = 0.92;
        scaleY = 0.92;
      }

      return {
        id: p.id,
        cx: cx + offsetX,
        cy: cy + offsetY,
        seed,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
      };
    });

    // Bridge adjacent not-open plots across backyards and internal lanes for a continuous cloud bank
    const bridges: CloudBridge[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = Math.abs(a.cx - b.cx);
        const dy = Math.abs(a.cy - b.cy);
        const dist = Math.hypot(dx, dy);

        if (dist > 8 && dist <= 68) {
          const midX = (a.cx + b.cx) / 2;
          const midY = (a.cy + b.cy) / 2;
          const minSX = Math.min(a.scaleX, b.scaleX);
          const minSY = Math.min(a.scaleY, b.scaleY);
          const jitter = ((a.seed + b.seed) % 5) * 0.7;

          bridges.push({
            x: midX,
            y: midY,
            rx: (17.5 + jitter) * minSX,
            ry: (14.5 + jitter * 0.8) * minSY,
            key: `${a.id}-${b.id}`,
          });
        }
      }
    }

    // Center the architectural zone title neatly inside the dense Zone L/M heart
    const coreCluster = nodes.filter((n) => n.cx >= 100 && n.cx <= 220 && n.cy >= 420 && n.cy <= 575);
    const labelPool = coreCluster.length >= 4 ? coreCluster : nodes;
    const avgX = labelPool.reduce((acc, n) => acc + n.cx, 0) / labelPool.length;
    const avgY = labelPool.reduce((acc, n) => acc + n.cy, 0) / labelPool.length;

    return {
      nodes,
      bridges,
      labelPos: { x: avgX, y: avgY },
    };
  }, [plots]);

  if (!fogData) return null;

  return (
    <svg
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    >
      <defs>
        {/* Outer atmospheric winter mist halo (gives soft separation against the white master-plan paper) */}
        <filter id="not-open-mist-blur" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="6.2" />
        </filter>

        {/* Soft painterly cloud billow edge */}
        <filter id="not-open-cloud-feather" x="-22%" y="-22%" width="144%" height="144%">
          <feGaussianBlur stdDeviation="1.45" />
        </filter>

        {/* Drifting foreground vapor blur */}
        <filter id="not-open-vapor-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>

        {/* Cool sage-slate winter mist aura gradient */}
        <radialGradient id="not-open-mist-aura" cx="50%" cy="52%" r="54%">
          <stop offset="0%" stopColor="#DCE7EB" stopOpacity="0.95" />
          <stop offset="52%" stopColor="#C8D8DF" stopOpacity="0.62" />
          <stop offset="82%" stopColor="#D8E5E9" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#E6EEF2" stopOpacity="0" />
        </radialGradient>

        {/* Sculpted cumulus body gradient (snow-white crown to cool slate-pearl base) */}
        <linearGradient id="not-open-cumulus-body" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="56%" stopColor="#F5F8FB" />
          <stop offset="100%" stopColor="#DCE6EE" />
        </linearGradient>

        {/* Sunlit champagne-pearl crown highlight */}
        <linearGradient id="not-open-cumulus-crown" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="65%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFF5F9" />
        </linearGradient>
      </defs>

      {/* Layer 1: Atmospheric Cool Winter Mist Halo (defines the cloud silhouette cleanly on white paper) */}
      <g filter="url(#not-open-mist-blur)">
        {fogData.nodes.map((n) => (
          <ellipse
            key={`aura-${n.id}`}
            cx={n.cx + 1}
            cy={n.cy + 2.5}
            rx={31 * n.scaleX}
            ry={25 * n.scaleY}
            fill="url(#not-open-mist-aura)"
          />
        ))}
        {fogData.bridges.map((b) => (
          <ellipse
            key={`b-aura-${b.key}`}
            cx={b.x}
            cy={b.y + 2}
            rx={b.rx * 1.48}
            ry={b.ry * 1.48}
            fill="url(#not-open-mist-aura)"
          />
        ))}
      </g>

      {/* Layer 2: Soft Cool-Slate Cumulus Underbelly (gives 3D depth & blocks 100% of map ink) */}
      <g filter="url(#not-open-cloud-feather)">
        {fogData.bridges.map((b) => (
          <ellipse
            key={`b-under-${b.key}`}
            cx={b.x + 1.4}
            cy={b.y + 3.4}
            rx={b.rx * 1.02}
            ry={b.ry * 1.02}
            fill="#CBD9E4"
          />
        ))}
        {fogData.nodes.map((n) => (
          <g key={`under-${n.id}`}>
            <ellipse
              cx={n.cx + 1.8}
              cy={n.cy + 4.2}
              rx={18.8 * n.scaleX}
              ry={15.2 * n.scaleY}
              fill="#C7D6E1"
            />
            <circle
              cx={n.cx - 8.5 * n.scaleX}
              cy={n.cy + 3.6 * n.scaleY}
              r={12.4 * Math.min(n.scaleX, n.scaleY)}
              fill="#D0DEE8"
            />
            <circle
              cx={n.cx + 8.5 * n.scaleX}
              cy={n.cy + 3.4 * n.scaleY}
              r={12.2 * Math.min(n.scaleX, n.scaleY)}
              fill="#CFDDE7"
            />
          </g>
        ))}
      </g>

      {/* Layer 3: Dense Opaque Pearl-White Cloud Bank (complete visual concealment) */}
      <g filter="url(#not-open-cloud-feather)">
        {fogData.bridges.map((b) => (
          <ellipse
            key={`b-body-${b.key}`}
            cx={b.x}
            cy={b.y}
            rx={b.rx}
            ry={b.ry}
            fill="url(#not-open-cumulus-body)"
          />
        ))}
        {fogData.nodes.map((n) => {
          const sx = n.scaleX;
          const sy = n.scaleY;
          const s = Math.min(sx, sy);
          const jx = ((n.seed % 7) - 3) * 0.85;
          const jy = (((n.seed >> 2) % 7) - 3) * 0.65;

          return (
            <g key={`body-${n.id}`}>
              <ellipse
                cx={n.cx + jx}
                cy={n.cy + jy}
                rx={17.5 * sx}
                ry={14.5 * sy}
                fill="url(#not-open-cumulus-body)"
              />
              <circle cx={n.cx - 9.2 * sx} cy={n.cy + 0.8 * sy} r={12.2 * s} fill="url(#not-open-cumulus-body)" />
              <circle cx={n.cx + 9.2 * sx} cy={n.cy + 0.5 * sy} r={12.0 * s} fill="url(#not-open-cumulus-body)" />
              <circle cx={n.cx - 3.2 * sx} cy={n.cy - 6.8 * sy} r={11.8 * s} fill="url(#not-open-cumulus-crown)" />
              <circle cx={n.cx + 4.4 * sx} cy={n.cy - 5.6 * sy} r={11.2 * s} fill="url(#not-open-cumulus-crown)" />
              <circle cx={n.cx + 0.5 * sx} cy={n.cy + 5.8 * sy} r={11.5 * s} fill="#EEF4F8" />
            </g>
          );
        })}
      </g>

      {/* Layer 4: Sunlit Snow-Cloud Crests & Gentle Animated Winter Vapor */}
      <g className="animate-fog-drift-a" filter="url(#not-open-vapor-blur)" opacity="0.92">
        {fogData.nodes
          .filter((_, idx) => idx % 2 === 0)
          .map((n) => (
            <ellipse
              key={`crest-a-${n.id}`}
              cx={n.cx - 2.5}
              cy={n.cy - 3.8}
              rx={14.5 * n.scaleX}
              ry={9.2 * n.scaleY}
              fill="url(#not-open-cumulus-crown)"
            />
          ))}
      </g>

      <g className="animate-fog-drift-b" filter="url(#not-open-vapor-blur)" opacity="0.86">
        {fogData.nodes
          .filter((_, idx) => idx % 2 === 1)
          .map((n) => (
            <ellipse
              key={`crest-b-${n.id}`}
              cx={n.cx + 3}
              cy={n.cy - 1.5}
              rx={13.5 * n.scaleX}
              ry={8.8 * n.scaleY}
              fill="#FFFFFF"
            />
          ))}
      </g>

      {/* Subtle Frost & Champagne-Gold Winter Glints on Cloud Tops */}
      <g opacity="0.82">
        {fogData.nodes
          .filter((_, idx) => idx % 4 === 0)
          .map((n, i) => (
            <g
              key={`spark-${n.id}`}
              transform={`translate(${n.cx + ((n.seed % 9) - 4)}, ${n.cy - 7})`}
              className={i % 2 === 0 ? 'animate-twinkle-a' : 'animate-twinkle-b'}
            >
              <path
                d="M0,-3.2 L0.8,-0.8 L3.2,0 L0.8,0.8 L0,3.2 L-0.8,0.8 L-3.2,0 L-0.8,-0.8 Z"
                fill={i % 2 === 0 ? '#D4AF37' : '#94B8C9'}
                opacity="0.72"
              />
            </g>
          ))}
      </g>

      {/* Layer 5: Architectural Unboxed Zone Label Floating Smoothly on the Mist */}
      <g transform={`translate(${fogData.labelPos.x}, ${fogData.labelPos.y})`}>
        {/* Soft luminous cushion beneath typography */}
        <ellipse
          cx="0"
          cy="0"
          rx="58"
          ry="21"
          fill="rgba(255, 255, 255, 0.72)"
          filter="url(#not-open-vapor-blur)"
        />

        {/* Minimalist Frost Snowflake / Pine-Gold Divider */}
        <g transform="translate(0, -14)">
          <line x1="-22" y1="0" x2="-7" y2="0" stroke="#9EB5AE" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="7" y1="0" x2="22" y2="0" stroke="#9EB5AE" strokeWidth="0.9" strokeLinecap="round" />
          <path
            d="M0,-3.5 L0.9,-0.9 L3.5,0 L0.9,0.9 L0,3.5 L-0.9,0.9 L-3.5,0 L-0.9,-0.9 Z"
            fill="#C59B48"
          />
        </g>

        <text
          x="0"
          y="-1.5"
          textAnchor="middle"
          fill="#12382B"
          stroke="rgba(255, 255, 255, 0.94)"
          strokeWidth="3.5"
          paintOrder="stroke"
          fontSize="10.5"
          fontWeight="700"
          style={{ fontFamily: 'Prompt, Anuphan, sans-serif', letterSpacing: '0.01em' }}
        >
          โซนยังไม่เปิดขาย
        </text>

        <text
          x="0"
          y="10.5"
          textAnchor="middle"
          fill="#4A6B60"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="2.8"
          paintOrder="stroke"
          fontSize="7.4"
          fontWeight="500"
          style={{ fontFamily: 'Anuphan, Prompt, sans-serif' }}
        >
          เปิดให้ชมในเฟสถัดไป
        </text>
      </g>
    </svg>
  );
}
