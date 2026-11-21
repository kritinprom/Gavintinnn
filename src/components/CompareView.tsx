import { MapPin, Trash2 } from 'lucide-react';
import { HOUSE_MODELS } from '../data/houseModels';
import { PlotUnit } from '../types/project';
import {
  calculateTwoPhaseMortgage,
  formatMillion,
  formatPricePerWah,
  formatTHB,
  STATUS_LABELS,
  STATUS_STYLES,
} from '../utils/formatters';
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
  if (bookmarkedPlots.length === 0) {
    return (
      <div className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-[0_4px_20px_rgba(122,34,79,0.03)] flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF3EB] border border-[#EBDCD2] flex items-center justify-center mb-4">
          <MiniCatFace className="w-11 h-11" />
        </div>
        <h2 className="text-lg font-bold text-[#2B1822] font-display">
          ยังไม่มีแปลงบ้านในรายการเปรียบเทียบ
        </h2>
        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
          เลือกแปลงบ้านที่สนใจจากหน้าผังโครงการหรือตารางรายการ แล้วกดปุ่ม "เปรียบเทียบหลังนี้" เพื่อเทียบขนาดที่ดิน บ้านเลขที่ ทิศ และราคาสูงสุด 4 หลังพร้อมกัน
        </p>
        <button
          type="button"
          onClick={onGoToPlan}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-[#7A224F] hover:bg-[#5E183C] rounded-xl transition-colors cursor-pointer"
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#2B1822] font-display">
            เปรียบเทียบแปลงที่สนใจ ({bookmarkedPlots.length}/4)
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            เทียบสเปคบ้าน ขนาดที่ดิน บ้านเลขที่ และประมาณการค่างวด (3 ปีแรก 1.59% / หลังปีที่ 3 ลอยตัว ~5.25%, 30 ปี)
          </p>
        </div>
        <button
          type="button"
          onClick={onClearBookmarks}
          className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-[#E5D5CC] bg-white hover:bg-[#FAF5F1] rounded-xl cursor-pointer"
        >
          ล้างรายการเปรียบเทียบ
        </button>
      </div>

      <div className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl overflow-x-auto shadow-[0_4px_20px_rgba(122,34,79,0.03)]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#EFE3DC] bg-[#FAF5F1]">
              <th className="py-4 px-5 w-44 text-xs font-semibold text-zinc-500 align-top">
                หัวข้อเปรียบเทียบ
              </th>
              {bookmarkedPlots.map((plot) => (
                <th key={plot.id} className="py-4 px-5 min-w-[200px] align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-zinc-900 font-mono-tabular">
                        แปลง {plot.id}
                      </div>
                      <div className="text-xs font-medium text-zinc-500 font-mono-tabular">
                        บ้านเลขที่ {plot.houseNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(plot.id)}
                      title="ลบออก"
                      aria-label={`ลบแปลง ${plot.id} ออกจากรายการเปรียบเทียบ`}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
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
                  <div className="font-bold text-[#6B1D45]">{formatTHB(plot.price)} บ.</div>
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
              <td className="py-3 px-5 text-xs text-zinc-500">ค่างวด 3 ปีแรก (1.59%)</td>
              {bookmarkedPlots.map((plot) => {
                const calc = calculateTwoPhaseMortgage(plot.price, 0, 1.59, 5.25, 30);
                return (
                  <td key={plot.id} className="py-3 px-5 font-mono-tabular font-semibold text-[#7A224F]">
                    ~{formatTHB(calc.first3YearsMonthly)} บ./ด.
                  </td>
                );
              })}
            </tr>
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
                    onClick={() => onLocatePlot(plot.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B1D45] bg-[#6B1D45]/10 hover:bg-[#6B1D45] hover:text-white rounded-md transition-colors cursor-pointer"
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
