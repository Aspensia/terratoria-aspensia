export type Body = "earth" | "moon" | "mars";

export type DimensionId =
  | "terrain"
  | "geology"
  | "thermal"
  | "water_ice"
  | "dust_wind"
  | "biology"
  | "subsurface"
  | "operations";

export const DIMENSIONS: DimensionId[] = [
  "terrain",
  "geology",
  "thermal",
  "water_ice",
  "dust_wind",
  "biology",
  "subsurface",
  "operations",
];

export interface TerrainMetrics {
  windowKm: number;
  baselineM: number;
  validFraction: number;
  slopeBinsDeg: number[];
  slopeHist: number[];
  slopeMedianDeg: number;
  slopeP90Deg: number;
  reliefM: number;
  roughnessM: number;
  hypsometricIntegral: number;
  profile: { distKm: number[]; elevM: number[] };
  product?: string;
  url?: string;
  retrieved?: string;
}

export interface Climate {
  meanK: number;
  maxK: number;
  minK: number;
  windMs?: number;
  basis: "measured" | "literature";
  cite: string;
}

export interface TagSet {
  tags: string[];
  cites: string[];
  note?: string;
}

export type Status = "established" | "documented" | "candidate" | "unverified";

export interface Place {
  id: string;
  body: Body;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  category: string;
  summary: string;
  status?: Status;
  statusCite?: string;
  terrain?: TerrainMetrics;
  climate?: Climate;
  attributes: Partial<Record<DimensionId, TagSet>>;
  useCases?: { title: string; because: DimensionId[] }[];
  differences?: string[];
}

export type Basis = "measured" | "literature" | "mixed" | "none";

export interface DimensionResult {
  id: DimensionId;
  score: number | null;
  quality: number;
  basis: Basis;
  method: string;
  evidence: string[];
}

export interface Aggregate {
  index: number | null;
  coverage: number;
  valid: number;
}

export type Weights = Record<DimensionId, number>;
