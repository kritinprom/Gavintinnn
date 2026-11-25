import React, { useEffect, useState } from 'react';
import { Cloud, Eye, EyeOff, KeyRound, Lock, Unlock, X } from 'lucide-react';
import {
  playCancelSound,
  playClickSound,
  playErrorSound,
  playUnlockSound,
} from '../utils/soundEffects';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  mode?: 'sold' | 'staff';
  onGoogleSignIn?: () => void;
}

const PASSCODE = '110294';

export function UnlockModal({
  isOpen,
  onClose,
  onUnlockSuccess,
  mode = 'sold',
  onGoogleSignIn,
}: UnlockModalProps) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(false);
      setShowCode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isStaff = mode === 'staff';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === PASSCODE) {
      playUnlockSound();
      onUnlockSuccess();
      onClose();
    } else {
      playErrorSound();
      setError(true);
    }
  };

  const handleClose = () => {
    playCancelSound();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14191F]/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div
        className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-2xl w-full max-w-sm max-h-[88dvh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#ECE7DC] bg-[#14191F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#C59B48]/40 flex items-center justify-center text-[#E5C57B]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="unlock-modal-title"
                className="text-base font-bold text-white font-display"
              >
                {isStaff ? 'เข้าสู่โหมดเจ้าหน้าที่' : 'ปลดล็อกแปลงที่ขายแล้ว'}
              </h2>
              <p className="text-[11px] text-stone-300">
                {isStaff
                  ? 'เปิดผังโครงการ ราคา และคลังฐานข้อมูลลูกค้าแบบเรียลไทม์'
                  : 'ใส่รหัสผ่านเพื่อแก้ไขข้อมูลแปลงที่ขายแล้ว'}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-sound="custom"
            onClick={handleClose}
            aria-label="ปิดหน้าต่าง"
            className="w-11 h-11 inline-flex items-center justify-center text-stone-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isStaff && onGoogleSignIn && (
            <div className="p-3.5 rounded-xl bg-[#FBF7EE] border border-[#DFC996] space-y-2.5">
              <div className="text-xs font-semibold text-[#14191F] flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-[#A67F32] shrink-0" />
                <span>เชื่อมต่อฐานข้อมูลกลาง (แนะนำ)</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                เข้าสู่ระบบด้วย Google เพื่อดึงข้อมูลล่าสุดจากฐานข้อมูลกลาง และบันทึกให้ทุกเครื่องมองเห็นตรงกันแบบเรียลไทม์
              </p>
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playClickSound();
                  onClose();
                  onGoogleSignIn();
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D5B263] rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                <Cloud className="w-4 h-4" />
                เข้าสู่ระบบด้วย Google (ซิงค์ทุกเครื่อง)
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isStaff && (
              <div className="relative flex items-center py-0.5">
                <div className="flex-1 border-t border-[#ECE7DC]" />
                <span className="px-2.5 text-[11px] text-zinc-400">
                  หรือเข้าด้วยรหัสผ่าน
                </span>
                <div className="flex-1 border-t border-[#ECE7DC]" />
              </div>
            )}

            <div>
              <label
                htmlFor="unlock-passcode-input"
                className="block text-xs font-medium text-zinc-700 mb-1.5"
              >
                {isStaff ? 'รหัสผ่านเจ้าหน้าที่' : 'รหัสผ่านปลดล็อก'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#A67F32] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="unlock-passcode-input"
                  type={showCode ? 'text' : 'password'}
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="กรอกรหัสผ่าน..."
                  className={`w-full pl-9 pr-10 py-2.5 text-sm font-mono-tabular bg-[#F7F5F0] border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                    error
                      ? 'border-red-400 focus:ring-red-200 text-red-700'
                      : 'border-[#DCD4C3] focus:ring-[#C59B48]/35 focus:border-[#C59B48]'
                  }`}
                />
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => setShowCode((v) => !v)}
                  aria-label={showCode ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง
                </p>
              ) : isStaff ? (
                <p className="mt-1.5 text-[11px] text-zinc-500 leading-relaxed">
                  หากเข้าด้วยรหัสผ่านอย่างเดียว ข้อมูลจะบันทึกไว้ในเครื่องนี้ก่อนจนกว่าจะกดเชื่อมต่อ Google เพื่อซิงค์ขึ้นฐานข้อมูลกลาง
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                data-sound="custom"
                onClick={handleClose}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                data-sound="custom"
                disabled={!code.trim()}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Unlock className="w-3.5 h-3.5 text-[#E5C57B]" />
                {isStaff ? 'ยืนยันเข้าโหมดเจ้าหน้าที่' : 'ยืนยันปลดล็อก'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
