import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTrends } from "../../../hooks/useTrends.ts";
import { usePatientProfile } from "../../../hooks/usePatientProfile.ts";
import { useVisits } from "../../../hooks/useVisits.ts";
import PatientSidebar from "../../../components/doctor/PatientSidebar/PatientSidebar.tsx";
import { COMORBIDITIES, ETIOLOGY_LABELS } from "../../../constants";
import { formatLongDate } from "../../../utils/date.ts";
import { calculateAge, formatCodedList, getInitials } from "../../../utils/patient.ts";
import TrendCell from "../../../components/doctor/TrendCell/TrendCell.tsx";
import VisitHistoryList from "../../../components/doctor/VisitHistoryList/VisitHistoryList.tsx";
import "./PatientDashboardPage.css";

// ==================== Helpers ====================

const CHART_COLORS: Record<string, string> = {
  egfr: "#08aaa5",
  creatinine: "#f97316",
  potassium: "#8b5cf6",
  phosphate: "#0ea5e9",
  hemoglobin: "#f4607a",
  bp_systolic: "#64748b",
};
const FALLBACK_COLORS = ["#08aaa5", "#f97316", "#8b5cf6", "#0ea5e9", "#f4607a", "#64748b"];

// ==================== Main page ====================

export default function PatientDashboardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data, loading, error, refetch } = useTrends(patientId);
  const { profile, setActive } = usePatientProfile(patientId);
  const { visits } = useVisits(patientId);
  const [view, setView] = useState<"charts" | "results">("charts");
  // Parameters outside the stage defaults that the doctor chose to chart (from the dropdown).
  const [shownExtras, setShownExtras] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Се вчитуваат податоците за пациентот…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <p>Не успеаа да се вчитаат податоците за овој пациент.</p>
          <button className="retry-button" onClick={refetch}>
            Обиди се повторно
          </button>
        </div>
      </div>
    );
  }

  const parameters = data?.parameters ?? [];
  const hasAnyData = parameters.length > 0;
  const age = profile ? calculateAge(profile.date_of_birth) : null;
  const comorbidities = profile ? formatCodedList(profile.comorbidities, COMORBIDITIES) : null;

  // visits come newest first
  const lastVisitDate = visits.length > 0 ? visits[0].visit_date : null;

  // The page charts the default parameters of the patient's stage. Anything else the doctor has
  // entered values for is offered in a dropdown and charted when chosen.
  const defaultParams = parameters.filter((p) => p.is_default);
  const extraParams = parameters.filter((p) => !p.is_default);
  const chosenExtras = extraParams.filter((p) => shownExtras.includes(p.key));
  const dropdownOptions = extraParams.filter((p) => !shownExtras.includes(p.key));
  const visibleParams = [...defaultParams, ...chosenExtras];

  const outOfRange = visibleParams.filter((p) => p.is_out_of_range);
  const lastMeasured = parameters
    .map((p) => p.latest_date)
    .filter((d): d is string => !!d)
    .sort()
    .pop();

  const paramMeta = Object.fromEntries(
    parameters.map((p) => [
      p.key,
      { label: p.label, unit: p.unit, normalLow: p.normal_range_low, normalHigh: p.normal_range_high, decimals: p.decimals },
    ])
  );

  return (
    <div className="dashboard-page">
      {/* ---------- Header ---------- */}
      {profile && (
        <header className="pd-hero">
          <div className="pd-hero-left">
            <div className="pd-hero-avatar">{getInitials(profile.full_name)}</div>
            <div>
              <h2 className="pd-hero-name">{profile.full_name}</h2>
              <p className="pd-hero-sub">
                {age !== null && <span>{age} година</span>}
                <span>{profile.sex === "male" ? "Машки" : "Женски"}</span>
                {profile.ckd_etiology && <span>{ETIOLOGY_LABELS[profile.ckd_etiology]}</span>}
                {!profile.is_active && <span className="pd-hero-inactive">Неактивен</span>}
              </p>
            </div>
          </div>

          <div className="pd-hero-side">
            {comorbidities && (
              <div className="pd-hero-chips">
                <span className="pd-hero-chip">
                  <strong>Коморбидитети:</strong> {comorbidities}
                </span>
              </div>
            )}
            <div className="pd-hero-actions">
              <Link to={`/patients/${profile.id}/edit`} className="pd-status-button">
                Измени профил
              </Link>
              <button
                type="button"
                className="pd-status-button"
                onClick={() => void setActive(!profile.is_active)}
              >
                {profile.is_active ? "Означи како неактивен" : "Означи како активен"}
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="pd-layout">
        {/* ---------- Main column ---------- */}
        <main className="pd-main">
          {profile && !profile.is_active && (
            <div className="pd-inactive-note">
              Пациентот е неактивен. Досегашните прегледи и терапија остануваат зачувани, но не може да се
              додаваат нови резултати, лекови или термини.
            </div>
          )}

          <div className="main-head">
            <div>
              <div className="eyebrow eyebrow-blue">Лабораториски трендови</div>
              <h3 className="section-title">Показатели низ времето</h3>
            </div>
            <div className="main-head-right">
              {profile?.is_active && (
                <Link to={`/addResult?patientId=${patientId}`} className="add-result-button">
                  + Додај резултати
                </Link>
              )}
              {lastMeasured && (
                <span className="last-measure">
                  <span className="last-measure-dot" aria-hidden="true" />
                  Последно мерење: {formatLongDate(lastMeasured)}
                </span>
              )}
              <div className="view-toggle">
                <button
                  type="button"
                  className={view === "charts" ? "view-toggle-active" : ""}
                  onClick={() => setView("charts")}
                >
                  Графици
                </button>
                <button
                  type="button"
                  className={view === "results" ? "view-toggle-active" : ""}
                  onClick={() => setView("results")}
                >
                  Резултати
                </button>
              </div>
            </div>
          </div>

          {view === "charts" && (
            <>
              {outOfRange.length > 0 && (
                <div className="attention-banner">
                  <span aria-hidden="true">⚠</span>
                  <p>
                    <strong>Клиничко внимание:</strong> надвор од референтниот опсег се{" "}
                    {outOfRange.map((p) => p.label).join(", ")}.
                  </p>
                </div>
              )}

              {dropdownOptions.length > 0 && (
                <div className="chart-extras">
                  <select
                    className="chart-extras-select"
                    value=""
                    onChange={(e) => {
                      const key = e.target.value;
                      if (key) setShownExtras((prev) => [...prev, key]);
                    }}
                  >
                    <option value="">+ Додај друг параметар на графиците…</option>
                    {dropdownOptions.map((param) => (
                      <option key={param.key} value={param.key}>
                        {param.label}
                        {param.unit && ` (${param.unit})`}
                      </option>
                    ))}
                  </select>
                  <span className="chart-extras-hint">Параметри за кои има внесени вредности</span>
                </div>
              )}

              {visibleParams.length === 0 ? (
                <div className="dashboard-empty">
                  {hasAnyData
                    ? "Нема внесени вредности за основните параметри на овој стадиум. Изберете друг параметар од листата погоре."
                    : "Сè уште нема евидентирани лабораториски резултати. Графиците ќе се прикажат откако ќе се внесат прегледи."}
                </div>
              ) : (
                <div className="trend-grid">
                  {visibleParams.map((param, index) => (
                    <TrendCell
                      key={param.key}
                      param={param}
                      color={CHART_COLORS[param.key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                      onRemove={
                        param.is_default
                          ? undefined
                          : () => setShownExtras((prev) => prev.filter((key) => key !== param.key))
                      }
                    />
                  ))}
                </div>
              )}

            </>
          )}

          {view === "results" && <VisitHistoryList visits={visits} paramMeta={paramMeta} />}
        </main>

        {/* ---------- Sidebar ---------- */}
        <PatientSidebar
          patientId={patientId}
          lastVisitDate={lastVisitDate}
          isActive={profile?.is_active ?? true}
          canAnalyse={hasAnyData}
        />
      </div>
    </div>
  );
}