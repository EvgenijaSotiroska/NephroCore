import { useState, type FormEvent } from "react";
import { useSymptoms } from "../../../hooks/useSymptoms";
import type { SymptomIntensity } from "../../../api/types/symptom";
import { INTENSITY_LABELS, SYMPTOM_INTENSITIES } from "../../../constants";
import { formatLongDate, todayIso } from "../../../utils/date";
import "./SymptomsCard.css";

export default function SymptomsCard() {
  const { symptoms, loading, adding, addSymptom, removeSymptom } = useSymptoms();

  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState<SymptomIntensity>("small");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const ok = await addSymptom({
      symptom_date: date,
      description: description.trim(),
      intensity,
    });

    if (ok) {
      setDescription("");
      setIntensity("small");
      setDate(todayIso());
    }
  };

  const recent = symptoms.slice(0, 3);

  return (
    <section className="ph-card">
      <h3 className="ph-card-title">Мои симптоми</h3>

      <form className="ph-sym-form" onSubmit={handleSubmit}>
        <label className="ph-field">
          <span className="ph-field-label">Датум</span>
          <input
            type="date"
            className="ph-input"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label className="ph-field">
          <span className="ph-field-label">Опис</span>
          <textarea
            className="ph-input ph-textarea"
            rows={3}
            placeholder="Пр. оток на нозете, замор, вртоглавица…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <div className="ph-field">
          <span className="ph-field-label">Интензитет</span>
          <div className="ph-intensity" role="radiogroup" aria-label="Интензитет">
            {SYMPTOM_INTENSITIES.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={intensity === key}
                className={`ph-intensity-opt ph-intensity-${key} ${
                  intensity === key ? "ph-intensity-active" : ""
                }`}
                onClick={() => setIntensity(key)}
              >
                {INTENSITY_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="ph-submit" disabled={adding || !description.trim()}>
          {adding ? "Се додава…" : "Додај симптом"}
        </button>
      </form>

      <div className="ph-sym-list-wrap">
        <h4 className="ph-sym-subtitle">Последни 3 внесени</h4>
        {loading ? (
          <p className="ph-muted">Се вчитува…</p>
        ) : recent.length === 0 ? (
          <p className="ph-muted">Сè уште немате внесено симптоми.</p>
        ) : (
          <ul className="ph-sym-list">
            {recent.map((symptom) => (
              <li key={symptom.id} className="ph-sym-item">
                <span
                  className={`ph-sym-dot ph-intensity-${symptom.intensity}`}
                  aria-hidden="true"
                />
                <div className="ph-sym-body">
                  <span className="ph-sym-desc">{symptom.description}</span>
                  <span className="ph-sym-meta">
                    {formatLongDate(symptom.symptom_date)} · {INTENSITY_LABELS[symptom.intensity]}
                  </span>
                </div>
                <button
                  type="button"
                  className="ph-sym-remove"
                  aria-label="Избриши симптом"
                  onClick={() => void removeSymptom(symptom.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}