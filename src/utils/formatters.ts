import { PlotStatus, PlotUnit } from '../types/project';

export function formatTHB(amount: number): string {
  const hasDecimals = Math.abs(amount % 1) > 0.001;
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}

export function formatMillion(amount: number): string {
  return (amount / 1_000_000).toFixed(2);
}

export function formatPricePerWah(price: number, landSqWah: number): string {
  if (!landSqWah) return '-';
  return formatTHB(Math.round(price / landSqWah));
}

export const COMMON_FEE_THB_PER_WAH = 30;

export function calculateCommonFee(landSqWah: number): {
  ratePerWah: number;
  monthly: number;
  yearly: number;
} {
  const safeSqWah = Number.isFinite(landSqWah) && landSqWah > 0 ? landSqWah : 0;
  const monthly = Math.round(safeSqWah * COMMON_FEE_THB_PER_WAH);
  const yearly = Math.round(safeSqWah * COMMON_FEE_THB_PER_WAH * 12);
  return {
    ratePerWah: COMMON_FEE_THB_PER_WAH,
    monthly,
    yearly,
  };
}

export function calculateMonthlyInstallment(
  priceTHB: number,
  downPaymentPercent: number,
  annualInterestRate: number,
  years: number
): { loanAmount: number; downPaymentAmount: number; monthlyPayment: number } {
  const downPaymentAmount = Math.round(priceTHB * (downPaymentPercent / 100));
  const loanAmount = Math.max(0, priceTHB - downPaymentAmount);
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = years * 12;

  if (loanAmount === 0 || totalMonths <= 0) {
    return { loanAmount: 0, downPaymentAmount, monthlyPayment: 0 };
  }
  if (monthlyRate === 0) {
    return { loanAmount, downPaymentAmount, monthlyPayment: Math.round(loanAmount / totalMonths) };
  }

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = Math.round((loanAmount * monthlyRate * factor) / (factor - 1));
  return { loanAmount, downPaymentAmount, monthlyPayment };
}

export interface TwoPhaseMortgageResult {
  loanAmount: number;
  downPaymentAmount: number;
  first3YearsMonthly: number;
  afterYear3Monthly: number;
  remainingBalanceAfter3Years: number;
  hasAfterYear3Phase: boolean;
}

export function calculateTwoPhaseMortgage(
  priceTHB: number,
  downPaymentPercent: number,
  promoRate3Years: number,
  floatingRateAfterYear3: number,
  years: number
): TwoPhaseMortgageResult {
  const downPaymentAmount = Math.round(priceTHB * (downPaymentPercent / 100));
  const loanAmount = Math.max(0, priceTHB - downPaymentAmount);
  const totalMonths = years * 12;

  if (loanAmount === 0 || totalMonths <= 0) {
    return {
      loanAmount: 0,
      downPaymentAmount,
      first3YearsMonthly: 0,
      afterYear3Monthly: 0,
      remainingBalanceAfter3Years: 0,
      hasAfterYear3Phase: false,
    };
  }

  const r1 = promoRate3Years / 100 / 12;
  const first3YearsMonthlyExact =
    r1 === 0
      ? loanAmount / totalMonths
      : (loanAmount * r1 * Math.pow(1 + r1, totalMonths)) / (Math.pow(1 + r1, totalMonths) - 1);

  if (years <= 3) {
    return {
      loanAmount,
      downPaymentAmount,
      first3YearsMonthly: Math.round(first3YearsMonthlyExact),
      afterYear3Monthly: Math.round(first3YearsMonthlyExact),
      remainingBalanceAfter3Years: 0,
      hasAfterYear3Phase: false,
    };
  }

  const promoMonths = 36;
  const remainingBalance =
    r1 === 0
      ? Math.max(0, loanAmount - first3YearsMonthlyExact * promoMonths)
      : Math.max(
          0,
          loanAmount * Math.pow(1 + r1, promoMonths) -
            first3YearsMonthlyExact * ((Math.pow(1 + r1, promoMonths) - 1) / r1)
        );

  const remainingMonths = totalMonths - promoMonths;
  const r2 = floatingRateAfterYear3 / 100 / 12;
  const afterYear3MonthlyExact =
    r2 === 0
      ? remainingBalance / remainingMonths
      : (remainingBalance * r2 * Math.pow(1 + r2, remainingMonths)) /
        (Math.pow(1 + r2, remainingMonths) - 1);

  return {
    loanAmount,
    downPaymentAmount,
    first3YearsMonthly: Math.round(first3YearsMonthlyExact),
    afterYear3Monthly: Math.round(afterYear3MonthlyExact),
    remainingBalanceAfter3Years: Math.round(remainingBalance),
    hasAfterYear3Phase: true,
  };
}

