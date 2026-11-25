import React, { useEffect, useId, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Lock,
  Pencil,
  X,
} from 'lucide-react';
import { HOUSE_MODELS } from '../data/houseModels';
import { PlotStatus, PlotUnit } from '../types/project';
import {
  calculateCommonFee,
  calculateRequiredSalary,
  calculateTwoPhaseMortgage,
  formatMillion,
  formatPricePerWah,
  formatTHB,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../utils/formatters';
import {
  playCancelSound,
  playEditOpenSound,
  playLockedSound,
  playToggleSound,
  playZoomInSound,
} from '../utils/soundEffects';
import { MiniCatFace } from './CuteWalkingCats';

interface UnitInspectorProps {
  plot: PlotUnit | null;
  soldUnlocked: boolean;
  onRequestUnlock: () => void;
  onUpdatePlot: (id: string, patch: Partial<PlotUnit>) => void;
  onFocusOnPlan: (id: string) => void;
  onNavigatePlot: (direction: 'prev' | 'next') => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  canBookmarkMore: boolean;
  showSellingPrices?: boolean;
}

const STORAGE_KEY_MORTGAGE = 'centro_rama2_mortgage_prefs_v1';

function loadMortgagePrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MORTGAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        borrowerAgeInput: string;
        downPercent: number;
        promoRate3Years: number;
        floatingRateAfterYear3: number;
        loanYears: number;
        otherMonthlyDebt: number;
        dsrPercent: number;
      }>;
      return {
        borrowerAgeInput: typeof parsed.borrowerAgeInput === 'string' ? parsed.borrowerAgeInput : '30',
        downPercent: typeof parsed.downPercent === 'number' ? parsed.downPercent : 0,
        promoRate3Years: typeof parsed.promoRate3Years === 'number' ? parsed.promoRate3Years : 1.59,
        floatingRateAfterYear3: typeof parsed.floatingRateAfterYear3 === 'number' ? parsed.floatingRateAfterYear3 : 5.25,
        loanYears: typeof parsed.loanYears === 'number' ? parsed.loanYears : 30,
        otherMonthlyDebt: typeof parsed.otherMonthlyDebt === 'number' ? parsed.otherMonthlyDebt : 0,
        dsrPercent:
          typeof parsed.dsrPercent === 'number' && parsed.dsrPercent >= 40 && parsed.dsrPercent <= 80
            ? parsed.dsrPercent
            : 60,
      };
    }
  } catch {
    // ignore
  }
  return {
    borrowerAgeInput: '30',
    downPercent: 0,
    promoRate3Years: 1.59,
    floatingRateAfterYear3: 5.25,
    loanYears: 30,
    otherMonthlyDebt: 0,
    dsrPercent: 60,
  };
}

