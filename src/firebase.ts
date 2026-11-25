import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { HOUSE_MODELS } from './data/houseModels';
import {
  ActiveTab,
  BankApplicationEntry,
  BankApplicationStatus,
  LoanCase,
  LoanOverallStatus,
  LoanPublicStatus,
  OverlayMode,
  PlotStatus,
  PlotUnit,
} from './types/project';
import {
  getNamePrefix3,
  hashIdCardForLookup,
  hashPhoneForLookup,
  maskCustomerName,
  maskPhoneNumber,
  normalizeIdCardDigits,
  normalizePhoneDigits,
  splitGraphemes,
  stripThaiHonorific,
} from './utils/formatters';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

const PLOT_ID_RE = /^[A-N][0-9]{2}$/;
const HOUSE_NUMBER_RE = /^9\/[0-9A-Za-z\-/]+$/;
const VALID_STATUSES: PlotStatus[] = ['available', 'showhouse', 'reserved', 'sold', 'not_open'];
const VALID_OVERLAYS: OverlayMode[] = ['plot', 'houseNumber', 'price', 'status'];
const VALID_TABS: ActiveTab[] = ['plan', 'directory', 'models', 'compare', 'loans'];
const CASE_ID_RE = /^[a-zA-Z0-9_-]{3,64}$/;
const VALID_LOAN_OVERALL_STATUSES: LoanOverallStatus[] = [
  'preparing',
  'submitted',
  'appraisal',
  'pre_approved',
  'approved',
  'transfer_ready',
  'transferred',
  'rejected',
];
const VALID_BANK_STATUSES: BankApplicationStatus[] = [
  'waiting_docs',
  'submitted',
  'appraisal',
  'reviewing',
  'pre_approved',
  'approved',
  'contract_ready',
  'rejected',
];

export function sanitizeHouseNumber(raw: string, fallback: string): string {
  const trimmed = raw.trim().slice(0, 32);
  if (trimmed.length >= 3 && HOUSE_NUMBER_RE.test(trimmed)) {
    return trimmed;
  }
  return HOUSE_NUMBER_RE.test(fallback) ? fallback : '9/1';
}

export function sanitizePrice(raw: number, fallback: number): number {
  if (Number.isFinite(raw) && raw > 0 && raw <= 200000000) {
    return Math.round(raw);
  }
  return Math.max(1, Math.min(200000000, Math.round(fallback)));
}

export function buildPlotOverridePayload(
  plot: PlotUnit,
  uid: string
) {
  if (!PLOT_ID_RE.test(plot.id)) {
    throw new Error(`Invalid plotId: ${plot.id}`);
  }
  const status: PlotStatus = VALID_STATUSES.includes(plot.status)
    ? plot.status
    : 'available';

  return {
    plotId: plot.id,
    houseNumber: sanitizeHouseNumber(plot.houseNumber, '9/1'),
    price: sanitizePrice(plot.price, 10000000),
    status,
    note: (plot.note ?? '').trim().slice(0, 300),
    updatedAt: serverTimestamp(),
    updatedBy: uid.slice(0, 128),
  };
}

export function buildUserWorkspacePayload(params: {
  uid: string;
  bookmarkedIds: string[];
  soundEnabled: boolean;
  overlayMode: OverlayMode;
  activeTab: ActiveTab;
  selectedPlotId: string | null;
}) {
  const safeBookmarks = params.bookmarkedIds
    .filter((id) => PLOT_ID_RE.test(id))
    .slice(0, 4);

  const safeOverlay: OverlayMode = VALID_OVERLAYS.includes(params.overlayMode)
    ? params.overlayMode
    : 'plot';
  const safeTab: ActiveTab = VALID_TABS.includes(params.activeTab)
    ? params.activeTab
    : 'plan';

  const payload: {
    ownerId: string;
    bookmarkedIds: string[];
    soundEnabled: boolean;
    overlayMode: OverlayMode;
    activeTab: ActiveTab;
    selectedPlotId?: string;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    ownerId: params.uid.slice(0, 128),
    bookmarkedIds: safeBookmarks,
    soundEnabled: Boolean(params.soundEnabled),
    overlayMode: safeOverlay,
    activeTab: safeTab,
    updatedAt: serverTimestamp(),
  };

  if (params.selectedPlotId && params.selectedPlotId.length <= 8) {
    payload.selectedPlotId = params.selectedPlotId;
  }

  return payload;
}

