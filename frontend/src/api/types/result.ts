import type { CKDStage } from "./cdkStage.ts";

export interface ParameterDefinition {
  key: string;
  value_type: "float" | "int";
}

export interface StageParametersResponse {
  stage: CKDStage;
  parameters: ParameterDefinition[];
}


export interface LabResultPayload {
  [key: string]: number | null | undefined;
}

export interface CreateVisitRequest {
  patient_id: string;
  visit_date: string; // YYYY-MM-DD
  ckd_stage: CKDStage;
  notes?: string;
  lab_result: LabResultPayload;
}

export type UpdateVisitRequest = Partial<Omit<CreateVisitRequest, "patient_id">>;

export interface LabResultResponse extends LabResultPayload {
  id: string;
}

export interface VisitResponse {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  ckd_stage: CKDStage;
  notes?: string | null;
  created_at: string;
  lab_result: LabResultResponse | null;
}

export interface VisitListResponse {
  visits: VisitResponse[];
  total: number;
}