export interface RequiredSalaryResult {
  loanAmount: number;
  bankBenchmarkMonthly: number;
  evalAnnualRate: number;
  comfortableSalary40: number;
  standardSalary50: number;
  maxStretchSalary60: number;
  highSalary70: number;
  maxSalary80: number;
  selectedDsrPercent: number;
  selectedSalary: number;
}

function roundUpToHundred(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / 100) * 100;
}

/**
 * Estimates minimum monthly gross income (single or co-borrowers combined)
 * required for Thai bank mortgage approval using DSR 40%–80% tiers
 * evaluated at the bank benchmark / post-promo interest rate.
 */
export function calculateRequiredSalary(
  priceTHB: number,
  downPaymentPercent: number,
  evalAnnualRate = 5.25,
  years = 30,
  otherMonthlyDebt = 0,
  selectedDsrPercent = 60
): RequiredSalaryResult {
  const safeRate = Math.max(0, evalAnnualRate);
  const safeDebt = Number.isFinite(otherMonthlyDebt) && otherMonthlyDebt > 0 ? otherMonthlyDebt : 0;
  const clampedDsr = Math.min(80, Math.max(40, Number.isFinite(selectedDsrPercent) ? selectedDsrPercent : 60));
  const { loanAmount, monthlyPayment } = calculateMonthlyInstallment(
    priceTHB,
    downPaymentPercent,
    safeRate,
    years
  );

  if (loanAmount <= 0 || years <= 0 || monthlyPayment <= 0) {
    return {
      loanAmount,
      bankBenchmarkMonthly: 0,
      evalAnnualRate: safeRate,
      comfortableSalary40: 0,
      standardSalary50: 0,
      maxStretchSalary60: 0,
      highSalary70: 0,
      maxSalary80: 0,
      selectedDsrPercent: clampedDsr,
      selectedSalary: 0,
    };
  }

  const totalObligation = monthlyPayment + safeDebt;

  return {
    loanAmount,
    bankBenchmarkMonthly: monthlyPayment,
    evalAnnualRate: safeRate,
    comfortableSalary40: roundUpToHundred(totalObligation / 0.4),
    standardSalary50: roundUpToHundred(totalObligation / 0.5),
    maxStretchSalary60: roundUpToHundred(totalObligation / 0.6),
    highSalary70: roundUpToHundred(totalObligation / 0.7),
    maxSalary80: roundUpToHundred(totalObligation / 0.8),
    selectedDsrPercent: clampedDsr,
    selectedSalary: roundUpToHundred(totalObligation / (clampedDsr / 100)),
  };
}

export const STATUS_LABELS: Record<PlotStatus, string> = {
  available: 'ว่าง / พร้อมขาย',
  showhouse: 'บ้านตัวอย่าง',
  reserved: 'จองแล้ว',
  not_open: 'ยังไม่เปิดขาย',
  sold: 'ขายแล้ว',
};

export const STATUS_SHORT_LABELS: Record<PlotStatus, string> = {
  available: 'ว่าง',
  showhouse: 'ตัวอย่าง',
  reserved: 'จอง',
  not_open: 'ยังไม่เปิด',
  sold: 'ขายแล้ว',
};

export const STATUS_STYLES: Record<
  PlotStatus,
  {
    text: string;
    bg: string;
    border: string;
    dotBg: string;
    pinBg: string;
    pinText: string;
    pinBorder: string;
  }
> = {
  available: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    dotBg: 'bg-green-400',
    pinBg: 'bg-green-300 hover:bg-green-200',
    pinText: 'text-green-950',
    pinBorder: 'border-white/95',
  },
  showhouse: {
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    dotBg: 'bg-blue-600',
    pinBg: 'bg-blue-600 hover:bg-blue-500',
    pinText: 'text-white',
    pinBorder: 'border-amber-300',
  },
  reserved: {
    text: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    dotBg: 'bg-orange-500',
    pinBg: 'bg-orange-500 hover:bg-orange-400',
    pinText: 'text-white',
    pinBorder: 'border-white/95',
  },
  not_open: {
    text: 'text-stone-700',
    bg: 'bg-stone-100',
    border: 'border-stone-300',
    dotBg: 'bg-stone-500',
    pinBg: 'bg-stone-500 hover:bg-stone-400',
    pinText: 'text-white',
    pinBorder: 'border-white/95',
  },
  sold: {
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    dotBg: 'bg-red-600',
    pinBg: 'bg-red-600 hover:bg-red-500',
    pinText: 'text-white',
    pinBorder: 'border-white/95',
  },
};

