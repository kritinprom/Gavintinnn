import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, RotateCcw, Search } from 'lucide-react';
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

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

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

      setZoom(targetZoom);
      setPan({
        x: -dxFromCenter * targetZoom,
        y: -dyFromCenter * targetZoom,
      });
    },
    [canvasSize]
  );

  // Auto-pan to selected plot when explicitly triggered from directory/models/compare
  useEffect(() => {
    if (focusRequestTick === 0 || !selectedPlotId) return;
    const target = plots.find((p) => p.id === selectedPlotId);
    if (target) {
      centerOnPercent(target.x, target.y, Math.max(zoom, 2.2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequestTick]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    setZoom((prev) => {
      const next = Math.min(4.5, Math.max(0.95, Number((prev * factor).toFixed(2))));
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-plot-pin="true"]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragStartRef.current = null;
    }
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
    sold: plots.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Workspace Filter & Overlay Mode Bar */}
      <div className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(122,34,79,0.03)] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search + Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[180px] max-w-[260px]">
              <Search className="w-4 h-4 text-[#9B5C7C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                placeholder="ค้นหาแปลง / บ้านเลขที่ (เช่น A01, 9/1)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 focus:border-[#7A224F] focus:bg-white transition-colors"
              />
            </div>

            <select
              aria-label="กรองตามโซน"
              value={filters.zone}
              onChange={(e) => onFiltersChange({ zone: e.target.value })}
              className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 cursor-pointer"
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
              className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 cursor-pointer"
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
              className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 cursor-pointer"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="available">ว่าง / พร้อมขาย</option>
              <option value="showhouse">บ้านตัวอย่าง</option>
              <option value="reserved">จองแล้ว</option>
              <option value="sold">ขายแล้ว</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3 py-2 text-xs font-medium text-[#7A224F] hover:bg-[#FDF2F6] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* Segmented Overlay Display Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F5ECE6] rounded-xl shrink-0 overflow-x-auto">
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
                onClick={() => onOverlayModeChange(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  overlayMode === mode.id
                    ? 'bg-white text-[#6B1D45] shadow-sm font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Quick-Jump Strip & Live Matching Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F2E8E1] text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-zinc-500 whitespace-nowrap mr-1">ซูมดูโซน:</span>
            {ZONE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (preset.zoom === 1) {
                    handleResetView();
                  } else {
                    centerOnPercent(preset.centerX, preset.centerY, preset.zoom);
                  }
                }}
                className="px-3 py-1 rounded-xl bg-[#FAF5F1] hover:bg-[#F3E6DE] border border-[#EDE0D8] text-zinc-700 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                { id: 'sold', label: 'ขายแล้ว', count: statusCounts.sold },
              ] as { id: PlotStatus; label: string; count: number }[]
            ).map((item) => {
              const active = filters.status === item.id;
              const st = STATUS_STYLES[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ status: active ? 'ALL' : item.id })
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? `${st.bg} ${st.text} ${st.border} font-semibold`
                      : 'bg-white border-[#EDE0D8] text-zinc-700 hover:bg-[#FAF5F1]'
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
      <div className="relative bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(122,34,79,0.03)]">
        {/* Top-Right Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-[#EBDCD2] rounded-xl p-1 shadow-sm">
          <button
            type="button"
            title="ขยายเข้า"
            aria-label="ขยายเข้า"
            onClick={() => setZoom((z) => Math.min(4.5, Number((z * 1.25).toFixed(2))))}
            className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="ย่อออก"
            aria-label="ย่อออก"
            onClick={() => setZoom((z) => Math.max(0.95, Number((z * 0.8).toFixed(2))))}
            className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="รีเซ็ตมุมมอง"
            aria-label="รีเซ็ตมุมมอง"
            onClick={handleResetView}
            className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="พอดีหน้าจอ"
            aria-label="พอดีหน้าจอ"
            onClick={handleResetView}
            className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom level readout (top-left quiet indicator) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-white/92 backdrop-blur-sm border border-[#EBDCD2] rounded-xl px-3 py-1 text-xs font-mono-tabular text-zinc-600 shadow-2xs">
          {Math.round(zoom * 100)}% · ลากเพื่อเลื่อน / เลื่อนลูกกลิ้งเพื่อซูม
        </div>

        {/* Viewport Box */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full h-[54vh] min-h-[420px] max-h-[700px] bg-[#FAF9F7] overflow-hidden select-none touch-none flex items-center justify-center ${
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

              {/* Interactive Plot Markers */}
              {plots.map((plot) => {
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
                    onClick={(e) => {
                      e.stopPropagation();
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
                    className={`absolute z-10 aspect-square rounded-full flex items-center justify-center p-0 font-display tabular-nums font-semibold leading-none border-[1.5px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1D45] overflow-hidden ${
                      isWideLabel
                        ? 'w-[18px] h-[18px] text-[4.8px] tracking-[-0.05em]'
                        : 'w-[15px] h-[15px] text-[5.5px] tracking-[-0.02em]'
                    } ${
                      isSelected
                        ? 'z-30 bg-[#6B1D45] text-white border-white shadow-[0_2px_8px_rgba(107,29,69,0.5)] ring-2 ring-[#6B1D45]/35'
                        : isMatched
                        ? `${statusStyle.pinBg} ${statusStyle.pinText} ${statusStyle.pinBorder} shadow-[0_1px_3px_rgba(0,0,0,0.28)] hover:z-20 hover:scale-115`
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
            <div className="absolute bottom-3 left-3 z-30 pointer-events-none bg-[#2B1822]/95 text-white rounded-2xl px-4 py-3 shadow-lg max-w-xs border border-white/10">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-mono-tabular font-semibold text-white">
                  แปลง {hoveredPlot.id}
                </span>
                <span className="text-rose-200 font-mono-tabular">
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
        <div className="px-4 py-3.5 bg-[#FAF5F1]/80 border-t border-[#EFE3DC] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-zinc-500 font-medium">แบบบ้านในผัง:</span>
            {HOUSE_MODEL_ORDER.map((modelId) => {
              const spec = HOUSE_MODELS[modelId];
              const isModelActive = filters.model === modelId;
              return (
                <button
                  key={modelId}
                  type="button"
                  onClick={() =>
                    onFiltersChange({ model: isModelActive ? 'ALL' : modelId })
                  }
                  className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${
                    filters.model !== 'ALL' && !isModelActive ? 'opacity-45 hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-xs border border-black/15 shrink-0"
                    style={{ backgroundColor: spec.colorHex }}
                  />
                  <span className={`font-medium ${isModelActive ? 'text-[#6B1D45] underline underline-offset-4' : 'text-zinc-700'}`}>
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
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs" />
              <span>ขายแล้ว</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
