export interface CreatePatientRequest {
  full_name: string;
  date_of_birth?: string | null;
  previous_conditions?: string | null;
  genetic_risk_factors?: string | null;
  comorbidities?: Record<string, boolean> | null;
  current_medications?: { name: string; dose?: string }[] | null;
  allergies?: string | null;
  smoking?: boolean | null;
  alcohol?: boolean | null;
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
  date_of_birth: string | null;
  previous_conditions: string | null;
  genetic_risk_factors: string | null;
  comorbidities: Record<string, boolean> | null;
  current_medications: { name: string; dose?: string }[] | null;
  allergies: string | null;
  smoking: boolean | null;
  alcohol: boolean | null;
  is_activated: boolean;
}