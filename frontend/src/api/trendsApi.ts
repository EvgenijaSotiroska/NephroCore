import axiosInstance from "../axios/axios";
import type { PatientTrendsResponse } from "./types/trends";

const trendsApi = {
  getPatientTrends: (patientId: string) =>
    axiosInstance.get<PatientTrendsResponse>(`/patients/${patientId}/trends`),
};

export default trendsApi;