export type Sex = "male" | "female";

export type CKDEtiology =
  | "diabetic_nephropathy"
  | "hypertensive_nephropathy"
  | "glomerulonephritis"
  | "polycystic_kidney_disease"
  | "obstructive_uropathy"
  | "lupus_nephritis"
  | "iga_nephropathy"
  | "other"
  | "unknown";

export type DialysisStatus =
  | "pre_dialysis"
  | "on_dialysis"
  | "post_transplant";

export type DialysisModality = "hd" | "pd";

export interface CreatePatientRequest {
  full_name: string;

  // Demographics
  date_of_birth?: string | null;
  sex: Sex;
  height_cm?: number | null;

  // Clinical history
  previous_conditions?: string | null;
  genetic_risk_factors?: string | null;
  comorbidities?: string | null;
  current_medications?: string | null;
  smoking?: boolean | null;

  // CKD-specific
  ckd_etiology?: CKDEtiology | null;
  diagnosis_date?: string | null;
  baseline_egfr?: number | null;

  dialysis_status?: DialysisStatus;
  dialysis_modality?: DialysisModality | null;
}

export interface CreatePatientResponse {
  id: string;
  full_name: string;
  invite_code: string;
  invite_code_expires_at: string;
}

export interface PatientProfile {
  id: string;
  full_name: string;

  // Demographics
  date_of_birth: string | null;
  sex: Sex;
  height_cm: number | null;

  // Clinical history
  previous_conditions: string | null;
  genetic_risk_factors: string | null;
  comorbidities: string | null;
  current_medications: string | null;
  smoking: boolean | null;

  // CKD-specific
  ckd_etiology: CKDEtiology | null;
  diagnosis_date: string | null;
  baseline_egfr: number | null;

  dialysis_status: DialysisStatus;
  dialysis_modality: DialysisModality | null;

  is_activated: boolean;
}