export type HouseModelId =
  | 'ZERA'
  | 'ETHAN'
  | 'PHOENIX'
  | 'ABLE'
  | 'INIZIO'
  | 'LUKE'
  | 'ZOTICUS';

export type PlotStatus = 'available' | 'showhouse' | 'reserved' | 'sold';

export type FacingDirection = 'เหนือ' | 'ใต้' | 'ตะวันออก' | 'ตะวันตก';

export type OverlayMode = 'plot' | 'houseNumber' | 'price' | 'status';

export type ActiveTab = 'plan' | 'directory' | 'models' | 'compare';

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
