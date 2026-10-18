import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTrends } from "../../../hooks/useTrends";
import { usePatientProfile } from "../../../hooks/usePatientProfile";
import { useVisits } from "../../../hooks/useVisits";
import { useAiAnalysis } from "../../../hooks/useAi.ts";
import PatientSidebar from "../../../components/doctor/PatientSidebar/PatientSidebar";
import type { ParameterTrend } from "../../../api/types/trends";
import type { VisitResponse } from "../../../api/types/result";
import { COMORBIDITIES, ETIOLOGY_LABELS, MK_MONTHS_SHORT } from "../../../constants";
import { formatLongDate, toDate } from "../../../utils/date";
import { calculateAge, formatCodedList, getInitials } from "../../../utils/patient";
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

function formatMonthYear(dateStr: string): string {
  const d = toDate(dateStr);
  return `${MK_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
}

// ==================== Charts ====================

function TrendCell({ param, color }: { param: ParameterTrend; color: string }) {
  const points = param.points;
  const chartData = points.map((p) => ({
    value: p.value,
    dateLabel: formatMonthYear(p.date),
  }));

  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const padding = (dataMax - dataMin) * 0.25 || dataMax * 0.1 || 1;

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last && prev ? last.value - prev.value : null;

  let tone: "good" | "warn" | "bad" | "flat" = "flat";
  if (delta !== null && Math.abs(delta) > 1e-9) {
    const improving = param.higher_is_worse ? delta < 0 : delta > 0;
    tone = improving ? "good" : param.is_out_of_range ? "bad" : "warn";
  }

  const gradientId = `grad-${param.key}`;

  return (
    <div className="trend-cell">
      <div className="trend-top">
        <span className="trend-label">{param.label}</span>
        {delta !== null && (
          <span className={`trend-delta trend-delta-${tone}`}>
            {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(delta).toFixed(Math.min(param.decimals, 1))}
          </span>
        )}
      </div>

      <div className="trend-value-row">
        <span className={`trend-value ${param.is_out_of_range ? "trend-value-alert" : ""}`}>
          {param.latest_value?.toFixed(param.decimals) ?? "—"}
        </span>
        <span className="trend-unit">{param.unit}</span>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={chartData} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="dateLabel" hide />
          <YAxis
            hide
            scale={param.scale === "log" ? "log" : "linear"}
            domain={[Math.max(0, dataMin - padding), dataMax + padding]}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e5eaf0", fontSize: 13 }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return [`${num.toFixed(param.decimals)} ${param.unit}`, param.label] as [
                string,
                string
              ];
            }}
            labelFormatter={(label) => (label ?? "") as React.ReactNode}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: "#fff", stroke: color, strokeWidth: 1.8 }}
            activeDot={{ r: 5, fill: "#fff", stroke: color, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="trend-axis">
        <span>{chartData[0]?.dateLabel}</span>
        <span>{chartData[chartData.length - 1]?.dateLabel}</span>
      </div>
    </div>
  );
}

// ==================== Visit history ("Резултати" view) ====================

const VISIT_KEY_ORDER = [
  "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
  "phosphate", "calcium", "hemoglobin", "potassium",
  "pth", "bicarbonate", "urea", "albumin",
];

function formatVisitDateParts(dateStr: string) {
  const d = toDate(dateStr);
  return {
    month: MK_MONTHS_SHORT[d.getMonth()].toUpperCase(),
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
  const { data, groupedParameters, loading, error, refetch } = useTrends(patientId);
  const { profile, setActive } = usePatientProfile(patientId);
  const { visits } = useVisits(patientId);
  const { analysis, loading: aiLoading, error: aiError, generate: generateAiAnalysis } = useAiAnalysis(patientId);
  const [view, setView] = useState<"charts" | "results">("charts");

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

  const allParams = Object.values(groupedParameters).flat();
  const outOfRange = parameters.filter((p) => p.is_out_of_range);
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
            <button
              type="button"
              className="pd-status-button"
              onClick={() => void setActive(!profile.is_active)}
            >
              {profile.is_active ? "Означи како неактивен" : "Означи како активен"}
            </button>
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

              {!hasAnyData ? (
                <div className="dashboard-empty">
                  Сè уште нема евидентирани лабораториски резултати. Графиците ќе се прикажат откако ќе се внесат прегледи.
                </div>
              ) : (
                <div className="trend-grid">
                  {allParams.map((param, index) => (
                    <TrendCell
                      key={param.key}
                      param={param}
                      color={CHART_COLORS[param.key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
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
            </>
          )}

          {view === "results" && <VisitHistoryList visits={visits} paramMeta={paramMeta} />}
        </main>

        {/* ---------- Sidebar ---------- */}
        <PatientSidebar
          patientId={patientId}
          lastVisitDate={lastVisitDate}
          isActive={profile?.is_active ?? true}
        />
      </div>
    </div>
  );
}