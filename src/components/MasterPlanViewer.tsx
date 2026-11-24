import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, RotateCcw, Search, X } from 'lucide-react';
import { HOUSE_MODELS, HOUSE_MODEL_ORDER } from '../data/houseModels';
import { ZONES } from '../data/masterPlanPlots';
import {
  HouseModelId,
  OverlayMode,
  PlotFilterState,
  PlotStatus,
  PlotUnit,
} from '../types/project';
import { formatMillion, STATUS_SHORT_LABELS, STATUS_STYLES } from '../utils/formatters';
import {
  playSelectPlotSound,
  playToggleSound,
  playZoomInSound,
  playZoomOutSound,
} from '../utils/soundEffects';
import { NotOpenFogOverlay } from './NotOpenFogOverlay';

interface MasterPlanViewerProps {
  plots: PlotUnit[];
  filteredPlotIds: Set<string>;
  selectedPlotId: string | null;
  onSelectPlot: (id: string) => void;
  overlayMode: OverlayMode;
  onOverlayModeChange: (mode: OverlayMode) => void;
  filters: PlotFilterState;
  onFiltersChange: (next: Partial<PlotFilterState>) => void;
  onResetFilters: () => void;
  focusRequestTick: number;
}

const MASTER_PLAN_IMAGE = '/assets/aistudio/_______60c0cee6.jpg';

const ZONE_PRESETS: { label: string; zoom: number; centerX: number; centerY: number }[] = [
  { label: 'ภาพรวมทั้งหมด', zoom: 1, centerX: 50, centerY: 48 },
  { label: 'โซน A–E (หน้าโครงการ)', zoom: 2.1, centerX: 85, centerY: 48 },
  { label: 'โซน F–H (กลางโครงการ)', zoom: 2.3, centerX: 70, centerY: 49 },
  { label: 'โซน I–K (สวนส่วนกลาง)', zoom: 2.1, centerX: 30, centerY: 53 },
  { label: 'โซน L–N (ฝั่งตะวันตก)', zoom: 2.2, centerX: 12, centerY: 59 },
];

