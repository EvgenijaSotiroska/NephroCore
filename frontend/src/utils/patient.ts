import { CODED_LIST_SEPARATOR, type CheckboxOption } from "../constants/clinical";
import type { CKDStage } from "../api/types/ckdStage";
import type { PatientProfile } from "../api/types/patient";
import type { ParameterTrend } from "../api/types/trends";

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

/** The opposite of joinCodedList: "a|b" -> ["a", "b"] (used to fill the edit form). */
export function splitCodedList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(CODED_LIST_SEPARATOR)
    .map((code) => code.trim())
    .filter(Boolean);
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

export type ResultStatus = "ok" | "low" | "high" | "none";

/** Where a lab value sits against the normal range of its parameter. */
export function getStatus(value: number, param: ParameterTrend): ResultStatus {
  const lo = param.normal_range_low;
  const hi = param.normal_range_high;
  if (lo === null && hi === null) return "none";
  if (lo !== null && value < lo) return "low";
  if (hi !== null && value > hi) return "high";
  return "ok";
}
