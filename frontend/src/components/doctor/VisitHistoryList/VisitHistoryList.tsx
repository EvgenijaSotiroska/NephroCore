import { useState } from "react";
import type { LabResultPayload, UpdateVisitRequest, VisitResponse } from "../../../api/types/result.ts";
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

// Fewest lab values a result must keep (the backend enforces the same).
const MIN_RESULT_VALUES = 3;

interface VisitHistoryListProps {
  visits: VisitResponse[];
  paramMeta: Record<string, { label: string; unit: string; normalLow: number | null; normalHigh: number | null; decimals: number }>;
  // Both resolve to true when the change was saved.
  onUpdate: (visitId: string, payload: UpdateVisitRequest) => Promise<boolean>;
  onDelete: (visitId: string) => Promise<boolean>;
}

interface Draft {
  visitDate: string;
  values: Record<string, string>; // "" = empty
}

export default function VisitHistoryList({ visits, paramMeta, onUpdate, onDelete }: VisitHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (visit: VisitResponse) => {
    const keys = new Set([...VISIT_KEY_ORDER, ...Object.keys(paramMeta)]);
    const values: Record<string, string> = {};
    keys.forEach((key) => {
      const value = visit.lab_result?.[key];
      values[key] = value === null || value === undefined ? "" : String(value);
    });
    setDraft({ visitDate: visit.visit_date.slice(0, 10), values });
    setEditingId(visit.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const filledCount = draft
    ? Object.values(draft.values).filter((v) => v.trim() !== "" && !Number.isNaN(Number(v))).length
    : 0;

  const saveEdit = async (visitId: string) => {
    if (!draft || filledCount < MIN_RESULT_VALUES || !draft.visitDate) return;

    const labResult: LabResultPayload = {};
    Object.entries(draft.values).forEach(([key, raw]) => {
      labResult[key] = raw.trim() === "" ? null : Number(raw);
    });

    setBusy(true);
    const ok = await onUpdate(visitId, {
      visit_date: draft.visitDate,
      lab_result: labResult,
    });
    setBusy(false);
    if (ok) cancelEdit();
  };

  const handleDelete = async (visit: VisitResponse) => {
    if (!window.confirm("Дали сте сигурни дека сакате да ги избришете овие резултати?")) return;
    setBusy(true);
    const ok = await onDelete(visit.id);
    setBusy(false);
    if (ok && editingId === visit.id) cancelEdit();
  };

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

            {isExpanded && (
              <div className="visit-actions">
                {editingId !== visit.id && (
                  <button type="button" className="visit-action-button" disabled={busy} onClick={() => startEdit(visit)}>
                    Измени
                  </button>
                )}
                <button
                  type="button"
                  className="visit-action-button visit-action-danger"
                  disabled={busy}
                  onClick={() => void handleDelete(visit)}
                >
                  Избриши
                </button>
              </div>
            )}

            {isExpanded && editingId === visit.id && draft && (
              <div className="visit-edit">
                <div className="visit-edit-row">
                  <label className="visit-edit-field">
                    <span>Датум на анализа</span>
                    <input
                      type="date"
                      value={draft.visitDate}
                      onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })}
                    />
                  </label>
                </div>

                <div className="visit-edit-grid">
                  {Object.keys(draft.values).map((key) => (
                    <label key={key} className="visit-edit-field">
                      <span>
                        {paramMeta[key]?.label ?? key}
                        {paramMeta[key]?.unit && ` (${paramMeta[key].unit})`}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={draft.values[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, values: { ...draft.values, [key]: e.target.value } })
                        }
                      />
                    </label>
                  ))}
                </div>

                {filledCount < MIN_RESULT_VALUES && (
                  <p className="visit-edit-hint">
                    Мора да останат најмалку {MIN_RESULT_VALUES} вредности (внесени: {filledCount}).
                  </p>
                )}

                <div className="visit-actions">
                  <button type="button" className="visit-action-button" disabled={busy} onClick={cancelEdit}>
                    Откажи
                  </button>
                  <button
                    type="button"
                    className="visit-action-button visit-action-primary"
                    disabled={busy || filledCount < MIN_RESULT_VALUES || !draft.visitDate}
                    onClick={() => void saveEdit(visit.id)}
                  >
                    {busy ? "Се зачувува..." : "Зачувај"}
                  </button>
                </div>
              </div>
            )}

            {isExpanded && editingId !== visit.id && visit.lab_result && (
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
