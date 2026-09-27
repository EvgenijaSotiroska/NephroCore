import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTrends } from "../../../hooks/useTrends";
import { usePatientProfile } from "../../../hooks/usePatientProfile";
import { useVisits } from "../../../hooks/useVisits";
import { useAiAnalysis } from "../../../hooks/useAiAnalysis";
import type { ParameterTrend, CKDStage } from "../../../api/types/trends";
import type { VisitResponse } from "../../../api/types/result";
import "./PatientDashboardPage.css";

const CKD_STAGE_BANDS: Record<CKDStage, { from: number; to: number; color: string }> = {
  G1: { from: 90, to: 130, color: "#e3f7f2" },
  G2: { from: 60, to: 90, color: "#eafaf3" },
  G3A: { from: 45, to: 60, color: "#fff6e0" },
  G3B: { from: 30, to: 45, color: "#fdecd6" },
  G4: { from: 15, to: 30, color: "#fbe1de" },
  G5: { from: 0, to: 15, color: "#f8d4d4" },
};

const ETIOLOGY_LABELS: Record<string, string> = {
  diabetic_nephropathy: "Дијабетична нефропатија",
  hypertensive_nephropathy: "Хипертензивна нефропатија",
  glomerulonephritis: "Гломерулонефритис",
  polycystic_kidney_disease: "Полицистична болест на бубрезите",
  obstructive_uropathy: "Обструктивна уропатија",
  lupus_nephritis: "Лупус нефритис",
  iga_nephropathy: "IgA нефропатија",
  other: "Друго",
  unknown: "Непознато",
};

const STAGE_EGFR_RANGE_LABEL: Record<string, string> = {
  G1: "≥ 90",
  G2: "60–89",
  G3A: "45–59",
  G3B: "30–44",
  G4: "15–29",
  G5: "< 15",
};

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("mk-MK", { month: "short", day: "numeric", year: "2-digit" });
}

function stageTone(stage: string | null | undefined): "good" | "warn" | "alert" {
  if (stage === "G1" || stage === "G2") return "good";
  if (stage === "G3A" || stage === "G3B") return "warn";
  return "alert";
}

function SlopeBadge({ param }: { param: ParameterTrend }) {
  if (param.slope_per_year === null || param.slope_per_year === undefined) return null;
  const slope = param.slope_per_year;
  const improving = param.higher_is_worse ? slope < 0 : slope > 0;
  const flat = Math.abs(slope) < 0.01;
  const tone = flat ? "neutral" : improving ? "good" : "warn";
  const sign = slope > 0 ? "+" : "";
  return (
    <span className={`slope-badge slope-badge-${tone}`}>
      {sign}
      {slope.toFixed(2)} {param.unit}/год.
    </span>
  );
}

interface ParameterChartProps {
  param: ParameterTrend;
}

interface ChartDatum {
  date: string;
  value: number;
  dateLabel: string;
}

