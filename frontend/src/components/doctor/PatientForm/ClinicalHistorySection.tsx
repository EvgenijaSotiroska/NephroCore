import CheckboxGroup from "../CheckboxGroup/CheckboxGroup.tsx";
import {
  PREVIOUS_CONDITIONS,
  GENETIC_RISK_FACTORS,
  COMORBIDITIES,
  CURRENT_MEDICATIONS,
} from "../../../constants";
import type { ClinicalLists, SectionProps } from "./patientForm.ts";
import "./PatientForm.css";

interface ClinicalHistorySectionProps extends SectionProps {
  lists: ClinicalLists;
  onListChange: (key: keyof ClinicalLists, values: string[]) => void;
}

export default function ClinicalHistorySection({ form, update, lists, onListChange }: ClinicalHistorySectionProps) {
  return (
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
          selectedValues={lists.previous_conditions}
          onChange={(values) => onListChange("previous_conditions", values)}
        />

        <CheckboxGroup
          title="Генетски ризик фактори"
          options={GENETIC_RISK_FACTORS}
          selectedValues={lists.genetic_risk_factors}
          onChange={(values) => onListChange("genetic_risk_factors", values)}
        />

        <CheckboxGroup
          title="Коморбидитети"
          options={COMORBIDITIES}
          selectedValues={lists.comorbidities}
          onChange={(values) => onListChange("comorbidities", values)}
        />

        <CheckboxGroup
          title="Тековна терапија"
          options={CURRENT_MEDICATIONS}
          selectedValues={lists.current_medications}
          onChange={(values) => onListChange("current_medications", values)}
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
  );
}
