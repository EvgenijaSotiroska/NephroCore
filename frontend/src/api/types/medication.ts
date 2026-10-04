export interface MedicationResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  name: string;
  description: string | null;
  dose: string;
  times: string[]; // "HH:MM", sorted
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicationRequest {
  patient_id: string;
  name: string;
  description?: string | null;
  dose: string;
  times: string[];
  is_active?: boolean;
}

export interface UpdateMedicationRequest {
  name?: string;
  description?: string | null;
  dose?: string;
  times?: string[];
  is_active?: boolean;
}