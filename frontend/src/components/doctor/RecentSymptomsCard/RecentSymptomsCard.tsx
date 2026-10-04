import { Link } from "react-router";
import type { PatientProfile } from "../../../api/types/patient";
import type { SymptomResponse } from "../../../api/types/symptom";
import { INTENSITY_LABELS } from "../../../constants";
import { formatLongDate } from "../../../utils/date";
import { getInitials, getPatientName } from "../../../utils/patient";
import "./RecentSymptomsCard.css";

interface RecentSymptomsCardProps {
  symptoms: SymptomResponse[]; // newest first
  patients: PatientProfile[];
  loading: boolean;
}

export default function RecentSymptomsCard({ symptoms, patients, loading }: RecentSymptomsCardProps) {
  const recent = symptoms.slice(0, 5);

  return (
    <section className="dh-card">
      <div className="dh-card-head">
        <div>
          <span className="dh-eyebrow">Пријавено од пациенти</span>
          <h2 className="dh-card-title">Нови симптоми</h2>
        </div>
      </div>

      {loading ? (
        <p className="dh-muted">Се вчитува…</p>
      ) : recent.length === 0 ? (
        <p className="dh-muted">Пациентите сè уште не пријавиле симптоми.</p>
      ) : (
        <ul className="dh-sym-list">
          {recent.map((symptom) => {
            const name = getPatientName(patients, symptom.patient_id);
            return (
              <li key={symptom.id}>
                <Link to={`/patients/${symptom.patient_id}/trends`} className="dh-sym-item">
                  <span className="dh-avatar">{getInitials(name)}</span>

                  <span className="dh-sym-body">
                    <span className="dh-sym-name">{name}</span>
                    <span className="dh-sym-desc">{symptom.description}</span>
                    <span className="dh-sym-date">{formatLongDate(symptom.symptom_date)}</span>
                  </span>

                  <span className={`dh-sym-pill dh-sym-pill-${symptom.intensity}`}>
                    {INTENSITY_LABELS[symptom.intensity]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}