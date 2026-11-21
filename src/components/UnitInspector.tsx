import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Pencil,
  X,
} from 'lucide-react';
import { HOUSE_MODELS } from '../data/houseModels';
import { PlotStatus, PlotUnit } from '../types/project';
import {
  calculateTwoPhaseMortgage,
  formatMillion,
  formatPricePerWah,
  formatTHB,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../utils/formatters';
import { MiniCatFace } from './CuteWalkingCats';

interface UnitInspectorProps {
  plot: PlotUnit | null;
  onUpdatePlot: (id: string, patch: Partial<PlotUnit>) => void;
  onFocusOnPlan: (id: string) => void;
  onNavigatePlot: (direction: 'prev' | 'next') => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  canBookmarkMore: boolean;
}

export function UnitInspector({
  plot,
  onUpdatePlot,
  onFocusOnPlan,
  onNavigatePlot,
  isBookmarked,
  onToggleBookmark,
  canBookmarkMore,
}: UnitInspectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftHouseNumber, setDraftHouseNumber] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftStatus, setDraftStatus] = useState<PlotStatus>('available');
  const [draftNote, setDraftNote] = useState('');

  // Mortgage Estimator state
  const [borrowerAgeInput, setBorrowerAgeInput] = useState<string>('30');
  const [downPercent, setDownPercent] = useState<number>(0);
  const [promoRate3Years, setPromoRate3Years] = useState<number>(1.59);
  const [floatingRateAfterYear3, setFloatingRateAfterYear3] = useState<number>(5.25);
  const [loanYears, setLoanYears] = useState<number>(30);

  useEffect(() => {
    if (plot) {
      setDraftHouseNumber(plot.houseNumber);
      setDraftPrice(String(plot.price));
      setDraftStatus(plot.status);
      setDraftNote(plot.note);
      setIsEditing(false);
    }
  }, [plot]);

  const parsedAge = Number(borrowerAgeInput);
  const hasValidAge =
    borrowerAgeInput.trim() !== '' && Number.isFinite(parsedAge) && parsedAge >= 20 && parsedAge < 70;
  const maxAllowedYears = hasValidAge ? Math.min(40, Math.max(1, 70 - Math.floor(parsedAge))) : 0;
  const isOverAgeLimit = borrowerAgeInput.trim() !== '' && Number.isFinite(parsedAge) && parsedAge >= 70;
  const isUnderMinAge = borrowerAgeInput.trim() !== '' && Number.isFinite(parsedAge) && parsedAge < 20;

  const loanYearOptions = React.useMemo(() => {
    if (maxAllowedYears <= 0) return [];
    const base = [5, 10, 15, 20, 25, 30, 35, 40].filter((y) => y <= maxAllowedYears);
    if (!base.includes(maxAllowedYears)) {
      base.push(maxAllowedYears);
    }
    return base.sort((a, b) => a - b);
  }, [maxAllowedYears]);

  const effectiveLoanYears =
    maxAllowedYears > 0 ? Math.min(loanYears, maxAllowedYears) : 0;

  useEffect(() => {
    if (maxAllowedYears > 0 && loanYears > maxAllowedYears) {
      setLoanYears(maxAllowedYears);
    }
  }, [maxAllowedYears, loanYears]);

  if (!plot) {
    return (
      <aside className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-6 flex flex-col justify-center items-center text-center min-h-[380px] shadow-[0_4px_20px_rgba(122,34,79,0.03)]">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF3EB] border border-[#EBDCD2] flex items-center justify-center mb-3">
          <MiniCatFace className="w-10 h-10" />
        </div>
        <p className="text-sm font-semibold text-[#2B1822]">ยังไม่ได้เลือกแปลงบ้าน</p>
        <p className="mt-1.5 text-xs text-zinc-500 max-w-xs leading-relaxed">
          คลิกที่รหัสแปลงบนผังโครงการ (เช่น A01, I05, N10) เพื่อดูบ้านเลขที่ แบบบ้าน ขนาดที่ดิน และราคาประเมินของแต่ละหลัง
        </p>
      </aside>
    );
  }

  const modelSpec = HOUSE_MODELS[plot.model];
  const statusStyle = STATUS_STYLES[plot.status];
  const mortgage = calculateTwoPhaseMortgage(
    plot.price,
    downPercent,
    promoRate3Years,
    floatingRateAfterYear3,
    effectiveLoanYears
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(draftPrice.replace(/,/g, ''));
    onUpdatePlot(plot.id, {
      houseNumber: draftHouseNumber.trim() || plot.houseNumber,
      price: Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : plot.price,
      status: draftStatus,
      note: draftNote.trim(),
    });
    setIsEditing(false);
  };

  const hasOfficialBreakdown =
    plot.minLc !== undefined &&
    plot.totalPro !== undefined &&
    Math.abs(plot.price - (plot.minLc + plot.totalPro)) < 0.01;

  return (
    <aside className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(122,34,79,0.04)]">
      {/* Top Header Strip */}
      <div className="px-5 py-4 border-b border-[#EFE3DC] bg-white/70 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>โซน {plot.zone}</span>
            <span aria-hidden="true">·</span>
            <span>ทิศ{plot.facing}</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1.5 font-medium ${statusStyle.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dotBg}`} />
              {STATUS_LABELS[plot.status]}
            </span>
          </div>
          <h2 className="mt-0.5 text-xl font-bold text-zinc-900 font-display flex items-center gap-2.5">
            <span className="font-mono-tabular">แปลง {plot.id}</span>
            <span className="text-sm font-medium text-zinc-500 font-sans">
              บ้านเลขที่ <strong className="text-zinc-900 font-mono-tabular">{plot.houseNumber}</strong>
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onNavigatePlot('prev')}
            title="แปลงก่อนหน้า"
            aria-label="แปลงก่อนหน้า"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-200 text-zinc-600 hover:bg-stone-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigatePlot('next')}
            title="แปลงถัดไป"
            aria-label="แปลงถัดไป"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-200 text-zinc-600 hover:bg-stone-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price & House Number Primary Section */}
      <div className="p-5 border-b border-[#EFE3DC]">
        {!isEditing ? (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-xs text-zinc-500">
                  {hasOfficialBreakdown ? 'ราคารวม (MIN LC + TOTAL PRO)' : 'ราคาบ้านและที่ดิน (ประมาณการ)'}
                </div>
                <div className="mt-0.5 text-2xl font-bold text-[#7A224F] font-mono-tabular">
                  {formatTHB(plot.price)} <span className="text-sm font-medium text-zinc-600">บาท</span>
                </div>
                <div className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                  {formatMillion(plot.price)} ล้านบาท · เฉลี่ย {formatPricePerWah(plot.price, plot.landSqWah)} บาท/ตร.วา
                </div>
                {hasOfficialBreakdown && plot.minLc !== undefined && plot.totalPro !== undefined && (
                  <div className="mt-1.5 text-[11px] text-zinc-600 font-mono-tabular">
                    MIN LC {formatTHB(plot.minLc)} + TOTAL PRO {formatTHB(plot.totalPro)} บาท
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-[#FAF5F1] hover:bg-[#F3E6DE] border border-[#EDE0D8] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                แก้ไขข้อมูล
              </button>
            </div>

            {/* Quick Status Selector */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {(['available', 'showhouse', 'reserved', 'sold'] as PlotStatus[]).map((st) => {
                const active = plot.status === st;
                const stStyle = STATUS_STYLES[st];
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdatePlot(plot.id, { status: st })}
                    className={`py-2 px-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      active
                        ? `${stStyle.bg} ${stStyle.text} ${stStyle.border} font-semibold`
                        : 'bg-white border-[#EBDCD2] text-zinc-600 hover:bg-[#FAF5F1]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stStyle.dotBg}`} />
                    {st === 'available'
                      ? 'ว่าง / พร้อมขาย'
                      : st === 'showhouse'
                      ? 'บ้านตัวอย่าง'
                      : st === 'reserved'
                      ? 'จองแล้ว'
                      : 'ขายแล้ว'}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">
                แก้ไขข้อมูลแปลง {plot.id}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                aria-label="ยกเลิกการแก้ไข"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-zinc-600 mb-1">บ้านเลขที่</label>
                <input
                  type="text"
                  value={draftHouseNumber}
                  onChange={(e) => setDraftHouseNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm font-mono-tabular border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-600 mb-1">ราคา (บาท)</label>
                <input
                  type="number"
                  step="any"
                  value={draftPrice}
                  onChange={(e) => setDraftPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm font-mono-tabular border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-600 mb-1">สถานะ</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as PlotStatus)}
                className="w-full px-2.5 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
              >
                <option value="available">ว่าง / พร้อมขาย</option>
                <option value="showhouse">บ้านตัวอย่าง</option>
                <option value="reserved">จองแล้ว</option>
                <option value="sold">ขายแล้ว</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-600 mb-1">หมายเหตุแปลง</label>
              <input
                type="text"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="เช่น แปลงมุม, ติดสวน, โปรโมชันพิเศษ"
                className="w-full px-2.5 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B1D45]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-stone-100 rounded-md cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#6B1D45] hover:bg-[#541536] rounded-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                บันทึก
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Architectural Specs List (No nested boxes, clean hairline rows) */}
      <div className="px-5 py-4 border-b border-stone-200 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">แบบบ้าน</span>
          <span className="flex items-center gap-2 font-semibold text-zinc-900">
            <span
              className="w-3 h-3 rounded-xs border border-black/15"
              style={{ backgroundColor: modelSpec.colorHex }}
            />
            {modelSpec.name}
            {plot.houseTypeCode && (
              <span className="text-xs font-mono-tabular font-normal text-zinc-500">
                ({plot.houseTypeCode})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ขนาดที่ดิน</span>
          <span className="font-mono-tabular font-semibold text-zinc-900">
            {plot.landSqWah.toFixed(1)} ตร.วา
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">พื้นที่ใช้สอย</span>
          <span className="font-mono-tabular font-medium text-zinc-900">
            {modelSpec.usableAreaSqM} ตร.ม.
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ฟังก์ชันบ้าน</span>
          <span className="text-zinc-900 tabular-nums text-right">
            {modelSpec.bedrooms} นอน · {modelSpec.bathrooms} น้ำ · {modelSpec.parking} จอดรถ
            {modelSpec.maidRoom ? ' · 1 แม่บ้าน' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ทิศหน้าบ้าน</span>
          <span className="text-zinc-900 font-medium">ทิศ{plot.facing}</span>
        </div>
        {plot.note && (
          <div className="flex items-start justify-between gap-4 pt-1 border-t border-stone-100">
            <span className="text-zinc-500 shrink-0">จุดเด่น / หมายเหตุ</span>
            <span className="text-zinc-800 text-right text-xs leading-relaxed">{plot.note}</span>
          </div>
        )}
      </div>

      {/* Mortgage Quick Estimator */}
      <div className="px-5 py-4 border-b border-[#EFE3DC] bg-[#FAF5F1]/75 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#2B1822]">คำนวณค่างวดผ่อนชำระเบื้องต้น</span>
          {effectiveLoanYears <= 0 && (
            <span className="text-xs font-medium text-red-600">
              {isUnderMinAge ? 'อายุไม่ถึงเกณฑ์ 20 ปี' : 'เกินเกณฑ์อายุ 70 ปี'}
            </span>
          )}
        </div>

        {/* Clear 2-Phase Monthly Installment Comparison */}
        {effectiveLoanYears > 0 && (
          <div className="grid grid-cols-2 gap-2.5 bg-white border border-[#EBDCD2] rounded-xl p-3">
            <div>
              <div className="text-[11px] text-zinc-500">
                3 ปีแรก ({promoRate3Years.toFixed(2)}%/ปี)
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-[#7A224F] font-mono-tabular">
                ~{formatTHB(mortgage.first3YearsMonthly)}
                <span className="text-[11px] font-normal text-zinc-500 ml-1">บ./ด.</span>
              </div>
            </div>

            <div className="pl-2.5 border-l border-[#EFE3DC]">
              <div className="text-[11px] text-zinc-500">
                หลังปีที่ 3 (ลอยตัว {floatingRateAfterYear3.toFixed(2)}%)
              </div>
              <div className="mt-0.5 text-base sm:text-lg font-bold text-zinc-800 font-mono-tabular">
                {mortgage.hasAfterYear3Phase ? (
                  <>
                    ~{formatTHB(mortgage.afterYear3Monthly)}
                    <span className="text-[11px] font-normal text-zinc-500 ml-1">บ./ด.</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-emerald-700">ผ่อนครบใน 3 ปี</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label htmlFor="mortgage-borrower-age" className="block text-zinc-600 mb-1">
              อายุผู้กู้ (20–69 ปี)
            </label>
            <div className="relative">
              <input
                id="mortgage-borrower-age"
                type="number"
                min={20}
                max={80}
                step={1}
                value={borrowerAgeInput}
                onChange={(e) => setBorrowerAgeInput(e.target.value)}
                className="w-full px-3 py-2 pr-8 bg-white border border-[#E5D5CC] rounded-xl text-zinc-800 font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 focus:border-[#7A224F]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 pointer-events-none">
                ปี
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="mortgage-loan-years" className="block text-zinc-600 mb-1">
              ระยะกู้ (สูงสุด {maxAllowedYears > 0 ? `${maxAllowedYears} ปี` : '0 ปี'})
            </label>
            <select
              id="mortgage-loan-years"
              value={effectiveLoanYears}
              disabled={loanYearOptions.length === 0}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-white border border-[#E5D5CC] rounded-xl text-zinc-800 tabular-nums cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loanYearOptions.length === 0 ? (
                <option value={0}>ไม่สามารถกู้ได้</option>
              ) : (
                loanYearOptions.map((v) => (
                  <option key={v} value={v}>
                    {v} ปี
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="mortgage-down-percent" className="block text-zinc-600 mb-1">
              เงินดาวน์ ({downPercent}%)
            </label>
            <select
              id="mortgage-down-percent"
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-white border border-[#E5D5CC] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[0, 5, 10, 15, 20, 30].map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mortgage-promo-rate" className="block text-zinc-600 mb-1">
              ดอกเบี้ย 3 ปีแรก
            </label>
            <select
              id="mortgage-promo-rate"
              value={promoRate3Years}
              onChange={(e) => setPromoRate3Years(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-white border border-[#E5D5CC] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[1.59, 1.69, 1.79, 1.89, 1.99].map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(2)}%
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label htmlFor="mortgage-floating-rate" className="block text-zinc-600 mb-1">
              ดอกเบี้ยลอยตัวหลังปีที่ 3 (ขึ้นอยู่กับแต่ละธนาคาร)
            </label>
            <select
              id="mortgage-floating-rate"
              value={floatingRateAfterYear3}
              onChange={(e) => setFloatingRateAfterYear3(Number(e.target.value))}
              className="w-full px-2.5 py-2 bg-white border border-[#E5D5CC] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[4.5, 4.75, 5.0, 5.25, 5.5, 5.75, 6.0, 6.5].map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(2)}% ต่อปี (ประมาณการอัตราดอกเบี้ยลอยตัว MRR หลังหักส่วนลด)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1 text-[11px] tabular-nums leading-relaxed">
          {isOverAgeLimit ? (
            <p className="text-red-600 font-medium">
              อายุผู้กู้ต้องน้อยกว่า 70 ปี (กู้รวมอายุผู้กู้ได้สูงสุดไม่เกิน 70 ปี)
            </p>
          ) : isUnderMinAge ? (
            <p className="text-amber-700 font-medium">
              กรุณาระบุอายุผู้กู้ตั้งแต่ 20 ปีขึ้นไป
            </p>
          ) : hasValidAge ? (
            <p className="text-zinc-600">
              กู้ได้สูงสุด <strong className="text-zinc-900">{maxAllowedYears} ปี</strong> · อายุเมื่อผ่อนครบ{' '}
              <strong className="text-[#7A224F]">{Math.floor(parsedAge) + effectiveLoanYears} ปี</strong> (เกณฑ์สูงสุด 70 ปี)
            </p>
          ) : (
            <p className="text-zinc-500">ระบุอายุผู้กู้เพื่อคำนวณระยะเวลากู้สูงสุด</p>
          )}
          <div className="text-zinc-500">
            ยอดเงินกู้ {formatTHB(mortgage.loanAmount)} บ. (ดาวน์ {formatTHB(mortgage.downPaymentAmount)} บ.)
            {mortgage.hasAfterYear3Phase && (
              <> · เหลือเงินต้นหลังปีที่ 3 ~{formatTHB(mortgage.remainingBalanceAfter3Years)} บ.</>
            )}
          </div>
          <div className="text-zinc-500">
            *หลังครบ 3 ปี สามารถขอลดดอกเบี้ย (Retention) หรือรีไฟแนนซ์กับธนาคารได้
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 flex items-center gap-2 bg-white/60">
        <button
          type="button"
          onClick={() => onFocusOnPlan(plot.id)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-800 bg-[#FAF5F1] hover:bg-[#F3E6DE] border border-[#EDE0D8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5" />
          ซูมไปที่แปลงนี้
        </button>
        <button
          type="button"
          onClick={() => onToggleBookmark(plot.id)}
          disabled={!isBookmarked && !canBookmarkMore}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isBookmarked
              ? 'bg-[#7A224F] text-white hover:bg-[#5E183C]'
              : 'border border-[#E5D5CC] text-zinc-800 hover:bg-[#FAF5F1]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          {isBookmarked ? 'อยู่ในรายการเปรียบเทียบ' : 'เปรียบเทียบหลังนี้'}
        </button>
      </div>
    </aside>
  );
}
