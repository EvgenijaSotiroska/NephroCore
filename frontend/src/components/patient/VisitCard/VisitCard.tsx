import {useState} from "react";
import type {ParameterTrend} from "../../../api/types/trends";
import type {VisitResponse} from "../../../api/types/result";
import {formatLongDate} from "../../../utils/date";
import {getStatus, stageTone} from "../../../utils/patient";
import ResultTile from "../ResultTile/ResultTile";
import "./VisitCard.css";

function getValue(visit: VisitResponse, key: string): number | null {
    const v = visit.lab_result?.[key] as number | null | undefined;
    return v === null || v === undefined ? null : v;
}

interface VisitCardProps {
    visit: VisitResponse;
    previous: VisitResponse | null;
    parameters: ParameterTrend[];
    isLatest: boolean;
}

export default function VisitCard({visit, previous, parameters, isLatest}: VisitCardProps) {
    const [open, setOpen] = useState(isLatest);

    const categories = Array.from(new Set(parameters.map((p) => p.category)));
    const sections = categories
        .map((category) => ({
            category,
            items: parameters
                .filter((p) => p.category === category)
                .flatMap((param) => {
                    const value = getValue(visit, param.key);
                    if (value === null) return [];
                    return [{param, value, previous: previous ? getValue(previous, param.key) : null}];
                }),
        }))
        .filter((s) => s.items.length > 0);

    const allItems = sections.flatMap((s) => s.items);
    const flaggedCount = allItems.filter((i) => {
        const s = getStatus(i.value, i.param);
        return s === "low" || s === "high";
    }).length;

    const summary =
        allItems.length === 0
            ? "Нема внесени вредности"
            : flaggedCount === 0
                ? "Сите вредности се во референтниот опсег"
                : `${flaggedCount} ${flaggedCount === 1 ? "вредност е" : "вредности се"} надвор од референтниот опсег`;

    return (
        <li className={`ph-visit ${isLatest ? "ph-visit-latest" : ""}`}>
            <span className="ph-visit-dot" aria-hidden="true"/>

            <div className="ph-visit-card">
                <button
                    type="button"
                    className="ph-visit-header"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    <div className="ph-visit-heading">
            <span className="ph-visit-date">
              {formatLongDate(visit.visit_date)}
                {isLatest && <span className="ph-latest-tag">Последен преглед</span>}
            </span>
                        <span className={`ph-visit-summary ${flaggedCount > 0 ? "ph-visit-summary-flagged" : ""}`}>
              {summary}
            </span>
                    </div>

                    <div className="ph-visit-header-right">
                        <span className={`ph-visit-stage ph-visit-stage-${stageTone(visit.ckd_stage)}`}>{visit.ckd_stage}</span>
                        <span className={`ph-chevron ${open ? "ph-chevron-open" : ""}`} aria-hidden="true">
              ▾
            </span>
                    </div>
                </button>

                {open && (
                    <div className="ph-visit-body">
                        {visit.notes && (
                            <blockquote className="ph-notes">
                                <span className="ph-notes-label">Белешка од лекарот</span>
                                {visit.notes}
                            </blockquote>
                        )}

                        {sections.map((section) => (
                            <section key={section.category} className="ph-section">
                                <h4 className="ph-section-title">{section.category}</h4>
                                <div className="ph-tile-grid">
                                    {section.items.map((item) => (
                                        <ResultTile
                                            key={item.param.key}
                                            param={item.param}
                                            value={item.value}
                                            previous={item.previous}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {previous && allItems.length > 0 && (
                            <p className="ph-compare-hint">
                                Промените се во однос на прегледот од {formatLongDate(previous.visit_date)}.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}
