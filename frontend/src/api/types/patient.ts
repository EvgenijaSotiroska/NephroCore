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
  | "unknown"
  | "none";

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

// Edit a profile: only the fields that are sent are changed, null clears an optional field.
export type UpdatePatientRequest = Partial<CreatePatientRequest>;

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

  // true: currently followed. false: kept on record (e.g. switched doctor), no new data is added.
  is_active: boolean;
}