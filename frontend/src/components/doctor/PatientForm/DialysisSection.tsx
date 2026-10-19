import { DIALYSIS_STATUS_OPTIONS, DIALYSIS_MODALITY_OPTIONS } from "../../../constants";
import type { SectionProps } from "./patientForm.ts";
import "./PatientForm.css";

export default function DialysisSection({ form, update }: SectionProps) {
  return (
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
  );
}
