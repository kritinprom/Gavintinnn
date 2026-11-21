import { FacingDirection, HouseModelId, PlotStatus, PlotUnit } from '../types/project';
import { HOUSE_MODELS } from './houseModels';

interface RawPlotSeed {
  id: string;
  zone: string;
  model: HouseModelId;
  landSqWah: number;
  facing: FacingDirection;
  x: number;
  y: number;
  isCorner?: boolean;
  nearPark?: boolean;
  nearClubhouse?: boolean;
  status?: PlotStatus;
}

const RAW_PLOTS: RawPlotSeed[] = [
  // Zone A (9 plots) - Entrance & Main Road 12-15m
  { id: 'A01', zone: 'A', model: 'ZOTICUS', landSqWah: 86.1, facing: 'ตะวันออก', x: 89.70, y: 14.71, isCorner: true, nearClubhouse: true, status: 'sold' },
  { id: 'A02', zone: 'A', model: 'LUKE', landSqWah: 75.9, facing: 'ตะวันออก', x: 90.08, y: 19.28, nearClubhouse: true, status: 'sold' },
  { id: 'A03', zone: 'A', model: 'ZOTICUS', landSqWah: 84.7, facing: 'ตะวันออก', x: 90.36, y: 23.96, status: 'reserved' },
  { id: 'A04', zone: 'A', model: 'LUKE', landSqWah: 74.1, facing: 'ตะวันออก', x: 90.65, y: 28.63, status: 'available' },
  { id: 'A05', zone: 'A', model: 'ZOTICUS', landSqWah: 77.9, facing: 'ใต้', x: 90.69, y: 33.11, isCorner: true, status: 'sold' },
  { id: 'A06', zone: 'A', model: 'LUKE', landSqWah: 89.6, facing: 'ใต้', x: 87.02, y: 33.37, status: 'available' },
  { id: 'A07', zone: 'A', model: 'LUKE', landSqWah: 73.1, facing: 'ใต้', x: 83.83, y: 33.81, status: 'available' },
  { id: 'A08', zone: 'A', model: 'ZOTICUS', landSqWah: 83.7, facing: 'ใต้', x: 80.37, y: 34.26, status: 'reserved' },
  { id: 'A09', zone: 'A', model: 'ZOTICUS', landSqWah: 84.4, facing: 'ใต้', x: 76.52, y: 34.84, isCorner: true, nearPark: true, status: 'available' },

  // Zone B (6 plots)
  { id: 'B01', zone: 'B', model: 'LUKE', landSqWah: 80.1, facing: 'เหนือ', x: 93.73, y: 41.41, isCorner: true, status: 'sold' },
  { id: 'B02', zone: 'B', model: 'LUKE', landSqWah: 63.7, facing: 'เหนือ', x: 90.67, y: 41.58, status: 'available' },
  { id: 'B03', zone: 'B', model: 'ZOTICUS', landSqWah: 70.4, facing: 'เหนือ', x: 87.34, y: 41.97, isCorner: true, status: 'available' },
  { id: 'B04', zone: 'B', model: 'ZOTICUS', landSqWah: 71.6, facing: 'ใต้', x: 87.58, y: 46.56, isCorner: true, status: 'reserved' },
  { id: 'B05', zone: 'B', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 90.85, y: 46.32, status: 'available' },
  { id: 'B06', zone: 'B', model: 'LUKE', landSqWah: 67.9, facing: 'ใต้', x: 93.87, y: 46.03, isCorner: true, status: 'available' },

  // Zone C (10 plots)
  { id: 'C01', zone: 'C', model: 'ZOTICUS', landSqWah: 100.8, facing: 'เหนือ', x: 93.65, y: 53.44, isCorner: true, status: 'available' },
  { id: 'C02', zone: 'C', model: 'INIZIO', landSqWah: 64.4, facing: 'เหนือ', x: 90.24, y: 53.80, status: 'sold' },
  { id: 'C03', zone: 'C', model: 'INIZIO', landSqWah: 64.4, facing: 'เหนือ', x: 87.44, y: 54.00, status: 'available' },
  { id: 'C04', zone: 'C', model: 'LUKE', landSqWah: 69.0, facing: 'เหนือ', x: 84.72, y: 54.21, status: 'available' },
  { id: 'C05', zone: 'C', model: 'ZOTICUS', landSqWah: 80.8, facing: 'เหนือ', x: 81.31, y: 54.71, isCorner: true, status: 'reserved' },
  { id: 'C06', zone: 'C', model: 'ZOTICUS', landSqWah: 80.8, facing: 'ใต้', x: 81.54, y: 59.77, isCorner: true, status: 'available' },
  { id: 'C07', zone: 'C', model: 'ZOTICUS', landSqWah: 78.2, facing: 'ใต้', x: 84.96, y: 59.48, status: 'sold' },
  { id: 'C08', zone: 'C', model: 'LUKE', landSqWah: 69.0, facing: 'ใต้', x: 88.15, y: 59.30, status: 'available' },
  { id: 'C09', zone: 'C', model: 'LUKE', landSqWah: 69.0, facing: 'ใต้', x: 91.17, y: 59.01, status: 'available' },
  { id: 'C10', zone: 'C', model: 'INIZIO', landSqWah: 78.0, facing: 'ใต้', x: 94.24, y: 58.83, isCorner: true, status: 'available' },

  // Zone D (10 plots)
  { id: 'D01', zone: 'D', model: 'INIZIO', landSqWah: 85.6, facing: 'เหนือ', x: 94.58, y: 66.60, isCorner: true, status: 'available' },
  { id: 'D02', zone: 'D', model: 'LUKE', landSqWah: 72.3, facing: 'เหนือ', x: 91.01, y: 66.95, status: 'sold' },
  { id: 'D03', zone: 'D', model: 'ABLE', landSqWah: 61.6, facing: 'เหนือ', x: 87.93, y: 67.16, status: 'available' },
  { id: 'D04', zone: 'D', model: 'LUKE', landSqWah: 66.0, facing: 'เหนือ', x: 85.06, y: 67.39, status: 'available' },
  { id: 'D05', zone: 'D', model: 'ZOTICUS', landSqWah: 77.4, facing: 'เหนือ', x: 81.84, y: 67.63, isCorner: true, status: 'reserved' },
  { id: 'D06', zone: 'D', model: 'ZOTICUS', landSqWah: 74.3, facing: 'ใต้', x: 81.94, y: 72.72, isCorner: true, status: 'available' },
  { id: 'D07', zone: 'D', model: 'ABLE', landSqWah: 61.2, facing: 'ใต้', x: 84.96, y: 72.48, status: 'available' },
  { id: 'D08', zone: 'D', model: 'ABLE', landSqWah: 61.2, facing: 'ใต้', x: 87.80, y: 72.28, status: 'sold' },
  { id: 'D09', zone: 'D', model: 'LUKE', landSqWah: 71.9, facing: 'ใต้', x: 90.85, y: 72.01, status: 'available' },
  { id: 'D10', zone: 'D', model: 'ZOTICUS', landSqWah: 107.7, facing: 'ใต้', x: 94.80, y: 71.81, isCorner: true, status: 'available' },

  // Zone E (5 plots)
  { id: 'E01', zone: 'E', model: 'ABLE', landSqWah: 53.0, facing: 'ตะวันออก', x: 77.08, y: 76.22, isCorner: true, status: 'available' },
  { id: 'E02', zone: 'E', model: 'LUKE', landSqWah: 57.6, facing: 'ตะวันออก', x: 76.90, y: 71.81, status: 'available' },
  { id: 'E03', zone: 'E', model: 'INIZIO', landSqWah: 54.5, facing: 'ตะวันออก', x: 76.88, y: 67.80, status: 'sold' },
  { id: 'E04', zone: 'E', model: 'ZERA', landSqWah: 55.3, facing: 'ตะวันออก', x: 76.64, y: 63.68, status: 'available' },
  { id: 'E05', zone: 'E', model: 'LUKE', landSqWah: 60.1, facing: 'ตะวันออก', x: 76.40, y: 59.56, isCorner: true, status: 'reserved' },

  // Zone F (7 plots)
  { id: 'F01', zone: 'F', model: 'ZOTICUS', landSqWah: 72.2, facing: 'เหนือ', x: 76.38, y: 54.74, isCorner: true, status: 'sold' },
  { id: 'F02', zone: 'F', model: 'LUKE', landSqWah: 73.8, facing: 'เหนือ', x: 72.93, y: 54.80, status: 'available' },
  { id: 'F03', zone: 'F', model: 'ABLE', landSqWah: 60.2, facing: 'เหนือ', x: 69.84, y: 55.15, status: 'available' },
  { id: 'F04', zone: 'F', model: 'INIZIO', landSqWah: 59.6, facing: 'เหนือ', x: 67.08, y: 55.36, status: 'sold' },
  { id: 'F05', zone: 'F', model: 'ABLE', landSqWah: 59.1, facing: 'เหนือ', x: 64.34, y: 55.53, status: 'available' },
  { id: 'F06', zone: 'F', model: 'INIZIO', landSqWah: 58.5, facing: 'เหนือ', x: 61.52, y: 55.74, status: 'available' },
  { id: 'F07', zone: 'F', model: 'ZERA', landSqWah: 58.0, facing: 'เหนือ', x: 58.86, y: 55.92, status: 'reserved' },

  // Zone G (8 plots)
  { id: 'G01', zone: 'G', model: 'ZOTICUS', landSqWah: 73.1, facing: 'ใต้', x: 81.92, y: 46.82, isCorner: true, status: 'sold' },
  { id: 'G02', zone: 'G', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 78.71, y: 47.09, status: 'available' },
  { id: 'G03', zone: 'G', model: 'LUKE', landSqWah: 57.0, facing: 'ใต้', x: 75.77, y: 47.32, status: 'available' },
  { id: 'G04', zone: 'G', model: 'INIZIO', landSqWah: 57.0, facing: 'ใต้', x: 72.93, y: 47.53, status: 'sold' },
  { id: 'G05', zone: 'G', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 70.09, y: 47.76, status: 'available' },
  { id: 'G06', zone: 'G', model: 'ABLE', landSqWah: 53.2, facing: 'ใต้', x: 67.22, y: 48.00, status: 'available' },
  { id: 'G07', zone: 'G', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 64.42, y: 48.12, status: 'reserved' },
  { id: 'G08', zone: 'G', model: 'ZOTICUS', landSqWah: 81.3, facing: 'ใต้', x: 60.92, y: 48.41, isCorner: true, status: 'available' },

  // Zone H (8 plots) - Facing Main Park & 12m Road
  { id: 'H01', zone: 'H', model: 'ZOTICUS', landSqWah: 73.0, facing: 'เหนือ', x: 81.92, y: 42.53, isCorner: true, status: 'sold' },
  { id: 'H02', zone: 'H', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 78.65, y: 42.79, status: 'available' },
  { id: 'H03', zone: 'H', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 75.79, y: 43.00, nearPark: true, status: 'available' },
  { id: 'H04', zone: 'H', model: 'LUKE', landSqWah: 63.7, facing: 'เหนือ', x: 72.75, y: 43.23, nearPark: true, status: 'reserved' },
  { id: 'H05', zone: 'H', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 70.07, y: 43.44, nearPark: true, status: 'available' },
  { id: 'H06', zone: 'H', model: 'ABLE', landSqWah: 53.2, facing: 'เหนือ', x: 66.92, y: 43.67, nearPark: true, status: 'sold' },
  { id: 'H07', zone: 'H', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 64.12, y: 43.82, nearPark: true, status: 'available' },
  { id: 'H08', zone: 'H', model: 'LUKE', landSqWah: 72.3, facing: 'เหนือ', x: 60.75, y: 44.14, isCorner: true, nearPark: true, status: 'available' },

  // Zone I (17 plots) - Facing Park & Niti Building
  { id: 'I01', zone: 'I', model: 'ZOTICUS', landSqWah: 79.3, facing: 'เหนือ', x: 54.28, y: 44.35, isCorner: true, nearPark: true, status: 'sold' },
  { id: 'I02', zone: 'I', model: 'ZERA', landSqWah: 53.2, facing: 'เหนือ', x: 50.82, y: 44.59, nearPark: true, status: 'available' },
  { id: 'I03', zone: 'I', model: 'ZERA', landSqWah: 53.2, facing: 'เหนือ', x: 48.05, y: 44.79, nearPark: true, status: 'available' },
  { id: 'I04', zone: 'I', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 45.27, y: 45.03, nearPark: true, status: 'reserved' },
  { id: 'I05', zone: 'I', model: 'LUKE', landSqWah: 57.0, facing: 'เหนือ', x: 42.39, y: 45.23, nearPark: true, status: 'available' },
  { id: 'I06', zone: 'I', model: 'LUKE', landSqWah: 57.0, facing: 'เหนือ', x: 39.41, y: 45.47, nearPark: true, status: 'sold' },
  { id: 'I07', zone: 'I', model: 'ABLE', landSqWah: 53.2, facing: 'เหนือ', x: 36.55, y: 45.70, nearPark: true, status: 'available' },
  { id: 'I08', zone: 'I', model: 'ABLE', landSqWah: 53.2, facing: 'เหนือ', x: 33.76, y: 45.91, nearPark: true, status: 'available' },
  { id: 'I09', zone: 'I', model: 'INIZIO', landSqWah: 53.2, facing: 'เหนือ', x: 30.98, y: 46.14, nearPark: true, status: 'available' },
  { id: 'I10', zone: 'I', model: 'ZERA', landSqWah: 53.2, facing: 'เหนือ', x: 28.44, y: 46.35, nearPark: true, status: 'sold' },
  { id: 'I11', zone: 'I', model: 'LUKE', landSqWah: 57.0, facing: 'เหนือ', x: 25.32, y: 46.59, nearPark: true, status: 'available' },
  { id: 'I12', zone: 'I', model: 'LUKE', landSqWah: 62.3, facing: 'เหนือ', x: 22.46, y: 46.59, status: 'available' },
  { id: 'I13', zone: 'I', model: 'LUKE', landSqWah: 76.0, facing: 'เหนือ', x: 19.03, y: 45.64, status: 'reserved' },
  { id: 'I14', zone: 'I', model: 'PHOENIX', landSqWah: 71.6, facing: 'เหนือ', x: 16.15, y: 45.53, status: 'available' },
  { id: 'I15', zone: 'I', model: 'ETHAN', landSqWah: 61.5, facing: 'เหนือ', x: 13.55, y: 45.64, status: 'available' },
  { id: 'I16', zone: 'I', model: 'PHOENIX', landSqWah: 57.2, facing: 'เหนือ', x: 11.11, y: 45.70, status: 'sold' },
  { id: 'I17', zone: 'I', model: 'ZERA', landSqWah: 54.7, facing: 'เหนือ', x: 8.59, y: 45.73, isCorner: true, status: 'available' },

  // Zone J (17 plots)
  { id: 'J01', zone: 'J', model: 'ZOTICUS', landSqWah: 74.1, facing: 'ใต้', x: 54.93, y: 48.68, isCorner: true, status: 'available' },
  { id: 'J02', zone: 'J', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 51.72, y: 48.91, status: 'available' },
  { id: 'J03', zone: 'J', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 48.90, y: 49.15, status: 'sold' },
  { id: 'J04', zone: 'J', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 46.20, y: 49.35, status: 'available' },
  { id: 'J05', zone: 'J', model: 'LUKE', landSqWah: 57.0, facing: 'ใต้', x: 43.24, y: 49.59, status: 'available' },
  { id: 'J06', zone: 'J', model: 'LUKE', landSqWah: 57.0, facing: 'ใต้', x: 40.42, y: 49.82, status: 'reserved' },
  { id: 'J07', zone: 'J', model: 'ABLE', landSqWah: 53.2, facing: 'ใต้', x: 37.45, y: 50.03, status: 'available' },
  { id: 'J08', zone: 'J', model: 'ABLE', landSqWah: 53.2, facing: 'ใต้', x: 34.67, y: 50.26, status: 'available' },
  { id: 'J09', zone: 'J', model: 'INIZIO', landSqWah: 53.2, facing: 'ใต้', x: 31.89, y: 50.47, status: 'sold' },
  { id: 'J10', zone: 'J', model: 'ZERA', landSqWah: 53.2, facing: 'ใต้', x: 29.11, y: 50.71, status: 'available' },
  { id: 'J11', zone: 'J', model: 'LUKE', landSqWah: 64.6, facing: 'ใต้', x: 26.02, y: 50.88, status: 'available' },
  { id: 'J12', zone: 'J', model: 'LUKE', landSqWah: 66.8, facing: 'ใต้', x: 22.88, y: 51.03, status: 'available' },
  { id: 'J13', zone: 'J', model: 'PHOENIX', landSqWah: 57.8, facing: 'ใต้', x: 19.51, y: 51.00, status: 'available' },
  { id: 'J14', zone: 'J', model: 'ETHAN', landSqWah: 51.6, facing: 'ใต้', x: 16.87, y: 51.03, status: 'sold' },
  { id: 'J15', zone: 'J', model: 'ETHAN', landSqWah: 51.6, facing: 'ใต้', x: 14.43, y: 50.94, status: 'available' },
  { id: 'J16', zone: 'J', model: 'PHOENIX', landSqWah: 51.6, facing: 'ใต้', x: 11.97, y: 50.94, status: 'available' },
  { id: 'J17', zone: 'J', model: 'ETHAN', landSqWah: 61.4, facing: 'ใต้', x: 9.31, y: 50.97, isCorner: true, status: 'available' },

  // Zone K (17 plots)
  { id: 'K01', zone: 'K', model: 'LUKE', landSqWah: 74.8, facing: 'เหนือ', x: 55.61, y: 55.74, isCorner: true, status: 'sold' },
  { id: 'K02', zone: 'K', model: 'ABLE', landSqWah: 60.5, facing: 'เหนือ', x: 52.55, y: 55.97, status: 'available' },
  { id: 'K03', zone: 'K', model: 'INIZIO', landSqWah: 60.0, facing: 'เหนือ', x: 49.81, y: 56.18, status: 'available' },
  { id: 'K04', zone: 'K', model: 'ABLE', landSqWah: 60.1, facing: 'เหนือ', x: 46.99, y: 56.39, status: 'reserved' },
  { id: 'K05', zone: 'K', model: 'ZERA', landSqWah: 53.2, facing: 'เหนือ', x: 44.39, y: 56.62, status: 'available' },
  { id: 'K06', zone: 'K', model: 'ZERA', landSqWah: 53.4, facing: 'เหนือ', x: 42.03, y: 56.83, status: 'available' },
  { id: 'K07', zone: 'K', model: 'PHOENIX', landSqWah: 53.5, facing: 'เหนือ', x: 39.47, y: 57.03, status: 'sold' },
  { id: 'K08', zone: 'K', model: 'ETHAN', landSqWah: 53.7, facing: 'เหนือ', x: 37.03, y: 57.21, status: 'available' },
  { id: 'K09', zone: 'K', model: 'PHOENIX', landSqWah: 53.8, facing: 'เหนือ', x: 34.57, y: 57.42, status: 'available' },
  { id: 'K10', zone: 'K', model: 'INIZIO', landSqWah: 61.2, facing: 'เหนือ', x: 31.97, y: 57.62, status: 'available' },
  { id: 'K11', zone: 'K', model: 'ZERA', landSqWah: 61.4, facing: 'เหนือ', x: 29.25, y: 57.83, status: 'sold' },
  { id: 'K12', zone: 'K', model: 'LUKE', landSqWah: 66.0, facing: 'เหนือ', x: 26.31, y: 58.06, status: 'available' },
  { id: 'K13', zone: 'K', model: 'ZOTICUS', landSqWah: 80.9, facing: 'เหนือ', x: 23.14, y: 58.42, isCorner: true, status: 'available' },
  { id: 'K14', zone: 'K', model: 'PHOENIX', landSqWah: 54.9, facing: 'เหนือ', x: 19.92, y: 58.56, status: 'available' },
  { id: 'K15', zone: 'K', model: 'ETHAN', landSqWah: 51.6, facing: 'เหนือ', x: 17.36, y: 58.56, status: 'reserved' },
  { id: 'K16', zone: 'K', model: 'LUKE', landSqWah: 68.9, facing: 'เหนือ', x: 14.49, y: 58.51, status: 'available' },
  { id: 'K17', zone: 'K', model: 'ZOTICUS', landSqWah: 88.8, facing: 'เหนือ', x: 10.74, y: 58.42, isCorner: true, status: 'available' },

  // Zone L (7 plots)
  { id: 'L01', zone: 'L', model: 'ZOTICUS', landSqWah: 85.7, facing: 'ใต้', x: 11.29, y: 63.21, isCorner: true, status: 'available' },
  { id: 'L02', zone: 'L', model: 'LUKE', landSqWah: 64.7, facing: 'ใต้', x: 14.76, y: 63.21, status: 'sold' },
  { id: 'L03', zone: 'L', model: 'ETHAN', landSqWah: 51.6, facing: 'ใต้', x: 17.58, y: 63.21, status: 'available' },
  { id: 'L04', zone: 'L', model: 'PHOENIX', landSqWah: 61.2, facing: 'ใต้', x: 20.10, y: 63.30, isCorner: true, status: 'available' },
  { id: 'L05', zone: 'L', model: 'ZOTICUS', landSqWah: 79.3, facing: 'เหนือ', x: 19.75, y: 70.51, isCorner: true, status: 'available' },
  { id: 'L06', zone: 'L', model: 'LUKE', landSqWah: 64.0, facing: 'เหนือ', x: 15.82, y: 70.51, status: 'reserved' },
  { id: 'L07', zone: 'L', model: 'ZOTICUS', landSqWah: 79.8, facing: 'เหนือ', x: 11.91, y: 70.45, isCorner: true, status: 'available' },

  // Zone M (7 plots)
  { id: 'M01', zone: 'M', model: 'ZOTICUS', landSqWah: 70.3, facing: 'ใต้', x: 12.22, y: 74.69, isCorner: true, status: 'available' },
  { id: 'M02', zone: 'M', model: 'LUKE', landSqWah: 68.0, facing: 'ใต้', x: 15.90, y: 74.69, status: 'available' },
  { id: 'M03', zone: 'M', model: 'ZOTICUS', landSqWah: 77.0, facing: 'ใต้', x: 19.75, y: 74.93, isCorner: true, status: 'sold' },
  { id: 'M04', zone: 'M', model: 'PHOENIX', landSqWah: 65.7, facing: 'เหนือ', x: 20.40, y: 82.08, isCorner: true, status: 'available' },
  { id: 'M05', zone: 'M', model: 'ETHAN', landSqWah: 56.0, facing: 'เหนือ', x: 17.82, y: 82.08, status: 'available' },
  { id: 'M06', zone: 'M', model: 'PHOENIX', landSqWah: 56.0, facing: 'เหนือ', x: 15.38, y: 82.08, status: 'available' },
  { id: 'M07', zone: 'M', model: 'LUKE', landSqWah: 88.1, facing: 'เหนือ', x: 12.52, y: 82.25, isCorner: true, status: 'reserved' },

  // Zone N (15 plots)
  { id: 'N01', zone: 'N', model: 'INIZIO', landSqWah: 60.8, facing: 'ตะวันออก', x: 7.30, y: 79.25, isCorner: true, status: 'available' },
  { id: 'N02', zone: 'N', model: 'ZERA', landSqWah: 56.7, facing: 'ตะวันออก', x: 6.93, y: 75.22, status: 'available' },
  { id: 'N03', zone: 'N', model: 'LUKE', landSqWah: 68.9, facing: 'ตะวันออก', x: 6.65, y: 70.78, status: 'sold' },
  { id: 'N04', zone: 'N', model: 'INIZIO', landSqWah: 60.8, facing: 'ตะวันออก', x: 5.99, y: 66.19, status: 'available' },
  { id: 'N05', zone: 'N', model: 'INIZIO', landSqWah: 56.7, facing: 'ตะวันออก', x: 5.52, y: 62.04, status: 'available' },
  { id: 'N06', zone: 'N', model: 'ZERA', landSqWah: 56.7, facing: 'ตะวันออก', x: 5.10, y: 58.00, status: 'available' },
  { id: 'N07', zone: 'N', model: 'INIZIO', landSqWah: 56.7, facing: 'ตะวันออก', x: 4.66, y: 53.94, status: 'reserved' },
  { id: 'N08', zone: 'N', model: 'ZOTICUS', landSqWah: 70.9, facing: 'ตะวันออก', x: 4.19, y: 49.50, status: 'available' },
  { id: 'N09', zone: 'N', model: 'ZOTICUS', landSqWah: 73.0, facing: 'ตะวันออก', x: 3.65, y: 44.41, status: 'sold' },
  { id: 'N10', zone: 'N', model: 'ZOTICUS', landSqWah: 81.5, facing: 'ตะวันออก', x: 3.35, y: 39.14, isCorner: true, status: 'available' },
  { id: 'N11', zone: 'N', model: 'ZERA', landSqWah: 70.0, facing: 'ใต้', x: 7.78, y: 38.40, status: 'available' },
  { id: 'N12', zone: 'N', model: 'INIZIO', landSqWah: 64.1, facing: 'ใต้', x: 10.64, y: 37.88, status: 'available' },
  { id: 'N13', zone: 'N', model: 'ZERA', landSqWah: 64.8, facing: 'ใต้', x: 13.40, y: 37.43, status: 'available' },
  { id: 'N14', zone: 'N', model: 'INIZIO', landSqWah: 65.5, facing: 'ใต้', x: 16.19, y: 36.99, status: 'sold' },
  { id: 'N15', zone: 'N', model: 'INIZIO', landSqWah: 75.3, facing: 'ใต้', x: 19.07, y: 36.46, isCorner: true, status: 'available' },
];

