import axiosInstance from "../axios/axios";
import type { BloodPressureResponse, CreateBloodPressureRequest } from "./types/bloodPressure";

const bloodPressureApi = {
  // Patients: call with no argument. Doctors: pass the patient's id and get the readings
  // since that patient's latest visit.
  list: async (patientId?: string) =>
    await axiosInstance.get<BloodPressureResponse[]>("/blood-pressure", {
      params: patientId ? { patient_id: patientId } : undefined,
    }),

  create: async (data: CreateBloodPressureRequest) =>
    await axiosInstance.post<BloodPressureResponse>("/blood-pressure", data),

  remove: async (readingId: string) => await axiosInstance.delete(`/blood-pressure/${readingId}`),
};

export default bloodPressureApi;
