import axiosInstance from "../axios/axios";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
  PatientProfile,
  UpdatePatientRequest,
} from "./types/patient";

const patientApi = {
  create: async (data: CreatePatientRequest) => {
    return await axiosInstance.post<CreatePatientResponse>("/patients", data);
  },
  list: async () => {
    return await axiosInstance.get<PatientProfile[]>("/patients");
  },
  getMine: async () => {
    return await axiosInstance.get<PatientProfile>("/patients/me");
  },
  getById: async (patientId: string) => {
    return await axiosInstance.get<PatientProfile>(`/patients/${patientId}`);
  },
  // Doctor: edit a patient's profile.
  update: async (patientId: string, data: UpdatePatientRequest) => {
    return await axiosInstance.patch<PatientProfile>(`/patients/${patientId}`, data);
  },
  // Doctor: replace the activation code of a patient who has not activated yet.
  regenerateInviteCode: async (patientId: string) => {
    return await axiosInstance.post<PatientProfile>(`/patients/${patientId}/invite-code`);
  },
  // Doctor: mark a patient active (followed) or inactive (kept on record).
  setStatus: async (patientId: string, isActive: boolean) => {
    return await axiosInstance.patch<PatientProfile>(`/patients/${patientId}/status`, {
      is_active: isActive,
    });
  },
};

export default patientApi;