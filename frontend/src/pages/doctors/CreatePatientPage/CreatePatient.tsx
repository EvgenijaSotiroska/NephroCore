import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { usePatients } from "../../../hooks/usePatients.ts";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
  PatientProfile,
} from "../../../api/types/patient.ts";
import { joinCodedList } from "../../../utils/patient.ts";
import BasicInfoSection from "../../../components/doctor/PatientForm/BasicInfoSection.tsx";
import ClinicalHistorySection from "../../../components/doctor/PatientForm/ClinicalHistorySection.tsx";
import CkdSection from "../../../components/doctor/PatientForm/CkdSection.tsx";
import DialysisSection from "../../../components/doctor/PatientForm/DialysisSection.tsx";
import InviteCodeCard from "../../../components/doctor/InviteCodeCard/InviteCodeCard.tsx";
import { emptyLists, listsFromProfile, type ClinicalLists } from "../../../components/doctor/PatientForm/patientForm.ts";
import "./CreatePatient.css";

const initialForm: CreatePatientRequest = {
  full_name: "",
  date_of_birth: "",
  sex: "male",
  height_cm: null,

  previous_conditions: "",
  genetic_risk_factors: "",
  comorbidities: "",
  current_medications: "",

  smoking: false,

  ckd_etiology: null,
  diagnosis_date: "",
  baseline_egfr: null,

  dialysis_status: "pre_dialysis",
  dialysis_modality: null,
};

// Edit mode: fill the form with the patient's saved values. The four checkbox lists
// (history, risk factors, comorbidities, medications) are filled separately below.
function formFromProfile(profile: PatientProfile): CreatePatientRequest {
  return {
    ...initialForm,
    full_name: profile.full_name,
    date_of_birth: profile.date_of_birth ?? "",
    sex: profile.sex,
    height_cm: profile.height_cm === null ? null : Number(profile.height_cm),
    smoking: profile.smoking,
    ckd_etiology: profile.ckd_etiology,
    diagnosis_date: profile.diagnosis_date ?? "",
    baseline_egfr: profile.baseline_egfr === null ? null : Number(profile.baseline_egfr),
    dialysis_status: profile.dialysis_status,
    dialysis_modality: profile.dialysis_modality,
  };
}

interface CreatePatientProps {
  // Set when editing: the form starts with this patient's values and saves them back.
  existing?: PatientProfile;
}

export default function CreatePatient({ existing }: CreatePatientProps) {
  const [form, setForm] =
    useState<CreatePatientRequest>(existing ? formFromProfile(existing) : initialForm);

  const [result, setResult] =
    useState<CreatePatientResponse | null>(null);

  const [lists, setLists] = useState<ClinicalLists>(listsFromProfile(existing));

  function setList(key: keyof ClinicalLists, values: string[]) {
    setLists((prev) => ({ ...prev, [key]: values }));
  }


  const { createPatient, creating, updatePatient, updating } = usePatients();
  const navigate = useNavigate();

  function update<K extends keyof CreatePatientRequest>(
    field: K
  ) {
    return (
      e: ChangeEvent<
        HTMLInputElement |
          HTMLTextAreaElement |
          HTMLSelectElement
      >
    ) => {
      const target = e.target;

      let value: string | number | boolean | null =
        target.value;

      if (
        target instanceof HTMLInputElement &&
        target.type === "checkbox"
      ) {
        value = target.checked;
      }

      if (
        target instanceof HTMLInputElement &&
        target.type === "number"
      ) {
        value =
          target.value === ""
            ? null
            : Number(target.value);
      }

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setResult(null);

    const payload: CreatePatientRequest = {
      ...form,

      date_of_birth:
        form.date_of_birth || null,

      diagnosis_date:
        form.diagnosis_date || null,

      height_cm:
        form.height_cm ?? null,

      baseline_egfr:
        form.baseline_egfr ?? null,

      ckd_etiology:
        form.ckd_etiology || null,

      previous_conditions:
        joinCodedList(lists.previous_conditions),

      genetic_risk_factors:
        joinCodedList(lists.genetic_risk_factors),

      comorbidities:
        joinCodedList(lists.comorbidities),

      current_medications:
        joinCodedList(lists.current_medications),

      dialysis_modality:
        form.dialysis_status === "on_dialysis"
          ? form.dialysis_modality
          : null,
    };

    if (existing) {
      const saved = await updatePatient(existing.id, payload);
      if (saved) navigate(`/patients/${existing.id}/trends`);
      return;
    }

    const data = await createPatient(payload);

    if (data) {
      setResult(data);
      setForm(initialForm);

      setLists(emptyLists);
    }
  }

  return (
    <div className="create-patient-page">

      {/* ==================== PAGE HEADER ==================== */}

      <div className="create-patient-header">
        <h2>{existing ? "Измени профил на пациент" : "Креирај нов пациент"}</h2>

        <p>
          Пополнете ги информациите. Полињата со * се задолжителни.
        </p>
      </div>

      <form
        className="create-patient-form"
        onSubmit={handleSubmit}
      >

        {/* ==================== BASIC INFORMATION ==================== */}

        <BasicInfoSection form={form} update={update} />

        {/* ==================== CLINICAL HISTORY ==================== */}

        <ClinicalHistorySection
          form={form}
          update={update}
          lists={lists}
          onListChange={setList}
        />

        {/* ==================== CKD ==================== */}

        <CkdSection form={form} update={update} />

        {/* ==================== DIALYSIS ==================== */}

        <DialysisSection form={form} update={update} />

        {/* ==================== SUBMIT ==================== */}

        <button
          type="submit"
          className="create-patient-button"
          disabled={creating || updating}
        >
          {existing
            ? (updating ? "Зачувување..." : "Зачувај промени")
            : (creating ? "Креирање..." : "Креирај пациент и генерирај код за покана")}
        </button>

        {existing && (
          <Link to={`/patients/${existing.id}/trends`} className="create-patient-cancel">
            Откажи
          </Link>
        )}

      </form>

      {/* ==================== SUCCESS ==================== */}

      {result && <InviteCodeCard result={result} />}

    </div>
  );
}