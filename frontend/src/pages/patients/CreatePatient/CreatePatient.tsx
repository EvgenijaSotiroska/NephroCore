import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { usePatients } from "../../../hooks/usePatients";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
  PatientProfile,
} from "../../../api/types/patient";
import {
  ETIOLOGY_OPTIONS,
  DIALYSIS_STATUS_OPTIONS,
  DIALYSIS_MODALITY_OPTIONS,
  PREVIOUS_CONDITIONS,
  GENETIC_RISK_FACTORS,
  COMORBIDITIES,
  CURRENT_MEDICATIONS,
  type CheckboxOption,
} from "../../../constants";
import { formatLongDate } from "../../../utils/date";
import { joinCodedList, splitCodedList } from "../../../utils/patient";
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

interface CheckboxGroupProps {
  title: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

function CheckboxGroup({
  title,
  options,
  selectedValues,
  onChange,
}: CheckboxGroupProps) {
  function handleChange(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  return (
    <div className="checkbox-group">
      <label className="checkbox-group-title">{title}</label>

      <div className="checkbox-grid">
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={`checkbox-option ${
                checked ? "checkbox-option-selected" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleChange(option.value)}
              />

              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
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

  const [previousConditions, setPreviousConditions] =
    useState<string[]>(splitCodedList(existing?.previous_conditions));

  const [geneticRiskFactors, setGeneticRiskFactors] =
    useState<string[]>(splitCodedList(existing?.genetic_risk_factors));

  const [comorbidities, setComorbidities] =
    useState<string[]>(splitCodedList(existing?.comorbidities));

  const [currentMedications, setCurrentMedications] =
    useState<string[]>(splitCodedList(existing?.current_medications));


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
        joinCodedList(previousConditions),

      genetic_risk_factors:
        joinCodedList(geneticRiskFactors),

      comorbidities:
        joinCodedList(comorbidities),

      current_medications:
        joinCodedList(currentMedications),

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

      setPreviousConditions([]);
      setGeneticRiskFactors([]);
      setComorbidities([]);
      setCurrentMedications([]);
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

        <section className="form-section">

          <div className="form-section-header">
            <div className="form-section-icon">
              👤
            </div>

            <div>
              <h3 className="form-section-title">
                Основни информации
              </h3>

              <p className="form-section-subtitle">
                Лични податоци на пациентот
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field full-width">
              <label htmlFor="full_name">
                Име и презиме{" "}
                <span className="required">*</span>
              </label>

              <input
                id="full_name"
                type="text"
                placeholder="Внесете име и презиме"
                value={form.full_name}
                onChange={update("full_name")}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="date_of_birth">
                Датум на раѓање
              </label>

              <input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth ?? ""}
                onChange={update("date_of_birth")}
              />
            </div>

            <div className="form-field">
              <label htmlFor="sex">
                Пол <span className="required">*</span>
              </label>

              <select
                id="sex"
                value={form.sex}
                onChange={update("sex")}
                required
              >
                <option value="male">
                  Машки
                </option>

                <option value="female">
                  Женски
                </option>
              </select>
            </div>

            <div className="form-field full-width">
              <label htmlFor="height_cm">
                Висина (cm)
              </label>

              <input
                id="height_cm"
                type="number"
                min="0"
                step="0.1"
                placeholder="Внесете висина"
                value={form.height_cm ?? ""}
                onChange={update("height_cm")}
              />
            </div>

          </div>
        </section>

        {/* ==================== CLINICAL HISTORY ==================== */}

        <section className="form-section">

          <div className="form-section-header">
            <div className="form-section-icon">
              🩺
            </div>

            <div>
              <h3 className="form-section-title">
                Клиничка историја
              </h3>

              <p className="form-section-subtitle">
                Дополнителни медицински информации
              </p>
            </div>
          </div>

          <div className="clinical-checkboxes">

            <CheckboxGroup
              title="Претходни заболувања"
              options={PREVIOUS_CONDITIONS}
              selectedValues={previousConditions}
              onChange={setPreviousConditions}
            />

            <CheckboxGroup
              title="Генетски ризик фактори"
              options={GENETIC_RISK_FACTORS}
              selectedValues={geneticRiskFactors}
              onChange={setGeneticRiskFactors}
            />

            <CheckboxGroup
              title="Коморбидитети"
              options={COMORBIDITIES}
              selectedValues={comorbidities}
              onChange={setComorbidities}
            />

            <CheckboxGroup
              title="Тековна терапија"
              options={CURRENT_MEDICATIONS}
              selectedValues={currentMedications}
              onChange={setCurrentMedications}
            />

            <div className="lifestyle-checkboxes">

              <div className="checkbox-field">
                <input
                  id="smoking"
                  type="checkbox"
                  checked={!!form.smoking}
                  onChange={update("smoking")}
                />

                <label htmlFor="smoking">
                  Пушење
                </label>
              </div>

            </div>

          </div>
        </section>

        {/* ==================== CKD ==================== */}

        <section className="form-section">

          <div className="form-section-header">
            <div className="form-section-icon">
              🫘
            </div>

            <div>
              <h3 className="form-section-title">
                Хронична бубрежна болест
              </h3>

              <p className="form-section-subtitle">
                Податоци поврзани со ХББ
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field full-width">
              <label htmlFor="ckd_etiology">
                Причина за хронична бубрежна болест
              </label>

              <select
                id="ckd_etiology"
                value={form.ckd_etiology ?? ""}
                onChange={update("ckd_etiology")}
              >
                <option value="">
                  Не е наведено
                </option>

                {ETIOLOGY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="diagnosis_date">
                Датум на дијагностицирање
              </label>

              <input
                id="diagnosis_date"
                type="date"
                value={form.diagnosis_date ?? ""}
                onChange={update("diagnosis_date")}
              />
            </div>

            <div className="form-field">
              <label htmlFor="baseline_egfr">
                Почетен eGFR
              </label>

              <input
                id="baseline_egfr"
                type="number"
                min="0"
                step="0.01"
                placeholder="Внесете eGFR"
                value={form.baseline_egfr ?? ""}
                onChange={update("baseline_egfr")}
              />

              <span className="field-hint">
                mL/min/1.73m²
              </span>
            </div>

          </div>
        </section>

        {/* ==================== DIALYSIS ==================== */}

        <section className="form-section">

          <div className="form-section-header">
            <div className="form-section-icon">
              💧
            </div>

            <div>
              <h3 className="form-section-title">
                Дијализа
              </h3>

              <p className="form-section-subtitle">
                Информации за статусот на дијализа
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="dialysis_status">
                Статус на дијализа
              </label>

              <select
                id="dialysis_status"
                value={form.dialysis_status}
                onChange={update("dialysis_status")}
              >
                {DIALYSIS_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.dialysis_status === "on_dialysis" && (
              <div className="form-field">

                <label htmlFor="dialysis_modality">
                  Вид на дијализа
                </label>

                <select
                  id="dialysis_modality"
                  value={form.dialysis_modality ?? ""}
                  onChange={update("dialysis_modality")}
                  required
                >
                  <option value="">
                    Изберете вид
                  </option>

                  {DIALYSIS_MODALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

              </div>
            )}

          </div>
        </section>

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

      {result && (
        <div className="patient-success">

          <p>
            Профилот за{" "}
            <strong>{result.full_name}</strong>{" "}
            е успешно креиран.
          </p>

          <p>
            Код за покана (споделете го со пациентот,
            истекува на{" "}
            {formatLongDate(result.invite_code_expires_at)}
            ):
          </p>

          <code>
            {result.invite_code}
          </code>

        </div>
      )}

    </div>
  );
}