export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export interface CreateAppointmentRequest {
  patient_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  appointment_type?: string | null;
  notes?: string | null;
}

export interface UpdateAppointmentRequest {
  scheduled_at?: string;
  duration_minutes?: number;
  appointment_type?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface AppointmentResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}