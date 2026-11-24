export type HouseModelId =
  | 'ZERA'
  | 'ETHAN'
  | 'PHOENIX'
  | 'ABLE'
  | 'INIZIO'
  | 'LUKE'
  | 'ZOTICUS';

export type PlotStatus = 'available' | 'showhouse' | 'reserved' | 'sold' | 'not_open';

export type FacingDirection = 'เหนือ' | 'ใต้' | 'ตะวันออก' | 'ตะวันตก';

export type OverlayMode = 'plot' | 'houseNumber' | 'price' | 'status';

export type ActiveTab = 'plan' | 'directory' | 'models' | 'compare' | 'loans';

export type LoanOverallStatus =
  | 'preparing'
  | 'submitted'
  | 'appraisal'
  | 'pre_approved'
  | 'approved'
  | 'transfer_ready'
  | 'transferred'
  | 'rejected';

export type BankApplicationStatus =
  | 'waiting_docs'
  | 'submitted'
  | 'appraisal'
  | 'reviewing'
  | 'pre_approved'
  | 'approved'
  | 'contract_ready'
  | 'rejected';

export interface BankApplicationEntry {
  id: string;
  bankName: string;
  status: BankApplicationStatus;
  approvedAmount: number;
  note: string;
  updatedDate: string;
}

export interface LoanCase {
  caseId: string;
  ownerId?: string;
  plotId: string;
  customerName: string;
  customerPhone: string;
  customerIdCard: string;
  overallStatus: LoanOverallStatus;
  note: string;
  banks: BankApplicationEntry[];
  updatedAtMs?: number;
}

export interface LoanPublicStatus {
  caseId: string;
  ownerId?: string;
  plotId: string;
  houseNumber: string;
  modelName: string;
  maskedName: string;
  namePrefix3: string;
  maskedPhone: string;
  phoneLast4: string;
  phoneHash: string;
  idCardHash: string;
  overallStatus: LoanOverallStatus;
  note: string;
  banks: BankApplicationEntry[];
  updatedAtMs?: number;
}

export interface HouseModelSpec {
  id: HouseModelId;
  name: string;
  thaiTagline: string;
  usableAreaSqM: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  maidRoom: boolean;
  colorHex: string;
  textHex: string;
  basePriceTHB: number;
  baseLandSqWah: number;
  description: string;
}

export interface PlotUnit {
  id: string;
  zone: string;
  houseNumber: string;
  model: HouseModelId;
  houseTypeCode?: string;
  landSqWah: number;
  price: number;
  minLc?: number;
  totalPro?: number;
  hasOfficialPrice?: boolean;
  status: PlotStatus;
  facing: FacingDirection;
  x: number;
  y: number;
  isCorner: boolean;
  nearPark: boolean;
  nearClubhouse: boolean;
  note: string;
}

export interface PlotFilterState {
  search: string;
  zone: string;
  model: HouseModelId | 'ALL';
  status: PlotStatus | 'ALL';
  facing: FacingDirection | 'ALL';
  maxPriceMillion: number;
}
