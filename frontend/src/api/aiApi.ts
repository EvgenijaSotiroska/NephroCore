import axiosInstance from "../axios/axios";
import type { AIAnalysis } from "./types/ai";

const aiApi = {
  generateAnalysis: (patientId: string) =>
    axiosInstance.post<AIAnalysis>(`/patients/${patientId}/ai-analysis`),

  listAnalyses: (patientId: string) =>
    axiosInstance.get<AIAnalysis[]>(`/patients/${patientId}/ai-analysis`),

  explainResults: (patientId: string) =>
    axiosInstance.post<AIAnalysis>(`/patients/${patientId}/explain-results`),

  listExplanations: (patientId: string) =>
    axiosInstance.get<AIAnalysis[]>(`/patients/${patientId}/explain-results`),
};

export default aiApi;