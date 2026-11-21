import { ArrowRight } from 'lucide-react';
import { HOUSE_MODELS, HOUSE_MODEL_ORDER } from '../data/houseModels';
import { HouseModelId, PlotUnit } from '../types/project';
import { formatMillion } from '../utils/formatters';

interface HouseModelsViewProps {
  plots: PlotUnit[];
  onSelectModelOnPlan: (model: HouseModelId) => void;
}

export function HouseModelsView({ plots, onSelectModelOnPlan }: HouseModelsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 font-display">
          แบบบ้านทั้งหมด 7 สไตล์ในโครงการ
        </h2>
        <p className="mt-1 text-sm text-zinc-600 max-w-2xl">
          ข้อมูลพื้นที่ใช้สอย ฟังก์ชันห้องนอน-ห้องน้ำ ที่จอดรถ และช่วงราคาของแบบบ้านแต่ละรุ่นตามผังโครงการ CENTRO พระราม 2 - พุทธบูชา 2
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {HOUSE_MODEL_ORDER.map((modelId) => {
          const spec = HOUSE_MODELS[modelId];
          const modelPlots = plots.filter((p) => p.model === modelId);
          const availableCount = modelPlots.filter((p) => p.status === 'available').length;
          const showhouseCount = modelPlots.filter((p) => p.status === 'showhouse').length;
          const minPrice = modelPlots.length
            ? Math.min(...modelPlots.map((p) => p.price))
            : spec.basePriceTHB;
          const maxPrice = modelPlots.length
            ? Math.max(...modelPlots.map((p) => p.price))
            : spec.basePriceTHB;
          const minWah = modelPlots.length
            ? Math.min(...modelPlots.map((p) => p.landSqWah))
            : spec.baseLandSqWah;
          const maxWah = modelPlots.length
            ? Math.max(...modelPlots.map((p) => p.landSqWah))
            : spec.baseLandSqWah;

          return (
            <div
              key={modelId}
              className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-5 shadow-[0_4px_20px_rgba(122,34,79,0.03)] hover:border-[#D8B8C8] transition-colors flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-md border border-black/15 shrink-0"
                        style={{ backgroundColor: spec.colorHex }}
                      />
                      <h3 className="text-lg font-bold text-[#2B1822] font-display">
                        {spec.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{spec.thaiTagline}</p>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="text-sm font-bold text-zinc-900 font-mono-tabular">
                      {spec.usableAreaSqM} ตร.ม.
                    </div>
                    <div className="text-[11px] text-zinc-500">พื้นที่ใช้สอย</div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                  {spec.description}
                </p>

                <div className="mt-4 pt-4 border-t border-[#EFE3DC] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ฟังก์ชัน</span>
                    <span className="font-medium text-zinc-900 tabular-nums">
                      {spec.bedrooms} ห้องนอน · {spec.bathrooms} ห้องน้ำ · {spec.parking} ที่จอดรถ
                      {spec.maidRoom ? ' · 1 ห้องแม่บ้าน' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ขนาดที่ดินในผัง</span>
                    <span className="font-mono-tabular text-zinc-900">
                      {minWah.toFixed(1)} – {maxWah.toFixed(1)} ตร.วา
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ช่วงราคา</span>
                    <span className="font-mono-tabular font-semibold text-[#7A224F]">
                      {formatMillion(minPrice)} – {formatMillion(maxPrice)} ล้านบาท
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">จำนวนแปลง</span>
                    <span className="tabular-nums text-zinc-900">
                      ทั้งหมด {modelPlots.length} หลัง ·{' '}
                      <strong className="text-emerald-700">ว่าง {availableCount}</strong>
                      {showhouseCount > 0 && (
                        <>
                          {' '}· <strong className="text-blue-700">ตัวอย่าง {showhouseCount}</strong>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectModelOnPlan(modelId)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-800 bg-[#FAF5F1] hover:bg-[#7A224F] hover:text-white border border-[#EDE0D8] rounded-xl transition-colors cursor-pointer"
              >
                ดูแปลงแบบ {spec.name} บนผังโครงการ
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