function ParameterChart({ param }: ParameterChartProps) {
  const chartData: ChartDatum[] = param.points.map((p) => ({
    date: p.date,
    value: p.value,
    dateLabel: formatDate(p.date),
  }));

  const isEgfr = param.key === "egfr";
  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.15 || dataMax * 0.1 || 1;

  return (
    <div className={`param-card ${param.is_out_of_range ? "param-card-alert" : ""}`}>
      <div className="param-card-header">
        <div>
          <h4>{param.label}</h4>
          <span className="param-unit">{param.unit}</span>
        </div>
        <div className="param-card-header-right">
          <SlopeBadge param={param} />
          <span className={`latest-value ${param.is_out_of_range ? "latest-value-alert" : ""}`}>
            {param.latest_value?.toFixed(param.decimals)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#edf1f5" />

          {isEgfr &&
            (Object.entries(CKD_STAGE_BANDS) as [CKDStage, typeof CKD_STAGE_BANDS[CKDStage]][]).map(
              ([stage, band]) => (
                <ReferenceArea
                  key={stage}
                  y1={band.from}
                  y2={band.to}
                  fill={band.color}
                  fillOpacity={0.6}
                  ifOverflow="hidden"
                />
              )
            )}

          {!isEgfr && param.normal_range_low !== null && param.normal_range_high !== null && (
            <ReferenceArea
              y1={param.normal_range_low}
              y2={param.normal_range_high}
              fill="#d9f7f6"
              fillOpacity={0.5}
              ifOverflow="hidden"
            />
          )}

          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#8a9ab0" }}
            axisLine={{ stroke: "#dce4ee" }}
            tickLine={false}
          />
          <YAxis
            scale={param.scale === "log" ? "log" : "linear"}
            domain={[Math.max(0, dataMin - padding), dataMax + padding]}
            tick={{ fontSize: 11, fill: "#8a9ab0" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #dce4ee", fontSize: 13 }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return [`${num.toFixed(param.decimals)} ${param.unit}`, param.label] as [
                string,
                string
              ];
            }}
            labelFormatter={(label) => (label ?? "") as React.ReactNode}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#08aaa5"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#08aaa5" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== Visit history ("Резултати" tab) ====================

const VISIT_KEY_ORDER = [
  "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
  "phosphate", "calcium", "hemoglobin", "potassium",
  "pth", "bicarbonate", "urea", "albumin",
];

function formatVisitDateParts(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

interface VisitHistoryListProps {
  visits: VisitResponse[];
  paramMeta: Record<string, { label: string; unit: string; normalLow: number | null; normalHigh: number | null; decimals: number }>;
}

function VisitHistoryList({ visits, paramMeta }: VisitHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (visits.length === 0) {
    return <div className="dashboard-empty">Нема евидентирани прегледи.</div>;
  }

  return (
    <div className="visit-history">
      <div className="visit-history-header">
        <span>{visits.length} прегледи зачувани</span>
      </div>

      {visits.map((visit, index) => {
        const older = visits[index + 1];
        const egfr = visit.lab_result?.egfr as number | undefined;
        const olderEgfr = older?.lab_result?.egfr as number | undefined;
        const egfrDelta =
          egfr !== undefined && egfr !== null && olderEgfr !== undefined && olderEgfr !== null
            ? egfr - olderEgfr
            : null;

        const { month, day, year } = formatVisitDateParts(visit.visit_date);
        const isExpanded = expandedId === visit.id;

        const creatinine = visit.lab_result?.creatinine as number | undefined;

        return (
          <div key={visit.id} className="visit-card">
            <button
              type="button"
              className="visit-card-summary"
              onClick={() => setExpandedId(isExpanded ? null : visit.id)}
            >
              <div className="visit-date-block">
                <span className="visit-date-month">{month}</span>
                <span className="visit-date-day">{day}</span>
                <span className="visit-date-year">{year}</span>
              </div>

              <div className="visit-summary-text">
                <div className="visit-summary-line">
                  eGFR {egfr ?? "—"}
                  {creatinine !== undefined && creatinine !== null && (
                    <> · {paramMeta.creatinine?.label ?? "Креатинин"} {creatinine} {paramMeta.creatinine?.unit}</>
                  )}
                </div>
                {visit.notes && <div className="visit-notes-preview">{visit.notes}</div>}
              </div>

              <div className="visit-summary-right">
                {egfrDelta !== null && (
                  <span className={`visit-delta-badge ${egfrDelta < 0 ? "visit-delta-down" : "visit-delta-up"}`}>
                    {Math.abs(egfrDelta).toFixed(0)} {egfrDelta < 0 ? "↓" : "↑"}
                  </span>
                )}
                <span className="visit-expand-arrow">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </button>

            {isExpanded && visit.lab_result && (
              <div className="visit-detail-grid">
                {VISIT_KEY_ORDER.map((key) => {
                  const value = visit.lab_result?.[key] as number | null | undefined;
                  if (value === null || value === undefined) return null;
                  const meta = paramMeta[key];
                  const outOfRange =
                    meta?.normalLow !== null &&
                    meta?.normalHigh !== null &&
                    meta &&
                    (value < meta.normalLow! || value > meta.normalHigh!);
                  return (
                    <div key={key} className={`visit-detail-tile ${outOfRange ? "visit-detail-tile-alert" : ""}`}>
                      <span className="visit-detail-label">{meta?.label ?? key}</span>
                      <span className="visit-detail-value">{value}</span>
                      <span className="visit-detail-unit">{meta?.unit ?? ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== Main page ====================

export default function PatientDashboardPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data, groupedParameters, isLoading, error, refetch } = useTrends(patientId);
  const { profile } = usePatientProfile(patientId);
  const { visits } = useVisits(patientId);
  const { analysis, loading: aiLoading, error: aiError, generate: generateAiAnalysis } = useAiAnalysis(patientId);
  const [activeTab, setActiveTab] = useState<"overview" | "results">("overview");

  if (isLoading) {
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

  const hasAnyData = data !== null && data.parameters.length > 0;
  const age = profile ? calculateAge(profile.date_of_birth) : null;

  const findParam = (key: string) => data?.parameters.find((p) => p.key === key);
  const egfrParam = findParam("egfr");
  const creatinineParam = findParam("creatinine");
  const hemoglobinParam = findParam("hemoglobin");
  const bpSystolicParam = findParam("bp_systolic");
  const bpDiastolicParam = findParam("bp_diastolic");
  const bpOutOfRange = bpSystolicParam?.is_out_of_range || bpDiastolicParam?.is_out_of_range;

  const paramMeta = Object.fromEntries(
    (data?.parameters ?? []).map((p) => [
      p.key,
      { label: p.label, unit: p.unit, normalLow: p.normal_range_low, normalHigh: p.normal_range_high, decimals: p.decimals },
    ])
  );

  return (
    <div className="dashboard-page">
      {profile && (
        <div className="patient-header-card">
          <div className="patient-header-left">
            <div className="patient-avatar">👤</div>
            <div>
              <h2 className="patient-header-name">{profile.full_name}</h2>
              <p className="patient-header-subline">
                {age !== null ? `${age} год.` : "—"} · {profile.sex === "male" ? "Машки" : "Женски"}
                {profile.ckd_etiology && <> · {ETIOLOGY_LABELS[profile.ckd_etiology]}</>}
              </p>
            </div>
          </div>

          {data?.current_ckd_stage && (
            <div className={`stage-pill-block stage-pill-${stageTone(data.current_ckd_stage)}`}>
              <span className="stage-pill-code">{data.current_ckd_stage}</span>
              <span className="stage-pill-range">eGFR {STAGE_EGFR_RANGE_LABEL[data.current_ckd_stage] ?? ""}</span>
            </div>
          )}
        </div>
      )}

      {hasAnyData && (
        <div className="quick-stats-row">
          <div className="quick-stat-tile">
            <span className="quick-stat-label">EGFR</span>
            <span className={`quick-stat-value ${egfrParam?.is_out_of_range ? "quick-stat-value-alert" : ""}`}>
              {egfrParam?.latest_value?.toFixed(egfrParam?.decimals) ?? "—"}
            </span>
            <span className="quick-stat-unit">{egfrParam?.unit ?? "mL/min/1.73m²"}</span>
          </div>
          <div className="quick-stat-tile">
            <span className="quick-stat-label">Креатинин</span>
            <span className={`quick-stat-value ${creatinineParam?.is_out_of_range ? "quick-stat-value-alert" : ""}`}>
              {creatinineParam?.latest_value?.toFixed(creatinineParam?.decimals) ?? "—"}
            </span>
            <span className="quick-stat-unit">{creatinineParam?.unit ?? "µmol/L"}</span>
          </div>
          <div className="quick-stat-tile">
            <span className="quick-stat-label">Хемоглобин</span>
            <span className={`quick-stat-value ${hemoglobinParam?.is_out_of_range ? "quick-stat-value-alert" : ""}`}>
              {hemoglobinParam?.latest_value?.toFixed(hemoglobinParam?.decimals) ?? "—"}
            </span>
            <span className="quick-stat-unit">{hemoglobinParam?.unit ?? "g/L"}</span>
          </div>
          <div className="quick-stat-tile">
            <span className="quick-stat-label">Притисок</span>
            <span className={`quick-stat-value ${bpOutOfRange ? "quick-stat-value-alert" : ""}`}>
              {bpSystolicParam?.latest_value?.toFixed(0) ?? "—"}/{bpDiastolicParam?.latest_value?.toFixed(0) ?? "—"}
            </span>
            <span className="quick-stat-unit">mmHg</span>
          </div>
        </div>
      )}

      {hasAnyData && (
        <div className="ai-analysis-section">
          <button
            type="button"
            className="ai-analysis-button"
            onClick={generateAiAnalysis}
            disabled={aiLoading}
          >
            {aiLoading ? "Се генерира..." : "🤖 Генерирај AI анализа"}
          </button>
          {aiError && <p className="ai-analysis-error">{aiError}</p>}
          {analysis && (
            <div className="ai-analysis-box">
              <div className="ai-analysis-box-header">🤖 Claude AI анализа</div>
              <p className="ai-analysis-text">{analysis}</p>
            </div>
          )}
        </div>
      )}

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-button ${activeTab === "overview" ? "tab-button-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Преглед
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "results" ? "tab-button-active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Резултати
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {!hasAnyData && (
            <div className="dashboard-empty">
              Сè уште нема евидентирани лабораториски резултати. Графиците ќе се прикажат откако ќе се внесат прегледи.
            </div>
          )}

          {Object.entries(groupedParameters).map(([category, params]) => (
            <section key={category} className="param-category-section">
              <h3 className="param-category-title">{category}</h3>
              <div className="param-grid">
                {params.map((param) => (
                  <ParameterChart key={param.key} param={param} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {activeTab === "results" && <VisitHistoryList visits={visits} paramMeta={paramMeta} />}
    </div>
  );
}