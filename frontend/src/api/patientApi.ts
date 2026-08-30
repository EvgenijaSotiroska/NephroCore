import axiosInstance from "../axios/axios";
import type { CreatePatientRequest, CreatePatientResponse, PatientProfile } from "./types/patient";

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
};

export default patientApi;