import React, { useState } from 'react';
import { Download, Lock, RotateCcw, Unlock, Upload, X } from 'lucide-react';
import { PlotStatus, PlotUnit } from '../types/project';
import { plotsToCSV } from '../utils/formatters';
import {
  playCancelSound,
  playLockedSound,
  playSuccessSound,
} from '../utils/soundEffects';

interface DataManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: PlotUnit[];
  soldUnlocked: boolean;
  onRequestUnlock: () => void;
  onBulkMerge: (updates: Record<string, Partial<PlotUnit>>) => number;
  onResetAll: () => void;
}

export function DataManageModal({
  isOpen,
  onClose,
  plots,
  soldUnlocked,
  onRequestUnlock,
  onBulkMerge,
  onResetAll,
}: DataManageModalProps) {
  const [csvText, setCsvText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    playSuccessSound();
    const csv = plotsToCSV(plots);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centro-rama2-phutthabucha2-plots.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  };

  const handleImportCSV = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setFeedback('ไม่พบข้อมูลสำหรับนำเข้า');
      return;
    }

    const updates: Record<string, Partial<PlotUnit>> = {};
    for (const line of lines) {
      // Support simple format: A01, 9/1, 12463837, available
      // Or full exported CSV: A01, A, 9/1, ZOTICUS, 86.1, 12463837, available, ...
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const plotId = cols[0]?.toUpperCase();
      if (!plotId || !/^[A-N]\d{2}$/.test(plotId)) continue;

      if (cols.length >= 6 && /^[A-N]$/.test(cols[1])) {
        // Full exported format
        const patch: Partial<PlotUnit> = {};
        if (cols[2]) patch.houseNumber = cols[2];
        const priceNum = Number(cols[5]);
        if (Number.isFinite(priceNum) && priceNum > 0) patch.price = priceNum;
        if (
          cols[6] === 'available' ||
          cols[6] === 'showhouse' ||
          cols[6] === 'reserved' ||
          cols[6] === 'not_open' ||
          cols[6] === 'sold'
        ) {
          patch.status = cols[6] as PlotStatus;
        }
        if (cols[8] !== undefined) patch.note = cols[8];
        updates[plotId] = patch;
      } else {
        // Compact format: plotId, houseNumber, price, status?
        const patch: Partial<PlotUnit> = {};
        if (cols[1]) patch.houseNumber = cols[1];
        if (cols[2]) {
          const priceNum = Number(cols[2]);
          if (Number.isFinite(priceNum) && priceNum > 0) patch.price = priceNum;
        }
        if (
          cols[3] === 'available' ||
          cols[3] === 'showhouse' ||
          cols[3] === 'reserved' ||
          cols[3] === 'not_open' ||
          cols[3] === 'sold'
        ) {
          patch.status = cols[3] as PlotStatus;
        }
        updates[plotId] = patch;
      }
    }

    const count = onBulkMerge(updates);
    if (count > 0) {
      setFeedback(
        soldUnlocked
          ? `อัปเดตข้อมูลสำเร็จจำนวน ${count} แปลง (รวมแปลงที่ปลดล็อกแล้ว)`
          : `อัปเดตข้อมูลสำเร็จจำนวน ${count} แปลง (แปลงที่ขายแล้วจะถูกล็อกข้ามอัตโนมัติ)`
      );
      setCsvText('');
    } else {
      setFeedback(
        soldUnlocked
          ? 'ไม่พบรหัสแปลงที่ตรงกัน กรุณาตรวจสอบรูปแบบข้อมูล'
          : 'ไม่พบรหัสแปลงที่แก้ไขได้ (กรุณาตรวจสอบรูปแบบ หรือแปลงที่ระบุขายแล้วและถูกล็อก)'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleImportCSV(reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C2621]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFEFC] border border-[#E3DCD0] rounded-2xl w-full max-w-xl max-h-[88dvh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#ECE6DB] bg-white/80 sticky top-0 z-10 backdrop-blur-sm flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 font-display">
              จัดการข้อมูลบ้านเลขที่และราคา
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              ส่งออกหรือนำเข้าข้อมูล CSV เพื่ออัปเดตบ้านเลขที่และราคาจริงของแต่ละหลัง
            </p>
          </div>
          <button
            type="button"
            data-sound="custom"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-11 h-11 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {feedback && (
            <div className="px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              {feedback}
            </div>
          )}

          {/* Export Section */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div>
              <div className="text-sm font-semibold text-zinc-900">1. ส่งออกไฟล์ CSV ทั้งหมด ({plots.length} แปลง)</div>
              <p className="text-xs text-zinc-500 mt-0.5">
                นำไปเปิดแก้บ้านเลขที่และราคาใน Excel หรือ Google Sheets แล้วนำเข้ากลับมาได้ทันที
              </p>
            </div>
            <button
              type="button"
              data-sound="custom"
              onClick={handleDownloadCSV}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#164A37] hover:bg-[#0F3527] rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด CSV
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-2.5 pb-5 border-b border-[#ECE6DB]">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-900">
                2. นำเข้า / อัปเดตบ้านเลขที่และราคาจาก CSV
              </div>
              <label className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-[#F3EFE8] hover:bg-[#E9E3D8] border border-[#E3DCD0] rounded-xl cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                เลือกไฟล์ .csv
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-500">
              วางข้อมูลรูปแบบ <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">รหัสแปลง, บ้านเลขที่, ราคา(บาท), สถานะ</code> เช่น <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">A01, 9/1, 12463837, available</code> (สถานะ: <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">available</code>, <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">showhouse</code>, <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">reserved</code>, <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">not_open</code>, <code className="font-mono-tabular bg-[#F3EFE8] px-1 rounded">sold</code>)
            </p>
            <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] font-medium ${
              soldUnlocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50/70 border-red-200 text-red-700'
            }`}>
              <span className="inline-flex items-center gap-1.5">
                {soldUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {soldUnlocked
                  ? 'ปลดล็อกแปลงที่ขายแล้วอยู่ — สามารถนำเข้าแก้ไขทุกแปลงได้'
                  : 'แปลงที่ขายแล้วถูกล็อกไม่ให้เขียนทับ'}
              </span>
              {!soldUnlocked && (
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playLockedSound();
                    onRequestUnlock();
                  }}
                  className="min-h-[36px] px-2 underline font-semibold hover:text-red-900 cursor-pointer whitespace-nowrap"
                >
                  ใส่รหัสปลดล็อก
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'A01, 9/1, 12463837, available\nA02, 9/2, 11138474, reserved'}
              className="w-full p-3 text-xs font-mono-tabular bg-[#F3EFE8] border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#164A37]/30"
            />
            <div className="flex justify-end">
              <button
                type="button"
                data-sound="custom"
                disabled={!csvText.trim()}
                onClick={() => handleImportCSV(csvText)}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                อัปเดตข้อมูลจากข้อความ
              </button>
            </div>
          </div>

          {/* Reset Section */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้น</div>
              <p className="text-xs text-zinc-500 mt-0.5">
                ล้างค่าที่แก้ไขทั้งหมดในเบราว์เซอร์กลับสู่ราคาและบ้านเลขที่ตั้งต้น
              </p>
            </div>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ตข้อมูล
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    onResetAll();
                    setConfirmReset(false);
                    setFeedback('รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นแล้ว');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
                >
                  ยืนยันรีเซ็ต
                </button>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playCancelSound();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-stone-100 rounded-md cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
