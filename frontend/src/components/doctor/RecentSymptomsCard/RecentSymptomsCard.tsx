import { Link } from "react-router";
import type { PatientProfile } from "../../../api/types/patient";
import type { SymptomResponse } from "../../../api/types/symptom";
import { INTENSITY_LABELS } from "../../../constants";
import { formatLongDate } from "../../../utils/date";
import { getInitials, getPatientName } from "../../../utils/patient";
import "./RecentSymptomsCard.css";

const MAX_PATIENTS_SHOWN = 6;

const INTENSITY_RANK: Record<SymptomResponse["intensity"], number> = {
  small: 1,
  medium: 2,
  large: 3,
};

interface PatientSymptoms {
  patientId: string;
  shown: SymptomResponse; // the symptom put on the card for this patient
  count: number; // how many new symptoms this patient reported
}

function newestFirst(a: SymptomResponse, b: SymptomResponse): number {
  return b.symptom_date.localeCompare(a.symptom_date) || b.created_at.localeCompare(a.created_at);
}

/** One entry per patient. The symptom shown is the most intense one (the newest among equals).
 *  Patients with a severe symptom come first, then the rest by date. */
function groupByPatient(symptoms: SymptomResponse[]): PatientSymptoms[] {
  const byPatient = new Map<string, SymptomResponse[]>();
  for (const symptom of symptoms) {
    byPatient.set(symptom.patient_id, [...(byPatient.get(symptom.patient_id) ?? []), symptom]);
  }

  return [...byPatient.entries()]
    .map(([patientId, list]) => {
      const shown = [...list].sort(
        (a, b) => INTENSITY_RANK[b.intensity] - INTENSITY_RANK[a.intensity] || newestFirst(a, b)
      )[0];
      return { patientId, shown, count: list.length };
    })
    .sort(
      (a, b) =>
        Number(b.shown.intensity === "large") - Number(a.shown.intensity === "large") ||
        newestFirst(a.shown, b.shown)
    );
}

interface RecentSymptomsCardProps {
  symptoms: SymptomResponse[]; // all symptoms of the doctor's patients
  since: number; // only symptoms entered after this time (ms) count as new
  patients: PatientProfile[];
  loading: boolean;
}

export default function RecentSymptomsCard({ symptoms, since, patients, loading }: RecentSymptomsCardProps) {
  const newSymptoms = symptoms.filter((symptom) => new Date(symptom.created_at).getTime() >= since);
  const rows = groupByPatient(newSymptoms).slice(0, MAX_PATIENTS_SHOWN);

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
      ) : symptoms.length === 0 ? (
        <p className="dh-muted">Пациентите сè уште не пријавиле симптоми.</p>
      ) : rows.length === 0 ? (
        <p className="dh-muted">Нема нови симптоми во последните 7 дена.</p>
      ) : (
        <ul className="dh-sym-list">
          {rows.map(({ patientId, shown, count }) => {
            const name = getPatientName(patients, patientId);
            return (
              <li key={patientId}>
                <Link to={`/patients/${patientId}/trends`} className="dh-sym-item">
                  <span className="dh-avatar">{getInitials(name)}</span>

                  <span className="dh-sym-body">
                    <span className="dh-sym-name">{name}</span>
                    <span className="dh-sym-desc">{shown.description}</span>
                    <span className="dh-sym-date">
                      {formatLongDate(shown.symptom_date)} · {count} {count === 1 ? "нов симптом" : "нови симптоми"}
                    </span>
                  </span>

                  <span className={`dh-sym-pill dh-sym-pill-${shown.intensity}`}>
                    {INTENSITY_LABELS[shown.intensity]}
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
