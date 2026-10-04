export type SymptomIntensity = "small" | "medium" | "large";

export interface CreateSymptomRequest {
  patient_id?: string;
  symptom_date: string;
  description: string;
  intensity: SymptomIntensity;
}

export interface UpdateSymptomRequest {
  symptom_date?: string;
  description?: string;
  intensity?: SymptomIntensity;
}

export interface SymptomResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  symptom_date: string;
  description: string;
  intensity: SymptomIntensity;
  created_at: string;
  updated_at: string;
}