export function plotsToCSV(plots: PlotUnit[]): string {
  const header = ['รหัสแปลง', 'โซน', 'บ้านเลขที่', 'แบบบ้าน', 'ขนาดที่ดิน(ตร.วา)', 'ราคา(บาท)', 'สถานะ', 'ทิศหน้าบ้าน', 'หมายเหตุ'];
  const rows = plots.map((p) => [
    p.id,
    p.zone,
    p.houseNumber,
    p.model,
    p.landSqWah.toFixed(1),
    p.price.toString(),
    p.status,
    p.facing,
    `"${(p.note || '').replace(/"/g, '""')}"`,
  ]);
  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

import { BankApplicationStatus, LoanOverallStatus } from '../types/project';

export const THAI_BANKS_PRESET: string[] = [
  'ธอส. (GHB)',
  'ไทยพาณิชย์ (SCB)',
  'กสิกรไทย (KBank)',
  'กรุงไทย (KTB)',
  'กรุงเทพ (BBL)',
  'กรุงศรีอยุธยา (Krungsri)',
  'ทีทีบี (ttb)',
  'ออมสิน (GSB)',
  'ยูโอบี (UOB)',
  'ซีไอเอ็มบี ไทย (CIMB)',
];

export const LOAN_OVERALL_STATUS_ORDER: LoanOverallStatus[] = [
  'preparing',
  'submitted',
  'appraisal',
  'pre_approved',
  'approved',
  'transfer_ready',
  'transferred',
  'rejected',
];

export const LOAN_OVERALL_STATUS_LABELS: Record<LoanOverallStatus, string> = {
  preparing: 'เตรียมเอกสารยื่นกู้',
  submitted: 'ยื่นเอกสารธนาคารแล้ว',
  appraisal: 'รอประเมินหลักทรัพย์',
  pre_approved: 'ผ่านอนุมัติเบื้องต้น (Pre-Approve)',
  approved: 'อนุมัติวงเงินแล้ว (Approved)',
  transfer_ready: 'รอทำสัญญา / นัดโอนกรรมสิทธิ์',
  transferred: 'โอนกรรมสิทธิ์เรียบร้อย',
  rejected: 'ไม่ผ่านเกณฑ์ / รอยื่นใหม่',
};

export const LOAN_OVERALL_STATUS_STYLES: Record<
  LoanOverallStatus,
  { text: string; bg: string; border: string; stepIndex: number }
> = {
  preparing: { text: 'text-stone-700', bg: 'bg-stone-100', border: 'border-stone-300', stepIndex: 0 },
  submitted: { text: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200', stepIndex: 1 },
  appraisal: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', stepIndex: 2 },
  pre_approved: { text: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200', stepIndex: 3 },
  approved: { text: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', stepIndex: 3 },
  transfer_ready: { text: 'text-emerald-900', bg: 'bg-emerald-100', border: 'border-emerald-300', stepIndex: 4 },
  transferred: { text: 'text-[#14191F]', bg: 'bg-[#F3ECD9]', border: 'border-[#D5BE84]', stepIndex: 4 },
  rejected: { text: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200', stepIndex: -1 },
};

export const BANK_STATUS_ORDER: BankApplicationStatus[] = [
  'waiting_docs',
  'submitted',
  'appraisal',
  'reviewing',
  'pre_approved',
  'approved',
  'contract_ready',
  'rejected',
];

export const BANK_STATUS_LABELS: Record<BankApplicationStatus, string> = {
  waiting_docs: 'รอส่งเอกสาร',
  submitted: 'ยื่นเอกสารแล้ว',
  appraisal: 'รอประเมินราคาบ้าน',
  reviewing: 'อยู่ระหว่างพิจารณา',
  pre_approved: 'อนุมัติเบื้องต้น (Pre-Approve)',
  approved: 'อนุมัติแล้ว (Approved)',
  contract_ready: 'รอเซ็นสัญญา / นัดจดจำนอง',
  rejected: 'ไม่ผ่านเกณฑ์',
};

export const BANK_STATUS_STYLES: Record<
  BankApplicationStatus,
  { text: string; bg: string; border: string }
> = {
  waiting_docs: { text: 'text-stone-700', bg: 'bg-stone-100', border: 'border-stone-200' },
  submitted: { text: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200' },
  appraisal: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  reviewing: { text: 'text-amber-900', bg: 'bg-amber-50', border: 'border-amber-200' },
  pre_approved: { text: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  approved: { text: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  contract_ready: { text: 'text-[#14191F]', bg: 'bg-[#F3ECD9]', border: 'border-[#D5BE84]' },
  rejected: { text: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
};

// Privacy Masking & Verification Helpers (Thai Grapheme Safe)
export function splitGraphemes(text: string): string[] {
  const normalized = (text || '').trim();
  if (!normalized) return [];
  try {
    const SegmenterCtor = (Intl as unknown as {
      Segmenter?: new (
        locales?: string,
        options?: { granularity: 'grapheme' }
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    }).Segmenter;
    if (typeof SegmenterCtor === 'function') {
      const seg = new SegmenterCtor('th', { granularity: 'grapheme' });
      return Array.from(seg.segment(normalized), (part) => part.segment).filter(
        (g) => g.trim().length > 0
      );
    }
  } catch {
    // fallback below
  }
  const matches = normalized.match(/\P{M}\p{M}*/gu);
  return (matches ?? Array.from(normalized)).filter((g) => g.trim().length > 0);
}

export function stripThaiHonorific(rawName: string): string {
  const trimmed = (rawName || '').trim().replace(/\s+/g, ' ');
  const stripped = trimmed
    .replace(/^(คุณ|นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|ว่าที่ร้อยตรี|ดร\.|พ\.ต\.อ\.|ร\.ต\.อ\.)\s*/u, '')
    .trim();
  return stripped || trimmed;
}

export function getNamePrefix3(rawName: string): string {
  const cleaned = stripThaiHonorific(rawName);
  const graphemes = splitGraphemes(cleaned);
  const prefix = graphemes.slice(0, 3).join('').toLowerCase().slice(0, 16);
  return prefix || 'xxx';
}

export function maskCustomerName(rawName: string): string {
  const cleaned = stripThaiHonorific(rawName);
  const graphemes = splitGraphemes(cleaned);
  const prefix = graphemes.slice(0, 3).join('').slice(0, 18);
  const safePrefix = prefix || 'xxx';
  return `${safePrefix}xxxx`.slice(0, 24);
}

export function normalizePhoneDigits(rawPhone: string): string {
  let digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits.slice(0, 15);
}

export function maskPhoneNumber(rawPhone: string): string {
  const digits = normalizePhoneDigits(rawPhone);
  if (!digits) return '';
  if (digits.length >= 9) {
    return `${digits.slice(0, 2)}x-xxx-${digits.slice(-4)}`;
  }
  if (digits.length >= 4) {
    return `xxx-${digits.slice(-4)}`;
  }
  return 'xxxx';
}

export function normalizeIdCardDigits(rawIdCard: string): string {
  return (rawIdCard || '').replace(/\D/g, '').slice(0, 13);
}

export function formatIdCardDisplay(rawIdCard: string): string {
  const d = normalizeIdCardDigits(rawIdCard);
  if (d.length !== 13) return d;
  return `${d.slice(0, 1)}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d.slice(12)}`;
}

export function maskIdCardNumber(rawIdCard: string): string {
  const d = normalizeIdCardDigits(rawIdCard);
  if (!d) return '';
  if (d.length === 13) {
    return `${d.slice(0, 1)}-xxxx-xxxxx-xx-${d.slice(-1)}`;
  }
  if (d.length >= 4) {
    return `xxxx-xxxx-${d.slice(-2)}`;
  }
  return 'xxxx';
}

export async function sha256Hex(input: string): Promise<string> {
  const normalized = input || '';
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic 64-hex hash if SubtleCrypto is unavailable in non-secure context
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).repeat(4).slice(0, 64);
}

export async function hashPhoneForLookup(rawPhone: string): Promise<string> {
  const digits = normalizePhoneDigits(rawPhone);
  if (digits.length < 7) return '';
  return sha256Hex(`CENTRO_RAMA2_PHONE_V1:${digits}`);
}

export async function hashIdCardForLookup(rawIdCard: string): Promise<string> {
  const digits = normalizeIdCardDigits(rawIdCard);
  if (digits.length < 4) return '';
  return sha256Hex(`CENTRO_RAMA2_ID_V1:${digits}`);
}

