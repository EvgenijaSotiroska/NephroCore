import type { SectionProps } from "./patientForm.ts";
import "./PatientForm.css";

export default function BasicInfoSection({ form, update }: SectionProps) {
  return (
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
  );
}
