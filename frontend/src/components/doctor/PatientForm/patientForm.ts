import type { ChangeEvent } from "react";
import type { CreatePatientRequest, PatientProfile } from "../../../api/types/patient.ts";
import { splitCodedList } from "../../../utils/patient.ts";

/** `update("field")` returns the onChange handler that writes one field of the form. */
export type FieldUpdater = <K extends keyof CreatePatientRequest>(
  field: K
) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

/** What every section of the form receives. */
export interface SectionProps {
  form: CreatePatientRequest;
  update: FieldUpdater;
}

/** The three checkbox lists, kept as arrays of codes while the form is open. */
export interface ClinicalLists {
  previous_conditions: string[];
  comorbidities: string[];
  current_medications: string[];
}

export const emptyLists: ClinicalLists = {
  previous_conditions: [],
  comorbidities: [],
  current_medications: [],
};

export function listsFromProfile(profile?: PatientProfile): ClinicalLists {
  return {
    previous_conditions: splitCodedList(profile?.previous_conditions),
    comorbidities: splitCodedList(profile?.comorbidities),
    current_medications: splitCodedList(profile?.current_medications),
  };
}
