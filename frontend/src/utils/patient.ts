import { CODED_LIST_SEPARATOR, type CheckboxOption } from "../constants/clinical";
import type { CKDStage } from "../api/types/cdkStage";
import type { PatientProfile } from "../api/types/patient";

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

export function stageFromEgfr(egfr: number | string | null | undefined): CKDStage | null {
  if (egfr === null || egfr === undefined) return null;
  const value = Number(egfr);
  if (Number.isNaN(value)) return null;
  if (value >= 90) return "G1";
  if (value >= 60) return "G2";
  if (value >= 45) return "G3A";
  if (value >= 30) return "G3B";
  if (value >= 15) return "G4";
  return "G5";
}

export function getPatientName(patients: PatientProfile[], patientId: string): string {
  return patients.find((patient) => patient.id === patientId)?.full_name ?? "Непознат пациент";
}

export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}