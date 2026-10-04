import axiosInstance from "../axios/axios";
import type {
  CreateMedicationRequest,
  MedicationResponse,
  UpdateMedicationRequest,
} from "./types/medication";

const medicationApi = {
  list: async (patientId?: string) =>
    await axiosInstance.get<MedicationResponse[]>("/medications", {
      params: patientId ? { patient_id: patientId } : undefined,
    }),

  create: async (data: CreateMedicationRequest) =>
    await axiosInstance.post<MedicationResponse>("/medications", data),

  update: async (medicationId: string, data: UpdateMedicationRequest) =>
    await axiosInstance.put<MedicationResponse>(`/medications/${medicationId}`, data),

  remove: async (medicationId: string) =>
    await axiosInstance.delete(`/medications/${medicationId}`),
};

export default medicationApi;