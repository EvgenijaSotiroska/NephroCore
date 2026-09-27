import axiosInstance from "../axios/axios";
import type { AIAnalysisResponse } from "./types/ai";

const aiApi = {
  generateAnalysis: (patientId: string) =>
    axiosInstance.post<AIAnalysisResponse>(`/patients/${patientId}/ai-analysis`),
};

export default aiApi;