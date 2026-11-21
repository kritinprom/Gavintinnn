import { ActiveTab } from '../types/project';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  compareCount: number;
  onOpenManageModal: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  compareCount,
  onOpenManageModal,
}: HeaderProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'plan', label: 'ผังโครงการ' },
    { id: 'directory', label: 'บ้านเลขที่และราคา' },
    { id: 'models', label: 'แบบบ้าน 7 สไตล์' },
    { id: 'compare', label: compareCount > 0 ? `เปรียบเทียบ (${compareCount})` : 'เปรียบเทียบ' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFCF9]/95 backdrop-blur-md border-b border-[#EBDCD2]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('plan')}
          className="text-left text-base sm:text-lg font-bold tracking-tight text-[#2B1822] font-display whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A224F] rounded-lg px-1.5 -ml-1.5 cursor-pointer"
        >
          CENTRO พระราม 2 - พุทธบูชา 2
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A224F] rounded-sm ${
                  isActive
                    ? 'text-[#7A224F] font-semibold'
                    : 'text-zinc-600 hover:text-[#7A224F]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[#7A224F]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenManageModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#7A224F] hover:bg-[#5E183C] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7A224F]"
          >
            จัดการข้อมูล / CSV
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row (strictly compact under 15% viewport height) */}
      <nav className="md:hidden flex items-center gap-1.5 px-4 pb-2 overflow-x-auto border-t border-[#F2E8E1] pt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#7A224F] text-white'
                  : 'text-zinc-600 hover:bg-[#FAF5F1]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
