import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronUp, Home, Landmark, Music, SkipForward, X } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ChristmasHouseScene } from './components/ChristmasHouseScene';
import { CompareView } from './components/CompareView';
import { MiniCatFace } from './components/CuteWalkingCats';
import { DataManageModal } from './components/DataManageModal';
import { Header } from './components/Header';
import { HouseModelsView } from './components/HouseModelsView';
import { LoanStatusView } from './components/LoanStatusView';
import { MasterPlanViewer } from './components/MasterPlanViewer';
import { UnitDirectoryTable } from './components/UnitDirectoryTable';
import { UnitInspector } from './components/UnitInspector';
import { UnlockModal } from './components/UnlockModal';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { DEFAULT_PLOTS } from './data/masterPlanPlots';
import {
  auth,
  buildLoanCaseCreatePayload,
  buildLoanCaseUpdatePayload,
  buildLoanPublicStatusCreatePayload,
  buildLoanPublicStatusUpdatePayload,
  buildPlotOverridePayload,
  buildUserWorkspacePayload,
  db,
  handleFirestoreError,
  OperationType,
  sanitizeHouseNumber,
  sanitizeLoanCase,
  sanitizePrice,
  searchPublicLoanStatus,
  signInWithGoogle,
  signOutUser,
  toPublicLoanStatusRecord,
} from './firebase';
import {
  ActiveTab,
  HouseModelId,
  LoanCase,
  LoanPublicStatus,
  OverlayMode,
  PlotFilterState,
  PlotStatus,
  PlotUnit,
} from './types/project';
import { formatMillion, STATUS_SHORT_LABELS } from './utils/formatters';
import {
  ChristmasTrack,
  getCurrentChristmasTrack,
  isMusicEnabled,
  LUXURY_AMBIENT_PLAYLIST,
  nextChristmasTrack,
  setMusicEnabledPref,
  startChristmasMusic,
  stopChristmasMusic,
  subscribeChristmasTrack,
} from './utils/christmasMusic';
import {
  isSoundEnabled,
  playBookmarkSound,
  playCancelSound,
  playClickSound,
  playLockedSound,
  playMeowSound,
  playSelectPlotSound,
  playSuccessSound,
  playTabSwitchSound,
  playToggleSound,
  setSoundEnabled as persistSoundEnabled,
} from './utils/soundEffects';

const STORAGE_KEY_OVERRIDES = 'centro_rama2_plot_overrides_v1';
const STORAGE_KEY_BOOKMARKS = 'centro_rama2_bookmarks_v1';
const STORAGE_KEY_ACTIVE_TAB = 'centro_rama2_active_tab_v1';
const STORAGE_KEY_OVERLAY_MODE = 'centro_rama2_overlay_mode_v1';
const STORAGE_KEY_SELECTED_PLOT = 'centro_rama2_selected_plot_v1';
const STORAGE_KEY_FILTERS = 'centro_rama2_filters_v1';
const STORAGE_KEY_LOAN_CASES = 'centro_rama2_loan_cases_v1';
const SESSION_KEY_SOLD_UNLOCKED = 'centro_rama2_sold_unlocked_v1';
const SESSION_KEY_STAFF_UNLOCKED = 'centro_rama2_staff_unlocked_v1';
const BROADCAST_CHANNEL_NAME = 'centro_rama2_realtime_sync_v1';

const INITIAL_FILTERS: PlotFilterState = {
  search: '',
  zone: 'ALL',
  model: 'ALL',
  status: 'ALL',
  facing: 'ALL',
  maxPriceMillion: 20,
};

function loadSavedFilters(): PlotFilterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (raw) {
      return { ...INITIAL_FILTERS, ...(JSON.parse(raw) as Partial<PlotFilterState>) };
    }
  } catch {
    // ignore
  }
  return INITIAL_FILTERS;
}

function loadSavedTab(): ActiveTab {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
    if (
      val === 'plan' ||
      val === 'directory' ||
      val === 'models' ||
      val === 'compare' ||
      val === 'loans'
    ) {
      return val;
    }
  } catch {
    // ignore
  }
  return 'plan';
}

function loadSavedOverlay(): OverlayMode {
  try {
    const val = localStorage.getItem(STORAGE_KEY_OVERLAY_MODE);
    if (val === 'plot' || val === 'houseNumber' || val === 'price' || val === 'status') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'plot';
}

function loadSavedSelectedPlot(): string | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_SELECTED_PLOT);
    if (val) return val;
  } catch {
    // ignore
  }
  return 'A01';
}