export function sanitizeBankEntries(entries: BankApplicationEntry[]): BankApplicationEntry[] {
  return entries
    .slice(0, 10)
    .map((entry, idx) => {
      const safeId = (entry.id || `bank_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || `bank_${idx + 1}`;
      const safeBankName = (entry.bankName || '').trim().slice(0, 80);
      const safeStatus: BankApplicationStatus = VALID_BANK_STATUSES.includes(entry.status)
        ? entry.status
        : 'submitted';
      const safeAmount =
        Number.isFinite(entry.approvedAmount) && entry.approvedAmount >= 0
          ? Math.min(200000000, Math.round(entry.approvedAmount))
          : 0;
      const safeNote = (entry.note || '').trim().slice(0, 200);
      const safeDate = (entry.updatedDate || '').trim().slice(0, 32);
      return {
        id: safeId,
        bankName: safeBankName,
        status: safeStatus,
        approvedAmount: safeAmount,
        note: safeNote,
        updatedDate: safeDate,
      };
    })
    .filter((entry) => entry.bankName.length > 0);
}

export function sanitizeLoanCase(raw: LoanCase): LoanCase {
  const safeCaseId = CASE_ID_RE.test(raw.caseId)
    ? raw.caseId
    : `case_${Date.now()}`;
  const safePlotId = PLOT_ID_RE.test(raw.plotId) ? raw.plotId : 'A01';
  const safeCustomerName = (raw.customerName || '').trim().slice(0, 100) || 'ลูกค้าโครงการ';
  const safeCustomerPhone = normalizePhoneDigits(raw.customerPhone || '').slice(0, 20);
  const safeCustomerIdCard = normalizeIdCardDigits(raw.customerIdCard || '').slice(0, 20);
  const safeStatus: LoanOverallStatus = VALID_LOAN_OVERALL_STATUSES.includes(raw.overallStatus)
    ? raw.overallStatus
    : 'preparing';

  return {
    caseId: safeCaseId,
    ownerId: raw.ownerId,
    plotId: safePlotId,
    customerName: safeCustomerName,
    customerPhone: safeCustomerPhone,
    customerIdCard: safeCustomerIdCard,
    overallStatus: safeStatus,
    note: (raw.note || '').trim().slice(0, 400),
    banks: sanitizeBankEntries(Array.isArray(raw.banks) ? raw.banks : []),
    updatedAtMs: raw.updatedAtMs ?? Date.now(),
  };
}

export function buildLoanCaseCreatePayload(
  loanCase: LoanCase,
  uid: string
) {
  const safe = sanitizeLoanCase(loanCase);
  return {
    caseId: safe.caseId,
    ownerId: uid.slice(0, 128),
    plotId: safe.plotId,
    customerName: safe.customerName,
    customerPhone: safe.customerPhone,
    customerIdCard: safe.customerIdCard,
    overallStatus: safe.overallStatus,
    note: safe.note,
    banks: safe.banks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildLoanCaseUpdatePayload(loanCase: LoanCase) {
  const safe = sanitizeLoanCase(loanCase);
  return {
    plotId: safe.plotId,
    customerName: safe.customerName,
    customerPhone: safe.customerPhone,
    customerIdCard: safe.customerIdCard,
    overallStatus: safe.overallStatus,
    note: safe.note,
    banks: safe.banks,
    updatedAt: serverTimestamp(),
  };
}

export async function toPublicLoanStatusRecord(
  loanCase: LoanCase,
  plot?: PlotUnit | null
): Promise<LoanPublicStatus> {
  const safe = sanitizeLoanCase(loanCase);
  const phoneDigits = normalizePhoneDigits(safe.customerPhone);
  const [phoneHash, idCardHash] = await Promise.all([
    hashPhoneForLookup(phoneDigits),
    hashIdCardForLookup(safe.customerIdCard),
  ]);
  const modelName = plot ? HOUSE_MODELS[plot.model]?.name || plot.model : '';

  return {
    caseId: safe.caseId,
    ownerId: safe.ownerId,
    plotId: safe.plotId,
    houseNumber: sanitizeHouseNumber(plot?.houseNumber ?? '9/1', '9/1'),
    modelName: modelName.slice(0, 40),
    maskedName: maskCustomerName(safe.customerName),
    namePrefix3: getNamePrefix3(safe.customerName),
    maskedPhone: maskPhoneNumber(phoneDigits),
    phoneLast4: phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '',
    phoneHash,
    idCardHash,
    overallStatus: safe.overallStatus,
    note: safe.note,
    banks: safe.banks,
    updatedAtMs: safe.updatedAtMs ?? Date.now(),
  };
}

export async function buildLoanPublicStatusCreatePayload(
  loanCase: LoanCase,
  plot: PlotUnit | undefined,
  uid: string
) {
  const pub = await toPublicLoanStatusRecord(loanCase, plot);
  return {
    caseId: pub.caseId,
    ownerId: uid.slice(0, 128),
    plotId: pub.plotId,
    houseNumber: pub.houseNumber,
    modelName: pub.modelName,
    maskedName: pub.maskedName,
    namePrefix3: pub.namePrefix3,
    maskedPhone: pub.maskedPhone,
    phoneLast4: pub.phoneLast4,
    phoneHash: pub.phoneHash,
    idCardHash: pub.idCardHash,
    overallStatus: pub.overallStatus,
    note: pub.note,
    banks: pub.banks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function buildLoanPublicStatusUpdatePayload(
  loanCase: LoanCase,
  plot: PlotUnit | undefined
) {
  const pub = await toPublicLoanStatusRecord(loanCase, plot);
  return {
    plotId: pub.plotId,
    houseNumber: pub.houseNumber,
    modelName: pub.modelName,
    maskedName: pub.maskedName,
    namePrefix3: pub.namePrefix3,
    maskedPhone: pub.maskedPhone,
    phoneLast4: pub.phoneLast4,
    phoneHash: pub.phoneHash,
    idCardHash: pub.idCardHash,
    overallStatus: pub.overallStatus,
    note: pub.note,
    banks: pub.banks,
    updatedAt: serverTimestamp(),
  };
}

function mapDocToPublicStatus(
  id: string,
  data: Record<string, unknown>
): LoanPublicStatus | null {
  if (typeof data.maskedName !== 'string' || typeof data.plotId !== 'string') {
    return null;
  }
  const overallStatus = VALID_LOAN_OVERALL_STATUSES.includes(
    data.overallStatus as LoanOverallStatus
  )
    ? (data.overallStatus as LoanOverallStatus)
    : 'preparing';

  const ts = data.updatedAt as { toMillis?: () => number } | undefined;

  return {
    caseId: id,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : undefined,
    plotId: data.plotId,
    houseNumber: typeof data.houseNumber === 'string' ? data.houseNumber : '9/1',
    modelName: typeof data.modelName === 'string' ? data.modelName : '',
    maskedName: data.maskedName,
    namePrefix3: typeof data.namePrefix3 === 'string' ? data.namePrefix3 : '',
    maskedPhone: typeof data.maskedPhone === 'string' ? data.maskedPhone : '',
    phoneLast4: typeof data.phoneLast4 === 'string' ? data.phoneLast4 : '',
    phoneHash: typeof data.phoneHash === 'string' ? data.phoneHash : '',
    idCardHash: typeof data.idCardHash === 'string' ? data.idCardHash : '',
    overallStatus,
    note: typeof data.note === 'string' ? data.note : '',
    banks: sanitizeBankEntries(
      Array.isArray(data.banks) ? (data.banks as BankApplicationEntry[]) : []
    ),
    updatedAtMs: typeof ts?.toMillis === 'function' ? ts.toMillis() : Date.now(),
  };
}

export async function checkIsAdminRecord(uid: string): Promise<boolean> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchExistingPublicStatusesForSync(
  uid: string,
  isAdmin: boolean
): Promise<Map<string, LoanPublicStatus>> {
  const path = 'loan_public_status';
  const result = new Map<string, LoanPublicStatus>();
  try {
    const source = isAdmin
      ? collection(db, path)
      : query(collection(db, path), where('ownerId', '==', uid));
    const snap = await getDocs(source);
    snap.forEach((docSnap) => {
      const mapped = mapDocToPublicStatus(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      );
      if (mapped) {
        result.set(mapped.caseId, mapped);
      }
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function searchPublicLoanStatus(
  queryText: string
): Promise<LoanPublicStatus[]> {
  const raw = (queryText || '').trim();
  if (!raw) return [];

  const path = 'loan_public_status';
  const publicCol = collection(db, path);
  const digits = normalizePhoneDigits(raw);
  const resultsMap = new Map<string, LoanPublicStatus>();

  // 1) If query has >= 4 phone digits (and mostly digits), query by phoneHash (full) or phoneLast4
  const isPhoneStyle = /^[0-9+\-\s()]+$/.test(raw) && digits.length >= 4;
  if (isPhoneStyle) {
    try {
      if (digits.length >= 9) {
        const pHash = await hashPhoneForLookup(digits);
        if (pHash) {
          const snap = await getDocs(
            query(publicCol, where('phoneHash', '==', pHash), limit(15))
          );
          snap.forEach((docSnap) => {
            const mapped = mapDocToPublicStatus(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            );
            if (mapped) resultsMap.set(mapped.caseId, mapped);
          });
        }
      } else if (digits.length >= 4) {
        const snap = await getDocs(
          query(publicCol, where('phoneLast4', '==', digits.slice(-4)), limit(15))
        );
        snap.forEach((docSnap) => {
          const mapped = mapDocToPublicStatus(
            docSnap.id,
            docSnap.data() as Record<string, unknown>
          );
          if (mapped) resultsMap.set(mapped.caseId, mapped);
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return Array.from(resultsMap.values());
  }

  // 2) Name prefix lookup (requires at least 2 graphemes to prevent broad enumeration)
  const cleanedName = stripThaiHonorific(raw);
  const graphemes = splitGraphemes(cleanedName);
  if (graphemes.length < 2) {
    return [];
  }

  const prefix = graphemes.slice(0, 3).join('').toLowerCase();
  try {
    const snap = await getDocs(
      query(
        publicCol,
        where('namePrefix3', '>=', prefix),
        where('namePrefix3', '<=', `${prefix}\uf8ff`),
        limit(20)
      )
    );
    snap.forEach((docSnap) => {
      const mapped = mapDocToPublicStatus(
        docSnap.id,
        docSnap.data() as Record<string, unknown>
      );
      if (mapped) resultsMap.set(mapped.caseId, mapped);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  return Array.from(resultsMap.values());
}

