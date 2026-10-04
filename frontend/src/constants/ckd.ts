import type { CKDStage } from "../api/types/cdkStage";
import type {
  CKDEtiology,
  DialysisModality,
  DialysisStatus,
} from "../api/types/patient";

export const STAGE_EGFR_RANGE_LABEL: Record<CKDStage, string> = {
  G1: "≥ 90",
  G2: "60–89",
  G3A: "45–59",
  G3B: "30–44",
  G4: "15–29",
  G5: "< 15",
};

// Full description (patient dashboard)
export const STAGE_DESCRIPTION: Record<CKDStage, string> = {
  G1: "Нормална или висока бубрежна функција",
  G2: "Благо намалена бубрежна функција",
  G3A: "Благо до умерено намалена бубрежна функција",
  G3B: "Умерено до тешко намалена бубрежна функција",
  G4: "Тешко намалена бубрежна функција",
  G5: "Бубрежна инсуфициенција",
};

// Short form (result entry forms)
export const STAGE_SHORT_LABELS: Record<CKDStage, string> = {
  G1: "Нормална или висока функција",
  G2: "Благо намалена функција",
  G3A: "Благо до умерено намалена функција",
  G3B: "Умерено до тешко намалена функција",
  G4: "Тешко намалена функција",
  G5: "Бубрежна инсуфициенција",
};

export const ETIOLOGY_LABELS: Record<CKDEtiology, string> = {
  diabetic_nephropathy: "Дијабетична нефропатија",
  hypertensive_nephropathy: "Хипертензивна нефропатија",
  glomerulonephritis: "Гломерулонефритис",
  polycystic_kidney_disease: "Полицистична болест на бубрезите",
  obstructive_uropathy: "Обструктивна уропатија",
  lupus_nephritis: "Лупус нефритис",
  iga_nephropathy: "IgA нефропатија",
  other: "Друго",
  unknown: "Непознато",
  none: "Нема заболување / Превентивен преглед",
};

export const DIALYSIS_STATUS_LABELS: Record<DialysisStatus, string> = {
  pre_dialysis: "Пред дијализа",
  on_dialysis: "На дијализа",
  post_transplant: "По трансплантација",
};

export const DIALYSIS_MODALITY_LABELS: Record<DialysisModality, string> = {
  hd: "Хемодијализа",
  pd: "Перитонеална дијализа",
};

function toOptions<T extends string>(
  order: T[],
  labels: Record<T, string>
): { value: T; label: string }[] {
  return order.map((value) => ({ value, label: labels[value] }));
}

export const ETIOLOGY_OPTIONS = toOptions<CKDEtiology>(
  [
    "diabetic_nephropathy",
    "hypertensive_nephropathy",
    "glomerulonephritis",
    "polycystic_kidney_disease",
    "obstructive_uropathy",
    "lupus_nephritis",
    "iga_nephropathy",
    "other",
    "unknown",
    "none",
  ],
  ETIOLOGY_LABELS
);

export const DIALYSIS_STATUS_OPTIONS = toOptions<DialysisStatus>(
  ["pre_dialysis", "on_dialysis", "post_transplant"],
  DIALYSIS_STATUS_LABELS
);

export const DIALYSIS_MODALITY_OPTIONS = toOptions<DialysisModality>(
  ["hd", "pd"],
  DIALYSIS_MODALITY_LABELS
);