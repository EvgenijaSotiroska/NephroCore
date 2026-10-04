import { useMedications } from "../../../hooks/useMedications";
import { nowTime } from "../../../utils/date";
import "./MedicationsCard.css";

export default function MedicationsCard() {
  const { medications, loading, error } = useMedications();

  // One row per dose (a medicine taken twice a day appears twice), sorted by time.
  const doses = medications
    .flatMap((med) => med.times.map((time) => ({ time, med })))
    .sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name));

  const now = nowTime();
  const upcomingIndex = doses.findIndex((dose) => dose.time >= now);
  const nextIndex = upcomingIndex === -1 ? 0 : upcomingIndex; // wraps to tomorrow's first dose

  return (
    <section className="ph-card">
      <h3 className="ph-card-title">Мои лекови</h3>

      {loading ? (
        <p className="ph-muted">Се вчитува…</p>
      ) : error ? (
        <p className="ph-explain-error">{error}</p>
      ) : doses.length === 0 ? (
        <div className="ph-empty">
          <span className="ph-empty-icon" aria-hidden="true">
            💊
          </span>
          Сè уште немате пропишани лекови.
        </div>
      ) : (
        <ul className="ph-med-list">
          {doses.map(({ time, med }, index) => {
            const isNext = index === nextIndex;
            return (
              <li key={`${med.id}-${time}`} className={`ph-med ${isNext ? "ph-med-next" : ""}`}>
                <span className="ph-med-time">{time}</span>
                <div className="ph-med-body">
                  <span className="ph-med-name">{med.name}</span>
                  <span className="ph-med-dose">{med.dose}</span>
                  {med.description && <span className="ph-med-why">{med.description}</span>}
                </div>
                {isNext && <span className="ph-med-tag">Следна доза</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}