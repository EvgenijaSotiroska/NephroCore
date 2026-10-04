import { CODED_LIST_SEPARATOR, type CheckboxOption } from "../constants/clinical";

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function stageTone(stage: string | null | undefined): "good" | "warn" | "alert" {
  if (stage === "G1" || stage === "G2") return "good";
  if (stage === "G3A" || stage === "G3B") return "warn";
  return "alert";
}

export function joinCodedList(values: string[]): string {
  return values.join(CODED_LIST_SEPARATOR);
}

export function formatCodedList(
  raw: string | null | undefined,
  options: CheckboxOption[]
): string | null {
  if (!raw) return null;

  const labels = raw
    .split(CODED_LIST_SEPARATOR)
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => options.find((option) => option.value === code)?.label ?? code);

  return labels.length > 0 ? labels.join(", ") : null;
}