interface OfficialPriceEntry {
  houseTypeCode: string;
  model: HouseModelId;
  houseNumber: string;
  minLc: number;
  totalPro: number;
  isShowHouse?: boolean;
}

const OFFICIAL_PRICE_SHEET: Record<string, OfficialPriceEntry> = {
  A01: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/1', minLc: 12100000, totalPro: 363837 },
  A02: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/2', minLc: 10800000, totalPro: 338474 },
  A03: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/3', minLc: 12700000, totalPro: 368829, isShowHouse: true },
  A04: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/4', minLc: 13500000, totalPro: 364178, isShowHouse: true },
  B02: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/11', minLc: 9300000, totalPro: 314690 },
  B06: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/32', minLc: 9400000, totalPro: 318714 },
  C10: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/42', minLc: 10000000, totalPro: 329674 },
  D01: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/43', minLc: 10600000, totalPro: 341146 },
  I12: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/101', minLc: 9100000, totalPro: 311682 },
  I13: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/102', minLc: 10100000, totalPro: 331546 },
  I14: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/103', minLc: 8000000, totalPro: 285518.5 },
  I15: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/104', minLc: 7100000, totalPro: 257868 },
  I16: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/105', minLc: 7000000, totalPro: 265150.5 },
  I17: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/106', minLc: 6900000, totalPro: 250972 },
  J01: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/89', minLc: 10400000, totalPro: 338197 },
  J02: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/88', minLc: 7900000, totalPro: 290818 },
  J03: { houseTypeCode: 'C50-SS11', model: 'ZERA', houseNumber: '9/87', minLc: 6400000, totalPro: 251299.5 },
  J04: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/86', minLc: 7900000, totalPro: 290818 },
  J05: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/85', minLc: 8600000, totalPro: 302866 },
  J06: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/84', minLc: 8600000, totalPro: 302866 },
  J09: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/81', minLc: 7900000, totalPro: 290818 },
  J10: { houseTypeCode: 'C50-SS11', model: 'ZERA', houseNumber: '9/80', minLc: 6400000, totalPro: 251299.5 },
  J11: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/79', minLc: 9200000, totalPro: 314338 },
  J12: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/78', minLc: 9400000, totalPro: 317922 },
  J13: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/111', minLc: 7000000, totalPro: 265582.5 },
  J14: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/110', minLc: 6400000, totalPro: 243740 },
  J15: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/109', minLc: 6400000, totalPro: 243740 },
  J16: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/108', minLc: 6600000, totalPro: 257118.5 },
  J17: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/107', minLc: 7400000, totalPro: 260796 },
  K02: { houseTypeCode: 'C51-S12', model: 'ABLE', houseNumber: '9/66', minLc: 7700000, totalPro: 281191 },
  K03: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/67', minLc: 8500000, totalPro: 301714 },
  K04: { houseTypeCode: 'C51-S12', model: 'ABLE', houseNumber: '9/68', minLc: 7700000, totalPro: 280903 },
  K05: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/69', minLc: 6500000, totalPro: 245892 },
  K06: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/70', minLc: 6500000, totalPro: 246036 },
  K07: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/71', minLc: 6700000, totalPro: 259486.5 },
  K08: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/72', minLc: 6600000, totalPro: 247252 },
  K09: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/73', minLc: 6700000, totalPro: 259702.5 },
  K10: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/74', minLc: 8600000, totalPro: 303578 },
  K11: { houseTypeCode: 'C50-SS11', model: 'ZERA', houseNumber: '9/75', minLc: 7000000, totalPro: 263203.5 },
  K12: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/76', minLc: 9300000, totalPro: 316346 },
  K13: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/77', minLc: 10700000, totalPro: 346093 },
  K14: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/112', minLc: 6800000, totalPro: 261494.5 },
  K15: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/113', minLc: 6400000, totalPro: 243740 },
  K16: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/114', minLc: 9500000, totalPro: 320434 },
  K17: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/115', minLc: 11600000, totalPro: 360781 },
  L01: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/116', minLc: 11400000, totalPro: 356549 },
  L02: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/117', minLc: 9200000, totalPro: 314410 },
  L03: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/118', minLc: 6400000, totalPro: 243740 },
  L04: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/119', minLc: 7200000, totalPro: 270030.5 },
  L05: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/120', minLc: 10400000, totalPro: 341941 },
  L06: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/121', minLc: 9000000, totalPro: 311906 },
  L07: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/122', minLc: 10900000, totalPro: 347301 },
  M01: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/123', minLc: 10100000, totalPro: 332461 },
  M02: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/124', minLc: 9300000, totalPro: 317786 },
  M03: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/125', minLc: 10300000, totalPro: 339285 },
  M04: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/126', minLc: 7600000, totalPro: 277270.5 },
  M05: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/127', minLc: 6700000, totalPro: 249908 },
  M06: { houseTypeCode: 'C63-S11', model: 'PHOENIX', houseNumber: '9/128', minLc: 6900000, totalPro: 263286.5 },
  M07: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/129', minLc: 11000000, totalPro: 349258 },
  N01: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/130', minLc: 8100000, totalPro: 298290 },
  N02: { houseTypeCode: 'C50-SS11', model: 'ZERA', houseNumber: '9/131', minLc: 6600000, totalPro: 255819.5 },
  N03: { houseTypeCode: 'C53-L12', model: 'LUKE', houseNumber: '9/132', minLc: 9500000, totalPro: 320434 },
  N04: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/133', minLc: 8300000, totalPro: 300290 },
  N05: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/134', minLc: 8200000, totalPro: 296338 },
  N06: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/135', minLc: 8200000, totalPro: 296338 },
  N07: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/136', minLc: 7900000, totalPro: 293338 },
  N08: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/137', minLc: 9900000, totalPro: 330893 },
  N09: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/138', minLc: 9800000, totalPro: 331405 },
  N10: { houseTypeCode: 'C54-XL12', model: 'ZOTICUS', houseNumber: '9/139', minLc: 10800000, totalPro: 347525 },
  N11: { houseTypeCode: 'C62-S11', model: 'ETHAN', houseNumber: '9/140', minLc: 7700000, totalPro: 269988 },
  N12: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/141', minLc: 8800000, totalPro: 307666 },
  N13: { houseTypeCode: 'C50-SS11', model: 'ZERA', houseNumber: '9/142', minLc: 7200000, totalPro: 267651.5 },
  N14: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/143', minLc: 9000000, totalPro: 310674 },
  N15: { houseTypeCode: 'C52-M12', model: 'INIZIO', houseNumber: '9/144', minLc: 9800000, totalPro: 325730 },
};

