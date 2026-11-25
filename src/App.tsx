import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronUp,
  Cloud,
  CloudOff,
  Home,
  Landmark,
  Music,
  RefreshCw,
  X,
} from 'lucide-react';
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
  WriteBatch,
} from 'firebase/firestore';
import { ChristmasHouseScene } from './components/ChristmasHouseScene';
import { CompareView } from './components/CompareView';
import { MiniCatFace } from './components/CuteWalkingCats';
import { DataManageModal } from './components/DataManageModal';
import { Header } from './components/Header';
import { HouseModelsView } from './components/HouseModelsView';
import { LoanStatusView } from './components/LoanStatusView';
import { MasterPlanViewer } from './components/MasterPlanViewer';
import { MusicJukeboxModal } from './components/MusicJukeboxModal';
import { UnitDirectoryTable } from './components/UnitDirectoryTable';
import { UnitInspector } from './components/UnitInspector';
import { UnlockModal } from './components/UnlockModal';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { DEFAULT_PLOTS } from './data/masterPlanPlots';
import { VocalTrack } from './data/vocalPlaylist';
import {
  auth,
  buildLoanCaseCreatePayload,
  buildLoanCaseUpdatePayload,
  buildLoanPublicStatusCreatePayload,
  buildLoanPublicStatusUpdatePayload,
  buildPlotOverridePayload,
  buildUserWorkspacePayload,
  checkIsAdminRecord,
  db,
  fetchExistingPublicStatusesForSync,
  handleFirestoreError,
  OperationType,
  sanitizeHouseNumber,
  sanitizeLoanCase,
  sanitizePrice,
  searchPublicLoanStatus,
  signInWithGoogle,
  signOutUser,
  subscribePublicLoanSearch,
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
const STORAGE_KEY_DIRTY_PLOTS = 'centro_rama2_dirty_plots_v1';
const STORAGE_KEY_DIRTY_LOANS = 'centro_rama2_dirty_loans_v1';
const SESSION_KEY_SOLD_UNLOCKED = 'centro_rama2_sold_unlocked_v1';
const SESSION_KEY_STAFF_UNLOCKED = 'centro_rama2_staff_unlocked_v1';
const BROADCAST_CHANNEL_NAME = 'centro_rama2_realtime_sync_v1';

function loadStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string');
      }
    }
  } catch {
    // ignore
  }
  return [];
}

async function runChunkedBatch(
  ops: Array<(batch: WriteBatch) => void>,
  chunkSize = 350
): Promise<void> {
  for (let i = 0; i < ops.length; i += chunkSize) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + chunkSize);
    for (const op of slice) {
      op(batch);
    }
    await batch.commit();
  }
}

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
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...INITIAL_FILTERS, ...(parsed as Partial<PlotFilterState>) };
      }
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
    if (val && typeof val === 'string') return val;
  } catch {
    // ignore
  }
  return 'A01';
}

function loadSavedOverrides(): Record<string, Partial<PlotUnit>> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const clean: Record<string, Partial<PlotUnit>> = {};
        for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
          if (/^[A-N]\d{2}$/.test(key) && val && typeof val === 'object' && !Array.isArray(val)) {
            clean[key] = val as Partial<PlotUnit>;
          }
        }
        return clean;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

