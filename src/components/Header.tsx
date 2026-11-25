import {
  Cloud,
  CloudOff,
  Columns2,
  Home,
  Landmark,
  Lock,
  LogOut,
  Map as MapIcon,
  Music,
  ShieldCheck,
  TableProperties,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveTab } from '../types/project';
import {
  playClickSound,
  playEditOpenSound,
  playLockedSound,
  playTabSwitchSound,
} from '../utils/soundEffects';

interface HeaderProps {
  isStaffMode: boolean;
  onStaffUnlockRequest: () => void;
  onExitStaffMode: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  compareCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  activeMusicLabel: string | null;
  onOpenMusicHub: () => void;
  soldUnlocked: boolean;
  onRequestUnlock: () => void;
  onRelockSold: () => void;
  cloudUserLabel: string | null;
  onCloudAuthClick: () => void;
  onOpenManageModal: () => void;
}

export function Header({
  isStaffMode,
  onStaffUnlockRequest,
  onExitStaffMode,
  activeTab,
  onTabChange,
  compareCount,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  activeMusicLabel,
  onOpenMusicHub,
  soldUnlocked,
  onRequestUnlock,
  onRelockSold,
  cloudUserLabel,
  onCloudAuthClick,
  onOpenManageModal,
}: HeaderProps) {
  const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: typeof MapIcon }[] = [
    { id: 'plan', label: 'ผังโครงการ', shortLabel: 'ผัง', icon: MapIcon },
    { id: 'directory', label: 'บ้านเลขที่และราคา', shortLabel: 'รายการ', icon: TableProperties },
    { id: 'models', label: 'แบบบ้าน 7 สไตล์', shortLabel: 'แบบบ้าน', icon: Home },
    {
      id: 'compare',
      label: compareCount > 0 ? `เปรียบเทียบ (${compareCount})` : 'เปรียบเทียบ',
      shortLabel: compareCount > 0 ? `เทียบ (${compareCount})` : 'เทียบ',
      icon: Columns2,
    },
    { id: 'loans', label: 'จัดการสินเชื่อลูกค้า', shortLabel: 'สินเชื่อ', icon: Landmark },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    if (!isStaffMode) return;
    if (tab !== activeTab) {
      playTabSwitchSound();
    }
    onTabChange(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FFFEFC]/92 backdrop-blur-xl border-b border-[#E5DEC9] pt-[env(safe-area-inset-top)] shadow-[0_4px_24px_rgba(20,25,31,0.05)]">
        {/* Luxury Champagne Trim */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#14191F] via-[#C59B48] to-[#14191F]" />

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4 lg:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            data-sound="custom"
            onClick={() => {
              if (isStaffMode) {
                handleTabClick('plan');
              } else {
                playClickSound();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="text-left text-base md:text-lg font-bold tracking-tight text-[#14191F] font-display whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14191F] rounded-xl px-2 min-h-[44px] flex items-center gap-2.5 -ml-2 cursor-pointer"
          >
            <div className="hidden sm:flex w-7 h-7 rounded-lg bg-[#14191F] border border-[#C59B48]/50 items-center justify-center text-xs font-bold text-[#E5C57B] font-display shrink-0">
              C
            </div>
            <span>CENTRO พระราม 2 - พุทธบูชา 2</span>
          </button>

          {/* Zone 2: Staff-Only Navigation Links */}
          {isStaffMode && (
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-sound="custom"
                    onClick={() => handleTabClick(item.id)}
                    className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14191F] rounded-sm ${
                      isActive
                        ? 'text-[#14191F] font-semibold'
                        : 'text-zinc-500 hover:text-[#14191F]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="luxury-nav-underline"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full bg-gradient-to-r from-[#14191F] via-[#C59B48] to-[#14191F]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Utility Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isStaffMode && (
              <>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playClickSound();
                    onCloudAuthClick();
                  }}
                  title={
                    cloudUserLabel
                      ? `ซิงค์ข้อมูลเรียลไทม์ผ่านฐานข้อมูลกลาง (${cloudUserLabel}) · คลิกเพื่อออกจากระบบ`
                      : 'ยังไม่เชื่อมฐานข้อมูลกลาง · คลิกเพื่อเข้าสู่ระบบ Google ให้ทุกเครื่องเห็นข้อมูลตรงกัน'
                  }
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-w-[44px] h-11 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] ${
                    cloudUserLabel
                      ? 'bg-[#FBF7EE] border-[#DFC996] text-[#8A6820] hover:bg-[#F5EBD4]'
                      : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {cloudUserLabel ? (
                    <>
                      <Cloud className="w-4 h-4 text-[#9B7A36]" />
                      <span className="hidden xl:inline max-w-[115px] truncate">{cloudUserLabel}</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-4 h-4 text-amber-700" />
                      <span className="hidden md:inline">เชื่อมคลาวด์</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    if (soldUnlocked) {
                      playLockedSound();
                      onRelockSold();
                    } else {
                      playLockedSound();
                      onRequestUnlock();
                    }
                  }}
                  title={
                    soldUnlocked
                      ? 'ปลดล็อกแปลงขายแล้วอยู่ (คลิกเพื่อล็อกกลับ)'
                      : 'แปลงที่ขายแล้วถูกล็อก (คลิกใส่รหัสผ่านเพื่อปลดล็อก)'
                  }
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-w-[44px] h-11 text-xs font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] ${
                    soldUnlocked
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-[#F5F2EB] border-[#E0D9CA] text-zinc-700 hover:bg-[#EBE5D9]'
                  }`}
                >
                  {soldUnlocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span className="hidden md:inline">ปลดล็อกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#B91C3C]" />
                      <span className="hidden md:inline">ปลดล็อกแก้ไข</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              data-sound="custom"
              onClick={() => {
                playClickSound();
                onOpenMusicHub();
              }}
              title="เปิดคลังเพลง (บ้านของหัวใจ · เพลงเกี่ยวกับบ้าน · LISA · เพลงบรรเลง 20 เพลง)"
              aria-label="เปิดคลังเพลง"
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-w-[44px] h-11 text-xs font-medium rounded-xl border transition-colors cursor-pointer shrink-0 active:scale-[0.98] whitespace-nowrap ${
                activeMusicLabel || musicEnabled
                  ? 'bg-[#FBF7EE] border-[#DFC996] text-[#8A6820] hover:bg-[#F5EBD4]'
                  : 'bg-white border-[#E0D9CA] text-zinc-500 hover:text-[#14191F]'
              }`}
            >
              <Music
                className={`w-4 h-4 ${
                  activeMusicLabel || musicEnabled ? 'text-[#C59B48]' : 'text-zinc-400'
                }`}
              />
              <span className="hidden sm:inline max-w-[125px] truncate">
                {activeMusicLabel ? activeMusicLabel : 'เพลง & LISA'}
              </span>
            </button>

            <button
              type="button"
              data-sound="custom"
              onClick={onToggleSound}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟค' : 'เปิดเสียงเอฟเฟค'}
              aria-label={soundEnabled ? 'ปิดเสียงเอฟเฟค' : 'เปิดเสียงเอฟเฟค'}
              className={`w-11 h-11 inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer shrink-0 active:scale-[0.98] ${
                soundEnabled
                  ? 'bg-[#F5F2EB] border-[#E0D9CA] text-[#14191F] hover:bg-[#EBE5D9]'
                  : 'bg-white border-stone-200 text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {isStaffMode ? (
              <>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playEditOpenSound();
                    onOpenManageModal();
                  }}
                  className="px-3 md:px-3.5 h-11 text-xs font-semibold text-[#14191F] bg-[#F3ECD9] hover:bg-[#EADBB7] border border-[#D5BE84] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  <span className="hidden sm:inline">ข้อมูล / CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playLockedSound();
                    onExitStaffMode();
                  }}
                  title="ล็อกกลับสู่หน้าค้นหาสำหรับลูกค้า"
                  className="inline-flex items-center gap-1.5 px-3 md:px-3.5 h-11 text-xs font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#E5C57B]" />
                  <span>กลับหน้าลูกค้า</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playLockedSound();
                  onStaffUnlockRequest();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 md:px-4 h-11 text-xs font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4 text-[#E5C57B]" />
                <span>สำหรับเจ้าหน้าที่</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Staff-Only Bottom Tab Bar (< 1024px) */}
      {isStaffMode && (
        <nav
          aria-label="เมนูหลักสำหรับแท็บเล็ตและมือถือ"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFEFC]/94 backdrop-blur-xl border-t border-[#E5DEC9] pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(20,25,31,0.08)]"
        >
          <div className="max-w-2xl mx-auto grid grid-cols-5 h-[60px] px-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-sound="custom"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl my-1 transition-colors cursor-pointer active:scale-[0.97] ${
                    isActive
                      ? 'text-[#14191F] bg-[#F5F2EB] font-semibold'
                      : 'text-zinc-500 hover:text-[#14191F] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#9B7A36]' : ''}`} />
                  <span className="text-[11px] leading-tight whitespace-nowrap">
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