const SOLD_HOUSE_NUMBERS: Record<string, string> = {
  A05: '9/5',
  A06: '9/6',
  A07: '9/7',
  A08: '9/8',
  A09: '9/9',
  B01: '9/10',
  B03: '9/12',
  H01: '9/13',
  H02: '9/14',
  H03: '9/15',
  H04: '9/16',
  H05: '9/17',
  H06: '9/18',
  H07: '9/19',
  H08: '9/20',
  G01: '9/21',
  G02: '9/22',
  G03: '9/23',
  G04: '9/24',
  G05: '9/25',
  G06: '9/26',
  G07: '9/27',
  G08: '9/28',
  B04: '9/30',
  B05: '9/31',
  C01: '9/33',
  C02: '9/34',
  C03: '9/35',
  C04: '9/36',
  C05: '9/37',
  C06: '9/38',
  C07: '9/39',
  C08: '9/40',
  C09: '9/41',
  D02: '9/44',
  D03: '9/45',
  D04: '9/46',
  D05: '9/47',
  D06: '9/48',
  D07: '9/49',
  D08: '9/50',
  D09: '9/51',
  D10: '9/52',
  E01: '9/53',
  E02: '9/54',
  E03: '9/55',
  E04: '9/56',
  E05: '9/57',
  F01: '9/58',
  F02: '9/59',
  F03: '9/60',
  F04: '9/61',
  F05: '9/62',
  F06: '9/63',
  F07: '9/64',
  K01: '9/65',
  J08: '9/82',
  J07: '9/83',
  I01: '9/90',
  I02: '9/91',
  I03: '9/92',
  I04: '9/93',
  I05: '9/94',
  I06: '9/95',
  I07: '9/96',
  I08: '9/97',
  I09: '9/98',
  I10: '9/99',
  I11: '9/100',
};

