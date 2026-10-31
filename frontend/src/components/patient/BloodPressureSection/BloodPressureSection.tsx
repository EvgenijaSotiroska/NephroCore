import { useState, type FormEvent } from "react";
import { useBloodPressure } from "../../../hooks/useBloodPressure";
import { BP_MAX_READINGS_PER_DAY, isAboveTarget, isAlertLevel } from "../../../constants";
import { formatLongDate, todayIso } from "../../../utils/date";
import "./BloodPressureSection.css";

const SHOWN_READINGS = 5;

// Sits inside the symptoms card: the patient's home blood pressure diary.
export default function BloodPressureSection() {
  const { readings, loading, adding, addReading, removeReading } = useBloodPressure();

  const [date, setDate] = useState(todayIso());
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const readingsThatDay = readings.filter((r) => r.reading_date === date).length;
  const dayIsFull = readingsThatDay >= BP_MAX_READINGS_PER_DAY;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const systolicValue = Number(systolic);
    const diastolicValue = Number(diastolic);

    if (systolicValue <= diastolicValue) {
      setFormError("Горниот притисок мора да биде поголем од долниот.");
      return;
    }

    const ok = await addReading({
      reading_date: date,
      systolic: systolicValue,
      diastolic: diastolicValue,
    });

    if (ok) {
      setShowAlert(isAlertLevel(systolicValue, diastolicValue));
      setSystolic("");
      setDiastolic("");
    }
  };

  const recent = readings.slice(0, SHOWN_READINGS);

  return (
    <div className="ph-sym-list-wrap">
      <h4 className="ph-sym-subtitle">Мерење на крвен притисок</h4>

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

        <div className="ph-bp-row">
          <label className="ph-field">
            <span className="ph-field-label">Горен</span>
            <input
              type="number"
              className="ph-input"
              inputMode="numeric"
              min={50}
              max={300}
              placeholder="120"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              required
            />
          </label>

          <label className="ph-field">
            <span className="ph-field-label">Долен</span>
            <input
              type="number"
              className="ph-input"
              inputMode="numeric"
              min={30}
              max={200}
              placeholder="80"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              required
            />
          </label>
        </div>

        {formError && <p className="ph-bp-error">{formError}</p>}
        {dayIsFull && (
          <p className="ph-bp-error">
            За овој датум веќе имате {BP_MAX_READINGS_PER_DAY} мерења. Изберете друг датум.
          </p>
        )}

        <button
          type="submit"
          className="ph-submit"
          disabled={adding || dayIsFull || !systolic || !diastolic}
        >
          {adding ? "Се додава…" : "Додај мерење"}
        </button>
      </form>

      {showAlert && (
        <div className="ph-bp-alert" role="alert">
          <p>
            Вашиот притисок е многу висок. Седнете и одморете се неколку минути, па измерете повторно.
            Ако притисокот остане толку висок или имате главоболка, болка во градите, отежнато дишење
            или заматен вид, јавете се на лекарот веднаш или повикајте 194 или 112.
          </p>
          <button type="button" className="ph-bp-alert-close" onClick={() => setShowAlert(false)}>
            Затвори
          </button>
        </div>
      )}

      {loading ? (
        <p className="ph-muted">Се вчитува…</p>
      ) : recent.length === 0 ? (
        <p className="ph-muted">Сè уште немате внесено мерења.</p>
      ) : (
        <ul className="ph-sym-list ph-bp-list">
          {recent.map((reading) => (
            <li key={reading.id} className="ph-sym-item">
              <div className="ph-sym-body">
                <span
                  className={`ph-sym-desc ph-bp-value ${
                    isAboveTarget(reading.systolic, reading.diastolic) ? "ph-bp-high" : ""
                  }`}
                >
                  {reading.systolic}/{reading.diastolic} mmHg
                </span>
                <span className="ph-sym-meta">{formatLongDate(reading.reading_date)}</span>
              </div>
              <button
                type="button"
                className="ph-sym-remove"
                aria-label="Избриши мерење"
                onClick={() => void removeReading(reading.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
