import axiosInstance from "../axios/axios";
import type { PatientTrendsResponse } from "./types/trends";

/**
 * Fetch per-parameter time series for a patient's dashboard.
 * Backend: GET /patients/{patientId}/trends
 */
export async function fetchPatientTrends(patientId: string): Promise<PatientTrendsResponse> {
  const response = await axiosInstance.get<PatientTrendsResponse>(`/patients/${patientId}/trends`);
  return response.data;
}