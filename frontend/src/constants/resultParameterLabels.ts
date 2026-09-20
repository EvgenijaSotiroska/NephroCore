import type { CKDStage } from "../api/types/cdkStage.ts";

export interface ParameterLabel {
  label_mk: string;
  unit: string;
  reference_mk: string;
}

export const PARAMETER_LABELS: Record<string, ParameterLabel> = {
  egfr: {
    label_mk: "eGFR",
    unit: "mL/min/1.73m2",
    reference_mk: "≥ 60",
  },
  creatinine: {
    label_mk: "Креатинин",
    unit: "µmol/L",
    reference_mk: "62–106",
  },
  acr: {
    label_mk: "ACR (протеини/урина)",
    unit: "mg/mmol",
    reference_mk: "< 3",
  },
  bp_systolic: {
    label_mk: "Крвен притисок — сист.",
    unit: "mmHg",
    reference_mk: "< 140",
  },
  bp_diastolic: {
    label_mk: "Крвен притисок — диј.",
    unit: "mmHg",
    reference_mk: "< 90",
  },
  phosphate: {
    label_mk: "Фосфати",
    unit: "mmol/L",
    reference_mk: "0.81–1.45",
  },
  calcium: {
    label_mk: "Калциум",
    unit: "mmol/L",
    reference_mk: "2.10–2.60",
  },
  hemoglobin: {
    label_mk: "Хемоглобин",
    unit: "g/L",
    reference_mk: "120–160",
  },
  potassium: {
    label_mk: "Калиум",
    unit: "mmol/L",
    reference_mk: "3.5–5.1",
  },
  pth: {
    label_mk: "ПТХ (паратхормон)",
    unit: "pg/mL",
    reference_mk: "15–65",
  },
  bicarbonate: {
    label_mk: "Бикарбонати (HCO3-)",
    unit: "mmol/L",
    reference_mk: "22–29",
  },
  urea: {
    label_mk: "Уреа",
    unit: "mmol/L",
    reference_mk: "2.5–7.1",
  },
  albumin: {
    label_mk: "Албумини (серум)",
    unit: "g/L",
    reference_mk: "35–50",
  },
};

export const STAGE_LABELS_MK: Record<CKDStage, string> = {
  G1: "Нормална или висока функција",
  G2: "Благо намалена функција",
  G3A: "Благо до умерено намалена функција",
  G3B: "Умерено до тешко намалена функција",
  G4: "Тешко намалена функција",
  G5: "Бубрежна инсуфициенција",
};

export const STAGE_EGFR_RANGE_LABEL: Record<CKDStage, string> = {
  G1: "≥ 90",
  G2: "60–89",
  G3A: "45–59",
  G3B: "30–44",
  G4: "15–29",
  G5: "< 15",
};