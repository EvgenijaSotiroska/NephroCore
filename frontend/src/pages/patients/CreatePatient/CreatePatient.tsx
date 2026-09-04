import { useState, type ChangeEvent, type FormEvent } from "react";
import { usePatients } from "../../../hooks/usePatients";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
} from "../../../api/types/patient";
import "./CreatePatient.css";

const initialForm: CreatePatientRequest = {
  full_name: "",
  date_of_birth: "",
  sex: "male",
  height_cm: null,

  previous_conditions: "",
  genetic_risk_factors: "",
  comorbidities: null,
  current_medications: null,
  allergies: "",
  smoking: false,
  alcohol: false,

  ckd_etiology: null,
  diagnosis_date: "",
  baseline_egfr: null,

  dialysis_status: "pre_dialysis",
  dialysis_modality: null,
};

export default function CreatePatient() {
  const [form, setForm] = useState<CreatePatientRequest>(initialForm);
  const [result, setResult] = useState<CreatePatientResponse | null>(null);

  const { createPatient, creating } = usePatients();

  function update<K extends keyof CreatePatientRequest>(field: K) {
    return (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const target = e.target;

      let value: string | number | boolean | null = target.value;

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
        value = target.value === "" ? null : Number(target.value);
      }

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const data = await createPatient({
      ...form,
      date_of_birth: form.date_of_birth || null,
      diagnosis_date: form.diagnosis_date || null,
      height_cm: form.height_cm || null,
      baseline_egfr: form.baseline_egfr || null,
      dialysis_modality:
        form.dialysis_status === "on_dialysis"
          ? form.dialysis_modality
          : null,
    });

    if (data) {
      setResult(data);
      setForm(initialForm);
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

      {/* ==================== SUCCESS ==================== */}

      {result && (
        <div className="patient-success">
          <p>
            Профилот за <strong>{result.full_name}</strong> е успешно креиран.
          </p>

          <p>
            Код за покана (споделете го со пациентот, истекува на{" "}
            {new Date(
              result.invite_code_expires_at
            ).toLocaleDateString("mk-MK")}
            ):
          </p>

          <code>{result.invite_code}</code>
        </div>
      )}

      <form
        className="create-patient-form"
        onSubmit={handleSubmit}
      >

        {/* ==================== ОСНОВНИ ИНФОРМАЦИИ ==================== */}

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
                Име и презиме <span className="required">*</span>
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
                <option value="male">Машки</option>
                <option value="female">Женски</option>
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


        {/* ==================== КЛИНИЧКА ИСТОРИЈА ==================== */}

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

          <div className="form-grid">

            <div className="form-field full-width">
              <label htmlFor="previous_conditions">
                Претходни заболувања
              </label>

              <textarea
                id="previous_conditions"
                placeholder="Внесете претходни заболувања"
                value={form.previous_conditions ?? ""}
                onChange={update("previous_conditions")}
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="genetic_risk_factors">
                Генетски ризик фактори
              </label>

              <textarea
                id="genetic_risk_factors"
                placeholder="Внесете генетски ризик фактори"
                value={form.genetic_risk_factors ?? ""}
                onChange={update("genetic_risk_factors")}
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="allergies">
                Алергии
              </label>

              <textarea
                id="allergies"
                placeholder="Внесете алергии"
                value={form.allergies ?? ""}
                onChange={update("allergies")}
              />
            </div>

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

            <div className="checkbox-field">
              <input
                id="alcohol"
                type="checkbox"
                checked={!!form.alcohol}
                onChange={update("alcohol")}
              />

              <label htmlFor="alcohol">
                Консумирање алкохол
              </label>
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


        {/* ==================== ДИЈАЛИЗА ==================== */}

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

    </div>
  );
}