import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Lock,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Unlock,
  UserCheck,
  X,
} from 'lucide-react';
import { HOUSE_MODELS } from '../data/houseModels';
import {
  BankApplicationEntry,
  BankApplicationStatus,
  LoanCase,
  LoanOverallStatus,
  LoanPublicStatus,
  PlotUnit,
} from '../types/project';
import {
  BANK_STATUS_LABELS,
  BANK_STATUS_ORDER,
  BANK_STATUS_STYLES,
  formatIdCardDisplay,
  formatMillion,
  formatTHB,
  hashIdCardForLookup,
  LOAN_OVERALL_STATUS_LABELS,
  LOAN_OVERALL_STATUS_ORDER,
  LOAN_OVERALL_STATUS_STYLES,
  maskCustomerName,
  maskIdCardNumber,
  maskPhoneNumber,
  normalizeIdCardDigits,
  normalizePhoneDigits,
  splitGraphemes,
  stripThaiHonorific,
  THAI_BANKS_PRESET,
} from '../utils/formatters';
import {
  playCancelSound,
  playClickSound,
  playEditOpenSound,
  playErrorSound,
  playLockedSound,
  playSelectPlotSound,
  playSuccessSound,
  playToggleSound,
  playUnlockSound,
} from '../utils/soundEffects';

interface LoanStatusViewProps {
  isStaffMode: boolean;
  plots: PlotUnit[];
  loanCases: LoanCase[];
  localPublicStatuses: LoanPublicStatus[];
  onSearchPublicStatuses: (queryText: string) => Promise<LoanPublicStatus[]>;
  onSaveCase: (loanCase: LoanCase, isNew: boolean) => void;
  onDeleteCase: (caseId: string) => void;
  initialPlotId?: string | null;
}

type LoanSubMode = 'customer' | 'manage';

const TIMELINE_STEPS = [
  { label: 'เตรียมเอกสาร', key: 'preparing' },
  { label: 'ยื่นธนาคารแล้ว', key: 'submitted' },
  { label: 'ประเมินบ้าน', key: 'appraisal' },
  { label: 'อนุมัติวงเงิน', key: 'approved' },
  { label: 'โอนกรรมสิทธิ์', key: 'transferred' },
];

