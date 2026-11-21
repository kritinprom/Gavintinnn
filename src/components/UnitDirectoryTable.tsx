import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, MapPin, Search } from 'lucide-react';
import { HOUSE_MODELS, HOUSE_MODEL_ORDER } from '../data/houseModels';
import { ZONES } from '../data/masterPlanPlots';
import {
  FacingDirection,
  HouseModelId,
  PlotFilterState,
  PlotStatus,
  PlotUnit,
} from '../types/project';
import {
  formatMillion,
  formatPricePerWah,
  formatTHB,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../utils/formatters';
import { MiniCatFace } from './CuteWalkingCats';

interface UnitDirectoryTableProps {
  plots: PlotUnit[];
  selectedPlotId: string | null;
  filters: PlotFilterState;
  onFiltersChange: (next: Partial<PlotFilterState>) => void;
  onResetFilters: () => void;
  onSelectAndLocate: (id: string) => void;
  onUpdatePlot: (id: string, patch: Partial<PlotUnit>) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
}

type SortKey = 'id' | 'houseNumber' | 'landSqWah' | 'price' | 'pricePerWah' | 'usableArea';

export function UnitDirectoryTable({
  plots,
  selectedPlotId,
  filters,
  onFiltersChange,
  onResetFilters,
  onSelectAndLocate,
  onUpdatePlot,
  bookmarkedIds,
  onToggleBookmark,
}: UnitDirectoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftHouseNo, setDraftHouseNo] = useState('');
  const [draftPrice, setDraftPrice] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedPlots = useMemo(() => {
    const list = [...plots];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortKey === 'houseNumber') {
        cmp = a.houseNumber.localeCompare(b.houseNumber, undefined, { numeric: true });
      } else if (sortKey === 'landSqWah') {
        cmp = a.landSqWah - b.landSqWah;
      } else if (sortKey === 'price') {
        cmp = a.price - b.price;
      } else if (sortKey === 'pricePerWah') {
        cmp = a.price / a.landSqWah - b.price / b.landSqWah;
      } else if (sortKey === 'usableArea') {
        cmp = HOUSE_MODELS[a.model].usableAreaSqM - HOUSE_MODELS[b.model].usableAreaSqM;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [plots, sortKey, sortDir]);

  const startRowEdit = (e: React.MouseEvent, plot: PlotUnit) => {
    e.stopPropagation();
    setEditingRowId(plot.id);
    setDraftHouseNo(plot.houseNumber);
    setDraftPrice(String(plot.price));
  };

  const saveRowEdit = (e: React.MouseEvent, plot: PlotUnit) => {
    e.stopPropagation();
    const parsed = Number(draftPrice.replace(/,/g, ''));
    onUpdatePlot(plot.id, {
      houseNumber: draftHouseNo.trim() || plot.houseNumber,
      price: Number.isFinite(parsed) && parsed > 0 ? parsed : plot.price,
    });
    setEditingRowId(null);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#6B1D45]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#6B1D45]" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-4 shadow-[0_4px_20px_rgba(122,34,79,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search className="w-4 h-4 text-[#9B5C7C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              placeholder="ค้นหารหัสแปลง / บ้านเลขที่ / หมายเหตุ"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 focus:bg-white"
            />
          </div>

          <select
            aria-label="โซน"
            value={filters.zone}
            onChange={(e) => onFiltersChange({ zone: e.target.value })}
            className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl cursor-pointer"
          >
            <option value="ALL">ทุกโซน (A–N)</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                โซน {z}
              </option>
            ))}
          </select>

          <select
            aria-label="แบบบ้าน"
            value={filters.model}
            onChange={(e) => onFiltersChange({ model: e.target.value as HouseModelId | 'ALL' })}
            className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl cursor-pointer"
          >
            <option value="ALL">ทุกแบบบ้าน</option>
            {HOUSE_MODEL_ORDER.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            aria-label="ทิศหน้าบ้าน"
            value={filters.facing}
            onChange={(e) => onFiltersChange({ facing: e.target.value as FacingDirection | 'ALL' })}
            className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl cursor-pointer"
          >
            <option value="ALL">ทุกทิศ</option>
            {(['เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันตก'] as FacingDirection[]).map((d) => (
              <option key={d} value={d}>
                ทิศ{d}
              </option>
            ))}
          </select>

          <select
            aria-label="สถานะ"
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value as PlotStatus | 'ALL' })}
            className="px-3 py-2 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl cursor-pointer"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="available">ว่าง / พร้อมขาย</option>
            <option value="showhouse">บ้านตัวอย่าง</option>
            <option value="reserved">จองแล้ว</option>
            <option value="sold">ขายแล้ว</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-600 tabular-nums">
          <span>พบ {sortedPlots.length} แปลง</span>
          {(filters.search ||
            filters.zone !== 'ALL' ||
            filters.model !== 'ALL' ||
            filters.facing !== 'ALL' ||
            filters.status !== 'ALL') && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[#7A224F] font-medium hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(122,34,79,0.03)]">
        {sortedPlots.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3EB] border border-[#EBDCD2] flex items-center justify-center mb-3">
              <MiniCatFace className="w-10 h-10" />
            </div>
            <p className="text-sm font-semibold text-[#2B1822]">ไม่พบแปลงบ้านที่ตรงกับเงื่อนไข</p>
            <p className="mt-1 text-xs text-zinc-500">
              ลองปรับเปลี่ยนโซน แบบบ้าน หรือคำค้นหาใหม่นะครับ
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#7A224F] hover:bg-[#5E183C] rounded-xl cursor-pointer"
            >
              แสดงทุกแปลง
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF5F1] border-b border-[#EFE3DC] text-xs font-semibold text-zinc-600">
                  <th className="py-3 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('id')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      แปลง <SortIcon col="id" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSort('houseNumber')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      บ้านเลขที่ <SortIcon col="houseNumber" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">แบบบ้าน</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('usableArea')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      พื้นที่ใช้สอย <SortIcon col="usableArea" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('landSqWah')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      ขนาดที่ดิน <SortIcon col="landSqWah" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">ทิศหน้าบ้าน</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('price')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      ราคา (บาท) <SortIcon col="price" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('pricePerWah')}
                      className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                    >
                      บาท/ตร.วา <SortIcon col="pricePerWah" />
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">สถานะ</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sortedPlots.map((plot) => {
                  const model = HOUSE_MODELS[plot.model];
                  const isSelected = selectedPlotId === plot.id;
                  const isEditingThis = editingRowId === plot.id;
                  const isBookmarked = bookmarkedIds.includes(plot.id);
                  const stStyle = STATUS_STYLES[plot.status];

                  return (
                    <tr
                      key={plot.id}
                      onClick={() => onSelectAndLocate(plot.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#6B1D45]/5' : 'hover:bg-stone-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono-tabular font-semibold text-zinc-900 whitespace-nowrap">
                        {plot.id}
                      </td>
                      <td className="py-2.5 px-4 font-mono-tabular text-zinc-800 whitespace-nowrap" onClick={(e) => isEditingThis && e.stopPropagation()}>
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={draftHouseNo}
                            onChange={(e) => setDraftHouseNo(e.target.value)}
                            className="w-24 px-2 py-1 text-xs font-mono-tabular border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
                          />
                        ) : (
                          plot.houseNumber
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 font-medium text-zinc-900">
                          <span
                            className="w-2.5 h-2.5 rounded-xs border border-black/15 shrink-0"
                            style={{ backgroundColor: model.colorHex }}
                          />
                          <span>{model.name}</span>
                          {plot.houseTypeCode && (
                            <span className="text-[11px] font-mono-tabular font-normal text-zinc-400">
                              {plot.houseTypeCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-zinc-700 whitespace-nowrap">
                        {model.usableAreaSqM} ตร.ม.
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular font-medium text-zinc-900 whitespace-nowrap">
                        {plot.landSqWah.toFixed(1)} ตร.วา
                      </td>
                      <td className="py-2.5 px-4 text-zinc-700 whitespace-nowrap">
                        ทิศ{plot.facing}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold text-zinc-900 whitespace-nowrap" onClick={(e) => isEditingThis && e.stopPropagation()}>
                        {isEditingThis ? (
                          <input
                            type="number"
                            step="any"
                            value={draftPrice}
                            onChange={(e) => setDraftPrice(e.target.value)}
                            className="w-28 px-2 py-1 text-xs text-right font-mono-tabular border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
                          />
                        ) : (
                          <div>
                            <div>
                              {formatTHB(plot.price)}{' '}
                              <span className="text-xs font-normal text-zinc-500">
                                ({formatMillion(plot.price)} ลบ.)
                              </span>
                            </div>
                            {plot.minLc !== undefined &&
                              plot.totalPro !== undefined &&
                              Math.abs(plot.price - (plot.minLc + plot.totalPro)) < 0.01 && (
                                <div className="text-[10px] font-normal text-zinc-500">
                                  {formatTHB(plot.minLc)} + {formatTHB(plot.totalPro)}
                                </div>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-zinc-600 whitespace-nowrap">
                        {formatPricePerWah(plot.price, plot.landSqWah)}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${stStyle.text}`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${stStyle.dotBg}`} />
                          {STATUS_LABELS[plot.status]}
                        </span>
                      </td>
                      <td
                        className="py-2.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {isEditingThis ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => saveRowEdit(e, plot)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-[#6B1D45] rounded hover:bg-[#541536] cursor-pointer"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRowId(null);
                                }}
                                className="px-2 py-1 text-xs text-zinc-600 hover:bg-stone-100 rounded cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => startRowEdit(e, plot)}
                                className="px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-stone-100 rounded cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectAndLocate(plot.id)}
                                title="ดูบนผังโครงการ"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#6B1D45] hover:bg-[#6B1D45]/10 rounded cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                ดูผัง
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleBookmark(plot.id)}
                                title="เปรียบเทียบ"
                                aria-label="เปรียบเทียบ"
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  isBookmarked
                                    ? 'text-[#6B1D45] bg-[#6B1D45]/10'
                                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-stone-100'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