export function MasterPlanViewer({
  plots,
  filteredPlotIds,
  selectedPlotId,
  onSelectPlot,
  overlayMode,
  onOverlayModeChange,
  filters,
  onFiltersChange,
  onResetFilters,
  focusRequestTick,
}: MasterPlanViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 880,
    height: 602,
  });

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const singleDragStartRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const pinchPrevRef = useRef<{
    distance: number;
    midX: number;
    midY: number;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const imgAspect = 4961 / 3398;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      let width = rect.width;
      let height = rect.width / imgAspect;
      if (height > rect.height) {
        height = rect.height;
        width = rect.height * imgAspect;
      }
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const centerOnPercent = useCallback(
    (percentX: number, percentY: number, targetZoom: number) => {
      const dxFromCenter = ((percentX - 50) / 100) * canvasSize.width;
      const dyFromCenter = ((percentY - 50) / 100) * canvasSize.height;

      const nextPan = {
        x: -dxFromCenter * targetZoom,
        y: -dyFromCenter * targetZoom,
      };
      zoomRef.current = targetZoom;
      panRef.current = nextPan;
      setZoom(targetZoom);
      setPan(nextPan);
    },
    [canvasSize]
  );

  // Auto-pan to selected plot when explicitly triggered from directory/models/compare
  useEffect(() => {
    if (focusRequestTick === 0 || !selectedPlotId) return;
    const target = plots.find((p) => p.id === selectedPlotId);
    if (target) {
      centerOnPercent(target.x, target.y, Math.max(zoomRef.current, 2.2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequestTick]);

  const handleResetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const applyZoomAtClientPoint = useCallback(
    (targetZoomRaw: number, clientX: number, clientY: number) => {
      const nextZoom = Math.min(4.5, Math.max(0.95, Number(targetZoomRaw.toFixed(3))));
      const prevZoom = zoomRef.current;
      const prevPan = panRef.current;
      const el = containerRef.current;

      if (!el || prevZoom === 0) {
        zoomRef.current = nextZoom;
        setZoom(nextZoom);
        return;
      }

      const rect = el.getBoundingClientRect();
      const focalX = clientX - (rect.left + rect.width / 2);
      const focalY = clientY - (rect.top + rect.height / 2);
      const scaleRatio = nextZoom / prevZoom;
      const nextPan = {
        x: focalX - (focalX - prevPan.x) * scaleRatio,
        y: focalY - (focalY - prevPan.y) * scaleRatio,
      };

      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
    },
    []
  );

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    applyZoomAtClientPoint(zoomRef.current * factor, e.clientX, e.clientY);
  };

  const getPinchMetrics = (pointers: Map<number, { x: number; y: number }>) => {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return null;
    const [a, b] = pts;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      distance: Math.hypot(dx, dy),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-plot-pin="true"]')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      pinchPrevRef.current = null;
      singleDragStartRef.current = {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moved: false,
      };
      setIsDragging(true);
    } else if (activePointersRef.current.size >= 2) {
      singleDragStartRef.current = null;
      pinchPrevRef.current = getPinchMetrics(activePointersRef.current);
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size >= 2) {
      const nextMetrics = getPinchMetrics(activePointersRef.current);
      const prevMetrics = pinchPrevRef.current;
      const el = containerRef.current;

      if (nextMetrics && prevMetrics && prevMetrics.distance > 0 && el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rawZoom = zoomRef.current * (nextMetrics.distance / prevMetrics.distance);
        const nextZoom = Math.min(4.5, Math.max(0.95, Number(rawZoom.toFixed(3))));
        const scaleRatio = nextZoom / zoomRef.current;

        const prevFocalX = prevMetrics.midX - centerX;
        const prevFocalY = prevMetrics.midY - centerY;
        const currFocalX = nextMetrics.midX - centerX;
        const currFocalY = nextMetrics.midY - centerY;

        const nextPan = {
          x: currFocalX - (prevFocalX - panRef.current.x) * scaleRatio,
          y: currFocalY - (prevFocalY - panRef.current.y) * scaleRatio,
        };

        zoomRef.current = nextZoom;
        panRef.current = nextPan;
        setZoom(nextZoom);
        setPan(nextPan);
      }

      pinchPrevRef.current = nextMetrics;
      return;
    }

    const drag = singleDragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.clientX;
    const dy = e.clientY - drag.clientY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      drag.moved = true;
    }
    const nextPan = {
      x: drag.panX + dx,
      y: drag.panY + dy,
    };
    panRef.current = nextPan;
    setPan(nextPan);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = singleDragStartRef.current;
    const wasTap =
      drag &&
      drag.pointerId === e.pointerId &&
      !drag.moved &&
      activePointersRef.current.size === 1;

    activePointersRef.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (wasTap) {
      const now = Date.now();
      const prevTap = lastTapRef.current;
      if (
        prevTap &&
        now - prevTap.time < 320 &&
        Math.hypot(e.clientX - prevTap.x, e.clientY - prevTap.y) < 32
      ) {
        lastTapRef.current = null;
        if (zoomRef.current >= 1.75) {
          playZoomOutSound();
          handleResetView();
        } else {
          playZoomInSound();
          applyZoomAtClientPoint(2.2, e.clientX, e.clientY);
        }
      } else {
        lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
      }
    }

    if (activePointersRef.current.size === 1) {
      // Transition smoothly from 2-finger pinch back to 1-finger pan
      const [remainingId, remainingPt] = Array.from(activePointersRef.current.entries())[0];
      pinchPrevRef.current = null;
      singleDragStartRef.current = {
        pointerId: remainingId,
        clientX: remainingPt.x,
        clientY: remainingPt.y,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moved: true,
      };
      setIsDragging(true);
    } else if (activePointersRef.current.size === 0) {
      singleDragStartRef.current = null;
      pinchPrevRef.current = null;
      setIsDragging(false);
    }
  };

  const hoveredPlot = hoveredPlotId ? plots.find((p) => p.id === hoveredPlotId) : null;
  const hasActiveFilter =
    filters.search !== '' ||
    filters.zone !== 'ALL' ||
    filters.model !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.facing !== 'ALL';

  const statusCounts = {
    available: plots.filter((p) => p.status === 'available').length,
    showhouse: plots.filter((p) => p.status === 'showhouse').length,
    reserved: plots.filter((p) => p.status === 'reserved').length,
    not_open: plots.filter((p) => p.status === 'not_open').length,
    sold: plots.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="flex flex-col gap-3.5 md:gap-4">
      {/* Workspace Filter & Overlay Mode Bar */}
      <div className="bg-[#FFFEFC] border border-[#E2DDD0] rounded-3xl p-4 sm:p-5 shadow-[0_8px_28px_rgba(15,61,44,0.05)] flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          {/* Search + Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="w-4 h-4 text-[#0F3D2C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                placeholder="ค้นหาแปลง / บ้านเลขที่ (เช่น A01, 9/1)"
                className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]/25 focus:border-[#0F3D2C] focus:bg-white transition-colors"
              />
              {filters.search && (
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => onFiltersChange({ search: '' })}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-black/5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              aria-label="กรองตามโซน"
              value={filters.zone}
              onChange={(e) => onFiltersChange({ zone: e.target.value })}
              className="min-h-[44px] px-3 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]/25 cursor-pointer"
            >
              <option value="ALL">ทุกโซน (A–N)</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  โซน {z}
                </option>
              ))}
            </select>

            <select
              aria-label="กรองตามแบบบ้าน"
              value={filters.model}
              onChange={(e) => onFiltersChange({ model: e.target.value as HouseModelId | 'ALL' })}
              className="min-h-[44px] px-3 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]/25 cursor-pointer"
            >
              <option value="ALL">ทุกแบบบ้าน (7 แบบ)</option>
              {HOUSE_MODEL_ORDER.map((m) => (
                <option key={m} value={m}>
                  {m} ({HOUSE_MODELS[m].usableAreaSqM} ตร.ม.)
                </option>
              ))}
            </select>

            <select
              aria-label="กรองตามสถานะ"
              value={filters.status}
              onChange={(e) => onFiltersChange({ status: e.target.value as PlotStatus | 'ALL' })}
              className="min-h-[44px] px-3 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]/25 cursor-pointer"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="available">ว่าง / พร้อมขาย</option>
              <option value="showhouse">บ้านตัวอย่าง</option>
              <option value="reserved">จองแล้ว</option>
              <option value="not_open">ยังไม่เปิดขาย</option>
              <option value="sold">ขายแล้ว</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                data-sound="custom"
                onClick={onResetFilters}
                className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-[#B91C3C] hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* Segmented Overlay Display Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#EFECE3] rounded-xl shrink-0 overflow-x-auto ipad-scroll-strip max-w-full">
            {(
              [
                { id: 'plot', label: 'รหัสแปลง' },
                { id: 'houseNumber', label: 'บ้านเลขที่' },
                { id: 'price', label: 'ราคา (ลบ.)' },
                { id: 'status', label: 'สถานะ' },
              ] as { id: OverlayMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                data-sound="custom"
                onClick={() => {
                  playToggleSound();
                  onOverlayModeChange(mode.id);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  overlayMode === mode.id
                    ? 'bg-[#0F3D2C] text-white shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-[#0F3D2C]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Quick-Jump Strip & Live Matching Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-[#ECE6DB] text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto ipad-scroll-strip pb-0.5 max-w-full">
            <span className="text-zinc-500 whitespace-nowrap mr-1">ซูมดูโซน:</span>
            {ZONE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                data-sound="custom"
                onClick={() => {
                  if (preset.zoom === 1) {
                    playZoomOutSound();
                    handleResetView();
                  } else {
                    playZoomInSound();
                    centerOnPercent(preset.centerX, preset.centerY, preset.zoom);
                  }
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F3EFE8] hover:bg-[#E9E3D8] active:scale-[0.98] border border-[#E3DCD0] text-zinc-700 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-zinc-600 tabular-nums whitespace-nowrap">
            <span className="mr-1 text-zinc-500">
              แสดงผล <strong className="text-zinc-900">{filteredPlotIds.size}</strong>/{plots.length}
            </span>
            {(
              [
                { id: 'available', label: 'ว่าง', count: statusCounts.available },
                { id: 'showhouse', label: 'ตัวอย่าง', count: statusCounts.showhouse },
                { id: 'reserved', label: 'จอง', count: statusCounts.reserved },
                { id: 'not_open', label: 'ยังไม่เปิดขาย', count: statusCounts.not_open },
                { id: 'sold', label: 'ขายแล้ว', count: statusCounts.sold },
              ] as { id: PlotStatus; label: string; count: number }[]
            ).map((item) => {
              const active = filters.status === item.id;
              const st = STATUS_STYLES[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playToggleSound();
                    onFiltersChange({ status: active ? 'ALL' : item.id });
                  }}
                  className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                    active
                      ? `${st.bg} ${st.text} ${st.border} font-semibold`
                      : 'bg-white border-[#E3DCD0] text-zinc-700 hover:bg-[#F3EFE8]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.dotBg}`} />
                  <span>
                    {item.label} {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Pan/Zoom Master Plan Canvas */}
      <div className="relative bg-[#FFFEFC] border border-[#E2DDD0] rounded-3xl overflow-hidden shadow-[0_10px_34px_rgba(15,61,44,0.06)]">
        {/* Top-Right Zoom Controls (44px+ iPad Touch Targets) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-[#E3DCD0] rounded-2xl p-1.5 shadow-sm">
          <button
            type="button"
            data-sound="custom"
            title="ขยายเข้า"
            aria-label="ขยายเข้า"
            onClick={() => {
              playZoomInSound();
              setZoom((z) => {
                const next = Math.min(4.5, Number((z * 1.25).toFixed(2)));
                zoomRef.current = next;
                return next;
              });
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            data-sound="custom"
            title="ย่อออก"
            aria-label="ย่อออก"
            onClick={() => {
              playZoomOutSound();
              setZoom((z) => {
                const next = Math.max(0.95, Number((z * 0.8).toFixed(2)));
                zoomRef.current = next;
                return next;
              });
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            type="button"
            data-sound="custom"
            title="รีเซ็ตมุมมอง"
            aria-label="รีเซ็ตมุมมอง"
            onClick={() => {
              playZoomOutSound();
              handleResetView();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-sound="custom"
            title="พอดีหน้าจอ"
            aria-label="พอดีหน้าจอ"
            onClick={() => {
              playZoomOutSound();
              handleResetView();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-700 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom level readout (top-left quiet indicator) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-white/92 backdrop-blur-sm border border-[#E3DCD0] rounded-xl px-3 py-1.5 text-xs font-mono-tabular text-zinc-600 shadow-2xs">
          {Math.round(zoom * 100)}% · จีบ 2 นิ้วซูม / แตะ 2 ครั้ง / ลากเลื่อน
        </div>

        {/* Viewport Box */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full h-[56dvh] md:h-[60dvh] lg:h-[62dvh] min-h-[420px] max-h-[760px] bg-[#FAF9F7] overflow-hidden select-none touch-none flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Transformed Image + Plot Markers Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative flex items-center justify-center shrink-0"
          >
            <div
              style={{ width: canvasSize.width, height: canvasSize.height }}
              className="relative shrink-0"
            >
              <img
                src={MASTER_PLAN_IMAGE}
                alt="ผังโครงการ CENTRO พระราม 2 - พุทธบูชา 2"
                draggable={false}
                className="w-full h-full block pointer-events-none"
              />

              {/* Dense Clouds / Fog Covering Zones Not Yet Open for Sale */}
              <NotOpenFogOverlay plots={plots} />

              {/* Interactive Plot Markers (hide plots hidden beneath the unopened-zone fog) */}
              {plots.map((plot) => {
                if (plot.status === 'not_open') return null;

                const isSelected = selectedPlotId === plot.id;
                const isMatched = filteredPlotIds.has(plot.id);
                const statusStyle = STATUS_STYLES[plot.status];

                let labelText = plot.id;
                if (overlayMode === 'houseNumber') labelText = plot.houseNumber;
                else if (overlayMode === 'price') labelText = formatMillion(plot.price);
                else if (overlayMode === 'status') labelText = STATUS_SHORT_LABELS[plot.status];

                // Scale marker gently with zoom so circles stay compact in overview and crisp when zoomed
                const invScale = zoom > 1.35 ? 1 / Math.pow(zoom, 0.52) : 1;
                const isWideLabel =
                  overlayMode === 'houseNumber' ||
                  overlayMode === 'price' ||
                  overlayMode === 'status';

                return (
                  <button
                    key={plot.id}
                    type="button"
                    data-plot-pin="true"
                    data-sound="custom"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSelectPlotSound();
                      onSelectPlot(plot.id);
                    }}
                    onMouseEnter={() => setHoveredPlotId(plot.id)}
                    onMouseLeave={() => setHoveredPlotId((prev) => (prev === plot.id ? null : prev))}
                    style={{
                      left: `${plot.x}%`,
                      top: `${plot.y}%`,
                      transform: `translate(-50%, -50%) scale(${isSelected ? invScale * 1.28 : invScale})`,
                    }}
                    aria-label={`แปลง ${plot.id} บ้านเลขที่ ${plot.houseNumber} แบบ ${plot.model} ราคา ${formatMillion(plot.price)} ล้านบาท`}
                    className={`absolute z-20 aspect-square rounded-full flex items-center justify-center p-0 font-display tabular-nums font-semibold leading-none border-[1.5px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164A37] overflow-hidden ${
                      isWideLabel
                        ? 'w-[18px] h-[18px] text-[4.8px] tracking-[-0.05em]'
                        : 'w-[15px] h-[15px] text-[5.5px] tracking-[-0.02em]'
                    } ${
                      isSelected
                        ? 'z-30 bg-[#A31C32] text-white border-amber-200 shadow-[0_2px_10px_rgba(163,28,50,0.55)] ring-2 ring-[#C59B48]/70'
                        : isMatched
                        ? `${statusStyle.pinBg} ${statusStyle.pinText} ${statusStyle.pinBorder} shadow-[0_1px_3px_rgba(0,0,0,0.28)] hover:z-30 hover:scale-115`
                        : 'opacity-20 bg-zinc-300/70 text-zinc-500 border-white/70 pointer-events-none'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-full h-full text-center leading-none">
                      {labelText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hover Tooltip (Bottom-Left Floating Readout) */}
          {hoveredPlot && (
            <div className="absolute bottom-3 left-3 z-30 pointer-events-none bg-[#123326]/95 text-white rounded-2xl px-4 py-3 shadow-lg max-w-xs border border-white/15">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-mono-tabular font-semibold text-white">
                  แปลง {hoveredPlot.id}
                </span>
                <span className="text-emerald-200 font-mono-tabular">
                  บ้านเลขที่ {hoveredPlot.houseNumber}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-stone-300">
                <span className="font-medium text-white">{hoveredPlot.model}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{hoveredPlot.landSqWah.toFixed(1)} ตร.วา</span>
                <span aria-hidden="true">·</span>
                <span>ทิศ{hoveredPlot.facing}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-4 text-xs">
                <span className="font-mono-tabular font-semibold text-amber-300">
                  {formatMillion(hoveredPlot.price)} ล้านบาท
                </span>
                <span className="inline-flex items-center gap-1.5 text-stone-200">
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[hoveredPlot.status].dotBg}`} />
                  {STATUS_SHORT_LABELS[hoveredPlot.status]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Clean Architectural Legend Footer */}
        <div className="px-4 py-3.5 bg-[#F3EFE8]/80 border-t border-[#ECE6DB] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-zinc-500 font-medium">แบบบ้านในผัง:</span>
            {HOUSE_MODEL_ORDER.map((modelId) => {
              const spec = HOUSE_MODELS[modelId];
              const isModelActive = filters.model === modelId;
              return (
                <button
                  key={modelId}
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playToggleSound();
                    onFiltersChange({ model: isModelActive ? 'ALL' : modelId });
                  }}
                  className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                    filters.model !== 'ALL' && !isModelActive ? 'opacity-45 hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-xs border border-black/15 shrink-0"
                    style={{ backgroundColor: spec.colorHex }}
                  />
                  <span className={`font-medium ${isModelActive ? 'text-[#164A37] underline underline-offset-4' : 'text-zinc-700'}`}>
                    {spec.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-300 border border-white shadow-xs" />
              <span>ว่าง</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-amber-300 shadow-xs" />
              <span>บ้านตัวอย่าง</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-xs" />
              <span>จองแล้ว</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-white via-[#EEF4F8] to-[#BFD0DC] border border-[#9FB5C4] shadow-xs" />
              <span>ยังไม่เปิดขาย (โซนหมอก)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs" />
              <span>ขายแล้ว</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
