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

export const STATUS_LABELS: Record<PlotStatus, string> = {
  available: 'ว่าง / พร้อมขาย',
  showhouse: 'บ้านตัวอย่าง',
  reserved: 'จองแล้ว',
  sold: 'ขายแล้ว',
};

export const STATUS_SHORT_LABELS: Record<PlotStatus, string> = {
  available: 'ว่าง',
  showhouse: 'ตัวอย่าง',
  reserved: 'จอง',
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
