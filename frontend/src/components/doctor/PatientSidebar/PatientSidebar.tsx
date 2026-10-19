import { INTENSITY_LABELS } from "../../../constants";
import { Link } from "react-router-dom";
import { useMedications } from "../../../hooks/useMedications";
import { useSymptoms } from "../../../hooks/useSymptoms";
import { useAiAnalysis } from "../../../hooks/useAi";
import AiAnalysisModal from "../AiAnalysisModal/AiAnalysisModal";
import { useState, type SubmitEvent } from "react";
import {
  daysUntil,
  formatDayMonth,
  formatLongDate,
  formatShortMonth,
  formatTime,
  formatWeekday,
} from "../../../utils/date";
import "./PatientSidebar.css";
import {useNextPatientAppointment} from "../../../hooks/useNextPatientAppointment.ts";

function relativeDays(dateStr: string): string {
    const diff = daysUntil(dateStr);
    if (diff === 0) return "денес";
    if (diff === -1) return "вчера";
    if (diff < -1) return `пред ${Math.abs(diff)} дена`;
    return "";
}

function NextVisitPanel({ patientId }: { patientId?: string }) {
  const { appointment, loading } = useNextPatientAppointment(patientId);

  const days = appointment ? daysUntil(appointment.scheduled_at) : 0;
  const countdown = days <= 0 ? "Денес" : days === 1 ? "Утре" : `За ${days} дена`;

  return (
    <section className="side-section">
      <div className="side-eyebrow">Следна посета</div>

      {loading ? (
        <p className="side-muted">Се вчитува…</p>
      ) : !appointment ? (
        <>
          <h3 className="side-title">Нема закажан термин</h3>
          <Link to="/appointments" className="side-outline-button">
            Закажи термин
          </Link>
        </>
      ) : (
        <>
          <h3 className="side-title">{appointment.appointment_type || "Преглед"}</h3>

          <div className="visit-row">
            <div className="visit-tile" aria-hidden="true">
              <span className="visit-tile-month">{formatShortMonth(appointment.scheduled_at)}</span>
              <span className="visit-tile-day">{new Date(appointment.scheduled_at).getDate()}</span>
            </div>
            <div className="visit-row-info">
              <span className="visit-row-time">
                {formatTime(appointment.scheduled_at)} · {formatWeekday(appointment.scheduled_at)}
              </span>
              <span className="visit-row-sub">{appointment.duration_minutes} мин</span>
              <span className="visit-row-countdown">{countdown}</span>
            </div>
          </div>

          <Link to="/appointments" className="side-outline-button">
            Промени термин
          </Link>
        </>
      )}
    </section>
  );
}

// ==================== Therapy (doctor can add) ====================

