import type { SymptomIntensity } from "../api/types/symptom";

export const INTENSITY_LABELS: Record<SymptomIntensity, string> = {
  small: "Слаба",
  medium: "Умерена",
  large: "Силна",
};

export const SYMPTOM_INTENSITIES = Object.keys(INTENSITY_LABELS) as SymptomIntensity[];