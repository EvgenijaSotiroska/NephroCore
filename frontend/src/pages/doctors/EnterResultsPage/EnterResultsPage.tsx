import "./EnterResultsPage.css";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useResultParameters } from "../../../hooks/useResultParameters.ts";
import { usePatients } from "../../../hooks/usePatients.ts";
import { useResults } from "../../../hooks/useResults.ts";
import type { CKDStage } from "../../../api/types/ckdStage.ts";
import { CKD_STAGE_ORDER } from "../../../api/types/ckdStage.ts";
import type { LabResultPayload } from "../../../api/types/result.ts";
import { formatWeekdayDayMonth, todayIso } from "../../../utils/date.ts";
import { getInitials } from "../../../utils/patient.ts";
import { useTrends } from "../../../hooks/useTrends.ts";

// Fewest lab values that must be filled in for a result to be saved (prevents empty results).
const MIN_RESULT_VALUES = 3;

// The reference shown under a field comes from the server. These replace it where the saved text is not what we want to show.
const REFERENCE_OVERRIDES: Record<string, string> = {
  egfr: "≥ 90",
};

export default function EnterResults() {
  const { patients, loading: patientsLoading } = usePatients();
  const {
    stageParameters,
    getParametersForStage,
    allParameters,
    loading: paramsLoading,
    error: paramsError,
  } = useResultParameters();
  const { createResult, creating } = useResults();

  // The patient page links here with ?patientId=..., so that patient is already selected.
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get("patientId") ?? "");
  const [visitDate, setVisitDate] = useState(todayIso());
  const [stage, setStage] = useState<CKDStage>("G1");
  const [values, setValues] = useState<LabResultPayload>({});
  const [extraKeys, setExtraKeys] = useState<string[]>([]);

  const currentStageConfig = getParametersForStage(stage);
  const selectedPatient = patients.find((p) => p.id === patientId);

  // Pre-fill the stage with the patient's current one (from their latest visit) as soon as
  // they are selected. The doctor can still pick a different stage pill by hand.
  const { data: trendsData } = useTrends(patientId || undefined);
  useEffect(() => {
    if (trendsData && trendsData.patient_id === patientId && trendsData.current_ckd_stage) {
      setStage(trendsData.current_ckd_stage);
    }
  }, [trendsData, patientId]);

  useEffect(() => {
    if (!currentStageConfig) return;
    const validKeys = new Set([
      ...currentStageConfig.parameters.map((p) => p.key),
      ...extraKeys,
    ]);
    setValues((prev) => {
      const next: LabResultPayload = {};
      Object.keys(prev).forEach((key) => {
        if (validKeys.has(key)) next[key] = prev[key];
      });
      return next;
    });
  }, [stage]);

  const handleValueChange = (key: string, raw: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: raw === "" ? null : Number(raw),
    }));
  };

  // Only values of the parameters currently shown count (removed extras are ignored).
  const shownKeys = new Set([
    ...(currentStageConfig?.parameters ?? []).map((p) => p.key),
    ...extraKeys,
  ]);
  const filledCount = Object.entries(values).filter(
    ([key, value]) => shownKeys.has(key) && value !== null && value !== undefined && !Number.isNaN(value)
  ).length;
  const enoughValues = filledCount >= MIN_RESULT_VALUES;
  const totalShown = shownKeys.size;

  const handleSubmit = async () => {
    if (!patientId || !currentStageConfig || !enoughValues) return;

    // Send only the values of the fields that are on screen (not leftovers of removed fields).
    const shownValues: LabResultPayload = {};
    Object.entries(values).forEach(([key, value]) => {
      if (shownKeys.has(key)) shownValues[key] = value;
    });

    const result = await createResult({
      patient_id: patientId,
      visit_date: visitDate,
      ckd_stage: stage,
      lab_result: shownValues,
    });

    if (result) {
      setValues({});
      setExtraKeys([]);
    }
  };

  if (paramsLoading) {
    return (
      <div className="results-loading">Се вчитува...</div>
    );
  }

  const extraParams = allParameters.filter((p) => extraKeys.includes(p.key));
  const combinedParams = [...(currentStageConfig?.parameters ?? []), ...extraParams];
  const availableToAdd = allParameters.filter(
    (p) => !currentStageConfig?.parameters.some((sp) => sp.key === p.key) && !extraKeys.includes(p.key)
  );

  return (
    <div className="results-page">

      {/* ==================== HERO ==================== */}

      <div className="results-hero">
        <div className="results-hero-inner">
          <Link
            to={patientId ? `/patients/${patientId}/trends` : "/doctor"}
            className="results-back-link"
          >
            ← Врати се на пациент
          </Link>
          <h1 className="results-hero-title">Внеси резултати</h1>
          <p className="results-hero-sub">
            {selectedPatient
              ? `Нов преглед за ${selectedPatient.full_name}`
              : "Изберете пациент и стадиум — параметрите се прилагодуваат автоматски."}
          </p>
        </div>
      </div>

      {paramsError && (
        <div className="results-error">
          Не успеавме да ги вчитаме параметрите ({paramsError}). Проверете
          дали бекендот работи и дали рутата /results/parameters е достапна.
        </div>
      )}

      {/* ==================== LAYOUT ==================== */}

      <div className="results-layout">

        <div className="results-main">

          <section className="results-block">
            <div className="results-block-header">
              <span className="results-step-label">Чекор 1</span>
              <h2 className="results-block-title">Пациент и датум</h2>
            </div>

            <div className="results-row">
              <div className="results-field">
                <label>Пациент</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  disabled={patientsLoading}
                >
                  <option value="">Изберете пациент</option>
                  {patients.filter((p) => p.is_active).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="results-field">
                <label>Датум на анализа</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="results-block">
            <div className="results-block-header">
              <span className="results-step-label">Чекор 2</span>
              <h2 className="results-block-title">Тековен стадиум</h2>
              <p className="results-block-hint">
                {selectedPatient
                  ? "Пополнето според последната посета на пациентот — по желба изберете друг."
                  : "Се пополнува автоматски штом изберете пациент."}
              </p>
            </div>

            <div className="stage-grid">
              {CKD_STAGE_ORDER.map((stageKey) => {
                const config = stageParameters.find((s) => s.stage === stageKey);
                const isActive = stageKey === stage;
                return (
                  <div
                    key={stageKey}
                    className={`stage-option ${isActive ? "stage-option-selected" : ""}`}
                    onClick={() => setStage(stageKey)}
                  >
                    <span className="stage-option-name">{stageKey}</span>
                    <span className="stage-option-range">
                      {config?.egfr_range_label ?? ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {currentStageConfig && (
              <div className="stage-info-bar">
                <span className="stage-info-dot" />
                <span className="stage-info-text">
                  {stage} · {currentStageConfig.label_mk} · eGFR{" "}
                  {currentStageConfig.egfr_range_label}
                </span>
                <span className="stage-info-count">
                  {currentStageConfig.parameters.length} параметри
                </span>
              </div>
            )}

            {!currentStageConfig && !paramsError && (
              <p className="stage-empty-note">
                Нема достапни параметри за овој стадиум.
              </p>
            )}
          </section>

          {currentStageConfig && combinedParams.length > 0 && (
            <section className="results-block">
              <div className="results-block-header">
                <span className="results-step-label">Чекор 3</span>
                <h2 className="results-block-title">Основни параметри</h2>
              </div>

              <div className="results-param-grid">
                {combinedParams.map((param) => (
                  <div key={param.key} className="results-field">
                    <label>{param.label_mk}</label>
                    <input
                      type="number"
                      placeholder="нпр."
                      value={values[param.key] ?? ""}
                      onChange={(e) =>
                        handleValueChange(param.key, e.target.value)
                      }
                    />
                    <span className="field-hint">
                      {param.unit} · Референца: {REFERENCE_OVERRIDES[param.key] ?? param.reference_mk}
                    </span>
                    {extraKeys.includes(param.key) && (
                      <button
                        type="button"
                        className="remove-extra-param"
                        onClick={() => {
                          setExtraKeys((prev) => prev.filter((k) => k !== param.key));
                          // forget the typed value too, so it is not saved or shown again later
                          setValues((prev) => {
                            const next = { ...prev };
                            delete next[param.key];
                            return next;
                          });
                        }}
                      >
                        ✕ Отстрани
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {availableToAdd.length > 0 && (
                <div className="add-parameter-row">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setExtraKeys((prev) => [...prev, e.target.value]);
                    }}
                  >
                    <option value="">+ Додади друг параметар</option>
                    {availableToAdd.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label_mk}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>
          )}

        </div>

        {/* ==================== SUMMARY SIDEBAR ==================== */}

        <aside className="results-sidebar">
          <div className="results-summary-card">

            <div className="summary-patient">
              <div className="summary-avatar">
                {selectedPatient ? getInitials(selectedPatient.full_name) : "?"}
              </div>
              <div>
                <div className="summary-patient-name">
                  {selectedPatient ? selectedPatient.full_name : "Нема избрано пациент"}
                </div>
                <div className="summary-patient-sub">
                  {formatWeekdayDayMonth(visitDate)}
                </div>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span className="summary-label">Стадиум</span>
              <span className="summary-stage-badge">{stage}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Внесени вредности</span>
              <span className="summary-value">
                {filledCount}/{totalShown}
              </span>
            </div>

            <div className="summary-progress-track">
              <div
                className={`summary-progress-fill ${enoughValues ? "summary-progress-ok" : ""}`}
                style={{
                  width: totalShown > 0 ? `${Math.min(100, (filledCount / totalShown) * 100)}%` : "0%",
                }}
              />
            </div>

            {!enoughValues && (
              <p className="results-min-hint">
                Внесете најмалку {MIN_RESULT_VALUES} вредности за да се зачуваат резултатите.
              </p>
            )}

            <button
              type="button"
              className="results-submit"
              disabled={!patientId || creating || !enoughValues}
              onClick={handleSubmit}
            >
              {creating ? "Се зачувува..." : "Зачувај резултати"}
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
