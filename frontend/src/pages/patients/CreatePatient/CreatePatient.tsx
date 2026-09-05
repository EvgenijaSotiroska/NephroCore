import { useState, type ChangeEvent, type FormEvent } from "react";
import { usePatients } from "../../../hooks/usePatients";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
} from "../../../api/types/patient";
import "./CreatePatient.css";

interface CheckboxOption {
  value: string;
  label: string;
}

const PREVIOUS_CONDITIONS: CheckboxOption[] = [
  {
    value: "acute_kidney_injury",
    label: "Акутно оштетување на бубрезите (AKI)",
  },
  {
    value: "recurrent_utis_pyelo",
    label: "Рекурентни уринарни инфекции / пиелонефритис",
  },
  {
    value: "kidney_stones",
    label: "Камења во бубрезите (нефролитијаза)",
  },
  {
    value: "prior_glomerulonephritis",
    label: "Претходен епизоден гломерулонефритис",
  },
  {
    value: "single_kidney_nephrectomy",
    label: "Еден бубрег / нефректомија",
  },
  {
    value: "cardiovascular_disease",
    label:
      "Кардиоваскуларна болест (инфаркт, срцева слабост, мозочен удар)",
  },
];

const GENETIC_RISK_FACTORS: CheckboxOption[] = [
  {
    value: "family_history_ckd_kidney_failure_dialysis",
    label: "Семејна историја на ХББ / бубрежна слабост / дијализа",
  },
  {
    value: "family_history_pckd",
    label: "Семејна историја на полицистична бубрежна болест",
  },
  {
    value: "family_history_diabetes",
    label: "Семејна историја на дијабетес",
  },
  {
    value: "family_history_hypertension",
    label: "Семејна историја на хипертензија",
  },
  {
    value: "alport_syndrome_family_history",
    label: "Алпортов синдром (семејна историја)",
  },
  {
    value: "apol1_high_risk_variant",
    label: "APOL1 варијанта со висок ризик",
  },
];

const COMORBIDITIES: CheckboxOption[] = [
  {
    value: "type_1_diabetes",
    label: "Дијабетес тип 1",
  },
  {
    value: "type_2_diabetes",
    label: "Дијабетес тип 2",
  },
  {
    value: "hypertension",
    label: "Хипертензија",
  },
  {
    value: "obesity",
    label: "Дебелина",
  },
  {
    value: "liver_disease",
    label: "Заболување на црниот дроб",
  },
  {
    value: "thyroid_disease",
    label: "Заболување на тироидната жлезда",
  },
];

const CURRENT_MEDICATIONS: CheckboxOption[] = [
  {
    value: "ace_inhibitors_arbs",
    label: "ACE инхибитори / ARB",
  },
  {
    value: "diuretics",
    label: "Диуретици",
  },
  {
    value: "nsaids",
    label: "NSAID лекови",
  },
  {
    value: "phosphate_binders",
    label: "Фосфатни врзувачи",
  },
  {
    value: "erythropoiesis_stimulating_agents",
    label: "Стимулатори на еритропоезата (EPO)",
  },
  {
    value: "vitamin_d_analogs_calcimimetics",
    label: "Витамин D аналози / калцимиметици",
  },
  {
    value: "sglt2_inhibitors",
    label: "SGLT2 инхибитори",
  },
  {
    value: "metformin",
    label: "Метформин",
  },
  {
    value: "statins",
    label: "Статини",
  },
  {
    value: "immunosuppressants",
    label: "Имуносупресивни лекови",
  },
];

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

function selectedValuesToString(values: string[]): string {
  return values.join("|");
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

export default function CreatePatient() {
  const [form, setForm] =
    useState<CreatePatientRequest>(initialForm);

  const [result, setResult] =
    useState<CreatePatientResponse | null>(null);

  const [previousConditions, setPreviousConditions] =
    useState<string[]>([]);

  const [geneticRiskFactors, setGeneticRiskFactors] =
    useState<string[]>([]);

  const [comorbidities, setComorbidities] =
    useState<string[]>([]);

  const [currentMedications, setCurrentMedications] =
    useState<string[]>([]);


  const { createPatient, creating } = usePatients();

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

    const data = await createPatient({
      ...form,

      date_of_birth:
        form.date_of_birth || null,

      diagnosis_date:
        form.diagnosis_date || null,

      height_cm:
        form.height_cm ?? null,

      baseline_egfr:
        form.baseline_egfr ?? null,

      previous_conditions:
        selectedValuesToString(previousConditions),

      genetic_risk_factors:
        selectedValuesToString(geneticRiskFactors),

      comorbidities:
        selectedValuesToString(comorbidities),

      current_medications:
        selectedValuesToString(currentMedications),

      dialysis_modality:
        form.dialysis_status === "on_dialysis"
          ? form.dialysis_modality
          : null,
    });

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
        <h2>Креирај нов пациент</h2>

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

                <option value="diabetic_nephropathy">
                  Дијабетична нефропатија
                </option>

                <option value="hypertensive_nephropathy">
                  Хипертензивна нефропатија
                </option>

                <option value="glomerulonephritis">
                  Гломерулонефритис
                </option>

                <option value="polycystic_kidney_disease">
                  Полицистична бубрежна болест
                </option>

                <option value="obstructive_uropathy">
                  Опструктивна уропатија
                </option>

                <option value="lupus_nephritis">
                  Лупус нефритис
                </option>

                <option value="iga_nephropathy">
                  IgA нефропатија
                </option>

                <option value="other">
                  Друго
                </option>

                <option value="unknown">
                  Непознато
                </option>
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
                <option value="pre_dialysis">
                  Пред дијализа
                </option>

                <option value="on_dialysis">
                  На дијализа
                </option>

                <option value="post_transplant">
                  По трансплантација
                </option>
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

                  <option value="hd">
                    Хемодијализа
                  </option>

                  <option value="pd">
                    Перитонеална дијализа
                  </option>

                </select>

              </div>
            )}

          </div>
        </section>

        {/* ==================== SUBMIT ==================== */}

        <button
          type="submit"
          className="create-patient-button"
          disabled={creating}
        >
          {creating
            ? "Креирање..."
            : "Креирај пациент и генерирај код за покана"}
        </button>

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
            {new Date(
              result.invite_code_expires_at
            ).toLocaleDateString("mk-MK")}
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