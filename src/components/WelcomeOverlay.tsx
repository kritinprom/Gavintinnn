import React, { useEffect, useState } from 'react';
import { ArrowRight, Compass, Table2, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActiveTab } from '../types/project';
import { formatMillion } from '../utils/formatters';
import { CuteWalkingCats } from './CuteWalkingCats';

interface WelcomeOverlayProps {
  isOpen: boolean;
  visitorName: string;
  onVisitorNameChange: (name: string) => void;
  summary: {
    total: number;
    available: number;
    showhouse: number;
    minPrice: number;
    maxPrice: number;
  };
  onEnter: (tab: ActiveTab) => void;
}

export function WelcomeOverlay({
  isOpen,
  visitorName,
  onVisitorNameChange,
  summary,
  onEnter,
}: WelcomeOverlayProps) {
  const [draftName, setDraftName] = useState(visitorName);

  useEffect(() => {
    if (isOpen) {
      setDraftName(visitorName);
    }
  }, [isOpen, visitorName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onVisitorNameChange(draftName.trim());
        onEnter('plan');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, draftName, onVisitorNameChange, onEnter]);

  const handleEnterWithName = (tab: ActiveTab) => {
    onVisitorNameChange(draftName.trim());
    onEnter(tab);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleEnterWithName('plan');
  };

  const cleanDraft = draftName.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 overflow-y-auto bg-[#F7EFEA] flex items-center justify-center p-4 sm:p-6 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-gavintin-title"
        >
          {/* Warm pastel master plan backdrop */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <img
              src="/assets/aistudio/_______60c0cee6.jpg"
              alt=""
              className="w-full h-full object-cover opacity-[0.12] scale-105 blur-[2px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(253, 226, 236, 0.85), rgba(247, 239, 234, 0.94) 55%, rgba(243, 231, 223, 0.98) 100%)',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-4xl w-full bg-[#FFFCF9] text-[#272224] rounded-3xl overflow-hidden shadow-[0_24px_70px_rgba(107,29,69,0.12)] border border-[#EBDCD2]"
          >
            {/* Soft top accent strip */}
            <div className="h-2 w-full bg-gradient-to-r from-[#8B285A] via-[#D97797] to-[#F4A261]" />

            {/* Top GAVINTIN Brand Header + 5 Cute Walking Cats Stage */}
            <div className="px-6 sm:px-9 pt-6 sm:pt-7 pb-5 border-b border-[#EFE3DC] bg-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2.5 text-xs text-[#7A224F] font-medium">
                    <span className="w-7 h-7 rounded-xl bg-[#7A224F] text-white inline-flex items-center justify-center font-display font-bold text-sm shrink-0">
                      G
                    </span>
                    <span>ยินดีต้อนรับสู่พื้นที่สำรวจบ้าน</span>
                    <span aria-hidden="true">·</span>
                    <span>CENTRO พระราม 2 - พุทธบูชา 2</span>
                  </div>
                  <h1
                    id="welcome-gavintin-title"
                    className="mt-2.5 text-3xl sm:text-5xl font-bold font-display tracking-[0.08em] text-[#2B1822]"
                  >
                    GAVINTIN
                  </h1>
                </div>

                <div className="text-sm font-medium text-[#7A224F] pb-1">
                  {cleanDraft ? (
                    <span>สวัสดีคุณ{cleanDraft} ยินดีต้อนรับนะครับ</span>
                  ) : (
                    <span className="text-zinc-500 font-normal">
                      กรอกชื่อของคุณด้านล่างได้เลย
                    </span>
                  )}
                </div>
              </div>

              {/* 5 Cute Cats Walking Out Animation */}
              <CuteWalkingCats visitorName={draftName} />
            </div>

            {/* Bottom 2-Column Content */}
            <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
              {/* Left Column: Name Input, Description, Metrics & Actions */}
              <form
                onSubmit={handleNameSubmit}
                className="p-6 sm:p-8 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  {/* Visitor Name Input Field */}
                  <div>
                    <label
                      htmlFor="welcome-visitor-name"
                      className="block text-xs font-semibold text-[#5E2040] mb-1.5"
                    >
                      ชื่อผู้เข้าชมโครงการ
                    </label>
                    <div className="relative">
                      <UserRound className="w-4 h-4 text-[#9B5C7C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="welcome-visitor-name"
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="พิมพ์ชื่อเล่นของคุณ เช่น คุณกวิ้น, น้องมิน"
                        maxLength={40}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 focus:border-[#7A224F] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed">
                    สำรวจผังโครงการบ้านเดี่ยว เช็กตำแหน่งแปลงว่าง บ้านตัวอย่าง บ้านเลขที่จริง ราคาขายสุทธิ และลองคำนวณยอดผ่อนชำระของแต่ละหลังได้ง่ายๆ ในหน้าเดียว
                  </p>

                  {/* Clean 3-column metrics strip */}
                  <div className="pt-4 border-t border-[#EFE3DC] grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[11px] text-zinc-500">จำนวนแปลงทั้งหมด</div>
                      <div className="mt-0.5 text-lg sm:text-xl font-bold font-mono-tabular text-zinc-900">
                        {summary.total} หลัง
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">พร้อมขาย / ตัวอย่าง</div>
                      <div className="mt-0.5 text-lg sm:text-xl font-bold font-mono-tabular text-emerald-700">
                        {summary.available + summary.showhouse} หลัง
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">ช่วงราคาบ้าน</div>
                      <div className="mt-0.5 text-lg sm:text-xl font-bold font-mono-tabular text-[#7A224F]">
                        {formatMillion(summary.minPrice)}–{formatMillion(summary.maxPrice)} ลบ.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#7A224F] hover:bg-[#5E183C] rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    <Compass className="w-4 h-4" />
                    {cleanDraft ? `เข้าชมผังโครงการ (คุณ${cleanDraft})` : 'เข้าชมผังโครงการ'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnterWithName('directory')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-zinc-800 bg-white hover:bg-[#FAF5F1] border border-[#E5D5CC] rounded-xl transition-colors cursor-pointer"
                  >
                    <Table2 className="w-4 h-4 text-[#7A224F]" />
                    ดูบ้านเลขที่และราคา
                  </button>
                </div>
              </form>

              {/* Right Column: Framed Master Plan Preview */}
              <div className="bg-[#F5ECE6] p-5 sm:p-6 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-[#EFE3DC]">
                <button
                  type="button"
                  onClick={() => handleEnterWithName('plan')}
                  className="group block w-full bg-white p-2.5 rounded-2xl border border-[#E5D5CC] hover:border-[#7A224F]/50 transition-colors cursor-pointer text-left"
                >
                  <div className="overflow-hidden rounded-xl bg-stone-50">
                    <img
                      src="/assets/aistudio/_______60c0cee6.jpg"
                      alt="ผังโครงการ CENTRO พระราม 2 - พุทธบูชา 2"
                      className="w-full h-40 sm:h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-2.5 px-1 flex items-center justify-between text-xs text-zinc-600">
                    <span>ผังโครงการ 14 โซน (A–N)</span>
                    <span className="font-semibold text-[#7A224F]">เปิดผัง →</span>
                  </div>
                </button>

                <div className="space-y-1.5 pt-3 border-t border-[#E5D5CC] text-xs text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>แบบบ้านในโครงการ</span>
                    <span className="font-medium text-zinc-900">7 แบบ (164–289 ตร.ม.)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>คำนวณสินเชื่อบ้าน</span>
                    <span className="font-medium text-zinc-900 tabular-nums">
                      3 ปีแรก 1.59%–1.99% · สูงสุด 40 ปี
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
