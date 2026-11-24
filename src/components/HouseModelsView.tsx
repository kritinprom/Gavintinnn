import { ArrowRight } from 'lucide-react';
import { HOUSE_MODELS, HOUSE_MODEL_ORDER } from '../data/houseModels';
import { HouseModelId, PlotUnit } from '../types/project';
import { calculateRequiredSalary, formatMillion, formatTHB } from '../utils/formatters';

interface HouseModelsViewProps {
  plots: PlotUnit[];
  onSelectModelOnPlan: (model: HouseModelId) => void;
}

export function HouseModelsView({
  plots,
  onSelectModelOnPlan,
}: HouseModelsViewProps) {
  return (
    <div className="space-y-6">
      {/* Luxury Architectural Showcase Header */}
      <section className="relative overflow-hidden rounded-3xl text-white border bg-[#14191F] border-[#2B333D] shadow-[0_12px_36px_rgba(20,25,31,0.16)] grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-stretch">
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="text-xs font-medium text-[#E5C57B]">
            แบบบ้านทั้ง 7 สไตล์ · CENTRO พระราม 2 - พุทธบูชา 2
          </div>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold font-display text-white text-balance">
            สถาปัตยกรรมบ้านเดี่ยวพร้อมพื้นที่ใช้สอย 173 – 289 ตร.ม.
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-xl leading-relaxed">
            เปรียบเทียบฟังก์ชันห้องนอน ห้องน้ำ ที่จอดรถ ขนาดที่ดิน และจำนวนหลังที่ยังว่างในแต่ละแบบบ้าน เพื่อเลือกหลังที่ตรงใจที่สุด
          </p>
        </div>

        <div className="relative min-h-[200px] lg:min-h-[240px] bg-[#101419]">
          <img
            src="/assets/aistudio/image_fb8b8a7e.png"
            alt="แบบบ้านเดี่ยว CENTRO พระราม 2 - พุทธบูชา 2"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14191F] via-[#14191F]/35 to-transparent lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14191F]/70 via-transparent to-transparent lg:hidden" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {HOUSE_MODEL_ORDER.map((modelId) => {
          const spec = HOUSE_MODELS[modelId];
          const modelPlots = plots.filter((p) => p.model === modelId);
          const availableCount = modelPlots.filter((p) => p.status === 'available').length;
          const showhouseCount = modelPlots.filter((p) => p.status === 'showhouse').length;
          const notOpenCount = modelPlots.filter((p) => p.status === 'not_open').length;
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
          const minSalary = calculateRequiredSalary(minPrice, 0, 5.25, 30, 0);
          const maxSalary = calculateRequiredSalary(maxPrice, 0, 5.25, 30, 0);

          return (
            <div
              key={modelId}
              className="bg-[#FFFEFC] border border-[#E2DDD0] rounded-3xl overflow-hidden shadow-[0_8px_28px_rgba(15,61,44,0.05)] hover:border-[#A8C9B8] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="h-1.5 w-full" style={{ backgroundColor: spec.colorHex }} />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-black/15 shrink-0"
                          style={{ backgroundColor: spec.colorHex }}
                        />
                        <h3 className="text-lg font-bold text-[#12261D] font-display">
                          {spec.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{spec.thaiTagline}</p>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <div className="text-sm font-bold text-[#0F3D2C] font-mono-tabular">
                        {spec.usableAreaSqM} ตร.ม.
                      </div>
                      <div className="text-[11px] text-zinc-500">พื้นที่ใช้สอย</div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                    {spec.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[#ECE7DC] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">ฟังก์ชัน</span>
                      <span className="font-medium text-[#12261D] tabular-nums">
                        {spec.bedrooms} นอน · {spec.bathrooms} น้ำ · {spec.parking} จอด
                        {spec.maidRoom ? ' · 1 แม่บ้าน' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">ขนาดที่ดินในผัง</span>
                      <span className="font-mono-tabular text-[#12261D]">
                        {minWah.toFixed(1)} – {maxWah.toFixed(1)} ตร.วา
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">ช่วงราคา</span>
                      <span className="font-mono-tabular font-bold text-[#0F3D2C]">
                        {formatMillion(minPrice)} – {formatMillion(maxPrice)} ลบ.
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">เงินเดือนที่ควรกู้ได้ (DSR 40–80%)</span>
                      <span className="font-mono-tabular font-semibold text-[#162742]">
                        {`~${formatTHB(minSalary.maxSalary80)} – ${formatTHB(maxSalary.comfortableSalary40)} บ./ด.`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">จำนวนแปลง</span>
                      <span className="tabular-nums text-[#12261D]">
                        {modelPlots.length} หลัง ·{' '}
                        <strong className="text-emerald-700">ว่าง {availableCount}</strong>
                        {showhouseCount > 0 && (
                          <>
                            {' '}· <strong className="text-blue-700">ตัวอย่าง {showhouseCount}</strong>
                          </>
                        )}
                        {notOpenCount > 0 && (
                          <>
                            {' '}· <strong className="text-stone-600">ยังไม่เปิด {notOpenCount}</strong>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => onSelectModelOnPlan(modelId)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0F3D2C] bg-[#EAF4EE] hover:bg-[#0F3D2C] hover:text-white active:scale-[0.99] border border-[#CBE0D4] rounded-xl transition-colors cursor-pointer"
                >
                  ดูแปลงแบบ {spec.name} บนผังโครงการ
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
