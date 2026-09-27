import axiosInstance from "../axios/axios.ts";
import type { CKDStage } from "./types/cdkStage.ts";
import type {
  StageParametersResponse,
  CreateVisitRequest,
  UpdateVisitRequest,
  VisitResponse,
  VisitListResponse, ParameterDefinition,
} from "./types/result";

const resultsApi = {
  getParameters: () =>
    axiosInstance.get<StageParametersResponse[]>("/results/parameters"),

  getStageParameters: (stage: CKDStage) =>
    axiosInstance.get<StageParametersResponse>(`/results/parameters/${stage}`),

  getSuggestedStage: (patientId: string) =>
    axiosInstance.get<CKDStage>(`/results/patient/${patientId}/suggested-stage`),

  create: (payload: CreateVisitRequest) =>
    axiosInstance.post<VisitResponse>("/results", payload),

  listForPatient: (patientId: string) =>
    axiosInstance.get<VisitListResponse>(`/results/patient/${patientId}`),

  get: (visitId: string) =>
    axiosInstance.get<VisitResponse>(`/results/${visitId}`),

  update: (visitId: string, payload: UpdateVisitRequest) =>
    axiosInstance.put<VisitResponse>(`/results/${visitId}`, payload),

  remove: (visitId: string) => axiosInstance.delete(`/results/${visitId}`),

  getAllParameters: () =>
    axiosInstance.get<ParameterDefinition[]>("/results/parameters/all"),
};

export default resultsApi;