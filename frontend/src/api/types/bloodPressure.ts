export interface CreateBloodPressureRequest {
  reading_date: string; // YYYY-MM-DD
  systolic: number;
  diastolic: number;
}

export interface BloodPressureResponse {
  id: string;
  patient_id: string;
  reading_date: string;
  systolic: number;
  diastolic: number;
  created_at: string;
}
