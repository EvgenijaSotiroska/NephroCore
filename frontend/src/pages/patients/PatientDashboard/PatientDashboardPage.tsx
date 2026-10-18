import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { formatDayMonth, formatLongDate, formatShortDate, toDate, toDateKey } from "../../../utils/date";
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** Which result dates get a label under the chart: all of them when there are few,
 *  otherwise the first, the last and three evenly picked in between (so labels never overlap). */
function pickAxisTicks(times: number[]): number[] {
  if (times.length <= 5) return times;
  const picks = [0, 0.25, 0.5, 0.75, 1].map((f) => times[Math.round(f * (times.length - 1))]);
  return Array.from(new Set(picks));
}

const dateKeyOf = (time: number) => toDateKey(new Date(time));

// ==================== Charts ====================

interface TrendCellProps {
  param: ParameterTrend;
  color: string;
  onRemove?: () => void; // only charts added from the dropdown can be removed
}

function TrendCell({ param, color, onRemove }: TrendCellProps) {
  const points = param.points;

  // The horizontal axis is real time: the chart starts at the first result date and ends at
  // the last one, and every result sits at its own date.
  const chartData = points.map((p) => ({ time: toDate(p.date).getTime(), value: p.value }));
  const times = Array.from(new Set(chartData.map((d) => d.time))).sort((a, b) => a - b);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  // With a single result there is no span, so give the dot a window around it.
  const timeDomain: [number, number] =
    firstTime === lastTime ? [firstTime - 15 * DAY_MS, firstTime + 15 * DAY_MS] : [firstTime, lastTime];

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
        <div className="trend-top-right">
          {delta !== null && (
            <span className={`trend-delta trend-delta-${tone}`}>
              {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(delta).toFixed(Math.min(param.decimals, 1))}
            </span>
          )}
          {onRemove && (
            <button type="button" className="trend-remove" aria-label="Отстрани го графикот" onClick={onRemove}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="trend-value-row">
        <span className={`trend-value ${param.is_out_of_range ? "trend-value-alert" : ""}`}>
          {param.latest_value?.toFixed(param.decimals) ?? "—"}
        </span>
        <span className="trend-unit">{param.unit}</span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={timeDomain}
            ticks={pickAxisTicks(times)}
            interval="preserveStartEnd"
            minTickGap={10}
            tickFormatter={(time: number) =>
              time === firstTime || time === lastTime
                ? formatShortDate(dateKeyOf(time))
                : formatDayMonth(dateKeyOf(time))
            }
            tick={{ fontSize: 10, fill: "#9aa7b8" }}
            tickMargin={6}
            axisLine={false}
            tickLine={false}
            padding={{ left: 28, right: 28 }}
          />
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
            labelFormatter={(time) => formatLongDate(dateKeyOf(Number(time)))}
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
    </div>
  );
}

// ==================== Visit history ("Резултати" view) ====================

const VISIT_KEY_ORDER = [
  "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
  "phosphate", "calcium", "hemoglobin", "potassium",
  "pth", "bicarbonate", "urea", "albumin",
  "alkaline_phosphatase", "sodium", "ferritin", "tsat",
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
  const { data, loading, error, refetch } = useTrends(patientId);
  const { profile, setActive } = usePatientProfile(patientId);
  const { visits } = useVisits(patientId);
  const { analysis, loading: aiLoading, error: aiError, generate: generateAiAnalysis } = useAiAnalysis(patientId);
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