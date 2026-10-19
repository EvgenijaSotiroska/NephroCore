import { ETIOLOGY_OPTIONS } from "../../../constants";
import type { SectionProps } from "./patientForm.ts";
import "./PatientForm.css";

export default function CkdSection({ form, update }: SectionProps) {
  return (
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
  );
}