function loadSavedBookmarks(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string' && /^[A-N]\d{2}$/.test(v)).slice(0, 4);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function loadSavedLoanCases(): LoanCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOAN_CASES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => Boolean(item && typeof item === 'object'))
          .map((item) => sanitizeLoanCase(item));
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
  const [isMusicHubOpen, setIsMusicHubOpen] = useState<boolean>(false);
  const [activeVocalTrack, setActiveVocalTrack] = useState<VocalTrack | null>(null);
  const [isVocalPlaying, setIsVocalPlaying] = useState<boolean>(false);
  const [cloudSyncAlert, setCloudSyncAlert] = useState<{
    message: string;
    isPermission: boolean;
  } | null>(null);
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
  const [isAdminDocMember, setIsAdminDocMember] = useState<boolean>(false);
  const [adminCheckedUid, setAdminCheckedUid] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudNotice, setCloudNotice] = useState<{
    msg: string;
    tone: 'success' | 'warning';
  } | null>(null);

  const [overrides, setOverrides] = useState<Record<string, Partial<PlotUnit>>>(loadSavedOverrides);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(loadSavedBookmarks);

  const [loanCases, setLoanCases] = useState<LoanCase[]>(loadSavedLoanCases);
  const [localPublicStatuses, setLocalPublicStatuses] = useState<LoanPublicStatus[]>([]);
  const [dirtyPlotIds, setDirtyPlotIds] = useState<string[]>(() =>
    loadStringArray(STORAGE_KEY_DIRTY_PLOTS)
  );
  const [dirtyLoanCaseIds, setDirtyLoanCaseIds] = useState<string[]>(() =>
    loadStringArray(STORAGE_KEY_DIRTY_LOANS)
  );

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteWorkspaceRef = useRef(false);
  const workspaceSnapshotLoadedRef = useRef(false);
  const hasHydratedWorkspaceRef = useRef(false);
  const lastWorkspaceSigRef = useRef<string>('');
  const hasHydratedCloudOverridesRef = useRef(false);
  const hasHydratedCloudLoansRef = useRef(false);
  const cloudLoanCaseIdsRef = useRef<Set<string>>(new Set());

  const showTimedNotice = useCallback(
    (msg: string, tone: 'success' | 'warning' = 'success') => {
      setCloudNotice({ msg, tone });
      window.setTimeout(() => {
        setCloudNotice((curr) => (curr?.msg === msg ? null : curr));
      }, 4200);
    },
    []
  );

  const reportCloudSyncError = useCallback(
    (error: unknown, operationType: OperationType, path: string | null) => {
      let wrappedMessage = error instanceof Error ? error.message : String(error);
      try {
        handleFirestoreError(error, operationType, path);
      } catch (wrapped) {
        wrappedMessage = wrapped instanceof Error ? wrapped.message : wrappedMessage;
      }
      const isPermission =
        wrappedMessage.includes('Missing or insufficient permissions') ||
        wrappedMessage.includes('permission-denied');
      setCloudSyncAlert({
        isPermission,
        message: isPermission
          ? 'บัญชี Google นี้ยังไม่มีสิทธิ์เขียนทับบางรายการที่ถูกล็อก ข้อมูลในเครื่องยังปลอดภัยและใช้งานต่อได้ปกติ'
          : 'การซิงค์ฐานข้อมูลกลางขัดข้องชั่วคราว ข้อมูลถูกเก็บสำรองในเครื่องเรียบร้อยแล้ว',
      });
    },
    []
  );

  // Auth listener & /admins/{uid} check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setCloudSyncAlert(null);
      hasHydratedCloudOverridesRef.current = false;
      hasHydratedCloudLoansRef.current = false;
      workspaceSnapshotLoadedRef.current = false;
      hasHydratedWorkspaceRef.current = false;
      lastWorkspaceSigRef.current = '';
      cloudLoanCaseIdsRef.current.clear();

      if (!currentUser || !currentUser.emailVerified) {
        setIsAdminDocMember(false);
        setAdminCheckedUid(null);
        return;
      }

      void checkIsAdminRecord(currentUser.uid)
        .then((isMember) => {
          setIsAdminDocMember(isMember);
          setAdminCheckedUid(currentUser.uid);
        })
        .catch((err) => {
          setIsAdminDocMember(false);
          setAdminCheckedUid(currentUser.uid);
          reportCloudSyncError(err, OperationType.GET, `admins/${currentUser.uid}`);
        });
    });
    return () => unsub();
  }, [reportCloudSyncError]);

  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  const loanCasesRef = useRef(loanCases);
  useEffect(() => {
    loanCasesRef.current = loanCases;
  }, [loanCases]);

  const dirtyPlotIdsRef = useRef(dirtyPlotIds);
  useEffect(() => {
    dirtyPlotIdsRef.current = dirtyPlotIds;
    try {
      localStorage.setItem(STORAGE_KEY_DIRTY_PLOTS, JSON.stringify(dirtyPlotIds));
    } catch {
      // ignore
    }
  }, [dirtyPlotIds]);

  const dirtyLoanCaseIdsRef = useRef(dirtyLoanCaseIds);
  useEffect(() => {
    dirtyLoanCaseIdsRef.current = dirtyLoanCaseIds;
    try {
      localStorage.setItem(STORAGE_KEY_DIRTY_LOANS, JSON.stringify(dirtyLoanCaseIds));
    } catch {
      // ignore
    }
  }, [dirtyLoanCaseIds]);

  const isCloudConnected = Boolean(user && user.emailVerified);
  const isVerifiedAdmin = Boolean(
    user && user.emailVerified && (user.email === 'kritin.prom@gmail.com' || isAdminDocMember)
  );

  // Real-time Firestore listener for shared plot overrides & user workspace
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || adminCheckedUid !== user.uid) return;

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

        // On first hydration after sign-in, push any local/dirty edits to cloud
        if (!hasHydratedCloudOverridesRef.current) {
          hasHydratedCloudOverridesRef.current = true;
          const localCurrent = overridesRef.current;
          const dirtySet = new Set(dirtyPlotIdsRef.current);
          const unsyncedKeys = Object.keys(localCurrent).filter(
            (k) => dirtySet.has(k) || !cloudOverrides[k]
          );

          if (unsyncedKeys.length > 0) {
            const merged = { ...cloudOverrides };
            const batchOps: Array<(batch: WriteBatch) => void> = [];
            const pushedKeys: string[] = [];

            for (const k of unsyncedKeys) {
              const basePlot = DEFAULT_PLOTS.find((p) => p.id === k);
              if (!basePlot) continue;
              const cloudStatus = cloudOverrides[k]?.status ?? basePlot.status;
              if (
                cloudStatus === 'sold' &&
                user.email !== 'kritin.prom@gmail.com' &&
                !isAdminDocMember
              ) {
                continue;
              }
              const mergedPlot: PlotUnit = { ...basePlot, ...localCurrent[k] };
              merged[k] = localCurrent[k];
              batchOps.push((batch) => {
                batch.set(
                  doc(db, 'plot_overrides', k),
                  buildPlotOverridePayload(mergedPlot, user.uid)
                );
              });
              pushedKeys.push(k);
            }

            if (batchOps.length > 0) {
              setOverrides(merged);
              try {
                localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(merged));
              } catch {
                // ignore
              }
              void runChunkedBatch(batchOps)
                .then(() => {
                  setDirtyPlotIds((prev) => prev.filter((id) => !pushedKeys.includes(id)));
                  showTimedNotice(
                    `ซิงค์ข้อมูลแปลงที่แก้ไขไว้ (${pushedKeys.length} แปลง) ขึ้นฐานข้อมูลกลางเรียบร้อย`
                  );
                })
                .catch((err) => {
                  reportCloudSyncError(err, OperationType.WRITE, plotOverridesPath);
                });
              return;
            }
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
        reportCloudSyncError(error, OperationType.LIST, plotOverridesPath);
      }
    );

    const workspacePath = `users/${user.uid}/preferences/workspace`;
    const unsubWorkspace = onSnapshot(
      doc(db, 'users', user.uid, 'preferences', 'workspace'),
      (docSnap) => {
        // Skip local latency-compensation echoes to avoid feedback/tab bounce loops
        if (docSnap.metadata.hasPendingWrites) return;
        workspaceSnapshotLoadedRef.current = true;
        if (!docSnap.exists()) {
          hasHydratedWorkspaceRef.current = true;
          return;
        }
        const data = docSnap.data();
        const remoteBookmarks = Array.isArray(data.bookmarkedIds)
          ? data.bookmarkedIds.filter((id): id is string => typeof id === 'string').slice(0, 4)
          : null;
        const remoteSound = typeof data.soundEnabled === 'boolean' ? data.soundEnabled : null;

        isApplyingRemoteWorkspaceRef.current = true;
        if (remoteBookmarks) {
          setBookmarkedIds(remoteBookmarks);
        }
        if (remoteSound !== null) {
          persistSoundEnabled(remoteSound);
          setSoundEnabledState(remoteSound);
        }

        // Only hydrate overlayMode on initial sign-in; never hijack activeTab or selectedPlotId mid-session
        if (!hasHydratedWorkspaceRef.current) {
          hasHydratedWorkspaceRef.current = true;
          if (
            data.overlayMode === 'plot' ||
            data.overlayMode === 'houseNumber' ||
            data.overlayMode === 'price' ||
            data.overlayMode === 'status'
          ) {
            setOverlayMode(data.overlayMode);
          }
        }

        lastWorkspaceSigRef.current = JSON.stringify({
          bookmarkedIds: remoteBookmarks ?? bookmarkedIdsRef.current,
          soundEnabled: remoteSound ?? soundEnabledRef.current,
          overlayMode: overlayModeRef.current,
          activeTab: activeTabRef.current,
          selectedPlotId: selectedPlotIdRef.current,
        });

        window.requestAnimationFrame(() => {
          isApplyingRemoteWorkspaceRef.current = false;
        });
      },
      (error) => {
        workspaceSnapshotLoadedRef.current = true;
        reportCloudSyncError(error, OperationType.GET, workspacePath);
      }
    );

    return () => {
      unsubPlots();
      unsubWorkspace();
    };
  }, [authReady, user, adminCheckedUid, isAdminDocMember, showTimedNotice, reportCloudSyncError]);

  // Real-time Firestore listener for loan_cases + automatic backfill of loan_public_status
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || adminCheckedUid !== user.uid) return;

    const loanCasesPath = 'loan_cases';
    const isAdminUser = user.email === 'kritin.prom@gmail.com' || isAdminDocMember;
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
          const dirtySet = new Set(dirtyLoanCaseIdsRef.current);
          const unsyncedLocal = localCases.filter(
            (lc) => !cloudIds.has(lc.caseId) || dirtySet.has(lc.caseId)
          );
          const unsyncedIds = new Set(unsyncedLocal.map((lc) => lc.caseId));
          const mergedCases = [
            ...unsyncedLocal,
            ...cloudCases.filter((cc) => !unsyncedIds.has(cc.caseId)),
          ];

          if (unsyncedLocal.length > 0) {
            setLoanCases(mergedCases);
            try {
              localStorage.setItem(STORAGE_KEY_LOAN_CASES, JSON.stringify(mergedCases));
            } catch {
              // ignore
            }
          }

          void (async () => {
            const existingPublicMap = await fetchExistingPublicStatusesForSync(
              user.uid,
              isAdminUser
            );
            const batchOps: Array<(batch: WriteBatch) => void> = [];
            const pushedCaseIds: string[] = [];

            const resolveMergedPlot = (plotId: string) => {
              const basePlot = DEFAULT_PLOTS.find((p) => p.id === plotId);
              return basePlot
                ? { ...basePlot, ...(overridesRef.current[basePlot.id] ?? {}) }
                : undefined;
            };

            // 1) Push local-only or dirty loan cases to both loan_cases & loan_public_status
            for (const lc of unsyncedLocal) {
              const mergedPlot = resolveMergedPlot(lc.plotId);
              const privateRef = doc(db, loanCasesPath, lc.caseId);
              const publicRef = doc(db, 'loan_public_status', lc.caseId);

              if (cloudIds.has(lc.caseId)) {
                batchOps.push((batch) => batch.update(privateRef, buildLoanCaseUpdatePayload(lc)));
              } else {
                batchOps.push((batch) =>
                  batch.set(privateRef, buildLoanCaseCreatePayload(lc, user.uid))
                );
                cloudLoanCaseIdsRef.current.add(lc.caseId);
              }

              if (existingPublicMap.has(lc.caseId)) {
                const updatePub = await buildLoanPublicStatusUpdatePayload(lc, mergedPlot);
                batchOps.push((batch) => batch.update(publicRef, updatePub));
              } else {
                const createPub = await buildLoanPublicStatusCreatePayload(
                  lc,
                  mergedPlot,
                  user.uid
                );
                batchOps.push((batch) => batch.set(publicRef, createPub));
              }
              pushedCaseIds.push(lc.caseId);
            }

            // 2) Backfill any cloud loan_cases missing or stale in loan_public_status so customers see ALL cases
            let backfilledCount = 0;
            for (const cc of cloudCases) {
              if (unsyncedIds.has(cc.caseId)) continue;
              const mergedPlot = resolveMergedPlot(cc.plotId);
              const existingPub = existingPublicMap.get(cc.caseId);
              const expectedPub = await toPublicLoanStatusRecord(cc, mergedPlot);
              const publicRef = doc(db, 'loan_public_status', cc.caseId);

              if (!existingPub) {
                const createPub = await buildLoanPublicStatusCreatePayload(
                  cc,
                  mergedPlot,
                  cc.ownerId || user.uid
                );
                batchOps.push((batch) => batch.set(publicRef, createPub));
                backfilledCount += 1;
              } else if (
                existingPub.plotId !== expectedPub.plotId ||
                existingPub.houseNumber !== expectedPub.houseNumber ||
                existingPub.modelName !== expectedPub.modelName ||
                existingPub.overallStatus !== expectedPub.overallStatus ||
                existingPub.maskedName !== expectedPub.maskedName ||
                existingPub.idCardHash !== expectedPub.idCardHash ||
                existingPub.phoneHash !== expectedPub.phoneHash ||
                existingPub.banks.length !== expectedPub.banks.length
              ) {
                const updatePub = await buildLoanPublicStatusUpdatePayload(cc, mergedPlot);
                batchOps.push((batch) => batch.update(publicRef, updatePub));
                backfilledCount += 1;
              }
            }

            if (batchOps.length > 0) {
              await runChunkedBatch(batchOps);
              if (pushedCaseIds.length > 0) {
                setDirtyLoanCaseIds((prev) =>
                  prev.filter((id) => !pushedCaseIds.includes(id))
                );
              }
              if (pushedCaseIds.length > 0 || backfilledCount > 0) {
                showTimedNotice(
                  `ซิงค์ข้อมูลสินเชื่อลูกค้าขึ้นฐานข้อมูลกลางแล้ว (${pushedCaseIds.length + backfilledCount} รายการ)`
                );
              }
            }
          })().catch((err) => {
            reportCloudSyncError(err, OperationType.WRITE, loanCasesPath);
          });

          if (unsyncedLocal.length > 0) {
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
        reportCloudSyncError(error, OperationType.LIST, loanCasesPath);
      }
    );

    return () => {
      unsubLoans();
    };
  }, [authReady, user, adminCheckedUid, isAdminDocMember, showTimedNotice, reportCloudSyncError]);

  // Real-time cross-tab sync via BroadcastChannel & storage events
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastRef.current = ch;
      ch.onmessage = (event) => {
        const msg = event.data as { type?: string; payload?: unknown } | undefined;
        if (!msg || !msg.type) return;
        if (msg.type === 'overrides' && msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload)) {
          setOverrides(msg.payload as Record<string, Partial<PlotUnit>>);
        } else if (msg.type === 'bookmarks' && Array.isArray(msg.payload)) {
          setBookmarkedIds(msg.payload.filter((v): v is string => typeof v === 'string').slice(0, 4));
        } else if (msg.type === 'loan_cases' && Array.isArray(msg.payload)) {
          setLoanCases(
            msg.payload
              .filter((item) => Boolean(item && typeof item === 'object'))
              .map((item) => sanitizeLoanCase(item))
          );
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_OVERRIDES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setOverrides(parsed as Record<string, Partial<PlotUnit>>);
          }
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_BOOKMARKS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setBookmarkedIds(parsed.filter((v): v is string => typeof v === 'string').slice(0, 4));
          }
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_LOAN_CASES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setLoanCases(
              parsed
                .filter((item) => Boolean(item && typeof item === 'object'))
                .map((item) => sanitizeLoanCase(item))
            );
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

  // Keep refs of workspace fields so unsubWorkspace reads fresh values safely without re-subscribing
  const bookmarkedIdsRef = useRef(bookmarkedIds);
  const soundEnabledRef = useRef(soundEnabled);
  const overlayModeRef = useRef(overlayMode);
  const activeTabRef = useRef(activeTab);
  const selectedPlotIdRef = useRef(selectedPlotId);
  useEffect(() => {
    bookmarkedIdsRef.current = bookmarkedIds;
  }, [bookmarkedIds]);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    overlayModeRef.current = overlayMode;
  }, [overlayMode]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    selectedPlotIdRef.current = selectedPlotId;
  }, [selectedPlotId]);

  // Real-time workspace cloud sync whenever workspace state changes (if signed in)
  useEffect(() => {
    if (
      !authReady ||
      !user ||
      !user.emailVerified ||
      adminCheckedUid !== user.uid ||
      !workspaceSnapshotLoadedRef.current ||
      isApplyingRemoteWorkspaceRef.current
    ) {
      return;
    }
    const sig = JSON.stringify({
      bookmarkedIds,
      soundEnabled,
      overlayMode,
      activeTab,
      selectedPlotId,
    });
    if (sig === lastWorkspaceSigRef.current) {
      return;
    }
    lastWorkspaceSigRef.current = sig;

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
        reportCloudSyncError(error, OperationType.WRITE, workspacePath);
      }
    };
    void syncWorkspace();
  }, [
    authReady,
    user,
    adminCheckedUid,
    bookmarkedIds,
    soundEnabled,
    overlayMode,
    activeTab,
    selectedPlotId,
    reportCloudSyncError,
  ]);

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

  const handleToggleSound = () => {
    const next = !soundEnabled;
    persistSoundEnabled(next);
    setSoundEnabledState(next);
    if (next) {
      playToggleSound();
    }
  };

  const handleVocalActiveChange = useCallback(
    (track: VocalTrack | null, playing: boolean) => {
      setActiveVocalTrack(track);
      setIsVocalPlaying(playing);
    },
    []
  );

  const handleCloudAuthClick = async () => {
    if (user) {
      await signOutUser();
      showTimedNotice(
        'ออกจากระบบฐานข้อมูลกลางแล้ว (การแก้ไขต่อจากนี้จะเก็บเฉพาะในเครื่องนี้)',
        'warning'
      );
      return;
    }
    try {
      await signInWithGoogle();
      setForceCustomerView(false);
      playSuccessSound();
      showTimedNotice(
        'เชื่อมต่อฐานข้อมูลกลางสำเร็จ · ข้อมูลอัปเดตและบันทึกให้ทุกเครื่องเห็นตรงกันแบบเรียลไทม์แล้ว'
      );
    } catch {
      showTimedNotice('ยกเลิกการเชื่อมต่อ Google', 'warning');
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

  const handleSyncAllLocalToCloud = async () => {
    if (!user || !user.emailVerified) {
      await handleCloudAuthClick();
      return;
    }
    if (isSyncingCloud) return;

    setIsSyncingCloud(true);
    try {
      const batchOps: Array<(batch: WriteBatch) => void> = [];
      const overrideKeys = Object.keys(overridesRef.current);

      for (const k of overrideKeys) {
        const basePlot = DEFAULT_PLOTS.find((p) => p.id === k);
        if (!basePlot) continue;
        const mergedPlot: PlotUnit = { ...basePlot, ...overridesRef.current[k] };
        if (basePlot.status === 'sold' && !isVerifiedAdmin) {
          continue;
        }
        batchOps.push((batch) =>
          batch.set(doc(db, 'plot_overrides', k), buildPlotOverridePayload(mergedPlot, user.uid))
        );
      }

      const existingPublicMap = await fetchExistingPublicStatusesForSync(
        user.uid,
        isVerifiedAdmin
      );

      for (const lc of loanCasesRef.current) {
        const basePlot = DEFAULT_PLOTS.find((p) => p.id === lc.plotId);
        const mergedPlot = basePlot
          ? { ...basePlot, ...(overridesRef.current[basePlot.id] ?? {}) }
          : undefined;
        const privateRef = doc(db, 'loan_cases', lc.caseId);
        const publicRef = doc(db, 'loan_public_status', lc.caseId);

        let privateExists = cloudLoanCaseIdsRef.current.has(lc.caseId);
        if (!privateExists) {
          const snap = await getDoc(privateRef);
          privateExists = snap.exists();
          if (privateExists) cloudLoanCaseIdsRef.current.add(lc.caseId);
        }

        if (privateExists) {
          batchOps.push((batch) => batch.update(privateRef, buildLoanCaseUpdatePayload(lc)));
        } else {
          batchOps.push((batch) =>
            batch.set(privateRef, buildLoanCaseCreatePayload(lc, user.uid))
          );
          cloudLoanCaseIdsRef.current.add(lc.caseId);
        }

        if (existingPublicMap.has(lc.caseId)) {
          const updatePub = await buildLoanPublicStatusUpdatePayload(lc, mergedPlot);
          batchOps.push((batch) => batch.update(publicRef, updatePub));
        } else {
          const createPub = await buildLoanPublicStatusCreatePayload(lc, mergedPlot, user.uid);
          batchOps.push((batch) => batch.set(publicRef, createPub));
        }
      }

      if (batchOps.length > 0) {
        await runChunkedBatch(batchOps);
      }

      setDirtyPlotIds([]);
      setDirtyLoanCaseIds([]);
      setCloudSyncAlert(null);
      playSuccessSound();
      showTimedNotice(
        `ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูลกลางสำเร็จ (${overrideKeys.length} แปลง · ${loanCasesRef.current.length} ลูกค้า) ทุกเครื่องเห็นตรงกันแล้ว`
      );
    } catch (error) {
      reportCloudSyncError(error, OperationType.WRITE, 'sync_all');
    } finally {
      setIsSyncingCloud(false);
    }
  };

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
        setDirtyPlotIds((prev) => prev.filter((item) => item !== id));
        showTimedNotice(`บันทึกแปลง ${id} ลงฐานข้อมูลกลางแล้ว · ทุกเครื่องเห็นตรงกัน`);
      } catch (error) {
        setDirtyPlotIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        reportCloudSyncError(error, OperationType.WRITE, path);
      }
    } else {
      setDirtyPlotIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      showTimedNotice(
        `บันทึกแปลง ${id} ไว้ในเครื่องนี้เท่านั้น · กรุณากด "เชื่อมต่อ Google" เพื่อบันทึกลงฐานข้อมูลกลาง`,
        'warning'
      );
    }
  };

  const handleSaveLoanCase = async (loanCase: LoanCase) => {
    const sanitized = sanitizeLoanCase({
      ...loanCase,
      ownerId: loanCase.ownerId || user?.uid,
      updatedAtMs: Date.now(),
    });

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

        let existingPrivateData: Record<string, unknown> | undefined;
        const existingPrivateSnap = await getDoc(privateRef);
        const privateExists = existingPrivateSnap.exists();
        if (privateExists) {
          cloudLoanCaseIdsRef.current.add(sanitized.caseId);
          existingPrivateData = existingPrivateSnap.data() as Record<string, unknown>;
        }

        if (!privateExists) {
          batch.set(privateRef, buildLoanCaseCreatePayload(sanitized, user.uid));
          cloudLoanCaseIdsRef.current.add(sanitized.caseId);
        } else {
          batch.update(
            privateRef,
            buildLoanCaseUpdatePayload(sanitized, existingPrivateData, user.uid)
          );
        }

        const existingPublic = await getDoc(publicRef);
        if (existingPublic.exists()) {
          batch.update(
            publicRef,
            await buildLoanPublicStatusUpdatePayload(
              sanitized,
              targetPlot,
              existingPublic.data() as Record<string, unknown>,
              user.uid
            )
          );
        } else {
          batch.set(
            publicRef,
            await buildLoanPublicStatusCreatePayload(sanitized, targetPlot, user.uid)
          );
        }

        await batch.commit();
        setDirtyLoanCaseIds((prev) => prev.filter((id) => id !== sanitized.caseId));
        setCloudSyncAlert(null);
        showTimedNotice(
          `บันทึกข้อมูลลูกค้าแปลง ${sanitized.plotId} ลงฐานข้อมูลกลางแล้ว · ลูกค้าและทุกเครื่องมองเห็นตรงกัน`
        );
      } catch (error) {
        setDirtyLoanCaseIds((prev) =>
          prev.includes(sanitized.caseId) ? prev : [...prev, sanitized.caseId]
        );
        reportCloudSyncError(error, OperationType.WRITE, path);
        showTimedNotice(
          'บันทึกข้อมูลไว้ในเครื่องเรียบร้อย (รอซิงค์ขึ้นฐานข้อมูลกลางอีกครั้ง)',
          'warning'
        );
      }
    } else {
      playSuccessSound();
      setDirtyLoanCaseIds((prev) =>
        prev.includes(sanitized.caseId) ? prev : [...prev, sanitized.caseId]
      );
      showTimedNotice(
        'บันทึกไว้เฉพาะในเครื่องนี้ชั่วคราว · กรุณากด "เชื่อมต่อ Google" เพื่อให้ลูกค้าค้นหาจากเครื่องอื่นได้',
        'warning'
      );
    }
  };

  const handleImportLoanCases = async (importedList: LoanCase[]): Promise<number> => {
    const cleanList = importedList.map((item) =>
      sanitizeLoanCase({
        ...item,
        ownerId: item.ownerId || user?.uid,
        updatedAtMs: item.updatedAtMs || Date.now(),
      })
    );
    if (cleanList.length === 0) return 0;

    setLoanCases((prev) => {
      const mergedMap = new Map(prev.map((c) => [c.caseId, c]));
      for (const item of cleanList) {
        mergedMap.set(item.caseId, item);
      }
      const next = Array.from(mergedMap.values());
      broadcastRef.current?.postMessage({ type: 'loan_cases', payload: next });
      return next;
    });

    if (user && user.emailVerified) {
      try {
        const batchOps: Array<(batch: WriteBatch) => void> = [];
        for (const lc of cleanList) {
          const targetPlot = plots.find((p) => p.id === lc.plotId);
          const privateRef = doc(db, 'loan_cases', lc.caseId);
          const publicRef = doc(db, 'loan_public_status', lc.caseId);
          const [privSnap, pubSnap] = await Promise.all([getDoc(privateRef), getDoc(publicRef)]);
          if (privSnap.exists()) {
            batchOps.push((batch) =>
              batch.update(
                privateRef,
                buildLoanCaseUpdatePayload(lc, privSnap.data() as Record<string, unknown>, user.uid)
              )
            );
          } else {
            batchOps.push((batch) =>
              batch.set(privateRef, buildLoanCaseCreatePayload(lc, user.uid))
            );
          }
          if (pubSnap.exists()) {
            const pubUpd = await buildLoanPublicStatusUpdatePayload(
              lc,
              targetPlot,
              pubSnap.data() as Record<string, unknown>,
              user.uid
            );
            batchOps.push((batch) => batch.update(publicRef, pubUpd));
          } else {
            const pubCreate = await buildLoanPublicStatusCreatePayload(lc, targetPlot, user.uid);
            batchOps.push((batch) => batch.set(publicRef, pubCreate));
          }
        }
        if (batchOps.length > 0) {
          await runChunkedBatch(batchOps);
        }
        setDirtyLoanCaseIds((prev) =>
          prev.filter((id) => !cleanList.some((c) => c.caseId === id))
        );
        showTimedNotice(`นำเข้าและซิงค์ฐานข้อมูลลูกค้า ${cleanList.length} รายการเรียบร้อยแล้ว`);
      } catch (error) {
        setDirtyLoanCaseIds((prev) =>
          Array.from(new Set([...prev, ...cleanList.map((c) => c.caseId)]))
        );
        reportCloudSyncError(error, OperationType.WRITE, 'loan_cases_import');
      }
    } else {
      setDirtyLoanCaseIds((prev) =>
        Array.from(new Set([...prev, ...cleanList.map((c) => c.caseId)]))
      );
      showTimedNotice(
        `นำเข้าฐานข้อมูลลูกค้า ${cleanList.length} รายการไว้ในเครื่องแล้ว (กดเชื่อมต่อ Google เพื่อซิงค์)`,
        'warning'
      );
    }

    return cleanList.length;
  };

  const handleDeleteLoanCase = async (caseId: string) => {
    playCancelSound();
    setLoanCases((prev) => {
      const next = prev.filter((item) => item.caseId !== caseId);
      broadcastRef.current?.postMessage({ type: 'loan_cases', payload: next });
      return next;
    });
    setDirtyLoanCaseIds((prev) => prev.filter((id) => id !== caseId));

    if (user && user.emailVerified) {
      const path = `loan_cases/${caseId}`;
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'loan_cases', caseId));
        batch.delete(doc(db, 'loan_public_status', caseId));
        await batch.commit();
        cloudLoanCaseIdsRef.current.delete(caseId);
        showTimedNotice('ลบข้อมูลออกจากฐานข้อมูลกลางเรียบร้อยแล้ว');
      } catch (error) {
        reportCloudSyncError(error, OperationType.DELETE, path);
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
      const ops = keys.map(
        (k) => (batch: WriteBatch) =>
          batch.set(doc(db, 'plot_overrides', k), buildPlotOverridePayload(nextPlotMap[k], user.uid))
      );
      void runChunkedBatch(ops)
        .then(() => {
          setDirtyPlotIds((prev) => prev.filter((id) => !keys.includes(id)));
          showTimedNotice(`นำเข้าและบันทึก ${keys.length} แปลงลงฐานข้อมูลกลางเรียบร้อยแล้ว`);
        })
        .catch((error) => {
          reportCloudSyncError(error, OperationType.WRITE, 'plot_overrides');
        });
    } else {
      setDirtyPlotIds((prev) => Array.from(new Set([...prev, ...keys])));
      showTimedNotice(
        `อัปเดต ${keys.length} แปลงเฉพาะในเครื่องนี้ · กด "เชื่อมต่อ Google" เพื่อบันทึกลงฐานข้อมูลกลาง`,
        'warning'
      );
    }
    return keys.length;
  };

  const handleResetAll = () => {
    playCancelSound();
    const overrideKeys = Object.keys(overrides);
    setOverrides({});
    setDirtyPlotIds([]);
    localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    broadcastRef.current?.postMessage({ type: 'overrides', payload: {} });

    if (user && user.emailVerified && overrideKeys.length > 0) {
      void (async () => {
        for (const k of overrideKeys) {
          const current = plots.find((p) => p.id === k);
          if (current && current.status === 'sold' && !isVerifiedAdmin) {
            continue;
          }
          try {
            await deleteDoc(doc(db, 'plot_overrides', k));
          } catch (error) {
            reportCloudSyncError(error, OperationType.DELETE, `plot_overrides/${k}`);
            break;
          }
        }
        showTimedNotice('รีเซ็ตข้อมูลแปลงในฐานข้อมูลกลางเรียบร้อยแล้ว');
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

  const isStaffMode = !forceCustomerView && (staffUnlocked || isVerifiedAdmin);
  const pendingSyncCount = dirtyPlotIds.length + dirtyLoanCaseIds.length;

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
          activeMusicLabel={
            activeVocalTrack
              ? `${activeVocalTrack.title}${isVocalPlaying ? '' : ' (พัก)'}`
              : null
          }
          onOpenMusicHub={() => setIsMusicHubOpen(true)}
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

        {isStaffMode && !isCloudConnected && (
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3 relative z-20">
            <div className="px-4 py-3 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5 text-xs leading-relaxed">
                <CloudOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="font-semibold">
                    โหมดออฟไลน์เฉพาะเครื่อง (ยังไม่บันทึกลงฐานข้อมูลกลาง)
                  </strong>{' '}
                  <span>
                    — การแก้ไขหรือเพิ่มลูกค้าตอนนี้จะเห็นเฉพาะบนเครื่องนี้เท่านั้น เชื่อมต่อบัญชี Google เพื่อให้ทุกคนและทุกเครื่องเห็นข้อมูลตรงกัน
                  </span>
                  {pendingSyncCount > 0 && (
                    <span className="ml-1.5 inline-block px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-950 font-semibold">
                      รอซิงค์ {pendingSyncCount} รายการ
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                data-sound="custom"
                onClick={() => void handleCloudAuthClick()}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Cloud className="w-3.5 h-3.5" />
                เชื่อมต่อ Google (ซิงค์ฐานข้อมูลกลาง)
              </button>
            </div>
          </div>
        )}

        {isStaffMode && isCloudConnected && pendingSyncCount > 0 && (
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3 relative z-20">
            <div className="px-4 py-2.5 rounded-2xl border bg-[#FBF7EE] border-[#DFC996] text-[#14191F] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                มีข้อมูลในเครื่องที่รอซิงค์ขึ้นฐานข้อมูลกลาง <strong>{pendingSyncCount} รายการ</strong>
              </span>
              <button
                type="button"
                data-sound="custom"
                disabled={isSyncingCloud}
                onClick={() => void handleSyncAllLocalToCloud()}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                {isSyncingCloud ? 'กำลังซิงค์...' : 'ซิงค์ขึ้นฐานข้อมูลกลางทันที'}
              </button>
            </div>
          </div>
        )}

        {cloudNotice && (
          <div className="fixed bottom-5 left-4 z-40 max-w-md pointer-events-none">
            <div
              className={`px-4 py-2.5 rounded-2xl border text-xs font-medium shadow-[0_10px_28px_rgba(20,25,31,0.16)] backdrop-blur-md ${
                cloudNotice.tone === 'warning'
                  ? 'bg-amber-50/95 border-amber-300 text-amber-900'
                  : 'bg-[#FFFEFC]/95 border-[#DFC996] text-[#8A6820]'
              }`}
            >
              {cloudNotice.msg}
            </div>
          </div>
        )}

        {cloudSyncAlert && (
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3 relative z-20">
            <div className="px-4 py-3 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                <span>{cloudSyncAlert.message}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-sound="custom"
                  disabled={isSyncingCloud}
                  onClick={() => void handleSyncAllLocalToCloud()}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  ลองซิงค์อีกครั้ง
                </button>
                {cloudSyncAlert.isPermission && (
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => void handleCloudAuthClick()}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl cursor-pointer"
                  >
                    สลับบัญชี Google
                  </button>
                )}
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => setCloudSyncAlert(null)}
                  aria-label="ปิดการแจ้งเตือน"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-amber-800 hover:bg-amber-200/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
              onSubscribePublicSearch={subscribePublicLoanSearch}
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
                        setActiveTab('loans');
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-sm"
                    >
                      <Landmark className="w-4 h-4" />
                      ฐานข้อมูลลูกค้า & สถานะสินเชื่อ
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playTabSwitchSound();
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
                      onClick={() => {
                        playClickSound();
                        setIsMusicHubOpen(true);
                      }}
                      title="เลือกฟังเพลงมีคนร้อง: บ้านของหัวใจ เพลงเกี่ยวกับบ้าน และเพลงใหม่ LISA"
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#E5C57B] bg-white/8 hover:bg-white/16 border border-[#C59B48]/35 rounded-xl transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98]"
                    >
                      <Music className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {activeVocalTrack
                          ? `กำลังเล่น: ${activeVocalTrack.title}`
                          : 'เพลงบ้านของหัวใจ & LISA'}
                      </span>
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
              isCloudConnected={isCloudConnected}
              isSyncingCloud={isSyncingCloud}
              pendingSyncCount={pendingSyncCount}
              onConnectCloud={() => void handleCloudAuthClick()}
              onSyncAllToCloud={handleSyncAllLocalToCloud}
              plots={plots}
              loanCases={loanCases}
              localPublicStatuses={localPublicStatuses}
              onSearchPublicStatuses={searchPublicLoanStatus}
              onSubscribePublicSearch={subscribePublicLoanSearch}
              onSaveCase={handleSaveLoanCase}
              onImportCases={handleImportLoanCases}
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
                      คลังฐานข้อมูลลูกค้า & สถานะธนาคาร (Customer Database)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-[#E5C57B] mb-3">คลังเพลงประจำโครงการ</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => {
                      playClickSound();
                      setIsMusicHubOpen(true);
                    }}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl cursor-pointer transition-colors"
                  >
                    <Music className="w-3.5 h-3.5" />
                    เลือกเพลงบ้านของหัวใจ & LISA (34 เพลง)
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
                  {activeVocalTrack
                    ? `กำลังเล่นเพลงมีคนร้อง: ${activeVocalTrack.title} · ${activeVocalTrack.artist}`
                    : 'เฉพาะเพลงมีคนร้อง 34 เพลง (บ้านของหัวใจ · เพลงเกี่ยวกับบ้าน · เพลงใหม่ LISA)'}
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
              onEnter={() => setShowWelcome(false)}
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

        <MusicJukeboxModal
          isOpen={isMusicHubOpen}
          onClose={() => setIsMusicHubOpen(false)}
          onOpen={() => setIsMusicHubOpen(true)}
          isStaffMode={isStaffMode}
          onVocalActiveChange={handleVocalActiveChange}
        />
      </div>
    </MotionConfig>
  );
}
