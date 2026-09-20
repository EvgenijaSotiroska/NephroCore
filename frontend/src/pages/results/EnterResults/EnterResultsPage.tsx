import "./EnterResultsPage.css";
import { useEffect, useState } from "react";

import { useResultParameters } from "../../../hooks/useResultParameters";
import { usePatients } from "../../../hooks/usePatients";
import { useResults } from "../../../hooks/useResults";
import type { CKDStage } from "../../../api/types/cdkStage.ts";
import { CKD_STAGE_ORDER } from "../../../api/types/cdkStage.ts";
import type { LabResultPayload } from "../../../api/types/result.ts";

const todayIso = () => new Date().toISOString().slice(0, 10);

const EnterResults = () => {
  const { patients, loading: patientsLoading } = usePatients();
  const {
    stageParameters,
    getParametersForStage,
    loading: paramsLoading,
    error: paramsError,
  } = useResultParameters();
  const { createResult, creating } = useResults();

  const [patientId, setPatientId] = useState("");
  const [visitDate, setVisitDate] = useState(todayIso());
  const [stage, setStage] = useState<CKDStage>("G1");
  const [values, setValues] = useState<LabResultPayload>({});

  const currentStageConfig = getParametersForStage(stage);

  useEffect(() => {
    if (!currentStageConfig) return;
    const validKeys = new Set(currentStageConfig.parameters.map((p) => p.key));
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

  const handleSubmit = async () => {
    if (!patientId || !currentStageConfig) return;

    const result = await createResult({
      patient_id: patientId,
      visit_date: visitDate,
      ckd_stage: stage,
      lab_result: values,
    });

    if (result) {
      setValues({});
    }
  };

  if (paramsLoading) {
    return (
      <div className="results-loading">Се вчитува...</div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <h2>Внеси резултати</h2>
        <p>Изберете пациент и стадиум — параметрите се прилагодуваат автоматски.</p>
      </div>

      {paramsError && (
        <div className="results-error">
          Не успеавме да ги вчитаме параметрите ({paramsError}). Проверете
          дали бекендот работи и дали рутата /results/parameters е достапна.
        </div>
      )}

      <div className="results-form">
        <section className="results-section">
          <div className="results-subsection-header">
            <div className="results-section-icon">🧑‍⚕️</div>
            <div>
              <h3 className="results-section-title">Пациент и датум</h3>
              <p className="results-section-subtitle">
                Изберете за кого и кога е направена анализата
              </p>
            </div>
          </div>

          <div className="results-grid">
            <div className="results-field full-width">
              <label>Пациент</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={patientsLoading}
              >
                <option value="">Изберете пациент</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="results-field full-width">
              <label>Датум на анализа</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
          </div>

          <div className="results-divider" />

          <div className="results-subsection-header">
            <div className="results-section-icon">🩺</div>
            <div>
              <h3 className="results-section-title">Тековен KDIGO стадиум</h3>
              <p className="results-section-subtitle">
                Ова ги одредува параметрите подолу
              </p>
            </div>
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

          {currentStageConfig && currentStageConfig.parameters.length > 0 && (
            <>
              <div className="results-divider" />

              <div className="results-subsection-header">
                <div className="results-section-icon">🧪</div>
                <div>
                  <h3 className="results-section-title">Основни параметри</h3>
                  <p className="results-section-subtitle">
                    Внесете ги измерените вредности
                  </p>
                </div>
              </div>

              <div className="results-grid">
                {currentStageConfig.parameters.map((param) => (
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
                      {param.unit} · Референца: {param.reference_mk}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="results-divider" />

          <button
            type="button"
            className="results-submit"
            disabled={!patientId || creating}
            onClick={handleSubmit}
          >
            {creating ? "Се зачувува..." : "Зачувај резултати"}
          </button>
        </section>
      </div>
    </div>
  );
};

export default EnterResults;