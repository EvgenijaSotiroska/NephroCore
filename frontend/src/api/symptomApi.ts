import axiosInstance from "../axios/axios";
import type {
  CreateSymptomRequest,
  SymptomResponse,
  UpdateSymptomRequest,
} from "./types/symptom";

const symptomApi = {
  list: async (patientId?: string) =>
    await axiosInstance.get<SymptomResponse[]>("/symptoms", {
      params: patientId ? { patient_id: patientId } : undefined,
    }),

  create: async (data: CreateSymptomRequest) =>
    await axiosInstance.post<SymptomResponse>("/symptoms", data),

  update: async (symptomId: string, data: UpdateSymptomRequest) =>
    await axiosInstance.put<SymptomResponse>(`/symptoms/${symptomId}`, data),

  remove: async (symptomId: string) =>
    await axiosInstance.delete(`/symptoms/${symptomId}`),
};

export default symptomApi;