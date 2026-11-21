import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { CompareView } from './components/CompareView';
import { MiniCatFace } from './components/CuteWalkingCats';
import { DataManageModal } from './components/DataManageModal';
import { Header } from './components/Header';
import { HouseModelsView } from './components/HouseModelsView';
import { MasterPlanViewer } from './components/MasterPlanViewer';
import { UnitDirectoryTable } from './components/UnitDirectoryTable';
import { UnitInspector } from './components/UnitInspector';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { DEFAULT_PLOTS } from './data/masterPlanPlots';
import {
  ActiveTab,
  HouseModelId,
  OverlayMode,
  PlotFilterState,
  PlotUnit,
} from './types/project';
import { formatMillion } from './utils/formatters';

const STORAGE_KEY_OVERRIDES = 'centro_rama2_plot_overrides_v1';
const STORAGE_KEY_BOOKMARKS = 'centro_rama2_bookmarks_v1';
const STORAGE_KEY_VISITOR_NAME = 'centro_rama2_visitor_name_v1';

const INITIAL_FILTERS: PlotFilterState = {
  search: '',
  zone: 'ALL',
  model: 'ALL',
  status: 'ALL',
  facing: 'ALL',
  maxPriceMillion: 20,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('plan');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('plot');
  const [filters, setFilters] = useState<PlotFilterState>(INITIAL_FILTERS);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>('A01');
  const [focusRequestTick, setFocusRequestTick] = useState<number>(0);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  const [visitorName, setVisitorName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_VISITOR_NAME) ?? '';
    } catch {
      return '';
    }
  });
  const [isEditingVisitorName, setIsEditingVisitorName] = useState<boolean>(false);
  const [draftVisitorName, setDraftVisitorName] = useState<string>('');

  const [overrides, setOverrides] = useState<Record<string, Partial<PlotUnit>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch {
      // ignore storage quota errors
    }
  }, [overrides]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VISITOR_NAME, visitorName);
    } catch {
      // ignore
    }
  }, [visitorName]);

  const plots: PlotUnit[] = useMemo(() => {
    return DEFAULT_PLOTS.map((p) => ({
      ...p,
      ...(overrides[p.id] ?? {}),
    }));
  }, [overrides]);

  const filteredPlots = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return plots.filter((p) => {
      if (filters.zone !== 'ALL' && p.zone !== filters.zone) return false;
      if (filters.model !== 'ALL' && p.model !== filters.model) return false;
      if (filters.status !== 'ALL' && p.status !== filters.status) return false;
      if (filters.facing !== 'ALL' && p.facing !== filters.facing) return false;
      if (q) {
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesHouseNo = p.houseNumber.toLowerCase().includes(q);
        const matchesModel = p.model.toLowerCase().includes(q);
        const matchesTypeCode = (p.houseTypeCode ?? '').toLowerCase().includes(q);
        const matchesNote = p.note.toLowerCase().includes(q);
        if (!matchesId && !matchesHouseNo && !matchesModel && !matchesTypeCode && !matchesNote) return false;
      }
      return true;
    });
  }, [plots, filters]);

  const filteredPlotIds = useMemo(
    () => new Set(filteredPlots.map((p) => p.id)),
    [filteredPlots]
  );

  const selectedPlot = useMemo(
    () => plots.find((p) => p.id === selectedPlotId) ?? null,
    [plots, selectedPlotId]
  );

  const projectSummary = useMemo(() => {
    const available = plots.filter((p) => p.status === 'available').length;
    const showhouse = plots.filter((p) => p.status === 'showhouse').length;
    const minPrice = Math.min(...plots.map((p) => p.price));
    const maxPrice = Math.max(...plots.map((p) => p.price));
    const minWah = Math.min(...plots.map((p) => p.landSqWah));
    const maxWah = Math.max(...plots.map((p) => p.landSqWah));
    return { total: plots.length, available, showhouse, minPrice, maxPrice, minWah, maxWah };
  }, [plots]);

  const handleUpdatePlot = (id: string, patch: Partial<PlotUnit>) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...patch },
    }));
  };

  const handleBulkMerge = (updates: Record<string, Partial<PlotUnit>>): number => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return 0;
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = { ...(next[k] ?? {}), ...updates[k] };
      }
      return next;
    });
    return keys.length;
  };

  const handleResetAll = () => {
    setOverrides({});
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleNavigatePlot = (direction: 'prev' | 'next') => {
    const pool = filteredPlots.length > 0 ? filteredPlots : plots;
    const currentIndex = pool.findIndex((p) => p.id === selectedPlotId);
    if (currentIndex === -1) {
      setSelectedPlotId(pool[0]?.id ?? null);
      return;
    }
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % pool.length
        : (currentIndex - 1 + pool.length) % pool.length;
    const nextId = pool[nextIndex].id;
    setSelectedPlotId(nextId);
    setFocusRequestTick((t) => t + 1);
  };

  const handleLocatePlot = (id: string) => {
    setSelectedPlotId(id);
    setActiveTab('plan');
    setFocusRequestTick((t) => t + 1);
  };

  const handleSelectModelOnPlan = (model: HouseModelId) => {
    setFilters({ ...INITIAL_FILTERS, model });
    setActiveTab('plan');
  };

  const handleSaveInlineVisitorName = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorName(draftVisitorName.trim());
    setIsEditingVisitorName(false);
  };

  const bookmarkedPlots = useMemo(
    () =>
      bookmarkedIds
        .map((id) => plots.find((p) => p.id === id))
        .filter((p): p is PlotUnit => Boolean(p)),
    [bookmarkedIds, plots]
  );

  const cleanVisitorName = visitorName.trim();

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#272224]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        compareCount={bookmarkedIds.length}
        onOpenManageModal={() => setIsManageModalOpen(true)}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Cozy Project Overview & Personalized Greeting Strip */}
        <section className="bg-[#FFFCF9] border border-[#EBDCD2] rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(122,34,79,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowWelcome(true)}
              title="เปิดหน้าต้อนรับ GAVINTIN"
              className="w-12 h-12 rounded-2xl bg-[#FFF3EB] border border-[#EBDCD2] flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer"
            >
              <MiniCatFace className="w-9 h-9" />
            </button>

            <div className="min-w-0">
              <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-2">
                <span>AP Thailand</span>
                <span aria-hidden="true">·</span>
                <span>บ้านเดี่ยว 2 ชั้น 14 โซน (A–N)</span>
                <span aria-hidden="true">·</span>
                {isEditingVisitorName ? (
                  <form
                    onSubmit={handleSaveInlineVisitorName}
                    className="inline-flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={draftVisitorName}
                      onChange={(e) => setDraftVisitorName(e.target.value)}
                      placeholder="ใส่ชื่อของคุณ"
                      maxLength={40}
                      autoFocus
                      className="px-2.5 py-0.5 text-xs bg-white border border-[#D8C4B9] rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7A224F]/30 w-36"
                    />
                    <button
                      type="submit"
                      aria-label="บันทึกชื่อ"
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingVisitorName(false)}
                      aria-label="ยกเลิก"
                      className="p-1 text-zinc-400 hover:bg-stone-100 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftVisitorName(visitorName);
                      setIsEditingVisitorName(true);
                    }}
                    className="inline-flex items-center gap-1 text-[#7A224F] font-medium hover:underline cursor-pointer"
                  >
                    <span>
                      {cleanVisitorName ? `ผู้เข้าชม: คุณ${cleanVisitorName}` : 'ใส่ชื่อของคุณ'}
                    </span>
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>

              <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#2B1822] font-display text-balance">
                {cleanVisitorName
                  ? `สวัสดีคุณ${cleanVisitorName} · เลือกชมผังบ้านและราคาได้เลย`
                  : 'ผังโครงการ บ้านเลขที่ และราคาแต่ละแปลง'}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left lg:text-right shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#EFE3DC]">
            <div>
              <div className="text-xs text-zinc-500">จำนวนแปลงทั้งหมด</div>
              <div className="text-base sm:text-lg font-bold font-mono-tabular text-zinc-900">
                {projectSummary.total} หลัง
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">แปลงว่าง / ตัวอย่าง</div>
              <div className="text-base sm:text-lg font-bold font-mono-tabular text-emerald-700">
                {projectSummary.available} หลัง
                {projectSummary.showhouse > 0 && (
                  <span className="text-xs font-semibold text-blue-700 ml-1.5">
                    (+ตัวอย่าง {projectSummary.showhouse})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">ขนาดที่ดิน</div>
              <div className="text-base sm:text-lg font-bold font-mono-tabular text-zinc-900">
                {projectSummary.minWah.toFixed(1)}–{projectSummary.maxWah.toFixed(1)} ตร.วา
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">ช่วงราคาบ้านในโครงการ</div>
              <div className="text-base sm:text-lg font-bold font-mono-tabular text-[#7A224F]">
                {formatMillion(projectSummary.minPrice)}–{formatMillion(projectSummary.maxPrice)} ลบ.
              </div>
            </div>
          </div>
        </section>

        {/* Primary Views */}
        {activeTab === 'plan' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_385px] gap-5 items-start">
            <MasterPlanViewer
              plots={plots}
              filteredPlotIds={filteredPlotIds}
              selectedPlotId={selectedPlotId}
              onSelectPlot={(id) => setSelectedPlotId(id)}
              overlayMode={overlayMode}
              onOverlayModeChange={setOverlayMode}
              filters={filters}
              onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onResetFilters={() => setFilters(INITIAL_FILTERS)}
              focusRequestTick={focusRequestTick}
            />

            <div className="lg:sticky lg:top-20">
              <UnitInspector
                plot={selectedPlot}
                onUpdatePlot={handleUpdatePlot}
                onFocusOnPlan={() => setFocusRequestTick((t) => t + 1)}
                onNavigatePlot={handleNavigatePlot}
                isBookmarked={selectedPlot ? bookmarkedIds.includes(selectedPlot.id) : false}
                onToggleBookmark={handleToggleBookmark}
                canBookmarkMore={bookmarkedIds.length < 4}
              />
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <UnitDirectoryTable
            plots={filteredPlots}
            selectedPlotId={selectedPlotId}
            filters={filters}
            onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
            onSelectAndLocate={handleLocatePlot}
            onUpdatePlot={handleUpdatePlot}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {activeTab === 'models' && (
          <HouseModelsView
            plots={plots}
            onSelectModelOnPlan={handleSelectModelOnPlan}
          />
        )}

        {activeTab === 'compare' && (
          <CompareView
            bookmarkedPlots={bookmarkedPlots}
            onRemoveBookmark={handleToggleBookmark}
            onClearBookmarks={() => setBookmarkedIds([])}
            onLocatePlot={handleLocatePlot}
            onGoToPlan={() => setActiveTab('plan')}
          />
        )}
      </main>

      <footer className="border-t border-[#EBDCD2] bg-[#FFFCF9] mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-[#7A224F] tracking-wide">GAVINTIN</span>
            <span aria-hidden="true">·</span>
            <span>CENTRO พระราม 2 - พุทธบูชา 2 · ข้อมูลขนาดที่ดินและแบบบ้านอ้างอิงจากผังโครงการจริง</span>
          </div>
          <div className="flex items-center gap-3">
            <span>บ้านเลขที่และราคาเบื้องต้นสามารถกดแก้ไขหรือนำเข้าจากไฟล์ CSV ได้ทันที</span>
            <button
              type="button"
              onClick={() => setShowWelcome(true)}
              className="text-[#7A224F] font-medium hover:underline whitespace-nowrap cursor-pointer"
            >
              หน้าต้อนรับ & น้องแมว
            </button>
          </div>
        </div>
      </footer>

      <WelcomeOverlay
        isOpen={showWelcome}
        visitorName={visitorName}
        onVisitorNameChange={setVisitorName}
        summary={projectSummary}
        onEnter={(tab) => {
          setActiveTab(tab);
          setShowWelcome(false);
        }}
      />

      <DataManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        plots={plots}
        onBulkMerge={handleBulkMerge}
        onResetAll={handleResetAll}
      />
    </div>
  );
}
