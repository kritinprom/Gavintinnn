import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Trash2 } from 'lucide-react';
import { HOUSE_MODELS } from '../data/houseModels';
import { PlotUnit } from '../types/project';
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
import { playToggleSound } from '../utils/soundEffects';
import { MiniCatFace } from './CuteWalkingCats';

interface CompareViewProps {
  bookmarkedPlots: PlotUnit[];
  onRemoveBookmark: (id: string) => void;
  onClearBookmarks: () => void;
  onLocatePlot: (id: string) => void;
  onGoToPlan: () => void;
}

export function CompareView({
  bookmarkedPlots,
  onRemoveBookmark,
  onClearBookmarks,
  onLocatePlot,
  onGoToPlan,
}: CompareViewProps) {
  const [showAfterYear3, setShowAfterYear3] = useState(false);
  if (bookmarkedPlots.length === 0) {
    return (
      <div className="bg-[#FFFEFC] border border-[#E5DEC9] rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-[0_4px_20px_rgba(20,25,31,0.04)] flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F2EB] border border-[#E5DEC9] flex items-center justify-center mb-4">
          <MiniCatFace className="w-11 h-11" />
        </div>
        <h2 className="text-lg font-bold text-[#1C2621] font-display">
          ยังไม่มีแปลงบ้านในรายการเปรียบเทียบ
        </h2>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          เลือกแปลงบ้านที่สนใจจากหน้าผังโครงการหรือตารางรายการ แล้วกดปุ่ม "เปรียบเทียบหลังนี้" เพื่อเทียบขนาดที่ดิน บ้านเลขที่ ทิศ และราคาสูงสุด 4 หลังพร้อมกัน
        </p>
        <button
          type="button"
          data-sound="custom"
          onClick={onGoToPlan}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-[#164A37] hover:bg-[#0F3527] rounded-xl transition-colors cursor-pointer"
        >
          ไปเลือกแปลงบนผังโครงการ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1C2621] font-display">
            เปรียบเทียบแปลงที่สนใจ ({bookmarkedPlots.length}/4)
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            เทียบสเปคบ้าน ขนาดที่ดิน บ้านเลขที่ ค่าส่วนกลาง และประมาณการค่างวด 3 ปีแรก (1.59%, 30 ปี)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-sound="custom"
            aria-expanded={showAfterYear3}
            onClick={() => {
              playToggleSound();
              setShowAfterYear3((prev) => !prev);
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 border border-[#DDD5C7] bg-white hover:bg-[#F3EFE8] rounded-xl cursor-pointer"
          >
            <span>{showAfterYear3 ? 'ซ่อนค่างวดหลังปีที่ 3' : 'ดูค่างวดหลังปีที่ 3'}</span>
            {showAfterYear3 ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>
          <button
            type="button"
            data-sound="custom"
            onClick={onClearBookmarks}
            className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-[#DDD5C7] bg-white hover:bg-[#F3EFE8] rounded-xl cursor-pointer"
          >
            ล้างรายการเปรียบเทียบ
          </button>
        </div>
      </div>

      <div className="bg-[#FFFEFC] border border-[#E2DDD0] rounded-3xl overflow-x-auto shadow-[0_10px_34px_rgba(15,61,44,0.06)]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#2B333D] bg-[#14191F] text-white">
              <th className="py-4 px-5 w-44 text-xs font-semibold text-[#E5C57B] align-top">
                หัวข้อเปรียบเทียบ
              </th>
              {bookmarkedPlots.map((plot) => (
                <th key={plot.id} className="py-4 px-5 min-w-[200px] align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-white font-mono-tabular">
                        แปลง {plot.id}
                      </div>
                      <div className="text-xs font-medium text-zinc-300 font-mono-tabular">
                        บ้านเลขที่ {plot.houseNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => onRemoveBookmark(plot.id)}
                      title="ลบออก"
                      aria-label={`ลบแปลง ${plot.id} ออกจากรายการเปรียบเทียบ`}
                      className="w-10 h-10 inline-flex items-center justify-center text-white/70 hover:text-white rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">แบบบ้าน</td>
              {bookmarkedPlots.map((plot) => {
                const m = HOUSE_MODELS[plot.model];
                return (
                  <td key={plot.id} className="py-3 px-5 font-semibold text-zinc-900">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: m.colorHex }}
                      />
                      {m.name}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ราคาบ้านและที่ดิน</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 font-mono-tabular">
                  <div className="font-bold text-[#164A37]">{formatTHB(plot.price)} บ.</div>
                  <div className="text-xs text-zinc-500">{formatMillion(plot.price)} ล้านบาท</div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ขนาดที่ดิน</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 font-mono-tabular font-medium text-zinc-900">
                  {plot.landSqWah.toFixed(1)} ตร.วา
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ราคาเฉลี่ยต่อ ตร.วา</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 font-mono-tabular text-zinc-700">
                  {formatPricePerWah(plot.price, plot.landSqWah)} บ./ตร.วา
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">พื้นที่ใช้สอย</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 font-mono-tabular text-zinc-900">
                  {HOUSE_MODELS[plot.model].usableAreaSqM} ตร.ม.
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ฟังก์ชันห้อง</td>
              {bookmarkedPlots.map((plot) => {
                const m = HOUSE_MODELS[plot.model];
                return (
                  <td key={plot.id} className="py-3 px-5 text-zinc-800 tabular-nums">
                    {m.bedrooms} นอน · {m.bathrooms} น้ำ · {m.parking} จอด
                    {m.maidRoom ? ' · แม่บ้าน' : ''}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ทิศหน้าบ้าน</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 text-zinc-900">
                  ทิศ{plot.facing}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ค่าส่วนกลาง (30 บ./ตร.วา)</td>
              {bookmarkedPlots.map((plot) => {
                const fee = calculateCommonFee(plot.landSqWah);
                return (
                  <td key={plot.id} className="py-3 px-5 font-mono-tabular">
                    <div className="font-semibold text-zinc-900">{formatTHB(fee.monthly)} บ./ด.</div>
                    <div className="text-xs text-zinc-500">{formatTHB(fee.yearly)} บ./ปี</div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ค่างวด 3 ปีแรก (1.59%)</td>
              {bookmarkedPlots.map((plot) => {
                const calc = calculateTwoPhaseMortgage(plot.price, 0, 1.59, 5.25, 30);
                return (
                  <td key={plot.id} className="py-3 px-5 font-mono-tabular font-semibold text-[#164A37]">
                    ~{formatTHB(calc.first3YearsMonthly)} บ./ด.
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">เงินเดือนที่ควรกู้ได้ (DSR 40–80%)</td>
              {bookmarkedPlots.map((plot) => {
                const salary = calculateRequiredSalary(plot.price, 0, 5.25, 30, 0, 60);
                return (
                  <td key={plot.id} className="py-3 px-5 font-mono-tabular">
                    <div className="font-semibold text-[#162742]">
                      ~{formatTHB(salary.maxSalary80)} – {formatTHB(salary.comfortableSalary40)} บ./ด.
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      80% ~{formatTHB(salary.maxSalary80)} · 60% ~{formatTHB(salary.maxStretchSalary60)} · 40% ~{formatTHB(salary.comfortableSalary40)}
                    </div>
                  </td>
                );
              })}
            </tr>
            {showAfterYear3 && (
              <tr>
                <td className="py-3 px-5 text-xs text-zinc-500">หลังปีที่ 3 (ลอยตัว ~5.25%)</td>
                {bookmarkedPlots.map((plot) => {
                  const calc = calculateTwoPhaseMortgage(plot.price, 0, 1.59, 5.25, 30);
                  return (
                    <td key={plot.id} className="py-3 px-5 font-mono-tabular text-zinc-700">
                      ~{formatTHB(calc.afterYear3Monthly)} บ./ด.
                    </td>
                  );
                })}
              </tr>
            )}
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">สถานะ</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className={`py-3 px-5 text-xs font-medium ${STATUS_STYLES[plot.status].text}`}>
                  {STATUS_LABELS[plot.status]}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">หมายเหตุ</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5 text-xs text-zinc-600">
                  {plot.note || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-5 text-xs text-zinc-500">ตำแหน่งบนผัง</td>
              {bookmarkedPlots.map((plot) => (
                <td key={plot.id} className="py-3 px-5">
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => onLocatePlot(plot.id)}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#164A37] bg-[#EDF4F0] hover:bg-[#164A37] hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    ดูตำแหน่งแปลง {plot.id}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