export function UnitInspector({
  plot,
  soldUnlocked,
  onRequestUnlock,
  onUpdatePlot,
  onFocusOnPlan,
  onNavigatePlot,
  isBookmarked,
  onToggleBookmark,
  canBookmarkMore,
  showSellingPrices = false,
}: UnitInspectorProps) {
  const uid = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [draftHouseNumber, setDraftHouseNumber] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftStatus, setDraftStatus] = useState<PlotStatus>('available');
  const [draftNote, setDraftNote] = useState('');

  // Mortgage Estimator state (auto-saved immediately on change)
  const [initialMortgage] = useState(loadMortgagePrefs);
  const [borrowerAgeInput, setBorrowerAgeInput] = useState<string>(initialMortgage.borrowerAgeInput);
  const [downPercent, setDownPercent] = useState<number>(initialMortgage.downPercent);
  const [promoRate3Years, setPromoRate3Years] = useState<number>(initialMortgage.promoRate3Years);
  const [floatingRateAfterYear3, setFloatingRateAfterYear3] = useState<number>(initialMortgage.floatingRateAfterYear3);
  const [loanYears, setLoanYears] = useState<number>(initialMortgage.loanYears);
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState<number>(initialMortgage.otherMonthlyDebt);
  const [dsrPercent, setDsrPercent] = useState<number>(initialMortgage.dsrPercent);
  const [showAfterYear3, setShowAfterYear3] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_MORTGAGE,
        JSON.stringify({
          borrowerAgeInput,
          downPercent,
          promoRate3Years,
          floatingRateAfterYear3,
          loanYears,
          otherMonthlyDebt,
          dsrPercent,
        })
      );
    } catch {
      // ignore
    }
  }, [borrowerAgeInput, downPercent, promoRate3Years, floatingRateAfterYear3, loanYears, otherMonthlyDebt, dsrPercent]);

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
      <aside className="bg-[#FFFEFC] border border-[#E5DEC9] rounded-3xl p-8 flex flex-col justify-center items-center text-center min-h-[380px] shadow-[0_8px_30px_rgba(20,25,31,0.06)]">
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 bg-[#F5F2EB] border-[#E5DEC9]">
          <MiniCatFace className="w-11 h-11" />
        </div>
        <p className="text-base font-bold text-[#14191F] font-display">เลือกแปลงบ้านบนผังโครงการ</p>
        <p className="mt-1.5 text-xs text-zinc-500 max-w-xs leading-relaxed">
          {showSellingPrices
            ? 'แตะที่รหัสแปลง (เช่น A01, I05, N10) เพื่อดูบ้านเลขที่ ราคา ค่าส่วนกลาง และค่างวดผ่อนชำระเบื้องต้น'
            : 'แตะที่รหัสแปลง (เช่น A01, I05, N10) เพื่อดูบ้านเลขที่ แบบบ้าน ขนาดที่ดิน และสถานะแปลง'}
        </p>
      </aside>
    );
  }

  const isSold = plot.status === 'sold';
  const isLockedSold = isSold && !soldUnlocked;
  const modelSpec = HOUSE_MODELS[plot.model];
  const statusStyle = STATUS_STYLES[plot.status];
  const commonFee = calculateCommonFee(plot.landSqWah);
  const mortgage = calculateTwoPhaseMortgage(
    plot.price,
    downPercent,
    promoRate3Years,
    floatingRateAfterYear3,
    effectiveLoanYears
  );
  const salaryEstimate = calculateRequiredSalary(
    plot.price,
    downPercent,
    floatingRateAfterYear3,
    effectiveLoanYears,
    otherMonthlyDebt,
    dsrPercent
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedSold) {
      playLockedSound();
      setIsEditing(false);
      onRequestUnlock();
      return;
    }
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
    <aside className="bg-[#FFFEFC] border border-[#E2DDD0] rounded-3xl overflow-hidden flex flex-col shadow-[0_10px_34px_rgba(15,61,44,0.08)]">
      {/* Luxury Obsidian Header with Price & Quick Navigation */}
      <div className="px-5 pt-5 pb-5 text-white bg-gradient-to-br from-[#14191F] via-[#1C232B] to-[#101419]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
              <span>โซน {plot.zone}</span>
              <span aria-hidden="true">·</span>
              <span>ทิศ{plot.facing}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#E5C57B]">{STATUS_LABELS[plot.status]}</span>
            </div>

            <h2 className="mt-1.5 text-2xl font-bold font-display tracking-tight text-white flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono-tabular">แปลง {plot.id}</span>
              <span className="text-sm font-normal text-zinc-300 font-sans">
                บ้านเลขที่ <strong className="text-white font-mono-tabular">{plot.houseNumber}</strong>
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-sound="custom"
              onClick={() => onNavigatePlot('prev')}
              title="แปลงก่อนหน้า"
              aria-label="แปลงก่อนหน้า"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-[0.96] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              data-sound="custom"
              onClick={() => onNavigatePlot('next')}
              title="แปลงถัดไป"
              aria-label="แปลงถัดไป"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-[0.96] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlighted Readout (House Model or Price) */}
        {(!isEditing || isLockedSold) && (
          <div className="mt-4 pt-4 border-t border-white/15 flex items-end justify-between gap-3">
            {showSellingPrices ? (
              <div>
                <div className="text-[11px] text-emerald-100/75">
                  {hasOfficialBreakdown ? 'ราคารวม (MIN LC + TOTAL PRO)' : 'ราคาบ้านและที่ดิน (ประมาณการ)'}
                </div>
                <div className="mt-0.5 text-2xl sm:text-[26px] font-bold text-[#F5D06B] font-mono-tabular leading-tight">
                  {formatTHB(plot.price)} <span className="text-sm font-medium text-white/85">บาท</span>
                </div>
                <div className="mt-1 text-xs text-emerald-100/80 tabular-nums">
                  {formatMillion(plot.price)} ล้านบาท · {formatPricePerWah(plot.price, plot.landSqWah)} บ./ตร.วา
                </div>
                {hasOfficialBreakdown && plot.minLc !== undefined && plot.totalPro !== undefined && (
                  <div className="mt-1 text-[11px] text-emerald-100/65 font-mono-tabular">
                    MIN LC {formatTHB(plot.minLc)} + TOTAL PRO {formatTHB(plot.totalPro)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-[11px] text-[#E5C57B]/85">แบบบ้านและเลขบ้าน</div>
                <div className="mt-0.5 text-xl sm:text-2xl font-bold text-[#F5D06B] font-display leading-tight">
                  แบบบ้าน {modelSpec.name}
                </div>
                <div className="mt-1 text-xs text-zinc-300 tabular-nums">
                  บ้านเลขที่ {plot.houseNumber} · พื้นที่ใช้สอย {modelSpec.usableAreaSqM} ตร.ม.
                </div>
              </div>
            )}

            {isLockedSold ? (
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playLockedSound();
                  onRequestUnlock();
                }}
                title="แปลงนี้ขายแล้ว คลิกใส่รหัสผ่านเพื่อปลดล็อกแก้ไข"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl whitespace-nowrap shrink-0 cursor-pointer transition-colors shadow-xs bg-[#B91C3C] hover:bg-[#9B1531]"
              >
                <Lock className="w-3.5 h-3.5" />
                ปลดล็อก
              </button>
            ) : (
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playEditOpenSound();
                  setIsEditing(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-white/14 hover:bg-white/24 border border-white/20 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                แก้ไข
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Form OR Quick Status Switcher */}
      <div className="p-5 border-b border-[#EAE4D7]">
        {!isEditing || isLockedSold ? (
          <div>
            <div className="text-xs font-medium text-zinc-500 mb-2">ปรับสถานะแปลงด่วน</div>
            <div className="grid grid-cols-2 gap-2">
              {(['available', 'showhouse', 'reserved', 'not_open', 'sold'] as PlotStatus[]).map((st) => {
                const active = plot.status === st;
                const stStyle = STATUS_STYLES[st];
                return (
                  <button
                    key={st}
                    type="button"
                    data-sound="custom"
                    disabled={isLockedSold}
                    onClick={() => onUpdatePlot(plot.id, { status: st })}
                    className={`min-h-[44px] py-2 px-3 text-xs font-medium rounded-xl border transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] ${
                      st === 'sold' ? 'col-span-2' : ''
                    } ${
                      isLockedSold
                        ? active
                          ? `${stStyle.bg} ${stStyle.text} ${stStyle.border} font-semibold cursor-not-allowed`
                          : 'bg-zinc-50 border-stone-200 text-zinc-400 opacity-60 cursor-not-allowed'
                        : active
                        ? `${stStyle.bg} ${stStyle.text} ${stStyle.border} font-semibold cursor-pointer shadow-2xs`
                        : 'bg-[#FAF8F4] border-[#E5DEC9] text-zinc-700 hover:bg-[#F1ECE1] cursor-pointer'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stStyle.dotBg}`} />
                    {STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>

            {isLockedSold && (
              <div className="mt-3 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-medium text-[#9F1239]">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  แปลงนี้ขายแล้ว · ถูกล็อกอยู่
                </span>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playLockedSound();
                    onRequestUnlock();
                  }}
                  className="underline font-semibold hover:text-rose-950 cursor-pointer whitespace-nowrap"
                >
                  ใส่รหัสปลดล็อก
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#12261D]">
                แก้ไขข้อมูลแปลง {plot.id}
              </span>
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playCancelSound();
                  setIsEditing(false);
                }}
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 cursor-pointer"
                aria-label="ยกเลิกการแก้ไข"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`grid ${showSellingPrices ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
              <div>
                <label className="block text-xs text-zinc-600 mb-1">บ้านเลขที่</label>
                <input
                  type="text"
                  value={draftHouseNumber}
                  onChange={(e) => setDraftHouseNumber(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-mono-tabular border border-[#DCD4C3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]"
                />
              </div>
              {showSellingPrices && (
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    step="any"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm font-mono-tabular border border-[#DCD4C3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-600 mb-1">สถานะ</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as PlotStatus)}
                className="w-full min-h-[44px] px-3 py-2 text-sm border border-[#DCD4C3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]"
              >
                <option value="available">ว่าง / พร้อมขาย</option>
                <option value="showhouse">บ้านตัวอย่าง</option>
                <option value="reserved">จองแล้ว</option>
                <option value="not_open">ยังไม่เปิดขาย</option>
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
                className="w-full min-h-[44px] px-3 py-2 text-sm border border-[#DCD4C3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playCancelSound();
                  setIsEditing(false);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                data-sound="custom"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F3D2C] hover:bg-[#0A2B1F] rounded-xl cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                บันทึก
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Architectural Specs List (Clean hairline rows, single surface) */}
      <div className="px-5 py-4 border-b border-[#EAE4D7] space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">แบบบ้าน</span>
          <span className="flex items-center gap-2 font-semibold text-[#12261D]">
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
          <span className="font-mono-tabular font-semibold text-[#12261D]">
            {plot.landSqWah.toFixed(1)} ตร.วา
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">พื้นที่ใช้สอย</span>
          <span className="font-mono-tabular font-medium text-[#12261D]">
            {modelSpec.usableAreaSqM} ตร.ม.
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ฟังก์ชันบ้าน</span>
          <span className="text-[#12261D] tabular-nums text-right">
            {modelSpec.bedrooms} นอน · {modelSpec.bathrooms} น้ำ · {modelSpec.parking} จอดรถ
            {modelSpec.maidRoom ? ' · 1 แม่บ้าน' : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ทิศหน้าบ้าน</span>
          <span className="text-[#12261D] font-medium">ทิศ{plot.facing}</span>
        </div>
        {plot.note && (
          <div className="flex items-start justify-between gap-4 pt-2 border-t border-[#F0ECE2]">
            <span className="text-zinc-500 shrink-0">จุดเด่น</span>
            <span className="text-zinc-800 text-right text-xs leading-relaxed">{plot.note}</span>
          </div>
        )}
      </div>

      {/* Common Area Fee Section (30 THB / sq.wah / month) */}
      <div className="px-5 py-4 border-b border-[#EAE4D7] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#12261D]">
            ค่าส่วนกลาง ({commonFee.ratePerWah} บาท/ตร.วา/เดือน)
          </span>
          <span className="text-[11px] font-mono-tabular text-zinc-500">
            ที่ดิน {plot.landSqWah.toFixed(1)} ตร.วา
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="text-[11px] text-zinc-500">รายเดือน</div>
            <div className="mt-0.5 text-lg font-bold text-[#0F3D2C] font-mono-tabular">
              {formatTHB(commonFee.monthly)}
              <span className="text-xs font-normal text-zinc-500 ml-1">บ./ด.</span>
            </div>
          </div>

          <div className="pl-4 border-l border-[#EAE4D7]">
            <div className="text-[11px] text-zinc-500">รายปี (12 เดือน)</div>
            <div className="mt-0.5 text-lg font-bold text-[#12261D] font-mono-tabular">
              {formatTHB(commonFee.yearly)}
              <span className="text-xs font-normal text-zinc-500 ml-1">บ./ปี</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mortgage Quick Estimator (Only when prices enabled) */}
      {showSellingPrices && (
      <div className="px-5 py-4 border-b border-[#EAE4D7] bg-[#F8F6F0] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#12261D]">คำนวณค่างวดผ่อนชำระเบื้องต้น</span>
          {effectiveLoanYears <= 0 && (
            <span className="text-xs font-medium text-[#B91C3C]">
              {isUnderMinAge ? 'อายุไม่ถึงเกณฑ์ 20 ปี' : 'เกินเกณฑ์อายุ 70 ปี'}
            </span>
          )}
        </div>

        {effectiveLoanYears > 0 && (
          <div className="space-y-2.5">
            <div className="bg-white border border-[#E2DDD0] rounded-2xl p-3.5">
              <div className="text-[11px] text-zinc-500">
                ค่างวด 3 ปีแรก (ดอกเบี้ย {promoRate3Years.toFixed(2)}%/ปี)
              </div>
              <div className="mt-0.5 text-2xl font-bold text-[#0F3D2C] font-mono-tabular">
                ~{formatTHB(mortgage.first3YearsMonthly)}
                <span className="text-xs font-normal text-zinc-500 ml-1.5">บาท/เดือน</span>
              </div>
            </div>

            {/* Required Salary Readout Card (DSR 40–80%) */}
            <div className="border rounded-2xl p-3.5 bg-[#FBF7EE] border-[#DFC996]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#14191F]">
                  เงินเดือนที่ควรกู้ได้ (DSR 40–80%)
                </span>
                <span className="text-[10px] font-semibold text-[#8A6820] font-mono-tabular">
                  เลือกเกณฑ์ {salaryEstimate.selectedDsrPercent}% DSR
                </span>
              </div>
              <div className="mt-0.5 text-xl font-bold font-mono-tabular text-[#14191F]">
                ~{formatTHB(salaryEstimate.selectedSalary)}
                <span className="text-xs font-normal text-zinc-600 ml-1.5">บาท/เดือน ขึ้นไป</span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-black/10 grid grid-cols-5 gap-1 text-[10px] tabular-nums text-center">
                {[
                  { pct: 40, val: salaryEstimate.comfortableSalary40 },
                  { pct: 50, val: salaryEstimate.standardSalary50 },
                  { pct: 60, val: salaryEstimate.maxStretchSalary60 },
                  { pct: 70, val: salaryEstimate.highSalary70 },
                  { pct: 80, val: salaryEstimate.maxSalary80 },
                ].map((tier) => {
                  const active = salaryEstimate.selectedDsrPercent === tier.pct;
                  return (
                    <button
                      key={tier.pct}
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playToggleSound();
                        setDsrPercent(tier.pct);
                      }}
                      className={`py-1.5 px-1 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#14191F] text-[#E5C57B] border-[#14191F] font-semibold'
                          : 'bg-white/75 text-zinc-700 border-[#E5DEC9] hover:bg-white'
                      }`}
                    >
                      <span className="block">{tier.pct}%</span>
                      <span className="block font-mono-tabular truncate">
                        {Math.round(tier.val / 1000)}k
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[10px] text-zinc-500 leading-relaxed">
                ช่วงรายได้ DSR 40–80%: ~{formatTHB(salaryEstimate.maxSalary80)} – {formatTHB(salaryEstimate.comfortableSalary40)} บ./ด. (ดอกเบี้ย {floatingRateAfterYear3.toFixed(2)}%/ปี
                {otherMonthlyDebt > 0 ? ` + หนี้อื่น ${formatTHB(otherMonthlyDebt)} บ./ด.` : ''})
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label htmlFor={`${uid}-age`} className="block text-zinc-600 mb-1">
              อายุผู้กู้ (20–69 ปี)
            </label>
            <div className="relative">
              <input
                id={`${uid}-age`}
                type="number"
                min={20}
                max={80}
                step={1}
                value={borrowerAgeInput}
                onChange={(e) => setBorrowerAgeInput(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 pr-8 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#0F3D2C]/25 focus:border-[#0F3D2C]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 pointer-events-none">
                ปี
              </span>
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-years`} className="block text-zinc-600 mb-1">
              ระยะกู้ (สูงสุด {maxAllowedYears > 0 ? `${maxAllowedYears} ปี` : '0 ปี'})
            </label>
            <select
              id={`${uid}-years`}
              value={effectiveLoanYears}
              disabled={loanYearOptions.length === 0}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-full min-h-[44px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label htmlFor={`${uid}-down`} className="block text-zinc-600 mb-1">
              เงินดาวน์ ({downPercent}%)
            </label>
            <select
              id={`${uid}-down`}
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="w-full min-h-[44px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[0, 5, 10, 15, 20, 30].map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${uid}-promo`} className="block text-zinc-600 mb-1">
              ดอกเบี้ย 3 ปีแรก
            </label>
            <select
              id={`${uid}-promo`}
              value={promoRate3Years}
              onChange={(e) => setPromoRate3Years(Number(e.target.value))}
              className="w-full min-h-[44px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[1.59, 1.69, 1.79, 1.89, 1.99].map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(2)}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${uid}-debt`} className="block text-zinc-600 mb-1">
              ภาระหนี้อื่น/เดือน
            </label>
            <select
              id={`${uid}-debt`}
              value={otherMonthlyDebt}
              onChange={(e) => setOtherMonthlyDebt(Number(e.target.value))}
              className="w-full min-h-[44px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[0, 5000, 10000, 15000, 20000, 30000, 40000, 50000].map((v) => (
                <option key={v} value={v}>
                  {v === 0 ? 'ไม่มี (0 บ./ด.)' : `${formatTHB(v)} บ./ด.`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${uid}-dsr`} className="block text-zinc-600 mb-1">
              สัดส่วนภาระหนี้ (DSR)
            </label>
            <select
              id={`${uid}-dsr`}
              value={dsrPercent}
              onChange={(e) => setDsrPercent(Number(e.target.value))}
              className="w-full min-h-[44px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
            >
              {[40, 45, 50, 55, 60, 65, 70, 75, 80].map((v) => (
                <option key={v} value={v}>
                  {v}% DSR
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1 text-[11px] tabular-nums leading-relaxed">
          {isOverAgeLimit ? (
            <p className="text-[#B91C3C] font-medium">
              อายุผู้กู้ต้องน้อยกว่า 70 ปี (กู้รวมอายุผู้กู้ได้สูงสุดไม่เกิน 70 ปี)
            </p>
          ) : isUnderMinAge ? (
            <p className="text-amber-700 font-medium">
              กรุณาระบุอายุผู้กู้ตั้งแต่ 20 ปีขึ้นไป
            </p>
          ) : hasValidAge ? (
            <p className="text-zinc-600">
              กู้ได้สูงสุด <strong className="text-[#12261D]">{maxAllowedYears} ปี</strong> · อายุเมื่อผ่อนครบ{' '}
              <strong className="text-[#0F3D2C]">{Math.floor(parsedAge) + effectiveLoanYears} ปี</strong> (เกณฑ์สูงสุด 70 ปี)
            </p>
          ) : (
            <p className="text-zinc-500">ระบุอายุผู้กู้เพื่อคำนวณระยะเวลากู้สูงสุด</p>
          )}
          <div className="text-zinc-500">
            ยอดเงินกู้ {formatTHB(mortgage.loanAmount)} บ. (ดาวน์ {formatTHB(mortgage.downPaymentAmount)} บ.)
          </div>
        </div>

        {/* Toggleable Post-Year-3 Installment Section (Hidden by Default) */}
        <div className="pt-1 space-y-2.5">
          <button
            type="button"
            data-sound="custom"
            aria-expanded={showAfterYear3}
            onClick={() => {
              playToggleSound();
              setShowAfterYear3((prev) => !prev);
            }}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD4C3] bg-white hover:bg-[#FAF6EE] text-xs font-medium text-zinc-700 flex items-center justify-between gap-2 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <span>{showAfterYear3 ? 'ซ่อนค่างวดหลังปีที่ 3' : 'ดูค่างวดหลังปีที่ 3'}</span>
            {showAfterYear3 ? (
              <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
          </button>

          {showAfterYear3 && (
            <div className="bg-white border border-[#E2DDD0] rounded-2xl p-3.5 space-y-3 text-xs">
              {effectiveLoanYears > 0 && (
                <div>
                  <div className="text-[11px] text-zinc-500">
                    ค่างวดหลังปีที่ 3 (ลอยตัว {floatingRateAfterYear3.toFixed(2)}%/ปี)
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-[#12261D] font-mono-tabular">
                    {mortgage.hasAfterYear3Phase ? (
                      <>
                        ~{formatTHB(mortgage.afterYear3Monthly)}
                        <span className="text-xs font-normal text-zinc-500 ml-1">บาท/เดือน</span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700">ผ่อนครบใน 3 ปี</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor={`${uid}-floating`} className="block text-zinc-600 mb-1">
                  ดอกเบี้ยลอยตัวหลังปีที่ 3 (ขึ้นอยู่กับแต่ละธนาคาร)
                </label>
                <select
                  id={`${uid}-floating`}
                  value={floatingRateAfterYear3}
                  onChange={(e) => setFloatingRateAfterYear3(Number(e.target.value))}
                  className="w-full min-h-[44px] px-2.5 py-2 bg-[#F8F6F0] border border-[#DCD4C3] rounded-xl text-zinc-800 tabular-nums cursor-pointer"
                >
                  {[4.5, 4.75, 5.0, 5.25, 5.5, 5.75, 6.0, 6.5].map((v) => (
                    <option key={v} value={v}>
                      {v.toFixed(2)}% ต่อปี (ประมาณการอัตราดอกเบี้ยลอยตัว MRR หลังหักส่วนลด)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-500 tabular-nums leading-relaxed">
                {mortgage.hasAfterYear3Phase && (
                  <div>
                    เหลือเงินต้นหลังปีที่ 3 ~{formatTHB(mortgage.remainingBalanceAfter3Years)} บ.
                  </div>
                )}
                <div>
                  *หลังครบ 3 ปี สามารถขอลดดอกเบี้ย (Retention) หรือรีไฟแนนซ์กับธนาคารได้
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Action Footer */}
      <div className="p-4 flex items-center gap-2.5 bg-white">
        <button
          type="button"
          data-sound="custom"
          onClick={() => {
            playZoomInSound();
            onFocusOnPlan(plot.id);
          }}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#12261D] bg-[#F5F2EB] hover:bg-[#EAE4D7] active:scale-[0.98] border border-[#E2DDD0] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
          ซูมไปที่แปลงนี้
        </button>
        <button
          type="button"
          data-sound="custom"
          onClick={() => onToggleBookmark(plot.id)}
          disabled={!isBookmarked && !canBookmarkMore}
          className={`flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isBookmarked
              ? 'bg-[#C59B48] text-[#14191F] hover:bg-[#B38938]'
              : 'border border-[#14191F] text-[#14191F] hover:bg-[#F5F2EB]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          {isBookmarked ? 'อยู่ในรายการเทียบ' : 'เปรียบเทียบหลังนี้'}
        </button>
      </div>
    </aside>
  );
}