function formatTodayThaiShort(): string {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function createEmptyBankEntry(index: number): BankApplicationEntry {
  return {
    id: `bank_${Date.now()}_${index}`,
    bankName: THAI_BANKS_PRESET[index % THAI_BANKS_PRESET.length],
    status: 'submitted',
    approvedAmount: 0,
    note: '',
    updatedDate: formatTodayThaiShort(),
  };
}

export function LoanStatusView({
  isStaffMode,
  plots,
  loanCases,
  localPublicStatuses,
  onSearchPublicStatuses,
  onSaveCase,
  onDeleteCase,
  initialPlotId,
}: LoanStatusViewProps) {
  const [subMode, setSubMode] = useState<LoanSubMode>(isStaffMode ? 'manage' : 'customer');
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [remoteMatches, setRemoteMatches] = useState<LoanPublicStatus[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState<boolean>(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [idCardPasscodeInput, setIdCardPasscodeInput] = useState<string>('');
  const [showPasscodeInput, setShowPasscodeInput] = useState<boolean>(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [unlockedCaseIds, setUnlockedCaseIds] = useState<Set<string>>(() => new Set());

  const [manageSearch, setManageSearch] = useState<string>('');
  const [manageStatusFilter, setManageStatusFilter] = useState<LoanOverallStatus | 'ALL'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add / Edit form state (Staff only)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [draftPlotId, setDraftPlotId] = useState<string>(initialPlotId || plots[0]?.id || 'A01');
  const [draftCustomerName, setDraftCustomerName] = useState<string>('');
  const [draftCustomerPhone, setDraftCustomerPhone] = useState<string>('');
  const [draftCustomerIdCard, setDraftCustomerIdCard] = useState<string>('');
  const [showDraftIdCard, setShowDraftIdCard] = useState<boolean>(false);
  const [draftOverallStatus, setDraftOverallStatus] = useState<LoanOverallStatus>('submitted');
  const [draftNote, setDraftNote] = useState<string>('');
  const [draftBanks, setDraftBanks] = useState<BankApplicationEntry[]>([createEmptyBankEntry(0)]);
  const [formError, setFormError] = useState<string | null>(null);

  // Force customer mode whenever staff mode turns off
  useEffect(() => {
    if (!isStaffMode) {
      setSubMode('customer');
      setIsFormOpen(false);
    }
  }, [isStaffMode]);

  const effectiveSubMode: LoanSubMode = isStaffMode ? subMode : 'customer';

  const plotMap = useMemo(() => {
    const map = new Map<string, PlotUnit>();
    plots.forEach((p) => map.set(p.id, p));
    return map;
  }, [plots]);

  const sortedCases = useMemo(() => {
    return [...loanCases].sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
  }, [loanCases]);

  const filteredManageCases = useMemo(() => {
    const q = manageSearch.trim().toLowerCase();
    const qDigits = normalizePhoneDigits(manageSearch);
    return sortedCases.filter((item) => {
      if (manageStatusFilter !== 'ALL' && item.overallStatus !== manageStatusFilter) {
        return false;
      }
      if (!q) return true;
      const plot = plotMap.get(item.plotId);
      const bankMatch = item.banks.some((b) => b.bankName.toLowerCase().includes(q));
      const phoneMatch = qDigits.length >= 3 && item.customerPhone.includes(qDigits);
      const idCardMatch = qDigits.length >= 4 && item.customerIdCard.includes(qDigits);
      return (
        item.plotId.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        (plot?.houseNumber ?? '').toLowerCase().includes(q) ||
        phoneMatch ||
        idCardMatch ||
        bankMatch
      );
    });
  }, [sortedCases, manageSearch, manageStatusFilter, plotMap]);

  // Determine whether customerQuery meets minimum length (2 graphemes or 4 phone digits)
  const queryAnalysis = useMemo(() => {
    const raw = customerQuery.trim();
    const digits = normalizePhoneDigits(raw);
    const isPhoneQuery = /^[0-9+\-\s()]+$/.test(raw) && digits.length > 0;
    const cleanedName = stripThaiHonorific(raw);
    const nameGraphemes = splitGraphemes(cleanedName);
    const namePrefixLower = nameGraphemes.slice(0, 3).join('').toLowerCase();

    const meetsMinThreshold = isPhoneQuery
      ? digits.length >= 4
      : nameGraphemes.length >= 2;

    return {
      raw,
      digits,
      isPhoneQuery,
      namePrefixLower,
      meetsMinThreshold,
    };
  }, [customerQuery]);

  // Debounced live Firestore public lookup when threshold is met
  useEffect(() => {
    if (effectiveSubMode !== 'customer' || !queryAnalysis.meetsMinThreshold) {
      setRemoteMatches([]);
      setIsSearchingRemote(false);
      return;
    }

    let cancelled = false;
    setIsSearchingRemote(true);
    const timer = window.setTimeout(async () => {
      try {
        const remote = await onSearchPublicStatuses(queryAnalysis.raw);
        if (!cancelled) {
          setRemoteMatches(remote);
        }
      } catch {
        if (!cancelled) {
          setRemoteMatches([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingRemote(false);
        }
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [effectiveSubMode, queryAnalysis, onSearchPublicStatuses]);

  // Merge localPublicStatuses matches + Firestore remoteMatches without ever exposing unmasked PII
  const customerMatchedPublicCases = useMemo(() => {
    if (!queryAnalysis.meetsMinThreshold) return [];

    const byId = new Map<string, LoanPublicStatus>();
    for (const item of remoteMatches) {
      byId.set(item.caseId, item);
    }

    for (const item of localPublicStatuses) {
      let matched = false;
      if (queryAnalysis.isPhoneQuery) {
        if (queryAnalysis.digits.length >= 9) {
          // Compare last 4 + full local check via masked/last4; exact hash check on local/remote
          matched =
            item.phoneLast4 === queryAnalysis.digits.slice(-4) &&
            item.maskedPhone.startsWith(queryAnalysis.digits.slice(0, 2));
        } else if (queryAnalysis.digits.length >= 4) {
          matched = item.phoneLast4 === queryAnalysis.digits.slice(-4);
        }
      } else if (queryAnalysis.namePrefixLower.length >= 2) {
        matched = item.namePrefix3.startsWith(queryAnalysis.namePrefixLower);
      }
      if (matched && !byId.has(item.caseId)) {
        byId.set(item.caseId, item);
      }
    }

    return Array.from(byId.values()).sort(
      (a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0)
    );
  }, [queryAnalysis, remoteMatches, localPublicStatuses]);

  // Keep selectedCandidateId synchronized with active matches
  useEffect(() => {
    if (customerMatchedPublicCases.length === 0) {
      setSelectedCandidateId(null);
      return;
    }
    if (
      selectedCandidateId &&
      customerMatchedPublicCases.some((c) => c.caseId === selectedCandidateId)
    ) {
      return;
    }
    if (customerMatchedPublicCases.length === 1) {
      setSelectedCandidateId(customerMatchedPublicCases[0].caseId);
    } else {
      setSelectedCandidateId(null);
    }
  }, [customerMatchedPublicCases, selectedCandidateId]);

  const selectedCandidate = useMemo(
    () =>
      customerMatchedPublicCases.find((c) => c.caseId === selectedCandidateId) ?? null,
    [customerMatchedPublicCases, selectedCandidateId]
  );

  const summary = useMemo(() => {
    const totalCustomers = loanCases.length;
    const inProgress = loanCases.filter(
      (c) =>
        c.overallStatus === 'preparing' ||
        c.overallStatus === 'submitted' ||
        c.overallStatus === 'appraisal'
    ).length;
    const approvedCount = loanCases.filter(
      (c) =>
        c.overallStatus === 'pre_approved' ||
        c.overallStatus === 'approved' ||
        c.overallStatus === 'transfer_ready' ||
        c.overallStatus === 'transferred'
    ).length;
    const totalBanks = loanCases.reduce((sum, c) => sum + c.banks.length, 0);
    return { totalCustomers, inProgress, approvedCount, totalBanks };
  }, [loanCases]);

  const openNewForm = (presetPlotId?: string) => {
    playEditOpenSound();
    setSubMode('manage');
    setEditingCaseId(null);
    setDraftPlotId(presetPlotId || initialPlotId || plots[0]?.id || 'A01');
    setDraftCustomerName('');
    setDraftCustomerPhone('');
    setDraftCustomerIdCard('');
    setShowDraftIdCard(false);
    setDraftOverallStatus('submitted');
    setDraftNote('');
    setDraftBanks([createEmptyBankEntry(0)]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: LoanCase) => {
    playEditOpenSound();
    setSubMode('manage');
    setEditingCaseId(item.caseId);
    setDraftPlotId(item.plotId);
    setDraftCustomerName(item.customerName);
    setDraftCustomerPhone(item.customerPhone || '');
    setDraftCustomerIdCard(item.customerIdCard || '');
    setShowDraftIdCard(false);
    setDraftOverallStatus(item.overallStatus);
    setDraftNote(item.note);
    setDraftBanks(
      item.banks.length > 0
        ? item.banks.map((b) => ({ ...b }))
        : [createEmptyBankEntry(0)]
    );
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleAddBankRow = () => {
    if (draftBanks.length >= 10) return;
    playClickSound();
    setDraftBanks((prev) => [...prev, createEmptyBankEntry(prev.length)]);
  };

  const handleUpdateBankRow = (
    idx: number,
    patch: Partial<BankApplicationEntry>
  ) => {
    setDraftBanks((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const handleRemoveBankRow = (idx: number) => {
    playCancelSound();
    setDraftBanks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = draftCustomerName.trim();
    const normalizedPhone = normalizePhoneDigits(draftCustomerPhone);
    const normalizedIdCard = normalizeIdCardDigits(draftCustomerIdCard);

    if (!trimmedName) {
      setFormError('กรุณาระบุชื่อลูกค้า');
      return;
    }
    if (normalizedPhone.length > 0 && normalizedPhone.length < 9) {
      setFormError('กรุณาระบุเบอร์โทรศัพท์ให้ครบ 9–10 หลัก (หรือเว้นว่างไว้)');
      return;
    }
    if (normalizedIdCard.length !== 13) {
      setFormError('กรุณาระบุเลขบัตรประชาชน 13 หลักของลูกค้า (ใช้เป็นรหัสผ่านสำหรับเช็คสถานะธนาคาร)');
      return;
    }

    const cleanedBanks = draftBanks
      .map((b, i) => ({
        ...b,
        id: b.id || `bank_${Date.now()}_${i}`,
        bankName: b.bankName.trim(),
        approvedAmount: Number.isFinite(Number(b.approvedAmount))
          ? Math.max(0, Number(b.approvedAmount))
          : 0,
        note: b.note.trim(),
        updatedDate: b.updatedDate.trim() || formatTodayThaiShort(),
      }))
      .filter((b) => b.bankName.length > 0);

    if (cleanedBanks.length === 0) {
      setFormError('กรุณาเพิ่มธนาคารที่ยื่นกู้อย่างน้อย 1 แห่ง');
      return;
    }

    const isNew = !editingCaseId;
    const caseId =
      editingCaseId || `case_${draftPlotId}_${Date.now().toString(36)}`;

    const existing = editingCaseId
      ? loanCases.find((c) => c.caseId === editingCaseId)
      : undefined;

    const nextCase: LoanCase = {
      caseId,
      ownerId: existing?.ownerId,
      plotId: draftPlotId,
      customerName: trimmedName,
      customerPhone: normalizedPhone,
      customerIdCard: normalizedIdCard,
      overallStatus: draftOverallStatus,
      note: draftNote.trim(),
      banks: cleanedBanks,
      updatedAtMs: Date.now(),
    };

    playSuccessSound();
    onSaveCase(nextCase, isNew);
    setIsFormOpen(false);
    setEditingCaseId(null);
    setFormError(null);
  };

  const handleVerifyIdCardPasscode = async (
    e: React.FormEvent,
    candidate: LoanPublicStatus
  ) => {
    e.preventDefault();
    const digits = normalizeIdCardDigits(idCardPasscodeInput);
    if (!candidate.idCardHash) {
      playErrorSound();
      setPasscodeError('รายการนี้ยังไม่ได้ตั้งรหัสเลขบัตรประชาชน โปรดติดต่อที่ปรึกษาการขาย');
      return;
    }
    if (digits.length !== 13) {
      playErrorSound();
      setPasscodeError('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก');
      return;
    }
    const candidateHash = await hashIdCardForLookup(digits);
    if (candidateHash && candidateHash === candidate.idCardHash) {
      playUnlockSound();
      setPasscodeError(null);
      setIdCardPasscodeInput('');
      setShowPasscodeInput(false);
      setUnlockedCaseIds((prev) => {
        const next = new Set(prev);
        next.add(candidate.caseId);
        return next;
      });
    } else {
      playErrorSound();
      setPasscodeError('เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบ 13 หลักอีกครั้ง');
    }
  };

  const handleRelockCustomerSearch = () => {
    playLockedSound();
    setUnlockedCaseIds(new Set());
    setSelectedCandidateId(null);
    setIdCardPasscodeInput('');
    setPasscodeError(null);
    setCustomerQuery('');
  };

  // Zero-price customer card (shows ONLY masked 3chars+xxxx name, masked phone, plot/house/model IDs, timeline, and bank statuses)
  const renderUnlockedPublicCaseCard = (item: LoanPublicStatus) => {
    const overallStyle = LOAN_OVERALL_STATUS_STYLES[item.overallStatus];
    const activeStep = overallStyle.stepIndex;

    return (
      <article
        key={item.caseId}
        className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl overflow-hidden shadow-[0_10px_32px_rgba(20,25,31,0.06)]"
      >
        {/* Obsidian & Champagne Header — ZERO price, ZERO land size, ZERO map link */}
        <div className="px-6 py-5 bg-gradient-to-br from-[#14191F] via-[#1C232B] to-[#11151B] text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#E5C57B] flex flex-wrap items-center gap-2">
              <span className="font-mono-tabular font-semibold">แปลง {item.plotId}</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="font-mono-tabular text-stone-300">
                บ้านเลขที่ {item.houseNumber}
              </span>
              {item.modelName && (
                <>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span className="text-stone-300">แบบบ้าน {item.modelName}</span>
                </>
              )}
            </div>
            <h3 className="mt-1.5 text-xl sm:text-2xl font-bold font-display text-white">
              {item.maskedName}
            </h3>
            {item.maskedPhone && (
              <p className="mt-1 text-xs text-stone-300 font-mono-tabular inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#E5C57B]" />
                <span>{item.maskedPhone}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${overallStyle.bg} ${overallStyle.text} ${overallStyle.border}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {LOAN_OVERALL_STATUS_LABELS[item.overallStatus]}
            </span>
            <span className="text-[11px] text-stone-400 tabular-nums">
              ยื่นกู้ทั้งหมด {item.banks.length} ธนาคาร
            </span>
          </div>
        </div>

        {/* 5-Stage Progress Stepper */}
        <div className="px-6 py-5 border-b border-[#ECE7DC] bg-[#FAF8F4]">
          {item.overallStatus === 'rejected' ? (
            <div className="text-xs text-rose-800 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                อยู่ระหว่างทบทวนเอกสารหรือพิจารณายื่นธนาคารเพิ่มเติม โปรดติดต่อที่ปรึกษาการขาย
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {TIMELINE_STEPS.map((step, idx) => {
                const isDone = activeStep >= idx;
                const isCurrent = activeStep === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-full flex items-center">
                      <div
                        className={`h-1 flex-1 rounded-full ${
                          idx === 0
                            ? 'bg-transparent'
                            : activeStep >= idx
                            ? 'bg-[#C59B48]'
                            : 'bg-[#E2DDD0]'
                        }`}
                      />
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-[#14191F] text-[#F5D06B] ring-4 ring-[#C59B48]/25'
                            : isDone
                            ? 'bg-[#C59B48] text-[#14191F]'
                            : 'bg-white border border-[#D8D2C5] text-zinc-400'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div
                        className={`h-1 flex-1 rounded-full ${
                          idx === TIMELINE_STEPS.length - 1
                            ? 'bg-transparent'
                            : activeStep > idx
                            ? 'bg-[#C59B48]'
                            : 'bg-[#E2DDD0]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] leading-tight ${
                        isDone ? 'font-semibold text-[#14191F]' : 'text-zinc-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submitted Banks List */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#14191F] font-display">
              รายละเอียดธนาคารที่ยื่นกู้ ({item.banks.length} แห่ง)
            </h4>
            <button
              type="button"
              data-sound="custom"
              onClick={handleRelockCustomerSearch}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#14191F] bg-[#F5F2EB] hover:bg-[#EAE4D7] border border-[#DFD8C8] rounded-xl cursor-pointer transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#A67F32]" />
              ซ่อนข้อมูล / ค้นหารายอื่น
            </button>
          </div>

          <div className="divide-y divide-[#ECE7DC] border border-[#E4DFD3] rounded-2xl overflow-hidden bg-white">
            {item.banks.map((bank, bIdx) => {
              const bStyle = BANK_STATUS_STYLES[bank.status];
              return (
                <div
                  key={bank.id || `${bank.bankName}-${bIdx}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F5F2EB] border border-[#E4DFD3] flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4 text-[#14191F]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#14191F]">
                          {bIdx + 1}. {bank.bankName}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-2">
                          {bank.updatedDate && <span>อัปเดต {bank.updatedDate}</span>}
                          {bank.approvedAmount > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular font-semibold text-[#14191F]">
                                วงเงินอนุมัติ {formatTHB(bank.approvedAmount)} บ.
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {bank.note && (
                      <p className="mt-2 text-xs text-zinc-600 pl-10 leading-relaxed">
                        {bank.note}
                      </p>
                    )}
                  </div>

                  <span
                    className={`self-start sm:self-center shrink-0 inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-semibold ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                  >
                    {BANK_STATUS_LABELS[bank.status]}
                  </span>
                </div>
              );
            })}
          </div>

          {item.note && (
            <div className="pt-2 text-xs text-zinc-600 leading-relaxed border-t border-[#ECE7DC]">
              <strong className="text-[#14191F]">หมายเหตุจากเจ้าหน้าที่:</strong> {item.note}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Luxury Architectural Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14191F] via-[#1C232C] to-[#101419] text-white border border-[#2C3542] shadow-[0_16px_44px_rgba(20,25,31,0.16)] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="text-xs font-medium text-[#E5C57B] flex flex-wrap items-center gap-2">
              <span>Mortgage Concierge</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-stone-300">CENTRO พระราม 2 - พุทธบูชา 2</span>
            </div>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold font-display text-white text-balance">
              {effectiveSubMode === 'customer'
                ? 'ตรวจสอบสถานะสินเชื่อธนาคารของคุณ'
                : 'จัดการข้อมูลและสถานะสินเชื่อลูกค้า'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              {effectiveSubMode === 'customer'
                ? 'ค้นหาจากชื่อ 3 ตัวแรก หรือเบอร์โทรศัพท์ แล้วกรอกรหัสผ่านด้วยเลขบัตรประชาชน 13 หลักเพื่อตรวจสอบความคืบหน้ารายธนาคาร'
                : 'เพิ่มและอัปเดตข้อมูลลูกค้า แปลงบ้าน เบอร์โทรศัพท์ เลขบัตรประชาชน และสถานะธนาคารที่ยื่นกู้แบบเรียลไทม์'}
            </p>
          </div>

          {isStaffMode && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center p-1 rounded-xl bg-white/8 border border-white/15 gap-1">
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playToggleSound();
                    setSubMode('customer');
                  }}
                  className={`min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    effectiveSubMode === 'customer'
                      ? 'bg-[#C59B48] text-[#14191F]'
                      : 'text-stone-200 hover:bg-white/10'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  ทดสอบหน้าค้นหาลูกค้า
                </button>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playToggleSound();
                    setSubMode('manage');
                  }}
                  className={`min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    effectiveSubMode === 'manage'
                      ? 'bg-[#C59B48] text-[#14191F]'
                      : 'text-stone-200 hover:bg-white/10'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  จัดการข้อมูลลูกค้า ({loanCases.length})
                </button>
              </div>

              <button
                type="button"
                data-sound="custom"
                onClick={() => openNewForm()}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D5B263] rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                เพิ่มข้อมูลลูกค้าใหม่
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mode 1: Customer Search-Only Portal (Masked 3 chars + xxxx & Phone + National ID Passcode) */}
      {effectiveSubMode === 'customer' && (
        <div className="space-y-6">
          <div className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl p-6 sm:p-8 shadow-[0_8px_28px_rgba(20,25,31,0.05)] max-w-3xl mx-auto">
            <div className="text-center space-y-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-[#14191F] font-display">
                ค้นหาบัญชีสินเชื่อของคุณ
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                พิมพ์ <strong>ชื่อ 3 ตัวแรก</strong> (เช่น สมช, กิต) หรือ <strong>เบอร์โทรศัพท์</strong> (4 ตัวท้าย หรือ 10 หลัก) จากนั้นยืนยันด้วย <strong>เลขบัตรประชาชน 13 หลัก</strong>
              </p>

              <div className="relative pt-2">
                <Search className="w-4 h-4 text-[#A67F32] absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setPasscodeError(null);
                  }}
                  placeholder="พิมพ์ชื่อ 3 ตัวแรก หรือ เบอร์โทรศัพท์ (เช่น 0812345678 หรือ 5678)..."
                  className="w-full min-h-[50px] pl-11 pr-11 py-2.5 text-sm sm:text-base bg-[#F7F5F0] border border-[#DCD4C3] rounded-2xl text-[#14191F] focus:outline-none focus:ring-2 focus:ring-[#C59B48]/40 focus:bg-white"
                />
                {customerQuery && (
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => {
                      playCancelSound();
                      setCustomerQuery('');
                      setSelectedCandidateId(null);
                      setIdCardPasscodeInput('');
                      setPasscodeError(null);
                    }}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2.5 top-[calc(50%+4px)] -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-black/5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {queryAnalysis.raw.length > 0 && !queryAnalysis.meetsMinThreshold && (
                <p className="text-xs text-zinc-500 pt-1">
                  {queryAnalysis.isPhoneQuery
                    ? 'กรุณาพิมพ์เบอร์โทรศัพท์อย่างน้อย 4 หลักท้าย หรือทั้ง 10 หลัก'
                    : 'กรุณาพิมพ์ชื่ออย่างน้อย 2–3 ตัวอักษรเพื่อค้นหา'}
                </p>
              )}
            </div>

            {/* Masked Suggestion List (ONLY 3 chars + xxxx & masked phone) */}
            {queryAnalysis.meetsMinThreshold && (
              <div className="mt-5 pt-5 border-t border-[#ECE7DC] space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    {isSearchingRemote
                      ? 'กำลังค้นหาข้อมูลในระบบ...'
                      : customerMatchedPublicCases.length > 0
                      ? `พบรายการที่ตรงกัน ${customerMatchedPublicCases.length} รายการ (เลือกรายการของคุณเพื่อใส่รหัสบัตรประชาชน)`
                      : 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'}
                  </span>
                </div>

                {customerMatchedPublicCases.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customerMatchedPublicCases.map((cand) => {
                      const isSelected = selectedCandidate?.caseId === cand.caseId;
                      const isUnlocked = unlockedCaseIds.has(cand.caseId);
                      return (
                        <button
                          key={cand.caseId}
                          type="button"
                          data-sound="custom"
                          onClick={() => {
                            playSelectPlotSound();
                            setSelectedCandidateId(cand.caseId);
                            setIdCardPasscodeInput('');
                            setPasscodeError(null);
                          }}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#14191F] text-white border-[#14191F] shadow-sm'
                              : 'bg-[#FAF8F4] hover:bg-[#F3EFE6] text-[#14191F] border-[#E4DFD3]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">
                              {cand.maskedName}
                            </div>
                            <div
                              className={`mt-0.5 text-xs font-mono-tabular flex flex-wrap items-center gap-1.5 ${
                                isSelected ? 'text-stone-300' : 'text-zinc-500'
                              }`}
                            >
                              {cand.maskedPhone && <span>{cand.maskedPhone}</span>}
                              {cand.maskedPhone && <span aria-hidden="true">·</span>}
                              <span>แปลง {cand.plotId}</span>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                              isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : isSelected
                                ? 'bg-[#C59B48] text-[#14191F]'
                                : 'bg-white border border-[#DCD4C3] text-zinc-600'
                            }`}
                          >
                            {isUnlocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                เปิดดูแล้ว
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                ยืนยันตัวตน
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isSearchingRemote && customerMatchedPublicCases.length === 0 && (
                  <div className="p-6 rounded-2xl bg-[#FAF8F4] border border-[#ECE7DC] text-center">
                    <p className="text-sm font-semibold text-[#14191F]">
                      ไม่พบบัญชีที่ตรงกับคำค้นหา "{queryAnalysis.raw}"
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ตรวจสอบตัวสะกดชื่อ 3 ตัวแรก หรือเบอร์โทรศัพท์ 4 ตัวท้าย / 10 หลักอีกครั้ง หรือติดต่อที่ปรึกษาการขาย
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: National ID Passcode Verification OR Step 3: Unlocked Bank Status Card */}
          {selectedCandidate && (
            <div className="max-w-3xl mx-auto">
              {unlockedCaseIds.has(selectedCandidate.caseId) ? (
                renderUnlockedPublicCaseCard(selectedCandidate)
              ) : (
                <form
                  onSubmit={(e) => void handleVerifyIdCardPasscode(e, selectedCandidate)}
                  className="bg-[#FFFEFC] border border-[#D5BE84] rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(20,25,31,0.08)] space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ECE7DC]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#14191F] border border-[#C59B48]/40 flex items-center justify-center text-[#E5C57B] shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-[#8A6820] font-semibold">
                          ยืนยันตัวตนเพื่อเปิดดูสถานะธนาคาร
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#14191F] font-display">
                          {selectedCandidate.maskedName}{' '}
                          <span className="text-sm font-normal text-zinc-500 font-mono-tabular">
                            ({selectedCandidate.maskedPhone || `แปลง ${selectedCandidate.plotId}`})
                          </span>
                        </h3>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F5F2EB] border border-[#DFD8C8] text-xs font-mono-tabular text-[#14191F]">
                      แปลง {selectedCandidate.plotId} · {selectedCandidate.houseNumber}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="customer-idcard-passcode"
                      className="block text-xs sm:text-sm font-semibold text-[#14191F]"
                    >
                      รหัสผ่าน (เลขบัตรประชาชน 13 หลักของลูกค้า)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#A67F32] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="customer-idcard-passcode"
                        type={showPasscodeInput ? 'text' : 'password'}
                        inputMode="numeric"
                        autoFocus
                        maxLength={17}
                        value={idCardPasscodeInput}
                        onChange={(e) => {
                          setIdCardPasscodeInput(e.target.value);
                          if (passcodeError) setPasscodeError(null);
                        }}
                        placeholder="กรอกเลขบัตรประชาชน 13 หลัก..."
                        className={`w-full min-h-[48px] pl-11 pr-12 py-2.5 text-base font-mono-tabular bg-[#F7F5F0] border rounded-2xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                          passcodeError
                            ? 'border-rose-400 focus:ring-rose-200 text-rose-800'
                            : 'border-[#DCD4C3] focus:ring-[#C59B48]/40 focus:border-[#C59B48]'
                        }`}
                      />
                      <button
                        type="button"
                        data-sound="custom"
                        onClick={() => setShowPasscodeInput((v) => !v)}
                        aria-label={showPasscodeInput ? 'ซ่อนเลขบัตรประชาชน' : 'แสดงเลขบัตรประชาชน'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-800 cursor-pointer"
                      >
                        {showPasscodeInput ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passcodeError ? (
                      <p className="text-xs font-medium text-rose-700">{passcodeError}</p>
                    ) : (
                      <p className="text-[11px] text-zinc-500">
                        กรอกตัวเลข 13 หลักติดกันหรือมีขีดคั่นได้ · ข้อมูลส่วนตัวของคุณถูกปกป้องด้วยการเข้ารหัส
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => {
                        playCancelSound();
                        setSelectedCandidateId(null);
                        setIdCardPasscodeInput('');
                        setPasscodeError(null);
                      }}
                      className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                    >
                      เลือกบัญชีอื่น
                    </button>
                    <button
                      type="submit"
                      data-sound="custom"
                      className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#14191F] bg-[#E5C57B] hover:bg-[#D4B368] rounded-xl cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <Unlock className="w-4 h-4" />
                      ยืนยันเพื่อดูสถานะธนาคาร
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Staff Add / Update Customer & Banks (Strictly gated behind isStaffMode) */}
      {isStaffMode && effectiveSubMode === 'manage' && (
        <div className="space-y-5">
          {/* 4-Column Summary Strip */}
          <div className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-[0_6px_22px_rgba(20,25,31,0.04)]">
            <div>
              <div className="text-xs text-zinc-500">ลูกค้าในระบบทั้งหมด</div>
              <div className="mt-0.5 text-xl font-bold font-mono-tabular text-[#14191F]">
                {summary.totalCustomers} ราย
              </div>
            </div>
            <div className="sm:pl-4 sm:border-l sm:border-[#ECE7DC]">
              <div className="text-xs text-zinc-500">กำลังยื่น / รอประเมิน</div>
              <div className="mt-0.5 text-xl font-bold font-mono-tabular text-amber-700">
                {summary.inProgress} ราย
              </div>
            </div>
            <div className="sm:pl-4 sm:border-l sm:border-[#ECE7DC]">
              <div className="text-xs text-zinc-500">อนุมัติแล้ว / รอโอน</div>
              <div className="mt-0.5 text-xl font-bold font-mono-tabular text-emerald-700">
                {summary.approvedCount} ราย
              </div>
            </div>
            <div className="sm:pl-4 sm:border-l sm:border-[#ECE7DC]">
              <div className="text-xs text-zinc-500">รวมธนาคารที่ยื่นกู้</div>
              <div className="mt-0.5 text-xl font-bold font-mono-tabular text-[#A67F32]">
                {summary.totalBanks} แห่ง
              </div>
            </div>
          </div>

          {/* Add / Edit Customer Form */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmitForm}
              className="bg-[#FFFEFC] border border-[#D4C39A] rounded-3xl p-5 sm:p-7 shadow-[0_12px_36px_rgba(20,25,31,0.08)] space-y-5"
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#ECE7DC]">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#14191F] font-display">
                    {editingCaseId
                      ? 'แก้ไขข้อมูลสถานะสินเชื่อลูกค้า'
                      : 'เพิ่มข้อมูลลูกค้ายื่นกู้ธนาคารใหม่'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    ระบุแปลงบ้าน ชื่อ เบอร์โทร เลขบัตรประชาชน 13 หลัก และธนาคารที่ยื่นกู้ได้สูงสุด 10 แห่ง
                  </p>
                </div>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playCancelSound();
                    setIsFormOpen(false);
                  }}
                  aria-label="ปิดแบบฟอร์ม"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-[#F3EFE8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    แปลงบ้านของลูกค้า
                  </label>
                  <select
                    value={draftPlotId}
                    onChange={(e) => setDraftPlotId(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm text-[#14191F] font-mono-tabular cursor-pointer"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} · {p.houseNumber} · {p.model} ({formatMillion(p.price)} ลบ.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    ชื่อลูกค้า (หน้าลูกค้าเห็น: {draftCustomerName.trim() ? maskCustomerName(draftCustomerName) : 'xxx'})
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={draftCustomerName}
                    onChange={(e) => setDraftCustomerName(e.target.value)}
                    placeholder="เช่น คุณกิตติพงศ์ วัฒนา"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm text-[#14191F] focus:outline-none focus:ring-2 focus:ring-[#C59B48]/40 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    เบอร์โทรศัพท์ลูกค้า {draftCustomerPhone ? `(${maskPhoneNumber(draftCustomerPhone)})` : ''}
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    value={draftCustomerPhone}
                    onChange={(e) => setDraftCustomerPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm font-mono-tabular text-[#14191F] focus:outline-none focus:ring-2 focus:ring-[#C59B48]/40 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    เลขบัตรประชาชน 13 หลัก (รหัสผ่านลูกค้า)
                  </label>
                  <div className="relative">
                    <input
                      type={showDraftIdCard ? 'text' : 'password'}
                      inputMode="numeric"
                      required
                      maxLength={17}
                      value={draftCustomerIdCard}
                      onChange={(e) => setDraftCustomerIdCard(e.target.value)}
                      placeholder="13 หลัก เช่น 1102001234567"
                      className="w-full min-h-[44px] pl-3.5 pr-10 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm font-mono-tabular text-[#14191F] focus:outline-none focus:ring-2 focus:ring-[#C59B48]/40 focus:bg-white"
                    />
                    <button
                      type="button"
                      data-sound="custom"
                      onClick={() => setShowDraftIdCard((v) => !v)}
                      aria-label={showDraftIdCard ? 'ซ่อนเลขบัตรประชาชน' : 'แสดงเลขบัตรประชาชน'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showDraftIdCard ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {normalizeIdCardDigits(draftCustomerIdCard).length === 13 && (
                    <span className="mt-1 block text-[11px] font-mono-tabular text-emerald-700">
                      รูปแบบ: {formatIdCardDisplay(draftCustomerIdCard)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    สถานะภาพรวมของลูกค้า
                  </label>
                  <select
                    value={draftOverallStatus}
                    onChange={(e) => setDraftOverallStatus(e.target.value as LoanOverallStatus)}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm text-[#14191F] cursor-pointer"
                  >
                    {LOAN_OVERALL_STATUS_ORDER.map((st) => (
                      <option key={st} value={st}>
                        {LOAN_OVERALL_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1.5">
                    หมายเหตุภาพรวมสำหรับลูกค้า (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    maxLength={400}
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="เช่น เอกสารครบถ้วนแล้ว รอธนาคารเข้าประเมินราคาบ้านสัปดาห์นี้"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F5F0] border border-[#DCD4C3] rounded-xl text-sm text-[#14191F] focus:outline-none focus:ring-2 focus:ring-[#C59B48]/40 focus:bg-white"
                  />
                </div>
              </div>

              {/* Dynamic Submitted Banks Section */}
              <div className="pt-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#14191F] font-display">
                      ธนาคารที่ยื่นกู้ ({draftBanks.length}/10 แห่ง)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      เพิ่มจำนวนธนาคารและอัปเดตสถานะของแต่ละธนาคารแยกกันได้ทันที
                    </p>
                  </div>
                  <button
                    type="button"
                    data-sound="custom"
                    disabled={draftBanks.length >= 10}
                    onClick={handleAddBankRow}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#14191F] bg-[#F3ECD9] hover:bg-[#EADBB7] border border-[#D5BE84] rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มธนาคารที่ยื่นกู้
                  </button>
                </div>

                <div className="space-y-3">
                  {draftBanks.map((bank, idx) => {
                    const isPreset = THAI_BANKS_PRESET.includes(bank.bankName);
                    return (
                      <div
                        key={bank.id}
                        className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E4DFD3] space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#14191F]">
                            ธนาคารลำดับที่ {idx + 1}
                          </span>
                          {draftBanks.length > 1 && (
                            <button
                              type="button"
                              data-sound="custom"
                              onClick={() => handleRemoveBankRow(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              ลบธนาคารนี้
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-zinc-600 mb-1">เลือกธนาคาร</label>
                            <select
                              value={isPreset ? bank.bankName : '__custom__'}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateBankRow(idx, {
                                  bankName: val === '__custom__' ? '' : val,
                                });
                              }}
                              className="w-full min-h-[42px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 cursor-pointer"
                            >
                              {THAI_BANKS_PRESET.map((bName) => (
                                <option key={bName} value={bName}>
                                  {bName}
                                </option>
                              ))}
                              <option value="__custom__">ระบุชื่อธนาคารอื่นๆ...</option>
                            </select>
                            {!isPreset && (
                              <input
                                type="text"
                                maxLength={80}
                                value={bank.bankName}
                                onChange={(e) =>
                                  handleUpdateBankRow(idx, { bankName: e.target.value })
                                }
                                placeholder="พิมพ์ชื่อธนาคาร"
                                className="mt-2 w-full min-h-[40px] px-3 py-1.5 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-zinc-600 mb-1">สถานะธนาคารนี้</label>
                            <select
                              value={bank.status}
                              onChange={(e) =>
                                handleUpdateBankRow(idx, {
                                  status: e.target.value as BankApplicationStatus,
                                  updatedDate: formatTodayThaiShort(),
                                })
                              }
                              className="w-full min-h-[42px] px-2.5 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 cursor-pointer"
                            >
                              {BANK_STATUS_ORDER.map((bst) => (
                                <option key={bst} value={bst}>
                                  {BANK_STATUS_LABELS[bst]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-zinc-600 mb-1">
                              วงเงินอนุมัติ / ที่ยื่น (บาท)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={200000000}
                              step={10000}
                              value={bank.approvedAmount || ''}
                              onChange={(e) =>
                                handleUpdateBankRow(idx, {
                                  approvedAmount: Number(e.target.value) || 0,
                                })
                              }
                              placeholder="0 (รอแจ้งวงเงิน)"
                              className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800 font-mono-tabular"
                            />
                          </div>

                          <div>
                            <label className="block text-zinc-600 mb-1">
                              วันที่อัปเดต / หมายเหตุ
                            </label>
                            <input
                              type="text"
                              maxLength={200}
                              value={bank.note}
                              onChange={(e) =>
                                handleUpdateBankRow(idx, { note: e.target.value })
                              }
                              placeholder="เช่น นัดประเมิน 28 พ.ย. / ดอกเบี้ย 1.59%"
                              className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#DCD4C3] rounded-xl text-zinc-800"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#ECE7DC] flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => {
                    playCancelSound();
                    setIsFormOpen(false);
                  }}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-[#F3EFE8] rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  data-sound="custom"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4 text-[#E5C57B]" />
                  {editingCaseId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า'}
                </button>
              </div>
            </form>
          )}

          {/* Filter Toolbar */}
          <div className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[210px] max-w-sm">
                <Search className="w-4 h-4 text-[#14191F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="ค้นหารหัสแปลง / ชื่อ / เบอร์โทร / ธนาคาร..."
                  className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B48]/35 focus:bg-white"
                />
                {manageSearch && (
                  <button
                    type="button"
                    data-sound="custom"
                    onClick={() => setManageSearch('')}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                aria-label="กรองตามสถานะภาพรวม"
                value={manageStatusFilter}
                onChange={(e) =>
                  setManageStatusFilter(e.target.value as LoanOverallStatus | 'ALL')
                }
                className="min-h-[44px] px-3 py-2 text-sm bg-[#F5F2EB] border border-[#DFD8C8] rounded-xl cursor-pointer"
              >
                <option value="ALL">ทุกสถานะสินเชื่อ</option>
                {LOAN_OVERALL_STATUS_ORDER.map((st) => (
                  <option key={st} value={st}>
                    {LOAN_OVERALL_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-zinc-500 tabular-nums">
              แสดง {filteredManageCases.length} จาก {loanCases.length} รายการ
            </span>
          </div>

          {/* Customer Cases Table */}
          <div className="bg-[#FFFEFC] border border-[#E4DFD3] rounded-3xl overflow-hidden shadow-[0_8px_28px_rgba(20,25,31,0.05)]">
            {filteredManageCases.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F2EB] border border-[#E4DFD3] flex items-center justify-center mb-3">
                  <Landmark className="w-6 h-6 text-[#A67F32]" />
                </div>
                <p className="text-sm font-semibold text-[#14191F]">
                  {loanCases.length === 0
                    ? 'ยังไม่มีรายชื่อลูกค้ายื่นกู้'
                    : 'ไม่พบรายชื่อลูกค้าที่ตรงกับคำค้นหา'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  กดปุ่มเพิ่มข้อมูลลูกค้าใหม่เพื่อบันทึกแปลง ชื่อลูกค้า เบอร์โทร เลขบัตรประชาชน และธนาคารที่ยื่นกู้ได้เลย
                </p>
                <button
                  type="button"
                  data-sound="custom"
                  onClick={() => openNewForm()}
                  className="mt-4 min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#14191F] hover:bg-[#232B36] rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#E5C57B]" />
                  เพิ่มข้อมูลลูกค้าใหม่
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#14191F] border-b border-[#2A3340] text-xs font-semibold text-[#E5C57B]">
                      <th className="py-3.5 px-4 whitespace-nowrap">แปลง / บ้านเลขที่</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ข้อมูลลูกค้า</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">สถานะภาพรวม</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">ธนาคารที่ยื่นกู้ & สถานะ</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredManageCases.map((item) => {
                      const plot = plotMap.get(item.plotId);
                      const model = plot ? HOUSE_MODELS[plot.model] : null;
                      const overallStyle = LOAN_OVERALL_STATUS_STYLES[item.overallStatus];
                      const hasIdCard = normalizeIdCardDigits(item.customerIdCard).length === 13;
                      return (
                        <tr key={item.caseId} className="hover:bg-[#F7F5F0]/70 transition-colors">
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="font-mono-tabular font-bold text-[#14191F]">
                              แปลง {item.plotId}
                            </div>
                            {plot && (
                              <div className="text-xs text-zinc-500 font-mono-tabular">
                                {plot.houseNumber} · {model?.name ?? plot.model} · {formatMillion(plot.price)} ลบ.
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-[#14191F]">
                              {item.customerName}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-[#F5F2EB] border border-[#E4DFD3] text-[#8A6820] font-medium">
                                หน้าลูกค้า: {maskCustomerName(item.customerName)}
                              </span>
                              {item.customerPhone && (
                                <span className="font-mono-tabular text-zinc-600">
                                  โทร {item.customerPhone}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] font-mono-tabular">
                              {hasIdCard ? (
                                <span className="text-emerald-700">
                                  บัตร ปชช.: {maskIdCardNumber(item.customerIdCard)}
                                </span>
                              ) : (
                                <span className="text-rose-700 font-medium">
                                  ยังไม่ได้ระบุเลขบัตรประชาชน 13 หลัก
                                </span>
                              )}
                            </div>
                            {item.note && (
                              <div className="text-xs text-zinc-500 mt-1 max-w-xs line-clamp-2">
                                {item.note}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-xl border text-xs font-medium ${overallStyle.bg} ${overallStyle.text} ${overallStyle.border}`}
                            >
                              {LOAN_OVERALL_STATUS_LABELS[item.overallStatus]}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-xs font-semibold text-[#14191F] mb-1.5">
                              ยื่น {item.banks.length} ธนาคาร
                            </div>
                            <div className="space-y-1">
                              {item.banks.map((b) => {
                                const bs = BANK_STATUS_STYLES[b.status];
                                return (
                                  <div
                                    key={b.id}
                                    className="text-xs flex flex-wrap items-center gap-1.5"
                                  >
                                    <span className="font-medium text-zinc-800">{b.bankName}</span>
                                    <span className="text-zinc-400">·</span>
                                    <span className={`font-medium ${bs.text}`}>
                                      {BANK_STATUS_LABELS[b.status]}
                                    </span>
                                    {b.approvedAmount > 0 && (
                                      <span className="text-[11px] font-mono-tabular text-zinc-500">
                                        ({formatTHB(b.approvedAmount)} บ.)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                data-sound="custom"
                                onClick={() => openEditForm(item)}
                                className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#14191F] bg-[#F3ECD9] hover:bg-[#EADBB7] border border-[#D5BE84] rounded-xl cursor-pointer transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                แก้ไข / เพิ่มธนาคาร
                              </button>
                              {confirmDeleteId === item.caseId ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    data-sound="custom"
                                    onClick={() => {
                                      playCancelSound();
                                      onDeleteCase(item.caseId);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl cursor-pointer"
                                  >
                                    ยืนยันลบ
                                  </button>
                                  <button
                                    type="button"
                                    data-sound="custom"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="min-h-[40px] px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  data-sound="custom"
                                  aria-label={`ลบข้อมูลลูกค้า ${item.customerName}`}
                                  onClick={() => setConfirmDeleteId(item.caseId)}
                                  className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
