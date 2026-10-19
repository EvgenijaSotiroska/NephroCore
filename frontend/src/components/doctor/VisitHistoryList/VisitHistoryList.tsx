import { useState } from "react";
import type { VisitResponse } from "../../../api/types/result.ts";
import { MK_MONTHS_SHORT } from "../../../constants";
import { toDate } from "../../../utils/date.ts";
import "./VisitHistoryList.css";

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

export default function VisitHistoryList({ visits, paramMeta }: VisitHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (visits.length === 0) {
    return <div className="visit-history-empty">Нема евидентирани прегледи.</div>;
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