function TherapyPanel({ patientId, isActive }: { patientId?: string; isActive: boolean }) {
  const { medications, loading, saving, addMedication, updateMedication, removeMedication } =
    useMedications(patientId);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patientId || !name.trim() || !dose.trim()) return;

    const cleanTimes = Array.from(new Set(times.filter(Boolean))).sort();
    if (cleanTimes.length === 0) return;

    const ok = await addMedication({
      patient_id: patientId,
      name: name.trim(),
      dose: dose.trim(),
      times: cleanTimes,
    });

    if (ok) {
      setName("");
      setDose("");
      setTimes(["08:00"]);
      setShowForm(false);
    }
  };

  return (
    <section className="side-section">
      <div className="side-eyebrow">Терапија</div>
      <h3 className="side-title">Активни лекови</h3>

      {loading ? (
        <p className="side-muted">Се вчитува…</p>
      ) : medications.length === 0 ? (
        <p className="side-muted">Сè уште нема пропишани лекови.</p>
      ) : (
        <ul className="med-list">
          {medications.map((med) => (
            <li key={med.id} className={`med-item ${med.is_active ? "" : "med-item-paused"}`}>
              <span className="med-icon" aria-hidden="true">💊</span>
              <div className="med-body">
                <div className="med-name-row">
                  <span className="med-name">{med.name}</span>
                  <span className="med-dose">{med.dose}</span>
                  {!med.is_active && <span className="med-paused-tag">Паузиран</span>}
                </div>
                <span className="med-sub">
                  {med.times.length}× дневно · {med.times.join(", ")}
                </span>
                {med.description && <span className="med-sub">{med.description}</span>}
              </div>
              <div className="med-actions">
                <button
                  type="button"
                  className="med-action"
                  aria-label={med.is_active ? "Паузирај лек" : "Активирај лек"}
                  title={med.is_active ? "Паузирај" : "Активирај"}
                  onClick={() => void updateMedication(med.id, { is_active: !med.is_active })}
                >
                  {med.is_active ? "⏸" : "▶"}
                </button>
                <button
                  type="button"
                  className="med-action med-action-danger"
                  aria-label="Избриши лек"
                  title="Избриши"
                  onClick={() => {
                    if (window.confirm(`Да се избрише „${med.name}“?`)) {
                      void removeMedication(med.id);
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="med-divider" />

      {!isActive && (
        <p className="side-muted">Пациентот е неактивен, па не може да се додаваат нови лекови.</p>
      )}

      {isActive && (
        <button
          type="button"
          className="med-add-toggle"
          onClick={() => setShowForm((v) => !v)}
        >
          <span aria-hidden="true">{showForm ? "−" : "+"}</span> {showForm ? "Откажи" : "Додај лек"}
        </button>
      )}

      {isActive && showForm && (
        <form className="med-form" onSubmit={handleSubmit}>
          <input
            className="side-input"
            placeholder="Име на лек"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="side-input"
            placeholder="Доза (пр. 5 mg)"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            required
          />

          <div className="med-times">
            {times.map((time, index) => (
              <div key={index} className="med-time-row">
                <input
                  type="time"
                  className="side-input med-time-input"
                  value={time}
                  onChange={(e) =>
                    setTimes((prev) => prev.map((t, i) => (i === index ? e.target.value : t)))
                  }
                  required
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    className="med-action med-action-danger"
                    aria-label="Отстрани време"
                    onClick={() => setTimes((prev) => prev.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="med-time-add"
              onClick={() => setTimes((prev) => [...prev, "20:00"])}
            >
              + Уште едно време
            </button>
          </div>

          <button
            type="submit"
            className="med-submit"
            disabled={saving || !name.trim() || !dose.trim()}
          >
            {saving ? "Се зачувува…" : "Додај во терапија"}
          </button>
        </form>
      )}
    </section>
  );
}

function AiAnalysisPanel({ patientId }: { patientId?: string }) {
  const { history, loading, historyLoading, error, generate, loadHistory } = useAiAnalysis(patientId);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    void loadHistory();
  };

  return (
    <section className="side-section">
      <button type="button" className="ai-side-button" onClick={handleOpen}>
        🤖 AI анализа
      </button>

      <AiAnalysisModal
        isOpen={open}
        title="🤖 AI анализа"
        subtitle="Генерирана од Claude врз основа на резултатите, симптомите и терапијата."
        generateLabel="Генерирај нова анализа"
        items={history}
        loading={loading}
        historyLoading={historyLoading}
        error={error}
        onGenerate={() => void generate()}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
// ==================== Symptoms since last visit ====================

function PatientSymptoms({
  patientId,
  lastVisitDate,
}: {
  patientId?: string;
  lastVisitDate: string | null;
}) {
  const { symptoms, loading } = useSymptoms(patientId);

  const sinceVisit = symptoms
    .filter((s) => !lastVisitDate || s.symptom_date >= lastVisitDate)
    .sort((a, b) => b.symptom_date.localeCompare(a.symptom_date));

  return (
    <section className="side-section">
      <div className="side-eyebrow">Од пациентот</div>
      <h3 className="side-title">Последно пријавени симптоми</h3>
      <p className="side-note">
        {lastVisitDate
          ? `${sinceVisit.length} од прегледот на ${formatLongDate(lastVisitDate)}`
          : `${sinceVisit.length} вкупно`}
      </p>

      {loading ? (
        <p className="side-muted">Се вчитува…</p>
      ) : sinceVisit.length === 0 ? (
        <p className="side-muted">Пациентот не внел нови симптоми од последниот преглед.</p>
      ) : (
        <ul className="sym-list">
          {sinceVisit.map((symptom) => (
            <li key={symptom.id} className="sym-row">
              <span className={`sym-dot sym-${symptom.intensity}`} aria-hidden="true" />
              <div className="sym-body">
                <span className="sym-desc">{symptom.description}</span>
                <span className="sym-meta">
                  {formatDayMonth(symptom.symptom_date)}
                  {relativeDays(symptom.symptom_date) && ` · ${relativeDays(symptom.symptom_date)}`}
                </span>
              </div>
              <span className={`sym-badge sym-${symptom.intensity}`}>
                {INTENSITY_LABELS[symptom.intensity]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ==================== Sidebar ====================

interface PatientSidebarProps {
  patientId?: string;
  lastVisitDate: string | null;
  isActive?: boolean;
  // The AI analysis needs at least one result to work with.
  canAnalyse?: boolean;
}

export default function PatientSidebar({
  patientId,
  lastVisitDate,
  isActive = true,
  canAnalyse = false,
}: PatientSidebarProps) {
  return (
    <aside className="pd-side">
      <NextVisitPanel patientId={patientId} />
      <TherapyPanel patientId={patientId} isActive={isActive} />
      <PatientSymptoms patientId={patientId} lastVisitDate={lastVisitDate} />
      {canAnalyse && <AiAnalysisPanel patientId={patientId} />}
    </aside>
  );
}