function loadSavedLoanCases(): LoanCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOAN_CASES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => sanitizeLoanCase(item as LoanCase));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(loadSavedTab);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(loadSavedOverlay);
  const [filters, setFilters] = useState<PlotFilterState>(loadSavedFilters);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(loadSavedSelectedPlot);
  const [focusRequestTick, setFocusRequestTick] = useState<number>(0);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [isTabletInspectorOpen, setIsTabletInspectorOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());
  const [musicEnabled, setMusicEnabledState] = useState<boolean>(() => isMusicEnabled());
  const [currentTrack, setCurrentTrack] = useState<ChristmasTrack>(() => getCurrentChristmasTrack());
  const [firestoreFatalError, setFirestoreFatalError] = useState<Error | null>(null);
  const [soldUnlocked, setSoldUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY_SOLD_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });
  const [staffUnlocked, setStaffUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY_STAFF_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });
  const [forceCustomerView, setForceCustomerView] = useState<boolean>(false);
  const [unlockModalMode, setUnlockModalMode] = useState<'sold' | 'staff'>('staff');

  // Firebase Auth & Realtime Sync state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

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

  const [loanCases, setLoanCases] = useState<LoanCase[]>(loadSavedLoanCases);
  const [localPublicStatuses, setLocalPublicStatuses] = useState<LoanPublicStatus[]>([]);

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteWorkspaceRef = useRef(false);
  const hasHydratedCloudOverridesRef = useRef(false);
  const hasHydratedCloudLoansRef = useRef(false);
  const cloudLoanCaseIdsRef = useRef<Set<string>>(new Set());

  const showTimedNotice = useCallback((msg: string) => {
    setCloudNotice(msg);
    window.setTimeout(() => {
      setCloudNotice((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        hasHydratedCloudOverridesRef.current = false;
        hasHydratedCloudLoansRef.current = false;
        cloudLoanCaseIdsRef.current.clear();
      }
    });
    return () => unsub();
  }, []);

  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  const loanCasesRef = useRef(loanCases);
  useEffect(() => {
    loanCasesRef.current = loanCases;
  }, [loanCases]);

  // Real-time Firestore listener for shared plot overrides, loan cases & user workspace
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const plotOverridesPath = 'plot_overrides';
    const unsubPlots = onSnapshot(
      collection(db, plotOverridesPath),
      (snapshot) => {
        const cloudOverrides: Record<string, Partial<PlotUnit>> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const plotId = docSnap.id;
          const patch: Partial<PlotUnit> = {};
          if (typeof data.houseNumber === 'string') patch.houseNumber = data.houseNumber;
          if (typeof data.price === 'number') patch.price = data.price;
          if (
            data.status === 'available' ||
            data.status === 'showhouse' ||
            data.status === 'reserved' ||
            data.status === 'not_open' ||
            data.status === 'sold'
          ) {
            patch.status = data.status as PlotStatus;
          }
          if (typeof data.note === 'string') patch.note = data.note;
          cloudOverrides[plotId] = patch;
        });

        // On first hydration after sign-in, push any local edits not yet in cloud
        if (!hasHydratedCloudOverridesRef.current) {
          hasHydratedCloudOverridesRef.current = true;
          const localCurrent = overridesRef.current;
          const unsyncedKeys = Object.keys(localCurrent).filter(
            (k) => !cloudOverrides[k]
          );
          if (unsyncedKeys.length > 0) {
            const merged = { ...localCurrent, ...cloudOverrides };
            setOverrides(merged);
            const batch = writeBatch(db);
            let hasBatchWrites = false;
            for (const k of unsyncedKeys) {
              const basePlot = DEFAULT_PLOTS.find((p) => p.id === k);
              if (!basePlot) continue;
              if (basePlot.status === 'sold' && user.email !== 'kritin.prom@gmail.com') {
                continue;
              }
              const mergedPlot: PlotUnit = { ...basePlot, ...localCurrent[k] };
              batch.set(
                doc(db, 'plot_overrides', k),
                buildPlotOverridePayload(mergedPlot, user.uid)
              );
              hasBatchWrites = true;
            }
            if (hasBatchWrites) {
              void batch.commit().catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, plotOverridesPath)
              );
            }
            return;
          }
        }

        setOverrides(cloudOverrides);
        try {
          localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(cloudOverrides));
        } catch {
          // ignore
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, plotOverridesPath);
      }
    );

    const loanCasesPath = 'loan_cases';
    const isAdminUser = user.email === 'kritin.prom@gmail.com';
    const loanCasesSource = isAdminUser
      ? collection(db, loanCasesPath)
      : query(collection(db, loanCasesPath), where('ownerId', '==', user.uid));

    const unsubLoans = onSnapshot(
      loanCasesSource,
      (snapshot) => {
        const cloudCases: LoanCase[] = [];
        const cloudIds = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const updatedMillis =
            typeof data.updatedAt?.toMillis === 'function'
              ? data.updatedAt.toMillis()
              : Date.now();
          const sanitized = sanitizeLoanCase({
            caseId: docSnap.id,
            ownerId: typeof data.ownerId === 'string' ? data.ownerId : user.uid,
            plotId: data.plotId,
            customerName: data.customerName,
            customerPhone: typeof data.customerPhone === 'string' ? data.customerPhone : '',
            customerIdCard: typeof data.customerIdCard === 'string' ? data.customerIdCard : '',
            overallStatus: data.overallStatus,
            note: data.note,
            banks: Array.isArray(data.banks) ? data.banks : [],
            updatedAtMs: updatedMillis,
          });
          cloudCases.push(sanitized);
          cloudIds.add(sanitized.caseId);
        });
        cloudLoanCaseIdsRef.current = cloudIds;

        if (!hasHydratedCloudLoansRef.current) {
          hasHydratedCloudLoansRef.current = true;
          const localCases = loanCasesRef.current;
          const unsyncedLocal = localCases.filter((lc) => !cloudIds.has(lc.caseId));
          if (unsyncedLocal.length > 0) {
            const mergedCases = [...unsyncedLocal, ...cloudCases];
            setLoanCases(mergedCases);
            void (async () => {
              const batch = writeBatch(db);
              for (const lc of unsyncedLocal) {
                const basePlot = DEFAULT_PLOTS.find((p) => p.id === lc.plotId);
                const mergedPlot = basePlot
                  ? { ...basePlot, ...(overridesRef.current[basePlot.id] ?? {}) }
                  : undefined;
                batch.set(
                  doc(db, loanCasesPath, lc.caseId),
                  buildLoanCaseCreatePayload(lc, user.uid)
                );
                batch.set(
                  doc(db, 'loan_public_status', lc.caseId),
                  await buildLoanPublicStatusCreatePayload(lc, mergedPlot, user.uid)
                );
                cloudLoanCaseIdsRef.current.add(lc.caseId);
              }
              await batch.commit();
            })().catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, loanCasesPath)
            );
            return;
          }
        }

        setLoanCases(cloudCases);
        try {
          localStorage.setItem(STORAGE_KEY_LOAN_CASES, JSON.stringify(cloudCases));
        } catch {
          // ignore
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, loanCasesPath);
      }
    );

    const workspacePath = `users/${user.uid}/preferences/workspace`;
    const unsubWorkspace = onSnapshot(
      doc(db, 'users', user.uid, 'preferences', 'workspace'),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        isApplyingRemoteWorkspaceRef.current = true;
        if (Array.isArray(data.bookmarkedIds)) {
          setBookmarkedIds(
            data.bookmarkedIds.filter((id): id is string => typeof id === 'string').slice(0, 4)
          );
        }
        if (typeof data.soundEnabled === 'boolean') {
          persistSoundEnabled(data.soundEnabled);
          setSoundEnabledState(data.soundEnabled);
        }
        if (
          data.overlayMode === 'plot' ||
          data.overlayMode === 'houseNumber' ||
          data.overlayMode === 'price' ||
          data.overlayMode === 'status'
        ) {
          setOverlayMode(data.overlayMode);
        }
        if (
          data.activeTab === 'plan' ||
          data.activeTab === 'directory' ||
          data.activeTab === 'models' ||
          data.activeTab === 'compare' ||
          data.activeTab === 'loans'
        ) {
          setActiveTab(data.activeTab);
        }
        if (typeof data.selectedPlotId === 'string') {
          setSelectedPlotId(data.selectedPlotId);
        }
        window.setTimeout(() => {
          isApplyingRemoteWorkspaceRef.current = false;
        }, 0);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, workspacePath);
      }
    );

    return () => {
      unsubPlots();
      unsubLoans();
      unsubWorkspace();
    };
  }, [authReady, user]);

  // Real-time cross-tab sync via BroadcastChannel & storage events
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = ch;
      ch.onmessage = (event) => {
        const msg = event.data as { type?: string; payload?: unknown } | undefined;
        if (!msg || !msg.type) return;
        if (msg.type === 'overrides' && msg.payload && typeof msg.payload === 'object') {
          setOverrides(msg.payload as Record<string, Partial<PlotUnit>>);
        } else if (msg.type === 'bookmarks' && Array.isArray(msg.payload)) {
          setBookmarkedIds(msg.payload as string[]);
        } else if (msg.type === 'loan_cases' && Array.isArray(msg.payload)) {
          setLoanCases((msg.payload as LoanCase[]).map((item) => sanitizeLoanCase(item)));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_OVERRIDES && e.newValue) {
        try {
          setOverrides(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_BOOKMARKS && e.newValue) {
        try {
          setBookmarkedIds(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_LOAN_CASES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setLoanCases(parsed.map((item) => sanitizeLoanCase(item as LoanCase)));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      broadcastRef.current?.close();
      broadcastRef.current = null;
    };
  }, []);

  // Persist local state immediately on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch {
      // ignore
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
      localStorage.setItem(STORAGE_KEY_LOAN_CASES, JSON.stringify(loanCases));
    } catch {
      // ignore
    }
  }, [loanCases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERLAY_MODE, overlayMode);
    } catch {
      // ignore
    }
  }, [overlayMode]);

  useEffect(() => {
    try {
      if (selectedPlotId) {
        localStorage.setItem(STORAGE_KEY_SELECTED_PLOT, selectedPlotId);
      }
    } catch {
      // ignore
    }
  }, [selectedPlotId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY_SOLD_UNLOCKED, String(soldUnlocked));
    } catch {
      // ignore
    }
  }, [soldUnlocked]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY_STAFF_UNLOCKED, String(staffUnlocked));
    } catch {
      // ignore
    }
  }, [staffUnlocked]);

  // Real-time workspace cloud sync whenever workspace state changes (if signed in)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || isApplyingRemoteWorkspaceRef.current) {
      return;
    }
    const workspacePath = `users/${user.uid}/preferences/workspace`;
    const syncWorkspace = async () => {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'preferences', 'workspace'),
          buildUserWorkspacePayload({
            uid: user.uid,
            bookmarkedIds,
            soundEnabled,
            overlayMode,
            activeTab,
            selectedPlotId,
          })
        );
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, workspacePath);
        } catch (wrapped) {
          setFirestoreFatalError(wrapped as Error);
        }
      }
    };
    void syncWorkspace();
  }, [authReady, user, bookmarkedIds, soundEnabled, overlayMode, activeTab, selectedPlotId]);

  // Global fallback UI click & control sound effects across the entire app
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'button, a, [role="button"], label'
      ) as HTMLElement | null;
      if (!interactive) return;
      if (interactive.hasAttribute('disabled') || interactive.getAttribute('aria-disabled') === 'true') {
        playLockedSound();
        return;
      }
      if (interactive.dataset.sound === 'custom') return;
      playClickSound();
    };

    const handleGlobalChange = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'SELECT' ||
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox')
      ) {
        playToggleSound();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('change', handleGlobalChange);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('change', handleGlobalChange);
    };
  }, []);

  // Unlock and gently start soft ambient music on first user tap/click/keypress (Safari/iPadOS safe)
  useEffect(() => {
    if (!musicEnabled) {
      stopChristmasMusic();
      return;
    }

    const handleFirstInteraction = () => {
      if (isMusicEnabled()) {
        startChristmasMusic();
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [musicEnabled]);

  useEffect(() => {
    return subscribeChristmasTrack(setCurrentTrack);
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    persistSoundEnabled(next);
    setSoundEnabledState(next);
    if (next) {
      playToggleSound();
    }
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabledPref(next);
    setMusicEnabledState(next);
    if (next) {
      playToggleSound();
      startChristmasMusic();
    } else {
      playCancelSound();
      stopChristmasMusic();
    }
  };

  const handleNextTrack = () => {
    playToggleSound();
    if (!musicEnabled) {
      setMusicEnabledPref(true);
      setMusicEnabledState(true);
    }
    nextChristmasTrack();
    startChristmasMusic();
  };

  const handleCloudAuthClick = async () => {
    if (user) {
      await signOutUser();
      showTimedNotice('ออกจากระบบซิงค์คลาวด์แล้ว (ยังบันทึกอัตโนมัติในเครื่องนี้)');
      return;
    }
    try {
      await signInWithGoogle();
      setForceCustomerView(false);
      playSuccessSound();
      showTimedNotice('เชื่อมต่อคลาวด์สำเร็จ · ข้อมูลอัปเดตและบันทึกแบบเรียลไทม์แล้ว');
    } catch {
      showTimedNotice('ยกเลิกการเชื่อมต่อคลาวด์');
    }
  };

  const plots: PlotUnit[] = useMemo(() => {
    return DEFAULT_PLOTS.map((p) => ({
      ...p,
      ...(overrides[p.id] ?? {}),
    }));
  }, [overrides]);

  useEffect(() => {
    let cancelled = false;
    const plotById = new Map(plots.map((p) => [p.id, p]));
    void Promise.all(
      loanCases.map((lc) => toPublicLoanStatusRecord(lc, plotById.get(lc.plotId)))
    ).then((records) => {
      if (!cancelled) {
        setLocalPublicStatuses(records);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loanCases, plots]);

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
    const notOpen = plots.filter((p) => p.status === 'not_open').length;
    const minPrice = Math.min(...plots.map((p) => p.price));
    const maxPrice = Math.max(...plots.map((p) => p.price));
    const minWah = Math.min(...plots.map((p) => p.landSqWah));
    const maxWah = Math.max(...plots.map((p) => p.landSqWah));
    return { total: plots.length, available, showhouse, notOpen, minPrice, maxPrice, minWah, maxWah };
  }, [plots]);

  const handleUpdatePlot = async (id: string, patch: Partial<PlotUnit>) => {
    const current = plots.find((p) => p.id === id);
    if (!current || (current.status === 'sold' && !soldUnlocked)) {
      playLockedSound();
      return;
    }

    const sanitizedPatch: Partial<PlotUnit> = {
      ...patch,
      ...(patch.houseNumber !== undefined
        ? { houseNumber: sanitizeHouseNumber(patch.houseNumber, current.houseNumber) }
        : {}),
      ...(patch.price !== undefined
        ? { price: sanitizePrice(patch.price, current.price) }
        : {}),
      ...(patch.note !== undefined ? { note: patch.note.trim().slice(0, 300) } : {}),
    };

    const nextPlot: PlotUnit = { ...current, ...sanitizedPatch };

    playSuccessSound();
    setOverrides((prev) => {
      const next = {
        ...prev,
        [id]: { ...(prev[id] ?? {}), ...sanitizedPatch },
      };
      broadcastRef.current?.postMessage({ type: 'overrides', payload: next });
      return next;
    });

    if (user && user.emailVerified) {
      const path = `plot_overrides/${id}`;
      try {
        await setDoc(doc(db, 'plot_overrides', id), buildPlotOverridePayload(nextPlot, user.uid));
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (wrapped) {
          setFirestoreFatalError(wrapped as Error);
        }
      }
    }
  };

  const handleSaveLoanCase = async (loanCase: LoanCase) => {
    const sanitized = sanitizeLoanCase({
      ...loanCase,
      ownerId: loanCase.ownerId || user?.uid,
      updatedAtMs: Date.now(),
    });

    playSuccessSound();
    setLoanCases((prev) => {
      const exists = prev.some((item) => item.caseId === sanitized.caseId);
      const next = exists
        ? prev.map((item) => (item.caseId === sanitized.caseId ? sanitized : item))
        : [sanitized, ...prev];
      broadcastRef.current?.postMessage({ type: 'loan_cases', payload: next });
      return next;
    });

    if (user && user.emailVerified) {
      const path = `loan_cases/${sanitized.caseId}`;
      const targetPlot = plots.find((p) => p.id === sanitized.plotId);
      try {
        const batch = writeBatch(db);
        const privateRef = doc(db, 'loan_cases', sanitized.caseId);
        const publicRef = doc(db, 'loan_public_status', sanitized.caseId);

        if (!cloudLoanCaseIdsRef.current.has(sanitized.caseId)) {
          batch.set(privateRef, buildLoanCaseCreatePayload(sanitized, user.uid));
          cloudLoanCaseIdsRef.current.add(sanitized.caseId);
        } else {
          batch.update(privateRef, buildLoanCaseUpdatePayload(sanitized));
        }

        const existingPublic = await getDoc(publicRef);
        if (existingPublic.exists()) {
          batch.update(
            publicRef,
            await buildLoanPublicStatusUpdatePayload(sanitized, targetPlot)
          );
        } else {
          batch.set(
            publicRef,
            await buildLoanPublicStatusCreatePayload(
              sanitized,
              targetPlot,
              sanitized.ownerId || user.uid
            )
          );
        }

        await batch.commit();
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (wrapped) {
          setFirestoreFatalError(wrapped as Error);
        }
      }
    }
  };

  const handleDeleteLoanCase = async (caseId: string) => {
    playCancelSound();
    setLoanCases((prev) => {
      const next = prev.filter((item) => item.caseId !== caseId);
      broadcastRef.current?.postMessage({ type: 'loan_cases', payload: next });
      return next;
    });

    if (user && user.emailVerified && cloudLoanCaseIdsRef.current.has(caseId)) {
      const path = `loan_cases/${caseId}`;
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'loan_cases', caseId));
        batch.delete(doc(db, 'loan_public_status', caseId));
        await batch.commit();
        cloudLoanCaseIdsRef.current.delete(caseId);
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, path);
        } catch (wrapped) {
          setFirestoreFatalError(wrapped as Error);
        }
      }
    }
  };

  const handleBulkMerge = (updates: Record<string, Partial<PlotUnit>>): number => {
    const keys = Object.keys(updates).filter((k) => {
      const current = plots.find((p) => p.id === k);
      return current && (current.status !== 'sold' || soldUnlocked);
    });
    if (keys.length === 0) {
      playLockedSound();
      return 0;
    }

    playSuccessSound();
    const nextPlotMap: Record<string, PlotUnit> = {};
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        const current = plots.find((p) => p.id === k)!;
        const rawPatch = updates[k];
        const safePatch: Partial<PlotUnit> = {
          ...rawPatch,
          ...(rawPatch.houseNumber !== undefined
            ? { houseNumber: sanitizeHouseNumber(rawPatch.houseNumber, current.houseNumber) }
            : {}),
          ...(rawPatch.price !== undefined
            ? { price: sanitizePrice(rawPatch.price, current.price) }
            : {}),
          ...(rawPatch.note !== undefined ? { note: rawPatch.note.trim().slice(0, 300) } : {}),
        };
        next[k] = { ...(next[k] ?? {}), ...safePatch };
        nextPlotMap[k] = { ...current, ...safePatch };
      }
      broadcastRef.current?.postMessage({ type: 'overrides', payload: next });
      return next;
    });

    if (user && user.emailVerified) {
      void (async () => {
        const batch = writeBatch(db);
        for (const k of keys) {
          batch.set(doc(db, 'plot_overrides', k), buildPlotOverridePayload(nextPlotMap[k], user.uid));
        }
        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'plot_overrides');
        }
      })();
    }
    return keys.length;
  };

  const handleResetAll = () => {
    playCancelSound();
    const overrideKeys = Object.keys(overrides);
    setOverrides({});
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    broadcastRef.current?.postMessage({ type: 'overrides', payload: {} });

    if (user && user.emailVerified && overrideKeys.length > 0) {
      void (async () => {
        for (const k of overrideKeys) {
          const current = plots.find((p) => p.id === k);
          if (current && current.status === 'sold' && user.email !== 'kritin.prom@gmail.com') {
            continue;
          }
          try {
            await deleteDoc(doc(db, 'plot_overrides', k));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `plot_overrides/${k}`);
          }
        }
      })();
    }
  };

  const handleToggleBookmark = (id: string) => {
    const alreadyBookmarked = bookmarkedIds.includes(id);
    if (!alreadyBookmarked && bookmarkedIds.length >= 4) {
      playLockedSound();
      return;
    }
    playBookmarkSound(!alreadyBookmarked);
    setBookmarkedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length >= 4
        ? prev
        : [...prev, id];
      broadcastRef.current?.postMessage({ type: 'bookmarks', payload: next });
      return next;
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
    playSelectPlotSound();
    setSelectedPlotId(nextId);
    setFocusRequestTick((t) => t + 1);
  };

  const handleLocatePlot = (id: string) => {
    playSelectPlotSound();
    setSelectedPlotId(id);
    setActiveTab('plan');
    setFocusRequestTick((t) => t + 1);
  };

  const handleSelectModelOnPlan = (model: HouseModelId) => {
    playTabSwitchSound();
    setFilters({ ...INITIAL_FILTERS, model });
    setActiveTab('plan');
  };

  const handleResetFilters = () => {
    playCancelSound();
    setFilters(INITIAL_FILTERS);
  };

  const bookmarkedPlots = useMemo(
    () =>
      bookmarkedIds
        .map((id) => plots.find((p) => p.id === id))
        .filter((p): p is PlotUnit => Boolean(p)),
    [bookmarkedIds, plots]
  );

  const cloudUserLabel = user
    ? user.displayName || user.email?.split('@')[0] || 'บัญชีคลาวด์'
    : null;

  const isVerifiedAdmin = Boolean(
    user && user.email === 'kritin.prom@gmail.com' && user.emailVerified
  );
  const isStaffMode = !forceCustomerView && (staffUnlocked || isVerifiedAdmin);

  if (firestoreFatalError) {
    throw firestoreFatalError;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#14191F] relative">
        <Header
          isStaffMode={isStaffMode}
          onStaffUnlockRequest={() => {
            setUnlockModalMode('staff');
            setIsUnlockModalOpen(true);
          }}
          onExitStaffMode={() => {
            setStaffUnlocked(false);
            setSoldUnlocked(false);
            setForceCustomerView(true);
            setIsManageModalOpen(false);
            setShowWelcome(false);
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          compareCount={bookmarkedIds.length}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          musicEnabled={musicEnabled}
          onToggleMusic={handleToggleMusic}
          soldUnlocked={soldUnlocked}
          onRequestUnlock={() => {
            setUnlockModalMode('sold');
            setIsUnlockModalOpen(true);
          }}
          onRelockSold={() => setSoldUnlocked(false)}
          cloudUserLabel={cloudUserLabel}
          onCloudAuthClick={handleCloudAuthClick}
          onOpenManageModal={() => setIsManageModalOpen(true)}
        />

        {cloudNotice && (
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3 relative z-20">
            <div className="px-4 py-2.5 rounded-2xl border text-xs font-medium bg-[#FBF7EE] border-[#DFC996] text-[#8A6820]">
              {cloudNotice}
            </div>
          </div>
        )}

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 relative z-20">
          {!isStaffMode ? (
            <LoanStatusView
              isStaffMode={false}
              plots={plots}
              loanCases={[]}
              localPublicStatuses={localPublicStatuses}
              onSearchPublicStatuses={searchPublicLoanStatus}
              onSaveCase={handleSaveLoanCase}
              onDeleteCase={handleDeleteLoanCase}
              initialPlotId={null}
            />
          ) : (
            <>
              {/* Luxury Architectural Hero Showcase (Staff Only) */}
              {activeTab === 'plan' && (
            <section className="relative overflow-hidden rounded-3xl text-white border bg-gradient-to-br from-[#14191F] via-[#1C232B] to-[#101419] border-[#2B333D] shadow-[0_18px_48px_rgba(20,25,31,0.22)]">
              <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] items-stretch">
                {/* Left Content */}
                <div className="p-6 sm:p-8 flex flex-col justify-between gap-5 relative z-10">
                  <div>
                    <div className="text-xs font-medium text-[#E5C57B] flex flex-wrap items-center gap-2">
                      <span>Luxury Private Residence</span>
                      <span aria-hidden="true" className="text-white/35">·</span>
                      <span className="text-zinc-300">AP Thailand</span>
                      <span aria-hidden="true" className="text-white/35">·</span>
                      <span className="text-zinc-300">บ้านเดี่ยว 14 โซน (A–N)</span>
                    </div>

                    <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display text-balance leading-tight">
                      CENTRO พระราม 2 - พุทธบูชา 2
                    </h1>

                    <p className="mt-2.5 text-xs sm:text-sm max-w-xl leading-relaxed text-zinc-300">
                      สำรวจผังโครงการ บ้านเลขที่จริง ราคาขายล่าสุด ค่าส่วนกลาง ค่างวดผ่อนชำระ และเช็คสถานะสินเชื่อธนาคารครบทั้ง 143 แปลง (
                      {soldUnlocked
                        ? 'กำลังปลดล็อกแก้ไขแปลงที่ขายแล้ว'
                        : 'แปลงที่ขายแล้วถูกล็อก · ปลดล็อกแก้ไขได้ด้วยรหัสผ่าน'}
                      )
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        if (musicEnabled) startChristmasMusic();
                        setActiveTab('loans');
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-sm"
                    >
                      <Landmark className="w-4 h-4" />
                      เช็คสถานะธนาคาร
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        if (musicEnabled) startChristmasMusic();
                        setActiveTab('models');
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/18 border border-white/20 rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    >
                      <Home className="w-4 h-4 text-[#E5C57B]" />
                      ชมแบบบ้าน 7 สไตล์
                    </button>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playMeowSound();
                        if (musicEnabled) startChristmasMusic();
                        setShowWelcome(true);
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-white bg-white/8 hover:bg-white/16 border border-white/15 rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    >
                      <MiniCatFace className="w-5 h-5" />
                      น้องแมวประจำโครงการ
                    </button>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={handleNextTrack}
                      title={`เปลี่ยนเพลง (${currentTrack.title} · ${currentTrack.thaiMood})`}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#E5C57B] bg-white/8 hover:bg-white/16 border border-[#C59B48]/35 rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    >
                      <SkipForward className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentTrack.title}</span>
                    </button>
                  </div>
                </div>

                {/* Right Real Estate Architectural Facade */}
                <ChristmasHouseScene className="min-h-[220px] sm:min-h-[260px] lg:min-h-full" />
              </div>

              {/* Full-Width 4-Column Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 px-6 sm:px-8 py-4 bg-black/25 border-t border-white/10">
                <div>
                  <div className="text-[11px] text-zinc-400">จำนวนแปลงทั้งหมด</div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold font-mono-tabular text-white">
                    {projectSummary.total} หลัง
                  </div>
                </div>
                <div className="sm:pl-5 sm:border-l sm:border-white/10">
                  <div className="text-[11px] text-zinc-400">สถานะแปลงพร้อมขาย</div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold font-mono-tabular text-[#6EE7B7]">
                    {projectSummary.available} ว่าง
                    {projectSummary.showhouse > 0 && (
                      <span className="text-xs font-medium text-sky-200 ml-1.5">
                        (+ตัวอย่าง {projectSummary.showhouse})
                      </span>
                    )}
                    {projectSummary.notOpen > 0 && (
                      <span className="text-xs font-normal text-zinc-400 ml-1.5">
                        · ยังไม่เปิด {projectSummary.notOpen}
                      </span>
                    )}
                  </div>
                </div>
                <div className="sm:pl-5 sm:border-l sm:border-white/10">
                  <div className="text-[11px] text-zinc-400">ขนาดที่ดิน</div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold font-mono-tabular text-white">
                    {projectSummary.minWah.toFixed(1)}–{projectSummary.maxWah.toFixed(1)} ตร.วา
                  </div>
                </div>
                <div className="sm:pl-5 sm:border-l sm:border-white/10">
                  <div className="text-[11px] text-zinc-400">ช่วงราคาบ้านในโครงการ</div>
                  <div className="mt-0.5 text-base sm:text-lg font-bold font-mono-tabular text-[#E5C57B]">
                    {formatMillion(projectSummary.minPrice)}–{formatMillion(projectSummary.maxPrice)} ลบ.
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Primary Views */}
          {activeTab === 'plan' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] xl:grid-cols-[1fr_395px] gap-5 items-start">
              <MasterPlanViewer
                plots={plots}
                filteredPlotIds={filteredPlotIds}
                selectedPlotId={selectedPlotId}
                onSelectPlot={(id) => {
                  setSelectedPlotId(id);
                  setIsTabletInspectorOpen(true);
                }}
                overlayMode={overlayMode}
                onOverlayModeChange={setOverlayMode}
                filters={filters}
                onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
                onResetFilters={handleResetFilters}
                focusRequestTick={focusRequestTick}
              />

              <div className="lg:sticky lg:top-[84px] lg:max-h-[calc(100dvh-100px)] lg:overflow-y-auto rounded-2xl">
                <UnitInspector
                  plot={selectedPlot}
                  soldUnlocked={soldUnlocked}
                  onRequestUnlock={() => setIsUnlockModalOpen(true)}
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
              soldUnlocked={soldUnlocked}
              onRequestUnlock={() => setIsUnlockModalOpen(true)}
              filters={filters}
              onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              onResetFilters={handleResetFilters}
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
              onClearBookmarks={() => {
                playCancelSound();
                setBookmarkedIds([]);
                broadcastRef.current?.postMessage({ type: 'bookmarks', payload: [] });
              }}
              onLocatePlot={handleLocatePlot}
              onGoToPlan={() => {
                playTabSwitchSound();
                setActiveTab('plan');
              }}
            />
          )}

          {activeTab === 'loans' && (
            <LoanStatusView
              isStaffMode={true}
              plots={plots}
              loanCases={loanCases}
              localPublicStatuses={localPublicStatuses}
              onSearchPublicStatuses={searchPublicLoanStatus}
              onSaveCase={handleSaveLoanCase}
              onDeleteCase={handleDeleteLoanCase}
              initialPlotId={selectedPlotId}
            />
          )}
            </>
          )}
        </main>

        {/* Luxury Architectural Website Footer */}
        <footer className={`text-white mt-10 ${isStaffMode ? 'pb-24 lg:pb-0' : ''} relative z-20 border-t bg-[#101419] border-[#262E38]`}>
          <div className="h-[2px] w-full bg-gradient-to-r from-[#101419] via-[#C59B48] to-[#101419]" />
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-9">
            <div className={`grid grid-cols-1 ${isStaffMode ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-7 pb-7 border-b border-white/10`}>
              <div>
                <div className="flex items-center gap-2 font-display font-bold text-white text-base">
                  <span className="text-[#E5C57B] tracking-wider">GAVINTIN</span>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span>CENTRO พระราม 2 - พุทธบูชา 2</span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed max-w-sm text-zinc-400">
                  {isStaffMode
                    ? 'เว็บแพลตฟอร์มข้อมูลผังโครงการ บ้านเลขที่ ราคาขายล่าสุด ค่าส่วนกลาง คำนวณสินเชื่อ และติดตามสถานะธนาคารสำหรับลูกค้า ออกแบบเพื่อการใช้งานทั้งบนคอมพิวเตอร์และ iPad แบบเรียลไทม์'
                    : 'ระบบตรวจสอบและติดตามความคืบหน้าการยื่นกู้สินเชื่อธนาคารสำหรับลูกค้าโครงการ CENTRO พระราม 2 - พุทธบูชา 2'}
                </p>
              </div>

              {isStaffMode && (
                <div>
                  <div className="text-xs font-semibold text-[#E5C57B] mb-3">เมนูนำทางเว็บไซต์</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        setActiveTab('plan');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left py-1 hover:text-white cursor-pointer transition-colors"
                    >
                      ผังโครงการ (Master Plan)
                    </button>
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        setActiveTab('directory');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left py-1 hover:text-white cursor-pointer transition-colors"
                    >
                      ตารางบ้านเลขที่และราคา
                    </button>
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        setActiveTab('models');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left py-1 hover:text-white cursor-pointer transition-colors"
                    >
                      แบบบ้าน 7 สไตล์
                    </button>
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        setActiveTab('compare');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left py-1 hover:text-white cursor-pointer transition-colors"
                    >
                      เปรียบเทียบแปลง ({bookmarkedIds.length}/4)
                    </button>
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
                        setActiveTab('loans');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left py-1 text-[#E5C57B] hover:text-white cursor-pointer transition-colors col-span-2"
                    >
                      จัดการสินเชื่อลูกค้า (Customer & Banks)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-[#E5C57B] mb-3">เสียงบรรยากาศ & การตั้งค่า</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={handleToggleMusic}
                    className={`min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                      musicEnabled
                        ? 'bg-white/15 border-[#E5C57B]/50 text-white hover:bg-white/25'
                        : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/12'
                    }`}
                  >
                    <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-[#E5C57B]' : ''}`} />
                    {musicEnabled ? 'เพลงบรรเลง: เปิดอยู่' : 'เปิดเพลงบรรเลงเบาๆ'}
                  </button>

                  <button
                    type="button"
                    data-sound="custom"
                    onClick={handleNextTrack}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#E5C57B] bg-white/10 hover:bg-white/20 border border-[#C59B48]/30 rounded-xl cursor-pointer transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    เปลี่ยนเพลง ({currentTrack.title})
                  </button>

                  {isStaffMode && (
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playMeowSound();
                        setShowWelcome(true);
                      }}
                      className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/18 rounded-xl cursor-pointer transition-colors"
                    >
                      ดูน้องแมวประจำโครงการ
                    </button>
                  )}
                </div>

                <p className="mt-2.5 text-[11px] text-zinc-400">
                  กำลังเล่น: {currentTrack.title} · {currentTrack.thaiMood} ({LUXURY_AMBIENT_PLAYLIST.length} บทเพลง)
                </p>
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-400">
              <span>
                © 2026 CENTRO พระราม 2 - พุทธบูชา 2 · Luxury Private Residence
              </span>
              {isStaffMode ? (
                <span>
                  {soldUnlocked
                    ? 'สถานะ: กำลังปลดล็อกแก้ไขแปลงที่ขายแล้ว'
                    : 'สถานะ: แปลงที่ขายแล้วถูกล็อก (ปลดล็อกด้วยรหัสผ่านได้)'}
                </span>
              ) : (
                <span>ระบบตรวจสอบสถานะสินเชื่อลูกค้า · ปกป้องข้อมูลส่วนตัว</span>
              )}
            </div>
          </div>
        </footer>

        {/* iPad Portrait / Mobile Floating Quick-Inspect Bar (< 1024px) — Staff Only */}
        {isStaffMode && activeTab === 'plan' && selectedPlot && !isTabletInspectorOpen && (
          <div className="lg:hidden fixed bottom-[calc(68px+env(safe-area-inset-bottom))] left-4 right-4 z-20 pointer-events-none flex justify-center">
            <div className="pointer-events-auto w-full max-w-xl text-white backdrop-blur-xl border rounded-2xl px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] flex items-center justify-between gap-3 bg-[#14191F]/95 border-[#2B333D]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="font-mono-tabular font-bold text-white">
                    แปลง {selectedPlot.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{selectedPlot.houseNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#E5C57B]">
                    {STATUS_SHORT_LABELS[selectedPlot.status]}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#E5C57B] font-mono-tabular truncate">
                  {formatMillion(selectedPlot.price)} ล้านบาท · {selectedPlot.model} ({selectedPlot.landSqWah.toFixed(1)} ตร.วา)
                </div>
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={() => {
                  playClickSound();
                  setIsTabletInspectorOpen(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] active:scale-[0.98] rounded-xl whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <ChevronUp className="w-4 h-4" />
                ดูรายละเอียด
              </button>
            </div>
          </div>
        )}

        {/* iPad Slide-Over / Mobile Sheet Inspector Drawer (< 1024px) — Staff Only */}
        {isStaffMode && activeTab === 'plan' && isTabletInspectorOpen && selectedPlot && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-[#101419]/60 backdrop-blur-xs flex items-end md:items-stretch md:justify-end"
            onClick={() => {
              playCancelSound();
              setIsTabletInspectorOpen(false);
            }}
          >
            <div
              className="w-full md:w-[440px] max-h-[86dvh] md:max-h-full bg-[#F7F5F0] rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl border-t md:border-l border-[#E5DEC9] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-[#EAE4D7] bg-[#FFFEFC] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="md:hidden w-8 h-1 rounded-full bg-stone-300 mr-1" />
                  <span className="text-sm font-bold text-[#14191F] font-display">
                    ข้อมูลแปลง {selectedPlot.id} ({selectedPlot.houseNumber})
                  </span>
                </div>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playCancelSound();
                    setIsTabletInspectorOpen(false);
                  }}
                  aria-label="ปิดแผงข้อมูลแปลง"
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <UnitInspector
                  plot={selectedPlot}
                  soldUnlocked={soldUnlocked}
                  onRequestUnlock={() => {
                    setUnlockModalMode('sold');
                    setIsUnlockModalOpen(true);
                  }}
                  onUpdatePlot={handleUpdatePlot}
                  onFocusOnPlan={() => {
                    setIsTabletInspectorOpen(false);
                    setFocusRequestTick((t) => t + 1);
                  }}
                  onNavigatePlot={handleNavigatePlot}
                  isBookmarked={bookmarkedIds.includes(selectedPlot.id)}
                  onToggleBookmark={handleToggleBookmark}
                  canBookmarkMore={bookmarkedIds.length < 4}
                />
              </div>
            </div>
          </div>
        )}

        {isStaffMode && (
          <>
            <WelcomeOverlay
              isOpen={showWelcome}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              musicEnabled={musicEnabled}
              onToggleMusic={handleToggleMusic}
              onNextTrack={handleNextTrack}
              onEnter={(tab) => {
                if (musicEnabled) startChristmasMusic();
                setActiveTab(tab);
                setShowWelcome(false);
              }}
            />

            <DataManageModal
              isOpen={isManageModalOpen}
              onClose={() => {
                playCancelSound();
                setIsManageModalOpen(false);
              }}
              plots={plots}
              soldUnlocked={soldUnlocked}
              onRequestUnlock={() => {
                setUnlockModalMode('sold');
                setIsUnlockModalOpen(true);
              }}
              onBulkMerge={handleBulkMerge}
              onResetAll={handleResetAll}
            />
          </>
        )}

        <UnlockModal
          isOpen={isUnlockModalOpen}
          mode={unlockModalMode}
          onClose={() => setIsUnlockModalOpen(false)}
          onGoogleSignIn={
            unlockModalMode === 'staff' ? () => void handleCloudAuthClick() : undefined
          }
          onUnlockSuccess={() => {
            if (unlockModalMode === 'staff') {
              setForceCustomerView(false);
              setStaffUnlocked(true);
            } else {
              setSoldUnlocked(true);
            }
          }}
        />
      </div>
    </MotionConfig>
  );
}
