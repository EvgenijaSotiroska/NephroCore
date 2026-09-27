export type CKDStage = "G1" | "G2" | "G3A" | "G3B" | "G4" | "G5";

export interface TrendPoint {
  visit_id: string;
  date: string;
  value: number;
  ckd_stage: CKDStage;
}

export interface ParameterTrend {
  key: string;
  label: string;
  unit: string;
  category: string;
  scale: "linear" | "log";
  decimals: number;
  normal_range_low: number | null;
  normal_range_high: number | null;
  higher_is_worse: boolean;
  points: TrendPoint[];
  slope_per_year: number | null;
  latest_value: number | null;
  latest_date: string | null;
  is_out_of_range: boolean;
}

export interface PatientTrendsResponse {
  patient_id: string;
  current_ckd_stage: CKDStage | null;
  parameters: ParameterTrend[];
}