function computeEstimatedPrice(seed: RawPlotSeed, model: HouseModelId): number {
  const spec = HOUSE_MODELS[model];
  const extraSqWah = Math.max(0, seed.landSqWah - spec.baseLandSqWah);
  // Extra land priced around 65,000 THB per sq.wah
  const landPremium = Math.round(extraSqWah * 65000);
  const cornerPremium = seed.isCorner ? 220000 : 0;
  const parkPremium = seed.nearPark ? 180000 : 0;
  const clubhousePremium = seed.nearClubhouse ? 250000 : 0;
  const raw = spec.basePriceTHB + landPremium + cornerPremium + parkPremium + clubhousePremium;
  // Round to neat 10,000 THB ending in 90,000 or 00,000
  return Math.round(raw / 10000) * 10000;
}

export const DEFAULT_PLOTS: PlotUnit[] = RAW_PLOTS.map((seed, index) => {
  const official = OFFICIAL_PRICE_SHEET[seed.id];
  const resolvedModel = official ? official.model : seed.model;
  const houseNo = official ? official.houseNumber : (SOLD_HOUSE_NUMBERS[seed.id] ?? `9/${index + 1}`);
  const price = official
    ? official.minLc + official.totalPro
    : computeEstimatedPrice(seed, resolvedModel);
  const status: PlotStatus = official
    ? official.isShowHouse
      ? 'showhouse'
      : 'available'
    : 'sold';

  const noteParts: string[] = [];
  if (official?.isShowHouse) noteParts.push('บ้านตัวอย่าง');
  if (seed.isCorner) noteParts.push('แปลงมุม');
  if (seed.nearPark) noteParts.push('ใกล้สวนส่วนกลาง');
  if (seed.nearClubhouse) noteParts.push('ใกล้คลับเฮาส์และทางเข้าโครงการ');

  return {
    id: seed.id,
    zone: seed.zone,
    houseNumber: houseNo,
    model: resolvedModel,
    houseTypeCode: official?.houseTypeCode,
    landSqWah: seed.landSqWah,
    price,
    minLc: official?.minLc,
    totalPro: official?.totalPro,
    hasOfficialPrice: Boolean(official),
    status,
    facing: seed.facing,
    x: seed.x,
    y: seed.y,
    isCorner: Boolean(seed.isCorner),
    nearPark: Boolean(seed.nearPark),
    nearClubhouse: Boolean(seed.nearClubhouse),
    note: noteParts.join(' · '),
  };
});

export const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
